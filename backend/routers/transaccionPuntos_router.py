from fastapi import APIRouter, HTTPException, Depends
from ..auth.auth import clienteActual
from sqlmodel import select
from ..models.transaccionPuntos import TransaccionPuntos, TransaccionPuntosCreate
from ..db.db import SessionDep

router = APIRouter(prefix="/transacciones", tags=["TransaccionesPuntos"])

# CREATE - Crear una nueva transaccion de puntos
@router.post("/crear", response_model=TransaccionPuntos, status_code=201)
def crearTransaccion(transaccionNueva: TransaccionPuntosCreate, session: SessionDep, cliente = Depends(clienteActual)):
    # Asociar transaccion al cliente
    transaccion = TransaccionPuntos(clienteID=cliente.id)
    #transaccion = TransaccionPuntos.model_validate(transaccionNueva)
    session.add(transaccion)
    session.commit()
    session.refresh(transaccion)
    return transaccion

# READ - Obtener la lista de transacciones del cliente
@router.get("/mis-transacciones", response_model=list[TransaccionPuntos])
def misTransacciones(session: SessionDep, cliente = Depends(clienteActual)):
    transaccionesDB = session.exec(select(TransaccionPuntos).where(TransaccionPuntos.clienteID == cliente.id)).all()
    if not transaccionesDB:
        raise HTTPException(404, "No tienes transacciones")
    return transaccionesDB