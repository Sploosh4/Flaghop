"""
Shared Nmap XML import entrypoint used by the desktop/web workspace and shared execution core.
"""

from app.importers.NmapImporter import NmapImporter


def import_nmap_xml_into_project(
    project,
    xml_path: str,
    output: str = "",
    update_progress_observable=None,
    host_repository=None,
):
    repo = host_repository or project.repositoryContainer.hostRepository
    importer = NmapImporter(update_progress_observable, repo)
    importer.setDB(project.database)
    importer.setHostRepository(repo)
    importer.setFilename(xml_path)
    importer.setOutput(str(output or ""))
    importer.run()
    return importer
