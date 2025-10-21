from sqlmodel import SQLModel, Field, Relationship
from typing import Optional

class ProductoBase(SQLModel):
    nombre: str = Field()
    descripcion: str = Field(default=None)
    precio: int = Field()
    stock: int = Field(default=0)
    imagenURL: str = Field(default=None)
    esPersonalizado: bool = Field(default=False)
    opcionesColor: Optional[str] = Field(default=None)
    opcionesTamano: Optional[str] = Field(default=None)
    activo: bool = Field(default=True)

    # Métodos
    def actualizarStock(self, cantidad: int):
        self.stock += cantidad

    def calcularPrecioFinal(self) -> int:
        return self.precio

class Producto(ProductoBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    administradorID: Optional[int] = Field(default=None, foreign_key="administrador.id")
    administrador: "Administrador" = Relationship(back_populates="productos")
    categoriaID: int = Field(foreign_key="categoria.id")
    categoria: "Categoria" = Relationship(back_populates="productos")
    detallesCarrito: list["DetalleCarrito"] = Relationship(back_populates="producto", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    detallesPedido: list["DetallePedido"] = Relationship(back_populates="producto", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    wishlistItems: list["WishlistItem"] = Relationship(back_populates="producto")

class ProductoCreate(SQLModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[int] = None
    stock: int = 0
    imagenURL: Optional[str] = None
    esPersonalizado: bool = False
    opcionesColor: Optional[str] = None
    opcionesTamano: Optional[str] = None
    activo: bool = True
    categoriaID: int

class ProductoUpdate(ProductoBase):
    nombre: str
    descripcion: Optional[str] = None
    precio: int
    stock: int = 0
    imagenURL: Optional[str] = None
    esPersonalizado: bool = False
    opcionesColor: Optional[str] = None
    opcionesTamano: Optional[str] = None
    categoriaID: int

class ProductoDelete(ProductoBase):
    activo: bool = True

# Importaciones diferidas
from .administrador import Administrador
from .categoria import Categoria
from .carrito import Carrito
from .detalleCarrito import DetalleCarrito
from .detallePedido import DetallePedido
from .wishlist import Wishlist
from .wishlistItem import WishlistItem