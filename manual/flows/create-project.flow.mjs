import { createProjectHtml, settingsSaveHtml } from "../fixtures/sample-app.mjs";
import { defineFlow } from "./_flow-helpers.mjs";

export default defineFlow({
  id: "create-project",
  screenshots: ["create-project", "settings-save"]
}, async (flow) => {
  await flow.render(createProjectHtml(), "Open project creation view");
  await flow.capture("create-project", (ui) => [
    ui.focus("[data-testid='project-form']", { tone: "accent" }),
    ui.box("[data-testid='project-form']", { tone: "accent" }),
    ui.step("[data-testid='project-name']", 1, { tone: "info" }),
    ui.callout("[data-testid='project-form']", {
      title: "Project Setup",
      text: "This panel defines the environment, style, and release context for the manual.",
      side: "right",
      tone: "neutral"
    }),
    ui.arrow("[data-testid='create-project']", {
      title: "Create Workspace",
      text: "Persist the release workspace before authors begin writing chapters.",
      side: "bottom",
      tone: "accent"
    })
  ]);

  await flow.render(settingsSaveHtml(), "Open settings detail");
  await flow.capture("settings-save", (ui) => [
    ui.focus("[data-testid='settings-panel']", { tone: "accent" }),
    ui.box("[data-testid='settings-panel']", { tone: "accent" }),
    ui.step("[data-testid='org-name']", 1, { tone: "info" }),
    ui.callout("[data-testid='org-name']", {
      title: "Branding Source",
      text: "Manual metadata and visual identity originate from these settings.",
      side: "top",
      tone: "neutral"
    }),
    ui.arrow("[data-testid='save-settings']", {
      title: "Save Changes",
      text: "Apply the updated brand and version values to future exports.",
      side: "right",
      tone: "accent"
    })
  ]);
});
