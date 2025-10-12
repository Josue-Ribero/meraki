from sqlmodel import SQLModel, Field, Relationship
from typing import Optional

class DetalleCarritoBase(SQLModel):
    cantidad: int = Field(default=0)
    precioUnidad: int = Field(default=0)
    subtotal: int = Field(default=0)
    esPersonalizado: bool = Field(default=False)

    # Método
    def calcularSubtotal(self):
        self.subtotal = self.cantidad * self.precioUnidad
        return self.subtotal

class DetalleCarrito(DetalleCarritoBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    carritoID: int = Field(foreign_key="carrito.id")
    carrito: "Carrito" = Relationship(back_populates="detalles")
    productoID: int | None = Field(foreign_key="producto.id")
    producto: "Producto" = Relationship(back_populates="detallesCarrito")
    disenoID: int | None = Field(default=None, foreign_key="disenopersonalizado.id")
    disenoPersonalizado: Optional["DisenoPersonalizado"] = Relationship(back_populates="detallesCarrito")

class DetalleCarritoCreate(DetalleCarritoBase):
    pass

class DetalleCarritoUpdate(DetalleCarritoBase):
    pass

class DetalleCarritoDelete(DetalleCarritoBase):
    pass

# Importaciones diferidas
from .carrito import Carrito
from .producto import Producto
from .disenoPersonalizado import DisenoPersonalizado