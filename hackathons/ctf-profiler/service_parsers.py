"""Normalise legacy service evidence without launching processes."""
from __future__ import annotations

import base64
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from evidence import read_bounded


class PageClues(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_title = False
        self.title = []
        self.generators = []

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag.lower() == "title":
            self.in_title = True
        if tag.lower() == "meta" and attrs.get("name", "").lower() == "generator":
            self.generators.append(attrs.get("content", ""))

    def handle_endtag(self, tag):
        if tag.lower() == "title":
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title.append(data)


def parse_http(headers, body):
    # Keep duplicate response headers, including multiple Set-Cookie values.
    blocks = re.split(r"\r?\n\r?\n", headers)
    candidates = [block for block in blocks if re.match(r"HTTP/\S+\s+\d{3}", block)]
    if not candidates:
        raise ValueError("No HTTP response header block was captured")
    lines = candidates[-1].splitlines()
    status = int(lines[0].split()[1])
    pairs = []
    for line in lines[1:]:
        if ":" in line:
            key, value = line.split(":", 1)
            pairs.append({"name": key.strip(), "value": value.strip()})
    parser = PageClues()
    parser.feed(body.decode("utf-8", errors="replace"))
    return {
        "status_code": status, "headers": pairs,
        "title": " ".join("".join(parser.title).split()) or None,
        "meta_generators": parser.generators,
        "redirect_location": next((p["value"] for p in pairs if p["name"].lower() == "location"), None),
        "redirect_followed": False,
    }


def normalise_result(result, output):
    """Keep tool data as observations; never promote a banner into a vulnerability."""
    if result["status"] in ("planned", "skipped_offline", "disabled", "tool_missing", "skipped"):
        return None
    tool = result["tool"]
    observation = {
        "task_id": result["id"], "tool": tool, "port": result.get("port"),
        "execution_status": result["status"],
    }
    try:
        if tool == "http":
            headers = read_bounded(output / "raw" / f"http-{result['port']}.headers").decode("latin-1")
            body = read_bounded(output / result["stdout"], result["stdout_limit"])
            observation.update(parse_http(headers, body))
            observation.update(
                url=result["url"], body_bytes=len(body),
                body_may_be_truncated=result["status"] != "completed",
                body_source=result["stdout"],
                headers_source=f"raw/http-{result['port']}.headers",
                tls_certificate_verified="--insecure" not in result["command"]
                if result["url"].startswith("https:") else None,
            )
        elif "json_artifact" in result:
            artifact = Path(result["json_artifact"])
            decoded = json.loads(read_bounded(artifact))
            if not isinstance(decoded, (list, dict)):
                raise ValueError("Expected a JSON object or array")
            observation.update(data=decoded, source=str(artifact.relative_to(output)))
            if tool == "smb":
                def strings(value):
                    if isinstance(value, str):
                        yield value
                    elif isinstance(value, dict):
                        for item in value.values():
                            yield from strings(item)
                    elif isinstance(value, list):
                        for item in value:
                            yield from strings(item)
                restrictions = sorted({
                    value for value in strings(decoded)
                    if re.search(r"ACCESS_DENIED|LOGON_FAILURE|access denied|authentication fail", value, re.I)
                })
                if restrictions:
                    observation["access_restrictions"] = restrictions
                    result["access_restrictions"] = restrictions
        elif tool == "ssh":
            text = read_bounded(output / result["stdout"]).decode("utf-8", errors="replace")
            keys = []
            for line in text.splitlines():
                if not line or line.startswith("#"):
                    continue
                fields = line.split()
                if len(fields) < 3:
                    continue
                try:
                    key = base64.b64decode(fields[2], validate=True)
                except ValueError:
                    continue
                fingerprint = base64.b64encode(hashlib.sha256(key).digest()).decode().rstrip("=")
                keys.append({
                    "reported_endpoint": fields[0], "algorithm": fields[1],
                    "public_key": fields[2], "sha256": "SHA256:" + fingerprint,
                })
            observation.update(keys=keys, authenticity_verified=False)
            if not keys:
                raise ValueError("No SSH host keys were captured")
        elif tool == "dns":
            text = read_bounded(output / result["stdout"]).decode("utf-8", errors="replace")
            observation.update(
                ptr_records=[line.strip() for line in text.splitlines() if line.strip()],
                source=result["stdout"],
            )
        else:
            return None
        result["parse_status"] = "completed"
        return observation
    except (OSError, ValueError) as error:
        result["parse_status"] = "failed"
        result["parse_error"] = str(error)
        return None
