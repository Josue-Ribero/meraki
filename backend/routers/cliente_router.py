from fastapi import APIRouter, HTTPException, Form, Request, Depends
from sqlmodel import select
from ..auth.auth import clienteActual, adminActual
from ..models.cliente import Cliente, ClienteUpdate, ClienteHistorico
from ..models.carrito import Carrito
from ..models.pedido import Pedido, EstadoPedido
from ..models.detallePedido import DetallePedido
from ..models.disenoPersonalizado import DisenoPersonalizado, EstadoDiseno
from ..models.pago import Pago
from ..models.wishlist import Wishlist
from ..db.db import SessionDep, contrasenaContext
from fastapi.responses import RedirectResponse
from datetime import datetime as dt

router = APIRouter(prefix="/clientes", tags=["Clientes"])

# CREATE - Registro del cliente
@router.post("/registrar")
def registrarClienteForm(
    request: Request,
    nombre: str = Form(...),
    email: str = Form(...),
    contrasena: str = Form(...),
    telefono: str = Form(...),
    session: SessionDep = None
):
    """
    Este endpoint registra un nuevo cliente en la app.
    """
    
    # Verificar si el email ya está registrado
    clienteDB = session.exec(select(Cliente).where(Cliente.email == email)).first()
    
    # Si el email ya esta registrado, mostrar error
    if clienteDB:
        raise HTTPException(400, "Este email ya tiene una cuenta asociada")

    # Verificar si el email está en el histórico (eliminado)
    clienteHistoricoDB = session.exec(select(ClienteHistorico).where(ClienteHistorico.email == email)).first()
    
    # Si el email ya esta registrado, mostrar error
    if clienteHistoricoDB:
        raise HTTPException(400, "Este email ya tuvo una cuenta asociada y no puede volver a registrarse")
    
    # Validar formato de teléfono
    if telefono and len(telefono) < 7:
        raise HTTPException(400, "El número de teléfono debe tener al menos 7 dígitos")
    
    # Crear el nuevo cliente si no esta registrado
    nuevoCliente = Cliente(
        nombre=nombre,
        email=email,
        telefono=telefono,
        contrasenaHash=contrasenaContext.hash(contrasena),
    )

    # Agregar el nuevo cliente a la DB
    session.add(nuevoCliente)
    session.flush()

    # Agregar el carrito y la wishlist al nuevo cliente
    session.add(Carrito(clienteID=nuevoCliente.id))
    session.add(Wishlist(clienteID=nuevoCliente.id))

    # Guardar los cambios en la DB
    session.commit()

    # Guardar el ID del cliente en la sesion
    request.session["clienteID"] = nuevoCliente.id
    return RedirectResponse(url="/", status_code=303)



# READ - Panel de cliente
@router.get("/mi-perfil")
def miPerfil(session: SessionDep, cliente=Depends(clienteActual)):
    """
    Devuelve los datos del cliente actual autenticado.
    """
    return {
        "id": cliente.id,
        "nombre": cliente.nombre,
        "email": cliente.email,
        "telefono": cliente.telefono,
        "puntos": cliente.puntos,
        "activo": cliente.activo,
        "fechaCreacion": cliente.fechaCreacion.isoformat() if cliente.fechaCreacion else None
        }



# READ - Obtener lista de clientes
@router.get("/")
def listaClientes(session: SessionDep, _=Depends(adminActual)):
    """
    Este endpoint lista todos los clientes activos.
    """
    
    # Obtener lista de clientes activos
    clientes = session.exec(select(Cliente).where(Cliente.activo == True)).all()
    
    resultado = []
    for cliente in clientes:
        resultado.append({
            "id": cliente.id,
            "nombre": cliente.nombre,
            "email": cliente.email,
            "telefono": cliente.telefono,
            "puntos": cliente.puntos,
            "activo": cliente.activo,
            "fechaCreacion": cliente.fechaCreacion.isoformat() if cliente.fechaCreacion else None,
            "tipo": "cliente"
        })
    
    return {"clientes": resultado}



# READ - Obtener todos los clientes incluyendo inactivos
@router.get("/todos")
def todosClientes(session: SessionDep, _=Depends(adminActual)):
    """
    Este endpoint lista todos los clientes, incluyendo los inactivos y los eliminados.
    """
    
    # Obtener todos los clientes (activos e inactivos)
    clientes = session.exec(select(Cliente)).all()
    
    # Obtener clientes del historico que no tienen un cliente activo con el mismo email
    clientesHistoricos = session.exec(select(ClienteHistorico)).all()
    
    # Lista de todos los clientes
    resultado = []
    
    # Agregar clientes de la tabla Cliente
    for cliente in clientes:
        resultado.append({
            "id": cliente.id,
            "nombre": cliente.nombre,
            "email": cliente.email,
            "telefono": cliente.telefono,
            "puntos": cliente.puntos,
            "activo": cliente.activo,
            "fechaCreacion": cliente.fechaCreacion.isoformat() if cliente.fechaCreacion else None,
            "tipo": "cliente"
        })
    
    # Agregar clientes del historico que no están en la tabla Cliente
    for historico in clientesHistoricos:
        # Verificar que no existe un cliente (activo o inactivo) con el mismo email
        clienteDB = session.exec(select(Cliente).where(Cliente.email == historico.email)).first()
        
        if not clienteDB:
            resultado.append({
                "id": historico.id,
                "nombre": historico.nombre,
                "email": historico.email,
                "telefono": historico.telefono,
                "fechaEliminacion": historico.fechaEliminacion.isoformat() if historico.fechaEliminacion else None,
                "tipo": "historico"
            })
    
    return {"clientes": resultado}



# READ - Obtener clientes eliminados
@router.get("/eliminados")
def clientesEliminados(session: SessionDep, _=Depends(adminActual)):
    """
    Este endpoint lista todos los clientes eliminados.
    """
    
    # Obtener clientes del historico que corresponden a clientes eliminados
    clientesHistoricos = session.exec(select(ClienteHistorico)).all()
    
    # Lista de clientes eliminados
    resultado = []

    # Recorrer todos los clientes del historico
    for historico in clientesHistoricos:
        clienteActivo = session.exec(select(Cliente).where(Cliente.email == historico.email)).first()
        
        # Si no existe un cliente activo con el mismo email, agregarlo a la lista
        if not clienteActivo:
            resultado.append({
                "id": historico.id,
                "nombre": historico.nombre,
                "email": historico.email,
                "telefono": historico.telefono,
                "fechaEliminacion": historico.fechaEliminacion.isoformat() if historico.fechaEliminacion else None,
                "tipo": "historico"
            })
    
    return {"clientes": resultado}



# READ - Obtener un cliente (solo administrador)
@router.get("/{clienteID}")
def clientePorID(clienteID: int, session: SessionDep, _=Depends(adminActual)):
    """
    Este endpoint obtiene un cliente por su ID.
    """
    
    # Obtener el cliente
    clienteDB = session.get(Cliente, clienteID)
    if not clienteDB:
        raise HTTPException(404, "Cliente no encontrado")
    
    # Devolver el cliente
    return {
        "id": clienteDB.id,
        "nombre": clienteDB.nombre,
        "email": clienteDB.email,
        "telefono": clienteDB.telefono,
        "puntos": clienteDB.puntos,
        "activo": clienteDB.activo,
        "fechaCreacion": clienteDB.fechaCreacion.isoformat() if clienteDB.fechaCreacion else None
    }



# UPDATE - Actualizar datos personales del cliente
@router.patch("/{clienteID}")
def actualizarCliente(
    clienteID: int, 
    nombre: str = Form(None),
    telefono: str = Form(None),
    contrasena: str = Form(None),
    session: SessionDep = None,
    cliente=Depends(clienteActual)
):
    """
    Este endpoint actualiza los datos personales del cliente.
    """
    
    # Verificar que el cliente que intenta actualizar es el mismo
    if clienteID != cliente.id:
        raise HTTPException(403, "No puedes actualizar otros clientes")
    
    # Obtener el cliente
    clienteDB = session.get(Cliente, clienteID)
    if not clienteDB:
        raise HTTPException(404, "Cliente no encontrado")
    
    # Actualizar los datos del cliente
    if nombre:
        clienteDB.nombre = nombre
    if telefono:
        # Validar teléfono si se proporciona
        if len(telefono) < 7:
            raise HTTPException(400, "El número de teléfono debe tener al menos 7 dígitos")
        clienteDB.telefono = telefono
    if contrasena:
        clienteDB.contrasenaHash = contrasenaContext.hash(contrasena)
    
    # Insertar y guardar los cambios en la DB
    session.add(clienteDB)
    session.commit()
    session.refresh(clienteDB)
    
    # Devolver el cliente actualizado
    return {
        "id": clienteDB.id,
        "nombre": clienteDB.nombre,
        "email": clienteDB.email,
        "telefono": clienteDB.telefono,
        "puntos": clienteDB.puntos,
        "activo": clienteDB.activo
    }



# DELETE - Eliminar cliente
@router.delete("/eliminar-cuenta")
def eliminarCliente(
    request: Request,
    session: SessionDep, 
    cliente=Depends(clienteActual)
):
    """
    Este endpoint elimina la cuenta del cliente.
    """
    
    try:
        # Obtener el cliente
        clienteDB = session.get(Cliente, cliente.id)
        if not clienteDB:
            raise HTTPException(404, "Cliente no encontrado")

        # Verificar si el cliente tiene pedidos activos
        pedidosActivos = session.exec(
            select(Pedido).where(
                Pedido.clienteID == cliente.id,
                Pedido.estado.in_([EstadoPedido.POR_PAGAR, EstadoPedido.PENDIENTE])
            )
        ).all()
        
        if pedidosActivos:
            raise HTTPException(400, "No puedes eliminar tu cuenta porque tienes pedidos activos.")
        
        # Verificar si el cliente tiene diseños en producción
        disenosEnProduccion = session.exec(
            select(DisenoPersonalizado).where(
                DisenoPersonalizado.clienteID == cliente.id,
                DisenoPersonalizado.estado == EstadoDiseno.EN_PRODUCCION
            )
        ).all()
        
        if disenosEnProduccion:
            raise HTTPException(400, "No puedes eliminar tu cuenta porque tienes diseños en producción.")

        # Crear registro en el historico antes de eliminar
        historico = ClienteHistorico(
            nombre=clienteDB.nombre,
            email=clienteDB.email,
            telefono=clienteDB.telefono,
            fechaEliminacion=dt.now()
        )

        # Insertar y guardar el historico en la DB
        session.add(historico)

        # Eliminar carrito
        carrito = session.exec(select(Carrito).where(Carrito.clienteID == cliente.id)).first()
        if carrito:
            session.delete(carrito)
        
        # Eliminar wishlist
        wishlist = session.exec(select(Wishlist).where(Wishlist.clienteID == cliente.id)).first()
        if wishlist:
            session.delete(wishlist)
        
        # Eliminar el cliente
        session.delete(clienteDB)
        session.commit()

        # Limpiar la sesión
        request.session.clear()
        
        return {
            "mensaje": "Cuenta eliminada correctamente. Todos tus datos han sido eliminados.",
            "redirect": "/"
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error al eliminar cliente: {str(e)}")
        raise HTTPException(500, "Error interno al eliminar la cuenta")