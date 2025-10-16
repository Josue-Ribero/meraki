from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime as dt

class WishlistBase(SQLModel):
    fechaCreacion: dt = Field(default_factory=dt.now)

class Wishlist(WishlistBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    clienteID: int = Field(foreign_key="cliente.id")
    cliente: "Cliente" = Relationship(back_populates="wishlist")
    items: list["WishlistItem"] = Relationship(back_populates="wishlist")

class WishlistCreate(WishlistBase):
    pass

# Importaciones diferidas
from .cliente import Cliente
from .wishlistitem import WishlistItem