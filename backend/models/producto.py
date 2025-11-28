from sqlmodel import SQLModel, Field, Relationship
from typing import Optional

"""
    Modelo para producto.

    Representa los artículos disponibles para la venta en la tienda.
    Contiene información como nombre, descripción, precio, stock, categoría e imagen.
    Es la entidad base para el catálogo de productos.
"""

# Modelo base de producto
class ProductoBase(SQLModel):
    nombre: str = Field(index=True)
    descripcion: str = Field()
    precio: int = Field()
    stock: int = Field()
    imagenURL: Optional[str] = Field(default=None)
    sku: str = Field(unique=True)
    activo: bool = Field(default=True)
    esPersonalizado: bool = Field(default=False)

    # Metodos producto
    def actualizarStock(self, cantidad: int):
        self.stock += cantidad



# Modelo de producto
class Producto(ProductoBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    administradorID: Optional[int] = Field(default=None, foreign_key="administrador.id")
    administrador: "Administrador" = Relationship(back_populates="productos")
    categoriaID: int = Field(foreign_key="categoria.id")
    categoria: "Categoria" = Relationship(back_populates="productos")
    detallesCarrito: list["DetalleCarrito"] = Relationship(back_populates="producto", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    detallesPedido: list["DetallePedido"] = Relationship(back_populates="producto", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    wishlistItems: list["WishlistItem"] = Relationship(back_populates="producto")



# Modelo de producto para crear
class ProductoCreate(ProductoBase):
    pass



# Modelo de producto para actualizar
class ProductoUpdate(SQLModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[int] = None
    stock: Optional[int] = None
    categoriaID: Optional[int] = None
    imagenURL: Optional[str] = None
    sku: Optional[str] = None



# Modelo de producto para eliminar
class ProductoDelete(ProductoBase):
    pass



# Importaciones diferidas
from .categoria import Categoria
from .detalleCarrito import DetalleCarrito
from .detallePedido import DetallePedido
from .wishlistItem import WishlistItem