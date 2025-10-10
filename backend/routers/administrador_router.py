from fastapi import APIRouter, HTTPException, Form, Request
from sqlmodel import select
from ..models.administrador import Administrador, AdministradorUpdate
from ..db.db import SessionDep, hashearContrasena, contrasenaContext
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.templating import Jinja2Templates

router = APIRouter(prefix="/admin", tags=["Administrador"])
templates = Jinja2Templates(directory="frontend/templates/auth")

# LOGIN - Ingresar a la pagina como administrador
@router.post("/ingresar", response_class=HTMLResponse)
def ingresarAdministrador(
    request: Request,
    email: str = Form(...),
    contrasena: str = Form(...),
    session: SessionDep = None
    ):

    # Revisar en la DB si existe el email
    adminDB = session.exec(select(Administrador).where(Administrador.email == email)).first()
    if not adminDB:
        return templates.TemplateResponse(
            "login.html",
            {"request": request, "error": "El email no esta registrado"}
        )
    
    # Verifica si la contrasena asignada es la misma que la ingresada
    if not contrasenaContext.verify(contrasena, adminDB.contrasenaHash):
        return templates.TemplateResponse(
            "login.html",
            {"request": request, "error": "Contrasena incorrecta"}
        )
    
    return RedirectResponse(url="/", status_code=303)

# UPDATE - Actualizar nombre del administrador
@router.patch("/", response_model=Administrador)
def actualizarAdministrador(adminData: AdministradorUpdate, session: SessionDep):
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
def actualizarContrasena(nuevaContrasena: str = Form(...), session: SessionDep = None):
    adminDB = session.exec(select(Administrador)).first()
    if not adminDB:
        raise HTTPException(404, "Administrador no encontrado")

    adminDB.contrasenaHash = hashearContrasena(nuevaContrasena)
    session.add(adminDB)
    session.commit()
    session.refresh(adminDB)
    return {"mensaje": "contrasena actualizada correctamente"}