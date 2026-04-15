export function defineFlow(meta, run) {
  const normalizeTarget = (targetOrTargets) =>
    Array.isArray(targetOrTargets)
      ? { target: targetOrTargets[0], targets: targetOrTargets }
      : { target: targetOrTargets };

  const ui = {
    focus(targetOrTargets, options = {}) {
      return { type: "focus", ...normalizeTarget(targetOrTargets), ...options };
    },
    box(targetOrTargets, options = {}) {
      return { type: "box", ...normalizeTarget(targetOrTargets), ...options };
    },
    step(target, number, options = {}) {
      return { type: "step", target, number, ...options };
    },
    callout(targetOrTargets, options = {}) {
      return { type: "label", ...normalizeTarget(targetOrTargets), ...options };
    },
    arrow(targetOrTargets, options = {}) {
      return { type: "arrow", ...normalizeTarget(targetOrTargets), ...options };
    },
    redact(target, options = {}) {
      return { type: "redact", target, ...options };
    }
  };

  return {
    meta,
    default: async (ctx) => {
      const authoringContext = {
        ...ctx,
        ui,
        async render(html, stepName = "Render fixture") {
          await ctx.step(stepName, async () => {
            await ctx.page.setContent(html, { waitUntil: "load" });
          });
        },
        async capture(id, annotations = [], options = {}) {
          const resolved =
            typeof annotations === "function" ? annotations(ui) : annotations;

          const { dim, dimOpacity, ...shotOptions } = options;

          if (resolved.length > 0) {
            await ctx.annotate(resolved, { dim, dimOpacity });
          } else {
            await ctx.clearAnnotations();
          }
          await ctx.shot(id, shotOptions);
        }
      };

      await run(authoringContext);
    }
  };
}
