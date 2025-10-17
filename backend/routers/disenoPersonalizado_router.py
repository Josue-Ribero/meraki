from fastapi import APIRouter, HTTPException, Depends
from ..auth.auth import clienteActual
from sqlmodel import select
from ..models.disenoPersonalizado import DisenoPersonalizado, DisenoPersonalizadoCreate, DisenoPersonalizadoUpdate
from ..db.db import SessionDep

router = APIRouter(prefix="/disenos", tags=["DiseñosPersonalizados"])

# CREATE - Crear nuevo diseno personalizado
@router.post("/crear", response_model=DisenoPersonalizado, status_code=201)
def crearDiseno(disenoNuevo: DisenoPersonalizadoCreate, session: SessionDep, cliente=Depends(clienteActual)):
    # Asignar diseno al cliente
    diseno = DisenoPersonalizado.model_validate(disenoNuevo, update={"clienteID": cliente.id})
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
def actualizarDiseno(disenoID: int, disenoData: DisenoPersonalizadoUpdate, session: SessionDep):
    disenoDB = session.get(DisenoPersonalizado, disenoID)
    if not disenoDB:
        raise HTTPException(404, "Diseño no encontrado")
    
    # Excluir los campos vacios
    disenoUpdate = disenoDB.model_dump(exclude_none=True)
    
    disenoDB.sqlmodel_update(disenoUpdate)
    session.add(disenoDB)
    session.commit()
    session.refresh(disenoDB)
    return disenoDB