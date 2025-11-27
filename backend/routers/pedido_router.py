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

# READ - Obtener la lista de pedidos del cliente
@router.get("/mis-pedidos", response_model=list[Pedido])
def misPedidos(session: SessionDep, cliente=Depends(clienteActual)):
    """
    Endpoint para obtener la lista de pedidos del cliente
    """
    
    # Verificar los pedidos que existen y que sean de x cliente
    pedidosDB = session.exec(select(Pedido).join(Cliente, Pedido.clienteID == Cliente.id).where(Pedido.clienteID == cliente.id)).all()
    
    # Si no hay pedidos, mostrar error
    if not pedidosDB:
        raise HTTPException(404, "No tienes pedidos")
    
    # Cargar relaciones para cada pedido
    for pedido in pedidosDB:
        # Cargar pago si existe
        pago = session.exec(select(Pago).where(Pago.pedidoID == pedido.id)).first()
        pedido.pago = pago
    
    return pedidosDB

# READ - Obtener lista de pedidos (solo administrador)
@router.get("/", response_model=list[Pedido])
def listaPedidos(session: SessionDep, _=Depends(adminActual)):
    """
    Endpoint para obtener la lista de pedidos (solo administrador)
    """
    
    # Lista de pedidos de un cliente
    pedidos = session.exec(select(Pedido).join(Cliente, Pedido.clienteID == Cliente.id)).all()
    
    # Cargar pagos para cada pedido
    for pedido in pedidos:
        pago = session.exec(select(Pago).where(Pago.pedidoID == pedido.id)).first()
        pedido.pago = pago
    
    return pedidos

# READ - Obtener pedido por ID (solo administrador)
@router.get("/admin/{pedidoID}", response_model=Pedido)
def pedidoPorIDAdmin(pedidoID: int, session: SessionDep, _=Depends(adminActual)):
    """
    Endpoint para obtener el pedido por ID (solo administrador)
    """
    
    # Pedido con con id de cliente específico
    pedidoDB = session.exec(select(Pedido).join(Cliente, Pedido.clienteID == Cliente.id).where(Pedido.id == pedidoID)).first()
    
    # Si no existe el pedido, mostrar error
    if not pedidoDB:
        raise HTTPException(404, "Pedido no encontrado")
    
    # Cargar pago si existe
    pago = session.exec(select(Pago).where(Pago.pedidoID == pedidoDB.id)).first()
    pedidoDB.pago = pago
    
    return pedidoDB

# READ - Obtener pedido del cliente por ID con detalles
@router.get("/mi-pedido/{pedidoID}")
def miPedidoPorID(pedidoID: int, session: SessionDep, cliente=Depends(clienteActual)):
    """
    Devuelve el pedido del cliente autenticado con productos, detalles, subtotal y envío.
    """
    pedidoDB = session.exec(
        select(Pedido)
        .join(Cliente, Pedido.clienteID == Cliente.id)
        .where(Pedido.id == pedidoID, Pedido.clienteID == cliente.id)
    ).first()

    if not pedidoDB:
        raise HTTPException(404, "Pedido no encontrado")

    # Pago asociado si existe
    pago = session.exec(select(Pago).where(Pago.pedidoID == pedidoDB.id)).first()
    pedidoDB.pago = pago

    productos = []
    detalles_list = []
    subtotal = 0.0

    # Cargar detalles del pedido
    detallesDB = session.exec(select(DetallePedido).where(DetallePedido.pedidoID == pedidoDB.id)).all()
    for detalle in detallesDB:
        producto = None
        diseno = None
        if getattr(detalle, 'productoID', None):
            producto = session.get(Producto, detalle.productoID)
        if getattr(detalle, 'disenoPersonalizadoID', None):
            diseno = session.get(DisenoPersonalizado, detalle.disenoPersonalizadoID)

        # Lista compacta para la UI izquierda
        productos.append({
            "name": getattr(producto, 'nombre', None) or getattr(diseno, 'nombre', None) or "Producto",
            "img": getattr(producto, 'imagenURL', None) or getattr(diseno, 'imagenURL', None) or "https://via.placeholder.com/60",
            "qty": detalle.cantidad or 0,
            "price": detalle.subtotal or 0,
        })

        # Estructura detallada similar al admin
        detalles_list.append({
            "producto": {
                "nombre": getattr(producto, 'nombre', None),
                "imagenURL": getattr(producto, 'imagenURL', None)
            } if producto else None,
            "disenoPersonalizado": {
                "nombre": getattr(diseno, 'nombre', None),
                "imagenURL": getattr(diseno, 'imagenURL', None)
            } if diseno else None,
            "esPersonalizado": bool(getattr(detalle, 'esPersonalizado', False)),
            "cantidad": detalle.cantidad or 0,
            "precioUnidad": detalle.precioUnidad or 0,
            "subtotal": detalle.subtotal or 0,
        })

        try:
            subtotal += float(detalle.subtotal or 0)
        except Exception:
            pass

    pedido_dict = pedidoDB.dict()
    pedido_dict["productos"] = productos
    pedido_dict["detalles"] = detalles_list
    pedido_total = float(pedidoDB.total or 0)
    envio = max(pedido_total - subtotal, 0)
    pedido_dict["subtotal"] = subtotal
    pedido_dict["envio"] = envio
    
    # Asegurar que la fecha esté incluida
    if hasattr(pedidoDB, 'fecha') and pedidoDB.fecha:
        pedido_dict["fecha"] = pedidoDB.fecha.isoformat() if hasattr(pedidoDB.fecha, 'isoformat') else str(pedidoDB.fecha)
    else:
        pedido_dict["fecha"] = None
        
    return pedido_dict

# UPDATE - Cancelar pedido (cliente)
@router.patch("/{pedidoID}/cancelar", response_model=Pedido)
def cancelarPedidoCliente(
    pedidoID: int,
    session: SessionDep,
    cliente=Depends(clienteActual)
):
    """
    Endpoint para que un cliente cancele su propio pedido
    """
    
    # Obtener pedido con ese ID y que pertenezca al cliente
    pedidoDB = session.exec(
        select(Pedido)
        .where(Pedido.id == pedidoID, Pedido.clienteID == cliente.id)
    ).first()
    
    # Si no existe el pedido, mostrar error
    if not pedidoDB:
        raise HTTPException(404, "Pedido no encontrado")
    
    # Verificar que el pedido se pueda cancelar (estado POR PAGAR)
    if pedidoDB.estado != EstadoPedido.POR_PAGAR:
        raise HTTPException(400, "Solo se pueden cancelar pedidos que están por pagar")
    
    # Cambiar estado del pedido a CANCELADO
    pedidoDB.estado = EstadoPedido.CANCELADO

    # Guardar cambios
    session.add(pedidoDB)
    session.commit()
    session.refresh(pedidoDB)
    
    return pedidoDB

# UPDATE - Actualizar el estado del pedido (solo administrador)
@router.patch("/{pedidoID}", response_model=Pedido)
def actualizarEstado(
    pedidoID: int,
    estado: EstadoPedido = Form(...),
    session: SessionDep = None,
    _=Depends(adminActual)
):
    """
    Endpoint para actualizar el estado del pedido (solo administrador)
    """
    
    # Obtener pedido con ese ID desde la DB
    pedidoDB = session.get(Pedido, pedidoID)
    
    # Si no existe el pedido, mostrar error
    if not pedidoDB:
        raise HTTPException(404, "Pedido no encontrado")
    
    # Cambiar estado del pedido
    pedidoDB.estado = estado

    # Insertar pedido en la DB y guardar los cambios
    session.add(pedidoDB)
    session.commit()
    session.refresh(pedidoDB)
    return pedidoDB

# UPDATE - Confirmar pedido
@router.patch("/{pedidoID}/confirmar", response_model=Pedido)
def confirmarPedido(
    pedidoID: int,
    session: SessionDep = None,
    _=Depends(adminActual)
):
    """
    Endpoint para confirmar el pedido y su pago asociado
    """
    
    # Obtener pedido con ese ID desde la DB
    pedidoDB = session.get(Pedido, pedidoID)
    
    # Si no existe el pedido, mostrar error
    if not pedidoDB:
        raise HTTPException(404, "Pedido no encontrado")
    
    # Buscar el pago asociado al pedido
    pagoDB = session.exec(select(Pago).where(Pago.pedidoID == pedidoID)).first()
    
    # Si no existe un pago asociado, mostrar error
    if not pagoDB:
        raise HTTPException(400, "Este pedido no tiene un pago asociado")
    
    # Verificar si el pago ya está confirmado
    if pagoDB.confirmado:
        raise HTTPException(400, "El pago de este pedido ya está confirmado")
    
    # Cambiar estado del pedido a PAGADO
    pedidoDB.estado = EstadoPedido.PAGADO
    
    # Confirmar el pago
    pagoDB.confirmado = True
    
    # Otorgar 5% del total en puntos al cliente (Solo si no pagó con puntos)
    if not pedidoDB.pagadoConPuntos:
        puntosGanados = int(pedidoDB.total * 0.05)
        if puntosGanados > 0:
            cliente = session.get(Cliente, pedidoDB.clienteID)
            
            # Si no existe el cliente, mostrar error
            if not cliente:
                raise HTTPException(404, "Cliente no encontrado")
            
            # Otorgar puntos al cliente
            cliente.puntos += puntosGanados
            
            # Registrar transacción de puntos ganados
            transaccion = TransaccionPuntos(
                clienteID=cliente.id,
                pedidoID=pedidoDB.id,
                tipo=TipoTransaccion.GANADOS,
                cantidad=puntosGanados
            )
            session.add(transaccion)
            session.add(cliente)
    
    # Guardar todos los cambios en la DB
    try:
        session.add(pedidoDB)
        session.add(pagoDB)
        session.commit()
        session.refresh(pedidoDB)
        return pedidoDB
    
    except Exception as e:
        session.rollback()
        raise HTTPException(500, f"Error al confirmar pedido y pago: {str(e)}")

# DELETE - Eliminar el pedido (solo administrador)
@router.delete("/cancelar-pago/{pedidoID}", response_model=Pedido)
def eliminarPedido(pedidoID: int, session: SessionDep, _=Depends(adminActual)):
    """
    Endpoint para eliminar el pedido (solo administrador)
    """
    
    # Obtener pedido con ese ID desde la DB
    pedidoDB = session.get(Pedido, pedidoID)
    
    # Si no existe el pedido, mostrar error
    if not pedidoDB:
        raise HTTPException(404, "Pedido no encontrado")
    
    # Cambiar estado del pedido a CANCELADO
    pedidoDB.estado = EstadoPedido.CANCELADO
    
    # Guardar todos los cambios en la DB
    session.add(pedidoDB)
    session.commit()
    session.refresh(pedidoDB)
    return pedidoDB