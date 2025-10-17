from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from ..models.detalleCarrito import DetalleCarrito, DetalleCarritoCreate, DetalleCarritoUpdate
from ..models.disenoPersonalizado import DisenoPersonalizado
from ..models.cliente import Cliente
from ..auth.auth import clienteActual
from ..models.carrito import Carrito
from ..models.producto import Producto
from ..db.db import SessionDep

router = APIRouter(prefix="/detalleCarrito", tags=["DetalleCarrito"])

# CREATE - Crear un nuevo detalle del carrito
@router.post("/crear", status_code=201, response_model=DetalleCarrito)
def agregarItem(
    nuevoDetalle: DetalleCarritoCreate, 
    session: SessionDep, 
    cliente=Depends(clienteActual)
):
    # Verificar si el carrito existe
    carritoDB = session.exec(select(Carrito).where(Carrito.clienteID == cliente.id)).first()
    if not carritoDB:
        carritoDB = Carrito(clienteID=cliente.id)
        session.add(carritoDB)
        session.flush()  # para tener carrito.id

    # Verificar si es producto normal o diseño personalizado
    if nuevoDetalle.productoID:
        productoDB = session.get(Producto, nuevoDetalle.productoID)
        if not productoDB or not productoDB.activo:
            raise HTTPException(404, "Producto no encontrado")
        if nuevoDetalle.cantidad <= 0:
            raise HTTPException(400, "La cantidad debe ser mayor que cero")
    else:
        productoDB = None  # para diseños personalizados

    # Verificar si ya existe el detalle en el carrito
    detalle = session.exec(
        select(DetalleCarrito).where(
            DetalleCarrito.carritoID == carritoDB.id,
            DetalleCarrito.productoID == nuevoDetalle.productoID,
            DetalleCarrito.disenoID == nuevoDetalle.disenoID,
        )
    ).first()

    # Si ya existe, actualizar cantidad y subtotal
    if detalle:
        nuevaCantidad = detalle.cantidad + nuevoDetalle.cantidad
        if productoDB and nuevaCantidad > productoDB.stock:
            raise HTTPException(
                400, 
                f"No puedes agregar {nuevoDetalle.cantidad} más. Solo quedan {productoDB.stock - detalle.cantidad} unidades disponibles."
            )
        detalle.cantidad = nuevaCantidad
        detalle.subtotal = detalle.cantidad * (productoDB.precio if productoDB else detalle.precioUnidad)
        session.add(detalle)
    else:
        # Crear nuevo detalle
        precioUnidad = productoDB.precio if productoDB else 0  # si es diseño personalizado se puede asignar luego
        detalle = DetalleCarrito(
            carritoID=carritoDB.id,
            productoID=nuevoDetalle.productoID,
            disenoID=nuevoDetalle.disenoID,
            cantidad=nuevoDetalle.cantidad,
            precioUnidad=precioUnidad,
            subtotal=nuevoDetalle.cantidad * precioUnidad,
            esPersonalizado=bool(nuevoDetalle.disenoID)
        )
        session.add(detalle)

    # Recalcular total del carrito
    session.flush()
    totalCarrito = session.exec(
        select(DetalleCarrito.subtotal).where(DetalleCarrito.carritoID == carritoDB.id)
    ).all()
    carritoDB.total = sum([x for x in totalCarrito]) if totalCarrito else 0

    session.commit()
    session.refresh(carritoDB)
    return detalle



# READ - Obtener lista de detalles de carrito por ID de carrito
@router.get("/carrito/{carritoID}", response_model=list[DetalleCarrito])
def listaDetallesPorCarrito(carritoID: int, session: SessionDep):
    detallesCarritos = session.exec(select(DetalleCarrito).where(DetalleCarrito.carritoID == carritoID)).all()
    return detallesCarritos



# UPDATE - Actualizar detalles por ID
@router.patch("/{detalleID}", response_model=DetalleCarrito)
def actualizarDetalle(detalleID: int, detalleData: DetalleCarritoUpdate, session: SessionDep):
    detalleDB = session.get(DetalleCarrito, detalleID)
    if not detalleDB:
        raise HTTPException(404, "Detalle no encontrado")
    
    # Excluir los campos vacios
    detalleUpdate = detalleDB.model_dump(exclude_none=True)

    detalleDB.sqlmodel_update(detalleUpdate)
    session.add(detalleDB)
    session.commit()
    session.refresh(detalleDB)
    return detalleDB



# DELETE - Eliminar detalle por ID
@router.delete("/{detalleID}", status_code=204)
def eliminarDetalle(detalleID: int, session: SessionDep):
    detalleDB = session.get(DetalleCarrito, detalleID)
    if not detalleDB:
        raise HTTPException(404, "Detalle no encontrado")
    session.delete(detalleDB)
    session.commit()