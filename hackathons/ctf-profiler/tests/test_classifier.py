import copy
import unittest

from device_classifier import classify_device


def service(port, name, product="", **extra):
    return {"port": port, "protocol": "tcp", "state": "open",
            "fingerprint": {"name": name, "product": product, **extra}}


def web(title, port=443, tool="http"):
    if tool == "whatweb":
        return {"task_id": f"whatweb-{port}", "tool": tool, "port": port,
                "execution_status": "completed", "data": [{"plugins": {"Title": {"string": [title]}}}]}
    return {"task_id": f"http-{port}", "tool": tool, "port": port,
            "execution_status": "completed", "title": title}


def profile(services=(), observations=(), os_candidates=()):
    return {"nmap": {"services": list(services), "os_candidates": list(os_candidates)},
            "observations": list(observations)}


class ClassifierTests(unittest.TestCase):
    def test_unknown_and_port_numbers_do_not_identify_device(self):
        for p in ({}, profile([service(443, "unknown"), service(445, "unknown")])):
            c, ids, ngfw = classify_device(p)
            self.assertIsNone(c["primary"])
            self.assertEqual(c["confidence"], "unknown")
            self.assertIsNone(ids["device_role"]["value"])
            self.assertEqual(ngfw, "unknown")

    def test_common_security_services_and_waf_are_not_ngfw_evidence(self):
        p = profile([service(443, "https", "nginx"), service(53, "domain"),
                     service(1194, "openvpn"), service(22, "ssh", "OpenSSH")],
                    [web("VPN gateway Firewall IPS antivirus ModSecurity Fortinet")])
        c, _, ngfw = classify_device(p)
        self.assertEqual(ngfw, "unknown")
        self.assertEqual(c["primary"]["device_type"], "general_purpose_service_host")

    def test_branding_repeats_do_not_inflate_confidence(self):
        p = profile([service(443, "unknown", "FortiGate", tunnel="ssl")],
                    [web("FortiGate"), web("FortiGate", 8443), web("FortiGate", tool="whatweb")])
        c, ids, ngfw = classify_device(p)
        self.assertEqual(c["primary"]["score"], 65)
        self.assertEqual(c["primary"]["confidence"], "medium")
        self.assertEqual(c["primary"]["evidence_channels"], ["web"])
        self.assertEqual(ids["product_family"]["value"], "FortiGate")
        self.assertEqual(ngfw, "likely")
        self.assertIsNone(ids["model"]["value"])
        self.assertIsNone(ids["firmware"]["value"])

    def test_corroborated_ngfw_and_mixed_brand_conflict(self):
        p = profile([service(22, "ssh", "FortiGate sshd"), service(443, "https")], [web("FortiGate")])
        c, _, ngfw = classify_device(p)
        self.assertEqual(c["primary"]["confidence"], "high")
        self.assertEqual(c["primary"]["device_type"], "ngfw_appliance")
        self.assertEqual(ngfw, "likely")
        p["observations"].append(web("PAN-OS", 8443))
        c, ids, ngfw = classify_device(p)
        self.assertIn("multiple_appliance_families", [x["id"] for x in c["conflicts"]])
        self.assertNotEqual(c["primary"]["confidence"], "high")
        self.assertIsNone(ids["vendor"]["value"])
        self.assertEqual(ngfw, "unknown")

    def test_service_host_os_conflict_lowers_score(self):
        p = profile([service(22, "ssh", "Paramiko Python sshd"), service(80, "http", "SimpleHTTPServer"),
                     service(445, "microsoft-ds"), service(53, "domain")], os_candidates=[
                         {"description": "Linux 5.0 - 6.2", "nmap_match_accuracy": "97", "classes": [{"osfamily": "Linux"}]}])
        before = classify_device(p)[0]["primary"]["score"]
        p["observations"].append({"task_id": "smb", "tool": "smb", "execution_status": "completed",
                                  "data": {"os_info": {"OS": "Windows 7"}, "shares": {"PUBLIC": {}}}})
        c, _, ngfw = classify_device(p)
        self.assertEqual(c["primary"]["score"], before - 15)
        self.assertEqual(c["primary"]["confidence"], "medium")
        self.assertEqual(c["os_assessment"]["confidence"], "low")
        self.assertEqual(ngfw, "unknown")

    def test_lower_os_hardware_alternative_ignored(self):
        p = profile(os_candidates=[{"description": "Linux", "classes": [{"osfamily": "Linux"}]},
                                   {"description": "Asus router or AXIS Network Camera", "classes": [{"type": "webcam"}]}])
        c, ids, _ = classify_device(p)
        self.assertIsNone(c["primary"])
        self.assertIsNone(ids["vendor"]["value"])

    def test_platforms_and_protocol_roles(self):
        for title, kind in [("pfSense", "firewall"), ("OPNsense", "firewall"),
                            ("RouterOS", "router"), ("Cisco IOS XE", "router_or_switch"),
                            ("Synology DSM", "nas"), ("QNAP QTS", "nas"),
                            ("ESPHome", "iot_device")]:
            with self.subTest(title=title):
                c, _, _ = classify_device(profile([service(443, "https"), service(445, "smb")], [web(title)]))
                self.assertEqual(c["primary"]["device_type"], kind)
        c, _, _ = classify_device(profile([service(554, "rtsp")], [web("Hikvision Network Camera")]))
        self.assertEqual(c["primary"]["device_type"], "camera_iot")
        self.assertEqual(c["primary"]["confidence"], "high")
        c, _, _ = classify_device(profile([service(631, "ipp", "HP LaserJet")]))
        self.assertEqual(c["primary"]["device_type"], "printer")

    def test_desktop_server_ambiguity_and_weak_media_signal(self):
        c, _, _ = classify_device(profile([service(3389, "ms-wbt-server"), service(445, "smb")]))
        hypotheses = [c["primary"], *c["alternatives"]]
        self.assertTrue(any(h["device_type"] == "desktop_or_server" for h in hypotheses))
        self.assertFalse(any(h["device_type"] == "desktop" for h in hypotheses))
        self.assertIsNone(classify_device(profile([service(554, "rtsp")]))[0]["primary"])

    def test_closed_failed_and_local_labels_not_evidence(self):
        p = profile([dict(service(22, "ssh", "FortiGate"), state="closed")],
                    [dict(web("FortiGate"), execution_status="failed")])
        p["label"] = "FortiGate"
        c, _, ngfw = classify_device(p)
        self.assertIsNone(c["primary"])
        self.assertEqual(ngfw, "unknown")

    def test_malformed_optional_json_and_input_immutability(self):
        p = profile(observations=[{"tool": "smb", "execution_status": "completed", "data": []},
                                  {"tool": "whatweb", "execution_status": "completed", "data": [None, {"plugins": {"Title": None}}]}])
        original = copy.deepcopy(p)
        classify_device(p)
        self.assertEqual(p, original)


if __name__ == "__main__":
    unittest.main()
