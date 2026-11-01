"""Native automatic HEAD/OPTIONS, preserving the previous HTTP surface."""

import re
from fastapi import APIRouter, Request, Response
from fastapi.staticfiles import StaticFiles

METHODS = {"get", "head", "post", "put", "patch", "delete", "options", "trace"}


class ProtocolRouter(APIRouter):
    def add_api_route(self, path, endpoint, **kwargs):
        methods = {method.upper() for method in kwargs.pop("methods", None) or ["GET"]}
        super().add_api_route(path, endpoint, methods=methods, **kwargs)
        if "GET" in methods and "HEAD" not in methods:
            super().add_api_route(path, endpoint, methods=["HEAD"], **{**kwargs, "include_in_schema": False})
        if "OPTIONS" in methods or any(
            getattr(route, "path", None) == path and "OPTIONS" in getattr(route, "methods", set())
            for route in self.routes
        ):
            return

        def options(request: Request):
            # Other routers may contribute another verb to this same resource.
            # OpenAPI supplies those verbs; local metadata includes hidden ones.
            key = re.sub(r"\{(\w+):[^}]+\}", r"{\1}", path)
            allowed = {method.upper() for method in request.app.openapi()["paths"].get(key, {}) if method in METHODS}
            for route in self.routes:
                if getattr(route, "path", None) == path:
                    allowed.update(getattr(route, "methods", set()))
            if "GET" in allowed:
                allowed.add("HEAD")
            return Response(status_code=200, headers={"Allow": ", ".join(sorted(allowed))})

        super().add_api_route(path, options, methods=["OPTIONS"], include_in_schema=False, name=f"options:{path}")


class ProtocolStaticFiles(StaticFiles):
    async def get_response(self, path, scope):
        if scope["method"] == "OPTIONS":
            return Response(status_code=200, headers={"Allow": "GET, HEAD, OPTIONS"})
        return await super().get_response(path, scope)
