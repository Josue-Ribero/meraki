from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime as dt
from typing import Optional
from sqlalchemy import Column, ForeignKey
from ..utils.enums import EstadoCarrito
class CarritoBase(SQLModel):
    fecha: dt = Field(default_factory=dt.now)
    estado: EstadoCarrito = Field(default=EstadoCarrito.ACTIVO)

    # Método
    def calcularTotal(self) -> int:
        if not hasattr(self, "detalles") or not self.detalles:
            return 0
        return sum(detalle.subtotal for detalle in self.detalles)

class Carrito(CarritoBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    clienteID: int = Field(sa_column=Column(ForeignKey("cliente.id", ondelete="CASCADE")))
    cliente: Optional["Cliente"] = Relationship(back_populates="carrito")
    detalles: list["DetalleCarrito"] = Relationship(back_populates="carrito", sa_relationship_kwargs={"cascade": "all, delete-orphan"})

class CarritoCreate(CarritoBase):
    pass

class CarritoUpdate(CarritoBase):
    pass

class CarritoDelete(CarritoBase):
    pass

# Importaciones diferidas
from .cliente import Cliente
from .detalleCarrito import DetalleCarrito