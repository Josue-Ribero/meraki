from fastapi import APIRouter, HTTPException, Form, Request
from sqlmodel import select
from ..models.cliente import Cliente, ClienteCreate, ClienteUpdate
from ..db.db import SessionDep, contrasenaContext
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse

router = APIRouter(prefix="/clientes", tags=["Clientes"])

# CREATE - Registro del cliente
@router.post("/registrar")
def registrarClienteForm(
    request: Request,
    nombre: str = Form(...),
    email: str = Form(...),
    contrasena: str = Form(...),
    session: SessionDep = None
):
    # Verificar si ya existe el email
    clienteDB = session.exec(select(Cliente).where(Cliente.email == email)).first()
    if clienteDB:
        return RedirectResponse(url="/registrar?error=email_existente", status_code=303)

    # Encriptar la contraseña
    contrasenaEncriptada = contrasenaContext.hash(contrasena)

    # Crear el nuevo cliente
    nuevoCliente = Cliente(nombre=nombre, email=email, contrasenaHash=contrasenaEncriptada)
    session.add(nuevoCliente)
    session.commit()
    session.refresh(nuevoCliente)

    # Guardar sesión activa
    request.session["clienteID"] = nuevoCliente.id

    # Redirigir a la página principal o perfil del cliente
    return RedirectResponse(url="/personal", status_code=303)

"""@router.post("/registrar", response_model=Cliente, status_code=201)
def registrarCliente(nuevoCliente: ClienteCreate, session: SessionDep):
    # Verificar si ya existe el email
    clienteDB = session.exec(select(Cliente).where(Cliente.email == nuevoCliente.email)).first()
    if clienteDB:
        raise HTTPException(400, "El email ya está registrado")
    
    # Encriptar la contrasena
    contrasenaEncriptada = contrasenaContext.hash(nuevoCliente.contrasenaHash)

    # Guardar el cliente en la DB
    cliente = Cliente.model_validate(nuevoCliente)
    cliente.contrasenaHash = contrasenaEncriptada
    session.add(cliente)
    session.commit()
    session.refresh(cliente)
    return RedirectResponse(url="/", status_code=303)"""


# CREATE - Cerrar sesion
@router.post("/cerrar-sesion")
def cerrarSesion(request: Request):
    request.session.pop("clienteID", None)
    return RedirectResponse(url="/ingresar", status_code=303)



# READ - Obtener lista de clientes y por ID
@router.get("/", response_model=list[Cliente])
def listaClientes(session: SessionDep):
    clientes = session.exec(select(Cliente)).all()
    return clientes



# READ - Obtener un cliente (solo administrador)
@router.get("/{clienteID}", response_model=Cliente)
def clientePorID(clienteID: int, session: SessionDep):
    clienteDB = session.get(Cliente, clienteID)
    if not clienteDB:
        raise HTTPException(404, "Cliente no encontrado")
    return clienteDB



# UPDATE - Actualizar datos personales del cliente
@router.patch("/{clienteID}", response_model=Cliente)
def actualizarCliente(clienteID: int, datosCliente: ClienteUpdate, session: SessionDep):
    # Revisar si el cliente existe en la DB
    clienteDB = session.get(Cliente, clienteID)
    if not clienteDB:
        raise HTTPException(404, "Cliente no encontrado")
    
    # Desempaquetar el objeto en un diccionario
    datosUpdate = datosCliente.model_dump(exclude_none=True)
    valoresPorDefecto = {"string", "", 0} #Valores que tiene FastAPI por defecto

    # Revisar que la clave no sea None ni por defecto
    nuevaContrasenaSinEncriptar = datosUpdate.pop('contrasenaHash', None)
    if nuevaContrasenaSinEncriptar and nuevaContrasenaSinEncriptar not in valoresPorDefecto:
        # Encriptar la contrasena
        clienteDB.contrasenaHash = contrasenaContext.hash(nuevaContrasenaSinEncriptar)
    
    # Quitar campos con los valores por defecto
    datosFiltrados = {}
    for dato, valor in datosUpdate.items():
        if valor not in valoresPorDefecto:
            datosFiltrados[dato] = valor

    # Actualizar los datos y cargarlos a la DB
    clienteDB.sqlmodel_update(datosFiltrados)
    session.add(clienteDB)
    session.commit()
    session.refresh(clienteDB)
    return clienteDB



# DELETE - Eliminar cliente
@router.delete("/{clienteID}", status_code=204)
def eliminarCliente(clienteID: int, session: SessionDep):
    clienteDB = session.get(Cliente, clienteID)
    if not clienteDB:
        raise HTTPException(404, "Cliente no encontrado")

    session.delete(clienteDB)
    session.commit()