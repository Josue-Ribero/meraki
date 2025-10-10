from sqlmodel import SQLModel, Field, Relationship
from typing import Optional

class DetallePedidoBase(SQLModel):
    cantidad: int = Field(default=0)
    precioUnidad: int = Field(default=0)
    subtotal: int = Field(default=0)
    esPersonalizado: bool = Field(default=False)

    # Método
    def calcularSubtotal(self):
        self.subtotal = self.cantidad * self.precioUnidad
        return self.subtotal

class DetallePedido(DetallePedidoBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    pedidoID: int = Field(foreign_key="pedido.id")
    pedido: "Pedido" = Relationship(back_populates="detalles")
    productoID: int = Field(foreign_key="producto.id")
    producto: "Producto" = Relationship(back_populates="detallesPedido")
    disenoID: int | None = Field(default=None, foreign_key="disenopersonalizado.id")
    disenoPersonalizado: Optional["DisenoPersonalizado"] = Relationship(back_populates="detallesPedido")

class DetallePedidoCreate(DetallePedidoBase):
    pass

class DetallePedidoUpdate(DetallePedidoBase):
    pass

class DetallePedidoDelete(DetallePedidoBase):
    pass

# Importaciones diferidas
from .pedido import Pedido
from .producto import Producto
from .disenoPersonalizado import DisenoPersonalizado