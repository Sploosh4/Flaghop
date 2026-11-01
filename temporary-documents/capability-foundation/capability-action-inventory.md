# Existing action inventory

Inventory of the default settings at the 1 November 2026 fc8a960 baseline. Source: `app/contracts/actions/catalog.py`, `app/configuration/`, `app/scheduler/registry.py`; per-project or user settings can differ. The registry preserves last-row duplicate handling. Parameters below come from template placeholders; service and protocol scope reflect existing registry definitions. Artifact types are inferred hints, not verified outputs. Taxonomy, positive category definitions, applicability beyond those scopes and guaranteed evidence require later agreement.

| Action ID | Required template inputs | Service scope | Protocol | Inferred artifact hints |
| --- | --- | --- | --- | --- |
| ftp-default | ip, output, port | ftp | tcp | text |
| mssql-default | ip, output, port | ms-sql-s | tcp | text |
| mysql-default | ip, output, port | mysql | tcp | text |
| oracle-default | ip, output, port | oracle-tns | tcp | text |
| postgres-default | ip, output, port | postgresql | tcp | text |
| ssh-hostkey.nse | ip, port | ssh | tcp | nmap |
| ssh2-enum-algos.nse | ip, port | ssh | tcp | nmap |
| ssh-auth-methods.nse | ip, port | ssh | tcp | nmap |
| sshv1.nse | ip, port | ssh | tcp | nmap |
| telnet-encryption.nse | ip, port | telnet | tcp | nmap |
| telnet-ntlm-info.nse | ip, port | telnet | tcp | nmap |
| smb-protocols.nse | ip, port | netbios-ssn, microsoft-ds, smb | tcp | nmap |
| smb-security-mode.nse | ip, port | netbios-ssn, microsoft-ds, smb | tcp | nmap |
| smb2-security-mode.nse | ip, port | netbios-ssn, microsoft-ds, smb | tcp | nmap |
| smb-os-discovery.nse | ip, port | netbios-ssn, microsoft-ds, smb | tcp | nmap |
| netexec | ip, output, port | netbios-ssn, microsoft-ds, smb | tcp | text |
| smtp-enum-vrfy | ip, port | smtp | tcp | text |
| enum4linux-ng | ip, output | netbios-ssn, microsoft-ds, smb | tcp | text |
| smbmap | ip, output, port | netbios-ssn, microsoft-ds, smb | tcp | text |
| rpcclient-enum | ip, output, port | netbios-ssn, microsoft-ds, smb | tcp | text |
| mysql-info.nse | ip, output, port | mysql | tcp | nmap, text |
| pgsql-info.nse | ip, output, port | postgres, postgresql | tcp | nmap, text |
| ms-sql-info.nse | ip, output, port | ms-sql, ms-sql-s, codasrv-se | tcp | nmap, text |
| snmp-brute | ip | snmp, snmptrap | tcp | text |
| vnc-default | ip, output, port | vnc | tcp | text |
| snmp-default | ip, port | snmp, snmptrap | tcp | text |
| ssh-default | ip, output, port | ssh | tcp | text |
| ssh-default-root | ip, output, port | ssh | tcp | text |
| ssh-default-router | ip, output, port | ssh | tcp | text |
| telnet-default | ip, output, port | telnet | tcp | text |
| telnet-default-root | ip, output, port | telnet | tcp | text |
| telnet-default-router | ip, output, port | telnet | tcp | text |
| smb-null-sessions | ip | netbios-ssn, microsoft-ds | tcp | none declared |
| smtp-enum-expn | ip, port | smtp | tcp | text |
| smtp-enum-rcpt | ip, port | smtp | tcp | text |
| smb-enum-admins | ip | netbios-ssn, microsoft-ds | tcp | none declared |
| smb-enum-groups | ip, port | netbios-ssn, microsoft-ds | tcp | nmap |
| smb-enum-sessions | ip, port | netbios-ssn, microsoft-ds | tcp | nmap |
| smb-enum-shares | ip, port | netbios-ssn, microsoft-ds | tcp | nmap |
| finger | ip | finger | tcp | none declared |
| smb-enum-users | ip, port | netbios-ssn, microsoft-ds | tcp | nmap |
| smb-enum-users-rpc | ip | netbios-ssn, microsoft-ds | tcp | none declared |
| smb-enum-policies | ip, port | netbios-ssn, microsoft-ds | tcp | nmap |
| polenum | ip | netbios-ssn, microsoft-ds | tcp | none declared |
| oracle-version | ip, output | oracle-tns | tcp | text |
| oracle-sid | ip, output | oracle-tns | tcp | text |
| cloudfail | ip | cloudfail | tcp | none declared |
| dnsmap | ip, output | dnsmap | tcp | text |
| enum4linux | ip | netbios-ssn, microsoft-ds | tcp | none declared |
| ldapsearch | ip, port | ldap | tcp | none declared |
| nbtscan | ip | netbios-ns | tcp | none declared |
| nmap | ip, port | unrestricted by this field | tcp | nmap |
| rdp-sec-check | ip, port | ms-wbt-server | tcp | none declared |
| rpcinfo | ip | rpcbind | tcp | none declared |
| rwho | ip | who | tcp | none declared |
| samrdump | ip, output, port | netbios-ssn, microsoft-ds | tcp | text |
| smbenum | ip | netbios-ssn, microsoft-ds | tcp | none declared |
| snmpcheck | ip | snmp, snmptrap | tcp | none declared |
| showmount | ip | nfs | tcp | none declared |
| broadcast-ms-sql-discover.nse | ip, port | ms-sql | tcp | nmap |
| citrix-brute-xml.nse | ip, port | citrix | tcp | nmap |
| citrix-enum-apps-xml.nse | ip, port | citrix | tcp | nmap |
| citrix-enum-apps.nse | ip, port | citrix | tcp | nmap |
| citrix-enum-servers-xml.nse | ip, port | citrix | tcp | nmap |
| citrix-enum-servers.nse | ip, port | citrix | tcp | nmap |
| ftp-anon.nse | ip, port | ftp | tcp | nmap |
| ftp-bounce.nse | ip, port | ftp | tcp | nmap |
| ftp-brute.nse | ip, port | ftp | tcp | nmap |
| ftp-libopie.nse | ip, port | ftp | tcp | nmap |
| ftp-proftpd-backdoor.nse | ip, port | ftp | tcp | nmap |
| ftp-vsftpd-backdoor.nse | ip, port | ftp | tcp | nmap |
| ftp-vuln-cve2010-4221.nse | ip, port | ftp | tcp | nmap |
| imap-brute.nse | ip, port | imap | tcp | nmap |
| imap-capabilities.nse | ip, port | imap | tcp | nmap |
| irc-botnet-channels.nse | ip, port | irc | tcp | nmap |
| irc-brute.nse | ip, port | irc | tcp | nmap |
| irc-info.nse | ip, port | irc | tcp | nmap |
| irc-sasl-brute.nse | ip, port | irc | tcp | nmap |
| irc-unrealircd-backdoor.nse | ip, port | irc | tcp | nmap |
| ms-sql-brute.nse | ip, port | ms-sql | tcp | nmap |
| ms-sql-config.nse | ip, port | ms-sql | tcp | nmap |
| ms-sql-dac.nse | ip, port | ms-sql | tcp | nmap |
| ms-sql-dump-hashes.nse | ip, port | ms-sql | tcp | nmap |
| ms-sql-empty-password.nse | ip, port | ms-sql | tcp | nmap |
| ms-sql-hasdbaccess.nse | ip, port | ms-sql | tcp | nmap |
| ms-sql-query.nse | ip, port | ms-sql | tcp | nmap |
| ms-sql-tables.nse | ip, port | ms-sql | tcp | nmap |
| ms-sql-xp-cmdshell.nse | ip, port | ms-sql | tcp | nmap |
| msrpc-enum.nse | ip, port | msrpc | tcp | nmap |
| mysql-audit.nse | ip, port | mysql | tcp | nmap |
| mysql-brute.nse | ip, port | mysql | tcp | nmap |
| mysql-databases.nse | ip, port | mysql | tcp | nmap |
| mysql-dump-hashes.nse | ip, port | mysql | tcp | nmap |
| mysql-empty-password.nse | ip, port | mysql | tcp | nmap |
| mysql-enum.nse | ip, port | mysql | tcp | nmap |
| mysql-query.nse | ip, port | mysql | tcp | nmap |
| mysql-users.nse | ip, port | mysql | tcp | nmap |
| mysql-variables.nse | ip, port | mysql | tcp | nmap |
| mysql-vuln-cve2012-2122.nse | ip, port | mysql | tcp | nmap |
| nfs-ls.nse | ip, port | nfs | tcp | nmap |
| nfs-showmount.nse | ip, port | nfs | tcp | nmap |
| nfs-statfs.nse | ip, port | nfs | tcp | nmap |
| oracle-brute-stealth.nse | ip, port | oracle | tcp | nmap |
| oracle-brute.nse | ip, port | oracle | tcp | nmap |
| oracle-enum-users.nse | ip, port | oracle | tcp | nmap |
| oracle-sid-brute.nse | ip, port | oracle | tcp | nmap |
| pop3-brute.nse | ip, port | pop3 | tcp | nmap |
| pop3-capabilities.nse | ip, port | pop3 | tcp | nmap |
| realvnc-auth-bypass.nse | ip, port | vnc | tcp | nmap |
| samba-vuln-cve-2012-1182.nse | ip, port | samba | tcp | nmap |
| smb-brute.nse | ip, port | netbios-ssn, microsoft-ds, smb | tcp | nmap |
| smb-enum-domains.nse | ip, port | netbios-ssn, microsoft-ds, smb | tcp | nmap |
| smb-enum-groups.nse | ip, port | netbios-ssn, microsoft-ds, smb | tcp | nmap |
| smb-enum-processes.nse | ip, port | netbios-ssn, microsoft-ds, smb | tcp | nmap |
| smb-enum-services.nse | ip, port | netbios-ssn, microsoft-ds, smb | tcp | nmap |
| smb-enum-sessions.nse | ip, port | netbios-ssn, microsoft-ds, smb | tcp | nmap |
| smb-enum-shares.nse | ip, port | netbios-ssn, microsoft-ds, smb | tcp | nmap |
| smb-enum-users.nse | ip, port | netbios-ssn, microsoft-ds, smb | tcp | nmap |
| smb-flood.nse | ip, port | netbios-ssn, microsoft-ds, smb | tcp | nmap |
| smb-ls.nse | ip, port | netbios-ssn, microsoft-ds, smb | tcp | nmap |
| smb-mbenum.nse | ip, port | netbios-ssn, microsoft-ds, smb | tcp | nmap |
| smb-print-text.nse | ip, port | netbios-ssn, microsoft-ds, smb | tcp | nmap |
| smb-psexec.nse | ip, port | netbios-ssn, microsoft-ds, smb | tcp | nmap |
| smb-server-stats.nse | ip, port | netbios-ssn, microsoft-ds, smb | tcp | nmap |
| smb-system-info.nse | ip, port | netbios-ssn, microsoft-ds, smb | tcp | nmap |
| smb-vuln-all.nse | ip, port | netbios-ssn, microsoft-ds, smb | tcp | nmap |
| smb-vuln-ms10-054.nse | ip, port | netbios-ssn, microsoft-ds, smb | tcp | nmap |
| smb-vuln-ms10-061.nse | ip, port | netbios-ssn, microsoft-ds, smb | tcp | nmap |
| smtp-brute.nse | ip, port | smtp | tcp | nmap |
| smtp-commands.nse | ip, port | smtp | tcp | nmap |
| smtp-enum-users.nse | ip, port | smtp | tcp | nmap |
| smtp-open-relay.nse | ip, port | smtp | tcp | nmap |
| smtp-strangeport.nse | ip, port | smtp | tcp | nmap |
| smtp-vuln-cve2010-4344.nse | ip, port | smtp | tcp | nmap |
| smtp-vuln-cve2011-1720.nse | ip, port | smtp | tcp | nmap |
| smtp-vuln-cve2011-1764.nse | ip, port | smtp | tcp | nmap |
| snmp-brute.nse | ip, port | snmp | tcp | nmap |
| snmp-hh3c-logins.nse | ip, port | snmp | tcp | nmap |
| snmp-interfaces.nse | ip, port | snmp | tcp | nmap |
| snmp-ios-config.nse | ip, port | snmp | tcp | nmap |
| snmp-netstat.nse | ip, port | snmp | tcp | nmap |
| snmp-processes.nse | ip, port | snmp | tcp | nmap |
| snmp-sysdescr.nse | ip, port | snmp | tcp | nmap |
| snmp-win32-services.nse | ip, port | snmp | tcp | nmap |
| snmp-win32-shares.nse | ip, port | snmp | tcp | nmap |
| snmp-win32-software.nse | ip, port | snmp | tcp | nmap |
| snmp-win32-users.nse | ip, port | snmp | tcp | nmap |
| tftp-enum.nse | ip, port | tftp | tcp | nmap |
| vnc-brute.nse | ip, port | vnc | tcp | nmap |
| vnc-info.nse | ip, port | vnc | tcp | nmap |

Pipette profiles are separately sourced from `pipettes/*/manifest.json` and `app/contracts/actions/pipettes.py`; their declared prerequisites, parameters, scope, ports and output template are available through the inspection endpoint. They do not establish that prerequisites are installed or that a result is produced. Their external tool execution and findings are not expanded by this inventory.
