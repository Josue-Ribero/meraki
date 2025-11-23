from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import ForeignKey
from typing import Optional

"""
    Modelo para wishlist (lista de deseos).

    Representa la lista de deseos de un cliente, donde puede guardar productos
    que le interesan para comprar en el futuro. Actúa como contenedor de los ítems deseados.
"""

class WishlistBase(SQLModel):
    pass



class Wishlist(WishlistBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    clienteID: int = Field(sa_column=Column(ForeignKey("cliente.id", ondelete="CASCADE")))
    cliente: "Cliente" = Relationship(back_populates="wishlist")
    items: list["WishlistItem"] = Relationship(back_populates="wishlist", sa_relationship_kwargs={"cascade": "all, delete-orphan"})



class WishlistCreate(WishlistBase):
    pass



class WishlistUpdate(WishlistBase):
    pass



class WishlistDelete(WishlistBase):
    pass



# Importaciones diferidas
from .cliente import Cliente
from .wishlistItem import WishlistItem