import { createProjectHtml, settingsSaveHtml } from "../fixtures/sample-app.mjs";
import { defineFlow } from "./_flow-helpers.mjs";

export default defineFlow({
  id: "create-project",
  screenshots: ["create-project", "settings-save"]
}, async (flow) => {
  await flow.render(createProjectHtml(), "Open project creation view");
  await flow.capture("create-project", [
    { type: "box", target: "[data-testid='project-form']" },
    { type: "step", target: "[data-testid='project-name']", number: 1 },
    {
      type: "arrow",
      target: "[data-testid='create-project']",
      label: "Create the new workspace",
      side: "bottom"
    }
  ]);

  await flow.render(settingsSaveHtml(), "Open settings detail");
  await flow.capture("settings-save", [
    { type: "box", target: "[data-testid='settings-panel']" },
    { type: "step", target: "[data-testid='org-name']", number: 1 },
    {
      type: "arrow",
      target: "[data-testid='save-settings']",
      label: "Save changes",
      side: "right"
    }
  ]);
});
