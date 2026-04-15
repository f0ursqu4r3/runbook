import type { Annotation } from "../shared/types.js";
import type { Tone, ToneTheme } from "./annotate-themes.js";

export type OverlayPayload = {
  items: Annotation[];
  tones: Record<Tone, ToneTheme>;
};

export function overlayScript(payload: OverlayPayload): void {
  const SVG_NS = "http://www.w3.org/2000/svg";
  const { items, tones } = payload;

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

  const svg = createSvgRoot();
  const defs = document.createElementNS(SVG_NS, "defs");
  defs.append(buildGlowFilter(), buildArrowMarker());
  svg.append(defs);

  type Rect = {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  };

  type Side = "top" | "right" | "bottom" | "left";

  function createSvgRoot(): SVGSVGElement {
    const node = document.createElementNS(SVG_NS, "svg");
    node.setAttribute("width", String(window.innerWidth));
    node.setAttribute("height", String(window.innerHeight));
    node.setAttribute("viewBox", `0 0 ${window.innerWidth} ${window.innerHeight}`);
    Object.assign(node.style, {
      position: "absolute",
      inset: "0",
      overflow: "visible"
    });
    return node;
  }

  function buildGlowFilter(): SVGFilterElement {
    const filter = document.createElementNS(SVG_NS, "filter");
    filter.setAttribute("id", "runbook-soft-glow");
    filter.setAttribute("x", "-50%");
    filter.setAttribute("y", "-50%");
    filter.setAttribute("width", "200%");
    filter.setAttribute("height", "200%");
    const blur = document.createElementNS(SVG_NS, "feGaussianBlur");
    blur.setAttribute("stdDeviation", "3");
    filter.append(blur);
    return filter;
  }

  function buildArrowMarker(): SVGMarkerElement {
    const marker = document.createElementNS(SVG_NS, "marker");
    marker.setAttribute("id", "runbook-arrowhead");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "10");
    marker.setAttribute("refX", "7");
    marker.setAttribute("refY", "3.5");
    marker.setAttribute("orient", "auto");
    const head = document.createElementNS(SVG_NS, "path");
    head.setAttribute("d", "M0,0 L0,7 L8,3.5 z");
    head.setAttribute("fill", "#f59e0b");
    marker.append(head);
    return marker;
  }

  function makePanel(
    toneKey: Tone,
    x: number,
    y: number,
    title: string | undefined,
    text: string | undefined,
    kicker: string | undefined
  ): HTMLElement {
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
  }

  function positionForSide(rect: Rect, side: Side): { x: number; y: number } {
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
  }

  function maybeDrawRail(panelRect: Rect, rect: Rect, side: Side, color: string): void {
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

    const distance = Math.hypot(x2 - x1, y2 - y1);
    if (distance > 120) return;

    const rail = document.createElementNS(SVG_NS, "line");
    rail.setAttribute("x1", String(x1));
    rail.setAttribute("y1", String(y1));
    rail.setAttribute("x2", String(x2));
    rail.setAttribute("y2", String(y2));
    rail.setAttribute("stroke", color);
    rail.setAttribute("stroke-width", "1.5");
    rail.setAttribute("stroke-linecap", "round");
    rail.setAttribute("stroke-opacity", "0.5");
    svg.append(rail);

    const tick = document.createElementNS(SVG_NS, "circle");
    tick.setAttribute("cx", String(x2));
    tick.setAttribute("cy", String(y2));
    tick.setAttribute("r", "3");
    tick.setAttribute("fill", color);
    svg.append(tick);
  }

  function resolveRect(item: Annotation): Rect {
    const selectors = item.targets?.length ? item.targets : [item.target];
    const elements = selectors.map((selector) => document.querySelector(selector));
    if (elements.some((element) => !(element instanceof HTMLElement))) {
      const missing = selectors.find((_, index) => !(elements[index] instanceof HTMLElement));
      throw new Error(`Annotation target not found: ${missing}`);
    }
    const rects = elements.map((element) => (element as HTMLElement).getBoundingClientRect());
    const left = Math.min(...rects.map((r) => r.left));
    const top = Math.min(...rects.map((r) => r.top));
    const right = Math.max(...rects.map((r) => r.right));
    const bottom = Math.max(...rects.map((r) => r.bottom));
    return { left, top, right, bottom, width: right - left, height: bottom - top };
  }

  function renderFocus(rect: Rect, theme: ToneTheme): void {
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
  }

  function renderBox(rect: Rect, color: string): void {
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
  }

  function renderRedact(rect: Rect): void {
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
  }

  function renderStep(rect: Rect, theme: ToneTheme, number: number): void {
    const badge = document.createElement("div");
    badge.textContent = String(number);
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
  }

  for (const item of items) {
    const rect = resolveRect(item);
    const tone: Tone = item.tone ?? "accent";
    const theme = tones[tone];
    const color = item.color ?? theme.line;

    switch (item.type) {
      case "focus":
        renderFocus(rect, theme);
        break;
      case "box":
        renderBox(rect, color);
        break;
      case "redact":
        renderRedact(rect);
        break;
      case "step":
        renderStep(rect, theme, item.number ?? 1);
        break;
      case "label": {
        const side: Side = item.side ?? "top";
        const position = positionForSide(rect, side);
        const panel = makePanel(
          tone,
          position.x,
          position.y,
          item.title ?? item.label,
          item.text,
          item.title ? "Note" : undefined
        );
        maybeDrawRail(panel.getBoundingClientRect(), rect, side, color);
        break;
      }
      case "arrow": {
        const side: Side = item.side ?? "right";
        const position = positionForSide(rect, side);
        const panel = makePanel(
          tone,
          position.x,
          position.y,
          item.title ?? item.label,
          item.text,
          "Action"
        );
        maybeDrawRail(panel.getBoundingClientRect(), rect, side, color);
        break;
      }
    }
  }

  overlay.append(svg);
  document.body.append(overlay);
}
