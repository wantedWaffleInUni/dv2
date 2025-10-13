export function pct(a,b){ return b ? (Number(a)/Number(b))*100 : 0; }
export function formatNum(n){ return Number(n).toLocaleString("en-MY"); }
export function joinByKey(left, right, keyLeft, keyRight){
  const idx = new Map(right.map(r=>[r[keyRight], r]));
  return left.map(l=> ({ ...l, ...idx.get(l[keyLeft]) }));
}

