from fastapi import APIRouter, HTTPException, Depends
from ..auth.auth import clienteActual
from sqlmodel import select
from ..models.carrito import Carrito, CarritoCreate
from ..db.db import SessionDep

router = APIRouter(prefix="/carrito", tags=["Carrito"])

# READ - Obtener el carrito del cliente logueado
@router.get("/mi-carrito", response_model=Carrito)
def miCarrito(session: SessionDep, cliente = Depends(clienteActual)):
    carritoDB = session.exec(select(Carrito).where(Carrito.clienteID == cliente.id)).first()
    if not carritoDB:
        raise HTTPException(404, "No tienes un carrito activo")
    return carritoDB