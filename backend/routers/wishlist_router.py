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
    """
    Endpoint para agregar un producto a la wishlist
    """
    
    # Validar el producto
    productoDB = session.get(Producto, productoID)

    # Si no existe el producto, mostrar error
    if not productoDB or not productoDB.activo:
        raise HTTPException(404, "Producto no encontrado")
    
    # Validar la wishlist
    wishlistDB = session.exec(select(Wishlist).where(Wishlist.clienteID == cliente.id)).first()
    
    # Si no existe la wishlist, crearla
    if not wishlistDB:
        wishlistDB = Wishlist(clienteID=cliente.id)
        session.add(wishlistDB)
        session.commit()
        session.refresh(wishlistDB)

    # Validar si el producto ya está en la wishlist
    productoWishlist = session.exec(
        select(WishlistItem)
        .where(WishlistItem.wishlistID == wishlistDB.id, WishlistItem.productoID == productoID)
    ).first()

    # Si el producto ya está en la wishlist, mostrar error
    if productoWishlist:
        raise HTTPException(400, "El producto ya está en tu lista de deseos")
    
    # Agregar el producto a la wishlist
    wishlistItem = WishlistItem(
        wishlistID=wishlistDB.id,
        productoID=productoID
    )

    # Agregar el producto a la wishlist en la DB y guardar los cambios
    session.add(wishlistItem)
    session.commit()
    session.refresh(wishlistItem)
    return wishlistItem



# POST - Mover producto al carrito
@router.post("/mover-al-carrito/{productoID}")
def moverWishlistAlCarrito(productoID: int, session: SessionDep, cliente=Depends(clienteActual)):
    """
    Endpoint para mover un producto de la wishlist al carrito
    """
    
    # Validar la wishlist
    wishlistDB = session.exec(select(Wishlist).where(Wishlist.clienteID == cliente.id)).first()
    
    # Si no existe la wishlist, mostrar error
    if not wishlistDB:
        raise HTTPException(404, "No tienes una wishlist")

    # Validar el producto
    itemDB = session.exec(
        select(WishlistItem).where(
            WishlistItem.wishlistID == wishlistDB.id, WishlistItem.productoID == productoID
        )
    ).first()
    
    # Si el producto no está en la wishlist, mostrar error
    if not itemDB:
        raise HTTPException(404, "El producto no está en tu wishlist")
    
    # Validar el producto
    productoDB = session.get(Producto, productoID)
    
    # Si no existe el producto, mostrar error
    if not productoDB:
        raise HTTPException(404, "Producto no encontrado")

    # Obtener el carrito
    carritoDB = session.exec(select(Carrito).where(Carrito.clienteID == cliente.id)).first()
    
    # Si no existe el carrito, crearlo
    if not carritoDB:
        carrito = Carrito(clienteID=cliente.id)
        session.add(carrito)
        session.commit()
        session.refresh(carrito)
    else:
        carrito = carritoDB

    # Validar si el producto ya está en el carrito
    productoEnCarrito = session.exec(
        select(DetalleCarrito)
        .where(DetalleCarrito.carritoID == carrito.id, DetalleCarrito.productoID == productoID)
    ).first()
    
    # Si el producto ya está en el carrito, incrementar la cantidad
    if productoEnCarrito:
        productoEnCarrito.cantidad += 1
        productoEnCarrito.subtotal = productoDB.precio * productoEnCarrito.cantidad
        session.add(productoEnCarrito)
    else:
        # Si el producto no está en el carrito, agregarlo
        nuevoDetalle = DetalleCarrito(
            carritoID=carrito.id,
            productoID=productoID,
            cantidad=1,
            precioUnidad=productoDB.precio,
            subtotal=productoDB.precio * 1
        )
        
        # Agregar el producto al carrito en la DB
        session.add(nuevoDetalle)

    session.delete(itemDB)
    session.commit() # Guardar los cambios
    return {"mensaje": "Producto movido de la wishlist al carrito"}



# READ - Obtener el wishlist del cliente
@router.get("/mi-wishlist", response_model=list[WishlistItem])
def miWishlist(session: SessionDep, cliente=Depends(clienteActual)):
    """
    Endpoint para obtener el wishlist del cliente
    """
    
    # Validar la wishlist
    wishlistDB = session.exec(select(Wishlist).where(Wishlist.clienteID == cliente.id)).first()
    
    # Si no existe la wishlist, mostrar error
    if not wishlistDB:
        raise HTTPException(404, "No tienes una wishlist")
    
    # Obtener los items de la wishlist
    items = session.exec(select(WishlistItem).where(WishlistItem.wishlistID == wishlistDB.id)).all()
    return items



# DELETE - Eliminar un producto de la wishlist
@router.delete("/{productoID}", status_code=204)
def eliminarProductoDeWishlist(productoID: int, session: SessionDep, cliente=Depends(clienteActual)):
    """
    Endpoint para eliminar un producto de la wishlist
    """
    
    # Validar la wishlist
    wishlistDB = session.exec(select(Wishlist).where(Wishlist.clienteID == cliente.id)).first()
    
    # Si no existe la wishlist, mostrar error
    if not wishlistDB:
        raise HTTPException(404, "No tienes una wishlist")

    # Validar si el producto está en la wishlist
    productoWishlist = session.exec(
        select(WishlistItem)
        .where(WishlistItem.wishlistID == wishlistDB.id, WishlistItem.productoID == productoID)
    ).first()

    # Si el producto no está en la wishlist, mostrar error
    if not productoWishlist:
        raise HTTPException(404, "El producto no está en tu lista de deseos")

    session.delete(productoWishlist)
    session.commit()