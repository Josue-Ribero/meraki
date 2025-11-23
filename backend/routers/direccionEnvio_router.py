from fastapi import APIRouter, HTTPException, Depends, Form
from ..auth.auth import clienteActual
from sqlmodel import select
from ..models.direccionEnvio import DireccionEnvio, DireccionEnvioCreate, DireccionEnvioUpdate
from ..db.db import SessionDep

router = APIRouter(prefix="/direcciones", tags=["Direcciones"])

# CREATE - Crear una nueva direccion
@router.post("/crear", response_model=DireccionEnvio, status_code=201)
def crearDireccion(
    nombre: str = Form(...),
    calle: str = Form(...),
    localidad: str = Form(...),
    codigoPostal: str = Form(...),
    esPredeterminada: bool = Form(False),
    session: SessionDep = None,
    cliente=Depends(clienteActual)
):
    """
    Endpoint para crear una nueva direccion
    """
    
    # Crear direccion
    direccion = DireccionEnvio(
        nombre=nombre,
        calle=calle,
        localidad=localidad,
        codigoPostal=codigoPostal,
        esPredeterminada=esPredeterminada,
        clienteID=cliente.id
    )

    # Insertar y guardar cambios en la DB
    session.add(direccion)
    session.commit()
    session.refresh(direccion)
    return direccion



# READ - Obtener las direcciones del cliente
@router.get("/mis-direcciones", response_model=list[DireccionEnvio])
def misDirecciones(session: SessionDep, cliente=Depends(clienteActual)):
    """
    Endpoint para obtener las direcciones del cliente
    """
    
    # Obtener direcciones del cliente
    direccionesDB = session.exec(select(DireccionEnvio).where(DireccionEnvio.clienteID == cliente.id)).all()
    
    # Si no hay direcciones, mostrar error
    if not direccionesDB:
        raise HTTPException(404, "No tienes direcciones registradas")
    
    return direccionesDB

    

# UPDATE - Actualizar direccion para un usuario por ID
@router.patch("/{direccionID}", response_model=DireccionEnvio)
def actualizarDireccion(
    direccionID: int,
    nombre: str = Form(None),
    calle: str = Form(None),
    localidad: str = Form(None),
    codigoPostal: str = Form(None),
    esPredeterminada: bool = Form(None),
    session: SessionDep = None
):
    """
    Endpoint para actualizar direccion para un usuario por ID
    """
    
    # Obtener direccion por ID
    direccionDB = session.get(DireccionEnvio, direccionID)
    
    # Si no existe la direccion, mostrar error
    if not direccionDB:
        raise HTTPException(404, "Dirección no encontrada")
    
    # Actualizar campos
    if nombre:
        direccionDB.nombre = nombre
    if calle:
        direccionDB.calle = calle
    if localidad:
        direccionDB.localidad = localidad
    if codigoPostal:
        direccionDB.codigoPostal = codigoPostal
    if esPredeterminada is not None:
        direccionDB.esPredeterminada = esPredeterminada
    
    # Insertar y guardar cambios en la DB
    session.add(direccionDB)
    session.commit()
    session.refresh(direccionDB)
    return direccionDB

    

# DELETE - Eliminar direccion por ID
@router.delete("/{direccionID}", status_code=204)
def eliminarDireccion(direccionID: int, session: SessionDep):
    """
    Endpoint para eliminar direccion por ID
    """
    
    # Obtener direccion por ID
    direccionDB = session.get(DireccionEnvio, direccionID)
    
    # Si no existe la direccion, mostrar error
    if not direccionDB:
        raise HTTPException(404, "Dirección no encontrada")
    
    # Eliminar direccion y guardar cambios en la DB
    session.delete(direccionDB)
    session.commit()