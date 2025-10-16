from fastapi import APIRouter, HTTPException, Form, Request, Depends
from sqlmodel import select
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
        return RedirectResponse(url="/registrar?error=email_existente", status_code=303)
    
    # Crear un objeto cliente
    nuevoCliente = Cliente(
        nombre=nombre,
        email=email,
        contrasenaHash=contrasenaContext.hash(contrasena),
    )

    # Insertar el usuario a la DB y preparar los cambios
    session.add(nuevoCliente)
    session.flush()

    # Crear carrito y wishlist para el cliente
    session.add(Carrito(clienteID=nuevoCliente.id))
    session.add(Wishlist(clienteID=nuevoCliente.id))

    # Guardar cambios en la DB
    session.commit()

    # Guardar sesión activa
    request.session["clienteID"] = nuevoCliente.id

    # Redirigir a la página principal o perfil del cliente
    return RedirectResponse(url="/personal", status_code=303)



# READ - Obtener lista de clientes
@router.get("/", response_model=list[Cliente])
def listaClientes(session: SessionDep):
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
@router.delete("/eliminar-cuenta/{clienteID}")
def eliminarCliente(clienteID: int, session: SessionDep):
    # Verificar si el cliente existe
    cliente = session.get(Cliente, clienteID)
    if not cliente:
        raise HTTPException(404, "Cliente no encontrado")

    # Copiar a histórico
    historico = ClienteHistorico(
        nombre=cliente.nombre,
        email=cliente.email,
        telefono=cliente.telefono
    )
    session.add(historico)

    # Insertar pedidos
    for pedido in cliente.pedidos:
        pedido.clienteEliminado = True
        session.add(pedido)

    # Insertar pagos
    for pago in cliente.pagos:
        pago.clienteEliminado = True
        session.add(pago)

    # Eliminar cliente
    session.delete(cliente)
    session.commit()