// Bomb input rules are independent of drones, consumables, and mining art.
// Existing Basic Bomb balance is intentionally unchanged.
export const BOMB_HOLD_INTERVAL_MS=1250;
export function bombSpendCount(charges, mode='single'){
 const available=Number.isFinite(charges)?Math.max(0,Math.floor(charges)):0;
 return mode==='all'?available:Math.min(available,1);
}
export function nextBombHoldAt(when){return when+BOMB_HOLD_INTERVAL_MS;}
