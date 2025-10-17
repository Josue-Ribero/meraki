from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import ForeignKey
from datetime import datetime as dt

class WishlistBase(SQLModel):
    fechaCreacion: dt = Field(default_factory=dt.now)

class Wishlist(WishlistBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    clienteID: int = Field(sa_column=Column(ForeignKey("cliente.id", ondelete="CASCADE")))
    cliente: "Cliente" = Relationship(back_populates="wishlist")
    items: list["WishlistItem"] = Relationship(back_populates="wishlist", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

class WishlistCreate(WishlistBase):
    pass

# Importaciones diferidas
from .cliente import Cliente
from .wishlistitem import WishlistItem