import unittest


class WebResponseSchemaTest(unittest.TestCase):
    def test_common_response_contracts_reject_wrong_shapes(self):
        from app.contracts.actions.responses import AcceptedJobResponse, ScanHistoryResponse
        from app.web.response_schema import ProjectListResponse, ProjectOkResponse

        with self.assertRaisesRegex(TypeError, "invalid job result"):
            AcceptedJobResponse.from_job(["not", "a", "job"])
        with self.assertRaisesRegex(ValueError, "project must be an object"):
            ProjectOkResponse.from_project(["not", "a", "project"])
        with self.assertRaisesRegex(ValueError, "projects must be a list"):
            ProjectListResponse.from_projects({"name": "demo"})
        with self.assertRaisesRegex(ValueError, "scans must be a list"):
            ScanHistoryResponse.from_scans({"id": 1})

    def test_common_response_contracts_render_expected_envelopes(self):
        from app.contracts.actions.responses import AcceptedJobResponse, ScanHistoryResponse
        from app.web.response_schema import ProjectListResponse, ProjectOkResponse

        self.assertEqual(
            {"status": "accepted", "job": {"id": 7, "type": "fixture", "status": "queued"}},
            AcceptedJobResponse.from_job({"id": 7, "type": "fixture", "status": "queued"}).to_dict(),
        )
        self.assertEqual(
            {"status": "ok", "project": {"name": "demo.legion"}},
            ProjectOkResponse.from_project({"name": "demo.legion"}).to_dict(),
        )
        self.assertEqual(
            {"projects": [{"name": "demo.legion"}]},
            ProjectListResponse.from_projects([{"name": "demo.legion"}]).to_dict(),
        )
        self.assertEqual(
            {"scans": [{"id": 3}]},
            ScanHistoryResponse.from_scans([{"id": 3}]).to_dict(),
        )


if __name__ == "__main__":
    unittest.main()
