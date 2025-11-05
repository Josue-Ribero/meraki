from fastapi import APIRouter, HTTPException, Form, Request, Depends, Query
from sqlmodel import select, func
from ..auth.auth import clienteActual, adminActual
from ..models.cliente import Cliente, ClienteUpdate, ClienteHistorico
from ..models.carrito import Carrito
from ..models.wishlist import Wishlist
from ..db.db import SessionDep, contrasenaContext
from fastapi.responses import RedirectResponse
from typing import Optional, List, Dict, Any

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



# READ - Obtener lista de clientes con filtros y paginación
@router.get("/", response_model=Dict[str, Any])
def listaClientes(
    session: SessionDep,
    estado: str = Query("activos", regex="^(activos|eliminados|todos)$"),
    pagina: int = Query(1, ge=1),
    itemsPorPagina: int = Query(10, ge=1, le=100),
    busqueda: Optional[str] = Query(None),
    _=Depends(adminActual)
):
    
    # Base query según el estado
    if estado == "activos":
        query = select(Cliente).where(Cliente.activo == True)
        countQuery = select(func.count(Cliente.id)).where(Cliente.activo == True)
    elif estado == "eliminados":
        query = select(ClienteHistorico)
        countQuery = select(func.count(ClienteHistorico.id))

    # Si el estado es "Todos"
    else:
        # Consultar activos
        queryClientes = select(Cliente)
        # Consultar históricos
        queryHistorico = select(ClienteHistorico)

        # Filtro de búsqueda
        if busqueda:
            searchTerm = f"%{busqueda}%"
            queryClientes = queryClientes.where(
                (Cliente.nombre.ilike(searchTerm)) |
                (Cliente.email.ilike(searchTerm)) |
                (Cliente.telefono.ilike(searchTerm))
            )
            queryHistorico = queryHistorico.where(
                (ClienteHistorico.nombre.ilike(searchTerm)) |
                (ClienteHistorico.email.ilike(searchTerm)) |
                (ClienteHistorico.telefono.ilike(searchTerm))
            )

        clientesActivos = session.exec(queryClientes).all()
        clientesHistoricos = session.exec(queryHistorico).all()

        # Convertir a diccionarios
        clientes = []
        for cliente in clientesActivos:
            clientes.append({
                "id": cliente.id,
                "nombre": cliente.nombre,
                "email": cliente.email,
                "telefono": cliente.telefono,
                "puntos": cliente.puntos,
                "activo": cliente.activo,
                "fechaCreacion": cliente.fechaCreacion.isoformat() if cliente.fechaCreacion else None,
                "tipo": "cliente"
            })
        for historico in clientesHistoricos:
            clientes.append({
                "id": historico.id,
                "nombre": historico.nombre,
                "email": historico.email,
                "telefono": historico.telefono,
                "fechaEliminacion": historico.fechaEliminacion.isoformat() if historico.fechaEliminacion else None,
                "tipo": "historico"
            })

        # Ordenar por fecha (más reciente primero)
        clientes.sort(key=lambda x: x.get("fechaCreacion") or x.get("fechaEliminacion") or "", reverse=True)

        # Paginación manual
        total = len(clientes)
        totalPaginas = max(1, (total + itemsPorPagina - 1) // itemsPorPagina)
        offset = (pagina - 1) * itemsPorPagina
        clientes_paginados = clientes[offset:offset + itemsPorPagina]

        return {
            "clientes": clientes_paginados,
            "paginacion": {
                "paginaActual": pagina,
                "itemsPorPagina": itemsPorPagina,
                "totalItems": total,
                "totalPaginas": totalPaginas
            }
        }

    # Aplicar búsqueda si se proporciona
    if busqueda:
        searchTerm = f"%{busqueda}%"
        if estado == "eliminados":
            query = query.where(
                (ClienteHistorico.nombre.ilike(searchTerm)) |
                (ClienteHistorico.email.ilike(searchTerm)) |
                (ClienteHistorico.telefono.ilike(searchTerm))
            )
            countQuery = countQuery.where(
                (ClienteHistorico.nombre.ilike(searchTerm)) |
                (ClienteHistorico.email.ilike(searchTerm)) |
                (ClienteHistorico.telefono.ilike(searchTerm))
            )
        else:
            query = query.where(
                (Cliente.nombre.ilike(searchTerm)) |
                (Cliente.email.ilike(searchTerm)) |
                (Cliente.telefono.ilike(searchTerm))
            )
            countQuery = countQuery.where(
                (Cliente.nombre.ilike(searchTerm)) |
                (Cliente.email.ilike(searchTerm)) |
                (Cliente.telefono.ilike(searchTerm))
            )

    # Calcular paginación
    offset = (pagina - 1) * itemsPorPagina
    query = query.offset(offset).limit(itemsPorPagina)
    
    # Ejecutar consultas
    total = session.exec(countQuery).first() or 0
    clientes_db = session.exec(query).all()

    # Convertir a diccionarios para serialización JSON
    clientes = []
    for cliente in clientes_db:
        if estado == "eliminados":
            # Es un ClienteHistorico
            cliente_dict = {
                "id": cliente.id,
                "nombre": cliente.nombre,
                "email": cliente.email,
                "telefono": cliente.telefono,
                "fechaEliminacion": cliente.fechaEliminacion.isoformat() if cliente.fechaEliminacion else None,
                "tipo": "historico"
            }
        else:
            # Es un Cliente
            cliente_dict = {
                "id": cliente.id,
                "nombre": cliente.nombre,
                "email": cliente.email,
                "telefono": cliente.telefono,
                "puntos": cliente.puntos,
                "activo": cliente.activo,
                "fechaCreacion": cliente.fechaCreacion.isoformat() if cliente.fechaCreacion else None,
                "tipo": "cliente"
            }
        clientes.append(cliente_dict)

    # Calcular total de páginas
    totalPaginas = (total + itemsPorPagina - 1) // itemsPorPagina if total else 1

    return {
        "clientes": clientes,
        "paginacion": {
            "paginaActual": pagina,
            "itemsPorPagina": itemsPorPagina,
            "totalItems": total,
            "totalPaginas": totalPaginas
        }
    }



# READ - Obtener un cliente (solo administrador)
@router.get("/{clienteID}", response_model=Dict[str, Any])
def clientePorID(clienteID: int, session: SessionDep, _=Depends(adminActual)):
    clienteDB = session.get(Cliente, clienteID)
    if not clienteDB:
        raise HTTPException(404, "Cliente no encontrado")
    
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
@router.patch("/{clienteID}", response_model=Dict[str, Any])
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