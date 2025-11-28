from fastapi import FastAPI, Request, UploadFile, File
import time
import logging
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
from .db.db import createAllTables

"""
    Punto de entrada principal de la aplicación FastAPI.

    Configura la instancia de la aplicación, middlewares, archivos estáticos,
    plantillas Jinja2 y registra todos los routers del sistema.
    También define las rutas principales para el frontend.
"""

# Instancia del objeto FastAPI
app = FastAPI(title="Meraki", lifespan=createAllTables)

# Colocar duracion de una sesion (1 dia)
app.add_middleware(SessionMiddleware, secret_key="josue", max_age=60 * 60 * 24)

# Montar los archivos estáticos
app.mount("/static", StaticFiles(directory="frontend/static"), name="static")

# Indicar dónde están los templates
templates = Jinja2Templates(directory="frontend/templates")

# Configurar logger básico
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')

# Middleware de logging sencillo
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = (time.time() - start) * 1000
    logging.info(f"{request.client.host}:{request.client.port} - \"{request.method} {request.url.path}\" {response.status_code} {duration:.1f}ms")
    return response

# Routers de la app
from .routers import (
    administrador_router,
    auth_router,
    carrito_router,
    categoria_router,
    cliente_router,
    dashboardAdmin_router,
    detalleCarrito_router,
    detallePedido_router,
    direccionEnvio_router,
    disenoPersonalizado_router,
    pago_router,
    pedido_router,
    producto_router,
    solicitudRecuperacion_router,
    transaccionPuntos_router,
    wishlist_router
)

# Inclusion de los routers en la app
routers = [
    administrador_router.router,
    auth_router.router,
    carrito_router.router,
    categoria_router.router,
    cliente_router.router,
    dashboardAdmin_router.router,
    detalleCarrito_router.router,
    detallePedido_router.router,
    direccionEnvio_router.router,
    disenoPersonalizado_router.router,
    pago_router.router,
    pedido_router.router,
    producto_router.router,
    solicitudRecuperacion_router.router,
    transaccionPuntos_router.router,
    wishlist_router.router
]

# Incluir los routers en la app
for router in routers:
    app.include_router(router)



# RUTAS FRONTEND

# Imagenes
@app.post("/bucket")
async def subirImagen(archivo: UploadFile = File(...)):
    from .utils.bucket import cargarArchivo
    resultado = await cargarArchivo(archivo)
    return resultado



# Autenticacion de usuarios
@app.get("/registrar")
async def paginaRegistro(request: Request):
    return templates.TemplateResponse("auth/login.html", {"request": request})

@app.get("/ingresar")
async def paginaIngreso(request: Request):
    return templates.TemplateResponse("auth/login.html", {"request": request})



# Cliente
@app.get("/")
async def inicio(request: Request):
    return templates.TemplateResponse("principal.html", {"request": request})

@app.get("/about")
async def paginaAbout(request: Request):
    return templates.TemplateResponse("about.html", {"request": request})

@app.get("/contacto")
async def paginaContacto(request: Request):
    return templates.TemplateResponse("contacto.html", {"request": request})

@app.get("/producto/{productoID}")
async def paginaProducto(request: Request, productoID: int):
    return templates.TemplateResponse("producto/detalleProducto.html", {"request": request})

@app.get("/wishlist")
async def paginaWishlist(request: Request):
    if not request.session.get("clienteID"):
        return RedirectResponse(url="/ingresar", status_code=303)
    return templates.TemplateResponse("wishlist/wishlist.html", {"request": request})

@app.get("/carrito")
async def paginaCarrito(request: Request):
    if not request.session.get("clienteID"):
        return RedirectResponse(url="/ingresar", status_code=303)
    return templates.TemplateResponse("carrito/carrito.html", {"request": request})

@app.get("/proceso-pago")
async def paginaProcesoPago(request: Request):
    if not request.session.get("clienteID"):
        return RedirectResponse(url="/ingresar", status_code=303)
    return templates.TemplateResponse("pago/procesoPago.html", {"request": request})

@app.get("/proceso-pago-direccion")
async def paginaProcesoPago(request: Request):
    if not request.session.get("clienteID"):
        return RedirectResponse(url="/ingresar", status_code=303)
    return templates.TemplateResponse("pago/procesoPagoDireccion.html", {"request": request})

@app.get("/proceso-pago-detalles")
async def paginaProcesoPago(request: Request):
    if not request.session.get("clienteID"):
        return RedirectResponse(url="/ingresar", status_code=303)
    return templates.TemplateResponse("pago/procesoPagoDetalles.html", {"request": request})

@app.get("/cancelar-pago/{pedidoID}")
async def paginaCancelarPago(request: Request, pedidoID: int):
    if not request.session.get("clienteID"):
        return RedirectResponse(url="/ingresar", status_code=303)
    return templates.TemplateResponse("client/panelCliente.html", {"request": request})

@app.get("/personal")
async def paginaCliente(request: Request):
    if not request.session.get("clienteID"):
        return RedirectResponse(url="/ingresar", status_code=303)
    return templates.TemplateResponse("client/panelCliente.html", {"request": request})

@app.get("/mi-cuenta")
async def miCuenta(request: Request):
    if request.session.get("clienteID"):
        return RedirectResponse(url="/personal", status_code=303)
    return RedirectResponse(url="/ingresar", status_code=303)

@app.get("/mi-diseno")
async def disenoPersonalizado(request: Request):
    if not request.session.get("clienteID"):
        return RedirectResponse(url="/ingresar", status_code=303)
    return templates.TemplateResponse("producto/disenoPersonalizado.html", {"request": request})

@app.get("/recuperar-contrasena")
async def recuperacionContrasena(request: Request):
    return templates.TemplateResponse("contrasena/recuperacion.html", {"request": request})



# Administrador - Rutas simples que solo verifican sesión
@app.get("/clientes")
async def paginaClientes(request: Request):
    if not request.session.get("administradorID"):
        return RedirectResponse(url="/ingresar", status_code=303)
    return templates.TemplateResponse("admin/clientesAdmin.html", {"request": request})

@app.get("/categorias")
async def paginaCategorias(request: Request):
    if not request.session.get("administradorID"):
        return RedirectResponse(url="/ingresar", status_code=303)
    return templates.TemplateResponse("admin/categoriaAdmin.html", {"request": request})

@app.get("/pedidos")
async def paginaPedidos(request: Request):
    if not request.session.get("administradorID"):
        return RedirectResponse(url="/ingresar", status_code=303)
    return templates.TemplateResponse("admin/pedidosAdmin.html", {"request": request})

@app.get("/productos")
async def paginaProductos(request: Request):
    if not request.session.get("administradorID"):
        return RedirectResponse(url="/ingresar", status_code=303)
    return templates.TemplateResponse("admin/productosAdmin.html", {"request": request})