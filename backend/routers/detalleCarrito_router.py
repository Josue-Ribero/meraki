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
def crearDetalleCarrito(
    nuevoDetalle: DetalleCarritoCreate, 
    session: SessionDep, 
    cliente=Depends(clienteActual)
):
    # Verificar si el carrito existe
    carritoDB = session.exec(select(Carrito).where(Carrito.clienteID == cliente.id)).first()
    if not carritoDB:
        carritoDB = Carrito(clienteID=cliente.id)
        session.add(carritoDB)
        session.commit()  # Asegurar el carrito.id real

    # Verificar si el producto existe
    productoDB = session.get(Producto, nuevoDetalle.productoID)
    if not productoDB or not productoDB.activo:
        raise HTTPException(404, "Producto no encontrado")
    
    # Verificar que la cantidad sea valida
    if nuevoDetalle.cantidad <= 0:
        raise HTTPException(400, "La cantidad debe ser mayor que cero")

    # Verificar si ya existe el detalle en el carrito
    detalleDB = session.exec(
        select(DetalleCarrito).where(
            DetalleCarrito.carritoID == carritoDB.id,
            DetalleCarrito.productoID == nuevoDetalle.productoID
        )
    ).first()

    # Si ya existe, actualizar cantidad y subtotal
    if detalleDB:
        detalleDB.cantidad += nuevoDetalle.cantidad
        detalleDB.calcularSubtotal(productoDB.precio)

    else:
        # Crear nuevo detalle
        detalleDB = DetalleCarrito(
            carritoID=carritoDB.id,
            productoID=productoDB.id,
            cantidad=nuevoDetalle.cantidad
        )
        # Calcula el valor por unidad y el subtotal
        detalleDB.calcularSubtotal(productoDB.precio)
        session.add(detalleDB)

    session.commit()
    session.refresh(detalleDB)

    # Recalcula el total del carrito
    carritoDB.calcularTotal(session)

    return detalleDB



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
    
    # Actualizar solo campos enviados
    detalleDB.sqlmodel_update(detalleData.model_dump(exclude_unset=True))
    detalleDB.subtotal = detalleDB.cantidad * detalleDB.precioUnidad

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
    
    # Valida si existe el carrito
    carritoDB = session.get(Carrito, detalleDB.carritoID)

    session.delete(detalleDB)
    session.commit()

    # Si existe el carrito, calcula su total
    if carritoDB:
        carritoDB.calcularTotal(session)