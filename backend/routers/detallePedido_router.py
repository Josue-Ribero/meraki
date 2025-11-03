from fastapi import APIRouter, Depends, Form
from sqlmodel import select
from ..auth.auth import adminActual
from ..models.detallePedido import DetallePedido
from ..db.db import SessionDep

router = APIRouter(prefix="/detallePedido", tags=["DetallePedido"])

# READ - Obtener lista de pedidos por ID
@router.get("/pedido/{pedidoID}", response_model=list[DetallePedido])
def listaDetallesPorPedido(pedidoID: int, session: SessionDep):
    detallesPedidos = session.exec(select(DetallePedido).where(DetallePedido.pedidoID == pedidoID)).all()
    return detallesPedidos