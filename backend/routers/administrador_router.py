from fastapi import APIRouter, HTTPException, Form, Depends
from sqlmodel import select
from ..models.administrador import Administrador, AdministradorUpdate
from ..auth.auth import adminActual
from ..db.db import SessionDep, hashearContrasena
from fastapi.templating import Jinja2Templates

router = APIRouter(prefix="/admin", tags=["Administrador"])
templates = Jinja2Templates(directory="frontend/templates/auth")

# UPDATE - Actualizar nombre del administrador
@router.patch("/", response_model=Administrador)
def actualizarAdministrador(
    nombre: str = Form(None),
    session: SessionDep = None, 
    _=Depends(adminActual)
):
    """
    Este endpoint recibe un nombre nuevo y actualiza el modelo Administrador.
    """

    # Obtener el administrador
    adminDB = session.exec(select(Administrador)).first()
    if not adminDB:
        raise HTTPException(404, "Administrador no encontrado")

    # Si se ingresa un nombre, actualizarlo
    if nombre:
        adminDB.nombre = nombre

    # Insertar y guardar los cambios en la DB
    session.add(adminDB)
    session.commit()
    session.refresh(adminDB)
    return adminDB



# UPDATE - Actualizar contrasena del administrador
@router.patch("/contrasena")
def actualizarContrasena(
    session: SessionDep, 
    nuevaContrasena: str = Form(...), 
    _=Depends(adminActual)
):
    """
    Este endpoint recibe una contrasena nueva y actualiza el modelo Administrador.
    """

    # Obtener el administrador
    adminDB = session.exec(select(Administrador)).first()
    if not adminDB:
        raise HTTPException(404, "Administrador no encontrado")

    # Hashear la contrasena
    adminDB.contrasenaHash = hashearContrasena(nuevaContrasena)

    # Insertar y guardar los cambios en la DB
    session.add(adminDB)
    session.commit()
    session.refresh(adminDB)
    return {"mensaje": "Contraseña actualizada correctamente"}