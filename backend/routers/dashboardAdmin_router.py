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
        # Obtener datos de tiempo para el dashboard
        ahora = datetime.now()
        mesActual = ahora.month
        anioActual = ahora.year
        
        # Ventas del mes actual
        inicioMesActual = datetime(anioActual, mesActual, 1)
        # Si es diciembre, suma uno al año actual porque pasa ser enero del 2026
        if mesActual == 12:
            finMesActual = datetime(anioActual + 1, 1, 1)
        # Si es diferente de diciembre, suma uno al mes actual
        else:
            finMesActual = datetime(anioActual, mesActual + 1, 1)
        
        # Obtener pedidos del mes actual
        pedidosMesActual = session.exec(
            select(Pedido).where(
                Pedido.fecha >= inicioMesActual,
                Pedido.fecha < finMesActual,
                Pedido.estado == EstadoPedido.PAGADO
            )
        ).all()
        
        # Suma de las ventas del mes actual
        ventasMesActual = sum(pedido.total for pedido in pedidosMesActual)

        # Clientes activos
        clientesActivos = session.exec(select(Cliente).where(Cliente.activo == True)).all()
        totalClientesActivos = len(clientesActivos)

        # Pedidos recientes (últimos 7 días)
        fechaLimite = datetime.now() - timedelta(days=7)
        pedidosRecientes = session.exec(select(Pedido).where(Pedido.fecha >= fechaLimite, Pedido.estado == EstadoPedido.PAGADO)).all()
        totalPedidosRecientes = len(pedidosRecientes)

        # Producto más vendido
        todosDetalles = session.exec(select(DetallePedido)).all()
        ventasPorProducto = {}
        
        # Obtener la cantidad de ventas por producto
        for detalle in todosDetalles:
            pedido = session.get(Pedido, detalle.pedidoID)
            if pedido and pedido.estado != EstadoPedido.CANCELADO:
                if detalle.productoID not in ventasPorProducto:
                    ventasPorProducto[detalle.productoID] = 0
                ventasPorProducto[detalle.productoID] += detalle.cantidad
        
        # Si hay ventas, obtener el producto más vendido
        if ventasPorProducto:
            productoIdMasVendido = max(ventasPorProducto, key=ventasPorProducto.get)
            productoMasVendidoObj = session.get(Producto, productoIdMasVendido)
            productoMasVendido = productoMasVendidoObj.nombre if productoMasVendidoObj else "No hay ventas"
        # Si no hay ventas, mostrar "No hay ventas"
        else:
            productoMasVendido = "No hay ventas"

        # Función auxiliar para formatear precios (. por cada tres cifras)
        def formatearPrecio(valor):
            if valor is None:
                return "0"
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
                "total": formatearPrecio(pedido.total)
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
            prod["ingresosTotales"] = formatearPrecio(prod["ingresosTotales"])

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
        # Obtener pedidos de los últimos 6 meses
        fechaInicio = datetime.now() - timedelta(days=180)
        
        pedidos = session.exec(select(Pedido).where(Pedido.fecha >= fechaInicio, Pedido.estado == EstadoPedido.PAGADO)).all()

        # Mapear meses a nombres
        mesesNombres = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
        
        # Inicializar todos los meses con 0
        datosMensuales = [0.0] * 12
        
        # Procesar pedidos por mes
        for pedido in pedidos:
            mesIndex = pedido.fecha.month - 1
            datosMensuales[mesIndex] += pedido.total

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
        # Si es diciembre, suma uno al año actual porque pasa ser enero del 2026
        if mesActual == 12:
            finMesActual = datetime(anioActual + 1, 1, 1)
        # Si es diferente de diciembre, suma uno al mes actual
        else:
            finMesActual = datetime(anioActual, mesActual + 1, 1)
        
        # Obtener pedidos del mes actual
        pedidosMesActual = session.exec(select(Pedido).where(Pedido.fecha >= inicioMesActual, Pedido.fecha < finMesActual, Pedido.estado == EstadoPedido.PAGADO)).all()
        
        # Sumar los totales de los pedidos
        ventasMesActual = sum(pedido.total for pedido in pedidosMesActual)

        # Ventas del mes anterior para calcular el porcentaje
        if mesActual == 1:
            mesAnterior = 12
            anioAnterior = anioActual - 1
        else:
            mesAnterior = mesActual - 1
            anioAnterior = anioActual
        
        # Fecha de inicio del mes pasado
        inicioMesAnterior = datetime(anioAnterior, mesAnterior, 1)
        if mesAnterior == 12:
            finMesAnterior = datetime(anioAnterior + 1, 1, 1)
        else:
            finMesAnterior = datetime(anioAnterior, mesAnterior + 1, 1)
        
        # Obtener pedidos del mes anterior
        pedidosMesAnterior = session.exec(select(Pedido).where(Pedido.fecha >= inicioMesAnterior, Pedido.fecha < finMesAnterior, Pedido.estado != EstadoPedido.CANCELADO)).all()
        
        # Sumar los totales de los pedidos del mes anterior
        ventasMesAnterior = sum(pedido.total for pedido in pedidosMesAnterior)

        # Cálculo de porcentaje de aumento o decremento
        if ventasMesAnterior > 0:
            porcentajeCambio = ((ventasMesActual - ventasMesAnterior) / ventasMesAnterior) * 100
        else:
            porcentajeCambio = 100 if ventasMesActual > 0 else 0

        # Total de pedidos recientes (últimos 7 días)
        fechaLimite = datetime.now() - timedelta(days=7)
        pedidosRecientes = session.exec(select(Pedido).where(Pedido.fecha >= fechaLimite, Pedido.estado != EstadoPedido.CANCELADO)).all()
        pedidosRecientesCount = len(pedidosRecientes)

        # Clientes activos
        clientesActivos = session.exec(select(Cliente).where(Cliente.activo == True)).all()
        totalClientesActivos = len(clientesActivos)

        # Producto más vendido
        todosDetalles = session.exec(select(DetallePedido)).all()
        ventasPorProducto = {}
        
        # Sumar las cantidades de los productos
        for detalle in todosDetalles:
            pedido = session.get(Pedido, detalle.pedidoID)
            if pedido and pedido.estado != EstadoPedido.CANCELADO:
                if detalle.productoID not in ventasPorProducto:
                    ventasPorProducto[detalle.productoID] = 0
                ventasPorProducto[detalle.productoID] += detalle.cantidad
        
        # Obtener el producto más vendido
        if ventasPorProducto:
            productoIdMasVendido = max(ventasPorProducto, key=ventasPorProducto.get)
            productoMasVendidoObj = session.get(Producto, productoIdMasVendido)
            productoMasVendido = productoMasVendidoObj.nombre if productoMasVendidoObj else "No hay ventas"
        # Si no hay ventas, mostrar "No hay ventas"
        else:
            productoMasVendido = "No hay ventas"

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
    Endpoint principal del dashboard que renderiza la página completa
    """

    return obtenerDatosVentasMensuales(session)



# READ - Obtener los pedidos recientes
@router.get("/api/dashboard/pedidos-recientes")
def obtenerPedidosRecientes(session: SessionDep, _=Depends(adminActual)):
    """
    Endpoint de obtención de la lista de pedidos recientes
    """

    try:
        # Obtener la lista de pedidos
        pedidos = session.exec(select(Pedido).where(Pedido.estado != EstadoPedido.CANCELADO).order_by(Pedido.fecha.desc()).limit(5)).all()

        # Lista con el resultado de la consulta
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
        # Obtener todos los detalles de pedidos
        todosDetalles = session.exec(select(DetallePedido)).all()
        
        # Calcular ventas por producto
        productosVentas = {}
        for detalle in todosDetalles:
            pedido = session.get(Pedido, detalle.pedidoID)
            if pedido and pedido.estado != EstadoPedido.CANCELADO:
                producto = session.get(Producto, detalle.productoID)
                if producto:
                    if producto.id not in productosVentas:
                        productosVentas[producto.id] = {
                            "nombre": producto.nombre,
                            "ventas": 0,
                            "ingresos": 0
                        }
                    productosVentas[producto.id]["ventas"] += detalle.cantidad
                    productosVentas[producto.id]["ingresos"] += detalle.subtotal

        # Ordenar por cantidad vendida y tomar los top 5
        productosMasVendidos = sorted(productosVentas.values(), key=lambda x: x["ventas"], reverse=True)[:5]
        
        # Convertir ventas a enteros
        for producto in productosMasVendidos:
            producto["ventas"] = int(producto["ventas"])

        return productosMasVendidos
    
    # Excepción en caso de no encontrar los productos más vendidos
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener productos más vendidos: {str(e)}")