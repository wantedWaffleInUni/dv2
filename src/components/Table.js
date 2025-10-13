export function renderTable(selector, rows, columns) {
  const el = document.querySelector(selector);
  if (!el) return;
  const table = document.createElement("table");
  table.className = "card";
  table.style.width = "100%";
  table.style.borderCollapse = "collapse";
  table.innerHTML = `
    <thead><tr>${columns.map(c=>`<th style="text-align:left;padding:8px;border-bottom:1px solid #eee">${c.label}</th>`).join("")}</tr></thead>
    <tbody>
      ${rows.map(r=>`<tr>${columns.map(c=>`<td style="padding:8px;border-bottom:1px solid #f1f5f9">${r[c.key] ?? ""}</td>`).join("")}</tr>`).join("")}
    </tbody>`;
  el.innerHTML = "";
  el.appendChild(table);
}

