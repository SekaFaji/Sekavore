// Menu availability is independent of navigation and rendering.
// Historical milestone reference; unfinished systems remain previews.
export const HUB_OBELISK_GATES=Object.freeze({
 workshop:1,drones:2,skills:4,challenges:10,contracts:12,cards:15,pets:17,
 construct:19,stars:23,archaeology:30,fishing:37,future:70
});
export const HUB_PREVIEW_IDS=new Set([
 'contracts','cloud','cards','pets','stars','construct','fishing','archaeology','future'
]);
export const HUB_MILESTONES=Object.freeze([
 ['workshop','Workshop'],['drones','Drones'],['skills','Skill Tree'],
 ['challenges','Challenges'],['contracts','Contracts'],['cards','Cards'],
 ['pets','Pets'],['construct','Construct'],['stars','Stargazing'],
 ['archaeology','Archaeology'],['fishing','Fishing'],['future','Locked feature']
]);
export function hubAvailability(id,obeliskLevel=0){
 const gate=HUB_OBELISK_GATES[id]??null;
 const level=Number.isFinite(obeliskLevel)?Math.max(0,obeliskLevel):0;
 const state=gate!==null&&level<gate?'locked':HUB_PREVIEW_IDS.has(id)?'preview':'ready';
 return {id,gate,state,available:state==='ready'};
}
export function hubFeedback(id,label,obeliskLevel=0){
 const availability=hubAvailability(id,obeliskLevel);
 const name=String(label||id).toUpperCase();
 if(availability.state==='locked')return `${name} · UNLOCKS AT OBELISK ${availability.gate}`;
 if(availability.state==='preview')return `${name} · NOT IMPLEMENTED YET`;
 return `${name} · AVAILABLE`;
}
