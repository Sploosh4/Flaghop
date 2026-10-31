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

applicationInfo = {
    "name": "FlagHop",
    "version": "0.7.0",
    "build": "1777505257",
    "author": "Shane Scott",
    "copyright": "2026",
    "links": ["http://github.com/Hackman238/legion/issues"],
    "emails": [],
    "update": "04/29/2026",
    "license": "GPL v3",
    "desc": "FlagHop is a local CTF workspace for reconnaissance, evidence and tool execution.",
    "smallIcon": "./images/icons/flaghop.svg",
    "bigIcon": "./images/icons/flaghop.svg",
}


def getVersion():
    return f"{applicationInfo['version']}-{applicationInfo['build']}"


def getConsoleLogo():
    from pathlib import Path

    return Path(__file__).with_name("flaghopLogo.txt").read_text(encoding="utf-8")
