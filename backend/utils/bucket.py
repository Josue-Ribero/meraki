from fastapi import UploadFile
from ..supabase.supabase import uploadarchivoBucket

async def cargarArchivo(archivo: UploadFile):
    # Subir a Supabase y retornar la URL pública
    url = await uploadarchivoBucket(archivo)
    return url
