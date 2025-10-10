from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, timedelta
import secrets

class SolicitudRecuperacionBase(SQLModel):
    token: str | None = Field(default=lambda: secrets.token_urlsafe(3))
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
    id: int | None = Field(default=None, primary_key=True)
    clienteID: int | None = Field(foreign_key="cliente.id")
    cliente: "Cliente" = Relationship(back_populates="solicitudesRecuperacion")

class SolicitudRecuperacionCreate(SolicitudRecuperacionBase):
    pass

class SolicitudRecuperacionUpdate(SQLModel):
    usado: bool

class SolicitudRecuperacionDelete(SolicitudRecuperacionBase):
    pass

# Importaciones diferidas
from .cliente import Cliente