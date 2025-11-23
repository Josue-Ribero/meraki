from fastapi import APIRouter, HTTPException, Depends
from ..auth.auth import clienteActual
from sqlmodel import select
from ..models.transaccionPuntos import TransaccionPuntos
from ..db.db import SessionDep

router = APIRouter(prefix="/transacciones", tags=["TransaccionesPuntos"])

# READ - Obtener la lista de transacciones del cliente
@router.get("/mis-transacciones", response_model=list[TransaccionPuntos])
def misTransacciones(session: SessionDep, cliente = Depends(clienteActual)):
    """
    Endpoint para obtener la lista de transacciones del cliente
    """
    
    # Obtener la lista de transacciones del cliente
    transaccionesDB = session.exec(select(TransaccionPuntos).where(TransaccionPuntos.clienteID == cliente.id)).all()
    
    # Si no hay transacciones, mostrar error
    if not transaccionesDB:
        raise HTTPException(404, "No tienes transacciones")
    return transaccionesDB