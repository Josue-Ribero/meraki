from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlmodel import select
from datetime import datetime, timedelta
from ..auth.auth import adminActual
from ..models.pedido import Pedido, EstadoPedido
from ..models.detallePedido import DetallePedido
from ..models.producto import Producto
from ..models.cliente import Cliente
from ..db.db import SessionDep

router = APIRouter(tags=["Dashboard"])

# Configurar templates
templates = Jinja2Templates(directory="frontend/templates")

# READ - Panel dashboard de administrador
@router.get("/dashboard")
def paginaDashboard(request: Request, session: SessionDep):
    """
    Endpoint principal del dashboard que renderiza la página completa
    """

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
        
        # Obtener pedidos del mes actual
        pedidosMesActual = session.exec(
            select(Pedido).where(
                Pedido.fecha >= inicioMesActual,
                Pedido.fecha < finMesActual,
                Pedido.estado != EstadoPedido.CANCELADO
            )
        ).all()
        
        ventasMesActual = sum(pedido.total for pedido in pedidosMesActual)

        # Clientes activos
        clientesActivos = session.exec(select(Cliente).where(Cliente.activo == True)).all()
        totalClientesActivos = len(clientesActivos)

        # Pedidos recientes (últimos 7 días)
        fechaLimite = datetime.now() - timedelta(days=7)
        pedidosRecientes = session.exec(select(Pedido).where(Pedido.fecha >= fechaLimite, Pedido.estado != EstadoPedido.CANCELADO)).all()
        totalPedidosRecientes = len(pedidosRecientes)

        # Producto más vendido
        todosDetalles = session.exec(select(DetallePedido)).all()
        ventasPorProducto = {}
        
        for detalle in todosDetalles:
            pedido = session.get(Pedido, detalle.pedidoID)
            if pedido and pedido.estado != EstadoPedido.CANCELADO:
                if detalle.productoID not in ventasPorProducto:
                    ventasPorProducto[detalle.productoID] = 0
                ventasPorProducto[detalle.productoID] += detalle.cantidad
        
        if ventasPorProducto:
            productoIdMasVendido = max(ventasPorProducto, key=ventasPorProducto.get)
            productoMasVendidoObj = session.get(Producto, productoIdMasVendido)
            productoMasVendido = productoMasVendidoObj.nombre if productoMasVendidoObj else "No hay ventas"
        else:
            productoMasVendido = "No hay ventas"

        # Función auxiliar para formatear precios
        def formatear_precio(valor):
            if valor is None:
                return "0"
            # Convertir a entero, luego a string y reemplazar comas por puntos (formato miles)
            return "{:,.0f}".format(valor).replace(",", ".")

        # Pedidos recientes para la tabla (últimos 4 pedidos)
        pedidosTabla = session.exec(select(Pedido).where(Pedido.estado != EstadoPedido.CANCELADO).order_by(Pedido.fecha.desc()).limit(4)).all()

        # Para cada pedido, obtener el nombre del cliente
        pedidosConClientes = []
        for pedido in pedidosTabla:
            cliente = session.get(Cliente, pedido.clienteID)
            pedidosConClientes.append({
                "id": pedido.id,
                "clienteNombre": cliente.nombre if cliente else "Cliente no encontrado",
                "fecha": pedido.fecha.strftime('%Y-%m-%d') if pedido.fecha else 'N/A',
                "estado": pedido.estado.value if pedido.estado else 'PENDIENTE',
                "total": formatear_precio(pedido.total)
            })

        # Productos más vendidos para la tabla
        productosVentas = {}
        for detalle in todosDetalles:
            pedido = session.get(Pedido, detalle.pedidoID)
            if pedido and pedido.estado != EstadoPedido.CANCELADO:
                producto = session.get(Producto, detalle.productoID)
                if producto:
                    if producto.id not in productosVentas:
                        productosVentas[producto.id] = {
                            "nombre": producto.nombre,
                            "totalVendido": 0,
                            "ingresosTotales": 0
                        }
                    productosVentas[producto.id]["totalVendido"] += detalle.cantidad
                    productosVentas[producto.id]["ingresosTotales"] += detalle.subtotal

        # Ordenar por cantidad vendida y tomar los top 3
        productosMasVendidos = sorted(productosVentas.values(), key=lambda x: x["totalVendido"], reverse=True)[:3]
        
        # Formatear ingresos totales de productos
        for prod in productosMasVendidos:
            prod["ingresosTotales"] = formatear_precio(prod["ingresosTotales"])

        # Obtener datos para la gráfica de ventas mensuales
        datosGrafica = obtenerDatosVentasMensuales(session)

        # Envío de la información al frontend
        return templates.TemplateResponse("admin/dashboardAdmin.html", {
            "request": request,
            "ventasTotales": formatear_precio(ventasMesActual),
            "clientesActivos": totalClientesActivos,
            "pedidosRecientesCount": totalPedidosRecientes,
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
        # Obtener pedidos de los últimos 6 meses
        fechaInicio = datetime.now() - timedelta(days=180)
        
        pedidos = session.exec(select(Pedido).where(Pedido.fecha >= fechaInicio, Pedido.estado != EstadoPedido.CANCELADO)).all()

        # Mapear meses a nombres
        mesesNombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", 
                        "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
        
        # Inicializar todos los meses con 0
        datosMensuales = [0.0] * 12
        
        # Procesar pedidos por mes
        for pedido in pedidos:
            mesIndex = pedido.fecha.month - 1
            datosMensuales[mesIndex] += pedido.total

        return {
            "meses": mesesNombres,
            "ventas": datosMensuales
        }
    except Exception as e:
        print(f"Error obteniendo datos de gráfica: {e}")
        return {
            "meses": ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
            "ventas": [0.0] * 12
        }