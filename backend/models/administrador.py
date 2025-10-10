from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime as dt

class AdministradorBase(SQLModel):
    nombre: str = Field(default=None)
    email: str = Field(default=None, unique=True)
    contrasenaHash: str = Field(default=None)
    fechaCreacion: dt = Field(default_factory=dt.now)

    # Metodos administrador
    def crearCategoria():
        print("Aun no")
    
    def crearProducto():
        print("Aun no")
    
    def actualizarCategoria():
        print("Aun no")
    
    def actualizarProducto():
        print("Aun no")
    
    def eliminarCategoria():
        print("Aun no")
    
    def eliminarProducto():
        print("Aun no")
    
    def actualizarEstadoPedido():
        print("Aun no")
    
    def actualizarEstadoDiseno():
        print("Aun no")

class Administrador(AdministradorBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    categorias: list["Categoria"] = Relationship(back_populates="administrador")
    clientes: list["Cliente"] = Relationship(back_populates="administrador")
    disenos: list["DisenoPersonalizado"] = Relationship(back_populates="administrador")
    productos: list["Producto"] = Relationship(back_populates="administrador")
    pedidos: list["Pedido"] = Relationship(back_populates="administrador")
    pagos: list["Pago"] = Relationship(back_populates="administrador")

class AdministradorCreate(AdministradorBase):
    pass

class AdministradorUpdate(SQLModel):
    nombre: str | None = None
    pass

class AdministradorDelete(AdministradorBase):
    pass

# Importaciones diferidas
from .categoria import Categoria
from .cliente import Cliente
from .disenoPersonalizado import DisenoPersonalizado
from .producto import Producto
from .pedido import Pedido
from .pago import Pago