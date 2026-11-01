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

Author(s): Shane Scott (sscott@shanewilliamscott.com), Dmitriy Dubson (d.dubson@gmail.com)
"""

import os
import shutil

from app.Project import Project
from app.logging.legionLog import getAppLogger
from app.tools.ToolCoordinator import ToolCoordinator
from app.shell.Shell import Shell
from app.tools.nmap.NmapPaths import getNmapOutputFolder

log = getAppLogger()


class Logic:
    def __init__(self, shell: Shell, projectManager, toolCoordinator: ToolCoordinator):
        self.projectManager = projectManager
        self.activeProject: Project = None
        self.toolCoordinator = toolCoordinator
        self.shell = shell

    # this flag is matched to the conf file setting, so that we know if we need
    # to delete the found usernames/passwords wordlists on exit

    def copyNmapXMLToOutputFolder(self, file):
        outputFolder = self.activeProject.properties.outputFolder
        try:
            path = getNmapOutputFolder(outputFolder)
            if not os.path.exists(path):
                os.makedirs(path)

            shutil.copy(str(file), path)  # will overwrite if file already exists
        except OSError:
            log.exception("Unable to copy imported XML to the project folder")
            raise

    def createNewTemporaryProject(self) -> None:
        self.activeProject = self.projectManager.createNewProject(projectType="legion", isTemp=True)

    def openExistingProject(self, filename, projectType="legion") -> None:
        self.activeProject = self.projectManager.openExistingProject(projectName=filename, projectType=projectType)

    def saveProjectAs(self, filename, replace=0, projectType="legion") -> bool:
        project = self.projectManager.saveProjectAs(self.activeProject, filename, replace, projectType)
        if project:
            self.activeProject = project
            return True
        return False
