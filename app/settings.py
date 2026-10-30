#!/usr/bin/env python

"""
LEGION (https://shanewilliamscott.com)
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

import shutil
import os

from app.core.config_store import IniSettingsStore
from app.core.common import sortArrayWithArray
from app.logging.legionLog import getAppLogger
from app.paths import (
    ensure_legion_home,
    get_legion_backup_dir,
    get_legion_conf_path,
)

# this class reads and writes application settings
from app.timing import getTimestamp

log = getAppLogger()

from app.configuration.action_catalog import ActionCatalog
from app.configuration.migrations import Migrations
from app.configuration.command_normalization import CommandNormalization
from app.configuration.nmap_commands import NmapCommands
from app.configuration.web_commands import WebCommands
from app.configuration.network_commands import NetworkCommands


class AppSettings(ActionCatalog, Migrations, CommandNormalization, NmapCommands, WebCommands, NetworkCommands):

    def __init__(self):
        ensure_legion_home()
        config_path = get_legion_conf_path()
        if not os.path.exists(config_path):
            repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
            default_conf = os.path.join(repo_root, "legion.conf")
            if os.path.exists(default_conf):
                shutil.copy(default_conf, config_path)
            else:
                log.error(f"Default configuration file not found at {default_conf}.")
        log.info(f"Loading settings file: {config_path}")
        self.actions = IniSettingsStore(config_path)
        self._apply_default_settings_migrations()
        self._apply_default_action_migrations()

    def getGeneralSettings(self):
        return self.getSettingsByGroup("GeneralSettings")

    def getBruteSettings(self):
        return self.getSettingsByGroup("BruteSettings")

    def getStagedNmapSettings(self):
        return self.getSettingsByGroup("StagedNmapSettings")

    def getToolSettings(self):
        return self.getSettingsByGroup("ToolSettings")

    def getGUISettings(self):
        return self.getSettingsByGroup("GUISettings")

    def getHostActions(self):
        self.actions.beginGroup("HostActions")
        hostactions = []
        sortArray = []
        keys = self.actions.childKeys()
        for k in keys:
            value = self.actions.value(k)
            label = value[0]
            command = self._normalize_action_command(str(k), value[1])
            hostactions.append([label, str(k), command])
            sortArray.append(label)
        self.actions.endGroup()
        sortArrayWithArray(sortArray, hostactions)  # sort by label so that it appears nicely in the context menu
        return hostactions

    # this function fetches all the host actions from the settings file
    def getPortActions(self):
        self.actions.beginGroup("PortActions")
        portactions = []
        sortArray = []
        keys = self.actions.childKeys()
        for k in keys:
            if str(k or "").strip().lower() in self.DISABLED_PORT_ACTION_IDS:
                continue
            value = self.actions.value(k)
            label = value[0]
            command = self._normalize_action_command(str(k), value[1])
            scope = value[2]
            portactions.append([label, str(k), command, scope])
            sortArray.append(label)
        self.actions.endGroup()
        sortArrayWithArray(sortArray, portactions)  # sort by label so that it appears nicely in the context menu
        return portactions

    # this function fetches all the port actions from the settings file
    def getPortTerminalActions(self):
        self.actions.beginGroup("PortTerminalActions")
        portactions = []
        sortArray = []
        keys = self.actions.childKeys()
        for k in keys:
            value = self.actions.value(k)
            label = value[0]
            command = self._normalize_action_command(str(k), value[1])
            scope = value[2]
            portactions.append([label, str(k), command, scope])
            sortArray.append(label)
        self.actions.endGroup()
        sortArrayWithArray(sortArray, portactions)  # sort by label so that it appears nicely in the context menu
        return portactions

    # this function fetches all the port actions that will be run as terminal commands from the settings file
    def getSchedulerSettings(self):
        settings = []
        self.actions.beginGroup("SchedulerSettings")
        keys = self.actions.childKeys()
        for k in keys:
            if str(k or "").strip().lower() in self.DISABLED_PORT_ACTION_IDS:
                continue
            settings.append([str(k), self.actions.value(k)[0], self.actions.value(k)[1]])
        self.actions.endGroup()
        return settings

    def getSettingsByGroup(self, name: str) -> dict:
        self.actions.beginGroup(name)
        settings = dict()
        keys = self.actions.childKeys()
        for k in keys:
            settings.update({str(k): str(self.actions.value(k))})
        self.actions.endGroup()
        log.debug("getSettingsByGroup name:{0}, result:{1}".format(str(name), str(settings)))
        return settings

    def backupAndSave(self, newSettings, saveBackup=True):
        conf_path = get_legion_conf_path()
        backup_dir = get_legion_backup_dir()
        os.makedirs(backup_dir, exist_ok=True)

        # Backup and save
        if saveBackup:
            log.info("Backing up old settings and saving new settings...")
            os.rename(conf_path, os.path.join(backup_dir, getTimestamp() + "-legion.conf"))
        else:
            log.info("Saving config...")

        self.actions = IniSettingsStore(conf_path)

        self.actions.beginGroup("GeneralSettings")
        self.actions.setValue("default-terminal", newSettings.general_default_terminal)
        self.actions.setValue("tool-output-black-background", newSettings.general_tool_output_black_background)
        self.actions.setValue("colorful-ascii-background", newSettings.general_colorful_ascii_background)
        self.actions.setValue("screenshooter-timeout", newSettings.general_screenshooter_timeout)
        self.actions.setValue("web-services", newSettings.general_web_services)
        self.actions.setValue("enable-scheduler", newSettings.general_enable_scheduler)
        self.actions.setValue("enable-scheduler-on-import", newSettings.general_enable_scheduler_on_import)
        self.actions.setValue("max-fast-processes", newSettings.general_max_fast_processes)
        self.actions.setValue("max-slow-processes", newSettings.general_max_slow_processes)
        self.actions.setValue("notes-autosave-minutes", newSettings.general_notes_autosave_minutes)
        self.actions.endGroup()

        self.actions.beginGroup("BruteSettings")
        self.actions.setValue("store-cleartext-passwords-on-exit", newSettings.brute_store_cleartext_passwords_on_exit)
        self.actions.setValue("username-wordlist-path", newSettings.brute_username_wordlist_path)
        self.actions.setValue("password-wordlist-path", newSettings.brute_password_wordlist_path)
        self.actions.setValue("default-username", newSettings.brute_default_username)
        self.actions.setValue("default-password", newSettings.brute_default_password)
        self.actions.setValue("services", newSettings.brute_services)
        self.actions.setValue("no-username-services", newSettings.brute_no_username_services)
        self.actions.setValue("no-password-services", newSettings.brute_no_password_services)
        self.actions.endGroup()

        self.actions.beginGroup("ToolSettings")
        self.actions.setValue("nmap-path", newSettings.tools_path_nmap)
        self.actions.setValue("hydra-path", newSettings.tools_path_hydra)
        self.actions.setValue("texteditor-path", newSettings.tools_path_texteditor)
        self.actions.setValue("pyshodan-api-key", newSettings.tools_pyshodan_api_key)
        self.actions.setValue("responder-path", newSettings.tools_path_responder)
        self.actions.setValue("ntlmrelay-path", newSettings.tools_path_ntlmrelay)
        self.actions.endGroup()

        self.actions.beginGroup("StagedNmapSettings")
        self.actions.setValue("stage1-ports", newSettings.tools_nmap_stage1_ports)
        self.actions.setValue("stage2-ports", newSettings.tools_nmap_stage2_ports)
        self.actions.setValue("stage3-ports", newSettings.tools_nmap_stage3_ports)
        self.actions.setValue("stage4-ports", newSettings.tools_nmap_stage4_ports)
        self.actions.setValue("stage5-ports", newSettings.tools_nmap_stage5_ports)
        self.actions.setValue("stage6-ports", newSettings.tools_nmap_stage6_ports)
        self.actions.endGroup()

        self.actions.beginGroup("GUISettings")
        self.actions.setValue("process-tab-column-widths", newSettings.gui_process_tab_column_widths)
        self.actions.setValue("process-tab-detail", newSettings.gui_process_tab_detail)
        self.actions.endGroup()

        self.actions.beginGroup("HostActions")
        for a in newSettings.hostActions:
            self.actions.setValue(a[1], [a[0], a[2]])
        self.actions.endGroup()

        self.actions.beginGroup("PortActions")
        for a in newSettings.portActions:
            self.actions.setValue(a[1], [a[0], a[2], a[3]])
        self.actions.endGroup()

        self.actions.beginGroup("PortTerminalActions")
        for a in newSettings.portTerminalActions:
            self.actions.setValue(a[1], [a[0], a[2], a[3]])
        self.actions.endGroup()

        self.actions.beginGroup("SchedulerSettings")
        for tool in newSettings.automatedAttacks:
            self.actions.setValue(tool[0], [tool[1], tool[2]])
        self.actions.endGroup()

        self.actions.sync()


# This class first sets all the default settings and
# then overwrites them with the settings found in the configuration file
class Settings:
    def __init__(self, appSettings=None):

        # general
        self.general_default_terminal = "gnome-terminal"
        self.general_tool_output_black_background = "False"
        self.general_colorful_ascii_background = "False"
        self.general_screenshooter_timeout = "15000"
        self.general_web_services = "http,https,ssl,soap,http-proxy,http-alt,https-alt"
        self.general_enable_scheduler = "True"
        self.general_enable_scheduler_on_import = "False"
        self.general_max_fast_processes = "10"
        self.general_max_slow_processes = "10"
        # Notes auto-save interval. Set to "0" to disable.
        self.general_notes_autosave_minutes = "2"

        # brute
        self.brute_store_cleartext_passwords_on_exit = "True"
        self.brute_username_wordlist_path = "/usr/share/wordlists/"
        self.brute_password_wordlist_path = "/usr/share/wordlists/"
        self.brute_default_username = "root"
        self.brute_default_password = "password"
        self.brute_services = (
            "asterisk,afp,cisco,cisco-enable,cvs,firebird,ftp,ftps,http-head,http-get,"
            + "https-head,https-get,http-get-form,http-post-form,https-get-form,"
            + "https-post-form,http-proxy,http-proxy-urlenum,icq,imap,imaps,irc,ldap2,ldap2s,"
            + "ldap3,ldap3s,ldap3-crammd5,ldap3-crammd5s,ldap3-digestmd5,ldap3-digestmd5s,"
            + "mssql,mysql,ncp,nntp,oracle-listener,oracle-sid,pcanywhere,pcnfs,pop3,pop3s,"
            + "postgres,rdp,rexec,rlogin,rsh,s7-300,sip,smb,smtp,smtps,smtp-enum,snmp,socks5,"
            + "ssh,sshkey,svn,teamspeak,telnet,telnets,vmauthd,vnc,xmpp"
        )
        self.brute_no_username_services = "cisco,cisco-enable,oracle-listener,s7-300,snmp,vnc"
        self.brute_no_password_services = "oracle-sid,rsh,smtp-enum"

        # tools
        self.tools_nmap_stage1_ports = "T:80,443"
        self.tools_nmap_stage2_ports = "T:25,135,137,139,445,1433,3306,5432,U:137,161,162,1434"
        self.tools_nmap_stage3_ports = "Vulners,CVE"
        self.tools_nmap_stage4_ports = "T:23,21,22,110,111,2049,3389,8080,U:500,5060"
        self.tools_nmap_stage5_ports = (
            "T:0-20,24,26-79,81-109,112-134,136,138,140-442,444,446-1432,1434-2048,"
            + "2050-3305,3307-3388,3390-5431,5433-8079,8081-29999"
        )
        self.tools_nmap_stage6_ports = "T:30000-65535"

        self.tools_path_nmap = "/sbin/nmap"
        self.tools_path_hydra = "/usr/bin/hydra"
        self.tools_path_texteditor = "/usr/bin/xdg-open"
        self.tools_pyshodan_api_key = ""
        self.tools_path_responder = "/usr/bin/responder"
        self.tools_path_ntlmrelay = "/usr/bin/ntlmrelayx.py"
        self.tools_path_responder = "responder"
        self.tools_path_ntlmrelay = "ntlmrelayx.py"

        # GUI settings
        self.gui_process_tab_column_widths = "125,0,100,150,100,100,100,100,100,100,100,100,100,100,100,100,100"
        self.gui_process_tab_detail = False

        self.hostActions = []
        self.portActions = []
        self.portTerminalActions = []
        self.stagedNmapSettings = []
        self.automatedAttacks = []

        # now that all defaults are set, overwrite with whatever was in the .conf file (stored in appSettings)
        if appSettings:
            try:
                self.generalSettings = appSettings.getGeneralSettings()
                self.bruteSettings = appSettings.getBruteSettings()
                self.stagedNmapSettings = appSettings.getStagedNmapSettings()
                self.toolSettings = appSettings.getToolSettings()
                self.guiSettings = appSettings.getGUISettings()
                self.hostActions = appSettings.getHostActions()
                self.portActions = appSettings.getPortActions()
                self.portTerminalActions = appSettings.getPortTerminalActions()
                self.automatedAttacks = appSettings.getSchedulerSettings()

                # general
                self.general_default_terminal = self.generalSettings.get(
                    "default-terminal",
                    self.general_default_terminal,
                )
                self.general_tool_output_black_background = self.generalSettings.get(
                    "tool-output-black-background",
                    self.general_tool_output_black_background,
                )
                self.general_colorful_ascii_background = self.generalSettings.get(
                    "colorful-ascii-background",
                    self.general_colorful_ascii_background,
                )
                self.general_screenshooter_timeout = self.generalSettings.get(
                    "screenshooter-timeout",
                    self.general_screenshooter_timeout,
                )
                self.general_web_services = self.generalSettings.get(
                    "web-services",
                    self.general_web_services,
                )
                self.general_enable_scheduler = self.generalSettings.get(
                    "enable-scheduler",
                    self.general_enable_scheduler,
                )
                self.general_enable_scheduler_on_import = self.generalSettings.get(
                    "enable-scheduler-on-import",
                    self.general_enable_scheduler_on_import,
                )
                self.general_max_fast_processes = self.generalSettings.get(
                    "max-fast-processes",
                    self.general_max_fast_processes,
                )
                self.general_max_slow_processes = self.generalSettings.get(
                    "max-slow-processes",
                    self.general_max_slow_processes,
                )
                self.general_notes_autosave_minutes = self.generalSettings.get(
                    "notes-autosave-minutes", self.general_notes_autosave_minutes
                )

                # brute
                self.brute_store_cleartext_passwords_on_exit = self.bruteSettings.get(
                    "store-cleartext-passwords-on-exit",
                    self.brute_store_cleartext_passwords_on_exit,
                )
                self.brute_username_wordlist_path = self.bruteSettings.get(
                    "username-wordlist-path",
                    self.brute_username_wordlist_path,
                )
                self.brute_password_wordlist_path = self.bruteSettings.get(
                    "password-wordlist-path",
                    self.brute_password_wordlist_path,
                )
                self.brute_default_username = self.bruteSettings.get(
                    "default-username",
                    self.brute_default_username,
                )
                self.brute_default_password = self.bruteSettings.get(
                    "default-password",
                    self.brute_default_password,
                )
                self.brute_services = self.bruteSettings.get(
                    "services",
                    self.brute_services,
                )
                self.brute_no_username_services = self.bruteSettings.get(
                    "no-username-services",
                    self.brute_no_username_services,
                )
                self.brute_no_password_services = self.bruteSettings.get(
                    "no-password-services",
                    self.brute_no_password_services,
                )

                # tools
                self.tools_nmap_stage1_ports = self.stagedNmapSettings.get(
                    "stage1-ports",
                    self.tools_nmap_stage1_ports,
                )
                self.tools_nmap_stage2_ports = self.stagedNmapSettings.get(
                    "stage2-ports",
                    self.tools_nmap_stage2_ports,
                )
                self.tools_nmap_stage3_ports = self.stagedNmapSettings.get(
                    "stage3-ports",
                    self.tools_nmap_stage3_ports,
                )
                self.tools_nmap_stage4_ports = self.stagedNmapSettings.get(
                    "stage4-ports",
                    self.tools_nmap_stage4_ports,
                )
                self.tools_nmap_stage5_ports = self.stagedNmapSettings.get(
                    "stage5-ports",
                    self.tools_nmap_stage5_ports,
                )
                self.tools_nmap_stage6_ports = self.stagedNmapSettings.get(
                    "stage6-ports",
                    self.tools_nmap_stage6_ports,
                )

                self.tools_path_nmap = self.toolSettings.get(
                    "nmap-path",
                    self.tools_path_nmap,
                )
                self.tools_path_hydra = self.toolSettings.get(
                    "hydra-path",
                    self.tools_path_hydra,
                )
                self.tools_path_texteditor = self.toolSettings.get(
                    "texteditor-path",
                    self.tools_path_texteditor,
                )
                self.tools_pyshodan_api_key = self.toolSettings.get(
                    "pyshodan-api-key",
                    self.tools_pyshodan_api_key,
                )
                self.tools_path_responder = self.toolSettings.get("responder-path", self.tools_path_responder)
                self.tools_path_ntlmrelay = self.toolSettings.get("ntlmrelay-path", self.tools_path_ntlmrelay)
                self.tools_path_responder = self.toolSettings.get("responder-path", self.tools_path_responder)
                self.tools_path_ntlmrelay = self.toolSettings.get("ntlmrelay-path", self.tools_path_ntlmrelay)

                # gui
                self.gui_process_tab_column_widths = self.guiSettings.get(
                    "process-tab-column-widths",
                    self.gui_process_tab_column_widths,
                )
                self.gui_process_tab_detail = self.guiSettings.get(
                    "process-tab-detail",
                    self.gui_process_tab_detail,
                )

            except KeyError as e:
                log.info(
                    "Something went wrong while loading the configuration file. Falling back to default "
                    + "settings for some settings."
                )
                log.info("Go to the settings menu to fix the issues!")
                log.error(str(e))

    def __eq__(self, other):  # returns false if settings objects are different
        if type(other) is type(self):
            return self.__dict__ == other.__dict__
        return False


if __name__ == "__main__":
    settings = AppSettings()
    s = Settings(settings)
    s2 = Settings(settings)
    log.info(s == s2)
    s2.general_default_terminal = "whatever"
    log.info(s == s2)
