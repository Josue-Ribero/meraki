from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlmodel import select, func, join
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
        # Obtener datos de tiempo para el dashboard
        ahora = datetime.now()
        mesActual = ahora.month
        anioActual = ahora.year
        
        # Ventas del mes actual
        inicioMesActual = datetime(anioActual, mesActual, 1)
        if mesActual == 12:
            finMesActual = datetime(anioActual + 1, 1, 1)
        else:
            finMesActual = datetime(anioActual, mesActual + 1, 1)
        
        # Consulta optimizada para ventas del mes
        queryVentasMes = select(func.sum(Pedido.total)).where(
            Pedido.fecha >= inicioMesActual,
            Pedido.fecha < finMesActual,
            Pedido.estado == EstadoPedido.PAGADO
        )
        ventasMesActual = session.exec(queryVentasMes).first() or 0

        # Clientes activos
        queryClientesActivos = select(func.count(Cliente.id)).where(Cliente.activo == True)
        totalClientesActivos = session.exec(queryClientesActivos).first() or 0

        # Pedidos recientes (últimos 7 días)
        fechaLimite = datetime.now() - timedelta(days=7)
        queryPedidosRecientes = select(func.count(Pedido.id)).where(
            Pedido.fecha >= fechaLimite, 
            Pedido.estado == EstadoPedido.PAGADO
        )
        totalPedidosRecientes = session.exec(queryPedidosRecientes).first() or 0

        # Producto más vendido
        queryProductoMasVendido = select(
            Producto.nombre
        ).select_from(
            join(DetallePedido, Pedido).join(Producto)
        ).where(
            Pedido.estado == EstadoPedido.PAGADO
        ).group_by(
            Producto.id, Producto.nombre
        ).order_by(
            func.sum(DetallePedido.cantidad).desc()
        ).limit(1)

        resultadoProducto = session.exec(queryProductoMasVendido).first()
        productoMasVendido = resultadoProducto if resultadoProducto else "No hay ventas"

        # Función auxiliar para formatear precios (. por cada tres cifras)
        def formatearPrecio(valor):
            if valor is None:
                return "0"
            return "{:,.0f}".format(valor).replace(",", ".")

        # Pedidos recientes para la tabla (últimos 4 pedidos)
        queryPedidosTabla = select(
            Pedido.id,
            Pedido.fecha,
            Pedido.estado,
            Pedido.total,
            Cliente.nombre
        ).join(Cliente).where(
            Pedido.estado == EstadoPedido.PAGADO
        ).order_by(
            Pedido.fecha.desc()
        ).limit(4)

        resultadosPedidos = session.exec(queryPedidosTabla).all()
        
        pedidosConClientes = []
        for pedidoId, fecha, estado, total, clienteNombre in resultadosPedidos:
            pedidosConClientes.append({
                "id": pedidoId,
                "clienteNombre": clienteNombre or "Cliente no encontrado",
                "fecha": fecha.strftime('%Y-%m-%d') if fecha else 'N/A',
                "estado": estado.value if estado else 'PENDIENTE',
                "total": formatearPrecio(total)
            })

        # Productos más vendidos para la tabla 
        queryProductosMasVendidos = select(
            Producto.nombre,
            func.sum(DetallePedido.cantidad).label('totalVendido'),
            func.sum(DetallePedido.subtotal).label('ingresosTotales')
        ).select_from(
            join(DetallePedido, Pedido).join(Producto)
        ).where(
            Pedido.estado == EstadoPedido.PAGADO
        ).group_by(
            Producto.id, Producto.nombre
        ).order_by(
            func.sum(DetallePedido.cantidad).desc()
        ).limit(3)

        resultadosProductos = session.exec(queryProductosMasVendidos).all()
        
        productosMasVendidos = []
        for nombre, totalVendido, ingresosTotales in resultadosProductos:
            productosMasVendidos.append({
                "nombre": nombre,
                "totalVendido": totalVendido or 0,
                "ingresosTotales": formatearPrecio(ingresosTotales or 0)
            })

        # Obtener datos para la gráfica de ventas mensuales
        datosGrafica = obtenerDatosVentasMensuales(session)

        # Envío de la información al frontend
        return templates.TemplateResponse("admin/dashboardAdmin.html", {
            "request": request,
            "ventasTotales": formatearPrecio(ventasMesActual),
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
    """
    Función auxiliar para obtener datos de ventas mensuales para la gráfica
    """
    try:
        # Obtener pedidos de los últimos 6 meses con consulta optimizada
        fechaInicio = datetime.now() - timedelta(days=180)
        
        # Consulta optimizada que trae solo los datos necesarios
        query = select(Pedido).where(
            Pedido.fecha >= fechaInicio, 
            Pedido.estado == EstadoPedido.PAGADO
        )
        pedidos = session.exec(query).all()

        # Mapear meses a nombres
        mesesNombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
        
        # Inicializar todos los meses con 0
        datosMensuales = [0.0] * 12
        
        # Procesar pedidos por mes
        for pedido in pedidos:
            mesIndex = pedido.fecha.month - 1
            datosMensuales[mesIndex] += float(pedido.total or 0)

        return {"meses": mesesNombres, "ventas": datosMensuales}
    except Exception as e:
        print(f"Error obteniendo datos de gráfica: {e}")
        return {"meses": ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],"ventas": [0.0] * 12}



# READ - Obtener resumen de ventas mensuales
@router.get("/api/dashboard/resumen")
def obtenerResumenDashboard(session: SessionDep, _=Depends(adminActual)):
    """
    Endpoint de obtención de resumen de ventas mensuales
    """

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
        
        queryVentasActual = select(func.sum(Pedido.total)).where(
            Pedido.fecha >= inicioMesActual, 
            Pedido.fecha < finMesActual, 
            Pedido.estado == EstadoPedido.PAGADO
        )
        ventasMesActual = session.exec(queryVentasActual).first() or 0

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
        
        queryVentasAnterior = select(func.sum(Pedido.total)).where(
            Pedido.fecha >= inicioMesAnterior, 
            Pedido.fecha < finMesAnterior, 
            Pedido.estado != EstadoPedido.CANCELADO
        )
        ventasMesAnterior = session.exec(queryVentasAnterior).first() or 0

        # Cálculo de porcentaje de aumento o decremento
        if ventasMesAnterior > 0:
            porcentajeCambio = ((ventasMesActual - ventasMesAnterior) / ventasMesAnterior) * 100
        else:
            porcentajeCambio = 100 if ventasMesActual > 0 else 0

        # Total de pedidos recientes (últimos 7 días)
        fechaLimite = datetime.now() - timedelta(days=7)
        queryPedidosRecientes = select(func.count(Pedido.id)).where(
            Pedido.fecha >= fechaLimite, 
            Pedido.estado != EstadoPedido.CANCELADO
        )
        pedidosRecientesCount = session.exec(queryPedidosRecientes).first() or 0

        # Clientes activos
        queryClientesActivos = select(func.count(Cliente.id)).where(Cliente.activo == True)
        totalClientesActivos = session.exec(queryClientesActivos).first() or 0

        # Producto más vendido
        queryProductoMasVendido = select(
            Producto.nombre
        ).select_from(
            join(DetallePedido, Pedido).join(Producto)
        ).where(
            Pedido.estado != EstadoPedido.CANCELADO
        ).group_by(
            Producto.id, Producto.nombre
        ).order_by(
            func.sum(DetallePedido.cantidad).desc()
        ).limit(1)

        resultadoProducto = session.exec(queryProductoMasVendido).first()
        productoMasVendido = resultadoProducto if resultadoProducto else "No hay ventas"

        # Devolver los datos del resumen
        return {
            "ventasTotales": ventasMesActual,
            "porcentajeCambio": round(porcentajeCambio, 2),
            "pedidosRecientes": pedidosRecientesCount,
            "clientesActivos": totalClientesActivos,
            "productoMasVendido": productoMasVendido
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener resumen: {str(e)}")



# READ - Obtener las ventas mensuales
@router.get("/api/dashboard/ventas-mensuales")
def obtenerVentasMensuales(session: SessionDep, _=Depends(adminActual)):
    """
    Endpoint optimizado para ventas mensuales
    """
    return obtenerDatosVentasMensuales(session)



# READ - Obtener los pedidos recientes
@router.get("/api/dashboard/pedidos-recientes")
def obtenerPedidosRecientes(session: SessionDep, _=Depends(adminActual)):
    """
    Endpoint de obtención de la lista de pedidos recientes
    """

    try:
        # Obtener la lista de pedidos con consulta optimizada
        query = select(
            Pedido.id,
            Pedido.fecha,
            Pedido.estado,
            Pedido.total,
            Cliente.nombre
        ).join(Cliente).where(
            Pedido.estado != EstadoPedido.CANCELADO
        ).order_by(
            Pedido.fecha.desc()
        ).limit(5)

        resultados = session.exec(query).all()

        # Lista con el resultado de la consulta
        resultado = []
        for pedidoId, fecha, estado, total, clienteNombre in resultados:
            resultado.append({
                "id": pedidoId,
                "cliente": clienteNombre or "Cliente eliminado",
                "fecha": fecha.strftime("%Y-%m-%d") if fecha else "N/A",
                "estado": estado.value,
                "total": total or 0
            })

        # Devolver la lista de pedidos recientes
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener pedidos recientes: {str(e)}")



# READ - Obtener la lista de productos más vendidos
@router.get("/api/dashboard/productos-mas-vendidos")
def obtenerProductosMasVendidos(session: SessionDep, _=Depends(adminActual)):
    """
    Endpoint de obtención de la lista de productos más vendidos
    """

    try:
        # Consulta optimizada con JOIN para productos más vendidos
        query = select(
            Producto.nombre,
            func.sum(DetallePedido.cantidad).label('ventas'),
            func.sum(DetallePedido.subtotal).label('ingresos')
        ).select_from(
            join(DetallePedido, Pedido).join(Producto)
        ).where(
            Pedido.estado != EstadoPedido.CANCELADO
        ).group_by(
            Producto.id, Producto.nombre
        ).order_by(
            func.sum(DetallePedido.cantidad).desc()
        ).limit(5)

        resultados = session.exec(query).all()
        
        productosMasVendidos = []
        for nombre, ventas, ingresos in resultados:
            productosMasVendidos.append({
                "nombre": nombre,
                "ventas": int(ventas or 0),
                "ingresos": ingresos or 0
            })

        return productosMasVendidos
    
    # Excepción en caso de no encontrar los productos más vendidos
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener productos más vendidos: {str(e)}")