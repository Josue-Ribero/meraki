from sqlmodel import SQLModel, Field, Relationship

class DireccionEnvioBase(SQLModel):
    nombre: str = Field(default=None)
    calle: str = Field(default=None)
    localidad: str = Field(default=None)
    codigoPostal: str = Field(default=None)
    esPredeterminada: bool = Field(default=False)

    # Metodo direccion
    def marcarComoPredeterminada(self):
        self.esPredeterminada = True

class DireccionEnvio(DireccionEnvioBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    clienteID: int = Field(foreign_key="cliente.id")
    cliente: "Cliente" = Relationship(back_populates="direcciones")
    pedidos: list["Pedido"] = Relationship(back_populates="direccionEnvio")

class DireccionEnvioCreate(DireccionEnvioBase):
    pass

class DireccionEnvioUpdate(DireccionEnvioBase):
    pass

class DireccionEnvioDelete(DireccionEnvioBase):
    pass

# Importaciones diferidas
from .cliente import Cliente
from .pedido import Pedido