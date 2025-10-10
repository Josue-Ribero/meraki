from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime as dt
from fastapi import Form
from typing import Optional

class ClienteBase(SQLModel):
    nombre: str = Field(default=None)
    email: str = Field(default=None, unique=True)
    contrasenaHash: str = Field(default=None)
    telefono: str = Field(default=None)
    puntos: int = Field(default=0)
    activo: bool = Field(default=True)
    fechaCreacion: dt = Field(default_factory=dt.now)

    # Metodos cliente
    def actualizarPuntos(self, cantidad: int):
        self.puntos += cantidad
    
    def solicitarRecuperacion(self):
        from .solicitudRecuperacion import SolicitudRecuperacion
        token = SolicitudRecuperacion.generarToken
        solicitud = SolicitudRecuperacion.validarToken()

class Cliente(ClienteBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    administradorID: int | None = Field(default=None, foreign_key="administrador.id")
    administrador: "Administrador" = Relationship(back_populates="clientes")
    direcciones: list["DireccionEnvio"] = Relationship(back_populates="cliente")
    transacciones: list["TransaccionPuntos"] = Relationship(back_populates="cliente")
    carrito: Optional["Carrito"] = Relationship(back_populates="cliente")
    pedidos: list["Pedido"] = Relationship(back_populates="cliente")
    disenos: list["DisenoPersonalizado"] = Relationship(back_populates="cliente")
    wishlist: "Wishlist" = Relationship(back_populates="cliente")
    solicitudesRecuperacion: list["SolicitudRecuperacion"] = Relationship(back_populates="cliente")

class ClienteCreate(ClienteBase):
    pass

class ClienteUpdate(SQLModel):
    nombre: Optional[str] | None = None
    telefono: Optional[str] | None = None
    contrasenaHash: Optional[str] | None = None

class ClienteDelete(ClienteBase):
    pass

# Importaciones diferidas
from .direccionEnvio import DireccionEnvio
from .transaccionPuntos import TransaccionPuntos
from .carrito import Carrito
from .pedido import Pedido
from .disenoPersonalizado import DisenoPersonalizado
from .wishlist import Wishlist
from .solicitudRecuperacion import SolicitudRecuperacion
from .administrador import Administrador