export function defineFlow(meta, run) {
  return {
    meta,
    default: async (ctx) => {
      const authoringContext = {
        ...ctx,
        async render(html, stepName = "Render fixture") {
          await ctx.step(stepName, async () => {
            await ctx.page.setContent(html, { waitUntil: "load" });
          });
        },
        async capture(id, annotations = [], options = {}) {
          if (annotations.length > 0) {
            await ctx.annotate(annotations);
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
