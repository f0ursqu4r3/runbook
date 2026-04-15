import { createProjectHtml, settingsSaveHtml } from "../fixtures/sample-app.mjs";
import { defineFlow } from "./_flow-helpers.mjs";

export default defineFlow({
  id: "create-project",
  screenshots: ["create-project", "settings-save"]
}, async (flow) => {
  await flow.render(createProjectHtml(), "Open project creation view");
  await flow.capture(
    "create-project",
    (ui) => [
      ui.step("[data-testid='project-name']", 1, { tone: "info" }),
      ui.callout("[data-testid='create-project']", {
        title: "Create Workspace",
        text: "Save the workspace before authors start documenting flows.",
        side: "bottom",
        tone: "neutral"
      })
    ],
    {
      clipTo: "[data-testid='project-form']",
      padding: { top: 28, right: 28, bottom: 90, left: 28 }
    }
  );

  await flow.render(settingsSaveHtml(), "Open settings detail");
  await flow.capture(
    "settings-save",
    (ui) => [
      ui.step("[data-testid='org-name']", 1, { tone: "info" }),
      ui.callout(["[data-testid='org-name']", "[data-testid='save-settings']"], {
        title: "Branding Controls",
        text: "Review the name field, then save the updated brand and version values.",
        side: "bottom",
        tone: "neutral"
      })
    ],
    {
      clipTo: "[data-testid='settings-panel']",
      padding: { top: 28, right: 28, bottom: 120, left: 28 }
    }
  );
});
