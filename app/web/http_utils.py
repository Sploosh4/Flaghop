from __future__ import annotations

from starlette.responses import JSONResponse


from app.core.contract_values import as_bool, clamp_int


def json_error(message: str, status_code: int = 400):
    return JSONResponse({"status": "error", "error": str(message)}, status_code=int(status_code))
