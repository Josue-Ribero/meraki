from fastapi import APIRouter, HTTPException
from sqlmodel import select
from ..models.direccionEnvio import DireccionEnvio, DireccionEnvioCreate, DireccionEnvioUpdate
from ..db.db import SessionDep

router = APIRouter(prefix="/direcciones", tags=["Direcciones"])

# CREATE - Crear una nueva direccion
@router.post("/crear", response_model=DireccionEnvio, status_code=201)
def crearDireccion(direccionNueva: DireccionEnvioCreate, session: SessionDep):
    direccion = DireccionEnvio.model_validate(direccionNueva)
    session.add(direccion)
    session.commit()
    session.refresh(direccion)
    return direccion

# READ - Obtener lista de direcciones por ID de cliente
@router.get("/cliente/{clienteID}", response_model=list[DireccionEnvio])
def listaDireccionesPorCliente(clienteID: int, session: SessionDep):
    direcciones = session.exec(select(DireccionEnvio).where(DireccionEnvio.clienteID == clienteID)).all()
    return direcciones

# UPDATE - Actualizar direccion para un usuario por ID
@router.patch("/{direccionID}", response_model=DireccionEnvio)
def actualizarDireccion(direccionID: int, data: DireccionEnvioUpdate, session: SessionDep):
    direccionDB = session.get(DireccionEnvio, direccionID)
    if not direccionDB:
        raise HTTPException(404, "Dirección no encontrada")
    direccionDB.sqlmodel_update(data)
    session.add(direccionDB)
    session.commit()
    session.refresh(direccionDB)
    return direccionDB

# DELETE - Eliminar direccion por ID
@router.delete("/{direccionID}", status_code=204)
def eliminarDireccion(direccionID: int, session: SessionDep):
    direccionDB = session.get(DireccionEnvio, direccionID)
    if not direccionDB:
        raise HTTPException(404, "Dirección no encontrada")
    session.delete(direccionDB)
    session.commit()