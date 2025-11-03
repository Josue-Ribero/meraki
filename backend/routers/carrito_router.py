from fastapi import APIRouter, HTTPException, Depends, Form
from ..auth.auth import clienteActual
from sqlmodel import select, delete
from ..models.carrito import Carrito
from ..models.detalleCarrito import DetalleCarrito, DetalleCarritoCreate
from ..models.producto import Producto
from ..models.pedido import Pedido
from ..models.direccionEnvio import DireccionEnvio
from ..models.detallePedido import DetallePedido
from ..utils.enums import EstadoPedido
from ..db.db import SessionDep

router = APIRouter(prefix="/carrito", tags=["Carrito"])

# CREATE - Agregar producto al carrito
@router.post("/agregar-producto", status_code=201, response_model=DetalleCarrito)
def agregarCarrito(
    productoID: int = Form(...),
    cantidad: int = Form(1),
    session: SessionDep = None, 
    cliente=Depends(clienteActual)
):
    productoDB = session.get(Producto, productoID)
    if not productoDB or not productoDB.activo:
        raise HTTPException(404, "Producto no encontrado")
    
    carritoDB = session.exec(select(Carrito).where(Carrito.clienteID == cliente.id)).first()
    if not carritoDB:
        raise HTTPException(404, "No tienes un carrito asignado")

    productoCarrito = session.exec(
        select(DetalleCarrito)
        .where(DetalleCarrito.carritoID == carritoDB.id, DetalleCarrito.productoID == productoID)
    ).first()

    if productoCarrito:
        raise HTTPException(400, "El producto ya está en tu carrito")
    
    productoCarrito = DetalleCarrito(
        carritoID=carritoDB.id,
        productoID=productoID,
        cantidad=cantidad,
        precioUnidad=productoDB.precio,
        subtotal=productoDB.precio * cantidad
    )

    session.add(productoCarrito)
    session.commit()
    session.refresh(productoCarrito)
    return productoCarrito

# CREATE - Convertir el carrito en un pedido (SIN PAGO)
@router.post("/pedir", response_model=Pedido)
def crearPedidoDesdeCarrito(
    session: SessionDep = None,
    cliente=Depends(clienteActual)
):
    carritoDB = session.exec(select(Carrito).where(Carrito.clienteID == cliente.id)).first()
    if not carritoDB or not carritoDB.detalles:
        raise HTTPException(400, "Carrito vacío")

    direccion = session.exec(
        select(DireccionEnvio).where(
            DireccionEnvio.clienteID == cliente.id,
            DireccionEnvio.esPredeterminada == True,
        )
    ).first()
    if not direccion:
        direccion = session.exec(select(DireccionEnvio).where(DireccionEnvio.clienteID == cliente.id)).first()
    if not direccion:
        raise HTTPException(400, "Necesitas una dirección")

    pedido = Pedido(
        clienteID=cliente.id,
        direccionEnvioID=direccion.id,
        estado=EstadoPedido.PENDIENTE,
        pagadoConPuntos=False,
        total=0,
    )
    session.add(pedido)
    session.flush()

    total = 0
    for detalle in carritoDB.detalles:
        detallePedido = DetallePedido(
            pedidoID=pedido.id,
            productoID=detalle.productoID,
            disenoID=detalle.disenoID,
            cantidad=detalle.cantidad,
            precioUnidad=detalle.precioUnidad,
            subtotal=detalle.subtotal,
            esPersonalizado=detalle.esPersonalizado,
        )
        session.add(detallePedido)
        total += detalle.subtotal
        if detalle.productoID and detalle.producto:
            detalle.producto.stock -= detalle.cantidad
            if detalle.producto.stock < 0:
                raise HTTPException(400, f"Stock insuficiente para {detalle.producto.nombre}")
            session.add(detalle.producto)

    pedido.total = total
    session.add(pedido)

    # Vaciar carrito
    for detalle in carritoDB.detalles:
        session.delete(detalle)

    session.commit()
    session.refresh(pedido)
    return pedido

# READ - Obtener el carrito del cliente
@router.get("/mi-carrito", response_model=list[DetalleCarrito])
def miCarrito(session: SessionDep, cliente=Depends(clienteActual)):
    carritoDB = session.exec(select(Carrito).where(Carrito.clienteID == cliente.id)).first()
    if not carritoDB:
        raise HTTPException(404, "No tienes un carrito asignado")
    
    detalles = session.exec(select(DetalleCarrito).where(DetalleCarrito.carritoID == carritoDB.id)).all()
    return detalles

# UPDATE - Actualizar la cantidad de un producto
@router.patch("/actualizar-cantidad/{productoID}", response_model=DetalleCarrito)
def actualizarCantidad(
    productoID: int, 
    cantidad: int = Form(...),
    session: SessionDep = None, 
    cliente=Depends(clienteActual)
):
    carritoDB = session.exec(select(Carrito).where(Carrito.clienteID == cliente.id)).first()
    if not carritoDB:
        raise HTTPException(404, "No tienes un carrito asignado")
    
    detalle = session.exec(
        select(DetalleCarrito)
        .where(DetalleCarrito.carritoID == carritoDB.id, DetalleCarrito.productoID == productoID)
    ).first()
    if not detalle:
        raise HTTPException(404, "El producto no está en tu carrito")
    
    if cantidad <= 0:
        raise HTTPException(400, "La cantidad debe ser mayor que cero")

    detalle.cantidad = cantidad
    detalle.subtotal = detalle.precioUnidad * cantidad
    session.add(detalle)
    session.commit()
    session.refresh(detalle)
    return detalle

# DELETE - Eliminar un producto del carrito
@router.delete("/{productoID}", status_code=200)
def eliminarDeCarrito(productoID: int, session: SessionDep, cliente=Depends(clienteActual)):
    carritoDB = session.exec(select(Carrito).where(Carrito.clienteID == cliente.id)).first()
    if not carritoDB:
        raise HTTPException(404, "No tienes un carrito asignado")
    
    detalles = session.exec(
        select(DetalleCarrito)
        .where(DetalleCarrito.carritoID == carritoDB.id, DetalleCarrito.productoID == productoID)
    ).first()
    if not detalles:
        raise HTTPException(404, "El producto no está en tu carrito")

    session.delete(detalles)
    session.commit()

    return {"mensaje": "Producto eliminado del carrito"}

# DELETE - Vaciar todo el carrito
@router.delete("/vaciar", status_code=200)
def vaciarCarrito(session: SessionDep, cliente=Depends(clienteActual)):
    carritoDB = session.exec(select(Carrito).where(Carrito.clienteID == cliente.id)).first()
    if not carritoDB:
        raise HTTPException(404, "No tienes un carrito asignado")

    session.exec(delete(DetalleCarrito).where(DetalleCarrito.carritoID == carritoDB.id))
    session.commit()
    return {"mensaje": "Carrito vaciado correctamente"}