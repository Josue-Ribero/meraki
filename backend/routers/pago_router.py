from fastapi import APIRouter, HTTPException
from sqlmodel import select
from ..models.pago import Pago, PagoCreate
from ..db.db import SessionDep

router = APIRouter(prefix="/pagos", tags=["Pagos"])

# CREATE - Crear un pago
@router.post("/crear", response_model=Pago, status_code=201)
def crearPago(nuevoPago: PagoCreate, session: SessionDep):
    pago = Pago.model_validate(nuevoPago)
    session.add(pago)
    session.commit()
    session.refresh(pago)
    return pago

# READ - Obtener lista de pagos
@router.get("/", response_model=list[Pago])
def listaPagos(session: SessionDep):
    pagos = session.exec(select(Pago)).all()
    return pagos