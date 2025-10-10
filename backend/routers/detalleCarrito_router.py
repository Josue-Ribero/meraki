from fastapi import APIRouter, HTTPException
from sqlmodel import select
from ..models.detalleCarrito import DetalleCarrito, DetalleCarritoCreate, DetalleCarritoUpdate
from ..db.db import SessionDep

router = APIRouter(prefix="/detalleCarrito", tags=["DetalleCarrito"])

# CREATE - Crear un nuevo detalle del carrito
@router.post("/crear", response_model=DetalleCarrito, status_code=201)
def agregarDetalleCarrito(detalleNuevo: DetalleCarritoCreate, session: SessionDep):
    detalle = DetalleCarrito.model_validate(detalleNuevo)
    session.add(detalle)
    session.commit()
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