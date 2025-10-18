from sqlmodel import SQLModel, Field, Relationship

class ProductoBase(SQLModel):
    nombre: str = Field()
    descripcion: str | None = Field(default=None)
    precio: int = Field()
    stock: int = Field(default=0)
    imagenURL: str | None = Field(default=None)
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
    carrito: "Carrito" = Relationship(back_populates="producto")
    detallesCarrito: list["DetalleCarrito"] = Relationship(back_populates="producto", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    detallesPedido: list["DetallePedido"] = Relationship(back_populates="producto", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    wishlist: list["Wishlist"] = Relationship(back_populates="producto")

class ProductoCreate(SQLModel):
    nombre: str | None = None
    descripcion: str | None = None
    precio: int | None = None
    stock: int = 0
    imagenURL: str | None = None
    esPersonalizado: bool = False
    opcionesColor: str | None = None
    opcionesTamano: str | None = None
    activo: bool = True
    categoriaID: int

class ProductoUpdate(ProductoBase):
    nombre: str
    descripcion: str | None = None
    precio: int
    stock: int = 0
    imagenURL: str | None = None
    esPersonalizado: bool = False
    opcionesColor: str | None = None
    opcionesTamano: str | None = None
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