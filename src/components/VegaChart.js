const vegaEmbed =
  (typeof window !== "undefined" && window.vegaEmbed) || null;

export async function renderVega(selector, spec, opts = {}) {
  if (!vegaEmbed) {
    throw new Error(
      "vega-embed is not available on window. Ensure the CDN script is loaded before using renderVega()."
    );
  }

  const el = document.querySelector(selector);
  if (!el) return;
  return vegaEmbed(el, spec, { actions: false, ...opts });
}

