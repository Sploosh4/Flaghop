import unittest


class _GraphReportRuntime:
    def __init__(self):
        self.calls = []

    def get_evidence_graph(self, filters=None):
        self.calls.append(("get_evidence_graph", dict(filters or {})))
        return {"nodes": [], "edges": [], "meta": {"filters": dict(filters or {})}}

    def rebuild_evidence_graph(self, host_id=None):
        self.calls.append(("rebuild_evidence_graph", host_id))
        return {"host_id": host_id}


    def get_graph_related_content(self, node_id, max_chars=12000):
        self.calls.append(("get_graph_related_content", str(node_id), int(max_chars)))
        return {"items": [{"node_id": str(node_id)}]}

    def get_graph_content(self, node_id, *, download=False, max_chars=12000):
        self.calls.append(("get_graph_content", str(node_id), bool(download), int(max_chars)))
        return {
            "text": f"content for {node_id}",
            "mimetype": "text/plain; charset=utf-8",
            "download": bool(download),
            "filename": f"{node_id}.txt",
        }

    def get_evidence_graph_layouts(self):
        self.calls.append(("get_evidence_graph_layouts",))
        return [{"layout_id": "layout-1"}]

    def save_evidence_graph_layout(self, *, view_id, name, layout_state, layout_id=""):
        self.calls.append(("save_evidence_graph_layout", str(view_id), str(name), dict(layout_state), str(layout_id)))
        return {"layout_id": layout_id or "layout-1", "view_id": view_id, "name": name}

    def get_evidence_graph_annotations(self, *, target_ref="", target_kind=""):
        self.calls.append(("get_evidence_graph_annotations", str(target_ref), str(target_kind)))
        return [{"annotation_id": "annotation-1", "target_ref": target_ref, "target_kind": target_kind}]

    def save_evidence_graph_annotation(
        self,
        *,
        target_kind,
        target_ref,
        body,
        created_by="operator",
        source_ref="",
        annotation_id="",
    ):
        self.calls.append(
            (
                "save_evidence_graph_annotation",
                str(target_kind),
                str(target_ref),
                str(body),
                str(created_by),
                str(source_ref),
                str(annotation_id),
            )
        )
        return {"annotation_id": annotation_id or "annotation-1", "body": body, "target_ref": target_ref}


    def push_project_ai_report(self, overrides=None):
        self.calls.append(("push_project_ai_report", dict(overrides or {})))
        return {"ok": True, "endpoint": "https://example.local/ai"}

    def push_project_report(self, overrides=None):
        self.calls.append(("push_project_report", dict(overrides or {})))
        return {"ok": True, "endpoint": "https://example.local/report"}


class WebGraphAndReportRoutesTest(unittest.TestCase):
    def setUp(self):
        from app.web import create_app

        self.runtime = _GraphReportRuntime()
        self.client = create_app(self.runtime).test_client()

    def test_graph_routes_delegate_to_graph_service(self):
        graph = self.client.get("/api/graph?node_types=host&host_id=11&include_ai_suggested=false&limit_nodes=10")
        self.assertEqual(200, graph.status_code)
        self.assertEqual(["host"], graph.json["meta"]["filters"]["node_types"])
        self.assertEqual(11, graph.json["meta"]["filters"]["host_id"])
        self.assertFalse(graph.json["meta"]["filters"]["include_ai_suggested"])

        rebuild = self.client.post("/api/graph/rebuild", json={"host_id": 11})
        self.assertEqual(200, rebuild.status_code)
        self.assertEqual("ok", rebuild.json["status"])

        node_content = self.client.get("/api/graph/nodes/host-1/content?max_chars=42")
        self.assertEqual(200, node_content.status_code)
        self.assertEqual("host-1", node_content.json["items"][0]["node_id"])

        content = self.client.get("/api/graph/content/host-1?download=true")
        self.assertEqual(200, content.status_code)
        self.assertIn("attachment; filename=", content.headers.get("Content-Disposition", ""))

        layouts = self.client.get("/api/graph/layouts")
        self.assertEqual(200, layouts.status_code)
        self.assertEqual("layout-1", layouts.json["layouts"][0]["layout_id"])

        saved_layout = self.client.post(
            "/api/graph/layouts",
            json={"view_id": "default", "name": "ops", "layout": {"x": 10}, "layout_id": "layout-2"},
        )
        self.assertEqual(200, saved_layout.status_code)
        self.assertEqual("layout-2", saved_layout.json["layout"]["layout_id"])

        annotations = self.client.get("/api/graph/annotations?target_ref=host-1&target_kind=node")
        self.assertEqual(200, annotations.status_code)
        self.assertEqual("host-1", annotations.json["annotations"][0]["target_ref"])

        saved_annotation = self.client.post(
            "/api/graph/annotations",
            json={"target_kind": "node", "target_ref": "host-1", "body": "focus this node"},
        )
        self.assertEqual(200, saved_annotation.status_code)
        self.assertEqual("focus this node", saved_annotation.json["annotation"]["body"])

    def test_report_routes_delegate_to_report_service(self):
        push_ai = self.client.post(
            "/api/workspace/project-ai-report/push",
            json={"project_report_delivery": {"endpoint": "https://example.local/ai", "method": "POST"}},
        )
        self.assertEqual(200, push_ai.status_code)
        self.assertEqual("ok", push_ai.json["status"])

        push_report = self.client.post(
            "/api/workspace/project-report/push",
            json={"project_report_delivery": {"endpoint": "https://example.local/report", "method": "POST"}},
        )
        self.assertEqual(200, push_report.status_code)
        self.assertEqual("ok", push_report.json["status"])


if __name__ == "__main__":
    unittest.main()
