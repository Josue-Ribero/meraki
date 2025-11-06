# routers/producto.py
from fastapi import APIRouter, HTTPException, Depends, Form, UploadFile, File
from ..auth.auth import adminActual
from sqlmodel import select
from ..models.producto import Producto, ProductoCreate, ProductoUpdate
from ..db.db import SessionDep
from ..utils.bucket import cargarArchivo
import os

router = APIRouter(prefix="/productos", tags=["Productos"])

# CREATE - Crear producto con imagen
@router.post("/crear", response_model=Producto, status_code=201)
async def crearProducto(
    nombre: str = Form(...),
    sku: str = Form(...),
    descripcion: str = Form(None),
    precio: int = Form(...),
    stock: int = Form(0),
    esPersonalizado: bool = Form(False),
    opcionesColor: str = Form(None),
    opcionesTamano: str = Form(None),
    categoriaID: int = Form(...),
    imagen: UploadFile = File(None),
    session: SessionDep = None,
    admin=Depends(adminActual)
):
    # Verificar si el SKU ya existe
    producto_existente = session.exec(select(Producto).where(Producto.sku == sku)).first()
    if producto_existente:
        raise HTTPException(400, "El SKU ya existe")
    
    # Manejar la imagen
    imagenURL = None
    if imagen and imagen.filename:
        try:
            archivo_info = await cargarArchivo(imagen)
            # CAMBIO IMPORTANTE: Usar /uploads en lugar de /static
            imagenURL = f"/uploads/{archivo_info['nombre_archivo']}"
        except Exception as e:
            raise HTTPException(500, f"Error al subir la imagen: {str(e)}")
    
    producto = Producto(
        nombre=nombre,
        sku=sku,
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

# UPDATE - Actualizar producto con imagen
@router.patch("/{productoID}", response_model=Producto)
async def actualizarProducto(
    productoID: int,
    nombre: str = Form(None),
    sku: str = Form(None),
    descripcion: str = Form(None),
    precio: int = Form(None),
    stock: int = Form(None),
    esPersonalizado: bool = Form(None),
    opcionesColor: str = Form(None),
    opcionesTamano: str = Form(None),
    categoriaID: int = Form(None),
    activo: bool = Form(None),  # <-- AGREGAR ESTE PARÁMETRO
    imagen: UploadFile = File(None),
    session: SessionDep = None,
    _=Depends(adminActual)
):
    productoDB = session.get(Producto, productoID)
    if not productoDB:
        raise HTTPException(404, "Producto no encontrado")
    
    # Verificar si el SKU ya existe (excluyendo el producto actual)
    if sku and sku != productoDB.sku:
        producto_existente = session.exec(select(Producto).where(Producto.sku == sku, Producto.id != productoID)).first()
        if producto_existente:
            raise HTTPException(400, "El SKU ya existe")
    
    # Manejar la imagen
    if imagen and imagen.filename:
        try:
            archivo_info = await cargarArchivo(imagen)
            productoDB.imagenURL = f"/static/{archivo_info['nombre_archivo']}"
        except Exception as e:
            raise HTTPException(500, f"Error al subir la imagen: {str(e)}")
    
    # Actualizar otros campos
    if nombre:
        productoDB.nombre = nombre
    if sku:
        productoDB.sku = sku
    if descripcion is not None:
        productoDB.descripcion = descripcion
    if precio:
        productoDB.precio = precio
    if stock is not None:
        productoDB.stock = stock
    if esPersonalizado is not None:
        productoDB.esPersonalizado = esPersonalizado
    if opcionesColor is not None:
        productoDB.opcionesColor = opcionesColor
    if opcionesTamano is not None:
        productoDB.opcionesTamano = opcionesTamano
    if categoriaID:
        productoDB.categoriaID = categoriaID
    if activo is not None:  # <-- AGREGAR ESTA LÍNEA
        productoDB.activo = activo  # <-- AGREGAR ESTA LÍNEA
    
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