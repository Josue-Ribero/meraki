from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import ForeignKey
from datetime import datetime as dt
from typing import Optional
from ..utils.enums import TipoTransaccion

class TransaccionPuntosBase(SQLModel):
    tipo: TipoTransaccion = Field(default=TipoTransaccion.GANADOS)
    cantidad: int = Field(default=0)
    fecha: dt = Field(default_factory=dt.now)

class TransaccionPuntos(TransaccionPuntosBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    clienteID: int = Field(sa_column=Column(ForeignKey("cliente.id", ondelete="CASCADE")))
    cliente: "Cliente" = Relationship(back_populates="transacciones")
    pedidoID: Optional[int] = Field(default=None, foreign_key="pedido.id")
    pedido: Optional["Pedido"] = Relationship(back_populates="transacciones")

class TransaccionPuntosCreate(TransaccionPuntosBase):
    pass

class TransaccionPuntosUpdate(TransaccionPuntosBase):
    pass

class TransaccionPuntosDelete(TransaccionPuntosBase):
    pass

# Importaciones diferidas
from .cliente import Cliente
from .pedido import Pedido