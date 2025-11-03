from fastapi import APIRouter, HTTPException, Form, Request, Depends
from sqlmodel import select
from ..auth.auth import clienteActual, adminActual
from ..models.cliente import Cliente, ClienteUpdate, ClienteHistorico
from ..models.carrito import Carrito
from ..models.wishlist import Wishlist
from ..db.db import SessionDep, contrasenaContext
from fastapi.responses import RedirectResponse

router = APIRouter(prefix="/clientes", tags=["Clientes"])

# CREATE - Registro del cliente
@router.post("/registrar")
def registrarClienteForm(
    request: Request,
    nombre: str = Form(...),
    email: str = Form(...),
    contrasena: str = Form(...),
    telefono: str = Form(None),
    session: SessionDep = None
):
    clienteDB = session.exec(select(Cliente).where(Cliente.email == email)).first()
    if clienteDB:
        raise HTTPException(400, "Este email ya tiene una cuenta asociada")
    
    nuevoCliente = Cliente(
        nombre=nombre,
        email=email,
        telefono=telefono,
        contrasenaHash=contrasenaContext.hash(contrasena),
    )

    session.add(nuevoCliente)
    session.flush()

    session.add(Carrito(clienteID=nuevoCliente.id))
    session.add(Wishlist(clienteID=nuevoCliente.id))

    session.commit()

    request.session["clienteID"] = nuevoCliente.id
    return RedirectResponse(url="/", status_code=303)

# READ - Obtener lista de clientes
@router.get("/", response_model=list[Cliente])
def listaClientes(session: SessionDep, _=Depends(adminActual)):
    clientes = session.exec(select(Cliente)).all()
    return clientes

# READ - Obtener un cliente (solo administrador)
@router.get("/{clienteID}", response_model=Cliente)
def clientePorID(clienteID: int, session: SessionDep, _=Depends(adminActual)):
    clienteDB = session.get(Cliente, clienteID)
    if not clienteDB:
        raise HTTPException(404, "Cliente no encontrado")
    return clienteDB

# UPDATE - Actualizar datos personales del cliente
@router.patch("/{clienteID}", response_model=Cliente)
def actualizarCliente(
    clienteID: int, 
    nombre: str = Form(None),
    telefono: str = Form(None),
    contrasena: str = Form(None),
    session: SessionDep = None,
    cliente=Depends(clienteActual)
):
    if clienteID != cliente.id:
        raise HTTPException(403, "No puedes actualizar otros clientes")
    
    clienteDB = session.get(Cliente, clienteID)
    if not clienteDB:
        raise HTTPException(404, "Cliente no encontrado")
    
    if nombre:
        clienteDB.nombre = nombre
    if telefono:
        clienteDB.telefono = telefono
    if contrasena:
        clienteDB.contrasenaHash = contrasenaContext.hash(contrasena)
    
    session.add(clienteDB)
    session.commit()
    session.refresh(clienteDB)
    return clienteDB

# DELETE - Eliminar cliente
@router.delete("/eliminar-cuenta")
def eliminarCliente(session: SessionDep, cliente=Depends(clienteActual)):
    clienteDB = session.get(Cliente, cliente.id)
    if not clienteDB:
        raise HTTPException(404, "Cliente no encontrado")

    historico = ClienteHistorico(
        nombre=clienteDB.nombre,
        email=clienteDB.email,
        telefono=clienteDB.telefono
    )
    session.add(historico)
    session.delete(clienteDB)
    session.commit()

    return {"mensaje": "Cuenta eliminada correctamente"}