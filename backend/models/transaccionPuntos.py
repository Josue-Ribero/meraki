from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import ForeignKey
from datetime import datetime as dt
from typing import Optional
from ..utils.enums import TipoTransaccion

"""
    Modelo para transacción de puntos.

    Registra el historial de movimientos de puntos de fidelidad de un cliente.
    Almacena tanto la acumulación (por compras) como la redención de puntos,
    permitiendo llevar un control detallado del saldo de puntos.
"""

class TransaccionPuntosBase(SQLModel):
    tipo: TipoTransaccion = Field()
    cantidad: int = Field()
    fecha: dt = Field(default_factory=dt.now)



class TransaccionPuntos(TransaccionPuntosBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    clienteID: int = Field(sa_column=Column(ForeignKey("cliente.id", ondelete="CASCADE")))
    cliente: "Cliente" = Relationship(back_populates="transacciones")



class TransaccionPuntosCreate(TransaccionPuntosBase):
    pass



class TransaccionPuntosUpdate(TransaccionPuntosBase):
    pass



class TransaccionPuntosDelete(TransaccionPuntosBase):
    pass



# Importaciones diferidas
from .cliente import Cliente