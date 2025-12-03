from fastapi import APIRouter, HTTPException, Depends, Form
from typing import Optional
from sqlmodel import select
from ..auth.auth import clienteActual
from ..models.disenoPersonalizado import DisenoPersonalizado, DisenoPersonalizadoCreate, DisenoPersonalizadoUpdate
from ..models.carrito import Carrito, DetalleCarrito
from ..db.db import SessionDep

router = APIRouter(prefix="/disenos", tags=["DiseñosPersonalizados"])

# CREATE - Crear nuevo diseno personalizado
@router.post("/crear", response_model=DisenoPersonalizado, status_code=201)
def crearDiseno(
    imagenURL: Optional[str] = Form(None),
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

# CREATE - Agregar al carrito (VERSIÓN SUPER SIMPLIFICADA)
@router.post("/agregar")
def agregarAlCarrito(
    disenoPersonalizadoID: Optional[int] = Form(None),
    cantidad: int = Form(1, ge=1),
    session: SessionDep = None,
    cliente=Depends(clienteActual)
):
    """
    Endpoint para agregar un diseño personalizado al carrito
    """
    
    try:
        # Verificar que el ID esté presente
        if not disenoPersonalizadoID:
            raise HTTPException(400, "Se requiere disenoPersonalizadoID")
        
        # Verificar que el diseño pertenezca al cliente
        diseno = session.get(DisenoPersonalizado, disenoPersonalizadoID)
        if not diseno or diseno.clienteID != cliente.id:
            raise HTTPException(404, "Diseño no encontrado o no autorizado")
        
        carrito = Carrito()
        
        # Si el modelo Carrito tiene clienteID, asignarlo
        try:
            carrito.clienteID = cliente.id
        except AttributeError:
            pass  # El modelo no tiene clienteID
        
        session.add(carrito)
        session.commit()
        session.refresh(carrito)
        
        # Crear detalle del carrito
        nuevoDetalle = DetalleCarrito(
            carritoID=carrito.id,
            cantidad=cantidad,
            disenoPersonalizadoID=disenoPersonalizadoID
        )
        
        # Si el modelo DetalleCarrito tiene productoID, asignarlo como None
        try:
            nuevoDetalle.productoID = None
        except AttributeError:
            pass  # El modelo no tiene productoID
        
        session.add(nuevoDetalle)
        session.commit()
        
        return {"mensaje": "Diseño personalizado agregado al carrito exitosamente"}
        
    except Exception as e:
        # Log del error para depuración
        print(f"Error al agregar al carrito: {str(e)}")
        raise HTTPException(500, f"Error interno del servidor: {str(e)}")

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
    imagenURL: Optional[str] = Form(None),
    estado: Optional[str] = Form(None),
    precioEstimado: Optional[int] = Form(None),
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
    if imagenURL is not None:
        disenoDB.imagenURL = imagenURL
    if estado is not None:
        disenoDB.estado = estado
    if precioEstimado is not None:
        disenoDB.precioEstimado = precioEstimado
    
    # Insertar y guardar cambios en la DB
    session.add(disenoDB)
    session.commit()
    session.refresh(disenoDB)
    return disenoDB