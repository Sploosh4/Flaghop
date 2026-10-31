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
        import configparser
        import os

        defaults = configparser.ConfigParser(interpolation=None)
        defaults.read(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "legion.conf"))
        parser = self.actions._parser
        for section, keys in {
            "GeneralSettings": ["screenshooter-timeout", "web-services"],
            "ToolSettings": ["pyshodan-api-key", "responder-path", "ntlmrelay-path"],
        }.items():
            for key in keys:
                parser.remove_option(section, key)
        changed = False
        if parser.has_option("StagedNmapSettings", "stage3-ports"):
            old_stage = parser.get("StagedNmapSettings", "stage3-ports", raw=True)
            if "vulners" in old_stage:
                parser.set("StagedNmapSettings", "stage3-ports", old_stage.replace("vulners", "vuln"))
                changed = True
        for section in ("HostActions", "PortActions", "PortTerminalActions", "SchedulerSettings"):
            if not parser.has_section(section):
                parser.add_section(section)
            supported = set(defaults.options(section))
            for key in list(parser.options(section)):
                if key not in supported:
                    parser.remove_option(section, key)
                    changed = True
            for key in supported:
                if not parser.has_option(section, key):
                    parser.set(section, key, defaults.get(section, key, raw=True))
                    changed = True
        if changed:
            self.actions.sync()
