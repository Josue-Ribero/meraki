from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from ..models.wishlistitem import WishlistItem, WishlistItemCreate
from ..models.wishlist import Wishlist
from ..auth.auth import clienteActual
from ..db.db import SessionDep

router = APIRouter(prefix="/wishlistItems", tags=["WishlistItems"])

# CREATE - Crear un nuevo item para la lista de deseos
@router.post("/crear", status_code=201)
def agregarItem(itemNuevo: WishlistItemCreate, session: SessionDep, cliente=Depends(clienteActual)):
    # Verificar que el cliente sea el correcto
    wishlist = session.exec(select(Wishlist).where(Wishlist.clienteID == cliente.id)).first()
    if not wishlist:
        raise HTTPException(404, "Wishlist no encontrada")
    
    # Verifica si existe el wishlist item en la wishlist
    itemDB = session.exec(select(WishlistItem).where(WishlistItem.id == wishlist.id, WishlistItem.productoID == itemNuevo.productoID)).first()
    if itemDB:
        raise HTTPException(400, "Producto ya esta en la wishlist")
    
    # Crea un nuevo item
    nuevo = WishlistItem(wishlistID=wishlist.id, productoID=itemNuevo.productoID)

    # Agrega el item a la DB
    session.add(nuevo)
    session.commit()
    session.refresh(nuevo)
    return nuevo



@router.post("/crear", status_code=201)
def agregarItem(
    nuevoItem: WishlistItemCreate, session: SessionDep, cliente=Depends(clienteActual)):

    # Verificar si existe la wishlist
    wishlist = session.exec(select(Wishlist).where(Wishlist.clienteID == cliente.id)).first()
    if not wishlist:
        wishlist = Wishlist(clienteID=cliente.id)
        session.add(wishlist)
        session.flush()

    # Verificar si el producto ya esta en la wishlist
    existe = session.exec(
        select(WishlistItem).where(
            WishlistItem.wishlistID == wishlist.id,
            WishlistItem.productoID == nuevoItem.productoID,
        )
    ).first()

    if existe:
        raise HTTPException(400, "Producto ya en la lista")
    
    # Crea el nuevo item
    item = WishlistItem(wishlistID=wishlist.id, productoID=nuevoItem.productoID)
    session.add(item) # Inserta en la DB
    session.commit() # Guarda los cambios
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