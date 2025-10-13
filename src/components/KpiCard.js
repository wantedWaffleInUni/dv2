export function kpiCard({label, value, note=""}) {
  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `<div style="font-size:12px;color:#6b7280">${label}</div>
                   <div style="font-size:28px;font-weight:700">${value ?? "—"}</div>
                   <div style="font-size:12px;color:#9ca3af">${note}</div>`;
  return div;
}

