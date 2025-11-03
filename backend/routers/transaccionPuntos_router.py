from fastapi import APIRouter, HTTPException, Depends
from ..auth.auth import clienteActual
from sqlmodel import select
from ..models.transaccionPuntos import TransaccionPuntos
from ..db.db import SessionDep

router = APIRouter(prefix="/transacciones", tags=["TransaccionesPuntos"])

# READ - Obtener la lista de transacciones del cliente
@router.get("/mis-transacciones", response_model=list[TransaccionPuntos])
def misTransacciones(session: SessionDep, cliente = Depends(clienteActual)):
    transaccionesDB = session.exec(select(TransaccionPuntos).where(TransaccionPuntos.clienteID == cliente.id)).all()
    if not transaccionesDB:
        raise HTTPException(404, "No tienes transacciones")
    return transaccionesDB