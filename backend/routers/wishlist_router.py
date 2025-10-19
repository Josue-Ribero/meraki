from fastapi import APIRouter, HTTPException, Depends
from ..auth.auth import clienteActual
from sqlmodel import select
from ..models.wishlist import Wishlist
from ..models.wishlistItem import WishlistItem, WishlistItemCreate
from ..models.carrito import Carrito
from ..models.detalleCarrito import DetalleCarrito
from ..models.producto import Producto
from ..db.db import SessionDep

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])

# CREATE - Agregar producto a la wishlist
@router.post("/agregar-producto", status_code=201, response_model=WishlistItem)
def agregarProductoAWishlist(nuevoProducto: WishlistItemCreate, session: SessionDep, cliente=Depends(clienteActual)):
    # Verificar si el producto existe
    productoDB = session.get(Producto, nuevoProducto.productoID)
    if not productoDB or not productoDB.activo:
        raise HTTPException(404, "Producto no encontrado")
    
    # Obtener o crear wishlist del cliente (una sola wishlist por cliente)
    wishlistDB = session.exec(select(Wishlist).where(Wishlist.clienteID == cliente.id)).first()
    if not wishlistDB:
        wishlistDB = Wishlist(clienteID=cliente.id)
        session.add(wishlistDB)
        session.commit()
        session.refresh(wishlistDB)

    # Verificar si el producto ya está en la wishlist
    productoWishlist = session.exec(
        select(WishlistItem)
        .where(WishlistItem.wishlistID == wishlistDB.id, WishlistItem.productoID == nuevoProducto.productoID)
    ).first()

    # Si el producto ya está en la wishlist
    if productoWishlist:
        raise HTTPException(400, "El producto ya está en tu lista de deseos")
    
    wishlistItem = WishlistItem(
        wishlistID=wishlistDB.id,
        productoID=nuevoProducto.productoID
    )

    session.add(wishlistItem)
    session.commit()
    session.refresh(wishlistItem)
    return wishlistItem



# POST - Mover producto al carrito
@router.post("/mover-al-carrito/{productoID}")
def moverWishlistAlCarrito(productoID: int, session: SessionDep, cliente=Depends(clienteActual)):
    # Verificar que exista la wishlist
    wishlistDB = session.exec(select(Wishlist).where(Wishlist.clienteID == cliente.id)).first()
    if not wishlistDB:
        raise HTTPException(404, "No tienes una wishlist")

    # Buscar el producto en la wishlist del cliente
    itemDB = session.exec(
        select(WishlistItem).where(
            WishlistItem.wishlistID == wishlistDB.id, WishlistItem.productoID == productoID
        )
    ).first()
    # Si no existe el item en la wishlist
    if not itemDB:
        raise HTTPException(404, "El producto no está en tu wishlist")

    # Obtener o crear el carrito del cliente
    carritoDB = session.exec(select(Carrito).where(Carrito.clienteID == cliente.id)).first()
    if not carritoDB:
        carrito = Carrito(clienteID=cliente.id)
        session.add(carrito)
        session.commit()
        session.refresh(carrito)
    else:
        carrito = carritoDB

    # Verificar si el producto ya está en el carrito. Si ya esta, aumenta cantidad
    productoEnCarrito = session.exec(
        select(DetalleCarrito)
        .where(DetalleCarrito.carritoID == carrito.id, DetalleCarrito.productoID == productoID)
    ).first()
    # Si ya esta en el carrito
    if productoEnCarrito:
        productoEnCarrito.cantidad += 1
        productoEnCarrito.subtotal = productoEnCarrito.precioUnidad * productoEnCarrito.cantidad
        session.add(productoEnCarrito)
    # Si no esta en el carrito
    else:
        nuevoDetalle = DetalleCarrito(
            carritoID=carrito.id,
            productoID=productoID,
            cantidad=1
        )
        session.add(nuevoDetalle) # Agregar a la DB

    # Eliminar el producto de la wishlist
    session.delete(itemDB)
    session.commit() # Guardar los cambios
    return {"mensaje": "Producto movido de la wishlist al carrito"}



# READ - Obtener el wishlist del cliente
@router.get("/mi-wishlist", response_model=list[WishlistItem])
def miWishlist(session: SessionDep, cliente=Depends(clienteActual)):
    # Verificar que exista la wishlist
    wishlistDB = session.exec(select(Wishlist).where(Wishlist.clienteID == cliente.id)).first()
    if not wishlistDB:
        raise HTTPException(404, "No tienes una wishlist")
    
    # Obtener los items de la wishlist
    items = session.exec(select(WishlistItem).where(WishlistItem.wishlistID == wishlistDB.id)).all()
    return items # Devuelve la lista de items



# DELETE - Eliminar un producto de la wishlist
@router.delete("/{productoID}", status_code=204)
def eliminarProductoDeWishlist(productoID: int, session: SessionDep, cliente=Depends(clienteActual)):
    # Verificar que exista la wishlist
    wishlistDB = session.exec(select(Wishlist).where(Wishlist.clienteID == cliente.id)).first()
    if not wishlistDB:
        raise HTTPException(404, "No tienes una wishlist")

    # Verifica que exista el producto en la wishlist
    productoWishlist = session.exec(
        select(WishlistItem)
        .where(WishlistItem.wishlistID == wishlistDB.id, WishlistItem.productoID == productoID)
    ).first()

    # Si el producto no esta en la lista
    if not productoWishlist:
        raise HTTPException(404, "El producto no está en tu lista de deseos")

    session.delete(productoWishlist) # Elimina el producto
    session.commit() # Guarda los cambios