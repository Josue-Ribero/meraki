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

    # Buscar si el producto ya está en el carrito
    detalle_existente = session.exec(
        select(DetalleCarrito).where(
            DetalleCarrito.carritoID == carritoDB.id,
            DetalleCarrito.productoID == productoID
        )
    ).first()

    if detalle_existente:
        # Si ya existe, sumar la cantidad
        detalle_existente.cantidad += cantidad
        detalle_existente.subtotal = detalle_existente.precioUnidad * detalle_existente.cantidad
        session.add(detalle_existente)
        session.commit()
        session.refresh(detalle_existente)
        return detalle_existente
    else:
        # Si no existe, crearlo
        nuevo_detalle = DetalleCarrito(
            carritoID=carritoDB.id,
            productoID=productoID,
            cantidad=cantidad,
            precioUnidad=productoDB.precio,
            subtotal=productoDB.precio * cantidad,
            esPersonalizado=False # Por defecto
        )
        session.add(nuevo_detalle)
        session.commit()
        session.refresh(nuevo_detalle)
        return nuevo_detalle



# CREATE - Convertir el carrito en un pedido (SIN PAGO)
@router.post("/pedir", response_model=Pedido)
def crearPedidoDesdeCarrito(
    session: SessionDep = None,
    cliente=Depends(clienteActual)
):
    # Obtener el carrito del cliente
    carritoDB = session.exec(select(Carrito).where(Carrito.clienteID == cliente.id)).first()
    # Si no tiene uno, mostrar error
    if not carritoDB or not carritoDB.detalles:
        raise HTTPException(400, "Carrito vacío")

    # Buscar la dirección predeterminada
    direccion = session.exec(
        select(DireccionEnvio).where(
            DireccionEnvio.clienteID == cliente.id,
            DireccionEnvio.esPredeterminada == True,
        )
    ).first()
    # Si no tiene una predeterminada, usar la primera
    if not direccion:
        direccion = session.exec(select(DireccionEnvio).where(DireccionEnvio.clienteID == cliente.id)).first()
    # Si no tiene ninguna, mostrar error
    if not direccion:
        raise HTTPException(400, "Necesitas una dirección")

    # Crear el pedido
    pedido = Pedido(
        clienteID=cliente.id,
        direccionEnvioID=direccion.id,
        estado=EstadoPedido.PENDIENTE,
        pagadoConPuntos=False,
        total=0,
    )
    # Insertar el pedido en la DB
    session.add(pedido)
    session.flush()

    # Calcular el total
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
        # Insertar el detalle del pedido en la DB
        session.add(detallePedido)
        total += detalle.subtotal
        if detalle.productoID and detalle.producto:
            detalle.producto.stock -= detalle.cantidad
            if detalle.producto.stock < 0:
                raise HTTPException(400, f"Stock insuficiente para {detalle.producto.nombre}")
            session.add(detalle.producto)

    # Actualizar el total del pedido
    pedido.total = total
    session.add(pedido)

    # Vaciar carrito
    for detalle in carritoDB.detalles:
        session.delete(detalle)

    # Guardar cambios en la DB
    session.commit()
    session.refresh(pedido)
    return pedido



# READ - Obtener el carrito del cliente
@router.get("/mi-carrito", response_model=list[DetalleCarrito])
def miCarrito(session: SessionDep, cliente=Depends(clienteActual)):
    # Obtener el carrito del cliente
    carritoDB = session.exec(select(Carrito).where(Carrito.clienteID == cliente.id)).first()
    # Si no tiene carrito, mostrar error
    if not carritoDB:
        raise HTTPException(404, "No tienes un carrito asignado")
    
    # Obtener los detalles del carrito
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
    # Obtener el carrito del cliente
    carritoDB = session.exec(select(Carrito).where(Carrito.clienteID == cliente.id)).first()
    if not carritoDB:
        raise HTTPException(404, "No tienes un carrito asignado")
    
    # Obtener el detalle del producto
    detalle = session.exec(
        select(DetalleCarrito)
        .where(DetalleCarrito.carritoID == carritoDB.id, DetalleCarrito.productoID == productoID)
    ).first()

    # Si el producto no esta en el carrito, mostrar error
    if not detalle:
        raise HTTPException(404, "El producto no está en tu carrito")
    
    # Si la cantidad es menor o igual a 0, mostrar error
    if cantidad <= 0:
        raise HTTPException(400, "La cantidad debe ser mayor que cero")
    
    # Si la cantidad es mayor al stock, mostrar error
    if cantidad > detalle.producto.stock:
        raise HTTPException(400, "No hay stock suficiente")
    
    # Actualizar la cantidad y el subtotal
    detalle.cantidad = cantidad
    detalle.subtotal = detalle.precioUnidad * cantidad
    session.add(detalle)
    session.commit()
    session.refresh(detalle)
    return detalle



# DELETE - Eliminar un producto del carrito
@router.delete("/{productoID}", status_code=200)
def eliminarDeCarrito(productoID: int, session: SessionDep, cliente=Depends(clienteActual)):
    # Obtener el carrito del usuario
    carritoDB = session.exec(select(Carrito).where(Carrito.clienteID == cliente.id)).first()
    # Si no tiene un carrito
    if not carritoDB:
        raise HTTPException(404, "No tienes un carrito asignado")
    
    # Obtener los detalles del producto
    detalles = session.exec(
        select(DetalleCarrito)
        .where(DetalleCarrito.carritoID == carritoDB.id, DetalleCarrito.productoID == productoID)
    ).first()
    # Si el producto no esta en el carrito, mostrar error
    if not detalles:
        raise HTTPException(404, "El producto no está en tu carrito")

    # Eliminar el producto del carrito y guardar cambios en la DB
    session.delete(detalles)
    session.commit()

    return {"mensaje": "Producto eliminado del carrito"}



# DELETE - Vaciar todo el carrito
@router.delete("/vaciar", status_code=200)
def vaciarCarrito(session: SessionDep, cliente=Depends(clienteActual)):
    # Obtener el carrito del usuario
    carritoDB = session.exec(select(Carrito).where(Carrito.clienteID == cliente.id)).first()
    # Si no tiene un carrito, mostrar error
    if not carritoDB:
        raise HTTPException(404, "No tienes un carrito asignado")

    # Vaciar el carrito y guardar cambios en la DB
    session.exec(delete(DetalleCarrito).where(DetalleCarrito.carritoID == carritoDB.id))
    session.commit()
    return {"mensaje": "Carrito vaciado correctamente"}