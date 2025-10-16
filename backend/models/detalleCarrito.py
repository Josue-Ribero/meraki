from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from sqlalchemy import Column, ForeignKey
class DetalleCarritoBase(SQLModel):
    cantidad: int = Field(default=0)
    precioUnidad: int = Field(default=0)
    subtotal: int = Field(default=0)
    esPersonalizado: bool = Field(default=False)

    # Método
    def calcularSubtotal(self):
        self.subtotal = self.cantidad * self.precioUnidad
        return self.subtotal

class DetalleCarrito(DetalleCarritoBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    carritoID: int = Field(sa_column=Column(ForeignKey("carrito.id", ondelete="CASCADE")))
    carrito: "Carrito" = Relationship(back_populates="detalles", sa_relationship_kwargs={"cascade": "all, delete"})
    productoID: int | None = Field(sa_column=Column(ForeignKey("producto.id", ondelete="CASCADE")))
    producto: "Producto" = Relationship(back_populates="detallesCarrito")
    disenoID: int | None = Field(default=None, sa_column=Column(ForeignKey("disenopersonalizado.id", ondelete="CASCADE")))
    disenoPersonalizado: Optional["DisenoPersonalizado"] = Relationship(back_populates="detallesCarrito")

class DetalleCarritoCreate(DetalleCarritoBase):
    productoID: int | None = None
    disenoID: int | None = None
    cantidad: int = 1
class DetalleCarritoUpdate(DetalleCarritoBase):
    pass

class DetalleCarritoDelete(DetalleCarritoBase):
    pass

# Importaciones diferidas
from .carrito import Carrito
from .producto import Producto
from .disenoPersonalizado import DisenoPersonalizado