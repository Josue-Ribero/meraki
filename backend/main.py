from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
from .db.db import createAllTables

# Instancia del objeto FastAPI
app = FastAPI(title="Meraki", lifespan=createAllTables)

# Colocar duracion de una sesion (1 dia)
app.add_middleware(SessionMiddleware, secret_key="josue", max_age=60 * 60 * 24)

# Montar los archivos estáticos
app.mount("/static", StaticFiles(directory="frontend/static"), name="static")

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
    solicitudRecuperacion_router,
    transaccionPuntos_router,
    wishlist_router,
    wishlistitem_router
)

# Inclusion de los routers en la app
app.include_router(administrador_router.router)
app.include_router(auth_router.router)
app.include_router(carrito_router.router)
app.include_router(categoria_router.router)
app.include_router(cliente_router.router)
app.include_router(detalleCarrito_router.router)
app.include_router(detallePedido_router.router)
app.include_router(direccionEnvio_router.router)
app.include_router(disenoPersonalizado_router.router)
app.include_router(pago_router.router)
app.include_router(pedido_router.router)
app.include_router(producto_router.router)
app.include_router(solicitudRecuperacion_router.router)
app.include_router(transaccionPuntos_router.router)
app.include_router(wishlist_router.router)
app.include_router(wishlistitem_router.router)

# Rutas Front-end

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

@app.get("/wishlist")
def paginaWishlist(request: Request):
    return templates.TemplateResponse("wishlist/wishlist.html", {"request": request})

@app.get("/carrito")
def paginaCarrito(request: Request):
    return templates.TemplateResponse("carrito/carrito.html", {"request": request})

@app.get("/personal")
def paginaCliente(request: Request):
    if not request.session.get("clienteID"):
        return RedirectResponse(url="/ingresar", status_code=303)
    return templates.TemplateResponse("client/panelCliente.html", {"request": request})

@app.get("/recuperar-contrasena")
def recuperacionContrasena(request: Request):
    return templates.TemplateResponse("contrasena/recuperacion.html", {"request": request})

@app.get("/token-recuperacion")
def paginaCarrito(request: Request):
    return templates.TemplateResponse("contrasena/token.html", {"request": request})

@app.get("/carrito")
def paginaCarrito(request: Request):
    return templates.TemplateResponse("carrito/carrito.html", {"request": request})

@app.get("/carrito")
def paginaCarrito(request: Request):
    return templates.TemplateResponse("carrito/carrito.html", {"request": request})

@app.get("/carrito")
def paginaCarrito(request: Request):
    return templates.TemplateResponse("carrito/carrito.html", {"request": request})

@app.get("/carrito")
def paginaCarrito(request: Request):
    return templates.TemplateResponse("carrito/carrito.html", {"request": request})

@app.get("/carrito")
def paginaCarrito(request: Request):
    return templates.TemplateResponse("carrito/carrito.html", {"request": request})

@app.get("/carrito")
def paginaCarrito(request: Request):
    return templates.TemplateResponse("carrito/carrito.html", {"request": request})

# Administrador
@app.get("/dashboard")
def paginaCarrito(request: Request):
    return templates.TemplateResponse("admin/dashboardAdmin.html", {"request": request})

@app.get("/carrito")
def paginaCarrito(request: Request):
    return templates.TemplateResponse("carrito/carrito.html", {"request": request})

@app.get("/carrito")
def paginaCarrito(request: Request):
    return templates.TemplateResponse("carrito/carrito.html", {"request": request})

@app.get("/carrito")
def paginaCarrito(request: Request):
    return templates.TemplateResponse("carrito/carrito.html", {"request": request})

@app.get("/carrito")
def paginaCarrito(request: Request):
    return templates.TemplateResponse("carrito/carrito.html", {"request": request})

@app.get("/carrito")
def paginaCarrito(request: Request):
    return templates.TemplateResponse("carrito/carrito.html", {"request": request})