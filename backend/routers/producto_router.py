from fastapi import APIRouter, HTTPException, Depends
from ..auth.auth import adminActual
from sqlmodel import select
from ..models.producto import Producto, ProductoCreate, ProductoUpdate
from ..db.db import SessionDep

router = APIRouter(prefix="/productos", tags=["Productos"])

# CREATE - Crear producto
@router.post("/crear", response_model=Producto, status_code=201)
def crearProducto(nuevoProducto: ProductoCreate, session: SessionDep, admin=Depends(adminActual)):
    producto = Producto.model_validate(nuevoProducto, update={"administradorID": admin.id})
    session.add(producto)
    session.commit()
    session.refresh(producto)
    return producto

# READ - Lista de productos
@router.get("/", response_model=list[Producto])
def listaProductos(session: SessionDep):
    productos = session.exec(select(Producto).where(Producto.activo == True)).all()
    return productos

# # READ - Producto por ID
@router.get("/{productoID}", response_model=Producto)
def productoPorID(productoID: int, session: SessionDep):
    productoDB = session.exec(select(Producto).where(Producto.id == productoID, Producto.activo == True)).first()
    if not productoDB:
        raise HTTPException(404, "Producto no encontrado")
    return productoDB

# UPDATE - Actualizar producto
@router.patch("/{productoID}", response_model=Producto)
def actualizarProducto(productoID: int, productoData: ProductoUpdate, session: SessionDep, _=Depends(adminActual)):
    productoDB = session.get(Producto, productoID)
    if not productoDB:
        raise HTTPException(404, "Producto no encontrado")
    
    # Excluir los campos vacios
    productoUpdate = productoDB.model_dump(exclude_none=True)

    productoDB.sqlmodel_update(productoUpdate)
    session.add(productoDB)
    session.commit()
    session.refresh(productoDB)
    return productoDB

# DELETE - Deshabilitar el producto
@router.delete("/{productoID}/deshabilitar", status_code=204)
def deshabilitarProducto(productoID: int, session: SessionDep, _=Depends(adminActual)):
    # Verificar si el producto existe
    productoDB = session.get(Producto, productoID)
    if not productoDB:
        raise HTTPException(404, "Producto no encontrado")
    
    # Deshabilitar el producto
    productoDB.activo = False

    # Guardar el cambio en la DB
    session.add(productoDB)
    session.commit()