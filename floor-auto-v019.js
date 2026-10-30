// Sekavore floor automation. Permanent gated feature, independent of cloud or billing.
export const AUTO_FLOOR_OBELISK_GATE=4;
export const AUTO_FLOOR_SKILL_COST=3;
export const SKILL_POINT_GEM_PRICE=125;
export function normalizeFloorAutomation(s){
 if(!Number.isSafeInteger(s.skillPoints)||s.skillPoints<0)s.skillPoints=0;
 s.autoFloorUnlocked=s.autoFloorUnlocked===true;
 s.autoFloor=s.autoFloorUnlocked===true&&s.autoFloor===true;
 return s;
}
export function mayPurchaseAutoFloor(s){
 return s.obeliskLevel>=AUTO_FLOOR_OBELISK_GATE&&!s.autoFloorUnlocked&&s.skillPoints>=AUTO_FLOOR_SKILL_COST;
}
export function purchaseSkillPoint(s){
 normalizeFloorAutomation(s);
 if(s.autoFloorUnlocked||s.obeliskLevel<AUTO_FLOOR_OBELISK_GATE||s.gems<SKILL_POINT_GEM_PRICE)return false;
 s.gems-=SKILL_POINT_GEM_PRICE;s.skillPoints+=1;return true;
}
export function unlockAutoFloor(s){
 normalizeFloorAutomation(s);
 if(!mayPurchaseAutoFloor(s))return false;
 s.skillPoints-=AUTO_FLOOR_SKILL_COST;s.autoFloorUnlocked=true;s.autoFloor=false;return true;
}
export function setAutoFloor(s,enabled){
 normalizeFloorAutomation(s);
 if(!s.autoFloorUnlocked)return false;
 s.autoFloor=Boolean(enabled);return true;
}
export function shouldAutoAdvance(s,canAdvance){
 return s.autoFloorUnlocked===true&&s.autoFloor===true&&Boolean(canAdvance);
}
