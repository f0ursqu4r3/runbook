import { manageUsersHtml } from "../fixtures/sample-app.mjs";

export const meta = {
  id: "manage-users",
  screenshots: ["manage-users"]
};

export default async function manageUsersFlow(ctx) {
  await ctx.step("Render user management", async () => {
    await ctx.page.setContent(manageUsersHtml(), { waitUntil: "load" });
  });

  await ctx.annotate([
    { type: "box", target: "[data-testid='users-table']" },
    { type: "redact", target: "[data-testid='user-email']" },
    {
      type: "arrow",
      target: "[data-testid='invite-user']",
      label: "Invite another administrator",
      side: "left"
    }
  ]);

  await ctx.shot("manage-users");
}
