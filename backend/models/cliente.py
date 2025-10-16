from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime as dt
from typing import Optional

class ClienteBase(SQLModel):
    nombre: str = Field()
    email: str = Field(unique=True)
    contrasenaHash: str = Field()
    telefono: str | None = Field(default=None)
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
    carrito: Optional["Carrito"] = Relationship(back_populates="cliente", sa_relationship_kwargs={"cascade": "all, delete-orphan"})
    pedidos: list["Pedido"] = Relationship(back_populates="cliente")
    disenos: list["DisenoPersonalizado"] = Relationship(back_populates="cliente")
    wishlist: "Wishlist" = Relationship(back_populates="cliente")
    solicitudesRecuperacion: list["SolicitudRecuperacion"] = Relationship(back_populates="cliente")

class ClienteUpdate(SQLModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    contrasenaHash: Optional[str] = None

class ClienteDelete(ClienteBase):
    pass

# Tabla para eliminar los clientes
class ClienteHistorico(SQLModel, table=True):
    id: int = Field(primary_key=True)
    nombre: str
    email: str
    telefono: str | None
    fechaEliminacion: dt = Field(default_factory=dt.now)

# Importaciones diferidas
from .direccionEnvio import DireccionEnvio
from .transaccionPuntos import TransaccionPuntos
from .carrito import Carrito
from .pedido import Pedido
from .disenoPersonalizado import DisenoPersonalizado
from .wishlist import Wishlist
from .solicitudRecuperacion import SolicitudRecuperacion
from .administrador import Administrador