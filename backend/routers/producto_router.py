from fastapi import APIRouter, HTTPException, Depends
from ..auth.auth import adminActual
from sqlmodel import select
from ..models.producto import Producto, ProductoCreate, ProductoUpdate
from ..db.db import SessionDep

router = APIRouter(prefix="/productos", tags=["Productos"])

# CREATE - Crear producto
@router.post("/crear", response_model=Producto, status_code=201)
def crearProducto(nuevoProducto: ProductoCreate, session: SessionDep, admin = Depends(adminActual)):
    producto = Producto.model_validate(nuevoProducto)
    session.add(producto)
    session.commit()
    session.refresh(producto)
    return producto

# READ - Lista de productos y por ID
@router.get("/", response_model=list[Producto])
def listaProductos(session: SessionDep):
    productos = session.exec(select(Producto)).all()
    return productos

@router.get("/{productoID}", response_model=Producto)
def productoPorID(productoID: int, session: SessionDep):
    producto = session.get(Producto, productoID)
    if not producto:
        raise HTTPException(404, "Producto no encontrado")
    return producto

# UPDATE - Actualizar producto
@router.patch("/{productoID}", response_model=Producto)
def actualizarProducto(productoID: int, productoData: ProductoUpdate, session: SessionDep, admin = Depends(adminActual)):
    productoDB = session.get(Producto, productoID)
    if not productoDB:
        raise HTTPException(404, "Producto no encontrado")
    productoActualizado = productoDB.sqlmodel_update(productoData)
    session.add(productoActualizado)
    session.commit()
    session.refresh(productoActualizado)
    return productoActualizado

# DELETE - Eliminar producto por ID
@router.delete("/{productoID}", status_code=204)
def eliminarProducto(productoID: int, session: SessionDep, admin = Depends(adminActual)):
    producto = session.get(Producto, productoID)
    if not producto:
        raise HTTPException(404, "Producto no encontrado")
    session.delete(producto)
    session.commit()