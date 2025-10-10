from fastapi import APIRouter, HTTPException, Depends
from ..auth.auth import clienteActual, adminActual
from sqlmodel import select
from ..models.pedido import Pedido, PedidoCreate, PedidoUpdate
from ..db.db import SessionDep

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])

# CREATE - Crear un pedido
@router.post("/crear", response_model=Pedido, status_code=201)
def crearPedido(nuevoPedido: PedidoCreate, session: SessionDep, cliente = Depends(clienteActual)):
    # Asociar pedido al cliente
    pedido = Pedido(clienteID=cliente.id)
    #pedido = Pedido.model_validate(nuevoPedido)
    session.add(pedido)
    session.commit()
    session.refresh(pedido)
    return pedido

# READ - Obtener la lista de pedidos del cliente
@router.get("/mis-pedidos", response_model=list[Pedido])
def misPedidos(session: SessionDep, cliente = Depends(clienteActual)):
    pedidosDB = session.exec(select(Pedido).where(Pedido.clienteID == cliente.id)).all()
    if not pedidosDB:
        raise HTTPException(404, "No tienes transacciones")
    return pedidosDB

# READ - Obtener lista de pedidos (solo administrador)
@router.get("/", response_model=list[Pedido])
def listaPedidos(session: SessionDep, admin = Depends(adminActual)):
    pedidos = session.exec(select(Pedido)).all()
    return pedidos

# READ - Obtener lista de pedidos por ID (solo administrador)
@router.get("/{pedidoID}", response_model=Pedido)
def pedidoPorID(pedidoID: int, session: SessionDep, admin = Depends(adminActual)):
    pedidoDB = session.get(Pedido, pedidoID)
    if not pedidoDB:
        raise HTTPException(404, "Pedido no encontrado")
    return pedidoDB

# UPDATE - Actualizar el estado del pedido (solo administrador)
@router.patch("/{pedidoID}", response_model=Pedido)
def actualizarEstado(pedidoID: int, pedidoData: PedidoUpdate, session: SessionDep, admin = Depends(adminActual)):
    pedidoDB = session.get(Pedido, pedidoID)
    if not pedidoDB:
        raise HTTPException(404, "Pedido no encontrado")
    pedidoDB.sqlmodel_update(pedidoData)
    session.add(pedidoDB)
    session.commit()
    session.refresh(pedidoDB)
    return pedidoDB