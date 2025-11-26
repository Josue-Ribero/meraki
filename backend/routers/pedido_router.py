from fastapi import APIRouter, HTTPException, Depends, Form
from sqlmodel import select, join
from ..auth.auth import clienteActual, adminActual
from ..utils.enums import MetodoPago, EstadoPedido, TipoTransaccion
from ..models.pedido import Pedido, PedidoCreate, PedidoUpdate
from ..models.cliente import Cliente
from ..models.pago import Pago
from ..models.transaccionPuntos import TransaccionPuntos
from ..db.db import SessionDep

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
@router.get("/{pedidoID}", response_model=Pedido)
def pedidoPorID(pedidoID: int, session: SessionDep, _=Depends(adminActual)):
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