from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from sqlalchemy import Column, ForeignKey

"""
    Modelo para detalle de pedido.

    Almacena la información inmutable de los productos que fueron comprados en un pedido.
    A diferencia del carrito, este registro es histórico y preserva el precio del producto
    en el momento exacto de la compra, protegiéndolo de cambios futuros de precio.
"""

# Modelo base de detalle de pedido
class DetallePedidoBase(SQLModel):
    cantidad: int = Field(default=0)
    precioUnidad: int = Field(default=0)
    subtotal: int = Field(default=0)
    esPersonalizado: bool = Field(default=False)

    # Método
    def calcularSubtotal(self):
        self.subtotal = self.cantidad * self.precioUnidad
        return self.subtotal



# Modelo de detalle de pedido
class DetallePedido(DetallePedidoBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    pedidoID: int = Field(foreign_key="pedido.id")
    pedido: "Pedido" = Relationship(back_populates="detalles", sa_relationship_kwargs={"cascade": "all, delete"})
    productoID: Optional[int] = Field(default=None, foreign_key="producto.id")
    producto: "Producto" = Relationship(back_populates="detallesPedido")
    disenoID: Optional[int] = Field(default=None, foreign_key="disenopersonalizado.id")
    disenoPersonalizado: Optional["DisenoPersonalizado"] = Relationship(back_populates="detallesPedido")



# Modelo de detalle de pedido para leer
class DetallePedidoRead(DetallePedidoBase):
    id: int
    pedidoID: int
    producto: "Producto | None" = None
    disenoPersonalizado: "DisenoPersonalizado | None" = None

# Modelo de detalle de pedido para crear
class DetallePedidoCreate(DetallePedidoBase):
    pass



# Modelo de detalle de pedido para actualizar
class DetallePedidoUpdate(DetallePedidoBase):
    pass



# Modelo de detalle de pedido para eliminar
class DetallePedidoDelete(DetallePedidoBase):
    pass



# Importaciones diferidas
from .pedido import Pedido
from .producto import Producto
from .disenoPersonalizado import DisenoPersonalizado