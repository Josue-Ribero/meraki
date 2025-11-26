from fastapi import APIRouter, Depends, Form
from sqlmodel import select
from sqlalchemy.orm import selectinload
from ..auth.auth import adminActual
from ..models.detallePedido import DetallePedido, DetallePedidoBase, DetallePedidoRead
from ..db.db import SessionDep

router = APIRouter(prefix="/detallePedido", tags=["DetallePedido"])

# READ - Obtener lista de pedidos por ID
@router.get("/pedido/{pedidoID}", response_model=list[DetallePedidoRead])
def listaDetallesPorPedido(pedidoID: int, session: SessionDep):
    """
    Endpoint para obtener la lista de detalles de pedido por ID de pedido
    """
    
    # Obtener detalles de pedido con los productos y diseños cargados
    detallesPedidos = session.exec(
        select(DetallePedido)
        .where(DetallePedido.pedidoID == pedidoID)
        .options(
            selectinload(DetallePedido.producto),
            selectinload(DetallePedido.disenoPersonalizado)
        )
    ).all()
    return detallesPedidos