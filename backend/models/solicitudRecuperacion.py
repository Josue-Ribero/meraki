from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import ForeignKey
from datetime import datetime, timedelta
from typing import Optional
import secrets

class SolicitudRecuperacionBase(SQLModel):
    token: str = Field(default_factory=lambda: secrets.token_urlsafe(3))
    expiracion: datetime = Field(default_factory=lambda: datetime.now() + timedelta(minutes=5))
    usado: bool = Field(default=False)

    # Métodos solicitud
    def generarToken(self):
        self.token = secrets.token_urlsafe(3)
        self.expiracion = datetime.now() + timedelta(minutes=5)
        return self.token

    def validarToken(self, token: str) -> bool:
        return self.token == token and not self.usado and datetime.now() < self.expiracion

class SolicitudRecuperacion(SolicitudRecuperacionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    clienteID: int = Field(sa_column=Column(ForeignKey("cliente.id", ondelete="CASCADE")))
    cliente: "Cliente" = Relationship(back_populates="solicitudesRecuperacion")

class SolicitudRecuperacionCreate(SolicitudRecuperacionBase):
    pass

class SolicitudRecuperacionUpdate(SQLModel):
    usado: bool

# Importaciones diferidas
from .cliente import Cliente