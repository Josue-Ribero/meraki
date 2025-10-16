from fastapi import Depends, HTTPException, Request
from sqlmodel import select
from ..db.db import SessionDep
from ..models.cliente import Cliente
from ..models.administrador import Administrador

# Dependencia para saber que cliente esta en la sesion
def clienteActual(peticion: Request, session: SessionDep):
    # Busca el id del cliente
    clienteID = peticion.session.get("clienteID")

    # Si no ha iniciado sesion, se lo pide
    if not clienteID:
        raise HTTPException(401, "Debes iniciar sesión")
    
    # Caso si no existe el cliente
    clienteDB = session.get(Cliente, clienteID)
    if not clienteDB:
        raise HTTPException(404, "Cliente no encontrado")
    return clienteDB



# Dependencia para saber que administrador esta en la sesion
def adminActual(peticion: Request, session: SessionDep):
    # Busca el id del cliente
    administradorID = peticion.session.get("administradorID")

    # Si no ha iniciado sesion, se lo pide
    if not administradorID:
        raise HTTPException(401, "Acceso restringido a administradores")
    
    # Caso si no existe el administrador
    adminDB = session.get(Administrador, administradorID)
    if not adminDB:
        raise HTTPException(404, "Administrador no encontrado")
    return adminDB