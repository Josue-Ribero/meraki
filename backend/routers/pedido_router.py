from fastapi import APIRouter, HTTPException, Depends, Form
from sqlmodel import select, join
from ..auth.auth import clienteActual, adminActual
from ..utils.enums import MetodoPago, EstadoPedido, TipoTransaccion
from ..models.pedido import Pedido, PedidoCreate, PedidoUpdate
from ..models.cliente import Cliente
from ..models.pago import Pago
from ..models.producto import Producto
from ..models.transaccionPuntos import TransaccionPuntos
from ..db.db import SessionDep
from ..models.detallePedido import DetallePedido
from ..models.disenoPersonalizado import DisenoPersonalizado

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])

# READ - Obtener la lista de pedidos del cliente (optimizado)
@router.get("/mis-pedidos", response_model=list[Pedido])
def misPedidos(session: SessionDep, cliente=Depends(clienteActual)):
    """
    Endpoint optimizado para que clientes vean sus pedidos.
    Carga toda la información necesaria en una sola consulta.
    """
    
    # Obtener pedidos con información de cliente y pago en una sola query
    query = select(Pedido, Cliente, Pago).join(Cliente, Pedido.clienteID == Cliente.id).outerjoin(Pago, Pedido.id == Pago.pedidoID).where(Pedido.clienteID == cliente.id)
    
    resultados = session.exec(query).all()
    
    if not resultados:
        raise HTTPException(404, "No tienes pedidos registrados")
    
    # Construir respuesta optimizada
    pedidosConInfo = []
    for pedido, objetoCliente, pago in resultados:
        pedido.cliente = objetoCliente
        pedido.pago = pago
        pedidosConInfo.append(pedido)
    
    return pedidosConInfo



# READ - Obtener lista de pedidos (solo administrador - optimizado)
@router.get("/", response_model=list[Pedido])
def listaPedidos(session: SessionDep, _=Depends(adminActual)):
    """
    Endpoint optimizado para administradores.
    Carga todos los pedidos con información de cliente y pago en una sola consulta.
    """
    
    # Consulta optimizada con joins
    query = select(Pedido, Cliente, Pago).join(Cliente, Pedido.clienteID == Cliente.id).outerjoin(Pago, Pedido.id == Pago.pedidoID)
    
    resultados = session.exec(query).all()
    
    # Construir respuesta
    pedidosConInfo = []
    for pedido, objetoCliente, pago in resultados:
        pedido.cliente = objetoCliente
        pedido.pago = pago
        pedidosConInfo.append(pedido)
    
    return pedidosConInfo



# READ - Obtener pedido por ID con detalles completos (solo administrador)
@router.get("/admin/{pedidoID}")
def pedidoPorIDAdmin(pedidoID: int, session: SessionDep, _=Depends(adminActual)):
    """
    Endpoint optimizado para detalles de pedido.
    Carga toda la información relacionada en consultas eficientes.
    """
    
    # Consulta principal optimizada
    query = select(Pedido, Cliente, Pago).join(Cliente, Pedido.clienteID == Cliente.id).outerjoin(Pago, Pedido.id == Pago.pedidoID).where(Pedido.id == pedidoID)
    
    resultado = session.exec(query).first()
    
    if not resultado:
        raise HTTPException(404, "Pedido no encontrado en el sistema")
    
    pedidoDB, objetoCliente, pago = resultado
    pedidoDB.cliente = objetoCliente
    pedidoDB.pago = pago

    # Cargar detalles del pedido con información de productos y diseños
    queryDetalles = select(DetallePedido).where(DetallePedido.pedidoID == pedidoID)
    
    detallesDB = session.exec(queryDetalles).all()

    productos = []
    listaDetalles = []
    subtotal = 0.0

    for detalle in detallesDB:
        # Obtener información del producto o diseño
        productoInfo = None
        disenoInfo = None
        nombreProducto = "Producto"
        imagenUrl = "https://via.placeholder.com/60"
        esPersonalizado = False

        if detalle.productoID:
            producto = session.get(Producto, detalle.productoID)
            if producto:
                productoInfo = {
                    "nombre": producto.nombre,
                    "imagenURL": producto.imagenURL
                }
                nombreProducto = producto.nombre
                imagenUrl = producto.imagenURL or imagenUrl
        elif detalle.disenoPersonalizadoID:
            diseno = session.get(DisenoPersonalizado, detalle.disenoPersonalizadoID)
            if diseno:
                disenoInfo = {
                    "nombre": diseno.nombre,
                    "imagenURL": diseno.imagenURL
                }
                nombreProducto = diseno.nombre
                imagenUrl = diseno.imagenURL or imagenUrl
                esPersonalizado = True

        productos.append({
            "name": nombreProducto,
            "img": imagenUrl,
            "qty": detalle.cantidad or 0,
            "price": detalle.subtotal or 0,
        })

        # Estructura detallada
        listaDetalles.append({
            "producto": productoInfo,
            "disenoPersonalizado": disenoInfo,
            "esPersonalizado": esPersonalizado,
            "cantidad": detalle.cantidad or 0,
            "precioUnidad": detalle.precioUnidad or 0,
            "subtotal": detalle.subtotal or 0,
        })

        # Calcular subtotal
        try:
            subtotal += float(detalle.subtotal or 0)
        except (TypeError, ValueError):
            pass

    # Preparar respuesta final
    diccionarioPedido = pedidoDB.dict()
    diccionarioPedido["productos"] = productos
    diccionarioPedido["detalles"] = listaDetalles
    totalPedido = float(pedidoDB.total or 0)
    envio = max(totalPedido - subtotal, 0)
    diccionarioPedido["subtotal"] = subtotal
    diccionarioPedido["envio"] = envio
    
    # Formatear fecha
    if hasattr(pedidoDB, 'fecha') and pedidoDB.fecha:
        diccionarioPedido["fecha"] = (
            pedidoDB.fecha.isoformat() 
            if hasattr(pedidoDB.fecha, 'isoformat') 
            else str(pedidoDB.fecha)
        )
    else:
        diccionarioPedido["fecha"] = None
        
    return diccionarioPedido



# READ - Obtener pedido del cliente por ID con detalles (optimizado)
@router.get("/mi-pedido/{pedidoID}")
def miPedidoPorID(pedidoID: int, session: SessionDep, cliente=Depends(clienteActual)):
    """
    Endpoint optimizado para que clientes vean detalles de sus pedidos.
    """
    
    # Consulta optimizada con seguridad de pertenencia
    query = select(Pedido, Cliente, Pago).join(Cliente, Pedido.clienteID == Cliente.id).outerjoin(Pago, Pedido.id == Pago.pedidoID).where(Pedido.id == pedidoID, Pedido.clienteID == cliente.id)
    
    resultado = session.exec(query).first()

    if not resultado:
        raise HTTPException(404, "No se encontró el pedido solicitado")

    pedidoDB, objetoCliente, pago = resultado
    pedidoDB.cliente = objetoCliente
    pedidoDB.pago = pago

    # Cargar detalles optimizados
    queryDetalles = select(DetallePedido).where(DetallePedido.pedidoID == pedidoID)
    
    detallesDB = session.exec(queryDetalles).all()

    productos = []
    listaDetalles = []
    subtotal = 0.0

    for detalle in detallesDB:
        # Obtener información del producto o diseño
        productoInfo = None
        disenoInfo = None
        nombreProducto = "Producto"
        imagenUrl = "https://via.placeholder.com/60"
        esPersonalizado = False

        if detalle.productoID:
            producto = session.get(Producto, detalle.productoID)
            if producto:
                productoInfo = {
                    "nombre": producto.nombre,
                    "imagenURL": producto.imagenURL
                }
                nombreProducto = producto.nombre
                imagenUrl = producto.imagenURL or imagenUrl
        elif detalle.disenoPersonalizadoID:
            diseno = session.get(DisenoPersonalizado, detalle.disenoPersonalizadoID)
            if diseno:
                disenoInfo = {
                    "nombre": diseno.nombre,
                    "imagenURL": diseno.imagenURL
                }
                nombreProducto = diseno.nombre
                imagenUrl = diseno.imagenURL or imagenUrl
                esPersonalizado = True

        productos.append({
            "name": nombreProducto,
            "img": imagenUrl,
            "qty": detalle.cantidad or 0,
            "price": detalle.subtotal or 0,
        })

        listaDetalles.append({
            "producto": productoInfo,
            "disenoPersonalizado": disenoInfo,
            "esPersonalizado": esPersonalizado,
            "cantidad": detalle.cantidad or 0,
            "precioUnidad": detalle.precioUnidad or 0,
            "subtotal": detalle.subtotal or 0,
        })

        try:
            subtotal += float(detalle.subtotal or 0)
        except (TypeError, ValueError):
            pass

    # Preparar respuesta
    diccionarioPedido = pedidoDB.dict()
    diccionarioPedido["productos"] = productos
    diccionarioPedido["detalles"] = listaDetalles
    totalPedido = float(pedidoDB.total or 0)
    envio = max(totalPedido - subtotal, 0)
    diccionarioPedido["subtotal"] = subtotal
    diccionarioPedido["envio"] = envio
    
    # Formatear fecha
    if hasattr(pedidoDB, 'fecha') and pedidoDB.fecha:
        diccionarioPedido["fecha"] = (
            pedidoDB.fecha.isoformat() 
            if hasattr(pedidoDB.fecha, 'isoformat') 
            else str(pedidoDB.fecha)
        )
    else:
        diccionarioPedido["fecha"] = None
        
    return diccionarioPedido



# UPDATE - Cancelar pedido (cliente - optimizado)
@router.patch("/{pedidoID}/cancelar")
def cancelarPedidoCliente(
    pedidoID: int,
    session: SessionDep,
    cliente=Depends(clienteActual)
):
    """
    Endpoint optimizado para cancelar pedidos.
    """
    
    # Consulta directa con verificación de pertenencia
    pedidoDB = session.exec(select(Pedido).where(Pedido.id == pedidoID, Pedido.clienteID == cliente.id)).first()
    
    if not pedidoDB:
        raise HTTPException(404, "No se encontró el pedido a cancelar")
    
    if pedidoDB.estado != EstadoPedido.POR_PAGAR:
        raise HTTPException(400, "Solo se pueden cancelar pedidos que están por pagar")
    
    # Actualizar estado
    pedidoDB.estado = EstadoPedido.CANCELADO

    # Guardar cambios
    session.add(pedidoDB)
    session.commit()
    
    return {"mensaje": "Pedido cancelado exitosamente", "pedido": pedidoDB}



# UPDATE - Actualizar el estado del pedido (solo administrador - optimizado)
@router.patch("/{pedidoID}")
def actualizarEstado(
    pedidoID: int,
    estado: EstadoPedido = Form(...),
    session: SessionDep = None,
    _=Depends(adminActual)
):
    """
    Endpoint optimizado para actualizar estados de pedidos.
    """
    
    pedidoDB = session.get(Pedido, pedidoID)
    
    if not pedidoDB:
        raise HTTPException(404, "Pedido no encontrado")
    
    pedidoDB.estado = estado

    session.add(pedidoDB)
    session.commit()
    
    return pedidoDB



# UPDATE - Confirmar pedido (optimizado)
@router.patch("/{pedidoID}/confirmar")
def confirmarPedido(
    pedidoID: int,
    session: SessionDep = None,
    _=Depends(adminActual)
):
    """
    Endpoint optimizado para confirmar pedidos y procesar transacciones.
    """
    
    # Cargar pedido y pago en una sola consulta
    query = (select(Pedido, Pago, Cliente).join(Pago, Pedido.id == Pago.pedidoID).join(Cliente, Pedido.clienteID == Cliente.id).where(Pedido.id == pedidoID))
    
    resultado = session.exec(query).first()
    
    if not resultado:
        raise HTTPException(404, "Pedido no encontrado")
    
    pedidoDB, pagoDB, cliente = resultado
    
    if pagoDB.confirmado:
        raise HTTPException(400, "El pago de este pedido ya está confirmado")
    
    # Actualizar estados
    pedidoDB.estado = EstadoPedido.PAGADO
    pagoDB.confirmado = True
    
    # Otorgar puntos si no se pagó con puntos
    if not pedidoDB.pagadoConPuntos:
        puntosGanados = int(pedidoDB.total * 0.05)
        if puntosGanados > 0:
            cliente.puntos += puntosGanados
            
            # Registrar transacción
            transaccion = TransaccionPuntos(
                clienteID=cliente.id,
                pedidoID=pedidoDB.id,
                tipo=TipoTransaccion.GANADOS,
                cantidad=puntosGanados
            )
            session.add(transaccion)
    
    # Guardar todos los cambios
    try:
        session.commit()
        return pedidoDB
    
    except Exception as e:
        session.rollback()
        raise HTTPException(500, f"Error al confirmar pedido: {str(e)}")