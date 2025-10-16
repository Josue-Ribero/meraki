from fastapi import APIRouter, Depends
from sqlmodel import select
from ..auth.auth import adminActual
from ..models.detallePedido import DetallePedido, DetallePedidoCreate
from ..db.db import SessionDep

router = APIRouter(prefix="/detallePedido", tags=["DetallePedido"])

# CREATE - Crear un nuevo detalle de pedido
@router.post("/crear", response_model=DetallePedido, status_code=201)
def agregarDetallePedido(detalleNuevo: DetallePedidoCreate, session: SessionDep, admin=Depends(adminActual)):
    detalle = DetallePedido.model_validate(detalleNuevo, update={"administradorID": admin.id})
    session.add(detalle)
    session.commit()
    session.refresh(detalle)
    return detalle

# READ - Obtener lista de pedidos por ID
@router.get("/pedido/{pedidoID}", response_model=list[DetallePedido])
def listaDetallesPorPedido(pedidoID: int, session: SessionDep):
    detallesPedidos = session.exec(select(DetallePedido).where(DetallePedido.pedidoID == pedidoID)).all()
    return detallesPedidos