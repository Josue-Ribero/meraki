from fastapi import APIRouter, HTTPException, Depends, Form
from ..auth.auth import clienteActual
from sqlmodel import select
from datetime import datetime
from ..models.solicitudRecuperacion import SolicitudRecuperacion, SolicitudRecuperacionCreate
from ..db.db import SessionDep

router = APIRouter(prefix="/recuperacion", tags=["Recuperacion"])

# CREATE - Crear una solicitud
@router.post("/crear", response_model=SolicitudRecuperacion, status_code=201)
def crearSolicitud(
    session: SessionDep = None,
    cliente=Depends(clienteActual)
):
    solicitud = SolicitudRecuperacion(
        clienteID=cliente.id
    )
    session.add(solicitud)
    session.commit()
    session.refresh(solicitud)
    return solicitud

# READ - Validar token
@router.get("/validar/{token}", response_model=SolicitudRecuperacion)
def validarToken(token: str, session: SessionDep):
    solicitudDB = session.exec(select(SolicitudRecuperacion).where(SolicitudRecuperacion.token == token)).first()
    if not solicitudDB or solicitudDB.expiracion < datetime.now() or solicitudDB.usado:
        raise HTTPException(400, "Token inválido o expirado")
    return solicitudDB