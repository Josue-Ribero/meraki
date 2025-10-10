from fastapi import APIRouter, HTTPException, Depends
from ..auth.auth import clienteActual
from sqlmodel import select
from ..models.wishlist import Wishlist, WishlistCreate
from ..db.db import SessionDep

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])

# CREATE - Crear una nueva lista de deseos
@router.post("/crear", response_model=Wishlist, status_code=201)
def crearWishlist(nuevaWishlist: WishlistCreate, session: SessionDep, cliente = Depends(clienteActual)):
    # Asociar la wishlist al cliente
    wishlist = Wishlist(clienteID=cliente.id)
    # wishlist = Wishlist.model_validate(nuevaWishlist)
    session.add(wishlist)
    session.commit()
    session.refresh(wishlist)
    return wishlist

# READ - Obtener el wishlist del cliente
@router.get("/mi-wishlist", response_model=Wishlist)
def miWishlist(session: SessionDep, cliente = Depends(clienteActual)):
    wishlistDB = session.exec(select(Wishlist).where(Wishlist.clienteID == cliente.id)).first()
    if not wishlistDB:
        raise HTTPException(404, "No tienes una wishlist")
    return wishlistDB