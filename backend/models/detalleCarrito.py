from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime as dt
from typing import Optional
from sqlalchemy import Column, ForeignKey

"""
    Modelo para detalle de carrito.

    Representa cada ítem individual dentro del carrito de compras de un cliente.
    Vincula un producto específico con el carrito, almacenando la cantidad seleccionada
    y el subtotal calculado (precio * cantidad).
"""

class DetalleCarritoBase(SQLModel):
    cantidad: int = Field(default=0)
    fechaAgregado: dt = Field(default_factory=dt.now)



class DetalleCarrito(DetalleCarritoBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    carritoID: int = Field(sa_column=Column(ForeignKey("carrito.id", ondelete="CASCADE")))
    carrito: "Carrito" = Relationship(back_populates="detalles")
    productoID: int = Field(sa_column=Column(ForeignKey("producto.id", ondelete="CASCADE")))
    producto: "Producto" = Relationship(back_populates="detallesCarrito")
    disenoID: Optional[int] = Field(default=None, sa_column=Column(ForeignKey("disenopersonalizado.id", ondelete="CASCADE")))
    disenoPersonalizado: Optional["DisenoPersonalizado"] = Relationship(back_populates="detallesCarrito")

    precioUnidad: int = Field(default=0)
    subtotal: int = Field(default=0)
    esPersonalizado: bool = Field(default=False)

    # Calcular el subtotal
    def calcularSubtotal(self, precioProducto: int):
        self.precioUnidad = precioProducto
        self.subtotal = precioProducto * self.cantidad



class DetalleCarritoCreate(SQLModel):
    productoID: Optional[int] = None
    disenoID: Optional[int] = None
    cantidad: int = Field(default=1, gt=0)



class DetalleCarritoUpdate(DetalleCarritoBase):
    pass



class DetalleCarritoDelete(DetalleCarritoBase):
    pass



# Importaciones diferidas
from .carrito import Carrito
from .producto import Producto
from .disenoPersonalizado import DisenoPersonalizado