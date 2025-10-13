const store = { selectedState: null };
const subs = new Set();
export function setSelectedState(s){ store.selectedState = s; subs.forEach(f=>f(store)); }
export function getState(){ return {...store}; }
export function subscribe(fn){ subs.add(fn); return ()=>subs.delete(fn); }

