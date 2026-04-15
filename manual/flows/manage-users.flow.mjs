import { manageUsersHtml } from "../fixtures/sample-app.mjs";
import { defineFlow } from "./_flow-helpers.mjs";

export default defineFlow({
  id: "manage-users",
  screenshots: ["manage-users"]
}, async (flow) => {
  await flow.render(manageUsersHtml(), "Render user management");
  await flow.capture("manage-users", (ui) => [
    ui.redact("[data-testid='user-email']"),
    ui.callout("[data-testid='user-email']", {
      title: "Redacted",
      text: "Sensitive values should be masked before publication.",
      side: "left",
      tone: "danger"
    }),
    ui.callout("[data-testid='invite-user']", {
      title: "Invite Admin",
      text: "Only administrators should publish release-ready manuals.",
      side: "left",
      tone: "neutral"
    })
  ]);
});
