from fastapi import APIRouter, HTTPException
from sqlmodel import select
from ..models.wishlistitem import WishlistItem, WishlistItemCreate
from ..db.db import SessionDep

router = APIRouter(prefix="/wishlistItems", tags=["WishlistItems"])

# CREATE - Crear un nuevo item para la lista de deseos
@router.post("/crear", response_model=WishlistItem, status_code=201)
def agregarWishlistItem(itemNuevo: WishlistItemCreate, session: SessionDep):
    item = WishlistItem.model_validate(itemNuevo)
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

# READ - Obtener la lista de items en la lista de deseos
@router.get("/wishlist/{wishlistID}", response_model=list[WishlistItem])
def listarItemsPorWishlist(wishlistID: int, session: SessionDep):
    items = session.exec(select(WishlistItem).where(WishlistItem.wishlistID == wishlistID)).all()
    return items

# DELETE - Eliminar un item de la lista de deseos por ID
@router.delete("/{itemID}", status_code=204)
def eliminarItem(itemID: int, session: SessionDep):
    item = session.get(WishlistItem, itemID)
    if not item:
        raise HTTPException(404, "Item no encontrado")
    session.delete(item)
    session.commit()