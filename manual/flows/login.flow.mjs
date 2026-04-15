import { loginScreenHtml } from "../fixtures/sample-app.mjs";
import { defineFlow } from "./_flow-helpers.mjs";

export default defineFlow({
  id: "login",
  screenshots: ["login-screen"]
}, async (flow) => {
  await flow.render(loginScreenHtml(), "Render login screen");
  await flow.capture("login-screen", (ui) => [
    ui.step("[data-testid='email']", 1, { tone: "info" }),
    ui.callout("[data-testid='submit']", {
      title: "Sign In",
      text: "Use the seeded account to enter the workspace.",
      side: "bottom",
      tone: "neutral"
    })
  ]);
});
