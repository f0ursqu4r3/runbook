export function defineFlow(meta, run) {
  const ui = {
    focus(target, options = {}) {
      return { type: "focus", target, ...options };
    },
    box(target, options = {}) {
      return { type: "box", target, ...options };
    },
    step(target, number, options = {}) {
      return { type: "step", target, number, ...options };
    },
    callout(target, options = {}) {
      return { type: "label", target, ...options };
    },
    arrow(target, options = {}) {
      return { type: "arrow", target, ...options };
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

          if (resolved.length > 0) {
            await ctx.annotate(resolved);
          } else {
            await ctx.clearAnnotations();
          }
          await ctx.shot(id, options);
        }
      };

      await run(authoringContext);
    }
  };
}
