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

# Modelo base de transaccion de puntos
class TransaccionPuntosBase(SQLModel):
    tipo: TipoTransaccion = Field()
    cantidad: int = Field()
    fecha: dt = Field(default_factory=dt.now)



# Modelo de transaccion de puntos
class TransaccionPuntos(TransaccionPuntosBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    clienteID: int = Field(sa_column=Column(ForeignKey("cliente.id", ondelete="CASCADE")))
    cliente: "Cliente" = Relationship(back_populates="transacciones")



# Modelo de transaccion de puntos para crear
class TransaccionPuntosCreate(TransaccionPuntosBase):
    pass



# Modelo de transaccion de puntos para actualizar
class TransaccionPuntosUpdate(TransaccionPuntosBase):
    pass



# Modelo de transaccion de puntos para eliminar
class TransaccionPuntosDelete(TransaccionPuntosBase):
    pass



# Importaciones diferidas
from .cliente import Cliente