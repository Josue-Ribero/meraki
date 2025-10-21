from fastapi import APIRouter, HTTPException, Depends
from ..auth.auth import clienteActual
from sqlmodel import select, delete
from ..models.carrito import Carrito
from ..models.detalleCarrito import DetalleCarrito, DetalleCarritoCreate
from ..models.producto import Producto
from ..models.pedido import Pedido
from ..db.db import SessionDep

router = APIRouter(prefix="/carrito", tags=["Carrito"])

# CREATE - Agregar producto al carrito
@router.post("/agregar-producto", status_code=201, response_model=DetalleCarrito)
def agregarCarrito(
    nuevoDetalle: DetalleCarritoCreate, 
    session: SessionDep, 
    cliente=Depends(clienteActual)
):
    # Verificar si el producto existe
    productoDB = session.get(Producto, nuevoDetalle.productoID)
    if not productoDB or not productoDB.activo:
        raise HTTPException(404, "Producto no encontrado")
    
    # Verificar que existe el carrito asignado a un cliente
    carritoDB = session.exec(select(Carrito).where(Carrito.clienteID == cliente.id)).first()
    if not carritoDB:
        raise HTTPException(404, "No tienes un carrito asignado")


    # Verificar si el producto ya está en el carrito
    productoCarrito = session.exec(
        select(DetalleCarrito)
        .where(DetalleCarrito.carritoID == carritoDB.id, DetalleCarrito.productoID == nuevoDetalle.productoID)
    ).first()

    # Si el producto ya está en el carrito
    if productoCarrito:
        raise HTTPException(400, "El producto ya está en tu carrito")
    
    productoCarrito = DetalleCarrito(
        carritoID=carritoDB.id,
        productoID=nuevoDetalle.productoID,
        cantidad=nuevoDetalle.cantidad,
        precioUnidad=productoDB.precio,
        subtotal=productoDB.precio * nuevoDetalle.cantidad
    )

    session.add(productoCarrito)
    session.commit()
    session.refresh(productoCarrito)
    return productoCarrito



# CREATE - Convertir el carrito en un pedido
router.post("/pedir", response_model=Pedido)



# READ - Obtener el carrito del cliente
@router.get("/mi-carrito", response_model=list[DetalleCarrito])
def miCarrito(session: SessionDep, cliente=Depends(clienteActual)):
    # Verificar que existe el carrito asignado a un cliente
    carritoDB = session.exec(select(Carrito).where(Carrito.clienteID == cliente.id)).first()
    if not carritoDB:
        raise HTTPException(404, "No tienes un carrito asignado")
    
    # Lista de productos en el carrito
    detalles = session.exec(select(DetalleCarrito).where(DetalleCarrito.carritoID == carritoDB.id)).all()
    return detalles



# UPDATE - Actualizar la cantidad de un producto
@router.patch("/actualizar-cantidad/{productoID}", response_model=DetalleCarrito)
def actualizarCantidad(productoID: int, cantidad: int, session: SessionDep, cliente=Depends(clienteActual)):
    # Verificar que existe el carrito asignado a un cliente
    carritoDB = session.exec(select(Carrito).where(Carrito.clienteID == cliente.id)).first()
    if not carritoDB:
        raise HTTPException(404, "No tienes un carrito asignado")
    
    # Verificar si el producto esta en el carrito
    detalle = session.exec(
        select(DetalleCarrito)
        .where(DetalleCarrito.carritoID == carritoDB.id, DetalleCarrito.productoID == productoID)
    ).first()
    if not detalle:
        raise HTTPException(404, "El producto no está en tu carrito")
    
    # Verificar que la cantidad sea mayor a 0
    if cantidad <= 0:
        raise HTTPException(400, "La cantidad debe ser mayor que cero")

    # Actualizar datos
    detalle.cantidad = cantidad
    detalle.subtotal = detalle.precioUnidad * cantidad
    session.add(detalle) # Insertar en la DB
    session.commit() # Guardar los cambios
    session.refresh(detalle)
    return detalle



# DELETE - Eliminar un producto del carrito
@router.delete("/{productoID}", status_code=200)
def eliminarDeCarrito(productoID: int, session: SessionDep, cliente=Depends(clienteActual)):
    # Verificar que existe el carrito asignado a un cliente
    carritoDB = session.exec(select(Carrito).where(Carrito.clienteID == cliente.id)).first()
    if not carritoDB:
        raise HTTPException(404, "No tienes un carrito asignado")
    
    # Crear los detalles del carrito
    detalles = session.exec(
        select(DetalleCarrito)
        .where(DetalleCarrito.carritoID == carritoDB.id, DetalleCarrito.productoID == productoID)
    ).first()
    # Si el producto no esta en el carrito
    if not detalles:
        raise HTTPException(404, "El producto no está en tu carrito")

    session.delete(detalles) # Elimina el producto
    session.commit() # Guarda los cambios

    return {"mensaje": "Producto eliminado del carrito"}

# DELETE - Vaciar todo el carrito
@router.delete("/vaciar", status_code=200)
def vaciarCarrito(session: SessionDep, cliente=Depends(clienteActual)):
# Verificar que existe el carrito asignado a un cliente
    carritoDB = session.exec(select(Carrito).where(Carrito.clienteID == cliente.id)).first()
    if not carritoDB:
        raise HTTPException(404, "No tienes un carrito asignado")

    session.exec(delete(DetalleCarrito).where(DetalleCarrito.carritoID == carritoDB.id))
    session.commit()
    return {"mensaje": "Carrito vaciado correctamente"}