from sqlmodel import create_engine, Session, SQLModel, select
from fastapi import FastAPI, Depends
from typing import Annotated
from datetime import datetime as dt
from passlib.context import CryptContext
from ..models.administrador import Administrador

db_name = "meraki.sqlite3"
db_url = f"sqlite:///{db_name}"
engine = create_engine(db_url)

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