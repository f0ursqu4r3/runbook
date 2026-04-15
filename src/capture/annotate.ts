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
        glow: "rgba(245, 158, 11, 0.12)",
        panel: "rgba(15,23,42,0.92)",
        chip: "#f59e0b"
      },
      info: {
        line: "#38bdf8",
        glow: "rgba(56, 189, 248, 0.1)",
        panel: "rgba(15,23,42,0.92)",
        chip: "#38bdf8"
      },
      neutral: {
        line: "#94a3b8",
        glow: "rgba(148, 163, 184, 0.1)",
        panel: "rgba(15,23,42,0.9)",
        chip: "#64748b"
      },
      danger: {
        line: "#fb7185",
        glow: "rgba(251, 113, 133, 0.1)",
        panel: "rgba(76,5,25,0.9)",
        chip: "#fb7185"
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
    blur.setAttribute("stdDeviation", "3");
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
        maxWidth: "220px",
        padding: "10px 12px 11px",
        borderRadius: "16px",
        background: theme.panel,
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#fff",
        boxShadow: "0 14px 28px rgba(15, 23, 42, 0.16)",
        backdropFilter: "blur(8px)"
      });

      if (kicker) {
        const chip = document.createElement("div");
        chip.textContent = kicker;
        Object.assign(chip.style, {
          display: "inline-flex",
          alignItems: "center",
          marginBottom: "8px",
          padding: "4px 7px",
          borderRadius: "999px",
          background: theme.chip,
          fontSize: "9px",
          fontWeight: "800",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "#fff"
        });
        panel.append(chip);
      }

      if (title) {
        const heading = document.createElement("div");
        heading.textContent = title;
        Object.assign(heading.style, {
          fontSize: "12px",
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
          fontSize: "11px",
          lineHeight: "1.4",
          color: "rgba(255,255,255,0.76)"
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
          return { x: rect.left - 150, y: rect.top + rect.height / 2 - 26 };
        case "right":
          return { x: rect.right + 16, y: rect.top + rect.height / 2 - 26 };
        case "bottom":
          return { x: rect.left + rect.width / 2 - 86, y: rect.bottom + 16 };
        case "top":
        default:
          return { x: rect.left + rect.width / 2 - 86, y: rect.top - 76 };
      }
    };

    const maybeDrawRail = (
      panelRect: { left: number; top: number; right: number; bottom: number; width: number; height: number },
      rect: { left: number; top: number; right: number; bottom: number; width: number; height: number },
      side: "top" | "right" | "bottom" | "left",
      color: string
    ) => {
      const x1 =
        side === "left"
          ? panelRect.right + 6
          : side === "right"
            ? panelRect.left - 6
            : panelRect.left + panelRect.width / 2;
      const y1 =
        side === "top"
          ? panelRect.bottom + 6
          : side === "bottom"
            ? panelRect.top - 6
            : panelRect.top + panelRect.height / 2;
      const x2 =
        side === "left"
          ? rect.left - 6
          : side === "right"
            ? rect.right + 6
            : rect.left + rect.width / 2;
      const y2 =
        side === "top"
          ? rect.top - 6
          : side === "bottom"
            ? rect.bottom + 6
            : rect.top + rect.height / 2;

      const dx = x2 - x1;
      const dy = y2 - y1;
      const distance = Math.hypot(dx, dy);
      if (distance > 120) {
        return;
      }

      const rail = document.createElementNS("http://www.w3.org/2000/svg", "line");
      rail.setAttribute("x1", String(x1));
      rail.setAttribute("y1", String(y1));
      rail.setAttribute("x2", String(x2));
      rail.setAttribute("y2", String(y2));
      rail.setAttribute("stroke", color);
      rail.setAttribute("stroke-width", "1.5");
      rail.setAttribute("stroke-linecap", "round");
      rail.setAttribute("stroke-opacity", "0.5");
      svg.append(rail);

      const tick = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      tick.setAttribute("cx", String(x2));
      tick.setAttribute("cy", String(y2));
      tick.setAttribute("r", "3");
      tick.setAttribute("fill", color);
      svg.append(tick);
    };

    const resolveRect = (item: Annotation) => {
      const selectors = item.targets?.length ? item.targets : [item.target];
      const elements = selectors.map((selector) => document.querySelector(selector));

      if (elements.some((element) => !(element instanceof HTMLElement))) {
        const missing = selectors.find((selector, index) => !(elements[index] instanceof HTMLElement));
        throw new Error(`Annotation target not found: ${missing}`);
      }

      const rects = elements.map((element) => (element as HTMLElement).getBoundingClientRect());
      const left = Math.min(...rects.map((rect) => rect.left));
      const top = Math.min(...rects.map((rect) => rect.top));
      const right = Math.max(...rects.map((rect) => rect.right));
      const bottom = Math.max(...rects.map((rect) => rect.bottom));

      return {
        left,
        top,
        right,
        bottom,
        width: right - left,
        height: bottom - top
      };
    };

    for (const item of items) {
      const rect = resolveRect(item);
      const tone = item.tone ?? "accent";
      const theme = tones[tone];
      const color = item.color ?? theme.line;

      if (item.type === "focus") {
        const glow = document.createElement("div");
        Object.assign(glow.style, {
          position: "absolute",
          left: `${rect.left - 10}px`,
          top: `${rect.top - 10}px`,
          width: `${rect.width + 20}px`,
          height: `${rect.height + 20}px`,
          borderRadius: "20px",
          background: `radial-gradient(circle, ${theme.glow} 0%, rgba(255,255,255,0) 72%)`,
          filter: "blur(8px)"
        });
        overlay.append(glow);
        continue;
      }

      if (item.type === "box") {
        const box = document.createElement("div");
        Object.assign(box.style, {
          position: "absolute",
          left: `${rect.left - 6}px`,
          top: `${rect.top - 6}px`,
          width: `${rect.width + 12}px`,
          height: `${rect.height + 12}px`,
          border: `2px solid ${color}`,
          borderRadius: "16px",
          background: "rgba(255,255,255,0.03)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.4) inset"
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
          boxShadow: "0 8px 18px rgba(15, 23, 42, 0.16)"
        });
        overlay.append(badge);
        continue;
      }

      if (item.type === "label") {
        const position = positionForSide(rect, item.side ?? "top");
        const panel = makePanel(
          tone,
          position.x,
          position.y,
          item.title ?? item.label,
          item.text,
          item.title ? "Note" : undefined
        );
        maybeDrawRail(panel.getBoundingClientRect(), rect, item.side ?? "top", color);
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
        maybeDrawRail(panel.getBoundingClientRect(), rect, side, color);
      }
    }

    overlay.append(svg);
    document.body.append(overlay);
  }, annotations);
}
