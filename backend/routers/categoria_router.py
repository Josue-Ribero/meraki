from fastapi import APIRouter, HTTPException, Depends, Form
from sqlmodel import select
from ..models.categoria import Categoria, CategoriaCreate, CategoriaUpdate
from ..auth.auth import adminActual
from ..db.db import SessionDep

router = APIRouter(prefix="/categorias", tags=["Categorias"])

# CREATE - Crear una categoria (solo admin)
@router.post("/crear", response_model=Categoria, status_code=201)
def crearCategoria(
    nombre: str = Form(...),
    descripcion: str = Form(None),
    session: SessionDep = None, 
    admin=Depends(adminActual)
):
    categoria = Categoria(
        nombre=nombre,
        descripcion=descripcion,
        administradorID=admin.id
    )
    session.add(categoria)
    session.commit()
    session.refresh(categoria)
    return categoria

# READ - Obtener la lista de categorias
@router.get("/", response_model=list[Categoria])
def listaCategorias(session: SessionDep):
    categorias = session.exec(select(Categoria).where(Categoria.activo==True)).all()
    return categorias

# READ - Obtener una categoria por ID
@router.get("/{categoriaID}", response_model=Categoria)
def categoriaPorID(categoriaID: int, session: SessionDep):
    categoriaDB = session.exec(select(Categoria).where(Categoria.id == categoriaID, Categoria.activo == True)).first()
    if not categoriaDB:
        raise HTTPException(404, "Categoría no encontrada")
    return categoriaDB

# UPDATE - Actualizar una categoria por ID
@router.patch("/{categoriaID}", response_model=Categoria)
def actualizarCategoria(
    categoriaID: int, 
    nombre: str = Form(None),
    descripcion: str = Form(None),
    session: SessionDep = None, 
    _=Depends(adminActual)
):
    categoriaDB = session.get(Categoria, categoriaID)
    if not categoriaDB:
        raise HTTPException(404, "Categoría no encontrada")
    
    if nombre:
        categoriaDB.nombre = nombre
    if descripcion:
        categoriaDB.descripcion = descripcion
    
    session.add(categoriaDB)
    session.commit()
    session.refresh(categoriaDB)
    return categoriaDB

# DELETE - Eliminar una categoria por ID
@router.delete("/{categoriaID}/deshabilitar", status_code=204)
def eliminarCategoria(categoriaID: int, session: SessionDep, _=Depends(adminActual)):
    categoriaDB = session.get(Categoria, categoriaID)
    if not categoriaDB:
        raise HTTPException(404, "Categoría no encontrada")
    
    categoriaDB.activo = False
    session.add(categoriaDB)
    session.commit()