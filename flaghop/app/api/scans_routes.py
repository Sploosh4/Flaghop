"""Native FastAPI endpoints preserving existing service and HTTP contracts."""

from app.api.dependencies import Runtime, native_router
from app.contracts.actions.inputs import EmptyAction
from app.contracts.actions.responses import AcceptedJobResponse
from app.contracts.actions.scan_requests import (
    NmapImportRequest,
    NmapScanRequest,
    PassiveCaptureRequest,
    SubnetRescanRequest,
)
from app.web.http_utils import json_error
from app.web.services.scan_service import ScanService
from fastapi import Body, Request, Response

router = native_router()


@router.post(
    "/api/nmap/import-xml",
    operation_id="import_nmap_xml",
    response_model=AcceptedJobResponse,
    response_model_exclude_unset=True,
)
def import_nmap_xml(request: Request, runtime: Runtime, response: Response, payload: NmapImportRequest):
    service = ScanService(runtime)
    try:
        response.status_code = 202
        return service.import_nmap_xml(payload)
    except FileNotFoundError as exc:
        return json_error(str(exc), 404)
    except ValueError as exc:
        return json_error(str(exc), 400)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.post(
    "/api/nmap/scan", operation_id="nmap_scan", response_model=AcceptedJobResponse, response_model_exclude_unset=True
)
def nmap_scan(request: Request, runtime: Runtime, response: Response, payload: NmapScanRequest):
    service = ScanService(runtime)
    try:
        response.status_code = 202
        return service.nmap_scan(payload)
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


@router.post(
    "/api/scan/passive-capture",
    operation_id="passive_capture_scan",
    response_model=AcceptedJobResponse,
    response_model_exclude_unset=True,
)
def passive_capture_scan(request: Request, runtime: Runtime, response: Response, payload: PassiveCaptureRequest):
    service = ScanService(runtime)
    try:
        response.status_code = 202
        return service.passive_capture(payload)
    except FileNotFoundError as exc:
        return json_error(str(exc), 404)
    except ValueError as exc:
        return json_error(str(exc), 400)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.post(
    "/api/workspace/hosts/{host_id}/rescan",
    operation_id="workspace_host_rescan",
    response_model=AcceptedJobResponse,
    response_model_exclude_unset=True,
)
def workspace_host_rescan(
    host_id: int,
    request: Request,
    runtime: Runtime,
    response: Response,
    payload: EmptyAction = Body(default_factory=EmptyAction),
):
    service = ScanService(runtime)
    try:
        response.status_code = 202
        return service.host_rescan(host_id)
    except KeyError as exc:
        return json_error(str(exc), 404)
    except ValueError as exc:
        return json_error(str(exc), 400)
    except Exception as exc:
        return json_error(str(exc), 500)


@router.post(
    "/api/workspace/subnets/rescan",
    operation_id="workspace_subnet_rescan",
    response_model=AcceptedJobResponse,
    response_model_exclude_unset=True,
)
def workspace_subnet_rescan(request: Request, runtime: Runtime, response: Response, payload: SubnetRescanRequest):
    service = ScanService(runtime)
    try:
        response.status_code = 202
        return service.subnet_rescan(payload)
    except KeyError as exc:
        return json_error(str(exc), 404)
    except ValueError as exc:
        return json_error(str(exc), 400)
    except Exception as exc:
        return json_error(str(exc), 500)
