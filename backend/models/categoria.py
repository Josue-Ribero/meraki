from sqlmodel import SQLModel, Field, Relationship
from typing import Optional

# Modelo base para categorías
class CategoriaBase(SQLModel):
    nombre: str = Field()
    descripcion: Optional[str] = Field(default=None)
    activo: bool = Field(default=True)

    # Método para contar productos asociados
    def contarProductos(self) -> int:
        return len(self.productos) if hasattr(self, "productos") else 0

# Modelo de tabla para categorías
class Categoria(CategoriaBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    administradorID: Optional[int] = Field(default=None, foreign_key="administrador.id")
    administrador: "Administrador" = Relationship(back_populates="categorias")
    productos: list["Producto"] = Relationship(back_populates="categoria")

# Modelo para crear categorías
class CategoriaCreate(CategoriaBase):
    pass

# Modelo para actualizar categorías
class CategoriaUpdate(SQLModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None

# Modelo para leer categorías (incluye ID y conteo de productos)
class CategoriaRead(CategoriaBase):
    id: int
    administradorID: int
    contarProductos: int = 0

# Modelo para eliminar categorías
class CategoriaDelete(CategoriaBase):
    pass

# Importaciones diferidas para evitar circular dependencies
from .administrador import Administrador
from .producto import Producto