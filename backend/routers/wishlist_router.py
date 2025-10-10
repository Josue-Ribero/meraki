from fastapi import APIRouter, HTTPException
from sqlmodel import select
from ..models.wishlist import Wishlist, WishlistCreate
from ..db.db import SessionDep

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])

# CREATE - Crear una nueva lista de deseos
@router.post("/crear", response_model=Wishlist, status_code=201)
def crearWishlist(nuevaWishlist: WishlistCreate, session: SessionDep):
    wishlist = Wishlist.model_validate(nuevaWishlist)
    session.add(wishlist)
    session.commit()
    session.refresh(wishlist)
    return wishlist

# READ - Obtener la lista de deseos por cada cliente
@router.get("/cliente/{clienteID}", response_model=Wishlist)
def wishlistPorCliente(clienteID: int, session: SessionDep):
    wishlistDB = session.exec(select(Wishlist).where(Wishlist.clienteID == clienteID)).first()
    if not wishlistDB:
        raise HTTPException(404, "Wishlist no encontrada")
    return wishlistDB