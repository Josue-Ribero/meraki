from fastapi import APIRouter, HTTPException
from sqlmodel import select
from ..models.pedido import Pedido, PedidoCreate, PedidoUpdate
from ..db.db import SessionDep

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])

# CREATE - Crear un pedido
@router.post("/crear", response_model=Pedido, status_code=201)
def crearPedido(nuevoPedido: PedidoCreate, session: SessionDep):
    pedido = Pedido.model_validate(nuevoPedido)
    session.add(pedido)
    session.commit()
    session.refresh(pedido)
    return pedido

# READ - Obtener lista de pedidos y por ID
@router.get("/", response_model=list[Pedido])
def listaPedidos(session: SessionDep):
    pedidos = session.exec(select(Pedido)).all()
    return pedidos

@router.get("/{pedidoID}", response_model=Pedido)
def pedidoPorID(pedidoID: int, session: SessionDep):
    pedidoDB = session.get(Pedido, pedidoID)
    if not pedidoDB:
        raise HTTPException(404, "Pedido no encontrado")
    return pedidoDB

# UPDATE - Actualizar el estado del pedido (solo administrador)
@router.patch("/{pedidoID}", response_model=Pedido)
def actualizarEstado(pedidoID: int, pedidoData: PedidoUpdate, session: SessionDep):
    pedidoDB = session.get(Pedido, pedidoID)
    if not pedidoDB:
        raise HTTPException(404, "Pedido no encontrado")
    pedidoDB.sqlmodel_update(pedidoData)
    session.add(pedidoDB)
    session.commit()
    session.refresh(pedidoDB)
    return pedidoDB