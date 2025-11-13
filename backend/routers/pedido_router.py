from fastapi import APIRouter, HTTPException, Depends, Form
from sqlmodel import select, join
from ..auth.auth import clienteActual, adminActual
from ..utils.enums import EstadoPedido
from ..models.pedido import Pedido, PedidoCreate, PedidoUpdate
from ..models.cliente import Cliente
from ..models.pago import Pago
from ..db.db import SessionDep

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])

# READ - Obtener la lista de pedidos del cliente
@router.get("/mis-pedidos", response_model=list[Pedido])
def misPedidos(session: SessionDep, cliente=Depends(clienteActual)):
    # Verificar los pedidos que existen y que sean de x cliente
    pedidosDB = session.exec(select(Pedido).join(Cliente, Pedido.clienteID == Cliente.id).where(Pedido.clienteID == cliente.id)).all()
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
    # Pedido con con id de cliente específico
    pedidoDB = session.exec(select(Pedido).join(Cliente, Pedido.clienteID == Cliente.id).where(Pedido.id == pedidoID)).first()
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
    # Obtener pedido con ese ID desde la DB
    pedidoDB = session.get(Pedido, pedidoID)
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
    # Obtener pedido con ese ID desde la DB
    pedidoDB = session.get(Pedido, pedidoID)
    if not pedidoDB:
        raise HTTPException(404, "Pedido no encontrado")
    
    # Cambiar estado del pedido a PAGADO
    pedidoDB.estado = EstadoPedido.PAGADO

    # Insertar pedido en la DB y guardar los cambios
    session.add(pedidoDB)
    session.commit()
    session.refresh(pedidoDB)
    return pedidoDB