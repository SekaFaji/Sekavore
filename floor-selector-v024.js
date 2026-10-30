// Floor Select navigation model. UI only; never adjusts ore, floor progress, or saves.
export const FLOORS_PER_WORLD=10;
export function worldForFloor(floor){return Math.max(1,Math.floor((Math.max(1,Math.floor(floor))-1)/FLOORS_PER_WORLD)+1);}
export function worldBounds(world){const first=(Math.max(1,Math.floor(world))-1)*FLOORS_PER_WORLD+1;return {first,last:first+FLOORS_PER_WORLD-1};}
export function highestSelectableFloor(game,deepestCleared){
 const highest=Math.max(1,Math.floor(game.highestFloor||1));
 return highest+((game.floor===highest&&deepestCleared)?1:0);
}
export function worldTabs(game,deepestCleared){
 const limit=highestSelectableFloor(game,deepestCleared);
 const count=Math.max(4,worldForFloor(limit));
 return Array.from({length:count},(_,i)=>({world:i+1,unlocked:worldBounds(i+1).first<=limit}));
}
export function floorPairs(world){
 const {first}=worldBounds(world);
 return Array.from({length:5},(_,i)=>({left:first+i*2,right:first+i*2+1,zone:i<4?'STONE':'MAGMA'}));
}
export function isFloorSelectable(game,floor,deepestCleared){
 return Number.isSafeInteger(floor)&&floor>=1&&floor<=highestSelectableFloor(game,deepestCleared);
}
