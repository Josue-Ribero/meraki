from fastapi import APIRouter, HTTPException
from sqlmodel import select
from ..models.disenoPersonalizado import DisenoPersonalizado, DisenoPersonalizadoCreate, DisenoPersonalizadoUpdate
from ..db.db import SessionDep

router = APIRouter(prefix="/disenos", tags=["DiseñosPersonalizados"])

# CREATE - Crear nuevo diseno personalizado
@router.post("/crear", response_model=DisenoPersonalizado, status_code=201)
def crearDiseno(disenoNuevo: DisenoPersonalizadoCreate, session: SessionDep):
    diseno = DisenoPersonalizado.model_validate(disenoNuevo)
    session.add(diseno)
    session.commit()
    session.refresh(diseno)
    return diseno

# READ - Obtener lista de disenos por cliente
@router.get("/cliente/{clienteID}", response_model=list[DisenoPersonalizado])
def listaDisenosPorCliente(clienteID: int, session: SessionDep):
    disenos = session.exec(select(DisenoPersonalizado).where(DisenoPersonalizado.clienteID == clienteID)).all()
    return disenos

# UPDATE - Cambiar estado o precio
@router.patch("/{disenoID}", response_model=DisenoPersonalizado)
def actualizarDiseno(disenoID: int, data: DisenoPersonalizadoUpdate, session: SessionDep):
    disenoDB = session.get(DisenoPersonalizado, disenoID)
    if not disenoDB:
        raise HTTPException(404, "Diseño no encontrado")
    disenoDB.sqlmodel_update(data)
    session.add(disenoDB)
    session.commit()
    session.refresh(disenoDB)
    return disenoDB