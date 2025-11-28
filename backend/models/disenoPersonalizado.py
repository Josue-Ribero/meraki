from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import ForeignKey
from sqlalchemy import Column, JSON
from datetime import datetime as dt
from ..utils.enums import EstadoDiseno
from typing import Optional

"""
    Modelo para diseño personalizado.

    Permite a los clientes solicitar joyas con diseños únicos subiendo una imagen de referencia.
    Gestiona el estado de la solicitud (pendiente, aprobado, rechazado) y el precio estimado
    asignado por el administrador.
"""

# Modelo base de diseño personalizado
class DisenoPersonalizadoBase(SQLModel):
    imagenURL: Optional[str] = Field(default=None)
    fecha: dt = Field(default_factory=dt.now)
    estado: EstadoDiseno = Field(default=EstadoDiseno.EN_PRODUCCION)
    data: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    precioEstimado: int = Field(default=0)

    # Métodos
    def obtenerImagen(self) -> str:
        return self.imagenURL or ""

    def calcularPrecio(self) -> int:
        return self.precioEstimado



# Modelo de diseño personalizado
class DisenoPersonalizado(DisenoPersonalizadoBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    administradorID: Optional[int] = Field(default=None, foreign_key="administrador.id")
    administrador: "Administrador" = Relationship(back_populates="disenos")
    clienteID: int = Field(sa_column=Column(ForeignKey("cliente.id", ondelete="CASCADE")))
    cliente: "Cliente" = Relationship(back_populates="disenos")
    detallesCarrito: list["DetalleCarrito"] = Relationship(back_populates="disenoPersonalizado")
    detallesPedido: list["DetallePedido"] = Relationship(back_populates="disenoPersonalizado")



# Modelo de diseño personalizado para crear
class DisenoPersonalizadoCreate(DisenoPersonalizadoBase):
    pass



# Modelo de diseño personalizado para actualizar
class DisenoPersonalizadoUpdate(DisenoPersonalizadoBase):
    pass



# Modelo de diseño personalizado para eliminar
class DisenoPersonalizadoDelete(DisenoPersonalizadoBase):
    pass



# Importaciones diferidas
from .administrador import Administrador
from .cliente import Cliente
from .detalleCarrito import DetalleCarrito
from .detallePedido import DetallePedido