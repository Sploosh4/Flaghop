import os
import tempfile
import unittest
import json


class ObservationParsersTest(unittest.TestCase):

    def test_extract_tool_observations_parses_nmap_vuln_and_http_vuln_blocks(self):
        from app.scheduler.observation_parsers import extract_tool_observations

        output = (
            "Starting Nmap 7.80 ( https://nmap.org ) at 2026-03-20 15:44 CDT\n"
            "| http-vuln-cve2011-3192:\n"
            "|   VULNERABLE:\n"
            "|   Apache HTTP Server byterange filter DoS\n"
            "|     State: LIKELY VULNERABLE\n"
            "|     IDs: CVE:CVE-2011-3192\n"
            "|_    Risk factor: Medium\n"
            "Nmap done: 1 IP address (1 host up) scanned in 4.72 seconds\n"
        )

        parsed = extract_tool_observations("nmap-vuln.nse", output)

        technologies = {str(item.get("name", "")).strip() for item in parsed["technologies"]}
        findings = list(parsed["findings"])
        cves = {str(item.get("cve", "")).strip().upper() for item in findings}
        evidence_rows = {str(item.get("evidence", "")).strip() for item in findings}

        self.assertIn("Apache HTTP Server", technologies)
        self.assertIn("CVE-2011-3192", cves)
        self.assertTrue(any("IDs: CVE:CVE-2011-3192" in row for row in evidence_rows))
        self.assertFalse(any("Starting Nmap" in row for row in evidence_rows))

    def test_extract_tool_observations_ignores_negative_nmap_vuln_runs(self):
        from app.scheduler.observation_parsers import extract_tool_observations

        output = (
            "# Nmap 7.80 scan initiated Sat Mar 21 13:33:46 2026 as: nmap -Pn -sV -p 80 --script=vuln,vulners\n"
            "Nmap scan report for unifi.local (192.168.3.1)\n"
            "PORT   STATE SERVICE VERSION\n"
            "80/tcp open  http    nginx\n"
            "|_http-csrf: Couldn't find any CSRF vulnerabilities.\n"
            "|_http-wordpress-users: [Error] Wordpress installation was not found. We couldn't find wp-login.php\n"
            "# Nmap done at Sat Mar 21 13:35:21 2026 -- 1 IP address (1 host up) scanned in 94.97 seconds\n"
        )

        parsed = extract_tool_observations("nmap-vuln.nse", output)

        self.assertEqual([], parsed["findings"])
        self.assertEqual([], parsed["technologies"])
        self.assertEqual([], parsed["urls"])

    def test_extract_tool_observations_parses_positive_nmap_vuln_suite_blocks(self):
        from app.scheduler.observation_parsers import extract_tool_observations

        output = (
            "# Nmap 7.80 scan initiated Sat Mar 21 13:57:41 2026 as: nmap -Pn -sV -p 443 --script=vuln,vulners\n"
            "Nmap scan report for ruckuspki-devicesubca-1 (192.168.3.100)\n"
            "PORT    STATE SERVICE VERSION\n"
            "443/tcp open  ssl/https\n"
            "| http-csrf: \n"
            "| Spidering limited to: maxdepth=3; maxpagecount=20; withinhost=ruckuspki-devicesubca-1\n"
            "|   Found the following possible CSRF vulnerabilities: \n"
            "|     \n"
            "|     Path: https://ruckuspki-devicesubca-1:443/admin/login.jsp\n"
            "|     Form id: login\n"
            "|_    Form action: login.jsp\n"
            "| http-slowloris-check: \n"
            "|   VULNERABLE:\n"
            "|   Slowloris DOS attack\n"
            "|     State: LIKELY VULNERABLE\n"
            "|     IDs:  CVE:CVE-2007-6750\n"
            "|     References:\n"
            "|       https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2007-6750\n"
            "|_      http://ha.ckers.org/slowloris/\n"
        )

        parsed = extract_tool_observations("nmap-vuln.nse", output)

        findings = {str(item.get("title", "")).strip() for item in parsed["findings"]}
        cves = {str(item.get("cve", "")).strip().upper() for item in parsed["findings"]}
        urls = {str(item.get("url", "")).strip() for item in parsed["urls"]}

        self.assertIn("Possible CSRF vulnerabilities detected", findings)
        self.assertIn("Slowloris DOS attack", findings)
        self.assertIn("CVE-2007-6750", cves)
        self.assertIn("https://ruckuspki-devicesubca-1/admin/login.jsp", urls)

    def test_extract_tool_observations_parses_rpcclient_domain_users_and_shares(self):
        from app.scheduler.observation_parsers import extract_tool_observations

        output = (
            "Domain Name: CONTOSO\n"
            "user:[Administrator] rid:[0x1f4]\n"
            "user:[HelpDesk] rid:[0x453]\n"
            "netname: IPC$\n"
            "netname: NETLOGON\n"
        )
        parsed = extract_tool_observations(
            "rpcclient-enum",
            output,
            port="445",
            protocol="tcp",
            service="smb",
            host_ip="10.0.0.5",
        )

        technologies = {str(item.get("name", "")).strip() for item in parsed["technologies"]}
        finding_titles = {str(item.get("title", "")).strip() for item in parsed["findings"]}
        self.assertIn("Active Directory", technologies)
        self.assertIn("SMB domain identified: CONTOSO", finding_titles)
        self.assertIn("SMB users enumerated (2)", finding_titles)
        self.assertIn("SMB shares enumerated (2)", finding_titles)

    def test_extract_tool_observations_parses_enum4linux_share_tables(self):
        from app.scheduler.observation_parsers import extract_tool_observations

        output = (
            "Domain Name: CONTOSO\n"
            "user:[Administrator] rid:[0x1f4]\n"
            "user:[HelpDesk] rid:[0x453]\n"
            "\n"
            "Sharename       Type      Comment\n"
            "---------       ----      -------\n"
            "ADMIN$          Disk      Remote Admin\n"
            "IPC$            IPC       Remote IPC\n"
        )

        parsed = extract_tool_observations(
            "enum4linux",
            output,
            port="445",
            protocol="tcp",
            service="smb",
            host_ip="10.0.0.5",
        )

        finding_titles = {str(item.get("title", "")).strip() for item in parsed["findings"]}
        self.assertIn("SMB domain identified: CONTOSO", finding_titles)
        self.assertIn("SMB users enumerated (2)", finding_titles)
        self.assertIn("SMB shares enumerated (2)", finding_titles)

    def test_extract_tool_observations_parses_samrdump_found_users(self):
        from app.scheduler.observation_parsers import extract_tool_observations

        output = (
            "Found domain name: CONTOSO\n" "Found user: Administrator, uid = 500\n" "Found user: HelpDesk, uid = 1107\n"
        )

        parsed = extract_tool_observations(
            "samrdump",
            output,
            port="445",
            protocol="tcp",
            service="smb",
            host_ip="10.0.0.5",
        )

        technologies = {str(item.get("name", "")).strip() for item in parsed["technologies"]}
        finding_titles = {str(item.get("title", "")).strip() for item in parsed["findings"]}
        self.assertIn("Active Directory", technologies)
        self.assertIn("SMB domain identified: CONTOSO", finding_titles)
        self.assertIn("SMB users enumerated (2)", finding_titles)

    def test_extract_tool_observations_parses_netexec_smb_enumeration(self):
        from app.scheduler.observation_parsers import extract_tool_observations

        output = (
            "SMB 192.168.3.10 445 DC01 [*] Windows 10 / Server 2019 Build 17763 x64 (name:DC01) (domain:CONTOSO) (signing:False) (SMBv1:True)\n"
            "SMB 192.168.3.10 445 DC01 [+] \\\\ : \n"
            "SMB 192.168.3.10 445 DC01 [*] Enumerated shares\n"
            "SMB 192.168.3.10 445 DC01 Share           Permissions     Remark\n"
            "SMB 192.168.3.10 445 DC01 ADMIN$                          Remote Admin\n"
            "SMB 192.168.3.10 445 DC01 IPC$            READ            Remote IPC\n"
            "SMB 192.168.3.10 445 DC01 [*] Enumerated domain user(s)\n"
            "SMB 192.168.3.10 445 DC01 CONTOSO\\Administrator rid:500\n"
            "SMB 192.168.3.10 445 DC01 CONTOSO\\HelpDesk rid:1107\n"
            "SMB 192.168.3.10 445 DC01 [*] Password policy\n"
            "SMB 192.168.3.10 445 DC01 min password length: 7\n"
        )

        parsed = extract_tool_observations(
            "netexec",
            output,
            port="445",
            protocol="tcp",
            service="smb",
            host_ip="192.168.3.10",
        )

        technologies = {str(item.get("name", "")).strip() for item in parsed["technologies"]}
        finding_titles = {str(item.get("title", "")).strip() for item in parsed["findings"]}

        self.assertIn("Windows", technologies)
        self.assertIn("Active Directory", technologies)
        self.assertIn("SMB domain identified: CONTOSO", finding_titles)
        self.assertIn("SMB shares enumerated (2)", finding_titles)
        self.assertIn("SMB users enumerated (2)", finding_titles)
        self.assertIn("SMB password policy disclosed", finding_titles)
        self.assertIn("Anonymous SMB access allowed", finding_titles)
        self.assertIn("SMB signing disabled", finding_titles)
        self.assertIn("SMBv1 enabled", finding_titles)

    def test_extract_tool_observations_parses_nbtscan_verbose_output(self):
        from app.scheduler.observation_parsers import extract_tool_observations

        output = (
            "NetBIOS Name Table for Host 192.168.1.123:\n"
            "\n"
            "Name             Service          Type\n"
            "----------------------------------------\n"
            "DPTSERVER        <00>             UNIQUE\n"
            "DPTSERVER        <20>             UNIQUE\n"
            "DEPARTMENT       <00>             GROUP\n"
            "ADMINISTRATOR    <03>             UNIQUE\n"
            "\n"
            "Adapter address: 00-a0-c9-12-34-56\n"
        )

        parsed = extract_tool_observations("nbtscan", output)

        findings = {str(item.get("title", "")).strip(): item for item in parsed["findings"]}
        self.assertIn("NetBIOS hosts enumerated (1)", findings)
        self.assertIn("NetBIOS workgroups/domains enumerated (1)", findings)
        self.assertIn("NetBIOS users enumerated (1)", findings)
        self.assertIn("NetBIOS file servers advertised (1)", findings)
        self.assertIn("DPTSERVER", findings["NetBIOS hosts enumerated (1)"]["evidence_items"])
        self.assertIn("DEPARTMENT", findings["NetBIOS workgroups/domains enumerated (1)"]["evidence_items"])
        self.assertIn("ADMINISTRATOR", findings["NetBIOS users enumerated (1)"]["evidence_items"])
        self.assertIn("192.168.1.123", findings["NetBIOS file servers advertised (1)"]["evidence_items"])

    def test_extract_tool_observations_parses_nbtscan_summary_and_script_friendly_output(self):
        from app.scheduler.observation_parsers import extract_tool_observations

        summary_output = (
            "IP address     NetBIOS Name  Server    User           MAC address\n"
            "-----------------------------------------------------------------------\n"
            "192.168.1.2    MYCOMPUTER              JDOE           00-a0-c9-12-34-56\n"
            "192.168.1.5    WIN98COMP     <server>  RROE           00-a0-c9-78-90-00\n"
        )
        script_output = (
            "192.168.0.1:NT_SERVER:00U\n"
            "192.168.0.1:MY_DOMAIN:00G\n"
            "192.168.0.1:ADMINISTRATOR:03U\n"
            "192.168.0.1:NT_SERVER:20U\n"
        )

        summary_parsed = extract_tool_observations("nbtscan", summary_output)
        script_parsed = extract_tool_observations("nbtscan", script_output)

        summary_titles = {str(item.get("title", "")).strip() for item in summary_parsed["findings"]}
        script_titles = {str(item.get("title", "")).strip() for item in script_parsed["findings"]}

        self.assertIn("NetBIOS hosts enumerated (2)", summary_titles)
        self.assertIn("NetBIOS users enumerated (2)", summary_titles)
        self.assertIn("NetBIOS file servers advertised (1)", summary_titles)
        self.assertIn("NetBIOS hosts enumerated (1)", script_titles)
        self.assertIn("NetBIOS workgroups/domains enumerated (1)", script_titles)
        self.assertIn("NetBIOS users enumerated (1)", script_titles)
        self.assertIn("NetBIOS file servers advertised (1)", script_titles)

    def test_extract_tool_observations_parses_dnsmap_subdomains_and_internal_records(self):
        from app.scheduler.observation_parsers import extract_tool_observations

        output = (
            "dnsmap 0.36 - DNS Network Mapper\n"
            "\n"
            "[+] searching (sub)domains for example.com using /tmp/wordlist.txt\n"
            "www.example.com\n"
            "IPv6 address #1: 2606:4700::6812:1b78\n"
            "\n"
            "www.example.com\n"
            "IP address #1: 104.18.27.120\n"
            "\n"
            "intranet.example.com\n"
            "IP address #1: 10.0.0.5\n"
            "[+] warning: internal IP address disclosed\n"
            "[+] 2 (sub)domains and 3 IP address(es) found\n"
        )

        parsed = extract_tool_observations("dnsmap", output)

        findings = {str(item.get("title", "")).strip(): item for item in parsed["findings"]}

        self.assertIn("DNS subdomains discovered (2)", findings)
        self.assertIn("Internal DNS records disclosed", findings)
        self.assertIn("Internal DNS records disclosed (1)", findings)
        self.assertIn("www.example.com", findings["DNS subdomains discovered (2)"]["evidence_items"])
        self.assertIn("intranet.example.com", findings["DNS subdomains discovered (2)"]["evidence_items"])
        self.assertIn(
            "intranet.example.com -> 10.0.0.5", findings["Internal DNS records disclosed (1)"]["evidence_items"]
        )
        self.assertEqual(
            {"www.example.com", "intranet.example.com"},
            {str(item).strip() for item in parsed.get("discovered_hosts", [])},
        )

    def test_extract_tool_observations_parses_internal_database_info_scripts(self):
        from app.scheduler.observation_parsers import extract_tool_observations

        mysql_output = (
            "| mysql-info:\n"
            "|   Protocol: 10\n"
            "|   Version: 10.6.18-MariaDB-1:10.6.18+maria~ubu2204\n"
            "|_  Authentication Plugin Name: mysql_native_password\n"
        )
        pgsql_output = (
            "| pgsql-info:\n"
            "|   PostgreSQL server version: 14.11 (Ubuntu 14.11-0ubuntu0.22.04.1)\n"
            "|   SSL: supported\n"
            "|_  Auth method: scram-sha-256\n"
        )
        mssql_output = (
            "| ms-sql-info:\n"
            "|   10.0.0.5:1433:\n"
            "|     Version:\n"
            "|       Product: Microsoft SQL Server 2019\n"
            "|       number: 15.0.2000.5\n"
            "|     Clustered: true\n"
            "|_    Named pipe: \\\\sql\\\\query\n"
        )

        mysql_parsed = extract_tool_observations(
            "mysql-info.nse", mysql_output, port="3306", protocol="tcp", service="mysql"
        )
        pgsql_parsed = extract_tool_observations(
            "pgsql-info.nse", pgsql_output, port="5432", protocol="tcp", service="postgresql"
        )
        mssql_parsed = extract_tool_observations(
            "ms-sql-info.nse", mssql_output, port="1433", protocol="tcp", service="ms-sql-s"
        )

        mysql_tech = {str(item.get("name", "")).strip() for item in mysql_parsed["technologies"]}
        mysql_findings = {str(item.get("title", "")).strip() for item in mysql_parsed["findings"]}
        pgsql_tech = {str(item.get("name", "")).strip() for item in pgsql_parsed["technologies"]}
        pgsql_findings = {str(item.get("title", "")).strip() for item in pgsql_parsed["findings"]}
        mssql_tech = {str(item.get("name", "")).strip() for item in mssql_parsed["technologies"]}
        mssql_findings = {str(item.get("title", "")).strip() for item in mssql_parsed["findings"]}

        self.assertIn("MariaDB", mysql_tech)
        self.assertIn("MySQL authentication plugin exposed: mysql_native_password", mysql_findings)
        self.assertIn("PostgreSQL", pgsql_tech)
        self.assertIn("PostgreSQL SSL supported", pgsql_findings)
        self.assertIn("Microsoft SQL Server", mssql_tech)
        self.assertIn("Microsoft SQL Server clustered deployment", mssql_findings)


if __name__ == "__main__":
    unittest.main()
