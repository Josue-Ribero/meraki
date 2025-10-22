from fastapi import FastAPI, Request, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
from .db.db import createAllTables
from .utils.bucket import cargarArchivo

# Instancia del objeto FastAPI
app = FastAPI(title="Meraki", lifespan=createAllTables)

# Colocar duracion de una sesion (1 dia)
app.add_middleware(SessionMiddleware, secret_key="josue", max_age=60 * 60 * 24)

# Montar los archivos estáticos
app.mount("/static", StaticFiles(directory="frontend/static"), name="static")

app.mount("/uploads", StaticFiles(directory="bucket"), name="uploads")

# Indicar dónde están los templates
templates = Jinja2Templates(directory="frontend/templates")

# Routers de la app
from .routers import (
    administrador_router,
    auth_router,
    carrito_router,
    categoria_router,
    cliente_router,
    detalleCarrito_router,
    detallePedido_router,
    direccionEnvio_router,
    disenoPersonalizado_router,
    pago_router,
    pedido_router,
    producto_router,
    reportes_router,
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
    detalleCarrito_router.router,
    detallePedido_router.router,
    direccionEnvio_router.router,
    disenoPersonalizado_router.router,
    pago_router.router,
    pedido_router.router,
    producto_router.router,
    reportes_router.router,
    solicitudRecuperacion_router.router,
    transaccionPuntos_router.router,
    wishlist_router.router
]

for router in routers:
    app.include_router(router)


# Rutas Front-end

# Imagenes
@app.post("/bucket")
async def subirImagen(archivo: UploadFile = File(...)):
    resultado = await cargarArchivo(archivo)
    return resultado


# Híbridas
@app.get("/registrar")
def paginaRegistro(request: Request):
    return templates.TemplateResponse("auth/login.html", {"request": request})

@app.get("/ingresar")
def paginaIngreso(request: Request):
    return templates.TemplateResponse("auth/login.html", {"request": request})


# Cliente
@app.get("/")
def inicio(request: Request):
    return templates.TemplateResponse("principal.html", {"request": request})

@app.get("/about")
def paginaAbout(request: Request):
    return templates.TemplateResponse("about.html", {"request": request})

@app.get("/contacto")
def paginaAbout(request: Request):
    return templates.TemplateResponse("contacto.html", {"request": request})

@app.get("/producto")
def paginaAbout(request: Request):
    return templates.TemplateResponse("producto/detalleProducto.html", {"request": request})

@app.get("/wishlist")
def paginaWishlist(request: Request):
    if not request.session.get("clienteID"):
        return RedirectResponse(url="/ingresar", status_code=303)
    return templates.TemplateResponse("wishlist/wishlist.html", {"request": request})

@app.get("/carrito")
def paginaCarrito(request: Request):
    if not request.session.get("clienteID"):
        return RedirectResponse(url="/ingresar", status_code=303)
    return templates.TemplateResponse("carrito/carrito.html", {"request": request})

@app.get("/personal")
def paginaCliente(request: Request):
    if not request.session.get("clienteID"):
        return RedirectResponse(url="/ingresar", status_code=303)
    return templates.TemplateResponse("client/panelCliente.html", {"request": request})

@app.get("/mi-cuenta")
def miCuenta(request: Request):
    if request.session.get("clienteID"):
        return RedirectResponse(url="/personal", status_code=303)
    return RedirectResponse(url="/ingresar", status_code=303)

@app.get("/mi-diseno")
def disenoPersonalizado(request: Request):
    if not request.session.get("clienteID"):
        return RedirectResponse(url="/ingresar", status_code=303)
    return templates.TemplateResponse("producto/disenoPersonalizado.html", {"request": request})

@app.get("/recuperar-contrasena")
def recuperacionContrasena(request: Request):
    return templates.TemplateResponse("contrasena/recuperacion.html", {"request": request})

# Administrador
@app.get("/clientes")
def paginaDashboard(request: Request):
    if not request.session.get("administradorID"):
        return RedirectResponse(url="/ingresar", status_code=303)
    return templates.TemplateResponse("admin/clientesAdmin.html", {"request": request})

@app.get("/categorias")
def paginaDashboard(request: Request):
    if not request.session.get("administradorID"):
        return RedirectResponse(url="/ingresar", status_code=303)
    return templates.TemplateResponse("admin/categoriaAdmin.html", {"request": request})

@app.get("/dashboard")
def paginaDashboard(request: Request):
    if not request.session.get("administradorID"):
        return RedirectResponse(url="/ingresar", status_code=303)
    return templates.TemplateResponse("admin/dashboardAdmin.html", {"request": request})

@app.get("/pedidos")
def paginaDashboard(request: Request):
    if not request.session.get("administradorID"):
        return RedirectResponse(url="/ingresar", status_code=303)
    return templates.TemplateResponse("admin/pedidosAdmin.html", {"request": request})

@app.get("/productos")
def paginaDashboard(request: Request):
    if not request.session.get("administradorID"):
        return RedirectResponse(url="/ingresar", status_code=303)
    return templates.TemplateResponse("admin/productosAdmin.html", {"request": request})