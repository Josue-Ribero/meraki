from fastapi import Depends, HTTPException, Request
from sqlmodel import select
from ..db.db import SessionDep
from ..models.cliente import Cliente
from ..models.administrador import Administrador

"""
    Módulo de autenticación y dependencias de seguridad.

    Provee funciones para verificar la sesión actual del usuario (Cliente o Administrador)
    y proteger las rutas que requieren autenticación, asegurando que solo usuarios
    autorizados accedan a recursos protegidos.
"""

# Dependencia para saber que cliente esta en la sesion
def clienteActual(request: Request, session: SessionDep):
    # Busca el id del cliente
    clienteID = request.session.get("clienteID")

    # Si no ha iniciado sesion, se lo pide
    if not clienteID:
        raise HTTPException(401, "Debes iniciar sesión")
    
    # Caso si no existe el cliente
    clienteDB = session.get(Cliente, clienteID)
    if not clienteDB or not clienteDB.activo:
        raise HTTPException(404, "Cliente inactivo no encontrado")
    return clienteDB



# Dependencia para saber que administrador esta en la sesion
def adminActual(request: Request, session: SessionDep):
    # Busca el id del cliente
    administradorID = request.session.get("administradorID")

    # Si no ha iniciado sesion, se lo pide
    if not administradorID:
        raise HTTPException(401, "Acceso restringido a administradores")
    
    # Caso si no existe el administrador
    adminDB = session.get(Administrador, administradorID)
    if not adminDB:
        raise HTTPException(404, "Administrador no encontrado")
    return adminDB