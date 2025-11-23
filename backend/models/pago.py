from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime as dt
from typing import Optional
from ..utils.enums import MetodoPago

"""
    Modelo para pago.

    Registra la transacción financiera asociada a un pedido. Almacena el método de pago utilizado,
    el monto total, la fecha de la transacción y si el pago ha sido confirmado.
"""

# Modelo base de pago
class PagoBase(SQLModel):
    metodo: MetodoPago = Field(default=MetodoPago.NEQUI)
    fechaPago: dt = Field(default_factory=dt.now)
    confirmado: bool = Field(default=False)
    clienteEliminado: bool = Field(default=False)
    referencia: Optional[str] = Field(default=None, description="Referencia del pago")
    urlCheckout: Optional[str] = Field(default=None, description="Enlace de redireccion al checkout")

    # Método del modelo
    def confirmarPago(self):
        self.confirmado = True



# Modelo con ID autoincrementable
class Pago(PagoBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    administradorID: Optional[int] = Field(default=None, foreign_key="administrador.id")
    administrador: Optional["Administrador"] = Relationship(back_populates="pagos")
    pedidoID: int = Field(foreign_key="pedido.id")
    pedido: Optional["Pedido"] = Relationship(back_populates="pago")



# Modelos de creacion y actualizacion de pago
class PagoCreate(PagoBase):
    pedidoID: int



class PagoUpdate(PagoBase):
    pass



# Importaciones diferidas
from .administrador import Administrador
from .pedido import Pedido