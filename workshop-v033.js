// Permanent Workshop purchases. Bar types, unlocks and cap are documented.
// Cost quantities are provisional Sekavore balance, not recovered values.
export const WORKSHOP_BASIC_CHAIN={id:'basicChain',name:'Basic & Chain Damage',obelisk:1,cap:22,perLevel:0.5,bars:['mithril','adamant','runite']};
export const WORKSHOP_CATALOG=[
 {id:'plenty',name:'Bomb of Plenty',obelisk:1,bars:['copper','mithril','adamant'],cap:1,detail:'Marks rocks for increased ore output.',implemented:false},
 {...WORKSHOP_BASIC_CHAIN,detail:'+0.5x per level to Basic/Chain bomb damage.',implemented:true},
 {id:'experience',name:'Experience Bomb',obelisk:2,bars:['adamant','runite','citrine'],cap:1,detail:'Marks rocks for increased experience.',implemented:false},
 {id:'chainShots',name:'Chain Bombs Fired',obelisk:2,bars:['adamant','runite','citrine'],cap:18,detail:'Increases chain bombs fired by +1.',implemented:false}
];
export function normalizeWorkshop(save){
 if(!save.workshopUpgrades||typeof save.workshopUpgrades!=='object'||Array.isArray(save.workshopUpgrades))save.workshopUpgrades={};
 const current=save.workshopUpgrades.basicChain;
 save.workshopUpgrades.basicChain=Number.isSafeInteger(current)?Math.min(WORKSHOP_BASIC_CHAIN.cap,Math.max(0,current)):0;
 return save;
}
export function workshopLevel(save,id='basicChain'){
 const level=save?.workshopUpgrades?.[id];return Number.isSafeInteger(level)?Math.max(0,Math.min(WORKSHOP_BASIC_CHAIN.cap,level)):0;
}
export function workshopBombMultiplier(save){return 1+WORKSHOP_BASIC_CHAIN.perLevel*workshopLevel(save);}
export function workshopQuote(save,id='basicChain'){
 const blueprint=WORKSHOP_CATALOG.find(b=>b.id===id);
 if(!blueprint)return null;
 const level=workshopLevel(save,id);
 const qty=level+1;
 const requirements=blueprint.bars.map(bar=>({bar,owned:Math.max(0,Number(save.bars?.[bar]||0)),needed:qty}));
 const maxed=level>=blueprint.cap;
 const unlocked=(save.obeliskLevel||0)>=blueprint.obelisk;
 return {blueprint,level,maxed,unlocked,requirements,prototype:true,canBuy:Boolean(blueprint.implemented&&unlocked&&!maxed&&requirements.every(r=>r.owned>=r.needed))};
}
export function buyWorkshopUpgrade(save,id='basicChain'){
 const q=workshopQuote(save,id);
 if(!q?.canBuy)return false;
 for(const {bar,needed} of q.requirements){if(!Number.isFinite(save.bars[bar])||save.bars[bar]<needed)return false;}
 normalizeWorkshop(save);
 for(const {bar,needed} of q.requirements)save.bars[bar]-=needed;
 save.workshopUpgrades[id]=q.level+1;
 return true;
}
