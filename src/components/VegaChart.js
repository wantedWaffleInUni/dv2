import vegaEmbed from "vega-embed";

export async function renderVega(selector, spec, opts = {}) {
  const el = document.querySelector(selector);
  if (!el) return;
  return vegaEmbed(el, spec, { actions: false, ...opts });
}

