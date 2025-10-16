from fastapi import APIRouter, HTTPException, Depends
from ..auth.auth import clienteActual
from sqlmodel import select
from ..models.wishlist import Wishlist, WishlistCreate
from ..db.db import SessionDep

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])

# READ - Obtener el wishlist del cliente
@router.get("/mi-wishlist", response_model=Wishlist)
def miWishlist(session: SessionDep, cliente = Depends(clienteActual)):
    wishlistDB = session.exec(select(Wishlist).where(Wishlist.clienteID == cliente.id)).first()
    if not wishlistDB:
        raise HTTPException(404, "No tienes una wishlist")
    return wishlistDB