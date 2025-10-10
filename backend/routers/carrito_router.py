from fastapi import APIRouter, HTTPException
from sqlmodel import select
from ..models.carrito import Carrito, CarritoCreate
from ..db.db import SessionDep

router = APIRouter(prefix="/carrito", tags=["Carrito"])

# READ - Obtener el carrito por cada cliente
@router.get("/cliente/{clienteID}", response_model=Carrito)
def carritoPorCliente(clienteID: int, session: SessionDep):
    carritoDB = session.exec(select(Carrito).where(Carrito.clienteID == clienteID)).first()
    if not carritoDB:
        raise HTTPException(404, "Carrito no encontrado")
    return carritoDB