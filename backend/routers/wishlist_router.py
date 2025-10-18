from fastapi import APIRouter, HTTPException, Depends
from ..auth.auth import clienteActual
from sqlmodel import select
from ..models.wishlist import Wishlist, WishlistCreate
from ..models.producto import Producto
from ..db.db import SessionDep

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])

# CREATE - Agregar producto a la wishlist
@router.post("/agregar-producto", status_code=201, response_model=Wishlist)
def agregarWishlist(
    nuevoProducto: WishlistCreate, 
    session: SessionDep, 
    cliente=Depends(clienteActual)
):
    # Verificar si el producto existe
    productoDB = session.get(Producto, nuevoProducto.productoID)
    if not productoDB or not productoDB.activo:
        raise HTTPException(404, "Producto no encontrado")

    # Verificar si ya está en la wishlist
    productoWishlist = session.exec(
        select(Wishlist)
        .where(Wishlist.clienteID == cliente.id, Wishlist.productoID == nuevoProducto.productoID)
    ).first()

    # Si el producto ya está en la wishlist
    if productoWishlist:
        raise HTTPException(400, "El producto ya está en tu lista de deseos")

    wishlist = Wishlist(clienteID=cliente.id, productoID=nuevoProducto.productoID)
    session.add(wishlist)
    session.commit()
    session.refresh(wishlist)
    return wishlist



# READ - Obtener el wishlist del cliente
@router.get("/mi-wishlist", response_model=list[Wishlist])
def miWishlist(session: SessionDep, cliente=Depends(clienteActual)):
    # Verificar que exista la wishlist
    wishlistDB = session.exec(select(Wishlist).where(Wishlist.clienteID == cliente.id)).all()
    if not wishlistDB:
        raise HTTPException(404, "No tienes una wishlist")
    return wishlistDB

# DELETE - Eliminar un producto de la wishlist
@router.delete("/{productoID}", status_code=204)
def eliminarDeWishlist(productoID: int, session: SessionDep, cliente=Depends(clienteActual)):
    # Verifica que exista el producto en la wishlist
    productoWishlist = session.exec(
        select(Wishlist)
        .where(Wishlist.clienteID == cliente.id, Wishlist.productoID == productoID)
    ).first()

    # Si el producto no esta en la lista
    if not productoWishlist:
        raise HTTPException(404, "El producto no está en tu lista de deseos")

    session.delete(productoWishlist) # Elimina el producto
    session.commit() # Guarda los cambios