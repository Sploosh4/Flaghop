"""Read-only enrollment of managed Hub workspaces outside the legacy root."""
import json
from pathlib import Path


def real_directory(value):
    if not isinstance(value, str) or not value or not Path(value).is_absolute():
        raise ValueError('Workspace folder must be an absolute path')
    path = Path(value)
    if any(part.is_symlink() for part in (path, *path.parents)):
        raise ValueError('Workspace folder cannot contain symlinks')
    path = path.resolve(strict=True)
    if not path.is_dir():
        raise ValueError('Workspace folder is not a directory')
    return path


class ProjectCatalogs:
    def __init__(self, paths=()):
        self.paths = tuple(Path(p).absolute() for p in paths)
        self.projects = {}  # canonical folder -> stable Hub ID
        self.errors = {}
        self.refresh()

    def refresh(self):
        candidates, errors = [], {}
        for catalog in self.paths:
            try:
                if any(p.is_symlink() for p in (catalog, *catalog.parents)):
                    raise ValueError('Project catalog cannot contain symlinks')
                data = json.loads(catalog.read_text())
                if not isinstance(data, dict) or not isinstance(data.get('projects'), list):
                    raise ValueError('Project catalog must contain a projects list')
                for index, record in enumerate(data['projects']):
                    if not isinstance(record, dict) or record.get('managed') is not True:
                        continue
                    try:
                        identifier = record.get('id')
                        if not isinstance(identifier, str) or not identifier.strip():
                            raise ValueError('Managed workspace requires a stable project ID')
                        candidates.append((real_directory(record.get('folder')), identifier))
                    except (ValueError, OSError) as error:
                        errors[f'{catalog}#{index}'] = str(error)
            except (OSError, ValueError) as error:
                # Do not retain unknown custom-root enrollments after a corrupt catalog.
                errors[str(catalog)] = str(error)
        by_id, by_path = {}, {}
        for folder, identifier in candidates:
            by_id.setdefault(identifier, set()).add(folder)
            by_path.setdefault(folder, set()).add(identifier)
        projects = {}
        for folder, identifier in candidates:
            if len(by_id[identifier]) != 1 or len(by_path[folder]) != 1:
                errors[f'conflict:{identifier}'] = 'A project ID and folder must identify one workspace'
            else:
                projects[folder] = identifier
        changed = projects != self.projects
        self.projects, self.errors = projects, errors
        return changed
