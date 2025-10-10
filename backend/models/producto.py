from sqlmodel import SQLModel, Field, Relationship

class ProductoBase(SQLModel):
    nombre: str = Field(default=None)
    descripcion: str | None = Field(default=None)
    precio: int = Field(default=0)
    stock: int = Field(default=0)
    imagenURL: str = Field(default=None)
    esPersonalizado: bool = Field(default=False)
    opcionesColor: str | None = Field(default=None)
    opcionesTamano: str | None = Field(default=None)
    activo: bool = Field(default=True)

    # Métodos
    def actualizarStock(self, cantidad: int):
        self.stock += cantidad

    def calcularPrecioFinal(self) -> int:
        return self.precio

class Producto(ProductoBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    administradorID: int | None = Field(default=None, foreign_key="administrador.id")
    administrador: "Administrador" = Relationship(back_populates="productos")
    categoriaID: int = Field(foreign_key="categoria.id")
    categoria: "Categoria" = Relationship(back_populates="productos")
    detallesCarrito: list["DetalleCarrito"] = Relationship(back_populates="producto")
    detallesPedido: list["DetallePedido"] = Relationship(back_populates="producto")
    wishlistItems: list["WishlistItem"] = Relationship(back_populates="producto")

class ProductoCreate(ProductoBase):
    pass

class ProductoUpdate(ProductoBase):
    pass

class ProductoDelete(ProductoBase):
    pass

# Importaciones diferidas
from .administrador import Administrador
from .categoria import Categoria
from .detalleCarrito import DetalleCarrito
from .detallePedido import DetallePedido
from .wishlistitem import WishlistItem