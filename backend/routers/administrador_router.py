from fastapi import APIRouter, HTTPException, Form, Request, Depends
from sqlmodel import select
from ..models.administrador import Administrador, AdministradorUpdate
from ..auth.auth import adminActual
from ..db.db import SessionDep, hashearContrasena, contrasenaContext
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.templating import Jinja2Templates

router = APIRouter(prefix="/admin", tags=["Administrador"])
templates = Jinja2Templates(directory="frontend/templates/auth")

# CREATE - Cerrar sesion del dashboard
@router.post("/cerrar-sesion")
def cerrarSesion(request: Request):
    request.session.pop("administradorID", None)
    return RedirectResponse(url="/ingresar", status_code=303)



# UPDATE - Actualizar nombre del administrador
@router.patch("/", response_model=Administrador)
def actualizarAdministrador(adminData: AdministradorUpdate, session: SessionDep, admin = Depends(adminActual)):
    adminDB = session.exec(select(Administrador)).first()
    if not adminDB:
        raise HTTPException(404, "Administrador no encontrado")

    adminDB.sqlmodel_update(adminData)
    session.add(adminDB)
    session.commit()
    session.refresh(adminDB)
    return adminDB



# UPDATE - Actualizar contrasena del administrador
@router.patch("/contrasena", response_model=Administrador)
def actualizarContrasena(nuevaContrasena: str = Form(...), session: SessionDep = None, admin = Depends(adminActual)):
    adminDB = session.exec(select(Administrador)).first()
    if not adminDB:
        raise HTTPException(404, "Administrador no encontrado")

    adminDB.contrasenaHash = hashearContrasena(nuevaContrasena)
    session.add(adminDB)
    session.commit()
    session.refresh(adminDB)
    return {"mensaje": "contrasena actualizada correctamente"}