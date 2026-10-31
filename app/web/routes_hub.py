"""Keep the foundation usable with the legacy comparison transport."""

from flask import Blueprint, current_app, jsonify, request, send_file, after_this_request
from pathlib import Path
import tempfile
import shutil
from pydantic import ValidationError
from app.services.project_hub_requests import CreateHubProject, HubVpn, OpenHubPath
from app.services.project_hub import ProjectHub
from app.web.http_utils import runtime_from_app

hub_bp = Blueprint("project_hub", __name__)


def _hub():
    if "project_hub" not in current_app.extensions:
        current_app.extensions["project_hub"] = ProjectHub(runtime_from_app())
    return current_app.extensions["project_hub"]


@hub_bp.errorhandler(Exception)
def hub_error(exc):
    code = (
        422
        if isinstance(exc, ValidationError)
        else (
            404
            if isinstance(exc, (KeyError, FileNotFoundError))
            else 400 if isinstance(exc, ValueError) else 409 if isinstance(exc, RuntimeError) else 500
        )
    )
    message = str(exc.args[0]) if isinstance(exc, KeyError) else str(exc)
    return jsonify({"status": "error", "error": message}), code


@hub_bp.get("/api/hub/projects")
def projects():
    return jsonify(_hub().list())


@hub_bp.post("/api/hub/projects")
def create_project():
    payload = CreateHubProject.model_validate(request.get_json(silent=True) or {})
    return jsonify(_hub().create(payload.name))


@hub_bp.post("/api/hub/projects/<identifier>/open")
def open_project(identifier):
    return jsonify(_hub().open(identifier))


@hub_bp.post("/api/hub/open-path")
def open_path():
    payload = OpenHubPath.model_validate(request.get_json(silent=True) or {})
    return jsonify(_hub().operations.open_path(payload.path))


@hub_bp.post("/api/hub/projects/<identifier>/rename")
def rename(identifier):
    payload = CreateHubProject.model_validate(request.get_json(silent=True) or {})
    return jsonify(_hub().operations.rename(identifier, payload.name))


@hub_bp.post("/api/hub/projects/<identifier>/save")
def save(identifier):
    return jsonify(_hub().operations.save(identifier))


@hub_bp.post("/api/hub/projects/<identifier>/save-as")
def save_as(identifier):
    payload = CreateHubProject.model_validate(request.get_json(silent=True) or {})
    return jsonify(_hub().operations.save_as(identifier, payload.name))


@hub_bp.get("/api/hub/projects/<identifier>/bundle")
def bundle(identifier):
    path, filename = _hub().operations.bundle(identifier)

    @after_this_request
    def cleanup(response):
        Path(path).unlink(missing_ok=True)
        return response

    return send_file(path, mimetype="application/zip", as_attachment=True, download_name=filename)


@hub_bp.post("/api/hub/restore-zip")
def restore():
    with tempfile.NamedTemporaryFile(prefix="legion-hub-restore-", suffix=".zip", delete=False) as upload:
        path = Path(upload.name)
        try:
            shutil.copyfileobj(request.stream, upload)
            upload.close()
            return jsonify(_hub().operations.restore_zip(str(path)))
        finally:
            path.unlink(missing_ok=True)


@hub_bp.get("/api/hub/settings")
def settings():
    return jsonify(_hub().settings())


@hub_bp.post("/api/hub/settings/vpn")
def default_vpn():
    payload = HubVpn.model_validate(request.get_json(silent=True) or {})
    return jsonify(_hub().set_vpn(None, payload.selection))


@hub_bp.post("/api/hub/projects/<identifier>/vpn")
def project_vpn(identifier):
    payload = HubVpn.model_validate(request.get_json(silent=True) or {})
    return jsonify(_hub().set_vpn(identifier, payload.selection))


@hub_bp.get("/api/hub/projects/<identifier>/files")
def files(identifier):
    return jsonify(_hub().files(identifier))


@hub_bp.get("/api/hub/projects/<identifier>/file")
def file(identifier):
    path = _hub().file_path(identifier, request.args.get("path", ""))
    response = send_file(path, mimetype="application/octet-stream", as_attachment=True, download_name=path.name)
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response
