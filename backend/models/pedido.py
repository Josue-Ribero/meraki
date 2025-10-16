from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime as dt
from ..utils.enums import EstadoPedido
from sqlalchemy import Column, ForeignKey

class PedidoBase(SQLModel):
    fecha: dt = Field(default_factory=dt.now)
    estado: EstadoPedido = Field(default=EstadoPedido.PENDIENTE)
    total: int = Field(default=0)
    pagadoConPuntos: bool = Field(default=False)
    puntosUsados: int = Field(default=0)
    clienteEliminado: bool = Field(default=False)

    # Métodos
    def calcularTotal(self) -> int:
        if not hasattr(self, "detalles") or not self.detalles:
            return 0
        return sum(detalle.subtotal for detalle in self.detalles)

    def marcarPagado(self):
        self.estado = EstadoPedido.PAGADO

    def actualizarEstado(self, nuevoEstado: EstadoPedido):
        self.estado = nuevoEstado

    def enviarNotificacionEmail(self):
        return {"Message": "Pedido concretado"}

class Pedido(PedidoBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    administradorID: int | None = Field(default=None, sa_column=Column(ForeignKey("administrador.id", ondelete="SET NULL")))
    administrador: "Administrador" = Relationship(back_populates="pedidos")
    clienteID: int = Field(sa_column=Column(ForeignKey("cliente.id", ondelete="CASCADE")))
    cliente: "Cliente" = Relationship(back_populates="pedidos")
    direccionEnvioID: int = Field(sa_column=Column(ForeignKey("direccionenvio.id", ondelete="SET NULL")))
    direccionEnvio: "DireccionEnvio" = Relationship(back_populates="pedidos")
    detalles: list["DetallePedido"] = Relationship(back_populates="pedido", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    pagos: list["Pago"] = Relationship(back_populates="pedido")
    transacciones: list["TransaccionPuntos"] = Relationship(back_populates="pedido")

class PedidoCreate(PedidoBase):
    pass

class PedidoUpdate(PedidoBase):
    pass

class PedidoDelete(PedidoBase):
    pass

# Importaciones diferidas
from .administrador import Administrador
from .cliente import Cliente
from .direccionEnvio import DireccionEnvio
from .detallePedido import DetallePedido
from .pago import Pago
from .transaccionPuntos import TransaccionPuntos