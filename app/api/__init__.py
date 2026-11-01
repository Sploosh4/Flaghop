"""The single FastAPI application for HTTP, WebSockets, pages and assets."""

import logging
import threading
from contextlib import asynccontextmanager
from starlette.concurrency import run_in_threadpool
from app.api import (
    graph_routes,
    host_actions_routes,
    projects_routes,
    scans_routes,
    scheduler_routes,
    settings_routes,
    tools_routes,
    workspace_routes,
)
from app.api.activity_routes import router as activity_router
from app.api.background_routes import router as background_router
from app.api.events import register_event_routes
from app.api.hub_routes import router as hub_router
from app.api.pages import WEB_ROOT, router as page_router
from app.api.protocol import ProtocolStaticFiles
from app.api.routes import router
from app.api.scanner_routes import router as scanner_router
from app.services.project_hub import ProjectHub
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from starlette.responses import JSONResponse


def create_app(runtime=None, *, config=None):
    from app.web.jobs import WebJobManager

    manages_jobs = isinstance(getattr(runtime, "jobs", None), WebJobManager)
    if manages_jobs:
        with runtime._lock:
            if getattr(runtime, "_api_lifecycle_lock", None) is None:
                runtime._api_lifecycle_lock = threading.RLock()

    @asynccontextmanager
    async def lifespan(application):
        from app.services.runtime_lifecycle import acquire, release

        if manages_jobs:
            await run_in_threadpool(acquire, runtime, application.state.project_hub)
        try:
            yield
        finally:
            if manages_jobs:
                application.state.shutdown_report = await run_in_threadpool(release, runtime)

    app = FastAPI(
        title="FlagHop workspace API",
        version="1.0.0",
        description="Workspace, tools, scans, evidence, project files and live activity.",
        lifespan=lifespan,
    )
    app.state.runtime = runtime
    from app.services.storage_admission import StorageAdmission, StorageRejected

    admission = getattr(runtime, "storage_admission", None)
    if admission is None or config and "LEGION_TRANSFER_LIMITS" in config:
        admission = StorageAdmission((config or {}).get("LEGION_TRANSFER_LIMITS"))
    app.state.storage_admission = admission
    if runtime is not None:
        runtime.storage_admission = admission
    app.state.config = {
        "LEGION_WS_EVENT_HEARTBEAT_SECONDS": 30.0,
        "LEGION_AUTH_ENABLED": False,
        "LEGION_WEB_BIND_HOST": "127.0.0.1",
        "LEGION_WEB_BIND_LABEL": "Localhost only",
        "LEGION_UI_OPAQUE": True,
        "LEGION_COLORFUL_ASCII_BACKGROUND": False,
        "LEGION_WEBSOCKETS_ENABLED": True,
        **(config or {}),
    }
    app.state.project_hub = ProjectHub(runtime)

    @app.exception_handler(RequestValidationError)
    async def validation_error(_request, exc):
        details = [{"loc": list(item["loc"]), "msg": item["msg"], "type": item["type"]} for item in exc.errors()]
        return JSONResponse(
            {"status": "error", "error": "; ".join(item["msg"] for item in details), "details": details},
            status_code=422,
        )

    @app.exception_handler(StorageRejected)
    async def storage_rejected(_request, exc):
        return JSONResponse({"status": "error", "error": str(exc)}, status_code=exc.status)

    @app.exception_handler(KeyError)
    async def not_found(_request, exc):
        return JSONResponse({"status": "error", "error": str(exc.args[0])}, status_code=404)

    @app.exception_handler(FileNotFoundError)
    async def missing_file(_request, exc):
        return JSONResponse({"status": "error", "error": str(exc)}, status_code=404)

    @app.exception_handler(PermissionError)
    async def forbidden(_request, exc):
        return JSONResponse({"status": "error", "error": str(exc)}, status_code=403)

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
    app.include_router(hub_router)
    app.include_router(background_router)
    app.include_router(scanner_router)
    for module in (
        graph_routes,
        settings_routes,
        projects_routes,
        scans_routes,
        host_actions_routes,
        workspace_routes,
        scheduler_routes,
        tools_routes,
    ):
        app.include_router(module.router)
    app.include_router(page_router)
    register_event_routes(app)
    app.mount("/static", ProtocolStaticFiles(directory=WEB_ROOT / "static"), name="static")
    return app
