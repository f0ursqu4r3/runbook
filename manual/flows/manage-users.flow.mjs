import { manageUsersHtml } from "../fixtures/sample-app.mjs";
import { defineFlow } from "./_flow-helpers.mjs";

export default defineFlow({
  id: "manage-users",
  screenshots: ["manage-users"]
}, async (flow) => {
  await flow.render(manageUsersHtml(), "Render user management");
  await flow.capture("manage-users", (ui) => [
    ui.focus("[data-testid='users-table']", { tone: "neutral" }),
    ui.box("[data-testid='users-table']", { tone: "neutral" }),
    ui.redact("[data-testid='user-email']"),
    ui.callout("[data-testid='user-email']", {
      title: "Redacted",
      text: "Dynamic or sensitive values should be masked before publication.",
      side: "bottom",
      tone: "danger"
    }),
    ui.arrow("[data-testid='invite-user']", {
      title: "Invite Admin",
      text: "Administrative access controls who can publish release-ready manuals.",
      side: "left",
      tone: "accent"
    })
  ]);
});
