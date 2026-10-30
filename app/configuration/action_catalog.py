"""LEGION (https://shanewilliamscott.com)
Copyright (c) 2025 Shane William Scott

    This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public
    License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later
    version.

    This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied
    warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more
    details.

    You should have received a copy of the GNU General Public License along with this program.
    If not, see <http://www.gnu.org/licenses/>.
"""

from __future__ import annotations

from app.logging.legionLog import getAppLogger

log = getAppLogger()


class ActionCatalog:
    WEB_SERVICE_SCOPE = "http,https,ssl,soap,http-proxy,http-alt,https-alt"

    HOST_SERVICE_SCOPE = "host"

    REMOTE_SCREEN_SERVICE_SCOPE = "ms-wbt-server,rdp,vmrdp,vnc,vnc-http,rfb"

    SCREENSHOT_SERVICE_SCOPE = f"{WEB_SERVICE_SCOPE},{REMOTE_SCREEN_SERVICE_SCOPE}"

    BANNER_COMMAND = (
        "LEGION_BANNER_TARGET=[IP] LEGION_BANNER_PORT=[PORT] " "LEGION_BANNER_PROTOCOL=tcp python3 -m app.banner_probe"
    )

    ALLOWED_NONZERO_EXIT_CODES = {
        "nikto": {1},
        "wpscan": {4},
    }

    DISABLED_PORT_ACTION_IDS = {
        "http-drupal-modules.nse",
        "http-wapiti",
        "http-vuln-zimbra-lfi.nse",
        "http-wordpress-plugins.nse",
        "https-wapiti",
        "sslyze",
    }

    WEB_CONTENT_GOBUSTER_COMMAND = (
        "(command -v gobuster >/dev/null 2>&1 && "
        "((gobuster -m dir -k -q -u https://[IP]:[PORT]/ -w /usr/share/wordlists/dirb/common.txt -o [OUTPUT].txt || "
        "gobuster -m dir -q -u http://[IP]:[PORT]/ -w /usr/share/wordlists/dirb/common.txt -o [OUTPUT].txt) || "
        "(gobuster dir -k -q -u https://[IP]:[PORT]/ -w /usr/share/wordlists/dirb/common.txt -o [OUTPUT].txt || "
        "gobuster dir -q -u http://[IP]:[PORT]/ -w /usr/share/wordlists/dirb/common.txt -o [OUTPUT].txt)))"
    )

    LEGACY_WEB_CONTENT_DISCOVERY_COMMAND = (
        "(command -v feroxbuster >/dev/null 2>&1 && "
        "(feroxbuster -u https://[IP]:[PORT] -k --silent -o [OUTPUT].txt || "
        "feroxbuster -u http://[IP]:[PORT] --silent -o [OUTPUT].txt)) || "
        "(command -v gobuster >/dev/null 2>&1 && "
        "gobuster dir -u http://[IP]:[PORT]/ -w /usr/share/wordlists/dirb/common.txt -o [OUTPUT].txt) || "
        "echo feroxbuster/gobuster not found"
    )

    WEB_CONTENT_DISCOVERY_COMMAND = (
        "(command -v feroxbuster >/dev/null 2>&1 && "
        "(feroxbuster -u https://[IP]:[PORT] -k --silent -o [OUTPUT].txt || "
        "feroxbuster -u http://[IP]:[PORT] --silent -o [OUTPUT].txt)) || "
        f"{WEB_CONTENT_GOBUSTER_COMMAND} || "
        "echo feroxbuster/gobuster not found"
    )

    NMAP_VULN_COMMAND = (
        "(nmap -Pn -n -sV -p [PORT] --script=vuln,vulners --stats-every 15s [IP] -oA [OUTPUT] || "
        "nmap -Pn -n -sV -p [PORT] --script=vuln --stats-every 15s [IP] -oA [OUTPUT])"
    )

    NUCLEI_WEB_COMMAND = (
        "(command -v nuclei >/dev/null 2>&1 && "
        "(nuclei -as -stats -si 15 -u https://[IP]:[PORT] -ni -o [OUTPUT].txt || "
        "nuclei -as -stats -si 15 -u http://[IP]:[PORT] -ni -o [OUTPUT].txt)) || "
        "echo nuclei not found"
    )

    NUCLEI_CVES_COMMAND = (
        "(command -v nuclei >/dev/null 2>&1 && "
        "(nuclei -tags cve -stats -si 15 -u https://[IP]:[PORT] -ni -o [OUTPUT].txt || "
        "nuclei -tags cve -stats -si 15 -u http://[IP]:[PORT] -ni -o [OUTPUT].txt)) || "
        "echo nuclei not found"
    )

    NUCLEI_EXPOSURES_COMMAND = (
        "(command -v nuclei >/dev/null 2>&1 && "
        "(nuclei -tags exposure,panel -stats -si 15 -u https://[IP]:[PORT] -ni -o [OUTPUT].txt || "
        "nuclei -tags exposure,panel -stats -si 15 -u http://[IP]:[PORT] -ni -o [OUTPUT].txt)) || "
        "echo nuclei not found"
    )

    NUCLEI_WORDPRESS_COMMAND = (
        "(command -v nuclei >/dev/null 2>&1 && "
        "(nuclei -tags wordpress,wp-plugin -stats -si 15 -u https://[IP]:[PORT] -ni -o [OUTPUT].txt || "
        "nuclei -tags wordpress,wp-plugin -stats -si 15 -u http://[IP]:[PORT] -ni -o [OUTPUT].txt)) || "
        "echo nuclei not found"
    )

    NUCLEI_CLOUD_COMMAND = (
        "(command -v nuclei >/dev/null 2>&1 && "
        "nuclei -tags cloud,aws,azure,gcp -stats -si 15 -u [WEB_URL] -ni -o [OUTPUT].txt) || "
        "echo nuclei not found"
    )

    NUCLEI_AWS_STORAGE_COMMAND = (
        "(command -v nuclei >/dev/null 2>&1 && "
        "nuclei -tags aws,s3,bucket,storage -stats -si 15 -u [WEB_URL] -ni -o [OUTPUT].txt) || "
        "echo nuclei not found"
    )

    NUCLEI_AZURE_STORAGE_COMMAND = (
        "(command -v nuclei >/dev/null 2>&1 && "
        "nuclei -tags azure,blob,storage -stats -si 15 -u [WEB_URL] -ni -o [OUTPUT].txt) || "
        "echo nuclei not found"
    )

    NUCLEI_GCP_STORAGE_COMMAND = (
        "(command -v nuclei >/dev/null 2>&1 && "
        "nuclei -tags gcp,gcs,bucket,storage -stats -si 15 -u [WEB_URL] -ni -o [OUTPUT].txt) || "
        "echo nuclei not found"
    )

    NUCLEI_AWS_RDS_COMMAND = (
        "(command -v nuclei >/dev/null 2>&1 && "
        "nuclei -tags aws,rds,database -stats -si 15 -target [IP]:[PORT] -ni -o [OUTPUT].txt) || "
        "echo nuclei not found"
    )

    NUCLEI_AWS_AURORA_COMMAND = (
        "(command -v nuclei >/dev/null 2>&1 && "
        "nuclei -tags aws,aurora,database -stats -si 15 -target [IP]:[PORT] -ni -o [OUTPUT].txt) || "
        "echo nuclei not found"
    )

    NUCLEI_AZURE_COSMOS_COMMAND = (
        "(command -v nuclei >/dev/null 2>&1 && "
        "nuclei -tags azure,cosmos,cosmosdb,database -stats -si 15 -u [WEB_URL] -ni -o [OUTPUT].txt) || "
        "echo nuclei not found"
    )

    NUCLEI_GCP_CLOUDSQL_COMMAND = (
        "(command -v nuclei >/dev/null 2>&1 && "
        "nuclei -tags gcp,cloudsql,database -stats -si 15 -target [IP]:[PORT] -ni -o [OUTPUT].txt) || "
        "echo nuclei not found"
    )

    MYSQL_INFO_COMMAND = (
        "nmap -Pn [IP] -p [PORT] --script=mysql-info.nse --script-args=unsafe=1 " "--stats-every 15s -vv -oA [OUTPUT]"
    )

    PGSQL_INFO_COMMAND = (
        "nmap -Pn [IP] -p [PORT] --script=pgsql-info.nse --script-args=unsafe=1 " "--stats-every 15s -vv -oA [OUTPUT]"
    )

    MSSQL_INFO_COMMAND = (
        "nmap -Pn [IP] -p [PORT] --script=ms-sql-info.nse --script-args=unsafe=1 " "--stats-every 15s -vv -oA [OUTPUT]"
    )

    CURL_HEADERS_COMMAND = (
        "(command -v curl >/dev/null 2>&1 && "
        "(curl -k -I --max-time 20 https://[IP]:[PORT] > [OUTPUT].txt || "
        "curl -I --max-time 20 http://[IP]:[PORT] > [OUTPUT].txt)) || "
        "echo curl not found"
    )

    CURL_OPTIONS_COMMAND = (
        "(command -v curl >/dev/null 2>&1 && "
        "(curl -k -X OPTIONS -i --max-time 20 https://[IP]:[PORT] > [OUTPUT].txt || "
        "curl -X OPTIONS -i --max-time 20 http://[IP]:[PORT] > [OUTPUT].txt)) || "
        "echo curl not found"
    )

    CURL_ROBOTS_COMMAND = (
        "(command -v curl >/dev/null 2>&1 && "
        "(curl -k --max-time 20 https://[IP]:[PORT]/robots.txt -o [OUTPUT].txt || "
        "curl --max-time 20 http://[IP]:[PORT]/robots.txt -o [OUTPUT].txt)) || "
        "echo curl not found"
    )

    HTTPX_COMMAND = (
        "(command -v httpx >/dev/null 2>&1 && "
        "httpx -silent -json -title -tech-detect -web-server -status-code -content-type "
        "-u [WEB_URL] -o [OUTPUT].jsonl) || "
        "echo httpx not found"
    )

    SUBFINDER_COMMAND = (
        "(command -v subfinder >/dev/null 2>&1 && "
        "subfinder -silent -recursive -duc -max-time 5 -oJ -d [IP] -o [OUTPUT].jsonl) || "
        "echo subfinder not found"
    )

    CHAOS_COMMAND = (
        "(test -n [CHAOS_API_KEY] && command -v chaos >/dev/null 2>&1 && "
        "chaos -d [ROOT_DOMAIN] -silent -json -key [CHAOS_API_KEY] -o [OUTPUT].jsonl) || "
        "echo chaos not configured"
    )

    GRAYHATWARFARE_COMMAND = (
        "(if test -n [GRAYHAT_API_KEY]; then "
        "python3 -m app.grayhatwarfare_probe --domain [ROOT_DOMAIN] --api-key [GRAYHAT_API_KEY] --output [OUTPUT].json; "
        "else echo grayhatwarfare not configured; fi)"
    )

    SHODAN_ENRICHMENT_COMMAND = (
        "(if test -n [SHODAN_API_KEY]; then "
        "python3 -m app.shodan_probe --target [IP] --api-key [SHODAN_API_KEY] --output [OUTPUT].json; "
        "else echo shodan not configured; fi)"
    )

    NIKTO_COMMAND = (
        "(command -v nikto >/dev/null 2>&1 && "
        "nikto -h [WEB_URL] -nointeractive -Format txt -output [OUTPUT].txt -C all) || "
        "echo nikto not found"
    )

    WAFW00F_COMMAND = (
        "(command -v wafw00f >/dev/null 2>&1 && "
        "(wafw00f https://[IP]:[PORT] || wafw00f http://[IP]:[PORT])) || "
        "echo wafw00f not found"
    )

    SSLSCAN_COMMAND = "sslscan --no-failed [IP]:[PORT]"

    TESTSSL_SH_COMMAND = (
        "((command -v testssl.sh >/dev/null 2>&1 && "
        "testssl.sh --quiet --warnings off --connect-timeout 10 --openssl-timeout 10 "
        "--jsonfile-pretty [OUTPUT].json [IP]:[PORT] > [OUTPUT].txt 2>&1) || "
        "(command -v testssl >/dev/null 2>&1 && "
        "testssl --quiet --warnings off --connect-timeout 10 --openssl-timeout 10 "
        "--jsonfile-pretty [OUTPUT].json [IP]:[PORT] > [OUTPUT].txt 2>&1)) || "
        "echo testssl.sh not found"
    )

    WPSCAN_COMMAND = (
        "(command -v wpscan >/dev/null 2>&1 && "
        "wpscan --url [WEB_URL] --disable-tls-checks --no-update --format json --output [OUTPUT].json) || "
        "echo wpscan not found"
    )

    WAPITI_HTTP_COMMAND = (
        "(command -v wapiti >/dev/null 2>&1 && "
        "wapiti -u http://[IP]:[PORT] -n 10 -b folder -v 1 -f txt -o [OUTPUT]) || "
        "echo wapiti not found"
    )

    WAPITI_HTTPS_COMMAND = (
        "(command -v wapiti >/dev/null 2>&1 && "
        "wapiti -u https://[IP]:[PORT] -n 10 -b folder -v 1 -f txt -o [OUTPUT]) || "
        "echo wapiti not found"
    )

    SAMRDUMP_COMMAND = (
        "(command -v impacket-samrdump >/dev/null 2>&1 && "
        "impacket-samrdump -no-pass -port [PORT] [IP] > [OUTPUT].txt 2>&1) || "
        "([ -f /usr/share/doc/python3-impacket/examples/samrdump.py ] && "
        "python3 /usr/share/doc/python3-impacket/examples/samrdump.py -no-pass -port [PORT] [IP] > [OUTPUT].txt 2>&1) || "
        "([ -f /usr/share/doc/python-impacket-doc/examples/samrdump.py ] && "
        "python3 /usr/share/doc/python-impacket-doc/examples/samrdump.py -no-pass -port [PORT] [IP] > [OUTPUT].txt 2>&1) || "
        "echo samrdump not found"
    )

    WHATWEB_COMMAND = (
        "(command -v whatweb >/dev/null 2>&1 && "
        "whatweb [WEB_URL] --color=never --log-brief=[OUTPUT].txt) || "
        "echo whatweb not found"
    )

    DIRSEARCH_COMMAND = (
        "(command -v dirsearch >/dev/null 2>&1 && "
        "dirsearch -u [WEB_URL]/ --quiet-mode --format=json --output=[OUTPUT].json) || "
        "echo dirsearch not found"
    )

    FFUF_COMMAND = (
        "(command -v ffuf >/dev/null 2>&1 && "
        "ffuf -u [WEB_URL]/FUZZ -w /usr/share/wordlists/dirb/common.txt "
        "-s -of json -o [OUTPUT].json) || "
        "echo ffuf not found"
    )

    KATANA_COMMAND = (
        "(command -v katana >/dev/null 2>&1 && "
        "katana -u [WEB_URL] -silent -jsonl -d 2 -jc -kf robotstxt,sitemapxml -c 5 -p 1 -rl 5 -o [OUTPUT].jsonl) || "
        "echo katana not found"
    )

    ENUM4LINUX_NG_COMMAND = (
        "if command -v enum4linux-ng >/dev/null 2>&1; then "
        "enum4linux-ng -A -oJ [OUTPUT] [IP]; "
        "else echo enum4linux-ng not found; fi"
    )

    SMBMAP_COMMAND = (
        "if command -v smbmap >/dev/null 2>&1; then "
        "smbmap -H [IP] -P [PORT] --no-write-check -q | tee [OUTPUT].txt; "
        "else echo smbmap not found; fi"
    )

    RPCCLIENT_ENUM_COMMAND = (
        "if command -v rpcclient >/dev/null 2>&1; then "
        "rpcclient [IP] -p [PORT] -U '%' -c 'srvinfo;enumdomusers;netshareenumall' > [OUTPUT].txt; "
        "else echo rpcclient not found; fi"
    )

    RESPONDER_COMMAND = "responder -I <interface> -w -F"

    NTLMRELAYX_COMMAND = "impacket-ntlmrelayx -t smb://[IP] -smb2support"

    NETEXEC_COMMAND = (
        "if command -v netexec >/dev/null 2>&1; then "
        "netexec smb [IP] --port [PORT] -u '' -p '' --shares --users --pass-pol 2>&1 | tee [OUTPUT].txt; "
        "elif command -v nxc >/dev/null 2>&1; then "
        "nxc smb [IP] --port [PORT] -u '' -p '' --shares --users --pass-pol 2>&1 | tee [OUTPUT].txt; "
        "else echo netexec not found; fi"
    )

    BASELINE_WEB_PORT_ACTIONS = {
        "httpx": ("Run httpx", HTTPX_COMMAND, WEB_SERVICE_SCOPE),
        "whatweb": ("Run whatweb", WHATWEB_COMMAND, WEB_SERVICE_SCOPE),
        "whatweb-http": ("Run whatweb (http)", WHATWEB_COMMAND, "http,soap,http-proxy,http-alt"),
        "whatweb-https": ("Run whatweb (https)", WHATWEB_COMMAND, "https,ssl,https-alt"),
        "nikto": ("Run nikto", NIKTO_COMMAND, WEB_SERVICE_SCOPE),
        "wafw00f": ("Run wafw00f", WAFW00F_COMMAND, "https,ssl,https-alt"),
        "sslscan": ("Run sslscan", SSLSCAN_COMMAND, "https,ssl,https-alt"),
        "testssl.sh": ("Run testssl.sh", TESTSSL_SH_COMMAND, "https,ssl,ms-wbt-server,imap,pop3,smtp,https-alt"),
        "nuclei-cves": ("Run nuclei CVE follow-up", NUCLEI_CVES_COMMAND, WEB_SERVICE_SCOPE),
        "nuclei-exposures": ("Run nuclei exposure/panel follow-up", NUCLEI_EXPOSURES_COMMAND, WEB_SERVICE_SCOPE),
        "nuclei-wordpress": ("Run nuclei WordPress follow-up", NUCLEI_WORDPRESS_COMMAND, WEB_SERVICE_SCOPE),
        "curl-headers": ("Collect HTTP headers (curl)", CURL_HEADERS_COMMAND, WEB_SERVICE_SCOPE),
        "curl-options": ("Collect HTTP OPTIONS response (curl)", CURL_OPTIONS_COMMAND, WEB_SERVICE_SCOPE),
        "curl-robots": ("Fetch robots.txt (curl)", CURL_ROBOTS_COMMAND, WEB_SERVICE_SCOPE),
        "wpscan": ("Run wpscan", WPSCAN_COMMAND, "http,https,ssl,https-alt"),
        "dirsearch": ("Run dirsearch", DIRSEARCH_COMMAND, WEB_SERVICE_SCOPE),
        "ffuf": ("Run ffuf", FFUF_COMMAND, WEB_SERVICE_SCOPE),
        "katana": ("Run katana", KATANA_COMMAND, WEB_SERVICE_SCOPE),
    }

    EXTERNAL_RECON_PORT_ACTIONS = {
        "subfinder": ("Run subfinder passive subdomain discovery", SUBFINDER_COMMAND, HOST_SERVICE_SCOPE),
        "chaos": ("Run Chaos passive subdomain discovery", CHAOS_COMMAND, HOST_SERVICE_SCOPE),
        "grayhatwarfare": ("Run Grayhat Warfare bucket/file search", GRAYHATWARFARE_COMMAND, HOST_SERVICE_SCOPE),
        "shodan-enrichment": ("Run Shodan hostname enrichment", SHODAN_ENRICHMENT_COMMAND, HOST_SERVICE_SCOPE),
        "nuclei-cloud": ("Run nuclei cloud exposure follow-up", NUCLEI_CLOUD_COMMAND, WEB_SERVICE_SCOPE),
        "nuclei-aws-storage": ("Run nuclei AWS storage follow-up", NUCLEI_AWS_STORAGE_COMMAND, WEB_SERVICE_SCOPE),
        "nuclei-azure-storage": ("Run nuclei Azure storage follow-up", NUCLEI_AZURE_STORAGE_COMMAND, WEB_SERVICE_SCOPE),
        "nuclei-gcp-storage": ("Run nuclei GCP storage follow-up", NUCLEI_GCP_STORAGE_COMMAND, WEB_SERVICE_SCOPE),
        "nuclei-aws-rds": (
            "Run nuclei AWS RDS follow-up",
            NUCLEI_AWS_RDS_COMMAND,
            "mysql,postgres,postgresql,ms-sql,ms-sql-s,codasrv-se",
        ),
        "nuclei-aws-aurora": (
            "Run nuclei AWS Aurora follow-up",
            NUCLEI_AWS_AURORA_COMMAND,
            "mysql,postgres,postgresql",
        ),
        "nuclei-azure-cosmos": ("Run nuclei Azure Cosmos DB follow-up", NUCLEI_AZURE_COSMOS_COMMAND, WEB_SERVICE_SCOPE),
        "nuclei-gcp-cloudsql": (
            "Run nuclei GCP Cloud SQL follow-up",
            NUCLEI_GCP_CLOUDSQL_COMMAND,
            "mysql,postgres,postgresql,ms-sql,ms-sql-s,codasrv-se",
        ),
    }

    BASELINE_INTERNAL_PORT_ACTIONS = {
        "enum4linux-ng": ("Run enum4linux-ng", ENUM4LINUX_NG_COMMAND, "netbios-ssn,microsoft-ds,smb"),
        "smbmap": ("Run smbmap", SMBMAP_COMMAND, "netbios-ssn,microsoft-ds,smb"),
        "rpcclient-enum": ("Run rpcclient SMB enumeration", RPCCLIENT_ENUM_COMMAND, "netbios-ssn,microsoft-ds,smb"),
        "netexec": ("Run netexec", NETEXEC_COMMAND, "netbios-ssn,microsoft-ds,smb"),
        "mysql-info.nse": ("Run mysql-info.nse", MYSQL_INFO_COMMAND, "mysql"),
        "pgsql-info.nse": ("Run pgsql-info.nse", PGSQL_INFO_COMMAND, "postgres,postgresql"),
        "ms-sql-info.nse": ("Run ms-sql-info.nse", MSSQL_INFO_COMMAND, "ms-sql,ms-sql-s,codasrv-se"),
        "responder": (
            "Prepare Responder capture workflow",
            RESPONDER_COMMAND,
            "netbios-ssn,microsoft-ds,smb,ldap,kerberos,winrm",
        ),
        "ntlmrelayx": (
            "Prepare ntlmrelayx relay workflow",
            NTLMRELAYX_COMMAND,
            "netbios-ssn,microsoft-ds,smb,ldap,kerberos,winrm",
        ),
    }
