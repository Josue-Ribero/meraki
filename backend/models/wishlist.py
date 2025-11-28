from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import ForeignKey
from typing import Optional
from datetime import datetime as dt

"""
    Modelo para wishlist (lista de deseos).

    Representa la lista de deseos de un cliente, donde puede guardar productos
    que le interesan para comprar en el futuro. Actúa como contenedor de los ítems deseados.
"""

# Modelo base de wishlist
class WishlistBase(SQLModel):
    fechaAgregado: dt = Field(default_factory=dt.now)



# Modelo de wishlist
class Wishlist(WishlistBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    clienteID: int = Field(sa_column=Column(ForeignKey("cliente.id", ondelete="CASCADE")))
    cliente: "Cliente" = Relationship(back_populates="wishlist")
    items: list["WishlistItem"] = Relationship(back_populates="wishlist", sa_relationship_kwargs={"cascade": "all, delete-orphan"})



# Modelo de wishlist para crear
class WishlistCreate(WishlistBase):
    pass



# Modelo de wishlist para actualizar
class WishlistUpdate(WishlistBase):
    pass



# Modelo de wishlist para eliminar
class WishlistDelete(WishlistBase):
    pass



# Importaciones diferidas
from .cliente import Cliente
from .wishlistItem import WishlistItem