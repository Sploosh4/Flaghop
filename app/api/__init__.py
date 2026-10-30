"""ASGI entry point with native typed routes and an explicit legacy WSGI boundary."""

import logging
from a2wsgi import WSGIMiddleware
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from starlette.responses import JSONResponse
from app.api.routes import router
from app.api.activity_routes import router as activity_router
from app.api.events import register_event_routes
from app.web import create_app as create_legacy_app


def create_app(runtime=None, *, config=None):
    app = FastAPI(
        title="Legion workspace API",
        version="1.0.0",
        description="Native workspace identity, activity, approvals and snapshots. Other views use the legacy application.",
    )
    app.state.runtime = runtime
    legacy = create_legacy_app(runtime)
    legacy.config.update(config or {})
    legacy.config["LEGION_WEBSOCKETS_ENABLED"] = True
    app.state.config = legacy.config
    app.state.legacy = legacy

    @app.exception_handler(RequestValidationError)
    async def validation_error(_request, exc):
        details = [{"loc": list(item["loc"]), "msg": item["msg"], "type": item["type"]} for item in exc.errors()]
        return JSONResponse(
            {"status": "error", "error": "; ".join(item["msg"] for item in details), "details": details},
            status_code=422,
        )

    @app.exception_handler(KeyError)
    async def not_found(_request, exc):
        return JSONResponse({"status": "error", "error": str(exc.args[0])}, status_code=404)

    @app.exception_handler(ValueError)
    async def invalid_request(_request, exc):
        return JSONResponse({"status": "error", "error": str(exc)}, status_code=400)

    @app.exception_handler(RuntimeError)
    async def conflict(_request, exc):
        return JSONResponse({"status": "error", "error": str(exc)}, status_code=409)

    @app.exception_handler(Exception)
    async def server_error(_request, exc):
        logging.getLogger(__name__).exception("Workspace API failed", exc_info=exc)
        return JSONResponse({"status": "error", "error": str(exc)}, status_code=500)

    @app.middleware("http")
    async def disable_api_cache(request: Request, call_next):
        response = await call_next(request)
        if request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store, max-age=0, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        return response

    app.include_router(router)
    app.include_router(activity_router)
    register_event_routes(app)
    # Keep unmatched paths, static files and existing downloads working during the pilot.
    app.mount("/", WSGIMiddleware(legacy))
    return app
