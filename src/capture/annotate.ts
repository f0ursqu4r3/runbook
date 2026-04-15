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
    const overlay = document.createElement("div");
    overlay.id = "__runbook_overlay__";
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      zIndex: "2147483647",
      pointerEvents: "none",
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
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", "runbook-arrowhead");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "10");
    marker.setAttribute("refX", "7");
    marker.setAttribute("refY", "3.5");
    marker.setAttribute("orient", "auto");
    const arrowHead = document.createElementNS("http://www.w3.org/2000/svg", "path");
    arrowHead.setAttribute("d", "M0,0 L0,7 L8,3.5 z");
    arrowHead.setAttribute("fill", "#d97706");
    marker.append(arrowHead);
    defs.append(marker);
    svg.append(defs);

    const makeBubble = (text: string, x: number, y: number) => {
      const bubble = document.createElement("div");
      bubble.textContent = text;
      Object.assign(bubble.style, {
        position: "absolute",
        left: `${x}px`,
        top: `${y}px`,
        maxWidth: "220px",
        padding: "8px 10px",
        borderRadius: "999px",
        background: "#0f172a",
        color: "#fff",
        fontSize: "13px",
        fontWeight: "600",
        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.18)"
      });
      overlay.append(bubble);
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
      const color = item.color ?? "#d97706";

      if (item.type === "box") {
        const box = document.createElement("div");
        Object.assign(box.style, {
          position: "absolute",
          left: `${rect.left - 8}px`,
          top: `${rect.top - 8}px`,
          width: `${rect.width + 16}px`,
          height: `${rect.height + 16}px`,
          border: `3px solid ${color}`,
          borderRadius: "16px",
          background: "rgba(217, 119, 6, 0.08)"
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
          borderRadius: "8px",
          background: "#0f172a"
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
          width: "36px",
          height: "36px",
          borderRadius: "999px",
          display: "grid",
          placeItems: "center",
          background: color,
          color: "#fff",
          fontSize: "16px",
          fontWeight: "700",
          border: "3px solid #fff",
          boxShadow: "0 10px 20px rgba(15, 23, 42, 0.18)"
        });
        overlay.append(badge);
        continue;
      }

      if (item.type === "label") {
        const labelText = item.text ?? item.label ?? "";
        const position = positionForSide(rect, item.side ?? "top");
        makeBubble(labelText, position.x, position.y);
        continue;
      }

      if (item.type === "arrow") {
        const side = item.side ?? "right";
        const bubblePosition = positionForSide(rect, side);
        makeBubble(item.label ?? "", bubblePosition.x, bubblePosition.y);

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        let x1 = rect.left + rect.width / 2;
        let y1 = rect.top + rect.height / 2;
        const x2 = rect.left + rect.width / 2;
        const y2 = rect.top + rect.height / 2;

        if (side === "left") {
          x1 = rect.left - 24;
        } else if (side === "right") {
          x1 = rect.right + 24;
        } else if (side === "top") {
          y1 = rect.top - 24;
        } else {
          y1 = rect.bottom + 24;
        }

        line.setAttribute("x1", String(x1));
        line.setAttribute("y1", String(y1));
        line.setAttribute("x2", String(x2));
        line.setAttribute("y2", String(y2));
        line.setAttribute("stroke", color);
        line.setAttribute("stroke-width", "4");
        line.setAttribute("stroke-linecap", "round");
        line.setAttribute("marker-end", "url(#runbook-arrowhead)");
        svg.append(line);
      }
    }

    overlay.append(svg);
    document.body.append(overlay);
  }, annotations);
}
