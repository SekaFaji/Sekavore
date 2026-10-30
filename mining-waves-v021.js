// Mining population and refresh rules. No rendering or currency calculations.
// The one-wave-at-a-time approach follows reference observations; timing is provisional.
export const WAVE_REFRESH_MS = 1250;
export const FIELD_BOUNDS = Object.freeze({left:50,right:302,top:115,bottom:471});
export function waveSize(floor, quota){
 const n=Math.max(1,Math.floor(Number.isFinite(quota)?quota:(6+floor*3)));
 return Math.min(18,Math.max(6,n));
}
export function createWave(floor, quota, makeRock, random=Math.random){
 const total=waveSize(floor,quota), result=[];
 // Fixed candidate grid plus bounded jitter: no infinite rejection loops or overlapping rocks.
 const positions=[];
 for(let y=0;y<6;y++)for(let x=0;x<4;x++){
  positions.push({x:FIELD_BOUNDS.left+15+x*72,y:FIELD_BOUNDS.top+13+y*65});
 }
 for(let i=0;i<total;i++){
  const j=i+Math.floor(Math.min(.999999999,Math.max(0,random()))*(positions.length-i));
  [positions[i],positions[j]]=[positions[j],positions[i]];
  const p=positions[i];
  const x=p.x+(random()-.5)*18,y=p.y+(random()-.5)*16;
  result.push(makeRock(x,y));
 }
 return result;
}
export function waveIsClear(rocks){return rocks.length===0;}
export function secondsToWave(when,now){return Math.max(0,Math.ceil((when-now)/100)/10);}
