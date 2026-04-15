import { manageUsersHtml } from "../fixtures/sample-app.mjs";
import { defineFlow } from "./_flow-helpers.mjs";

export default defineFlow({
  id: "manage-users",
  screenshots: ["manage-users"]
}, async (flow) => {
  await flow.render(manageUsersHtml(), "Render user management");
  await flow.capture("manage-users", [
    { type: "box", target: "[data-testid='users-table']" },
    { type: "redact", target: "[data-testid='user-email']" },
    {
      type: "arrow",
      target: "[data-testid='invite-user']",
      label: "Invite another administrator",
      side: "left"
    }
  ]);
});
