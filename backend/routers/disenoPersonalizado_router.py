from fastapi import APIRouter, HTTPException, Depends, Form
from ..auth.auth import clienteActual
from sqlmodel import select
from ..models.disenoPersonalizado import DisenoPersonalizado, DisenoPersonalizadoCreate, DisenoPersonalizadoUpdate
from ..db.db import SessionDep

router = APIRouter(prefix="/disenos", tags=["DiseñosPersonalizados"])

# CREATE - Crear nuevo diseno personalizado
@router.post("/crear", response_model=DisenoPersonalizado, status_code=201)
def crearDiseno(
    imagenURL: str = Form(None),
    precioEstimado: int = Form(0),
    session: SessionDep = None,
    cliente=Depends(clienteActual)
):
    diseno = DisenoPersonalizado(
        imagenURL=imagenURL,
        precioEstimado=precioEstimado,
        clienteID=cliente.id
    )
    session.add(diseno)
    session.commit()
    session.refresh(diseno)
    return diseno

# READ - Obtener los disenos del cliente
@router.get("/mis-disenos", response_model=list[DisenoPersonalizado])
def misDisenos(session: SessionDep, cliente = Depends(clienteActual)):
    disenosDB = session.exec(select(DisenoPersonalizado).where(DisenoPersonalizado.clienteID == cliente.id)).all()
    if not disenosDB:
        raise HTTPException(404, "No tienes disenos personalizados")
    return disenosDB

# UPDATE - Cambiar estado o precio
@router.patch("/{disenoID}", response_model=DisenoPersonalizado)
def actualizarDiseno(
    disenoID: int,
    imagenURL: str = Form(None),
    estado: str = Form(None),
    precioEstimado: int = Form(None),
    session: SessionDep = None
):
    disenoDB = session.get(DisenoPersonalizado, disenoID)
    if not disenoDB:
        raise HTTPException(404, "Diseño no encontrado")
    
    if imagenURL:
        disenoDB.imagenURL = imagenURL
    if estado:
        disenoDB.estado = estado
    if precioEstimado:
        disenoDB.precioEstimado = precioEstimado
    
    session.add(disenoDB)
    session.commit()
    session.refresh(disenoDB)
    return disenoDB