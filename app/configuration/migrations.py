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


class Migrations:
    @staticmethod
    def _default_settings_group_values(defaults) -> dict:
        return {
            "GeneralSettings": {
                "default-terminal": defaults.general_default_terminal,
                "tool-output-black-background": defaults.general_tool_output_black_background,
                "colorful-ascii-background": defaults.general_colorful_ascii_background,
                "screenshooter-timeout": defaults.general_screenshooter_timeout,
                "web-services": defaults.general_web_services,
                "enable-scheduler": defaults.general_enable_scheduler,
                "enable-scheduler-on-import": defaults.general_enable_scheduler_on_import,
                "max-fast-processes": defaults.general_max_fast_processes,
                "max-slow-processes": defaults.general_max_slow_processes,
                "notes-autosave-minutes": defaults.general_notes_autosave_minutes,
            },
            "BruteSettings": {
                "store-cleartext-passwords-on-exit": defaults.brute_store_cleartext_passwords_on_exit,
                "username-wordlist-path": defaults.brute_username_wordlist_path,
                "password-wordlist-path": defaults.brute_password_wordlist_path,
                "default-username": defaults.brute_default_username,
                "default-password": defaults.brute_default_password,
                "services": defaults.brute_services,
                "no-username-services": defaults.brute_no_username_services,
                "no-password-services": defaults.brute_no_password_services,
            },
            "ToolSettings": {
                "nmap-path": defaults.tools_path_nmap,
                "hydra-path": defaults.tools_path_hydra,
                "texteditor-path": defaults.tools_path_texteditor,
                "pyshodan-api-key": defaults.tools_pyshodan_api_key,
                "responder-path": defaults.tools_path_responder,
                "ntlmrelay-path": defaults.tools_path_ntlmrelay,
            },
            "StagedNmapSettings": {
                "stage1-ports": defaults.tools_nmap_stage1_ports,
                "stage2-ports": defaults.tools_nmap_stage2_ports,
                "stage3-ports": defaults.tools_nmap_stage3_ports,
                "stage4-ports": defaults.tools_nmap_stage4_ports,
                "stage5-ports": defaults.tools_nmap_stage5_ports,
                "stage6-ports": defaults.tools_nmap_stage6_ports,
            },
            "GUISettings": {
                "process-tab-column-widths": defaults.gui_process_tab_column_widths,
                "process-tab-detail": defaults.gui_process_tab_detail,
            },
        }

    @staticmethod
    def _legacy_settings_aliases() -> dict:
        return {
            "GeneralSettings": {
                "default-terminal": [("GeneralSettings", "default_terminal")],
                "tool-output-black-background": [("GeneralSettings", "tool_output_black_background")],
                "colorful-ascii-background": [("GeneralSettings", "colorful_ascii_background")],
                "screenshooter-timeout": [("GeneralSettings", "screenshooter_timeout")],
                "web-services": [("GeneralSettings", "web_services")],
                "enable-scheduler": [("GeneralSettings", "enable_scheduler")],
                "enable-scheduler-on-import": [("GeneralSettings", "enable_scheduler_on_import")],
                "max-fast-processes": [("GeneralSettings", "max_fast_processes")],
                "max-slow-processes": [("GeneralSettings", "max_slow_processes")],
                "notes-autosave-minutes": [("GeneralSettings", "notes_autosave_minutes")],
            },
            "BruteSettings": {
                "username-wordlist-path": [("BruteSettings", "userlist")],
                "password-wordlist-path": [("BruteSettings", "passlist")],
                "default-username": [("BruteSettings", "default_username")],
                "default-password": [("BruteSettings", "default_password")],
                "no-username-services": [("BruteSettings", "no_username_services")],
                "no-password-services": [("BruteSettings", "no_password_services")],
                "store-cleartext-passwords-on-exit": [("BruteSettings", "store_cleartext_passwords_on_exit")],
            },
            "ToolSettings": {
                "nmap-path": [("ToolSettings", "nmap_path"), ("GeneralSettings", "nmap_path")],
                "hydra-path": [("ToolSettings", "hydra_path"), ("GeneralSettings", "hydra_path")],
                "texteditor-path": [("ToolSettings", "texteditor_path"), ("GeneralSettings", "texteditor_path")],
                "pyshodan-api-key": [("ToolSettings", "pyshodan_api_key"), ("GeneralSettings", "pyshodan_api_key")],
                "responder-path": [("ToolSettings", "responder_path"), ("GeneralSettings", "responder_path")],
                "ntlmrelay-path": [("ToolSettings", "ntlmrelay_path"), ("GeneralSettings", "ntlmrelay_path")],
            },
            "StagedNmapSettings": {
                "stage1-ports": [("StagedNmapSettings", "stage1_ports")],
                "stage2-ports": [("StagedNmapSettings", "stage2_ports")],
                "stage3-ports": [("StagedNmapSettings", "stage3_ports")],
                "stage4-ports": [("StagedNmapSettings", "stage4_ports")],
                "stage5-ports": [("StagedNmapSettings", "stage5_ports")],
                "stage6-ports": [("StagedNmapSettings", "stage6_ports")],
            },
            "GUISettings": {
                "process-tab-column-widths": [("GUISettings", "process_tab_column_widths")],
                "process-tab-detail": [("GUISettings", "process_tab_detail")],
            },
        }

    def _read_group_value(self, group_name: str, key: str):
        parser = getattr(self.actions, "_parser", None)
        if parser is None:
            return None
        section = str(group_name or "").strip()
        option = str(key or "").strip()
        if not section or not option:
            return None
        if not parser.has_section(section) or not parser.has_option(section, option):
            return None
        raw = parser.get(section, option, raw=True, fallback=None)
        if raw is None:
            return None
        if section in getattr(self.actions, "_list_value_groups", set()):
            return self.actions._decode_csv(raw)
        return self.actions._decode_scalar(raw)

    def _remove_group_key(self, group_name: str, key: str) -> bool:
        parser = getattr(self.actions, "_parser", None)
        if parser is None:
            return False
        section = str(group_name or "").strip()
        option = str(key or "").strip()
        if not section or not option or not parser.has_section(section):
            return False
        return bool(parser.remove_option(section, option))

    def _apply_default_settings_migrations(self):
        from app.settings import Settings

        defaults = Settings()
        group_defaults = self._default_settings_group_values(defaults)
        legacy_aliases = self._legacy_settings_aliases()
        changed = False
        removals = set()

        for group_name, entries in group_defaults.items():
            self.actions.beginGroup(group_name)
            try:
                for key, default_value in entries.items():
                    if self.actions.value(key) is not None:
                        continue
                    resolved_value = default_value
                    for alias_group, alias_key in legacy_aliases.get(group_name, {}).get(key, []):
                        alias_value = self._read_group_value(alias_group, alias_key)
                        if alias_value is None:
                            continue
                        resolved_value = alias_value
                        if alias_group != group_name or alias_key != key:
                            removals.add((alias_group, alias_key))
                        break
                    self.actions.setValue(key, resolved_value)
                    changed = True
            finally:
                self.actions.endGroup()

        for alias_group, alias_key in sorted(removals):
            changed = self._remove_group_key(alias_group, alias_key) or changed

        if changed:
            self.actions.sync()
            log.info("Applied legion.conf settings migration updates (general/tool defaults, legacy aliases).")

    def _apply_default_action_migrations(self):
        changed = False
        changed = self._migrate_host_actions() or changed
        changed = self._migrate_port_actions() or changed
        changed = self._migrate_port_terminal_actions() or changed
        changed = self._migrate_scheduler_settings() or changed
        if changed:
            self.actions.sync()
            log.info(
                "Applied legion.conf action migration updates (nmap stats, banner, nuclei, vuln, web-content-discovery)."
            )

    def _migrate_host_actions(self):
        changed = False
        self.actions.beginGroup("HostActions")
        try:
            keys = self.actions.childKeys()
            for key in keys:
                value = self.actions.value(key)
                if not isinstance(value, (list, tuple)) or len(value) < 2:
                    continue
                label = str(value[0] or "")
                command = str(value[1] or "")
                updated_command = self._normalize_action_command(str(key), command)
                if updated_command != command:
                    self.actions.setValue(str(key), [label, updated_command])
                    changed = True
        finally:
            self.actions.endGroup()
        return changed

    def _migrate_port_actions(self):
        changed = False
        self.actions.beginGroup("PortActions")
        try:
            expected_scopes = {
                str(key): str(value[2] or "")
                for key, value in {
                    **self.BASELINE_WEB_PORT_ACTIONS,
                    **self.EXTERNAL_RECON_PORT_ACTIONS,
                    **self.BASELINE_INTERNAL_PORT_ACTIONS,
                }.items()
            }
            for key in sorted(self.DISABLED_PORT_ACTION_IDS):
                if self.actions.value(key) is not None:
                    self.actions.remove(key)
                    changed = True

            # Remove legacy GUI-only dirbuster action in favor of headless-safe web discovery.
            if self.actions.value("dirbuster") is not None:
                self.actions.remove("dirbuster")
                changed = True

            if self.actions.value("web-content-discovery") is None:
                self.actions.setValue(
                    "web-content-discovery",
                    [
                        "Run web content discovery (feroxbuster/gobuster)",
                        self.WEB_CONTENT_DISCOVERY_COMMAND,
                        self.WEB_SERVICE_SCOPE,
                    ],
                )
                changed = True
            else:
                value = self.actions.value("web-content-discovery")
                label = "Run web content discovery (feroxbuster/gobuster)"
                command = self.WEB_CONTENT_DISCOVERY_COMMAND
                scope = self.WEB_SERVICE_SCOPE

                if isinstance(value, (list, tuple)):
                    if len(value) > 0 and value[0]:
                        label = str(value[0])
                    if len(value) > 1 and value[1]:
                        command = str(value[1])
                    if len(value) > 2 and value[2]:
                        scope = str(value[2])

                updated_command = self._ensure_web_content_discovery_command(command)
                if updated_command != command:
                    self.actions.setValue("web-content-discovery", [label, updated_command, scope])
                    changed = True

            if self.actions.value("nmap-vuln.nse") is None:
                self.actions.setValue(
                    "nmap-vuln.nse",
                    [
                        "nmap-vuln.nse",
                        self.NMAP_VULN_COMMAND,
                        self.WEB_SERVICE_SCOPE,
                    ],
                )
                changed = True
            else:
                value = self.actions.value("nmap-vuln.nse")
                label = "nmap-vuln.nse"
                command = self.NMAP_VULN_COMMAND
                scope = self.WEB_SERVICE_SCOPE

                if isinstance(value, (list, tuple)):
                    if len(value) > 0 and value[0]:
                        label = str(value[0])
                    if len(value) > 1 and value[1]:
                        command = str(value[1])
                    if len(value) > 2 and value[2]:
                        scope = str(value[2])

                updated_command = self._ensure_nmap_vuln_command(command)
                if updated_command != command:
                    self.actions.setValue("nmap-vuln.nse", [label, updated_command, scope])
                    changed = True

            if self.actions.value("nuclei-web") is None:
                self.actions.setValue(
                    "nuclei-web",
                    [
                        "Run nuclei web scan",
                        self.NUCLEI_WEB_COMMAND,
                        self.WEB_SERVICE_SCOPE,
                    ],
                )
                changed = True
            else:
                value = self.actions.value("nuclei-web")
                label = "Run nuclei web scan"
                command = self.NUCLEI_WEB_COMMAND
                scope = self.WEB_SERVICE_SCOPE

                if isinstance(value, (list, tuple)):
                    if len(value) > 0 and value[0]:
                        label = str(value[0])
                    if len(value) > 1 and value[1]:
                        command = str(value[1])
                    if len(value) > 2 and value[2]:
                        scope = str(value[2])

                updated_command = self._ensure_nuclei_auto_scan(command)
                if updated_command != command:
                    self.actions.setValue("nuclei-web", [label, updated_command, scope])
                    changed = True

            for key, value in {
                **self.BASELINE_WEB_PORT_ACTIONS,
                **self.EXTERNAL_RECON_PORT_ACTIONS,
                **self.BASELINE_INTERNAL_PORT_ACTIONS,
            }.items():
                if self.actions.value(key) is None:
                    self.actions.setValue(key, [value[0], value[1], value[2]])
                    changed = True

            keys = self.actions.childKeys()
            for key in keys:
                value = self.actions.value(key)
                if not isinstance(value, (list, tuple)) or len(value) < 2:
                    continue
                label = str(value[0] or "")
                command = str(value[1] or "")
                scope = str(value[2] or "") if len(value) > 2 else ""
                updated_command = self._normalize_action_command(str(key), command)
                if updated_command != command:
                    self.actions.setValue(str(key), [label, updated_command, scope])
                    changed = True
                    command = updated_command
                expected_scope = str(expected_scopes.get(str(key), "") or "")
                if expected_scope and scope != expected_scope:
                    self.actions.setValue(str(key), [label, command, expected_scope])
                    changed = True
        finally:
            self.actions.endGroup()
        return changed

    def _migrate_scheduler_settings(self):
        changed = False
        self.actions.beginGroup("SchedulerSettings")
        try:
            for key in sorted(self.DISABLED_PORT_ACTION_IDS):
                if self.actions.value(key) is not None:
                    self.actions.remove(key)
                    changed = True

            if self.actions.value("dirbuster") is not None:
                self.actions.remove("dirbuster")
                changed = True

            if self.actions.value("web-content-discovery") is None:
                self.actions.setValue("web-content-discovery", [self.WEB_SERVICE_SCOPE, "tcp"])
                changed = True

            if self.actions.value("nmap-vuln.nse") is None:
                self.actions.setValue("nmap-vuln.nse", [self.WEB_SERVICE_SCOPE, "tcp"])
                changed = True

            if self.actions.value("nuclei-web") is None:
                self.actions.setValue("nuclei-web", [self.WEB_SERVICE_SCOPE, "tcp"])
                changed = True

            for tool_id, scope in (
                ("whatweb", self.WEB_SERVICE_SCOPE),
                ("httpx", self.WEB_SERVICE_SCOPE),
                ("whatweb-http", "http,soap,http-proxy,http-alt"),
                ("whatweb-https", "https,ssl,https-alt"),
                ("nikto", self.WEB_SERVICE_SCOPE),
                ("wafw00f", "https,ssl,https-alt"),
                ("sslscan", "https,ssl,https-alt"),
                ("testssl.sh", "https,ssl,ms-wbt-server,imap,pop3,smtp,https-alt"),
                ("nuclei-cves", self.WEB_SERVICE_SCOPE),
                ("nuclei-exposures", self.WEB_SERVICE_SCOPE),
                ("nuclei-wordpress", self.WEB_SERVICE_SCOPE),
                ("curl-headers", self.WEB_SERVICE_SCOPE),
                ("curl-options", self.WEB_SERVICE_SCOPE),
                ("curl-robots", self.WEB_SERVICE_SCOPE),
                ("wpscan", "http,https,ssl,https-alt"),
                ("dirsearch", self.WEB_SERVICE_SCOPE),
                ("ffuf", self.WEB_SERVICE_SCOPE),
                ("katana", self.WEB_SERVICE_SCOPE),
                ("enum4linux-ng", "netbios-ssn,microsoft-ds,smb"),
                ("smbmap", "netbios-ssn,microsoft-ds,smb"),
                ("rpcclient-enum", "netbios-ssn,microsoft-ds,smb"),
                ("netexec", "netbios-ssn,microsoft-ds,smb"),
                ("mysql-info.nse", "mysql"),
                ("pgsql-info.nse", "postgres,postgresql"),
                ("ms-sql-info.nse", "ms-sql,ms-sql-s,codasrv-se"),
            ):
                if self.actions.value(tool_id) is None:
                    self.actions.setValue(tool_id, [scope, "tcp"])
                    changed = True

            if self.actions.value("screenshooter") is None:
                self.actions.setValue("screenshooter", [self.SCREENSHOT_SERVICE_SCOPE, "tcp"])
                changed = True
            else:
                value = self.actions.value("screenshooter")
                scope = self.SCREENSHOT_SERVICE_SCOPE
                protocol = "tcp"
                if isinstance(value, (list, tuple)):
                    if len(value) > 0 and value[0]:
                        scope = str(value[0])
                    if len(value) > 1 and value[1]:
                        protocol = str(value[1])

                updated_scope = self._ensure_scope_contains_services(
                    scope,
                    [item.strip() for item in self.SCREENSHOT_SERVICE_SCOPE.split(",") if item.strip()],
                )
                if updated_scope != scope:
                    self.actions.setValue("screenshooter", [updated_scope, protocol])
                    changed = True
        finally:
            self.actions.endGroup()
        return changed

    def _migrate_port_terminal_actions(self):
        changed = False
        self.actions.beginGroup("PortTerminalActions")
        try:
            keys = self.actions.childKeys()
            for key in keys:
                value = self.actions.value(key)
                if not isinstance(value, (list, tuple)) or len(value) < 2:
                    continue
                label = str(value[0] or "")
                command = str(value[1] or "")
                scope = str(value[2] or "") if len(value) > 2 else ""
                updated_command = self._normalize_action_command(str(key), command)
                if updated_command != command:
                    self.actions.setValue(str(key), [label, updated_command, scope])
                    changed = True
        finally:
            self.actions.endGroup()
        return changed
