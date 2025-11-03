from fastapi import APIRouter, HTTPException, Depends, Form
from ..auth.auth import adminActual
from sqlmodel import select
from ..models.producto import Producto, ProductoCreate, ProductoUpdate
from ..db.db import SessionDep

router = APIRouter(prefix="/productos", tags=["Productos"])

# CREATE - Crear producto
@router.post("/crear", response_model=Producto, status_code=201)
def crearProducto(
    nombre: str = Form(...),
    descripcion: str = Form(None),
    precio: int = Form(...),
    stock: int = Form(0),
    imagenURL: str = Form(None),
    esPersonalizado: bool = Form(False),
    opcionesColor: str = Form(None),
    opcionesTamano: str = Form(None),
    categoriaID: int = Form(...),
    session: SessionDep = None,
    admin=Depends(adminActual)
):
    producto = Producto(
        nombre=nombre,
        descripcion=descripcion,
        precio=precio,
        stock=stock,
        imagenURL=imagenURL,
        esPersonalizado=esPersonalizado,
        opcionesColor=opcionesColor,
        opcionesTamano=opcionesTamano,
        categoriaID=categoriaID,
        administradorID=admin.id
    )
    session.add(producto)
    session.commit()
    session.refresh(producto)
    return producto

# READ - Lista de productos
@router.get("/", response_model=list[Producto])
def listaProductos(session: SessionDep):
    productos = session.exec(select(Producto).where(Producto.activo == True)).all()
    return productos

# READ - Producto por ID
@router.get("/{productoID}", response_model=Producto)
def productoPorID(productoID: int, session: SessionDep):
    productoDB = session.exec(select(Producto).where(Producto.id == productoID, Producto.activo == True)).first()
    if not productoDB:
        raise HTTPException(404, "Producto no encontrado")
    return productoDB

# UPDATE - Actualizar producto
@router.patch("/{productoID}", response_model=Producto)
def actualizarProducto(
    productoID: int,
    nombre: str = Form(None),
    descripcion: str = Form(None),
    precio: int = Form(None),
    stock: int = Form(None),
    imagenURL: str = Form(None),
    esPersonalizado: bool = Form(None),
    opcionesColor: str = Form(None),
    opcionesTamano: str = Form(None),
    categoriaID: int = Form(None),
    session: SessionDep = None,
    _=Depends(adminActual)
):
    productoDB = session.get(Producto, productoID)
    if not productoDB:
        raise HTTPException(404, "Producto no encontrado")
    
    if nombre:
        productoDB.nombre = nombre
    if descripcion is not None:
        productoDB.descripcion = descripcion
    if precio:
        productoDB.precio = precio
    if stock is not None:
        productoDB.stock = stock
    if imagenURL is not None:
        productoDB.imagenURL = imagenURL
    if esPersonalizado is not None:
        productoDB.esPersonalizado = esPersonalizado
    if opcionesColor is not None:
        productoDB.opcionesColor = opcionesColor
    if opcionesTamano is not None:
        productoDB.opcionesTamano = opcionesTamano
    if categoriaID:
        productoDB.categoriaID = categoriaID
    
    session.add(productoDB)
    session.commit()
    session.refresh(productoDB)
    return productoDB

# DELETE - Deshabilitar el producto
@router.delete("/{productoID}/deshabilitar", status_code=204)
def deshabilitarProducto(productoID: int, session: SessionDep, _=Depends(adminActual)):
    productoDB = session.get(Producto, productoID)
    if not productoDB:
        raise HTTPException(404, "Producto no encontrado")
    
    productoDB.activo = False
    session.add(productoDB)
    session.commit()