from fastapi import APIRouter, HTTPException, Depends
from ..auth.auth import clienteActual
from sqlmodel import select
from ..models.carrito import Carrito, CarritoCreate
from ..db.db import SessionDep

router = APIRouter(prefix="/carrito", tags=["Carrito"])

# CREATE - Crear carrito del cliente logueado
@router.post("/crear", response_model=Carrito, status_code=201)
def crearCarrito(nuevoCarrito: CarritoCreate, session: SessionDep,cliente = Depends(clienteActual)):
    # Asociar el carrito con el cliente logueado
    carrito = Carrito(clienteID=cliente.id).model_validate(nuevoCarrito)
    session.add(carrito)
    session.commit()
    session.refresh(carrito)
    return carrito



# READ - Obtener el carrito del cliente logueado
@router.get("/mi-carrito", response_model=Carrito)
def miCarrito(session: SessionDep, cliente = Depends(clienteActual)):
    carritoDB = session.exec(select(Carrito).where(Carrito.clienteID == cliente.id)).first()
    if not carritoDB:
        raise HTTPException(404, "No tienes un carrito activo")
    return carritoDB