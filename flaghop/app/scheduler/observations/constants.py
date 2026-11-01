"""Tool observation parsing: constants."""

from __future__ import annotations

import re

_URL_RE = re.compile(r"https?://[^\s<>()\"']+", flags=re.IGNORECASE)

_ANSI_ESCAPE_RE = re.compile(r"\x1b\[[0-?]*[ -/]*[@-~]")

_CVE_RE = re.compile(r"\bCVE-\d{4}-\d+\b", flags=re.IGNORECASE)

_SEVERITY_LEVELS = {"critical", "high", "medium", "low", "info", "informational"}

_NUCLEI_PROTOCOL_TOKENS = {"http", "https", "dns", "tcp", "ssl", "tls", "network", "headless", "file"}

_NUCLEI_STATS_RE = re.compile(r"^\[[0-9:]+\]\s*\|\s*templates:\s*\d+\s*\|\s*hosts:\s*\d+\s*\|", flags=re.IGNORECASE)

_NUCLEI_LOG_LEVELS = {"wrn", "inf", "err", "dbg", "ftl"}

_NUCLEI_QUALITY_ACTIONS = {"suppressed", "downgraded"}

_NUCLEI_RATE_LIMIT_STATUS_MARKERS = (
    "[429]",
    "status: 429",
    "status code 429",
    "http 429",
    "http/1.1 429",
    "http/2 429",
    "retry-after",
)

_NUCLEI_RATE_LIMIT_PHRASES = (
    "too many requests",
    "rate limit",
    "rate-limit",
    "ratelimit",
    "retry later",
    "quota exceeded",
    "request quota",
    "throttled",
    "throttle limit",
)

_NUCLEI_WAF_VENDOR_MARKERS = (
    "cloudflare",
    "akamai",
    "imperva",
    "incapsula",
    "sucuri",
    "f5",
    "big-ip",
)

_NUCLEI_WAF_BLOCK_MARKERS = (
    "attention required",
    "sorry, you have been blocked",
    "request blocked",
    "blocked by security",
    "security challenge",
    "security check",
    "web application firewall",
    "captcha",
)

_NUCLEI_REFLECTION_MARKERS = (
    "payload reflected",
    "payload is reflected",
    "input is reflected",
    "reflected in response",
    "reflection-only",
    "echoed back",
    "echo endpoint",
    "debug echo",
)

_WHATWEB_PAIR_RE = re.compile(r"([A-Za-z][A-Za-z0-9+_. -]{1,48})\[([^\]]{1,180})\]")

_WHATWEB_IGNORED_NAMES = {
    "cache-control",
    "content-language",
    "content-security-policy",
    "content-type",
    "country",
    "cookies",
    "email",
    "etag",
    "httponly",
    "html5",
    "httpcountry",
    "ip",
    "meta-generator",
    "referrer-policy",
    "redirectlocation",
    "script",
    "strict-transport-security",
    "title",
    "uncommonheaders",
    "vary",
    "x-content-type-options",
    "x-frame-options",
    "x-powered-by",
    "x-xss-protection",
}

_LEGACY_TLS_FINDINGS = {
    "sslv2": ("SSLv2 supported", "high"),
    "sslv3": ("SSLv3 supported", "high"),
    "tlsv1.0": ("TLSv1.0 supported", "medium"),
    "tlsv1.1": ("TLSv1.1 supported", "medium"),
}

_PRODUCT_TOKEN_RE = re.compile(r"([A-Za-z][A-Za-z0-9+_.-]{1,64})(?:/([0-9][A-Za-z0-9._-]{0,31}))?")

_NMAP_BLOCK_HEADER_RE = re.compile(r"^\s*\|_?\s?([a-z0-9_.-]+(?:\.nse)?)\s*:\s*(.*)$", flags=re.IGNORECASE)

_NIKTO_OSVDB_RE = re.compile(
    r"^\+\s*(OSVDB-\d+)\s*:\s*((?:https?://[^\s:]+|/[^:\s]+))\s*:\s*(.+)$",
    flags=re.IGNORECASE,
)

_NIKTO_PATH_RE = re.compile(r"^\+\s*((?:https?://[^\s:]+|/[^:\s]+))\s*:\s*(.+)$", flags=re.IGNORECASE)

_NIKTO_VERB_PATH_RE = re.compile(
    r"^\+\s*(?:-\d+\s*:\s*)?(?:(?:GET|POST|PUT|DELETE|HEAD|OPTIONS|TRACE|CONNECT|PATCH)\s+)?"
    r"((?:https?://[^\s:]+|/[^:\s]*|\.))\s*:\s*(.+)$",
    flags=re.IGNORECASE,
)

_NIKTO_SERVER_RE = re.compile(r"^\+\s*Server\s*:\s*(.+)$", flags=re.IGNORECASE)

_NIKTO_POWERED_BY_RE = re.compile(
    r"(?:x-powered-by|powered by)(?:\s+header)?\s*:\s*([A-Za-z][A-Za-z0-9+_.-]{1,64}(?:/[0-9][A-Za-z0-9._-]{0,31})?)",
    flags=re.IGNORECASE,
)

_WPSCAN_URL_RE = re.compile(r"^\[\+\]\s*URL:\s*(https?://\S+)", flags=re.IGNORECASE)

_WPSCAN_VERSION_RE = re.compile(
    r"\bWordPress(?:\s+version)?\s+([0-9][A-Za-z0-9._-]{0,31})\s+identified\b",
    flags=re.IGNORECASE,
)

_WPSCAN_LOCATION_RE = re.compile(r"^\|\s*Location:\s*(https?://\S+)", flags=re.IGNORECASE)

_WAF_VENDOR_RE = re.compile(
    r"\b(?:behind|protected by|using)\s+(?:an?\s+)?([A-Za-z0-9][A-Za-z0-9 ._()/+-]{1,80}?)(?:\s+\(|\s+waf\b|\s+firewall\b|[.!]|\s*$)",
    flags=re.IGNORECASE,
)

_WAF_SITE_VENDORS_RE = re.compile(
    r"\bthe site\s+(?P<url>https?://\S+)\s+is behind\s+(?P<vendors>.+?)\s+waf\b",
    flags=re.IGNORECASE,
)

_WAF_VENDOR_DETAIL_RE = re.compile(
    r"^(?P<firewall>[A-Za-z0-9][A-Za-z0-9 ._()/+-]{0,80}?)(?:\s*\((?P<manufacturer>[^)]+)\))?$",
    flags=re.IGNORECASE,
)

_WAF_REASON_RE = re.compile(r"^\[\~\]\s*Reason:\s*(.+)$", flags=re.IGNORECASE)

_FEROX_LINE_RE = re.compile(
    r"^(?P<status>\d{3})\s+\w+\s+\d+l\s+\d+w\s+\d+c\s+(?P<url>https?://\S+?)(?:\s+=>\s+(?P<redirect>https?://\S+))?$",
    flags=re.IGNORECASE,
)

_GOBUSTER_LINE_RE = re.compile(
    r"^(?P<path>/\S+?)\s+\(Status:\s*(?P<status>\d{3})\)(?:\s+\[Size:\s*\d+\])?(?:\s+\[-->\s*(?P<redirect>https?://\S+)\])?$",
    flags=re.IGNORECASE,
)

_GOBUSTER_URL_LINE_RE = re.compile(
    r"^(?:Found:\s+)?(?P<url>https?://\S+?)\s+\(Status:\s*(?P<status>\d{3})\)(?:\s+\[Size:\s*\d+\])?(?:\s+\[-->\s*(?P<redirect>https?://\S+)\])?$",
    flags=re.IGNORECASE,
)

_HTTP_STATUS_RE = re.compile(r"^HTTP/\d+(?:\.\d+)?\s+(\d{3})\b(?:\s+(.+))?$", flags=re.IGNORECASE)

_TLS_WEAK_CIPHER_RE = re.compile(r"(?:RC4|3DES|DES-CBC|NULL|EXPORT|aNULL|anon)", flags=re.IGNORECASE)

_TLS_SHA1_RE = re.compile(r"(?:\bsha-?1\b|sha1with)", flags=re.IGNORECASE)

_TLS_MD5_RE = re.compile(r"(?:\bmd5\b|md5with)", flags=re.IGNORECASE)

_TLS_KEY_SIZE_RE = re.compile(
    r"(?:rsa key strength|public key size|rsa public key size|rsa public key)\s*:\s*(\d+)", flags=re.IGNORECASE
)

_TLS_SUBJECT_RE = re.compile(r"^subject:\s*(.+)$", flags=re.IGNORECASE)

_TLS_ISSUER_RE = re.compile(r"^issuer:\s*(.+)$", flags=re.IGNORECASE)

_TLS_PROTOCOL_SECTION_RE = re.compile(
    r"^(?:[*-]\s*)?(?P<protocol>sslv?2(?:\.0)?|sslv?3(?:\.0)?|tlsv?1(?:\.0)?|tlsv?1\.1|ssl 2\.0|ssl 3\.0|tls 1\.0|tls 1\.1)\b.*cipher suites",
    flags=re.IGNORECASE,
)

_TLS_ACCEPTED_CIPHER_COUNT_RE = re.compile(r"accepted\s+(?P<count>\d+)\s+cipher suites", flags=re.IGNORECASE)

_NBTSCAN_TABLE_HEADER_RE = re.compile(
    r"^netbios name table for host\s+((?:\d{1,3}\.){3}\d{1,3})\s*:\s*$", flags=re.IGNORECASE
)

_NBTSCAN_VERBOSE_ROW_RE = re.compile(r"^\s*(.{1,32}?)\s+<([0-9A-Fa-f]{2})>\s+(UNIQUE|GROUP)\s*$")

_NBTSCAN_SCRIPT_ROW_RE = re.compile(r"^((?:\d{1,3}\.){3}\d{1,3}):([^:]{1,64}):([0-9A-Fa-f]{2})([UG])$")

_NBTSCAN_SUMMARY_IP_RE = re.compile(r"^(?:\d{1,3}\.){3}\d{1,3}$")

_NBTSCAN_MAC_RE = re.compile(r"^[0-9A-Fa-f]{2}(?:[:-][0-9A-Fa-f]{2}){5}$")

_NBTSCAN_NAME_RE = re.compile(r"^[A-Za-z0-9_. $?-]{1,64}$")

_DNSMAP_HOST_RE = re.compile(r"^(?:[A-Za-z0-9_-]{1,63}\.)+[A-Za-z0-9-]{2,63}$")

_DNSMAP_IP_RE = re.compile(r"^(?:IPv6\s+address|IP\s+address)\s+#\d+\s*:\s*(\S+)\s*$", flags=re.IGNORECASE)

_NAME_VERSION_RE = re.compile(
    r"^\s*([A-Za-z][A-Za-z0-9+_.() /-]{0,79}?)(?:\s+v?((?:>=|<=|>|<)\s*[0-9][A-Za-z0-9._-]{0,31}|[0-9][A-Za-z0-9._-]{0,47}))?\s*$"
)

_SQLMAP_PARAMETER_RE = re.compile(r"^Parameter:\s*(.+?)\s*\(([^)]+)\)\s*$", flags=re.IGNORECASE)

_SQLMAP_TYPE_RE = re.compile(r"^Type:\s*(.+?)\s*$", flags=re.IGNORECASE)

_SQLMAP_TITLE_RE = re.compile(r"^Title:\s*(.+?)\s*$", flags=re.IGNORECASE)

_SQLMAP_WEB_TECH_RE = re.compile(r"^web application technology:\s*(.+?)\s*$", flags=re.IGNORECASE)

_SQLMAP_DBMS_RE = re.compile(r"^(?:the\s+back-end\s+DBMS\s+is|back-end DBMS:)\s*(.+?)\s*$", flags=re.IGNORECASE)

_SQLMAP_BANNER_RE = re.compile(r"^banner:\s*['\"]?(.+?)['\"]?\s*$", flags=re.IGNORECASE)

_NETEXEC_DOMAIN_TOKEN_RE = re.compile(r"(?i)\(domain:([A-Za-z0-9_.-]{1,96})\)")

_NETEXEC_SIGNING_TOKEN_RE = re.compile(r"(?i)\(signing:(true|false)\)")

_NETEXEC_SMBV1_TOKEN_RE = re.compile(r"(?i)\(smbv1:(true|false)\)")

_NETEXEC_SHARE_ROW_RE = re.compile(
    r"(?im)^SMB\s+\S+\s+\d+\s+\S+\s+(?P<share>[A-Za-z0-9_. $-]{1,128}\$?)\s{2,}(?P<permissions>[A-Za-z, /-]{0,32})\s{2,}.*$"
)

_NETEXEC_USER_ROW_RE = re.compile(
    r"(?im)^SMB\s+\S+\s+\d+\s+\S+\s+(?P<account>[A-Za-z0-9_.-]{1,64}\\[A-Za-z0-9_. $-]{1,96})\b.*\brid:(?:0x)?[0-9A-Fa-f]+\b"
)

_NETEXEC_AUTH_SUCCESS_RE = re.compile(r"(?im)^SMB\s+\S+\s+\d+\s+\S+\s+\[\+\]\s+(?P<account>[^:\r\n]+)\s*:")

_SMB_PASSWORD_POLICY_RE = re.compile(
    r"(?im)\b(?:min password length|password history length|max password age|min password age|lockout threshold)\s*:\s*([^\r\n]+)"
)

_SQLMAP_DBA_RE = re.compile(r"^current user is DBA:\s*(true|false|yes|no)\s*$", flags=re.IGNORECASE)

_SQLMAP_AVAILABLE_DBS_RE = re.compile(r"^available databases\s*\[(\d+)\]\s*:\s*$", flags=re.IGNORECASE)

_SQLMAP_LIST_ITEM_RE = re.compile(r"^\[\*\]\s+(.+?)\s*$")

_MYSQL_INFO_VERSION_RE = re.compile(r"(?im)^\s*Version\s*:\s*(.+?)\s*$")

_MYSQL_INFO_PROTOCOL_RE = re.compile(r"(?im)^\s*Protocol\s*:\s*(.+?)\s*$")

_MYSQL_INFO_AUTH_PLUGIN_RE = re.compile(r"(?im)^\s*Authentication Plugin Name\s*:\s*(.+?)\s*$")

_PGSQL_INFO_VERSION_RE = re.compile(r"(?im)^\s*(?:PostgreSQL server version|Server version)\s*:\s*(.+?)\s*$")

_PGSQL_INFO_SSL_RE = re.compile(r"(?im)^\s*SSL\s*:\s*(.+?)\s*$")

_PGSQL_INFO_AUTH_RE = re.compile(r"(?im)^\s*Auth(?:entication)? method\s*:\s*(.+?)\s*$")

_MSSQL_INFO_PRODUCT_RE = re.compile(r"(?im)^\s*(?:Product|name)\s*:\s*(.+?)\s*$")

_MSSQL_INFO_VERSION_RE = re.compile(r"(?im)^\s*number\s*:\s*([0-9][A-Za-z0-9._-]{0,31})\s*$")

_MSSQL_INFO_CLUSTERED_RE = re.compile(r"(?im)^\s*Clustered\s*:\s*(true|false)\s*$")

_MSSQL_INFO_NAMED_PIPE_RE = re.compile(r"(?im)^\s*Named pipe\s*:\s*(.+?)\s*$")

_DISCOVERY_ADMIN_TOKENS = (
    "admin",
    "login",
    "signin",
    "sign-in",
    "portal",
    "console",
    "manager",
    "phpmyadmin",
    "adminer",
    "wp-admin",
    "wp-login",
    "xmlrpc",
)

_DISCOVERY_API_TOKENS = (
    "api",
    "graphql",
    "graphiql",
    "swagger",
    "openapi",
    "redoc",
    "actuator",
    "metrics",
    "health",
    "server-status",
)

_DISCOVERY_WORDPRESS_TOKENS = ("wp-admin", "wp-login", "wp-content", "wp-includes", "xmlrpc.php")

_DISCOVERY_PHPMYADMIN_TOKENS = ("phpmyadmin", "/pma", "php-my-admin")

_DISCOVERY_ACCESSIBLE_STATUSES = {"200", "204", "206"}

_DISCOVERY_PRESENT_STATUSES = _DISCOVERY_ACCESSIBLE_STATUSES | {"301", "302", "307", "308", "401", "403"}

_DISCOVERY_SENSITIVE_PATH_RE = re.compile(
    r"(?i)(?:^|/)(?:\.env(?:\.[^/]+)?|\.git(?:/|$)|\.svn(?:/|$)|\.hg(?:/|$)|id_rsa(?:\.pub)?|authorized_keys|\.htaccess|\.htpasswd|web\.config|settings\.php(?:\.[^/]+)?|config(?:uration)?\.(?:php|json|ya?ml|xml|ini|conf|bak|old|orig)|phpinfo(?:\.php)?|server-status|server-info|passwd|shadow)(?:$|/)"
)

_DISCOVERY_BACKUP_PATH_RE = re.compile(
    r"(?i)(?:^|/)(?:backup|dump|db|database|config|settings|site)(?:[-_.][^/]{0,48})?\.(?:zip|tar|tgz|gz|rar|7z|sql|bak|old|orig|tar\.gz|sql\.gz)$"
)

_IGNORED_PRODUCT_NAMES = {"http", "https", "tls", "ssl", "html", "json"}

_IGNORED_DISCOVERY_URL_HOSTS = {"nmap.org", "www.nmap.org", "http", "https"}

_CLOUD_PUBLIC_EXPOSURE_MARKERS = (
    "public bucket",
    "bucket listing exposed",
    "container listing exposed",
    "blob listing exposed",
    "publicly accessible",
    "public access enabled",
    "anonymous access",
    "anonymous read",
    "anonymous list",
    "unauthenticated access",
    "world-readable",
    "world readable",
    "allusers",
    "authenticatedusers",
    "public acl",
)

_CLOUD_PUBLIC_NEGATION_MARKERS = (
    "not publicly accessible",
    "public access disabled",
    "anonymous access disabled",
    "private bucket",
    "private container",
    "authentication required",
)

_MANAGED_DB_PUBLIC_ACCESS_MARKERS = (
    "publicly accessible",
    "public access enabled",
    "public endpoint",
    "public network access",
    "internet reachable",
    "internet exposed",
)

_COSMOS_RISK_MARKERS = (
    "master key",
    "read-only key",
    "readonly key",
    "publicly accessible",
    "public access enabled",
    "public network access",
    "anonymous access",
)

_GRAYHAT_BUCKET_TECH_MAP = {
    "aws": ("Amazon Web Services", "Amazon S3"),
    "azure": ("Microsoft Azure", "Azure Blob Storage"),
    "gcp": ("Google Cloud Platform", "Google Cloud Storage"),
    "dos": ("DigitalOcean", "DigitalOcean Spaces"),
    "ali": ("Alibaba Cloud", "Alibaba Object Storage Service"),
}

_SUPPORTED_ARTIFACT_PARSE_PREFIXES = (
    "whatweb",
    "httpx",
    "nikto",
    "nuclei",
    "nmap-vuln",
    "http-vuln-",
    "sslscan",
    "sslyze",
    "testssl",
    "wafw00f",
    "web-content-discovery",
    "dirsearch",
    "ffuf",
    "wpscan",
    "enum4linux-ng",
    "enum4linux",
    "smbenum",
    "samrdump",
    "smbmap",
    "rpcclient-enum",
    "nbtscan",
    "subfinder",
    "grayhatwarfare",
    "shodan",
    "dnsmap",
    "screenshooter",
    "sqlmap",
    "http-sqlmap",
    "netexec",
    "mysql-info",
    "pgsql-info",
    "ms-sql-info",
    "curl-",
)

_DISCOVERY_PATH_RE = re.compile(r"(?i)(?:\"path\"|path|location|redirectlocation)\s*[:=]\s*['\"]?(/[^\"'\s,|]+)")

_SMB_USER_RE = re.compile(r"(?i)(?:user(?:name)?|account)\s*[:=\[]\s*['\"]?([A-Za-z0-9_. $-]{1,96})")

_SMB_RPC_USER_RE = re.compile(r"(?i)\buser:\[([^\]]{1,96})\]")

_SMB_SHARE_RE = re.compile(r"(?i)(?:share(?:name)?|netname)\s*[:=\[]\s*['\"]?([A-Za-z0-9_. $-]{1,128})")

_SMB_DOMAIN_RE = re.compile(r"(?i)(?:domain(?:\s+name)?|workgroup)\s*[:=]\s*['\"]?([A-Za-z0-9_.-]{1,96})")

_SMB_FOUND_USER_RE = re.compile(r"(?im)\bfound user\s*:\s*([^,\r\n]{1,96})")

_SMB_FOUND_DOMAIN_RE = re.compile(r"(?im)\bfound domain(?:\s+name)?\s*:\s*([^,\r\n]{1,96})")

_SMB_SHARE_TABLE_RE = re.compile(r"(?im)^\s*([A-Za-z0-9_. $-]{1,128}?)\s{2,}(?:Disk|IPC|Printer|Device)\b")

_HTTP_HEADER_RE = re.compile(r"^([A-Za-z0-9-]+):\s*(.+)$")

_HTML_TITLE_RE = re.compile(r"<title>([^<]{1,200})</title>", flags=re.IGNORECASE)

_PLACEHOLDER_VALUE_TOKENS = {
    "true",
    "false",
    "null",
    "none",
    "nil",
    "n/a",
    "na",
    "truncated",
    "...",
}
