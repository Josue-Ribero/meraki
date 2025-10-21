from fastapi import APIRouter, HTTPException, Form, Request, Depends
from sqlmodel import select
from ..auth.auth import clienteActual
from ..auth.auth import adminActual
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
    session: SessionDep = None
):
    # Verificar si ya existe el email
    clienteDB = session.exec(select(Cliente).where(Cliente.email == email)).first()
    if clienteDB:
        return HTTPException(400, "Este email ya tiene una cuenta asociada")
    
    # Crear un objeto cliente
    nuevoCliente = Cliente(
        nombre=nombre,
        email=email,
        contrasenaHash=contrasenaContext.hash(contrasena),
    )

    # Insertar el usuario a la DB y preparar los cambios
    session.add(nuevoCliente)
    session.flush() # Obtiene el id antes de guardar los cambios

    # Crear carrito y wishlist para el cliente
    session.add(Carrito(clienteID=nuevoCliente.id))
    session.add(Wishlist(clienteID=nuevoCliente.id))

    # Guardar cambios en la DB
    session.commit()

    # Guardar sesión activa
    request.session["clienteID"] = nuevoCliente.id

    # Redirigir a la página principal
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
@router.delete("/eliminar-cuenta")
def eliminarCliente(session: SessionDep,cliente=Depends(clienteActual)):
    # Verificar si el cliente existe
    clienteDB = session.get(Cliente, cliente.id)
    if not clienteDB:
        raise HTTPException(404, "Cliente no encontrado")

    # Copiar a histórico
    historico = ClienteHistorico(
        nombre=clienteDB.nombre,
        email=clienteDB.email,
        telefono=clienteDB.telefono
    )
    session.add(historico)

    # Eliminar cliente
    session.delete(clienteDB)
    session.commit()

    return {"mensaje": "Cuenta eliminada correctamente"}