from sqlmodel import SQLModel, Field, Relationship
from typing import Optional

"""
    Modelo para producto.

    Representa los artículos disponibles para la venta en la tienda.
    Contiene información como nombre, descripción, precio, stock, categoría e imagen.
    Es la entidad base para el catálogo de productos.
"""

class ProductoBase(SQLModel):
    nombre: str = Field(index=True)
    descripcion: str = Field()
    precio: int = Field()
    stock: int = Field()
    imagenURL: Optional[str] = Field(default=None)
    sku: str = Field(unique=True)
    activo: bool = Field(default=True)

    # Metodos producto
    def actualizarStock(self, cantidad: int):
        self.stock += cantidad



class Producto(ProductoBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    categoriaID: Optional[int] = Field(default=None, foreign_key="categoria.id")
    categoria: Optional["Categoria"] = Relationship(back_populates="productos")
    detallesCarrito: list["DetalleCarrito"] = Relationship(back_populates="producto")
    detallesPedido: list["DetallePedido"] = Relationship(back_populates="producto")
    wishlistItems: list["WishlistItem"] = Relationship(back_populates="producto")



class ProductoCreate(ProductoBase):
    pass



class ProductoUpdate(SQLModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[int] = None
    stock: Optional[int] = None
    categoriaID: Optional[int] = None
    imagenURL: Optional[str] = None
    sku: Optional[str] = None



class ProductoDelete(ProductoBase):
    pass



# Importaciones diferidas
from .categoria import Categoria
from .detalleCarrito import DetalleCarrito
from .detallePedido import DetallePedido
from .wishlistItem import WishlistItem