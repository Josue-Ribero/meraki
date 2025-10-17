from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import ForeignKey
from sqlalchemy import Column, JSON
from datetime import datetime as dt
from ..utils.enums import EstadoDiseno
import json

class DisenoPersonalizadoBase(SQLModel):
    imagenURL: str | None = Field(default=None)
    fecha: dt = Field(default_factory=dt.now)
    estado: EstadoDiseno = Field(default=EstadoDiseno.EN_PRODUCCION)
    data: dict | None = Field(default=None, sa_column=Column(JSON))
    precioEstimado: int = Field(default=0)

    # Métodos
    def obtenerImagen(self) -> str:
        return self.imagenURL or ""

    def calcularPrecio(self) -> int:
        return self.precioEstimado

class DisenoPersonalizado(DisenoPersonalizadoBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    administradorID: int | None = Field(default=None, foreign_key="administrador.id")
    administrador: "Administrador" = Relationship(back_populates="disenos")
    clienteID: int = Field(sa_column=Column(ForeignKey("cliente.id", ondelete="CASCADE")))
    cliente: "Cliente" = Relationship(back_populates="disenos")
    detallesCarrito: list["DetalleCarrito"] = Relationship(back_populates="disenoPersonalizado")
    detallesPedido: list["DetallePedido"] = Relationship(back_populates="disenoPersonalizado")

class DisenoPersonalizadoCreate(DisenoPersonalizadoBase):
    pass

class DisenoPersonalizadoUpdate(DisenoPersonalizadoBase):
    pass

class DisenoPersonalizadoDelete(DisenoPersonalizadoBase):
    pass

# Importaciones diferidas
from .administrador import Administrador
from .cliente import Cliente
from .detalleCarrito import DetalleCarrito
from .detallePedido import DetallePedido