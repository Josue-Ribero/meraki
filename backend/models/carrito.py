from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime as dt
from typing import Optional
from sqlalchemy import Column, ForeignKey
from ..utils.enums import EstadoCarrito

"""
Modelo para carrito.

Es el encargado de gestionar los carritos de los clientes. Tiene una relacion con el cliente y el producto y permite
agregar, eliminar y actualizar los detalles del carrito.
"""

class CarritoBase(SQLModel):
    fecha: dt = Field(default_factory=dt.now)
    estado: EstadoCarrito = Field(default=EstadoCarrito.ACTIVO)
    total: int = Field(default=0)



class Carrito(CarritoBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    clienteID: int = Field(sa_column=Column(ForeignKey("cliente.id", ondelete="CASCADE")))
    cliente: Optional["Cliente"] = Relationship(back_populates="carrito")
    productoID: int = Field(sa_column=Column(ForeignKey("producto.id", ondelete="CASCADE")))
    detalles: list["DetalleCarrito"] = Relationship(back_populates="carrito", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

    # Calcular valor del carrito
    def calcularTotal(self, session):
        self.total = sum(detalle.subtotal for detalle in self.detalles)
        session.add(self)
        session.commit()
        session.refresh(self)



class CarritoCreate(CarritoBase):
    pass



class CarritoUpdate(CarritoBase):
    pass



class CarritoDelete(CarritoBase):
    pass



# Importaciones diferidas
from .cliente import Cliente
from .producto import Producto
from .detalleCarrito import DetalleCarrito