export async function loadJSON(path){ return fetch(path).then(r=>r.json()); }
export async function loadCSV(path){
  const txt = await fetch(path).then(r=>r.text());
  const [header, ...lines] = txt.trim().split(/\r?\n/);
  const cols = header.split(",");
  return lines.filter(Boolean).map(line=>{
    const vals = line.split(",");
    return Object.fromEntries(cols.map((c,i)=>[c.trim(), vals[i]?.trim()]));
  });
}

