const baseStyles = `
  :root {
    color-scheme: light;
    --bg: #f8fafc;
    --surface: #ffffff;
    --ink: #0f172a;
    --muted: #64748b;
    --line: #dbe4ee;
    --accent: #d97706;
    --accent-soft: #fff7ed;
  }

  * { box-sizing: border-box; }
  body {
    margin: 0;
    background:
      radial-gradient(circle at top left, rgba(217, 119, 6, 0.14), transparent 28%),
      linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
    color: var(--ink);
    font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .shell {
    min-height: 100vh;
    padding: 48px;
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 28px;
  }

  .sidebar, .panel, .hero, .card {
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(219, 228, 238, 0.95);
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
  }

  .sidebar {
    border-radius: 28px;
    padding: 28px;
  }

  .brand {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.04em;
    margin-bottom: 28px;
  }

  .nav-item {
    padding: 12px 14px;
    border-radius: 14px;
    color: var(--muted);
    margin-bottom: 10px;
  }

  .nav-item.active {
    background: var(--accent-soft);
    color: var(--ink);
    font-weight: 700;
  }

  .main {
    display: grid;
    gap: 24px;
  }

  .hero, .panel, .card {
    border-radius: 28px;
    padding: 28px;
  }

  .eyebrow {
    color: var(--accent);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 12px;
    font-weight: 800;
    margin-bottom: 12px;
  }

  h1, h2, h3, p { margin: 0; }

  .title {
    font-size: 42px;
    line-height: 1;
    letter-spacing: -0.05em;
    margin-bottom: 12px;
  }

  .subtitle {
    color: var(--muted);
    font-size: 16px;
    line-height: 1.5;
    max-width: 780px;
  }

  .grid {
    display: grid;
    gap: 20px;
  }

  .grid.two {
    grid-template-columns: 1.15fr 0.85fr;
  }

  .stat-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-top: 24px;
  }

  .stat {
    background: linear-gradient(180deg, #fff7ed 0%, #ffffff 100%);
    border: 1px solid #fed7aa;
    border-radius: 20px;
    padding: 18px;
  }

  .stat strong {
    display: block;
    font-size: 28px;
    margin-top: 8px;
  }

  .field {
    display: grid;
    gap: 8px;
    margin-bottom: 18px;
  }

  .field label {
    font-size: 13px;
    font-weight: 700;
    color: var(--muted);
  }

  .field input, .field select {
    width: 100%;
    border: 1px solid var(--line);
    background: white;
    border-radius: 16px;
    padding: 14px 16px;
    font-size: 15px;
  }

  .button-row {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 148px;
    padding: 14px 18px;
    border-radius: 999px;
    border: 0;
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0.01em;
  }

  .button.primary {
    background: var(--ink);
    color: white;
  }

  .button.secondary {
    background: #fff;
    color: var(--ink);
    border: 1px solid var(--line);
  }

  .table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 14px;
  }

  .table th, .table td {
    text-align: left;
    padding: 14px 12px;
    border-bottom: 1px solid var(--line);
    font-size: 14px;
  }

  .chip {
    display: inline-flex;
    padding: 6px 10px;
    border-radius: 999px;
    background: #ecfccb;
    color: #3f6212;
    font-size: 12px;
    font-weight: 700;
  }

  .aside-note {
    padding: 18px;
    border-radius: 20px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1d4ed8;
  }
`;

function documentShell(content) {
  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>${baseStyles}</style>
    </head>
    <body>${content}</body>
  </html>`;
}

export function loginScreenHtml() {
  return documentShell(`
    <div class="shell" style="grid-template-columns: 1.05fr 0.95fr; align-items: center;">
      <section class="hero">
        <div class="eyebrow">Executable Documentation</div>
        <h1 class="title">Publish manuals that can prove themselves.</h1>
        <p class="subtitle">Runbook validates the same workflows your release notes describe, then packages the evidence into a shareable manual.</p>
        <div class="stat-row">
          <div class="stat"><span>Captured flows</span><strong>24</strong></div>
          <div class="stat"><span>Release artifacts</span><strong>12</strong></div>
          <div class="stat"><span>Support drift</span><strong>-38%</strong></div>
        </div>
      </section>
      <section class="card" data-testid="login-card" style="max-width: 520px; justify-self: end;">
        <div class="eyebrow">Sign in</div>
        <h2 style="font-size: 30px; letter-spacing: -0.04em; margin-bottom: 10px;">Access the release manual workspace.</h2>
        <p class="subtitle" style="margin-bottom: 24px;">Use the seeded account to verify the authentication path before release.</p>
        <div class="field">
          <label>Email</label>
          <input data-testid="email" value="demo@example.com" />
        </div>
        <div class="field">
          <label>Password</label>
          <input data-testid="password" type="password" value="demo-password" />
        </div>
        <div class="button-row">
          <button class="button primary" data-testid="submit">Sign in</button>
          <button class="button secondary">View latest manual</button>
        </div>
      </section>
    </div>
  `);
}

export function createProjectHtml() {
  return documentShell(`
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">Runbook</div>
        <div class="nav-item">Overview</div>
        <div class="nav-item active">Projects</div>
        <div class="nav-item">Manuals</div>
        <div class="nav-item">Releases</div>
      </aside>
      <main class="main">
        <section class="hero">
          <div class="eyebrow">Projects</div>
          <h1 class="title">Create a release workspace in under a minute.</h1>
          <p class="subtitle">Projects bundle chapters, capture flows, branding, and output settings into a single repeatable manual build.</p>
        </section>
        <section class="grid two">
          <div class="panel" data-testid="project-form">
            <div class="eyebrow">New project</div>
            <div class="field">
              <label>Project name</label>
              <input data-testid="project-name" value="Q2 Product Launch" />
            </div>
            <div class="field">
              <label>Environment</label>
              <select>
                <option selected>Seeded staging</option>
              </select>
            </div>
            <div class="field">
              <label>Manual style</label>
              <select>
                <option selected>Customer-ready PDF</option>
              </select>
            </div>
            <div class="button-row">
              <button class="button primary" data-testid="create-project">Create project</button>
              <button class="button secondary">Cancel</button>
            </div>
          </div>
          <div class="card">
            <div class="eyebrow">Why this matters</div>
            <p class="subtitle">Projects define the deterministic inputs for each manual build: chapters, screenshot IDs, output metadata, and capture runtime defaults.</p>
            <div class="aside-note" style="margin-top: 22px;">
              Every screenshot declared here must be backed by an executable flow before the release artifact can ship.
            </div>
          </div>
        </section>
      </main>
    </div>
  `);
}

export function settingsSaveHtml() {
  return documentShell(`
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">Runbook</div>
        <div class="nav-item">Projects</div>
        <div class="nav-item active">Settings</div>
        <div class="nav-item">Integrations</div>
        <div class="nav-item">Themes</div>
      </aside>
      <main class="main">
        <section class="hero">
          <div class="eyebrow">Settings</div>
          <h1 class="title">Tune manual branding and release metadata.</h1>
          <p class="subtitle">Settings flow through to the cover page, page chrome, and artifact naming for every compiled manual.</p>
        </section>
        <section class="panel" data-testid="settings-panel">
          <div class="grid two">
            <div>
              <div class="field">
                <label>Organization name</label>
                <input data-testid="org-name" value="Northstar Systems" />
              </div>
              <div class="field">
                <label>Primary accent</label>
                <input value="#d97706" />
              </div>
            </div>
            <div>
              <div class="field">
                <label>Footer text</label>
                <input value="Internal release manual" />
              </div>
              <div class="field">
                <label>Version tag</label>
                <input value="v0.1.0" />
              </div>
            </div>
          </div>
          <div class="button-row" style="margin-top: 12px;">
            <button class="button primary" data-testid="save-settings">Save settings</button>
            <button class="button secondary">Preview cover</button>
          </div>
        </section>
      </main>
    </div>
  `);
}

export function manageUsersHtml() {
  return documentShell(`
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">Runbook</div>
        <div class="nav-item">Projects</div>
        <div class="nav-item">Releases</div>
        <div class="nav-item active">Users</div>
        <div class="nav-item">Audit log</div>
      </aside>
      <main class="main">
        <section class="hero">
          <div class="eyebrow">Administration</div>
          <h1 class="title">Manage access without exposing real user data.</h1>
          <p class="subtitle">Admin views usually include dynamic content, so redactions and seeded fixtures keep manual screenshots stable.</p>
        </section>
        <section class="panel" data-testid="users-table">
          <div class="button-row" style="justify-content: space-between;">
            <div>
              <h2 style="font-size: 24px; letter-spacing: -0.04em;">Workspace admins</h2>
              <p class="subtitle" style="margin-top: 6px;">Only administrators can publish release-ready manuals.</p>
            </div>
            <button class="button primary" data-testid="invite-user">Invite user</button>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Casey Jordan</td>
                <td data-testid="user-email">casey.jordan@northstar.example</td>
                <td>Admin</td>
                <td><span class="chip">Active</span></td>
              </tr>
              <tr>
                <td>Morgan Lee</td>
                <td>morgan.lee@northstar.example</td>
                <td>Editor</td>
                <td><span class="chip">Invited</span></td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
    </div>
  `);
}
