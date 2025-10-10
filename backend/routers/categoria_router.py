from fastapi import APIRouter, HTTPException, status
from sqlmodel import select
from ..models.categoria import Categoria, CategoriaCreate, CategoriaUpdate
from ..db.db import SessionDep

router = APIRouter(prefix="/categorias", tags=["Categorias"])

# CREATE - Crear una categoria
@router.post("/crear", response_model=Categoria, status_code=201)
def crearCategoria(categoriaNueva: CategoriaCreate, session: SessionDep):
    categoria = Categoria.model_validate(categoriaNueva)
    session.add(categoria)
    session.commit()
    session.refresh(categoria)
    return categoria

# READ - Obtener lista de categorias y por ID
@router.get("/", response_model=list[Categoria])
def listaCategorias(session: SessionDep):
    categorias = session.exec(select(Categoria)).all()
    return categorias

@router.get("/{categoriaID}", response_model=Categoria)
def categoriaPorID(categoriaID: int, session: SessionDep):
    categoriaDB = session.get(Categoria, categoriaID)
    if not categoriaDB:
        raise HTTPException(404, "Categoría no encontrada")
    return categoriaDB

# UPDATE - Actualizar la categoria por ID
@router.patch("/{categoriaID}", response_model=Categoria)
def actualizarCategoria(categoriaID: int, categoriaData: CategoriaUpdate, session: SessionDep):
    categoriaDB = session.get(Categoria, categoriaID)
    if not categoriaDB:
        raise HTTPException(404, "Categoría no encontrada")

    categoriaDB.sqlmodel_update(categoriaData)
    session.add(categoriaDB)
    session.commit()
    session.refresh(categoriaDB)
    return categoriaDB

# DELETE - Eliminar categoria por ID
@router.delete("/{categoriaID}", status_code=204)
def eliminarCategoria(categoriaID: int, session: SessionDep):
    categoriaDB = session.get(Categoria, categoriaID)
    if not categoriaDB:
        raise HTTPException(404, "Categoría no encontrada")
    session.delete(categoriaDB)
    session.commit()