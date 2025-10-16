from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import select
from ..models.detalleCarrito import DetalleCarrito, DetalleCarritoCreate, DetalleCarritoUpdate
from ..models.disenoPersonalizado import DisenoPersonalizado
from ..auth.auth import clienteActual
from ..models.carrito import Carrito
from ..models.producto import Producto
from ..db.db import SessionDep

router = APIRouter(prefix="/detalleCarrito", tags=["DetalleCarrito"])

# CREATE - Crear un nuevo detalle del carrito
@router.post("/crear", status_code=201)
def agregarItem(
    nuevoDetalle: DetalleCarritoCreate, session: SessionDep, cliente=Depends(clienteActual)):
    
    # Verificar si el carrito existe
    carrito = session.exec(select(Carrito).where(Carrito.clienteID == cliente.id)).first()
    if not carrito:
        carrito = Carrito(clienteID=cliente.id)
        session.add(carrito)
        session.flush()  # para tener carrito.id

    # Verificar si es el mismo producto
    detalle = session.exec(
        select(DetalleCarrito).where(
            DetalleCarrito.carritoID == carrito.id,
            DetalleCarrito.productoID == nuevoDetalle.productoID,
            DetalleCarrito.disenoID == nuevoDetalle.disenoID,
        )
    ).first()

    # Si existe el detalle
    if detalle:
        detalle.cantidad += nuevoDetalle.cantidad
        detalle.subtotal = detalle.cantidad * detalle.precioUnidad
    else:
        # Obtener precio del producto
        if nuevoDetalle.productoID:
            productoDB = session.get(Producto, nuevoDetalle.productoID)
            if not productoDB or not productoDB.activo or productoDB.stock < nuevoDetalle.cantidad:
                raise HTTPException(400, "Producto sin stock")
            
            # Tomar el precio
            precio = productoDB.precio

        # Diseño personalizado 
        else:
            diseno = session.get(DisenoPersonalizado, nuevoDetalle.disenoID)
            if not diseno or diseno.clienteID != cliente.id:
                raise HTTPException(403, "Diseño no encontrado")
            precio = diseno.precioEstimado
        
        # Crea el detalle
        detalle = DetalleCarrito(
            carritoID=carrito.id,
            productoID=nuevoDetalle.productoID,
            disenoID=nuevoDetalle.disenoID,
            cantidad=nuevoDetalle.cantidad,
            precioUnidad=precio,
            subtotal=nuevoDetalle.cantidad * precio,
            esPersonalizado=bool(nuevoDetalle.disenoID),
        )
        session.add(detalle) # Inserta el detalle en la DB

    session.commit() # Guarda los cambios
    session.refresh(detalle)
    return detalle



# READ - Obtener lista de detalles de carrito por ID de carrito
@router.get("/carrito/{carritoID}", response_model=list[DetalleCarrito])
def listaDetallesPorCarrito(carritoID: int, session: SessionDep):
    detallesCarritos = session.exec(select(DetalleCarrito).where(DetalleCarrito.carritoID == carritoID)).all()
    return detallesCarritos



# UPDATE - Actualizar detalles por ID
@router.patch("/{detalleID}", response_model=DetalleCarrito)
def actualizarDetalle(detalleID: int, data: DetalleCarritoUpdate, session: SessionDep):
    detalleDB = session.get(DetalleCarrito, detalleID)
    if not detalleDB:
        raise HTTPException(404, "Detalle no encontrado")
    detalleDB.sqlmodel_update(data)
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