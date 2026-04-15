import { manageUsersHtml } from "../fixtures/sample-app.mjs";
import { defineFlow } from "./_flow-helpers.mjs";

export default defineFlow({
  id: "manage-users",
  screenshots: ["manage-users"]
}, async (flow) => {
  await flow.render(manageUsersHtml(), "Render user management");
  await flow.capture(
    "manage-users",
    (ui) => [
      ui.redact("[data-testid='user-email']"),
      ui.step("[data-testid='invite-user']", 1, { tone: "info" }),
      ui.callout("[data-testid='invite-user']", {
        title: "Invite Admin",
        text: "Only administrators should publish release-ready manuals.",
        side: "bottom",
        tone: "neutral"
      })
    ],
    {
      clipTo: "[data-testid='users-table']",
      padding: { top: 72, right: 28, bottom: 128, left: 28 }
    }
  );
});
