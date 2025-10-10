from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime as dt

class WishlistItemBase(SQLModel):
    fechaAgregado: dt = Field(default_factory=dt.now)

class WishlistItem(WishlistItemBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    wishlistID: int = Field(foreign_key="wishlist.id")
    wishlist: "Wishlist" = Relationship(back_populates="items")
    productoID: int = Field(foreign_key="producto.id")
    producto: "Producto" = Relationship(back_populates="wishlistItems")

class WishlistItemCreate(WishlistItemBase):
    pass

class WishlistItemUpdate(WishlistItemBase):
    pass

class WishlistItemDelete(WishlistItemBase):
    pass

# Importaciones diferidas
from .wishlist import Wishlist
from .producto import Producto