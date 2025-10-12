from sqlmodel import SQLModel, Field, Relationship

class CategoriaBase(SQLModel):
    nombre: str = Field()
    descripcion: str | None = Field(default=None)

    def contarProductos(self) -> int:
        return len(self.productos) if hasattr(self, "productos") else 0

class Categoria(CategoriaBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    administradorID: int | None = Field(default=None, foreign_key="administrador.id")
    administrador: "Administrador" = Relationship(back_populates="categorias")
    productos: list["Producto"] = Relationship(back_populates="categoria")

class CategoriaCreate(CategoriaBase):
    pass

class CategoriaUpdate(SQLModel):
    nombre: str | None
    descripcion: str | None

class CategoriaDelete(CategoriaBase):
    pass

# Importaciones diferidas
from .administrador import Administrador
from .producto import Producto