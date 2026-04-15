import { loginScreenHtml } from "../fixtures/sample-app.mjs";

export const meta = {
  id: "login",
  screenshots: ["login-screen"]
};

export default async function loginFlow(ctx) {
  await ctx.step("Render login screen", async () => {
    await ctx.page.setContent(loginScreenHtml(), { waitUntil: "load" });
  });

  await ctx.annotate([
    { type: "box", target: "[data-testid='login-card']" },
    { type: "step", target: "[data-testid='email']", number: 1 },
    { type: "label", target: "[data-testid='password']", text: "Use seeded credentials" },
    {
      type: "arrow",
      target: "[data-testid='submit']",
      label: "Sign in to continue",
      side: "right"
    }
  ]);

  await ctx.shot("login-screen");
}
