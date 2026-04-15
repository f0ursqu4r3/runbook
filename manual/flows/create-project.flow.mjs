import { createProjectHtml, settingsSaveHtml } from "../fixtures/sample-app.mjs";

export const meta = {
  id: "create-project",
  screenshots: ["create-project", "settings-save"]
};

export default async function createProjectFlow(ctx) {
  await ctx.step("Open project creation view", async () => {
    await ctx.page.setContent(createProjectHtml(), { waitUntil: "load" });
  });

  await ctx.annotate([
    { type: "box", target: "[data-testid='project-form']" },
    { type: "step", target: "[data-testid='project-name']", number: 1 },
    {
      type: "arrow",
      target: "[data-testid='create-project']",
      label: "Create the new workspace",
      side: "bottom"
    }
  ]);
  await ctx.shot("create-project");

  await ctx.step("Open settings detail", async () => {
    await ctx.page.setContent(settingsSaveHtml(), { waitUntil: "load" });
  });

  await ctx.annotate([
    { type: "box", target: "[data-testid='settings-panel']" },
    { type: "step", target: "[data-testid='org-name']", number: 1 },
    {
      type: "arrow",
      target: "[data-testid='save-settings']",
      label: "Save changes",
      side: "right"
    }
  ]);
  await ctx.shot("settings-save");
}
