import { getValue, setText, setValue } from "./dom.js";
/** project view: shared behavior independent of action controllers. */
export function renderProject(project) {
    setText("project-name", project.name || "");
    const projectName = document.getElementById("project-name");
    if (projectName) projectName.dataset.displayName = project.display_name || "";
    setText("project-kind", project.is_temporary ? "temporary" : "saved");
    setText("project-output-folder", project.output_folder || "");
    setText("project-running-folder", project.running_folder || "");

    const currentSavePath = getValue("project-save-path").trim();
    if (!currentSavePath && project.name) {
        setValue("project-save-path", project.name);
    }
}
