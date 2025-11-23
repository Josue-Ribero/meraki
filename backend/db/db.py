from sqlmodel import create_engine, Session, SQLModel, select
from fastapi import FastAPI, Depends
from typing import Annotated
from datetime import datetime as dt
from passlib.context import CryptContext
from ..models.administrador import Administrador
import os
from dotenv import load_dotenv

"""
    Módulo de configuración de la base de datos.

    Gestiona la conexión con PostgreSQL, la creación del motor de base de datos,
    la gestión de sesiones y la inicialización de tablas y datos semilla
    (como el administrador por defecto).
"""

# Cargar variables de entorno
load_dotenv()

# URL de la base de datos en Render
db_url = os.getenv("DB_URL")

# Crear motor de la base de datos
engine = create_engine(db_url)

# Contexto de contrasena
contrasenaContext = CryptContext(schemes=["bcrypt"], deprecated="auto")



# Funcion para hashear contrasena
def hashearContrasena(contrasena: str) -> str:
    contrasena = contrasena[:72]
    return contrasenaContext.hash(contrasena)



# Funcion para crear tablas y admin por defecto
def createAllTables(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    # Cuando crea las tablas, ingresa al admin
    crearAdminPredeterminado()
    yield



# Creacion del usuario admin por defecto
def crearAdminPredeterminado():
    with Session(engine) as session:
        adminDB = session.exec(select(Administrador)).first()
        if not adminDB:
            admin = Administrador(
                id=1,
                nombre="Nicole",
                email="nikkyr@gmail.com",
                contrasenaHash=hashearContrasena("140852"),
                fechaCreacion=dt.now()
            )
            session.add(admin)
            session.commit()



# Sesion de la DB
def getSession():
    with Session(engine) as session:
        yield session

        

# Dependencia de la DB
SessionDep = Annotated[Session, Depends(getSession)]