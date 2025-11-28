from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import ForeignKey
from typing import Optional
from datetime import datetime as dt

"""
    Modelo para ítem de wishlist.

    Representa un producto individual guardado dentro de la lista de deseos de un cliente.
    Vincula el producto con la wishlist y registra la fecha en que fue agregado.
"""

# Modelo base de wishlist item
class WishlistItemBase(SQLModel):
    fechaAgregado: dt = Field(default_factory=dt.now)



# Modelo de wishlist item
class WishlistItem(WishlistItemBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    wishlistID: int = Field(sa_column=Column(ForeignKey("wishlist.id", ondelete="CASCADE")))
    wishlist: "Wishlist" = Relationship(back_populates="items")
    productoID: int = Field(sa_column=Column(ForeignKey("producto.id", ondelete="CASCADE")))
    producto: "Producto" = Relationship(back_populates="wishlistItems")



# Modelo de wishlist item para crear
class WishlistItemCreate(WishlistItemBase):
    pass



# Modelo de wishlist item para actualizar
class WishlistItemUpdate(WishlistItemBase):
    pass



# Modelo de wishlist item para eliminar
class WishlistItemDelete(WishlistItemBase):
    pass



# Importaciones diferidas
from .wishlist import Wishlist
from .producto import Producto