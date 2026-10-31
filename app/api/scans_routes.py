"""Native FastAPI endpoints preserving existing service and HTTP contracts."""

from typing import Any
from fastapi import Body, Request
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from app.api.dependencies import Runtime, native_router
from app.web.http_utils import json_error
from app.web.services.scan_service import ScanService

router = native_router()


@router.post("/api/nmap/import-xml", operation_id="import_nmap_xml")
def import_nmap_xml(request: Request, runtime: Runtime, payload: Any = Body(default=None)):
    service = ScanService(runtime)
    try:
        return JSONResponse(jsonable_encoder(service.import_nmap_xml(payload or {})), status_code=202)
    except FileNotFoundError as exc:
        return json_error(str(exc), 404)
    except ValueError as exc:
        return json_error(str(exc), 400)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.post("/api/nmap/scan", operation_id="nmap_scan")
def nmap_scan(request: Request, runtime: Runtime, payload: Any = Body(default=None)):
    service = ScanService(runtime)
    try:
        return JSONResponse(jsonable_encoder(service.nmap_scan(payload or {})), status_code=202)
    except FileNotFoundError as exc:
        return json_error(str(exc), 404)
    except ValueError as exc:
        return json_error(str(exc), 400)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.get("/api/network/interfaces", operation_id="network_interfaces")
def network_interfaces(request: Request, runtime: Runtime):
    service = ScanService(runtime)
    try:
        return service.get_network_interfaces()
    except Exception as exc:
        return json_error(str(exc), 500)


@router.post("/api/scan/passive-capture", operation_id="passive_capture_scan")
def passive_capture_scan(request: Request, runtime: Runtime, payload: Any = Body(default=None)):
    service = ScanService(runtime)
    try:
        return JSONResponse(jsonable_encoder(service.passive_capture(payload or {})), status_code=202)
    except FileNotFoundError as exc:
        return json_error(str(exc), 404)
    except ValueError as exc:
        return json_error(str(exc), 400)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.post("/api/workspace/hosts/{host_id}/rescan", operation_id="workspace_host_rescan")
def workspace_host_rescan(host_id: int, request: Request, runtime: Runtime):
    service = ScanService(runtime)
    try:
        return JSONResponse(jsonable_encoder(service.host_rescan(host_id)), status_code=202)
    except KeyError as exc:
        return json_error(str(exc), 404)
    except ValueError as exc:
        return json_error(str(exc), 400)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.post("/api/workspace/subnets/rescan", operation_id="workspace_subnet_rescan")
def workspace_subnet_rescan(request: Request, runtime: Runtime, payload: Any = Body(default=None)):
    service = ScanService(runtime)
    try:
        return JSONResponse(jsonable_encoder(service.subnet_rescan(payload or {})), status_code=202)
    except KeyError as exc:
        return json_error(str(exc), 404)
    except ValueError as exc:
        return json_error(str(exc), 400)
    except Exception as exc:
        return json_error(str(exc), 500)
