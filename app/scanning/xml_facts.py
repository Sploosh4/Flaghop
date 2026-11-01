"""Read discovery facts from already bounded/validated evidence, without tool work."""


def discovery_facts(tree):
    host = tree.find("host")
    finished = tree.find("runstats/finished")
    services = []
    for port in host.findall("ports/port"):
        state, service = port.find("state"), port.find("service")
        services.append(
            {
                "port": int(port.get("portid", "0")),
                "protocol": port.get("protocol"),
                "state": state.get("state") if state is not None else "unknown",
                "state_reason": state.get("reason") if state is not None else None,
                "fingerprint": dict(service.attrib) if service is not None else {},
                "cpes": [item.text for item in port.findall("service/cpe")],
                "scripts": [
                    {"id": item.get("id"), "output": item.get("output", "")} for item in port.findall("script")
                ],
            }
        )
    status = host.find("status")
    return {
        "nmap_version": tree.get("version"),
        "recorded_arguments": tree.get("args"),
        "started_epoch": tree.get("start"),
        "finished_epoch": finished.get("time"),
        "host_status": dict(status.attrib) if status is not None else {},
        "addresses": [dict(item.attrib) for item in host.findall("address")],
        "hostnames": [dict(item.attrib) for item in host.findall("hostnames/hostname")],
        "scan_coverage": [dict(item.attrib) for item in tree.findall("scaninfo")],
        "other_port_states": [dict(item.attrib) for item in host.findall("ports/extraports")],
        "services": services,
        "os_candidates": [
            {
                "description": match.get("name"),
                "nmap_match_accuracy": match.get("accuracy"),
                "classes": [
                    {**item.attrib, "cpes": [c.text for c in item.findall("cpe")]} for item in match.findall("osclass")
                ],
            }
            for match in host.findall("os/osmatch")
        ],
        "host_scripts": [
            {"id": item.get("id"), "output": item.get("output", "")} for item in host.findall("hostscript/script")
        ],
    }


def verify_discovery(document, tree):
    """Require all declared discovery facts to agree; allow omitted legacy fields.

    Additional top-level extension metadata is preserved, but cannot substitute
    for services or override facts from the checksummed inventory source.
    """
    actual = discovery_facts(tree)
    provided = document["nmap"]
    services = {(row["protocol"], row["port"]): row for row in actual["services"]}
    declared = {(row["protocol"], row["port"]): row for row in provided["services"]}
    if (
        len(declared) != len(provided["services"])
        or len(services) != len(actual["services"])
        or declared.keys() != services.keys()
    ):
        raise ValueError("Profile services differ from the retained Nmap XML.")
    for key, row in declared.items():
        for field, value in row.items():
            if field == "fingerprint":
                if any(services[key][field].get(name) != fact for name, fact in value.items()):
                    raise ValueError("Profile service fingerprint differs from the retained Nmap XML.")
            elif field in services[key] and value != services[key][field]:
                raise ValueError("Profile service facts differ from the retained Nmap XML.")
    for field, value in provided.items():
        if field != "services" and field in actual and value != actual[field]:
            raise ValueError("Profile discovery metadata differs from the retained Nmap XML.")
    ports = {port for _, port in services}
    for row in document.get("observations", []):
        if row.get("port") is not None and row.get("tool") != "dns" and row["port"] not in ports:
            raise ValueError("Observation service port is absent from the retained Nmap XML.")
