import { loginScreenHtml } from "../fixtures/sample-app.mjs";
import { defineFlow } from "./_flow-helpers.mjs";

export default defineFlow({
  id: "login",
  screenshots: ["login-screen"]
}, async (flow) => {
  await flow.render(loginScreenHtml(), "Render login screen");
  await flow.capture("login-screen", (ui) => [
    ui.focus("[data-testid='login-card']", { tone: "accent" }),
    ui.box("[data-testid='login-card']", { tone: "accent" }),
    ui.step("[data-testid='email']", 1, { tone: "info" }),
    ui.callout("[data-testid='password']", {
      title: "Seeded Credentials",
      text: "Use the deterministic account values before every release build.",
      side: "top",
      tone: "info"
    }),
    ui.arrow("[data-testid='submit']", {
      title: "Sign In",
      text: "Enter the workspace and continue the documented flow.",
      side: "right",
      tone: "accent"
    })
  ]);
});
