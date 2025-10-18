from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import ForeignKey
from typing import Optional
from datetime import datetime as dt


class WishlistBase(SQLModel):
    fechaAgregado: dt = Field(default_factory=dt.now)

class Wishlist(WishlistBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    clienteID: int = Field(sa_column=Column(ForeignKey("cliente.id", ondelete="CASCADE")))
    cliente: "Cliente" = Relationship(back_populates="wishlist")
    productoID: int = Field(sa_column=Column(ForeignKey("producto.id", ondelete="CASCADE")))
    producto: "Producto" = Relationship(back_populates="wishlist")

class WishlistCreate(SQLModel):
    productoID: Optional[int] = None

class WishlistUpdate(WishlistBase):
    pass

class WishlistDelete(WishlistBase):
    pass

# Importaciones diferidas
from .cliente import Cliente
from .producto import Producto