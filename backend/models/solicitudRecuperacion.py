from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import ForeignKey
from datetime import datetime as dt, timedelta
from typing import Optional
import secrets

"""
    Modelo para solicitud de recuperación de contraseña.

    Gestiona el proceso de recuperación de acceso cuando un cliente olvida su contraseña.
    Genera tokens temporales seguros con fecha de expiración para validar la identidad del usuario.
"""

class SolicitudRecuperacionBase(SQLModel):
    token: str = Field(unique=True, index=True)
    expiracion: dt = Field()
    usado: bool = Field(default=False)

    # Metodos solicitud
    @staticmethod
    def generarToken():
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def validarToken(token: str):
        pass



class SolicitudRecuperacion(SolicitudRecuperacionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    clienteID: int = Field(sa_column=Column(ForeignKey("cliente.id", ondelete="CASCADE")))
    cliente: "Cliente" = Relationship(back_populates="solicitudesRecuperacion")



class SolicitudRecuperacionCreate(SolicitudRecuperacionBase):
    pass



class SolicitudRecuperacionUpdate(SolicitudRecuperacionBase):
    pass



class SolicitudRecuperacionDelete(SolicitudRecuperacionBase):
    pass



# Importaciones diferidas
from .cliente import Cliente