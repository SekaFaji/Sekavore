// v0.32: permanent-menu presentation and optional Basic Bomb automation.
// Unverified costs and Challenge rewards are displayed but never charged or granted.
export const AUTO_BOMBER_SKILL_COST=10;
export const AUTO_BOMBER_INTERVAL_MS=1250;
export function normalizeAutoBomber(s){
 if(typeof s.autoBomberUnlocked!=='boolean')s.autoBomberUnlocked=false;
 if(typeof s.autoBomberOn!=='boolean')s.autoBomberOn=false;
 if(!s.autoBomberUnlocked)s.autoBomberOn=false;
 return s;
}
export function unlockAutoBomber(s){
 normalizeAutoBomber(s);
 if(s.autoBomberUnlocked||!Number.isSafeInteger(s.skillPoints)||s.skillPoints<10)return false;
 s.skillPoints-=10;s.autoBomberUnlocked=true;return true;
}
export function setAutoBomber(s,on){
 normalizeAutoBomber(s);
 if(!s.autoBomberUnlocked)return false;
 s.autoBomberOn=Boolean(on);return true;
}
export function autoBombReady(s,now,next,canFire){
 return Boolean(s.autoBomberUnlocked&&s.autoBomberOn&&canFire&&now>=next);
}
const row=(name,details,requirement,label='UNAVAILABLE',action='')=>
 '<div class="pm-row"><div class="pm-main"><strong>'+name+'</strong><span>'+details+'</span><small>'+requirement+
 '</small></div><button type="button" class="pm-action" '+(action?'data-act="'+action+'"':'disabled')+'>'+label+'</button></div>';
const intro=(name,details)=>'<div class="pm-summary"><strong>'+name+'</strong><span>'+details+'</span></div>';
const heading=name=>'<div class="pm-subheading">'+name+'</div>';
export function workshopView(s,tab){
 const start=intro('WORKSHOP','Permanent upgrades use crafted bars. Unverified bar prices cannot be purchased.');
 if(tab==='bombs')return start+heading('BOMB BLUEPRINTS')+
  row('Bomb of Plenty','Marks rocks for increased ore output.','Obelisk 1 · material costs unverified')+
  row('Basic & Chain Damage','Raises damage of Basic and Chain bombs.','Obelisk 1 · advanced crafted bars required')+
  row('Experience Bomb','Marks rocks for increased experience.','Obelisk 2 · material costs unverified');
 if(tab==='mining')return start+heading('MINING BLUEPRINTS')+
  row('Pickaxe Damage','Permanent increase to pickaxe damage.','Obelisk 6 · material costs unverified')+
  row('Advanced crafting','More workshop upgrades follow Obelisk progression.','Later worlds and resources required');
 return start+heading('OWNED PROTOTYPE UPGRADES')+
 '<div class="pm-row"><div class="pm-main"><strong>Reinforced Handle</strong><span>Existing Sekavore drone improvement, retained for earlier saves.</span><small>Previously purchased: '+
 Math.max(0,s.dronePoints||0)+' · new purchases paused</small></div><span class="pm-muted">LEGACY</span></div>';
}
export function skillsView(s,tab,floorCost,floorGate,pointPrice){
 const pts=Math.max(0,s.skillPoints||0);
 const start=intro('SKILL TREE',pts+' Skill Points available · permanent across Prestige');
 if(tab==='points')return start+heading('ACQUIRE SKILL POINTS')+
 row('1 Skill Point','Convert '+pointPrice+' Gems into one Skill Point.','Gems owned: '+Math.max(0,s.gems||0),
 'BUY',s.gems>=pointPrice?'skillpoint':'')+
 '<div class="pm-note">Skill shards and other methods of earning points are not yet simulated.</div>';
 const floor=s.autoFloorUnlocked,bomber=s.autoBomberUnlocked;
 return start+heading('FUNCTIONAL NODES')+
 row('Easy Progressor · Auto-Floor','Automatically advances after clearing required waves.',
 floor?'OWNED':floorCost+' points · Obelisk '+floorGate,
 floor?'OWNED':'UNLOCK',!floor&&pts>=floorCost&&s.obeliskLevel>=floorGate?'autounlock':'')+
 row('Auto-Bomber','Optionally fires one Basic Bomb every 1.25 seconds when rocks are present.',
 bomber?'OWNED':'10 points · Skill Tree',
 bomber?'OWNED':'UNLOCK',!bomber&&pts>=10?'autobomber:unlock':'')+
 heading('FUTURE NODES')+
 row('Lucky Strikes','Pickaxe critical chance and damage.','1 point · bonuses unavailable')+
 row('Bigger Blasts','Increase bomb damage.','1 point · bonuses unavailable');
}
export function challengesView(s,tab){
 const start=intro('CHALLENGES','Unlock at Obelisk 10. Completed tasks can award Challenge Coins.');
 if(tab==='next')return start+heading('HISTORICAL CHALLENGE EXAMPLES')+
 row('Reach Magma Zone','Complete a timed floor run after Prestige.','Conditions not tracked')+
 row('Craft 10,000 Tin Bars','Lifetime crafting goal.','Lifetime bar statistics unavailable')+
 row('Reach Floor 18 without upgrades','Complete a restricted mining run.','Upgrade restrictions unavailable')+
 '<div class="pm-note">Early challenge goals changed in the reference; these are historical examples only, not the current sequence.</div>';
 if(tab==='rewards')return start+heading('CHALLENGE REWARD SHOP')+
 row('Bar Upgrade Costs','Permanent resource-cost reduction.','Challenge Coins not enabled')+
 row('Ore Selling','Permanent ore-selling bonus.','Challenge Coins not enabled')+
 row('Bomb Capacity','Permanent charge-cap increase.','Challenge Coins not enabled')+
 '<div class="pm-note">Unverified rewards cannot be claimed or purchased.</div>';
 return start+heading('OBSERVABLE PROGRESS')+
 '<div class="pm-row"><div class="pm-main"><strong>Reached floor</strong><span>Highest achieved</span></div><strong>'+Math.max(1,s.highestFloor||1)+'</strong></div>'+
 '<div class="pm-row"><div class="pm-main"><strong>Gold on hand</strong><span>Not a challenge claim</span></div><strong>'+Math.floor(s.gold||0)+'</strong></div>'+
 '<div class="pm-row"><div class="pm-main"><strong>Prestiges</strong><span>Lifetime resets</span></div><strong>'+Math.floor(s.prestiges||0)+'</strong></div>'+
 '<div class="pm-note">Challenge claims remain unavailable pending verification. The NEXT 3 tab shows historical task examples.</div>';
}
