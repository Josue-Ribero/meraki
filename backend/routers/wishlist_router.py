from fastapi import APIRouter, HTTPException, Depends, Form
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
def agregarProductoAWishlist(
    productoID: int = Form(...),
    session: SessionDep = None, 
    cliente=Depends(clienteActual)
):
    productoDB = session.get(Producto, productoID)
    if not productoDB or not productoDB.activo:
        raise HTTPException(404, "Producto no encontrado")
    
    wishlistDB = session.exec(select(Wishlist).where(Wishlist.clienteID == cliente.id)).first()
    if not wishlistDB:
        wishlistDB = Wishlist(clienteID=cliente.id)
        session.add(wishlistDB)
        session.commit()
        session.refresh(wishlistDB)

    productoWishlist = session.exec(
        select(WishlistItem)
        .where(WishlistItem.wishlistID == wishlistDB.id, WishlistItem.productoID == productoID)
    ).first()

    if productoWishlist:
        raise HTTPException(400, "El producto ya está en tu lista de deseos")
    
    wishlistItem = WishlistItem(
        wishlistID=wishlistDB.id,
        productoID=productoID
    )

    session.add(wishlistItem)
    session.commit()
    session.refresh(wishlistItem)
    return wishlistItem

# POST - Mover producto al carrito
@router.post("/mover-al-carrito/{productoID}")
def moverWishlistAlCarrito(productoID: int, session: SessionDep, cliente=Depends(clienteActual)):
    wishlistDB = session.exec(select(Wishlist).where(Wishlist.clienteID == cliente.id)).first()
    if not wishlistDB:
        raise HTTPException(404, "No tienes una wishlist")

    itemDB = session.exec(
        select(WishlistItem).where(
            WishlistItem.wishlistID == wishlistDB.id, WishlistItem.productoID == productoID
        )
    ).first()
    if not itemDB:
        raise HTTPException(404, "El producto no está en tu wishlist")
    
    productoDB = session.get(Producto, productoID)
    if not productoDB:
        raise HTTPException(404, "Producto no encontrado")

    carritoDB = session.exec(select(Carrito).where(Carrito.clienteID == cliente.id)).first()
    if not carritoDB:
        carrito = Carrito(clienteID=cliente.id)
        session.add(carrito)
        session.commit()
        session.refresh(carrito)
    else:
        carrito = carritoDB

    productoEnCarrito = session.exec(
        select(DetalleCarrito)
        .where(DetalleCarrito.carritoID == carrito.id, DetalleCarrito.productoID == productoID)
    ).first()
    
    if productoEnCarrito:
        productoEnCarrito.cantidad += 1
        productoEnCarrito.subtotal = productoDB.precio * productoEnCarrito.cantidad
        session.add(productoEnCarrito)
    else:
        nuevoDetalle = DetalleCarrito(
            carritoID=carrito.id,
            productoID=productoID,
            cantidad=1,
            precioUnidad=productoDB.precio,
            subtotal=productoDB.precio * 1
        )
        session.add(nuevoDetalle)

    session.delete(itemDB)
    session.commit()
    return {"mensaje": "Producto movido de la wishlist al carrito"}

# READ - Obtener el wishlist del cliente
@router.get("/mi-wishlist", response_model=list[WishlistItem])
def miWishlist(session: SessionDep, cliente=Depends(clienteActual)):
    wishlistDB = session.exec(select(Wishlist).where(Wishlist.clienteID == cliente.id)).first()
    if not wishlistDB:
        raise HTTPException(404, "No tienes una wishlist")
    
    items = session.exec(select(WishlistItem).where(WishlistItem.wishlistID == wishlistDB.id)).all()
    return items

# DELETE - Eliminar un producto de la wishlist
@router.delete("/{productoID}", status_code=204)
def eliminarProductoDeWishlist(productoID: int, session: SessionDep, cliente=Depends(clienteActual)):
    wishlistDB = session.exec(select(Wishlist).where(Wishlist.clienteID == cliente.id)).first()
    if not wishlistDB:
        raise HTTPException(404, "No tienes una wishlist")

    productoWishlist = session.exec(
        select(WishlistItem)
        .where(WishlistItem.wishlistID == wishlistDB.id, WishlistItem.productoID == productoID)
    ).first()

    if not productoWishlist:
        raise HTTPException(404, "El producto no está en tu lista de deseos")

    session.delete(productoWishlist)
    session.commit()