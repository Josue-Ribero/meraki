from sqlmodel import create_engine, Session, SQLModel, select
from fastapi import FastAPI, Depends
from typing import Annotated
from datetime import datetime as dt
from passlib.context import CryptContext
from ..models.administrador import Administrador
from dotenv import load_dotenv
import os

load_dotenv() # Cargar el archivo .env

# Conexion a la DB
db_name = os.getenv("DB_NAME")
db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")
db_host = os.getenv("DB_HOST")
db_port = os.getenv("DB_PORT")

# Url de la base de datos
db_url = f"postgresql+psycopg://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

# Motor de DB
engine = create_engine(db_url, echo=True, connect_args={"client_encoding": "utf8"})

# Hash de contrasena
contrasenaContext = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hashearContrasena(contrasena: str) -> str:
    contrasena = contrasena[:72]
    return contrasenaContext.hash(contrasena)

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
                nombre="Josue",
                email="josueribero95@gmail.com",
                contrasenaHash=hashearContrasena("josue123"),
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