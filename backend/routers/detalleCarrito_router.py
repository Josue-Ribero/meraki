from fastapi import APIRouter, HTTPException, Depends, Form
from sqlmodel import select
from ..models.detalleCarrito import DetalleCarrito, DetalleCarritoCreate, DetalleCarritoUpdate
from ..models.disenoPersonalizado import DisenoPersonalizado
from ..models.cliente import Cliente
from ..auth.auth import clienteActual
from ..models.carrito import Carrito
from ..models.producto import Producto
from ..db.db import SessionDep

router = APIRouter(prefix="/detalleCarrito", tags=["DetalleCarrito"])

# READ - Obtener lista de detalles de carrito por ID de carrito
@router.get("/carrito/{carritoID}", response_model=list[DetalleCarrito])
def listaDetallesPorCarrito(carritoID: int, session: SessionDep):
    """
    Endpoint para obtener la lista de detalles de carrito por ID de carrito
    """
    
    # Obtener detalles de carrito
    detallesCarritos = session.exec(select(DetalleCarrito).where(DetalleCarrito.carritoID == carritoID)).all()
    return detallesCarritos



# UPDATE - Actualizar detalles por ID
@router.patch("/{detalleID}", response_model=DetalleCarrito)
def actualizarDetalle(
    detalleID: int,
    cantidad: int = Form(...),
    session: SessionDep = None
):
    """
    Endpoint para actualizar detalles por ID
    """
    
    # Obtener detalle por ID
    detalleDB = session.get(DetalleCarrito, detalleID)
    
    # Si no existe el detalle, mostrar error
    if not detalleDB:
        raise HTTPException(404, "Detalle no encontrado")
    
    # Actualizar cantidad y subtotal
    detalleDB.cantidad = cantidad
    
    # Calcular subtotal
    detalleDB.subtotal = detalleDB.cantidad * detalleDB.precioUnidad
    
    # Insertar y guardar cambios en la DB
    session.add(detalleDB)
    session.commit()
    session.refresh(detalleDB)
    return detalleDB



# DELETE - Eliminar detalle por ID
@router.delete("/{detalleID}", status_code=204)
def eliminarDetalle(detalleID: int, session: SessionDep):
    """
    Endpoint para eliminar detalle por ID
    """
    
    # Obtener detalle por ID
    detalleDB = session.get(DetalleCarrito, detalleID)
    
    # Si no existe el detalle, mostrar error
    if not detalleDB:
        raise HTTPException(404, "Detalle no encontrado")
    
    # Obtener carrito
    carritoDB = session.get(Carrito, detalleDB.carritoID)

    # Eliminar detalle y guardar cambios en la DB
    session.delete(detalleDB)
    session.commit()

    # Calcular total del carrito
    if carritoDB:
        carritoDB.calcularTotal(session)