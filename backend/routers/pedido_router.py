from fastapi import APIRouter, HTTPException, Depends, Form
from ..auth.auth import clienteActual, adminActual
from ..utils.enums import EstadoPedido, TipoTransaccion
from sqlmodel import select
from ..models.pedido import Pedido, PedidoCreate, PedidoUpdate
from ..db.db import SessionDep

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])

# READ - Obtener la lista de pedidos del cliente
@router.get("/mis-pedidos", response_model=list[Pedido])
def misPedidos(session: SessionDep, cliente=Depends(clienteActual)):
    pedidosDB = session.exec(select(Pedido).where(Pedido.clienteID == cliente.id)).all()
    if not pedidosDB:
        raise HTTPException(404, "No tienes pedidos")
    return pedidosDB

# READ - Obtener lista de pedidos (solo administrador)
@router.get("/", response_model=list[Pedido])
def listaPedidos(session: SessionDep, _=Depends(adminActual)):
    pedidos = session.exec(select(Pedido)).all()
    return pedidos

# READ - Obtener pedido por ID (solo administrador)
@router.get("/{pedidoID}", response_model=Pedido)
def pedidoPorID(pedidoID: int, session: SessionDep, _=Depends(adminActual)):
    pedidoDB = session.get(Pedido, pedidoID)
    if not pedidoDB:
        raise HTTPException(404, "Pedido no encontrado")
    return pedidoDB

# UPDATE - Actualizar el estado del pedido (solo administrador)
@router.patch("/{pedidoID}", response_model=Pedido)
def actualizarEstado(
    pedidoID: int,
    estado: EstadoPedido = Form(...),
    session: SessionDep = None,
    _=Depends(adminActual)
):
    pedidoDB = session.get(Pedido, pedidoID)
    if not pedidoDB:
        raise HTTPException(404, "Pedido no encontrado")
    
    pedidoDB.estado = estado
    session.add(pedidoDB)
    session.commit()
    session.refresh(pedidoDB)
    return pedidoDB