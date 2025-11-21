# routers/producto.py
from fastapi import APIRouter, HTTPException, Depends, Form, UploadFile, File
from ..auth.auth import adminActual
from sqlmodel import select
from ..models.producto import Producto
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
    # Verificar si ya existe un producto con ese SKU
    productoDB = session.exec(select(Producto).where(Producto.sku == sku)).first()
    if productoDB:
        raise HTTPException(400, "El SKU ya existe")
    
    # Manejar la imagen
    imagenURL = None
    if imagen and imagen.filename:
        try:
            # La función cargarArchivo ahora devuelve la URL directa de Supabase
            imagenURL = await cargarArchivo(imagen)
        except Exception as e:
            raise HTTPException(500, f"Error al subir la imagen: {str(e)}")
    
    # Crear el objeto del producto
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
    
    # Insertar en la DB y guardar los cambios
    session.add(producto)
    session.commit()
    session.refresh(producto)

    return producto



# READ - Lista de productos
@router.get("/", response_model=list[Producto])
def listaProductos(session: SessionDep):
    # Obtener la lista de todos los productos de la DB que estén activos
    productos = session.exec(select(Producto).where(Producto.activo == True)).all()

    return productos



# READ - Lista de todos los productos (incluyendo inactivos) - solo admin
@router.get("/todas", response_model=list[Producto])
def listaTodosProductos(session: SessionDep, _=Depends(adminActual)):
    # Obtener la lista de todos los productos de la DB
    productos = session.exec(select(Producto)).all()

    return productos



# READ - Producto por ID
@router.get("/{productoID}", response_model=Producto)
def productoPorID(productoID: int, session: SessionDep):
    # Verificar que el producto exista en la DB
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
    activo: bool = Form(None),
    imagen: UploadFile = File(None),
    session: SessionDep = None,
    _=Depends(adminActual)
):
    # Verificar que el producto exista en la DB
    productoDB = session.get(Producto, productoID)
    if not productoDB:
        raise HTTPException(404, "Producto no encontrado")
    
    # Verificar si el SKU ya existe (excluyendo el producto actual)
    if sku and sku != productoDB.sku:
        productoExistente = session.exec(select(Producto).where(Producto.sku == sku, Producto.id != productoID)).first()
        if productoExistente:
            raise HTTPException(400, "El SKU ya existe")
    
    # Manejar la imagen
    if imagen and imagen.filename:
        try:
            # La función cargarArchivo ahora devuelve la URL directa de Supabase
            imagenURL = await cargarArchivo(imagen)
            productoDB.imagenURL = imagenURL
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
    if activo is not None:
        productoDB.activo = activo

    # Guardar cambios en la DB
    session.add(productoDB)
    session.commit()
    session.refresh(productoDB)

    return productoDB



# UPDATE - Reactivar un producto
@router.patch("/{productoID}/habilitar", response_model=Producto)
def habilitarProducto(productoID: int, session: SessionDep, _=Depends(adminActual)):
    # Verificar que el producto exista en la DB
    productoDB = session.get(Producto, productoID)
    if not productoDB:
        raise HTTPException(404, "Producto no encontrado")
    
    # Reactivar el producto
    productoDB.activo = True
    
    # Insertar en la DB y guardar los cambios
    session.add(productoDB)
    session.commit()
    session.refresh(productoDB)

    return productoDB



# DELETE - Deshabilitar el producto
@router.delete("/{productoID}/deshabilitar", status_code=204)
def deshabilitarProducto(productoID: int, session: SessionDep, _=Depends(adminActual)):
    # Verificar que el producto exista en la DB
    productoDB = session.get(Producto, productoID)
    if not productoDB:
        raise HTTPException(404, "Producto no encontrado")
    
    # Desactivar el producto
    productoDB.activo = False

    # Insertar en la DB y guardar los cambios
    session.add(productoDB)
    session.commit()