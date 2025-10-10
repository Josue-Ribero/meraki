from fastapi import APIRouter, HTTPException, status, Form
from sqlmodel import select
from ..models.cliente import Cliente, ClienteCreate, ClienteUpdate
from ..db.db import SessionDep, contrasenaContext
from fastapi.responses import RedirectResponse
from datetime import datetime as dt

router = APIRouter(prefix="/clientes", tags=["Clientes"])

# CREATE - Registro del cliente
@router.post("/registrar", response_model=Cliente, status_code=201)
def crearCliente(nuevoCliente: ClienteCreate, session: SessionDep):
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
    return cliente

# CREATE - Ingreso del cliente
@router.post("/ingresar", response_model=Cliente, status_code=200)
def ingresarCliente(email: str = Form(...), contrasena: str = Form(...), session: SessionDep =None):
    # Verificar si ya existe el email
    clienteDB = session.exec(select(Cliente).where(Cliente.email == email)).first()
    if not clienteDB:
        raise HTTPException(401, "Email no registrado")
    
    # verificar contrasena
    if not contrasenaContext.verify(contrasena, clienteDB.contrasenaHash):
        raise HTTPException(401, "Contrasena incorrecta")
    
    return clienteDB

# READ - Obtener lista de clientes y por ID
@router.get("/", response_model=list[Cliente])
def listaClientes(session: SessionDep):
    clientes = session.exec(select(Cliente)).all()
    return clientes

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

    #Valores que tiene FastAPI por defecto
    valoresPorDefecto = {"string", "", 0}

    # Revisar que la clave no sea None ni por defecto
    nuevaContrasenaSinEncriptar = datosUpdate.pop('contrasenaHash', None)
    if nuevaContrasenaSinEncriptar is not None and nuevaContrasenaSinEncriptar not in valoresPorDefecto:
        contrasenaEncriptada = contrasenaContext.hash(nuevaContrasenaSinEncriptar)
        clienteDB.contrasenaHash = contrasenaEncriptada
    
    for valor in datosUpdate.items():
        if valor in valoresPorDefecto:
            valor = None

    # Actualizar los datos y cargarlos a la DB
    clienteDB.sqlmodel_update(datosUpdate)
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