import os
import uuid
from pathlib import Path
from fastapi import UploadFile

# Crear el directorio para guardar las imagenes
STORE_DIR = "bucket"

# Crear el directorio si no existe
Path(STORE_DIR).mkdir(parents=True, exist_ok=True)

async def cargarArchivo(archivo: UploadFile):
    contenido = await archivo.read()
    nombreOriginal = archivo.filename
    nombreNuevoArchivo = f"{uuid.uuid4()}_{nombreOriginal}"
    pathArchivo = os.path.join(STORE_DIR, nombreNuevoArchivo)

    with open(pathArchivo, "wb") as f:
        f.write(contenido)

    return {
        "nombre_original": nombreOriginal,
        "nombre_archivo": nombreNuevoArchivo,
        "path_archivo": pathArchivo
    }
