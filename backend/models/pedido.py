from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import ForeignKey
from datetime import datetime as dt
from typing import Optional
from ..utils.enums import EstadoPedido

"""
    Modelo para pedido.

    Representa una orden de compra realizada por un cliente. Agrupa los detalles de los productos,
    la dirección de envío, el estado del pedido y el total a pagar.
    Es el registro central del proceso de venta.
"""

# Modelo base de pedido
class PedidoBase(SQLModel):
    fecha: dt = Field(default_factory=dt.now)
    estado: EstadoPedido = Field(default=EstadoPedido.PENDIENTE)
    total: int = Field(default=0)
    clienteEliminado: bool = Field(default=False)
    pagadoConPuntos: bool = Field(default=False)
    puntosUsados: int = Field(default=0)

    # Metodos pedido
    def calcularTotal(self):
        self.total = sum([detalle.subtotal for detalle in self.detalles])
        return self.total



# Modelo de pedido
class Pedido(PedidoBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    administradorID: int | None = Field(default=None, foreign_key="administrador.id")
    administrador: "Administrador" = Relationship(back_populates="pedidos")
    clienteID: int = Field(sa_column=Column(ForeignKey("cliente.id", ondelete="CASCADE")))
    cliente: "Cliente" = Relationship(back_populates="pedidos")
    direccionEnvioID: Optional[int] = Field(default=None, foreign_key="direccionenvio.id")
    direccionEnvio: Optional["DireccionEnvio"] = Relationship(back_populates="pedidos")
    detalles: list["DetallePedido"] = Relationship(back_populates="pedido", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    pago: Optional["Pago"] = Relationship(back_populates="pedido", sa_relationship_kwargs={"cascade": "all, delete-orphan", "uselist": False})



# Modelo de pedido para crear
class PedidoCreate(PedidoBase):
    pass



# Modelo de pedido para actualizar
class PedidoUpdate(PedidoBase):
    pass



# Modelo de pedido para eliminar
class PedidoDelete(PedidoBase):
    pass



# Importaciones diferidas
from .administrador import Administrador
from .cliente import Cliente
from .direccionEnvio import DireccionEnvio
from .detallePedido import DetallePedido
from .pago import Pago