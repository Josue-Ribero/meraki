from fastapi import APIRouter, Request, Form
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlmodel import select
from ..db.db import SessionDep, contrasenaContext
from ..models.administrador import Administrador
from ..models.cliente import Cliente
from fastapi.templating import Jinja2Templates

router = APIRouter(prefix="/auth", tags=["Autenticación"])
templates = Jinja2Templates(directory="frontend/templates")

# CREATE - Login
@router.post("/login", response_class=HTMLResponse)
def login(
    request: Request,
    email: str = Form(...),
    contrasena: str = Form(...),
    session: SessionDep = None
):
    # Intentar como administrador
    adminDB = session.exec(select(Administrador).where(Administrador.email == email)).first()
    if adminDB and contrasenaContext.verify(contrasena, adminDB.contrasenaHash):
        request.session["administradorID"] = adminDB.id
        return RedirectResponse(url="/dashboard", status_code=303)
    
    # Intentar como cliente
    clienteDB = session.exec(select(Cliente).where(Cliente.email == email)).first()
    if clienteDB and contrasenaContext.verify(contrasena, clienteDB.contrasenaHash):
        request.session["clienteID"] = clienteDB.id
        return RedirectResponse(url="/", status_code=303)
    
    # Si no coincide ninguno
    return templates.TemplateResponse(
        "auth/login.html",
        {"request": request, "error": "Credenciales inválidas"},
        status_code=401
    )



# READ - Mostrar si ya hay una sesion activa
@router.get("/login", response_class=HTMLResponse)
def mostrarLogin(request: Request):
    # Si ya hay sesión activa, redirigir directamente
    if request.session.get("administradorID"):
        return RedirectResponse(url="/dashboard", status_code=303)
    if request.session.get("clienteID"):
        return RedirectResponse(url="/", status_code=303)
    
    return templates.TemplateResponse("auth/login.html", {"request": request})



# READ - Logout
@router.get("/logout")
def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/auth/login", status_code=303)