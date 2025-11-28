from fastapi import UploadFile
from ..supabase.supabase import uploadarchivoBucket

"""
    Utilidad para la gestión de archivos en la nube.

    Actúa como una capa de abstracción sobre el cliente de Supabase para facilitar
    la carga de imágenes y otros archivos desde los controladores de la aplicación,
    simplificando la interfaz de subida.
"""

# Funcion para cargar archivos al bucket de Supabase
async def cargarArchivo(archivo: UploadFile):
    # Subir a Supabase y retornar la URL pública
    url = await uploadarchivoBucket(archivo)
    return url