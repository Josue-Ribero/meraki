from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime as dt
from typing import Optional
from ..utils.enums import MetodoPago

class PagoBase(SQLModel):
    metodo: MetodoPago = Field(default=MetodoPago.NEQUI)
    fechaPago: dt = Field(default_factory=dt.now)
    confirmado: bool = Field(default=False)
    clienteEliminado: bool = Field(default=False)

    # Método
    def confirmarPago(self):
        self.confirmado = True

class Pago(PagoBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    administradorID: int | None = Field(default=None, foreign_key="administrador.id")
    administrador: Optional["Administrador"] = Relationship(back_populates="pagos")
    pedidoID: int = Field(foreign_key="pedido.id")
    pedido: Optional["Pedido"] = Relationship(back_populates="pago")

class PagoCreate(PagoBase):
    pedidoID: int

class PagoUpdate(PagoBase):
    pass

# Importaciones diferidas
from .administrador import Administrador
from .pedido import Pedido