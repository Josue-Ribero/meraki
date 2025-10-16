from fastapi import APIRouter, HTTPException, Depends
from ..auth.auth import clienteActual
from sqlmodel import select
from ..models.direccionEnvio import DireccionEnvio, DireccionEnvioCreate, DireccionEnvioUpdate
from ..db.db import SessionDep

router = APIRouter(prefix="/direcciones", tags=["Direcciones"])

# CREATE - Crear una nueva direccion
@router.post("/crear", response_model=DireccionEnvio, status_code=201)
def crearDireccion(direccionNueva: DireccionEnvioCreate, session: SessionDep, cliente=Depends(clienteActual)):
    # Asignar direccion al cliente
    direccion = DireccionEnvio.model_validate(direccionNueva, update={"clienteID": cliente.id})
    session.add(direccion)
    session.commit()
    session.refresh(direccion)
    return direccion

# READ - Obtener las direcciones del cliente
@router.get("/mis-direcciones", response_model=list[DireccionEnvio])
def misDirecciones(session: SessionDep, cliente = Depends(clienteActual)):
    direccioesDB = session.exec(select(DireccionEnvio).where(DireccionEnvio.clienteID == cliente.id)).all()
    if not direccioesDB:
        raise HTTPException(404, "No tienes direcciones registradas")
    return direccioesDB

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