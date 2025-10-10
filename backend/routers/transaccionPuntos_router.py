from fastapi import APIRouter, HTTPException
from sqlmodel import select
from ..models.transaccionPuntos import TransaccionPuntos, TransaccionPuntosCreate
from ..db.db import SessionDep

router = APIRouter(prefix="/transacciones", tags=["TransaccionesPuntos"])

# CREATE - Crear una nueva transaccion de puntos
@router.post("/crear", response_model=TransaccionPuntos, status_code=201)
def crearTransaccion(transaccionNueva: TransaccionPuntosCreate, session: SessionDep):
    transaccion = TransaccionPuntos.model_validate(transaccionNueva)
    session.add(transaccion)
    session.commit()
    session.refresh(transaccion)
    return transaccion

# READ - Obtener la lista de transacciones por cliente
@router.get("/cliente/{clienteID}", response_model=list[TransaccionPuntos])
def listaTransaccionesPorCliente(clienteID: int, session: SessionDep):
    transacciones = session.exec(select(TransaccionPuntos).where(TransaccionPuntos.clienteID == clienteID)).all()
    return transacciones