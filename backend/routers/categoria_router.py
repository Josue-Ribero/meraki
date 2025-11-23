from fastapi import APIRouter, HTTPException, Depends, Form
from sqlmodel import select, func
from ..models.categoria import Categoria, CategoriaRead
from ..models.producto import Producto
from ..auth.auth import adminActual
from ..db.db import SessionDep

router = APIRouter(prefix="/categorias", tags=["Categorias"])

# CREATE - Crear una categoria (solo admin)
@router.post("/", response_model=CategoriaRead, status_code=201)
def crearCategoria(
    nombre: str = Form(...),
    descripcion: str = Form(None),
    session: SessionDep = None, 
    admin=Depends(adminActual)
):
    """
    Este endpoint crea una nueva categoría por parte del administrador.
    """
    
    # Verificar si ya hay una categoria con ese nombre
    categoriaDB = session.exec(select(Categoria).where(Categoria.nombre == nombre)).first()
    if categoriaDB:
        raise HTTPException(400, "Ya existe una categoria con ese nombre")
    
    # Crear la categoria
    categoria = Categoria(
        nombre=nombre,
        descripcion=descripcion,
        administradorID=admin.id
    )
    # Agregar y guardar la categoria en la DB
    session.add(categoria)
    session.commit()
    session.refresh(categoria)
    
    # Agregar conteo de productos
    cuenta = session.exec(select(func.count(Producto.id)).where(Producto.categoriaID == categoria.id, Producto.activo == True)).first()
    
    # Convertir a diccionario y agregar conteo
    return CategoriaRead(**categoria.model_dump(), contarProductos=cuenta or 0)



# READ - Obtener la lista de categorias
@router.get("/", response_model=list[CategoriaRead])
def listaCategorias(session: SessionDep):
    """
    Este endpoint lista todas las categorías activas en el dashboard administrativo.
    """
    
    # Obtener lista de categorias
    categorias = session.exec(select(Categoria).where(Categoria.activo==True)).all()

    # Obtener la lista de categorías con conteo
    resultado = []
    for categoria in categorias:
        cuenta = session.exec(
            select(func.count(Producto.id)).where(Producto.categoriaID == categoria.id, Producto.activo == True)).first()
        
        # Ingresar el objeto como diccionario con el conteo de productos incluido
        resultado.append(CategoriaRead(**categoria.model_dump(), contarProductos=cuenta or 0))
    
    return resultado


# READ - Todas las categorias incluyendo las inactivas
@router.get("/todas", response_model=list[CategoriaRead])
def todasCategorias(session: SessionDep, _=Depends(adminActual)):
    """
    Este endpoint lista todas las categorías, incluyendo las inactivas, en el dashboard administrativo.
    """
    
    # Obtener todas las categorias en la DB
    categorias = session.exec(select(Categoria)).all()
    
    resultado = []
    for categoria in categorias:
        cuenta = session.exec(
            select(func.count(Producto.id)).where(Producto.categoriaID == categoria.id, Producto.activo == True)).first()
        
        resultado.append(CategoriaRead(**categoria.model_dump(), contarProductos=cuenta or 0))
    
    return resultado



# READ - Obtener una categoria por ID
@router.get("/{categoriaID}", response_model=CategoriaRead)
def categoriaPorID(categoriaID: int, session: SessionDep):
    """
    Este endpoint lista una categoría por su ID en el dashboard administrativo.
    """
    
    # Verificar si la categoria existe y está activa
    categoriaDB = session.exec(select(Categoria).where(Categoria.id == categoriaID, Categoria.activo == True)).first()
    
    # Si no existe la categoria
    if not categoriaDB:
        raise HTTPException(404, "Categoría no encontrada")
    
    # Conteo de productos asociados
    cuenta = session.exec(select(func.count(Producto.id)).where(Producto.categoriaID == categoriaDB.id, Producto.activo == True)).first()

    return CategoriaRead(**categoriaDB.model_dump(), contarProductos=cuenta or 0)



# UPDATE - Actualizar una categoria por ID
@router.patch("/{categoriaID}", response_model=CategoriaRead)
def actualizarCategoria(
    categoriaID: int, 
    nombre: str = Form(None),
    descripcion: str = Form(None),
    session: SessionDep = None, 
    _=Depends(adminActual)
):
    """
    Este endpoint actualiza una categoría por su ID en el dashboard administrativo.
    """
    
    # Verificar si la categoria existe
    categoriaDB = session.get(Categoria, categoriaID)
    if not categoriaDB:
        raise HTTPException(404, "Categoría no encontrada")
    
    # Si se ingresa un nombre y no es el de la categoria
    if nombre and nombre != categoriaDB.nombre:
        categoria = session.exec(select(Categoria).where(Categoria.nombre == nombre,Categoria.id != categoriaID)).first()

        # Si es el mismo nombre
        if categoria:
            raise HTTPException(400, "Ya existe una categoria con ese nombre")
        
        # Actualiza el nombre
        categoriaDB.nombre = nombre

    # Si la descripción no es None, la actualiza  
    if descripcion is not None:
        categoriaDB.descripcion = descripcion
    
    session.add(categoriaDB)
    session.commit()
    session.refresh(categoriaDB)
    
    # Conteo de productos asociados
    cuenta = session.exec(select(func.count(Producto.id)).where(Producto.categoriaID == categoriaDB.id, Producto.activo == True)).first()
    
    return CategoriaRead(**categoriaDB.model_dump(),contarProductos=cuenta or 0)



# UPDATE - Reactivar una categoría
@router.patch("/{categoriaID}/habilitar", response_model=CategoriaRead)
def habilitarCategoria(categoriaID: int, session: SessionDep, _=Depends(adminActual)):
    """
    Este endpoint reactiva una categoría por su ID en el dashboard administrativo.
    """
    
    # Verificar si la categoria existe
    categoriaDB = session.get(Categoria, categoriaID)
    if not categoriaDB:
        raise HTTPException(404, "Categoría no encontrada")
    
    # Reactivar la categoria y guardar los cambios en la DB
    categoriaDB.activo = True
    session.add(categoriaDB)
    session.commit()
    session.refresh(categoriaDB)
    
    # Conteo de productos asociados
    cuenta = session.exec(select(func.count(Producto.id)).where(Producto.categoriaID == categoriaDB.id,Producto.activo == True)).first()
    
    return CategoriaRead(**categoriaDB.model_dump(), contarProductos=cuenta or 0)



# DELETE - Eliminar una categoria por ID
@router.delete("/{categoriaID}/deshabilitar", status_code=204)
def eliminarCategoria(categoriaID: int, session: SessionDep, _=Depends(adminActual)):
    """
    Este endpoint deshabilita una categoría por su ID en el dashboard administrativo.
    """
    
    # Verificar si la categoria ya existe
    categoriaDB = session.exec(select(Categoria).where(Categoria.id == categoriaID, Categoria.activo == True)).first()
    
    # Si no existe la categoria
    if not categoriaDB:
        raise HTTPException(404, "Categoría no encontrada")
    
    # Conteo de productos asociados
    cuenta = session.exec(select(func.count(Producto.id)).where(Producto.categoriaID == categoriaDB.id, Producto.activo == True)).first()

    # Si tiene uno o más productos asociados no permite eliminar la categoria
    if cuenta and cuenta > 0:
        raise HTTPException(400, f"No se puede eliminar la categoría. Tiene {cuenta} producto(s) asociado(s).")
    
    # Desactiva la categoria
    categoriaDB.activo = False
    session.add(categoriaDB)
    session.commit()