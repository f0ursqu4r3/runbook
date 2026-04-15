import type { Page } from "playwright";

import type { Annotation } from "../shared/types.js";

export async function clearAnnotations(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.getElementById("__runbook_overlay__")?.remove();
  });
}

export async function applyAnnotations(page: Page, annotations: Annotation[]): Promise<void> {
  await clearAnnotations(page);

  await page.evaluate((items: Annotation[]) => {
    const tones = {
      accent: {
        line: "#f59e0b",
        glow: "rgba(245, 158, 11, 0.28)",
        panel: "linear-gradient(180deg, rgba(15,23,42,0.96), rgba(30,41,59,0.94))",
        chip: "linear-gradient(135deg, #f59e0b, #fb7185)"
      },
      info: {
        line: "#38bdf8",
        glow: "rgba(56, 189, 248, 0.24)",
        panel: "linear-gradient(180deg, rgba(8,47,73,0.94), rgba(15,23,42,0.96))",
        chip: "linear-gradient(135deg, #38bdf8, #818cf8)"
      },
      neutral: {
        line: "#94a3b8",
        glow: "rgba(148, 163, 184, 0.24)",
        panel: "linear-gradient(180deg, rgba(15,23,42,0.94), rgba(30,41,59,0.94))",
        chip: "linear-gradient(135deg, #94a3b8, #cbd5e1)"
      },
      danger: {
        line: "#fb7185",
        glow: "rgba(251, 113, 133, 0.24)",
        panel: "linear-gradient(180deg, rgba(76,5,25,0.94), rgba(15,23,42,0.96))",
        chip: "linear-gradient(135deg, #fb7185, #f43f5e)"
      }
    } as const;

    const overlay = document.createElement("div");
    overlay.id = "__runbook_overlay__";
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      zIndex: "2147483647",
      pointerEvents: "none",
      overflow: "hidden",
      fontFamily:
        'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    });

    const wash = document.createElement("div");
    Object.assign(wash.style, {
      position: "absolute",
      inset: "0",
      background:
        "radial-gradient(circle at top left, rgba(255,255,255,0.14), transparent 26%), linear-gradient(180deg, rgba(15,23,42,0.03), rgba(15,23,42,0.08))"
    });
    overlay.append(wash);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", String(window.innerWidth));
    svg.setAttribute("height", String(window.innerHeight));
    svg.setAttribute("viewBox", `0 0 ${window.innerWidth} ${window.innerHeight}`);
    Object.assign(svg.style, {
      position: "absolute",
      inset: "0",
      overflow: "visible"
    });

    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    filter.setAttribute("id", "runbook-soft-glow");
    filter.setAttribute("x", "-50%");
    filter.setAttribute("y", "-50%");
    filter.setAttribute("width", "200%");
    filter.setAttribute("height", "200%");
    const blur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
    blur.setAttribute("stdDeviation", "6");
    filter.append(blur);
    defs.append(filter);
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", "runbook-arrowhead");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "10");
    marker.setAttribute("refX", "7");
    marker.setAttribute("refY", "3.5");
    marker.setAttribute("orient", "auto");
    const arrowHead = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arrowHead.setAttribute("d", "M0,0 L0,7 L8,3.5 z");
    arrowHead.setAttribute("fill", "#f59e0b");
    marker.append(arrowHead);
    defs.append(marker);
    svg.append(defs);

    const makePanel = (
      toneKey: keyof typeof tones,
      x: number,
      y: number,
      title: string | undefined,
      text: string | undefined,
      kicker: string | undefined
    ) => {
      const theme = tones[toneKey];
      const panel = document.createElement("div");
      Object.assign(panel.style, {
        position: "absolute",
        left: `${x}px`,
        top: `${y}px`,
        maxWidth: "240px",
        padding: "12px 14px 13px",
        borderRadius: "18px",
        background: theme.panel,
        border: "1px solid rgba(255,255,255,0.16)",
        color: "#fff",
        boxShadow: `0 20px 40px rgba(15, 23, 42, 0.24), 0 0 0 1px ${theme.glow}`,
        backdropFilter: "blur(10px)"
      });

      if (kicker) {
        const chip = document.createElement("div");
        chip.textContent = kicker;
        Object.assign(chip.style, {
          display: "inline-flex",
          alignItems: "center",
          marginBottom: "8px",
          padding: "5px 8px",
          borderRadius: "999px",
          background: theme.chip,
          fontSize: "10px",
          fontWeight: "800",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#fff"
        });
        panel.append(chip);
      }

      if (title) {
        const heading = document.createElement("div");
        heading.textContent = title;
        Object.assign(heading.style, {
          fontSize: "13px",
          fontWeight: "800",
          letterSpacing: "-0.01em",
          lineHeight: "1.25"
        });
        panel.append(heading);
      }

      if (text) {
        const body = document.createElement("div");
        body.textContent = text;
        Object.assign(body.style, {
          marginTop: title ? "4px" : "0",
          fontSize: "12px",
          lineHeight: "1.45",
          color: "rgba(255,255,255,0.78)"
        });
        panel.append(body);
      }

      overlay.append(panel);
      return panel;
    };

    const positionForSide = (
      rect: { left: number; top: number; right: number; bottom: number; width: number; height: number },
      side: "top" | "right" | "bottom" | "left"
    ) => {
      switch (side) {
        case "left":
          return { x: rect.left - 180, y: rect.top + rect.height / 2 - 18 };
        case "right":
          return { x: rect.right + 16, y: rect.top + rect.height / 2 - 18 };
        case "bottom":
          return { x: rect.left, y: rect.bottom + 16 };
        case "top":
        default:
          return { x: rect.left, y: rect.top - 48 };
      }
    };

    for (const item of items) {
      const target = document.querySelector(item.target);
      if (!(target instanceof HTMLElement)) {
        throw new Error(`Annotation target not found: ${item.target}`);
      }

      const rect = target.getBoundingClientRect();
      const tone = item.tone ?? "accent";
      const theme = tones[tone];
      const color = item.color ?? theme.line;

      if (item.type === "focus") {
        const glow = document.createElement("div");
        Object.assign(glow.style, {
          position: "absolute",
          left: `${rect.left - 16}px`,
          top: `${rect.top - 16}px`,
          width: `${rect.width + 32}px`,
          height: `${rect.height + 32}px`,
          borderRadius: "24px",
          background: `radial-gradient(circle, ${theme.glow} 0%, rgba(255,255,255,0) 72%)`,
          filter: "blur(10px)"
        });
        overlay.append(glow);
        continue;
      }

      if (item.type === "box") {
        const glow = document.createElement("div");
        Object.assign(glow.style, {
          position: "absolute",
          left: `${rect.left - 16}px`,
          top: `${rect.top - 16}px`,
          width: `${rect.width + 32}px`,
          height: `${rect.height + 32}px`,
          borderRadius: "24px",
          background: `radial-gradient(circle, ${theme.glow} 0%, rgba(255,255,255,0) 72%)`,
          filter: "blur(12px)"
        });
        overlay.append(glow);

        const box = document.createElement("div");
        Object.assign(box.style, {
          position: "absolute",
          left: `${rect.left - 8}px`,
          top: `${rect.top - 8}px`,
          width: `${rect.width + 16}px`,
          height: `${rect.height + 16}px`,
          border: `2px solid ${color}`,
          borderRadius: "18px",
          background: "rgba(255,255,255,0.08)",
          boxShadow: `0 0 0 1px rgba(255,255,255,0.28) inset, 0 18px 40px ${theme.glow}`
        });
        overlay.append(box);
        continue;
      }

      if (item.type === "redact") {
        const redact = document.createElement("div");
        Object.assign(redact.style, {
          position: "absolute",
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          borderRadius: "10px",
          background:
            "repeating-linear-gradient(-45deg, rgba(15,23,42,0.94), rgba(15,23,42,0.94) 10px, rgba(30,41,59,0.94) 10px, rgba(30,41,59,0.94) 20px)",
          boxShadow: "0 8px 24px rgba(15,23,42,0.2)"
        });
        overlay.append(redact);
        continue;
      }

      if (item.type === "step") {
        const badge = document.createElement("div");
        badge.textContent = String(item.number ?? 1);
        Object.assign(badge.style, {
          position: "absolute",
          left: `${rect.left - 14}px`,
          top: `${rect.top - 14}px`,
          width: "38px",
          height: "38px",
          borderRadius: "999px",
          display: "grid",
          placeItems: "center",
          background: theme.chip,
          color: "#fff",
          fontSize: "15px",
          fontWeight: "700",
          border: "2px solid rgba(255,255,255,0.92)",
          boxShadow: `0 16px 28px ${theme.glow}`
        });
        overlay.append(badge);
        continue;
      }

      if (item.type === "label") {
        const position = positionForSide(rect, item.side ?? "top");
        makePanel(
          tone,
          position.x,
          position.y,
          item.title ?? item.label,
          item.text,
          item.title ? "Note" : undefined
        );
        continue;
      }

      if (item.type === "arrow") {
        const side = item.side ?? "right";
        const bubblePosition = positionForSide(rect, side);
        const panel = makePanel(
          tone,
          bubblePosition.x,
          bubblePosition.y,
          item.title ?? item.label,
          item.text,
          "Action"
        );

        const panelRect = panel.getBoundingClientRect();
        let x1 = panelRect.left + panelRect.width / 2;
        let y1 = panelRect.top + panelRect.height / 2;
        const x2 = rect.left + rect.width / 2;
        const y2 = rect.top + rect.height / 2;

        if (side === "left") {
          x1 = panelRect.right;
          y1 = panelRect.top + panelRect.height / 2;
        } else if (side === "right") {
          x1 = panelRect.left;
          y1 = panelRect.top + panelRect.height / 2;
        } else if (side === "top") {
          x1 = panelRect.left + panelRect.width / 2;
          y1 = panelRect.bottom;
        } else {
          x1 = panelRect.left + panelRect.width / 2;
          y1 = panelRect.top;
        }

        const cx = side === "left" || side === "right" ? (x1 + x2) / 2 : x1;
        const cy = side === "top" || side === "bottom" ? (y1 + y2) / 2 : y1;

        const glowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        glowPath.setAttribute("d", `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
        glowPath.setAttribute("fill", "none");
        glowPath.setAttribute("stroke", theme.glow);
        glowPath.setAttribute("stroke-width", "10");
        glowPath.setAttribute("stroke-linecap", "round");
        glowPath.setAttribute("filter", "url(#runbook-soft-glow)");
        svg.append(glowPath);

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", color);
        path.setAttribute("stroke-width", "3.5");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("marker-end", "url(#runbook-arrowhead)");
        svg.append(path);
      }
    }

    overlay.append(svg);
    document.body.append(overlay);
  }, annotations);
}
