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
    """
    Endpoint para crear un nuevo diseno personalizado
    """
    
    # Crear diseno
    diseno = DisenoPersonalizado(
        imagenURL=imagenURL,
        precioEstimado=precioEstimado,
        clienteID=cliente.id
    )

    # Insertar y guardar cambios en la DB
    session.add(diseno)
    session.commit()
    session.refresh(diseno)
    return diseno

    

# READ - Obtener los disenos del cliente
@router.get("/mis-disenos", response_model=list[DisenoPersonalizado])
def misDisenos(session: SessionDep, cliente = Depends(clienteActual)):
    """
    Endpoint para obtener los disenos del cliente
    """
    
    # Obtener disenos del cliente
    disenosDB = session.exec(select(DisenoPersonalizado).where(DisenoPersonalizado.clienteID == cliente.id)).all()

    # Si no hay disenos, mostrar error
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
    """
    Endpoint para actualizar un diseno personalizado
    """
    
    # Obtener diseno por ID
    disenoDB = session.get(DisenoPersonalizado, disenoID)
    
    # Si no existe el diseno, mostrar error
    if not disenoDB:
        raise HTTPException(404, "Diseño no encontrado")
    
    # Actualizar campos
    if imagenURL:
        disenoDB.imagenURL = imagenURL
    if estado:
        disenoDB.estado = estado
    if precioEstimado:
        disenoDB.precioEstimado = precioEstimado
    
    # Insertar y guardar cambios en la DB
    session.add(disenoDB)
    session.commit()
    session.refresh(disenoDB)
    return disenoDB