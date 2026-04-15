import { loginScreenHtml } from "../fixtures/sample-app.mjs";
import { defineFlow } from "./_flow-helpers.mjs";

export default defineFlow({
  id: "login",
  screenshots: ["login-screen"]
}, async (flow) => {
  await flow.render(loginScreenHtml(), "Render login screen");
  await flow.capture("login-screen", [
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
});
