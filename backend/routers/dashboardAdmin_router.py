from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlmodel import select, func, extract
from datetime import datetime, timedelta
from ..auth.auth import adminActual
from ..models.pedido import Pedido, EstadoPedido
from ..models.detallePedido import DetallePedido
from ..models.producto import Producto
from ..models.cliente import Cliente
from ..db.db import SessionDep
from typing import List, Dict, Any
from sqlalchemy import and_

router = APIRouter(tags=["Dashboard"])

# Configurar templates
templates = Jinja2Templates(directory="frontend/templates")

# READ - Panel dashboard de administrador
@router.get("/dashboard")
def paginaDashboard(request: Request, session: SessionDep):
    """Endpoint principal del dashboard que renderiza la página completa"""

    # Si no ha iniciado sesión el admin, se lo pide
    if not request.session.get("administradorID"):
        return RedirectResponse(url="/ingresar", status_code=303)
    
    try:
        # Obtener datos básicos para el dashboard
        ahora = datetime.now()
        mesActual = ahora.month
        anioActual = ahora.year
        
        # Ventas del mes actual
        inicioMesActual = datetime(anioActual, mesActual, 1)
        if mesActual == 12:
            finMesActual = datetime(anioActual + 1, 1, 1)
        else:
            finMesActual = datetime(anioActual, mesActual + 1, 1)
        
        # Obtener el valor de las ventas en el mes
        ventasMesActual = session.exec(
            select(func.coalesce(func.sum(Pedido.total), 0)).where(
                and_(
                    Pedido.fecha >= inicioMesActual,
                    Pedido.fecha < finMesActual,
                    Pedido.estado != EstadoPedido.CANCELADO
                )
            )
        ).first() or 0

        # Clientes activos
        clientesActivos = session.exec(
            select(func.count(Cliente.id)).where(Cliente.activo == True)
        ).first() or 0

        # Pedidos recientes (últimos 7 días)
        fechaLimite = datetime.now() - timedelta(days=7)
        pedidosRecientesCount = session.exec(
            select(func.count(Pedido.id)).where(
                Pedido.fecha >= fechaLimite,
                Pedido.estado != EstadoPedido.CANCELADO
            )
        ).first() or 0

        # Calcular producto más vendido
        productoMasVendidoResult = session.exec(
            select(Producto.nombre)
            .select_from(DetallePedido)
            .join(Producto, DetallePedido.productoID == Producto.id)
            .join(Pedido, DetallePedido.pedidoID == Pedido.id)
            .where(Pedido.estado != EstadoPedido.CANCELADO)
            .group_by(Producto.id, Producto.nombre)
            .order_by(func.sum(DetallePedido.cantidad).desc())
            .limit(1)
        ).first()
        
        # Producto más vendido
        productoMasVendido = productoMasVendidoResult if productoMasVendidoResult else "No hay ventas"

        # Pedidos recientes para la tabla (últimos 4 pedidos)
        pedidosRecientes = session.exec(
            select(Pedido)
            .where(Pedido.estado != EstadoPedido.CANCELADO)
            .order_by(Pedido.fecha.desc())
            .limit(4)
        ).all()

        # Para cada pedido, obtener el nombre del cliente
        pedidosConClientes = []
        for pedido in pedidosRecientes:
            cliente = session.get(Cliente, pedido.clienteID)
            pedidosConClientes.append({
                "id": pedido.id,
                "clienteNombre": cliente.nombre if cliente else "Cliente no encontrado",
                "fecha": pedido.fecha.strftime('%Y-%m-%d') if pedido.fecha else 'N/A',
                "estado": pedido.estado.value if pedido.estado else 'PENDIENTE',
                "total": pedido.total if pedido.total else 0
            })

        # Productos más vendidos para la tabla
        productosMasVendidosResult = session.exec(
            select(
                Producto.nombre,
                func.sum(DetallePedido.cantidad).label('totalVendido'),
                func.sum(DetallePedido.subtotal).label('ingresosTotales')
            )
            .select_from(DetallePedido)
            .join(Producto, DetallePedido.productoID == Producto.id)
            .join(Pedido, DetallePedido.pedidoID == Pedido.id)
            .where(Pedido.estado != EstadoPedido.CANCELADO)
            .group_by(Producto.id, Producto.nombre)
            .order_by(func.sum(DetallePedido.cantidad).desc())
            .limit(3)
        ).all()

        # Lista de los productos más vendidos
        productosMasVendidos = []
        for producto in productosMasVendidosResult:
            productosMasVendidos.append({
                "nombre": producto.nombre,
                "totalVendido": int(producto.totalVendido) if producto.totalVendido else 0,
                "ingresosTotales": producto.ingresosTotales if producto.ingresosTotales else 0
            })

        # Obtener datos para la gráfica de ventas mensuales
        datosGrafica = obtenerDatosVentasMensuales(session)

        # Envío de la información al frontend
        return templates.TemplateResponse("admin/dashboardAdmin.html", {
            "request": request,
            "ventasTotales": ventasMesActual,
            "clientesActivos": clientesActivos,
            "pedidosRecientesCount": pedidosRecientesCount,
            "productoMasVendido": productoMasVendido,
            "pedidosRecientes": pedidosConClientes,
            "productosMasVendidos": productosMasVendidos,
            "datosGrafica": datosGrafica
        })

    # En caso de que haya error cargando el dashboard    
    except Exception as e:
        print(f"Error cargando dashboard: {e}")
        # En caso de error, devolver valores por defecto
        return templates.TemplateResponse("admin/dashboardAdmin.html", {
            "request": request,
            "ventasTotales": 0,
            "clientesActivos": 0,
            "pedidosRecientesCount": 0,
            "productoMasVendido": "No hay datos",
            "pedidosRecientes": [],
            "productosMasVendidos": [],
            "datosGrafica": {"meses": [], "ventas": []}
        })

# Función para obtener las ventas mensuales
def obtenerDatosVentasMensuales(session: SessionDep):
    """Función auxiliar para obtener datos de ventas mensuales para la gráfica"""
    try:
        # Obtener ventas de los últimos 6 meses
        fechaInicio = datetime.now() - timedelta(days=180)
        
        # Total de pedidos en un mes específico (actual)
        resultados = session.exec(
            select(
                extract('month', Pedido.fecha).label('mes'),
                extract('year', Pedido.fecha).label('ano'),
                func.coalesce(func.sum(Pedido.total), 0).label('total')
            ).where(
                and_(
                    Pedido.fecha >= fechaInicio,
                    Pedido.estado != EstadoPedido.CANCELADO
                )
            ).group_by('ano', 'mes').order_by('ano', 'mes')
        ).all()

        # Mapear meses a nombres
        mesesNombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", 
                        "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
        
        # Inicializar todos los meses con 0
        datosMensuales = [0.0] * 12
        
        # 
        for resultado in resultados:
            mesIndex = int(resultado.mes) - 1
            datosMensuales[mesIndex] = resultado.total

        return {
            "meses": mesesNombres,
            "ventas": datosMensuales
        }
    except Exception as e:
        print(f"Error obteniendo datos de gráfica: {e}")
        return {"meses": ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
                "ventas": [0.0] * 12}

# Endpoints API para actualizaciones en tiempo real
@router.get("/api/dashboard/resumen", response_model=Dict[str, Any])
def obtenerResumenDashboard(session: SessionDep, _=Depends(adminActual)):
    try:
        # Fecha actual
        ahora = datetime.now()
        mesActual = ahora.month
        anioActual = ahora.year
        
        # Ventas del mes actual
        inicioMesActual = datetime(anioActual, mesActual, 1)
        if mesActual == 12:
            finMesActual = datetime(anioActual + 1, 1, 1)
        else:
            finMesActual = datetime(anioActual, mesActual + 1, 1)
        
        ventasMesActual = session.exec(
            select(func.coalesce(func.sum(Pedido.total), 0)).where(
                and_(
                    Pedido.fecha >= inicioMesActual,
                    Pedido.fecha < finMesActual,
                    Pedido.estado != EstadoPedido.CANCELADO
                )
            )
        ).first() or 0

        # Ventas del mes anterior para calcular el porcentaje
        if mesActual == 1:
            mesAnterior = 12
            anioAnterior = anioActual - 1
        else:
            mesAnterior = mesActual - 1
            anioAnterior = anioActual
        
        inicioMesAnterior = datetime(anioAnterior, mesAnterior, 1)
        if mesAnterior == 12:
            finMesAnterior = datetime(anioAnterior + 1, 1, 1)
        else:
            finMesAnterior = datetime(anioAnterior, mesAnterior + 1, 1)
        
        ventasMesAnterior = session.exec(
            select(func.coalesce(func.sum(Pedido.total), 0)).where(
                and_(
                    Pedido.fecha >= inicioMesAnterior,
                    Pedido.fecha < finMesAnterior,
                    Pedido.estado != EstadoPedido.CANCELADO
                )
            )
        ).first() or 0

        # Cálculo de porcentaje
        if ventasMesAnterior > 0:
            porcentajeCambio = ((ventasMesActual - ventasMesAnterior) / ventasMesAnterior) * 100
        else:
            porcentajeCambio = 100 if ventasMesActual > 0 else 0

        # Total de pedidos recientes (últimos 7 días)
        fechaLimite = datetime.now() - timedelta(days=7)
        pedidosRecientesCount = session.exec(
            select(func.count(Pedido.id)).where(
                Pedido.fecha >= fechaLimite,
                Pedido.estado != EstadoPedido.CANCELADO
            )
        ).first() or 0

        # Clientes activos
        clientesActivos = session.exec(
            select(func.count(Cliente.id)).where(Cliente.activo == True)
        ).first() or 0

        # Producto más vendido (para la tarjeta)
        productoMasVendido = session.exec(
            select(Producto.nombre)
            .select_from(DetallePedido)
            .join(Producto, DetallePedido.productoID == Producto.id)
            .join(Pedido, DetallePedido.pedidoID == Pedido.id)
            .where(Pedido.estado != EstadoPedido.CANCELADO)
            .group_by(Producto.id, Producto.nombre)
            .order_by(func.sum(DetallePedido.cantidad).desc())
            .limit(1)
        ).first()

        return {
            "ventasTotales": ventasMesActual,
            "porcentajeCambio": round(porcentajeCambio, 2),
            "pedidosRecientes": pedidosRecientesCount,
            "clientesActivos": clientesActivos,
            "productoMasVendido": productoMasVendido or "No hay ventas"
        }
    except Exception as e:
        raise HTTPException(500, f"Error al obtener resumen: {str(e)}")

@router.get("/api/dashboard/ventas-mensuales", response_model=Dict[str, Any])
def obtenerVentasMensuales(session: SessionDep, _=Depends(adminActual)):
    return obtenerDatosVentasMensuales(session)

@router.get("/api/dashboard/pedidos-recientes", response_model=List[Dict[str, Any]])
def obtenerPedidosRecientes(session: SessionDep, _=Depends(adminActual)):
    try:
        pedidos = session.exec(
            select(Pedido)
            .where(Pedido.estado != EstadoPedido.CANCELADO)
            .order_by(Pedido.fecha.desc())
            .limit(5)
        ).all()

        resultado = []
        for pedido in pedidos:
            cliente = session.get(Cliente, pedido.clienteID)
            resultado.append({
                "id": pedido.id,
                "cliente": cliente.nombre if cliente else "Cliente eliminado",
                "fecha": pedido.fecha.strftime("%Y-%m-%d"),
                "estado": pedido.estado.value,
                "total": pedido.total
            })

        return resultado
    except Exception as e:
        raise HTTPException(500, f"Error al obtener pedidos recientes: {str(e)}")

@router.get("/api/dashboard/productos-mas-vendidos", response_model=List[Dict[str, Any]])
def obtenerProductosMasVendidos(session: SessionDep, _=Depends(adminActual)):
    try:
        resultados = session.exec(
            select(
                Producto.nombre,
                func.coalesce(func.sum(DetallePedido.cantidad), 0).label('totalVendido'),
                func.coalesce(func.sum(DetallePedido.subtotal), 0).label('ingresosTotales')
            )
            .select_from(DetallePedido)
            .join(Producto, DetallePedido.productoID == Producto.id)
            .join(Pedido, DetallePedido.pedidoID == Pedido.id)
            .where(Pedido.estado != EstadoPedido.CANCELADO)
            .group_by(Producto.id, Producto.nombre)
            .order_by(func.coalesce(func.sum(DetallePedido.cantidad), 0).desc())
            .limit(5)
        ).all()

        resultado = []
        for res in resultados:
            resultado.append({
                "nombre": res.nombre,
                "ventas": int(res.totalVendido),
                "ingresos": res.ingresosTotales
            })

        return resultado
    except Exception as e:
        raise HTTPException(500, f"Error al obtener productos más vendidos: {str(e)}")