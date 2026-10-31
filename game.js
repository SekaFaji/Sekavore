import { ORES,UPGRADE_DEFS,ARTIFACTS,LVL_REQ,upgradeCost,upgradeMaterials,artifactCost,pickDamage,saleMultiplier,damageRoll,bombDamage,oreAtFloor,rockHealth,floorQuota,canNextFloor,moveFloor,travelToFloor,getFloorProgress,awardRock,grantXp,craftBars,sellOre,buyUpgrade,buyArtifact,prestige,availablePrestige,bossTotal,bossArmor,offlineGrant,newGame,isValidSave,handReach,targetsInReach } from './core.js';
import {drawCavernGround,drawCavernRock,recordMiningImpact,drawMiningImpacts} from './mining-art-v018.js';
import {WAVE_REFRESH_MS,createWave,secondsToWave} from './mining-waves-v021.js';
import {AUTO_FLOOR_OBELISK_GATE,AUTO_FLOOR_SKILL_COST,SKILL_POINT_GEM_PRICE,normalizeFloorAutomation,purchaseSkillPoint,unlockAutoFloor,setAutoFloor,shouldAutoAdvance} from './floor-auto-v019.js';
import {worldForFloor,worldTabs,worldBounds,floorPairs,highestSelectableFloor,isFloorSelectable} from './floor-selector-v024.js';
import {bombSpendCount,nextBombHoldAt,BOMB_HOLD_INTERVAL_MS} from './bomb-controls-v025.js';
import {normalizeChests,recordChestDamage,chestStatus,openItemChests} from './chests-v027.js';

const $=id=>document.getElementById(id);const canvas=$('field');let ctx=canvas.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=false;
const SAVE_KEY='deep-mine-research-v2';
const fmt=n=>{if(!Number.isFinite(n))return '0';if(Math.abs(n)<1000)return Math.floor(n).toLocaleString('en-US');const names=['','k','m','b','t','qa','qi','sx'];let ix=Math.min(names.length-1,Math.floor(Math.log10(Math.abs(n))/3));return (n/Math.pow(1000,ix)).toFixed(n/Math.pow(1000,ix)>100?0:2)+names[ix];};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
let game=newGame();try{const raw=localStorage.getItem(SAVE_KEY);if(raw){const parsed=JSON.parse(raw);if(isValidSave(parsed))game=parsed;}}catch(e){console.warn('Save could not be loaded:',e)}
// Save compatibility: v0.2/v0.3 saves do not contain pin preferences.
if(!Array.isArray(game.menuPins)||game.menuPins.length!==3)game.menuPins=['craft','upgrades','sell'];
else if(game.menuPins.join('|')==='upgrades|craft|sell')game.menuPins=['craft','upgrades','sell'];
if(!Number.isFinite(game.bombCharge)||game.bombCharge<0)game.bombCharge=0;
normalizeFloorAutomation(game);
normalizeChests(game);
game.rocksThisFloor=getFloorProgress(game);
let offlineSummary=null;const elapsed=Math.max(0,(Date.now()-(game.lastSaved||Date.now()))/1000);if(elapsed>20){offlineSummary=offlineGrant(game,elapsed);}game.lastSaved=Date.now();
let droneMotion={x:180,y:147,targetId:null,ready:false,flashUntil:0,lastImpact:null},hand={x:182,y:303,held:false,lastSwing:-1e6,swingUntil:0},selectedRock=null,currentMenu=null,craftBatch=1,toastUntil=0,bossFight=null,particles=[],rockId=1,rocks=[],time=0,lastTick=performance.now(),lastAttack=0,holdRock=null,holdPoint=null,holdStart=0,droneClock=0,autoClock=0,bombClock=0,frames=0,painted=0;
const BOMB_RECHARGE_SECONDS=9;
let lastBombTick=performance.now();
let bombHeld=false,bombNextHoldAt=0;
const secs=s=>s<=0?'READY':s<60?s.toFixed(1)+'s':Math.floor(s/60)+'m '+(s%60).toFixed(0).padStart(2,'0')+'s';
function bombRechargeInfo(){const cap=Math.max(0,game.bombMax||0),charges=Math.max(0,Math.min(cap,game.bombs||0));if(!cap||charges>=cap)return {charges,cap,remaining:0,full:0,progress:100,rate:BOMB_RECHARGE_SECONDS};const progress=Math.min(BOMB_RECHARGE_SECONDS,Math.max(0,game.bombCharge||0)),remaining=Math.max(0,BOMB_RECHARGE_SECONDS-progress);return {charges,cap,remaining,full:remaining+Math.max(0,cap-charges-1)*BOMB_RECHARGE_SECONDS,progress:100*progress/BOMB_RECHARGE_SECONDS,rate:BOMB_RECHARGE_SECONDS};}
function advanceBombRecharge(delta){if(game.bombs>=game.bombMax){game.bombCharge=0;return;}game.bombCharge=Math.max(0,(game.bombCharge||0)+Math.max(0,delta));while(game.bombs<game.bombMax&&game.bombCharge>=BOMB_RECHARGE_SECONDS){game.bombs++;game.bombCharge-=BOMB_RECHARGE_SECONDS;}if(game.bombs>=game.bombMax)game.bombCharge=0;}

function save(){game.lastSaved=Date.now();try{localStorage.setItem(SAVE_KEY,JSON.stringify(game));}catch(e){notice('Browser storage blocked — use Export Save.');}}
function eventLog(message){game.log.unshift({t:Date.now(),text:message});game.log=game.log.slice(0,80);}
function notice(message){const el=$('toast');el.textContent=message;el.classList.add('show');toastUntil=performance.now()+2500;}
function playSfx(kind='hit'){if(!game.settings.sound)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;if(!window.audioContext)window.audioContext=new AC();const ac=window.audioContext;const osc=ac.createOscillator(),gain=ac.createGain();osc.type=kind==='bomb'?'sawtooth':kind==='success'?'triangle':'square';osc.frequency.setValueAtTime(kind==='bomb'?70:kind==='success'?740:170,ac.currentTime);osc.frequency.exponentialRampToValueAtTime(kind==='bomb'?42:kind==='success'?480:85,ac.currentTime+.12);gain.gain.setValueAtTime(.045,ac.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.14);osc.connect(gain);gain.connect(ac.destination);osc.start();osc.stop(ac.currentTime+.16);}catch{}}
let nextWaveAt=0,waveNumber=0;
function spawnRocks(){
 nextWaveAt=0;rocks=createWave(game.floor,floorQuota(game.floor),(x,y)=>{
  const ore=oreAtFloor(game.floor),hp=rockHealth(game.floor)*(.65+Math.random()*.75);
  return {id:rockId++,x,y,ore:ore.id,hp,max:hp,variant:Math.floor(Math.random()*4),size:13+Math.random()*4};
 });
 waveNumber++;selectedRock=null;droneMotion.targetId=null;droneMotion.ready=false;
}
function advanceCompletedFloors(){
 if(!game.autoFloor||!game.autoFloorUnlocked)return false;
 let advanced=false,steps=0;
 while(steps++<100&&shouldAutoAdvance(game,canNextFloor(game))&&travelToFloor(game,game.floor+1))advanced=true;
 if(advanced){spawnRocks();notice('AUTO DESCENDED TO FLOOR '+game.floor);eventLog('Auto floor: '+game.floor);save();}
 return advanced;
}
function processWaveRefresh(now=performance.now()){
 if(!bossFight&&!rocks.length&&nextWaveAt&&now>=nextWaveAt){spawnRocks();updateHud();}
}
spawnRocks();
function spark(x,y,label,color='#fff3db',qty=1){if(particles.length>110)particles.splice(0,10);particles.push({x,y,label,color,ttl:0.9,dx:(Math.random()-.5)*28,dy:-26-Math.random()*18});for(let i=0;i<qty;i++)particles.push({x:x+(Math.random()-.5)*12,y:y+(Math.random()-.5)*8,label:null,color,ttl:.30+Math.random()*.25,dx:(Math.random()-.5)*38,dy:(Math.random()-.5)*47});}
function mineRock(rock,mode='tap',power=1){
 if(!rock||!rocks.includes(rock)||bossFight)return;
 const dmg=mode==='drone'?Math.max(1,Math.round(pickDamage(game)*(.6+.2*game.droneLevel+.10*game.dronePoints))):Math.round(damageRoll(game)*power);
 const appliedDamage=Math.min(Math.max(0,rock.hp),Math.max(0,dmg));
 const gainedChests=recordChestDamage(game,appliedDamage);
 if(gainedChests.item||gainedChests.relic){eventLog('Chest meter rewards: '+gainedChests.item+' item, '+gainedChests.relic+' relic');}
 rock.hp-=dmg;recordMiningImpact(rock.x,rock.y,(ORES.find(o=>o.id===rock.ore)||ORES[0]).color,rock.hp<=0);
 spark(rock.x,rock.y-8,fmt(dmg),dmg>pickDamage(game)?'#ffdb67':'#f1efde',1);
 if(mode==='tap'){game.totalClicks++;playSfx('hit');}
 if(rock.hp>0)return;
 if(selectedRock===rock)selectedRock=null;
 const wasCleared=canNextFloor(game),ore=ORES.find(o=>o.id===rock.ore)||ORES[0];
 const amt=(Math.random()<.03*(game.upgrades.multirock||0))?2:1;
 awardRock(game,ore,amt);spark(rock.x,rock.y,'+'+amt+' '+ore.name,'#8ce7c0',4);
 rocks.splice(rocks.indexOf(rock),1);
 if(game.rocksBroken%13===0){game.gems+=1;spark(rock.x,rock.y-23,'+1 ◆','#49d8f2',4);}
 if(canNextFloor(game)&&advanceCompletedFloors()){save();return;}
 if(!wasCleared&&canNextFloor(game))notice('FLOOR CLEARED! ▲ TO DESCEND');
 if(rocks.length===0){nextWaveAt=performance.now()+WAVE_REFRESH_MS;droneMotion.targetId=null;}
 save();
}
// One sweep hits every rock inside the hand's radius; it never locks to a single rock.
function swingHand(x=hand.x,y=hand.y){
 if(currentMenu||bossFight)return 0;
 hand.x=Math.max(18,Math.min(342,x));hand.y=Math.max(42,Math.min(560,y));
 hand.lastSwing=performance.now();hand.swingUntil=hand.lastSwing+165;
 const hit=targetsInReach([...rocks],hand.x,hand.y,handReach(game));
 selectedRock=hit.length?hit.sort((a,b)=>Math.hypot(a.x-hand.x,a.y-hand.y)-Math.hypot(b.x-hand.x,b.y-hand.y))[0]:null;
 game.totalClicks++;playSfx('hit');
 for(const rock of hit){if(rocks.includes(rock))mineRock(rock,'hand');}
 updateTarget();return hit.length;
}
// Pixel-drawn original cursor/glove and reachable area; remains visible while idle.
function drawHand(){
 const x=Math.round(hand.x),y=Math.round(hand.y),r=handReach(game),active=hand.held||performance.now()<hand.swingUntil;
 ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=active?'#edcb4c14':'#d8bd6b09';ctx.fill();
 ctx.strokeStyle=active?'#ffdf83a6':'#e3d2a340';ctx.lineWidth=active?2:1;ctx.setLineDash([4,5]);ctx.stroke();ctx.setLineDash([]);
 // The hand is intentionally translucent; its circular reach is drawn separately.
 ctx.globalAlpha=.72;
 ctx.translate(Math.round(x+15),Math.round(y-21));ctx.scale(1.2,1.2);
 const pix=(px,py,w,h,col)=>{ctx.fillStyle=col;ctx.fillRect(px,py,w,h);};
 // Small gold mitten, distinct from any reference artwork.
 pix(-10,-2,24,20,'#201a27');pix(-14,-8,9,22,'#201a27');pix(-7,-13,8,16,'#201a27');pix(1,-16,8,18,'#201a27');pix(9,-12,8,15,'#201a27');
 pix(-12,-6,6,17,'#b67337');pix(-5,-10,6,15,'#ecc56e');pix(3,-13,5,17,'#f9dc80');pix(11,-9,4,13,'#dbac4b');
 pix(-8,4,21,11,'#efc36c');pix(-7,6,7,6,'#fff0a0');pix(5,7,7,6,'#d98c36');
 pix(-6,15,17,7,'#804b3a');pix(-6,16,15,3,'#ffdd74');
 ctx.restore();
}
function changeFloor(direction){const old=game.floor;if(direction>0&&!canNextFloor(game)&&game.floor>=game.highestFloor){notice('MINE '+Math.max(0,floorQuota(game.floor)-game.rocksThisFloor)+' MORE ROCKS TO DESCEND');return;}if(moveFloor(game,direction)){spawnRocks();notice('FLOOR '+game.floor);save();}else notice(direction<0?'ALREADY AT FIRST FLOOR':'FLOOR NOT CLEARED');}
function detonate(mode='single'){
 if(bossFight){notice('BOMBS CANNOT DAMAGE THE OBELISK');return 0;}
 const count=bombSpendCount(game.bombs,mode);
 if(!count){notice('BOMBS RECHARGING');return 0;}
 if(!rocks.length){notice('WAIT FOR THE NEXT ROCK WAVE');return 0;}
 game.bombs-=count;
 // All charges hit the currently visible wave; they never skip to future waves.
 const power=Math.max(1,bombDamage(game)/Math.max(1,pickDamage(game)))*count;
 playSfx('bomb');for(const r of [...rocks])if(rocks.includes(r))mineRock(r,'blast',power);
 for(let i=0;i<Math.min(22,10+count*2);i++)spark(35+Math.random()*275,130+Math.random()*290,'','#f5a351',1);
 notice(mode==='all'?'FIRED '+count+' BASIC BOMBS':'BASIC BOMB — AREA DAMAGE');
 save();updateHud();return count;
}
// One visual drone and one mining target. Damage occurs only after it reaches that rock.
function nearestDroneRock(){return rocks.reduce((best,r)=>!best||((r.x-droneMotion.x)**2+(r.y-22-droneMotion.y)**2)<((best.x-droneMotion.x)**2+(best.y-22-droneMotion.y)**2)?r:best,null);}
function advanceDrone(dt){
 if(!game.drone||bossFight)return;
 let target=rocks.find(r=>r.id===droneMotion.targetId);
 if(!target){target=nearestDroneRock();droneMotion.targetId=target?.id??null;}
 if(!target)return;
 const dx=target.x-droneMotion.x,dy=target.y-23-droneMotion.y,dist=Math.hypot(dx,dy);
 const step=Math.min(dist,Math.max(0,dt)*185);
 if(dist>0){droneMotion.x+=dx/dist*step;droneMotion.y+=dy/dist*step;}
 if(dist<=14+step&&droneMotion.ready){
  droneMotion.ready=false;
  droneMotion.x=target.x;droneMotion.y=target.y-23;
  droneMotion.lastImpact={id:target.id,x:target.x,y:target.y,at:performance.now()};
  droneMotion.flashUntil=performance.now()+270;
  mineRock(target,'drone');
  if(!rocks.includes(target))droneMotion.targetId=null;
 }
}

function bossMax(){return bossTotal(game.obeliskLevel)}
function startBoss(){if(bossFight)return;const remaining=Math.max(0,Math.ceil((game.bossReadyAt-Date.now())/1000));if(remaining>0){notice('OBELISK READY IN '+remaining+'s');return;}bossFight={end:performance.now()+30000,damage:0};selectedRock=null;closeMenu();notice('OBELISK ENCOUNTER — 30 SEC');save();}
function attackObelisk(raw,blast=false){if(!bossFight)return;const actual=Math.max(0,raw-bossArmor(game.obeliskLevel));if(!actual){spark(185,290,'BLOCKED','#db9ca0');return;}game.bossRemaining=Math.max(0,game.bossRemaining-actual);bossFight.damage+=actual;spark(185+Math.random()*55-27,285,fmt(actual),blast?'#ffb555':'#f8eae2',5);if(game.bossRemaining<=0){const prev=game.obeliskLevel;game.obeliskLevel++;game.levelCap+=5;game.gems+=50+10*prev;game.bossRemaining=bossTotal(game.obeliskLevel);game.bossReadyAt=Date.now()+15000;bossFight=null;eventLog('Defeated Obelisk '+(prev+1)+'; gained gems and +5 level cap');notice('OBELISK DEFEATED! +'+(50+10*prev)+' ◆');playSfx('success');save();setTimeout(()=>openMenu('obelisk'),600);}}
function stopBoss(){if(!bossFight)return;bossFight=null;game.bossReadyAt=Date.now()+45000;save();notice('OBELISK RETREATS — DAMAGE SAVED');}
const col={wall:'#6e7382',wall2:'#4f5567',cave:'#454b5b',cave2:'#343b49',crack:'#2b303d'};
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.floor(x),Math.floor(y),Math.ceil(w),Math.ceil(h));}
function poly(points,color){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();ctx.fill();}
function rand(x,y,k=1){let z=Math.sin((x*127.1+y*311.7+k*74.7)*.2)*43758.5453;return z-Math.floor(z)}
// Procedural field visuals live separately from gameplay and economy rules.
function drawGround(){drawCavernGround(ctx,game.floor);}
function drawRock(r){drawCavernRock(ctx,r,ORES);}
function updateTarget(){
 const hud=$('targetHud');
 if(!selectedRock||!rocks.includes(selectedRock)||bossFight){hud.classList.add('hidden');return;}
 const ore=ORES.find(o=>o.id===selectedRock.ore)||ORES[0];
 hud.classList.remove('hidden');$('targetName').textContent=ore.name.toUpperCase()+' ROCK';
 $('targetGem').style.color=ore.color;$('targetHpText').textContent='HP '+Math.max(0,Math.ceil(selectedRock.hp))+' / '+Math.ceil(selectedRock.max);
 $('targetHpFill').style.width=Math.max(0,Math.min(100,selectedRock.hp/selectedRock.max*100))+'%';
}
function drawDrone(){
 const x=Math.round(droneMotion.x),y=Math.round(droneMotion.y+Math.sin(time*5)*2);
 rect(x-12,y+12,25,4,'#111b2399');
 poly([[x-9,y-8],[x+5,y-11],[x+12,y-2],[x+10,y+10],[x-7,y+9],[x-12,y-1]],'#294655');
 rect(x-6,y-7,12,11,'#d1a958');rect(x-3,y-5,6,6,'#5cd9e5');
 rect(x-16,y,6,4,'#8894ac');rect(x+10,y,6,4,'#8894ac');rect(x-6,y+8,4,3,'#e1b45b');
 const impact=droneMotion.lastImpact;
 if(impact&&performance.now()<droneMotion.flashUntil){
  const cx=impact.x,cy=impact.y;
  ctx.save();ctx.strokeStyle='#71f5e2';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y+7);ctx.lineTo(cx,cy);ctx.stroke();ctx.restore();
  rect(cx-9,cy-2,18,3,'#f8e58c');rect(cx-2,cy-10,4,19,'#7affdd');
 }
}
function drawObelisk(){drawGround();rect(29,44,303,62,'#1b2029bd');rect(37,52,286,2,'#9e8d82');txt('HP  '+fmt(game.bossRemaining)+' / '+fmt(bossMax()),180,63,'#baf7b5',12,'center');txt('ARMOR  '+fmt(bossArmor(game.obeliskLevel)),180,80,'#d1dc9a',11,'center');txt('TIME  '+Math.ceil(Math.max(0,(bossFight.end-performance.now())/1000))+'s',180,97,'#f2c682',11,'center');const p=time;rect(67,476,226,18,'#221b2c');for(let i=0;i<28;i++){let a=rand(i,4);rect(40+i*10,180+a*240,1,2,a>.5?'#ae9c62':'#7e598a');}ctx.save();ctx.translate(180,305+Math.sin(p*2)*3);const glow=ctx.createRadialGradient(0,0,10,0,0,132);glow.addColorStop(0,'#95c1735e');glow.addColorStop(1,'#96e47b00');ctx.fillStyle=glow;ctx.fillRect(-130,-170,260,330);poly([[-52,75],[-62,-51],[-33,-95],[0,-127],[41,-93],[59,-46],[48,78]],'#162c32');poly([[-45,70],[-55,-43],[-27,-84],[-27,63]],'#417c68');poly([[-27,-84],[0,-116],[33,-84],[35,70],[-27,63]],'#273e3c');poly([[35,-79],[51,-39],[44,70],[35,70]],'#81ba67');for(let i=0;i<4;i++){const x=-34+i*19;poly([[x,-45],[x+8,-51],[x+8,43],[x+1,55]],i%2?'#98eb9c':'#d8d47d');rect(x+2,-60+i*7,5,5,'#f5fbab');}rect(-18,-95,35,6,'#b8f7a0');rect(-5,65,11,7,'#adf77c');ctx.restore();txt('TAP THE OBELISK TO ATTACK',180,526,'#f4e0bd',11,'center');}
function txt(str,x,y,color='#fff',size=12,align='left'){ctx.font='bold '+size+'px monospace';ctx.textAlign=align;ctx.fillStyle='#191622';ctx.fillText(str,x+1,y+2);ctx.fillStyle=color;ctx.fillText(str,x,y);ctx.textAlign='left';}
function draw(t){const dt=Math.min(.08,(t-lastTick)/1000);lastTick=t;time+=dt;frames++;if(bossFight){drawObelisk();if(t>=bossFight.end)stopBoss();}else{if(game.drone)advanceDrone(dt);drawGround();for(const r of rocks)drawRock(r);if(game.drone)drawDrone();processWaveRefresh(t);drawMiningImpacts(ctx);drawHand();}particles=particles.filter(p=>p.ttl>0);for(const p of particles){p.ttl-=dt;p.x+=p.dx*dt;p.y+=p.dy*dt;if(p.label)txt(p.label,p.x,p.y,p.color,10,'center');else rect(p.x,p.y,2,3,p.color);}if(t>toastUntil)$('toast').classList.remove('show');if(hand.held&&t-lastAttack>Math.max(80,270-12*(game.upgrades.attack||0))){lastAttack=t;if(bossFight){attackObelisk(damageRoll(game));}else if(holdPoint){swingHand(holdPoint.x,holdPoint.y);}}requestAnimationFrame(draw);}
function pointerPosition(e){const box=canvas.getBoundingClientRect();return {x:(e.clientX-box.left)*360/box.width,y:(e.clientY-box.top)*602/box.height};}
canvas.addEventListener('pointerdown',e=>{if(currentMenu||quickDrawer)return;const p=pointerPosition(e);
 hand.x=p.x;hand.y=p.y;hand.held=true;holdPoint=p;holdStart=performance.now();lastAttack=holdStart;
 try{canvas.setPointerCapture(e.pointerId)}catch{}
 if(bossFight){if(p.y>120&&p.y<482)attackObelisk(damageRoll(game));return;}
 swingHand(p.x,p.y);$('hint').classList.add('faded');});
canvas.addEventListener('pointermove',e=>{if(!hand.held)return;const p=pointerPosition(e);holdPoint=p;hand.x=p.x;hand.y=p.y;});
const stopHold=()=>{hand.held=false;holdRock=null;holdPoint=null};
canvas.addEventListener('pointerup',stopHold);canvas.addEventListener('pointercancel',stopHold);canvas.addEventListener('lostpointercapture',stopHold);
const pixelOreIcon=ore=>`<svg viewBox="0 0 24 24" class="ore-pixel" aria-hidden="true" focusable="false"><path fill="#141822" d="M5 7 11 2 17 4 22 11 20 18 13 22 5 19 2 12z"/><path fill="${ore.edge}" d="M5 8 11 4 16 6 20 11 18 17 12 20 6 18 4 12z"/><path fill="${ore.color}" d="M6 9 11 5 15 7 13 12 7 14 5 12z"/><path fill="#f5efdb" opacity=".57" d="M8 8h5v3H8z"/><path fill="${ore.color}" opacity=".78" d="m14 14 5-2-2 5-5 2z"/></svg>`;
const statusPixel=type=>({
 floor:'<svg viewBox="0 0 16 16" class="status-pixel" aria-hidden="true"><path fill="#86c4d1" d="M2 11h12v3H2zM5 7h6v3H5zM7 3h2v3H7z"/><path fill="#365776" d="M3 12h10v1H3z"/></svg>',
 bombs:'<svg viewBox="0 0 16 16" class="status-pixel" aria-hidden="true"><path fill="#1a1e29" d="M3 6h10v8H3z"/><path fill="#efb257" d="M5 7h6v6H5z"/><path fill="#fff0b7" d="M8 1h2v4H8zM11 3h2v2h-2z"/></svg>',
 drones:'<svg viewBox="0 0 16 16" class="status-pixel" aria-hidden="true"><path fill="#15232d" d="M1 6h14v7H1z"/><path fill="#6fbdce" d="M4 5h8v7H4z"/><path fill="#e2da7e" d="M7 7h3v3H7z"/><path fill="#92dce0" d="M1 7h2v3H1zM13 7h2v3h-2z"/></svg>',
 obelisk:'<svg viewBox="0 0 16 16" class="status-pixel" aria-hidden="true"><path fill="#182531" d="M5 2h6l3 12H2z"/><path fill="#9bd48a" d="M7 4h2l2 9H5z"/><path fill="#ddf59b" d="M7 7h2v3H7z"/></svg>'
})[type];
function statusEntries(){
 const charge=bombRechargeInfo();
 const data=[
  {id:'floors',icon:'floor',name:'Floor progress',value:`${game.rocksThisFloor}/${floorQuota(game.floor)}`,sub:'',progress:Math.min(100,100*game.rocksThisFloor/floorQuota(game.floor))},
  {id:'bombs',icon:'bombs',name:'Bomb recharge',value:`${charge.charges}/${charge.cap}`,sub:charge.remaining?secs(charge.remaining):'FULL',progress:charge.progress}
 ];
 if(game.drone)data.push({id:'drones',icon:'drones',name:'Drone',value:'ACTIVE',sub:droneMotion.targetId?'FLYING':droneMotion.ready?'READY':'MINING',progress:null});
 const wait=Math.max(0,Math.ceil(((game.bossReadyAt||0)-Date.now())/1000));
 if(wait>0)data.push({id:'obelisk',icon:'obelisk',name:'Obelisk ready',value:secs(wait),sub:'',progress:null});
 return data;
}
function renderStatusRail(){
 $('statusGroup').innerHTML=statusEntries().map(x=>`<button type="button" class="hud-effect ${x.sub?'hud-effect-timed':''}" data-side="${x.id}" title="${x.name}" aria-label="${x.name}: ${x.value}${x.sub?' '+x.sub:''}"><span class="status-glyph">${statusPixel(x.icon)}</span><span class="hud-effect-body"><strong>${x.value}</strong>${x.sub?`<small>${x.sub}</small>`:''}</span>${x.progress!==null?`<i style="--charge:${x.progress.toFixed(1)}%"></i>`:''}</button>`).join('');
}
function updateHud(){updateTarget();const exp=LVL_REQ(game.level);$('level').textContent='LV '+game.level;$('levelXp').textContent=fmt(game.xp)+' / '+fmt(exp)+' XP';$('xpFill').style.width=Math.min(100,game.xp/exp*100)+'%';$('gold').textContent=fmt(game.gold);$('gems').textContent=fmt(game.gems);$('hudPrestige').textContent=fmt(game.prestigePoints||0);$('floor').textContent=game.floor;$('floorName').textContent=game.floor<=5?'Stone Mine':game.floor<=10?'Copper Depths':'Crystal Caves';$('quotaText').textContent=nextWaveAt&&rocks.length===0?'WAVE '+secs(Math.max(0,(nextWaveAt-performance.now())/1000)):game.rocksThisFloor+' / '+floorQuota(game.floor);$('quotaFill').style.width=Math.min(100,game.rocksThisFloor/floorQuota(game.floor)*100)+'%';const resourceCounters=ORES.filter(o=>o.min<=game.highestFloor||(game.ore[o.id]||0)>0).slice(-4);
 $('resourceRows').innerHTML=resourceCounters.map(o=>`<div class="mineral-count" title="${o.name} ore" aria-label="${o.name} ore: ${fmt(game.ore[o.id]||0)}"><strong>${fmt(game.ore[o.id]||0)}</strong>${pixelOreIcon(o)}</div>`).join('');
 renderStatusRail();
 $('obeliskQuickState').textContent=game.bossReadyAt>Date.now()?'WAIT':'FIGHT';const itemMeter=chestStatus(game,'item'),relicMeter=chestStatus(game,'relic');$('chestFill').style.height=itemMeter.percent.toFixed(1)+'%';$('starFill').style.height=relicMeter.percent.toFixed(1)+'%';$('itemChestMeter').title='Item chests · '+itemMeter.owned+' ready · '+Math.floor(itemMeter.progress)+' / '+itemMeter.target+' damage';$('relicChestMeter').title='Relic chests · '+relicMeter.owned+' ready · '+Math.floor(relicMeter.progress)+' / '+relicMeter.target+' damage';$('autoFloorState').textContent=!game.autoFloorUnlocked?'LOCK':game.autoFloor?'ON':'OFF';$('autoFloor').classList.toggle('active',game.autoFloor);$('autoFloor').classList.toggle('locked',!game.autoFloorUnlocked);$('autoFloor').title=game.autoFloorUnlocked?'Toggle automatic floor advance':'Unlock through Skill Tree after Obelisk '+AUTO_FLOOR_OBELISK_GATE;}
let lastMenuRender=0,lastDrawerRender=0;function tick(){const now=performance.now();if(!bossFight){if(game.drone){droneClock+=.25;const interval=5/Math.max(1,1+.15*game.droneLevel);if(droneClock>=interval){droneClock=0;droneMotion.ready=true;}}}advanceBombRecharge(Math.min(1,Math.max(0,(now-lastBombTick)/1000)));lastBombTick=now;if(bombHeld&&quickDrawer==='bombs'&&!currentMenu&&now>=bombNextHoldAt){if(detonate('single'))bombNextHoldAt=nextBombHoldAt(now);else bombHeld=false;}updateHud();if(quickDrawer&&!(quickDrawer==='bombs'&&bombHeld)&&now-lastDrawerRender>1100){renderQuickDrawer();lastDrawerRender=now;}if(currentMenu&&now-lastMenuRender>950&&['upgrades','craft','sell','bag','floors','drones','bombs','obelisk','prestige','artifacts','stats','currencies','hub','chests','relics'].includes(currentMenu)){const sc=$('panelContent').scrollTop;renderMenu();$('panelContent').scrollTop=sc;lastMenuRender=now;}}
function showMarkup(title,html){$('panelTitle').textContent=title;$('panelContent').innerHTML=html;lastMenuRender=performance.now();}
function cell(name,value){return `<div><strong>${typeof value==='number'?fmt(value):esc(value)}</strong><small>${name}</small></div>`}
function item(icon,name,desc,meta,btn,label,enabled=true,sub=''){return `<div class="entry"><div class="glyph">${icon}</div><div class="info"><div class="name">${name}</div><div class="desc">${desc}</div><div class="cost">${meta}</div></div><div class="right">${sub?`<div class="level">${sub}</div>`:''}<button class="btn ${enabled?'':'secondary'}" data-act="${btn}" ${!enabled?'disabled':''}>${label}</button></div></div>`}
// Menu elements are original browser UI components.
const TEMP_MENU=[
 ['craft','▣','CRAFT','Turn ore into bars'],['upgrades','⛏','UPGRADES','Improve mining stats'],
 ['sell','◉','SELL','Exchange ore for gold'],['contracts','▤','CONTRACTS','Not yet simulated']
];
const PERM_MENU=[
 ['prestige','✦','PRESTIGE','Permanent progression'],['drones','◇','DRONES','Drone upgrades and settings'],
 ['chests','▣','CHESTS','Future system'],['relics','◈','RELICS','Future system'],
 ['store','▤','STORE','Gems and packs'],['workshop','⚒','WORKSHOP','Permanent improvements'],
 ['skills','✥','SKILL TREE','Unlockable skills'],['challenges','★','CHALLENGES','Unlock challenges'],
 ['cards','▦','CARDS','Future system'],['pets','♧','PETS','Future system'],
 ['construct','⚒','CONSTRUCT','Future system'],['stars','✧','STARGAZING','Future system'],
 ['archaeology','⌁','ARCHAEOLOGY','Future system'],['fishing','≈','FISHING','Future system'],
 ['future','▧','LOCKED','Future system']
];
const OTHER_MENU=[['stats','☷','STATS','Progress'],['cloud','⇧','CLOUD','Not available'],['settings','⚙','OPTIONS','Save, sound, display'],['logs','▤','LOGS','Activity history']];
const previewOnly=new Set(['contracts','cloud','cards','pets','stars','construct','fishing','archaeology','future']);
const menuLevels={workshop:1,skills:4,challenges:10,cards:15,pets:17,stars:23};
const menuTabs={obelisk:'fight',drones:'upgrades',settings:'general',stats:'1',currencies:'ores'};
let selectedFloorWorld=1; // navigation-only state, not part of the save
let hideMaxUpgrades=false,pinEdit=false,pinEditIndex=0,sellFraction=1;
let quickDrawer=null;
// The event shortcut is conditional; there is no active event in the current build.
const eventActive=false;
function closeQuickDrawer(){bombHeld=false;quickDrawer=null;$('quickDrawer').classList.add('hidden');$('quickDrawer').setAttribute('aria-hidden','true');}
function openQuickDrawer(kind){
 if(kind!=='consumables'&&kind!=='bombs')return;
 if(quickDrawer===kind){closeQuickDrawer();return;}
 if(currentMenu)closeMenu();quickDrawer=kind;hand.held=false;holdPoint=null;
 $('quickDrawer').classList.remove('hidden');$('quickDrawer').setAttribute('aria-hidden','false');renderQuickDrawer();
}
function renderQuickDrawer(){
 if(!quickDrawer)return;
 const consumables=quickDrawer==='consumables';
 $('drawerTitle').textContent=consumables?'CONSUMABLES':'BOMBS';
 $('quickDrawer').dataset.kind=quickDrawer;
 let html='';
 if(consumables){
  const owned=(Array.isArray(game.consumables)?game.consumables:[]).filter(item=>item&&typeof item.id==='string'&&typeof item.name==='string'&&Number.isSafeInteger(item.qty)&&item.qty>0);
  if(!owned.length){
   html=`<div class="consumable-no-items"><span class="empty-graphic" aria-hidden="true">▣</span><strong>NO CONSUMABLES OWNED</strong><small>Items appear here when you obtain them.</small></div>`+
    `<div class="consumable-footer"><div class="consumable-description">Inventory empty</div><button type="button" class="consumable-use" disabled aria-disabled="true">USE</button></div>`;
  }else{
   const slot=item=>`<div class="consumable-slot owned" aria-label="${esc(item.name)} × ${item.qty}" title="${esc(item.name)} × ${item.qty}"><span class="consumable-icon">${esc(item.icon||'✦')}</span><span class="consumable-count">${item.qty}</span></div>`;
   html=`<div class="consumable-featured" aria-label="Featured consumables">${owned.slice(0,3).map(slot).join('')}</div>`+
    (owned.length>3?`<div class="consumable-inventory" role="group" aria-label="Owned consumables">${owned.slice(3).map(slot).join('')}</div>`:'')+
    `<div class="consumable-tools"><div class="consumable-selected"></div><div class="consumable-selection-meter"></div><div class="consumable-time-meter" aria-label="No active timer">⌛</div></div>`+
    `<div class="consumable-footer"><div class="consumable-description">${owned.length} owned item type${owned.length===1?'':'s'} · effects unavailable</div><button type="button" class="consumable-use" disabled aria-disabled="true">USE</button></div>`;
  }
 }else{
  const charge=bombRechargeInfo(),available=game.bombs>0&&!bossFight;const count=bombSpendCount(game.bombs,'all');
  html=`<div class="bomb-panel-upper"><span>BOMBS · 1 UNLOCKED</span><span>${charge.charges} / ${charge.cap} CHARGES</span></div>`+
   `<div class="bomb-inventory" aria-label="Unlocked bomb types"><div class="bomb-row"><button type="button" class="bomb-inventory-slot available selected" data-draw-action="select-basic" aria-pressed="true" aria-label="Basic Bomb, ${charge.charges} of ${charge.cap} charges"><span class="bomb-symbol" aria-hidden="true">✹</span><span class="bomb-count">${charge.charges}/${charge.cap}</span></button></div></div>`+
   `<div class="bomb-selection"><div class="bomb-selected-icon" aria-hidden="true">✹</div><div class="bomb-selected-label"><strong>BASIC BOMB</strong><small>${fmt(bombDamage(game))} DAMAGE · SELECTED</small></div>`+
   `<button type="button" class="bomb-auto-lock" disabled aria-disabled="true" title="Auto-Bomber requires its Skill Tree unlock">AUTO<br>LOCKED</button></div>`+
   `<div class="bomb-timing" aria-live="off"><div class="bomb-timing-row"><span>RECHARGE RATE</span><strong>1 / ${charge.rate}s</strong></div><div class="bomb-timing-row"><span>NEXT CHARGE</span><strong>${secs(charge.remaining)}</strong></div>`+
   `<div class="bomb-progress" role="progressbar" aria-label="Bomb charge progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(charge.progress)}"><span style="width:${charge.progress.toFixed(2)}%"></span></div>`+
   `<div class="bomb-timing-row"><span>TIME UNTIL FULL</span><strong>${secs(charge.full)}</strong></div></div>`+
   `<div class="bomb-panel-footer"><div class="bomb-footer-status"><span>${charge.charges} BASIC BOMB${charge.charges===1?'':'S'} READY</span>`+
   `<small>HOLD FIRE: 1 PER ${(BOMB_HOLD_INTERVAL_MS/1000).toFixed(2)}s · AUTO NEEDS SKILL TREE</small></div>`+
   `<div class="bomb-action-row"><button type="button" class="bomb-fire-one" data-draw-action="fire-one" ${available?'':'disabled aria-disabled="true"'}>FIRE</button>`+
   `<button type="button" class="bomb-fire-all" data-draw-action="fire-all" ${available?'':'disabled aria-disabled="true"'}>FIRE<br>ALL <small>(${count})</small></button></div></div>`;
 }
 $('drawerContent').innerHTML=html;
}

if(!game.sellLocks || typeof game.sellLocks!=='object')game.sellLocks={};
const navIcons={"craft":"<svg viewBox=\"0 0 32 32\" class=\"nav-sprite\" aria-hidden=\"true\"><path fill=\"#161e29\" d=\"M3 13h26v10H3zM9 23h14v5H9z\"/><path fill=\"#c5dce2\" d=\"M4 11h24v8H4z\"/><path fill=\"#7894a6\" d=\"M4 17h24v5H4z\"/><path fill=\"#e2f0f0\" d=\"M6 11h8v3H6z\"/><path fill=\"#bb8182\" d=\"M10 23h12v3H10z\"/><path fill=\"#292e3a\" d=\"M13 6h6v5h-6z\"/><path fill=\"#e3c187\" d=\"M14 5h4v5h-4z\"/></svg>","upgrades":"<svg viewBox=\"0 0 32 32\" class=\"nav-sprite\" aria-hidden=\"true\"><path fill=\"#1b1b27\" d=\"m3 7 3-4 12 2 9 10-3 3-9-9-9-1z\"/><path fill=\"#91afb9\" d=\"m4 6 3-2 11 2 8 9-2 2-9-9-9-1z\"/><path fill=\"#f2c87c\" d=\"m18 12 3-3 8 16-4 3z\"/><path fill=\"#7b4c32\" d=\"m18 14 2-2 7 14-2 1z\"/></svg>","sell":"<svg viewBox=\"0 0 32 32\" class=\"nav-sprite\" aria-hidden=\"true\"><path fill=\"#1b1e25\" d=\"M10 5h12l-3 7 7 8-4 9H8L4 20l9-8z\"/><path fill=\"#b37f54\" d=\"M11 6h9l-3 8 7 7-3 6H9l-3-7 9-7z\"/><path fill=\"#e5b477\" d=\"M10 17h12l2 5-4 4H9l-2-5z\"/><path fill=\"#6d3d3c\" d=\"M11 12h11v3H11z\"/><path fill=\"#64d99c\" d=\"M23 3h4v5h4v4h-4v4h-4v-4h-4V8h4z\"/></svg>","hub":"<svg viewBox=\"0 0 32 32\" class=\"nav-sprite\" aria-hidden=\"true\"><path fill=\"#171c29\" d=\"M3 3h12v12H3zM18 3h11v12H18zM3 18h12v11H3zM18 18h11v11H18z\"/><path fill=\"#cbe6ed\" d=\"M5 5h8v8H5zM20 5h7v8h-7zM5 20h8v7H5zM20 20h7v7h-7z\"/><path fill=\"#7b9bb9\" d=\"M6 9h7v4H6zM20 9h7v4h-7zM5 24h8v3H5zM20 24h7v3h-7z\"/></svg>","store":"<svg viewBox=\"0 0 32 32\" class=\"nav-sprite\" aria-hidden=\"true\"><path fill=\"#1d1a22\" d=\"M3 10h26v19H3z\"/><path fill=\"#af6a3b\" d=\"M5 11h22v15H5z\"/><path fill=\"#d3a85b\" d=\"M5 11h22v5H5z\"/><path fill=\"#59453c\" d=\"M8 19h16v6H8z\"/><path fill=\"#f7d47e\" d=\"M14 17h4v6h-4z\"/><path fill=\"#5be0d8\" d=\"m10 3 5 5-4 4-5-4zm10 0 6 5-6 4-5-4z\"/></svg>"};
function updatePinnedMenus(){
 for(let i=0;i<3;i++){
  const btn=$('pin'+i),id=game.menuPins[i]||['craft','upgrades','sell'][i];
  const found=[...TEMP_MENU,...PERM_MENU,...OTHER_MENU].find(r=>r[0]===id);
  btn.dataset.menu=id;btn.querySelector('span').innerHTML=navIcons[id]||esc(found?.[1]||'▦');btn.querySelector('small').textContent=found?.[2]||id.toUpperCase();btn.setAttribute('aria-label',found?.[2]||id.toUpperCase());
 }
}

const tabBar=(menu,items)=>`<div class="subtabs" role="tablist" aria-label="${menu} sections">${items.map(([id,label])=>`<button type="button" role="tab" aria-selected="${menuTabs[menu]===id}" class="subtab ${menuTabs[menu]===id?'selected':''}" data-tab="${menu}:${id}">${label}</button>`).join('')}</div>`;
// Compact icon-first Hub tiles. The icon framing and colours are original artwork/CSS.
// The button proportions are tuned for portrait mobile screens.
const hubSection=(label,arr)=>`<section class="hub-section"><div class="hub-heading">${label}</div><div class="hub-grid">${arr.map(([id,ico,name,description])=>{
 const locked=!isUnlocked(id),preview=previewOnly.has(id),inactive=locked||preview;
 const lockBadge=locked?`<span class="hub-padlock" aria-hidden="true"></span>`:'';
 const sub=locked?`<span class="hub-note">${menuLevels[id]}</span>`:preview?'<span class="hub-note">SOON</span>':'';
 return `<div class="hub-cell ${inactive?'hub-locked':''} ${preview?'hub-preview':''}">
 <button type="button" class="hub-tile hub-${id}" data-menu="${id}" aria-label="${name}${locked?' locked':preview?' preview':''}" title="${description}" ${inactive?'aria-disabled="true"':''} ${preview?'disabled':''}>
 <span class="hub-icon-box" aria-hidden="true"><span class="hub-glyph">${ico}</span></span>${lockBadge}</button>
 <span class="hub-label">${name}</span>${sub}</div>`;
 }).join('')}</div></section>`;
function isUnlocked(k){return !(k in menuLevels)||game.obeliskLevel>=menuLevels[k];}
function openMenu(menu){bombHeld=false;if(quickDrawer)closeQuickDrawer();if(previewOnly.has(menu)){notice('FEATURE NOT IMPLEMENTED IN RESEARCH BUILD');return;}if(!isUnlocked(menu)){notice('DEFEAT MORE OBELISKS TO UNLOCK');return;}currentMenu=menu;if(menu==='floors')selectedFloorWorld=worldForFloor(game.floor);holdRock=null;hand.held=false;holdPoint=null;$('overlay').classList.toggle('floor-select-mode',menu==='floors');$('overlay').classList.toggle('hub-mode',menu==='hub');$('game').classList.toggle('hub-visible',menu==='hub');$('overlay').classList.remove('hidden');$('overlay').setAttribute('aria-hidden','false');renderMenu();$('panelContent').scrollTop=0;}
function closeMenu(){currentMenu=null;$('overlay').classList.remove('floor-select-mode');$('overlay').classList.remove('hub-mode');$('game').classList.remove('hub-visible');$('overlay').classList.add('hidden');$('overlay').setAttribute('aria-hidden','true');}
function renderMenu(){if(!currentMenu)return;const k=currentMenu;let html='',title=k.toUpperCase();if(k==='hub'){
 title='MENU HUB';html=hubSection('PERMANENT',PERM_MENU)+hubSection('THIS PRESTIGE',TEMP_MENU)+hubSection('MISCELLANEOUS',OTHER_MENU)+`<div class="hub-bottom-tools"><button class="setup-pins ${pinEdit?'active':''}" data-act="edit-pins">${pinEdit?'DONE PINS':'SETUP PINS'}</button><div class="pin-mini-row" aria-label="Choose quick pin to edit">${game.menuPins.map((id,idx)=>{const found=[...TEMP_MENU,...PERM_MENU,...OTHER_MENU].find(r=>r[0]===id);return `<button type="button" class="pin-mini ${pinEdit&&pinEditIndex===idx?'selected':''}" data-pinpick="${idx}" aria-label="Edit pin ${idx+1}, currently ${found?.[2]||id}" title="Pin ${idx+1}: ${found?.[2]||id}"><span>${found?.[1]||'▦'}</span></button>`;}).join('')}</div></div>`;
 }else if(k==='store'){
 title='GEM & PACK STORE';html=`<div class="section-label">CURRENCY</div><div class="summary">${cell('GEMS',game.gems)}${cell('GOLD',game.gold)}${cell('PRESTIGE',game.prestigePoints||0)}</div><div class="section-label">GEMS & PACKS</div><div class="notice">Purchases are not connected in this browser build. No money can be spent here.</div><div class="resource-line"><div class="resource-glyph">◆</div><div class="resource-body"><strong>GEM PACKS</strong><small>Coming later</small></div><div class="resource-actions"><button class="micro-btn" disabled>UNAVAILABLE</button></div></div>`;
 }else if(k==='logs'){
 title='ACTIVITY LOG';html=`<div class="section-label">RECENT ACTIVITY</div>${(game.log||[]).slice(0,35).map(l=>`<div class="line"><span>${esc(l.text)}</span><small>${new Date(l.t).toLocaleTimeString()}</small></div>`).join('')||'<div class="notice">No events recorded yet.</div>'}`;
}else if(k==='currencies'){
 title='CURRENCIES';
 const categories=[['ores','◈','ORES + BARS'],['bars','▰','BARS'],['wallet','✦','CURRENCIES']];
 html=`<div class="currency-v026"><div class="currency-category-tabs" role="tablist" aria-label="Resource categories">`+
 categories.map(([id,icon,label])=>`<button type="button" role="tab" aria-selected="${menuTabs.currencies===id}" class="currency-category ${menuTabs.currencies===id?'selected':''}" data-tab="currencies:${id}" title="${label}" aria-label="${label}"><span aria-hidden="true">${icon}</span><small>${label}</small></button>`).join('')+`</div>`;
 if(menuTabs.currencies==='wallet'){
  html+=`<div class="currency-ledger currency-wallet" role="table" aria-label="Current currencies"><div class="currency-ledger-head" role="row"><span>CURRENCY</span><span>AMOUNT</span></div>`+
   [['Gold',game.gold,'◉'],['Gems',game.gems,'◆'],['Prestige Points',game.prestigePoints||0,'✦'],['Skill Points',game.skillPoints||0,'◈']].map(([name,qty,icon])=>`<div class="currency-ledger-row" role="row"><span>${icon} ${name}</span><strong>${fmt(qty)}</strong></div>`).join('')+`</div>`;
 }else{
  const showBars=menuTabs.currencies==='bars';
  html+=`<div class="currency-ledger" role="table" aria-label="Owned ore and crafted bars"><div class="currency-ledger-head" role="row"><span>RESOURCE</span><span>${showBars?'CRAFTED BARS':'ORE'}</span><span>${showBars?'ORE / BAR':'BARS'}</span></div>`+
  ORES.filter(o=>o.min<=game.highestFloor||game.ore[o.id]||game.bars[o.id]).map(o=>`<div class="currency-ledger-row" role="row"><span class="currency-ore-name">${pixelOreIcon(o)}${o.name}</span><strong>${fmt(showBars?(game.bars[o.id]||0):(game.ore[o.id]||0))}</strong><strong>${showBars?o.craft:fmt(game.bars[o.id]||0)}</strong></div>`).join('')+`</div>`;
 }
 html+=`<div class="currency-footer"><span>ONLY UNLOCKED OR OWNED RESOURCES APPEAR</span><button class="micro-btn buy" data-menu="bag">ORE BAG</button></div></div>`;
 }else if(k==='bag'){
 title='ORE BAG';
 const totalOre=Object.values(game.ore).reduce((a,b)=>a+b,0),totalBars=Object.values(game.bars).reduce((a,b)=>a+b,0);
 html=`<div class="panel-intro">All ores and crafted bars are stored here. Ore is earned by breaking rocks; bars are made in Craft.</div><div class="summary">${cell('ORE',totalOre)}${cell('BARS',totalBars)}${cell('GOLD',game.gold)}</div>`;
 html+=`<div class="chip-row"><button class="btn gold" data-menu="sell">SELL ORE</button><button class="btn good" data-menu="craft">CRAFT BARS</button></div>`;
 html+=`<div class="section-label">YOUR RESOURCES</div>`;
 html+=ORES.filter(o=>game.highestFloor>=o.min || game.ore[o.id] || game.bars[o.id]).map(o=>`<div class="ore-entry"><div class="ore-symbol" style="--ore:${o.color};--oreedge:${o.edge}"><span>◆</span></div><div class="ore-description"><strong>${o.name}</strong><small>Floors ${o.min}–${o.max} · ${o.craft} ore / bar</small></div><div class="ore-stacks"><span>${fmt(game.ore[o.id])} <small>ORE</small></span><span>${fmt(game.bars[o.id])} <small>BARS</small></span></div></div>`).join('');
 }else if(k==='floors'){
 title='FLOOR SELECT';
 const deepestDone=game.floor===game.highestFloor&&canNextFloor(game);
 const ceiling=highestSelectableFloor(game,deepestDone);
 const pages=worldTabs(game,deepestDone);
 if(!pages.some(p=>p.world===selectedFloorWorld&&p.unlocked))selectedFloorWorld=worldForFloor(game.floor);
 html=`<section class="floor-selector" aria-label="Floor Select"><div class="floor-world-bar"><strong>FLOOR SELECT</strong><span class="floor-world-label">WORLD:</span><div class="floor-world-tabs" role="group" aria-label="Select world">`+
 pages.map(p=>`<button type="button" class="floor-world ${p.world===selectedFloorWorld?'selected':''}" data-act="world:${p.world}" aria-label="World ${p.world}${p.unlocked?'':' locked'}" aria-pressed="${p.world===selectedFloorWorld}" ${p.unlocked?'':'disabled'}>${p.world}</button>`).join('')+`</div></div>`;
 const rows=floorPairs(selectedFloorWorld);
 const floorButton=f=>{const allowed=isFloorSelectable(game,f,deepestDone),here=f===game.floor;
  return `<button type="button" class="floor-select-button ${here?'current':allowed?'available':'locked'}" data-act="floor:${f}" aria-label="Floor ${f}${here?' current':allowed?' available':' locked'}" ${!allowed||here?'disabled':''}>${f}</button>`;};
 const floorOres=f=>{const available=ORES.filter(o=>f>=o.min&&f<=o.max);const pick=available.length?available:ORES.filter(o=>o.min<=f).slice(-2);
  return `<div class="floor-select-ores" aria-label="Floor ${f} ores">${pick.slice(0,2).map(o=>pixelOreIcon(o)).join('')}</div>`;};
 html+=`<div class="floor-zone-list">`+rows.map((row,i)=>`<div class="floor-zone-row ${row.zone==='MAGMA'?'magma':''}">${i===0||i===4?`<div class="floor-zone-mark"><b>${row.zone}</b><span>${row.zone==='STONE'?'◈':'◆'}</span></div>`:'<div class="floor-zone-mark ghost"></div>'}
 <div class="floor-compact-row">${floorButton(row.left)}${floorOres(row.left)}${floorOres(row.right)}${floorButton(row.right)}</div></div>`).join('')+`</div>`;
 const currentCount=getFloorProgress(game,game.floor),need=floorQuota(game.floor);
 html+=`<div class="floor-select-meta"><span>FLOOR ${game.floor} · ${currentCount} / ${need} ROCKS</span><span>${ceiling>game.highestFloor?'NEXT FLOOR READY':'CLEAR THE DEEPEST FLOOR TO UNLOCK MORE'}</span></div><div class="floor-select-bottom"><button type="button" class="floor-select-close" data-act="close-floor" aria-label="Close Floor Select">✕</button></div></section>`;
 }else if(k==='upgrades'){
 title='UPGRADES';
 const upgradeRow=u=>{
  const lv=game.upgrades[u.id]||0,price=upgradeCost(u,lv),mat=upgradeMaterials(u,lv),max=lv>=u.cap,locked=game.level<u.req;
  const can=!max&&!locked&&game.gold>=price&&(!mat||(game.bars[mat.ore.id]||0)>=mat.qty);
  const current=u.id==='pick'?fmt(pickDamage(game)):'Lv '+lv;
  const next=max?'MAX':u.id==='pick'?fmt(pickDamage({...game,upgrades:{...game.upgrades,pick:lv+1}})):'Lv '+(lv+1);
  const priceText=max?'MAXED':locked?'REQUIRES LV '+u.req:`◉ ${fmt(price)}${mat?'  ◆ '+fmt(mat.qty)+' '+mat.ore.name:''}`;
  return `<div class="upgrade-line econ-upgrade ${locked?'econ-locked':''} ${max?'econ-maxed':''}"><span class="upgrade-icon" aria-hidden="true">${u.icon}</span><div class="upgrade-body"><div class="upgrade-title">${u.name}</div><div class="upgrade-sub">${locked?'UNLOCK AT MINER LV '+u.req:current+' → '+next}</div><div class="upgrade-price">${priceText}</div></div><div class="upgrade-right"><small>${lv}/${u.cap}</small><button class="btn ${max?'good':can?'danger':'secondary'}" data-act="upgrade:${u.id}" aria-label="${max?'Maxed':locked?'Locked':'Buy'} ${u.name}" ${!can?'disabled':''}>${max?'MAXED':locked?'LOCK':'BUY'}</button></div></div>`;
 };
 const available=UPGRADE_DEFS.filter(u=>!hideMaxUpgrades||(game.upgrades[u.id]||0)<u.cap);
 html=`<div class="econ-screen econ-upgrades"><div class="econ-summary">${cell('GOLD',game.gold)}${cell('MINER LV',game.level)}${cell('PICK DMG',pickDamage(game))}</div><div class="econ-toolbar"><span>THIS PRESTIGE · RESETS</span><button class="micro-btn" data-act="toggle-max" aria-pressed="${hideMaxUpgrades}">${hideMaxUpgrades?'SHOW MAXED':'HIDE MAXED'} ☰</button></div>`;
 const pick=available.filter(u=>u.id==='pick'),regular=available.filter(u=>u.id!=='pick');
 if(pick.length)html+='<div class="econ-heading">PICKAXE</div>'+pick.map(upgradeRow).join('');
 if(regular.length)html+='<div class="econ-heading">WORLD 1 · REGULAR</div>'+regular.map(upgradeRow).join('');
 if(!available.length)html+='<div class="econ-empty">All upgrades are maxed. Use SHOW MAXED to display them.</div>';
 html+='</div>';
 }else if(k==='craft'||k==='sell'){
 const crafting=k==='craft',totalOre=Object.values(game.ore).reduce((a,b)=>a+b,0),totalBars=Object.values(game.bars).reduce((a,b)=>a+b,0);
 const visible=ORES.filter(o=>game.highestFloor>=o.min);
 title=crafting?'CRAFT BARS':'SELL ORES';
 html=`<div class="econ-screen econ-${k}"><div class="econ-summary">${cell('GOLD',game.gold)}${cell('ORE',totalOre)}${cell('BARS',totalBars)}</div>`;
 if(crafting){
  html+=`<div class="econ-toolbar"><span>CRAFT AMOUNT</span><div class="quantity-strip">${[[1,'1'],[10,'10'],[Infinity,'MAX']].map(([n,label])=>`<button class="micro-btn ${craftBatch===n?'chosen':''}" aria-pressed="${craftBatch===n}" data-act="batch:${label==='MAX'?'all':n}">${label}</button>`).join('')}</div></div><div class="econ-caption">Each bar consumes its ore cost. Bonus bars can be awarded by your current upgrades.</div>`;
 }else{
  const eligible=visible.filter(o=>!game.sellLocks[o.id]);
  const availableOres=eligible.reduce((sum,o)=>sum+(game.ore[o.id]||0),0);
  const goldPreview=eligible.reduce((sum,o)=>sum+Math.round(Math.ceil((game.ore[o.id]||0)*sellFraction)*o.price*saleMultiplier(game)),0);
  html+=`<div class="econ-toolbar"><span>SELL AMOUNT</span><div class="quantity-strip">${[[.1,'10%'],[.25,'25%'],[.5,'50%'],[1,'ALL']].map(([v,label])=>`<button class="micro-btn ${sellFraction===v?'chosen':''}" aria-pressed="${sellFraction===v}" data-act="fraction:${v}">${label}</button>`).join('')}</div></div><div class="econ-locktools"><button class="micro-btn" data-act="lockall" aria-label="Lock all visible ores">LOCK ALL</button><button class="micro-btn" data-act="unlockall" aria-label="Unlock all visible ores">UNLOCK ALL</button><span>${eligible.length}/${visible.length} unlocked</span></div><div class="econ-sell-summary"><span>${fmt(availableOres)} unlocked ore in stock</span><strong>SELL PREVIEW ◉ ${fmt(goldPreview)}</strong><button class="micro-btn buy" data-act="sellall" ${goldPreview<=0?'disabled':''}>SELL UNLOCKED</button></div>`;
 }
 html+=`<div class="econ-heading">${crafting?'CRAFT BARS · AVAILABLE ORES':'ORE STOCKPILE'}</div>`;
 html+=visible.map(o=>{
  const have=game.ore[o.id]||0,locked=!!game.sellLocks[o.id],possible=Math.floor(have/o.craft),quantity=crafting?Math.min(possible,craftBatch):Math.ceil(have*sellFraction),can=crafting?quantity>0:quantity>0&&!locked;
  const total=crafting?quantity:Math.round(quantity*o.price*saleMultiplier(game));
  const desc=crafting?`ORE ${fmt(have)}  ·  BARS ${fmt(game.bars[o.id]||0)}  ·  ${fmt(o.craft)} / BAR`:`ORE ${fmt(have)}  ·  ◉ ${fmt(o.price)} EACH`;
  const details=crafting?`${quantity?'CRAFT '+fmt(quantity)+' BAR'+(quantity===1?'':'S'):'NEED '+fmt(o.craft)+' ORE'}${quantity?' · COST '+fmt(quantity*o.craft)+' ORE':''}`:`${locked?'LOCKED · ':''}SELL ${fmt(quantity)}  →  ◉ ${fmt(total)}`;
  return `<div class="econ-resource ${locked&&!crafting?'econ-locked':''}"><div class="econ-ore-icon" style="--ore-color:${o.color};--ore-edge:${o.edge}" aria-hidden="true">◆</div><div class="econ-resource-body"><strong>${o.name} ${crafting?'Bar':'Ore'}</strong><span>${desc}</span><small>${details}</small></div><div class="econ-resource-actions">${crafting?'':`<button class="micro-btn econ-lock ${locked?'chosen':''}" title="${locked?'Unlock':'Lock'} ${o.name}" aria-label="${locked?'Unlock':'Lock'} ${o.name}" aria-pressed="${locked}" data-act="lock:${o.id}">${locked?'🔒':'🔓'}</button>`}<button class="micro-btn buy" data-act="${k}:${o.id}" ${!can?'disabled':''}>${crafting?'CRAFT':'SELL'}</button></div></div>`;
 }).join('')+'</div>';
 }else if(k==='chests'){
 title='ITEM CHESTS';const meter=chestStatus(game,'item');
 html=`<div class="chest-panel-v027"><div class="section-label">ITEM CHEST METER</div><div class="summary">${cell('UNOPENED',meter.owned)}${cell('EARNED',meter.earned)}${cell('NEXT CHEST',Math.ceil(meter.target-meter.progress)+' DAMAGE')}</div><div class="chest-meter-v027"><div style="width:${meter.percent.toFixed(2)}%"></div></div><p class="tiny-help">Deal damage to rocks to fill this meter. Each completed meter grants an item chest. Thresholds are provisional.</p><div class="chest-open-row-v027"><button class="btn" data-act="openitem:1" ${meter.owned?'':'disabled'}>OPEN 1</button><button class="btn" data-act="openitem:all" ${meter.owned?'':'disabled'}>OPEN ALL (${meter.owned})</button></div><div class="section-label">OWNED CONSUMABLE ITEMS</div>`+
 (game.consumables.length?game.consumables.map(i=>`<div class="chest-item-v027"><strong>${esc(i.name)}</strong><span>× ${fmt(i.qty)}</span></div>`).join(''):'<p class="panel-intro">No items yet. Open an item chest to receive one.</p>')+
 `<p class="tiny-help">Items go to Consumables, not Ore Bag. Item effects remain unavailable until implemented. The loot selection uses a provisional published loot table.</p></div>`;
 }else if(k==='relics'){
 title='RELIC CHESTS';const meter=chestStatus(game,'relic');
 html=`<div class="chest-panel-v027"><div class="section-label">RELIC CHEST METER</div><div class="summary">${cell('UNOPENED',meter.owned)}${cell('EARNED',meter.earned)}${cell('NEXT CHEST',Math.ceil(meter.target-meter.progress)+' DAMAGE')}</div><div class="chest-meter-v027 relic"><div style="width:${meter.percent.toFixed(2)}%"></div></div><p class="tiny-help">Relic chests build up independently from Item Chests as you damage rocks. Thresholds are provisional.</p><div class="section-label">RELIC INVENTORY</div><p class="panel-intro">${meter.owned} unopened relic chest${meter.owned===1?'':'s'} saved. Opening and permanent relic perks are not yet implemented, so these chests are kept safely until the reward system is ready.</p><button class="btn" disabled>OPEN RELIC CHEST</button></div>`;
 }else if(k==='bombs'){
 title='BOMBS';html=`<div class="section-label">BOMB CHARGES</div><div class="summary">${cell('AVAILABLE',game.bombs+' / '+game.bombMax)}${cell('BLAST DMG',bombDamage(game))}${cell('RECHARGE','1 / '+BOMB_RECHARGE_SECONDS+'s')}</div>`+
 `<div class="resource-line"><div class="resource-glyph">✹</div><div class="resource-body"><strong>BASIC BOMB</strong><span>Hits the full visible mining field</span><small>${game.bombs} charges available · no damage to the boss</small></div><div class="resource-actions"><button class="micro-btn buy" data-act="bomb" ${game.bombs<1||bossFight?'disabled':''}>FIRE</button></div></div>`+
 `<div class="tiny-help">The bomb button is also on the right side of the mining field. Recharge continues automatically while you mine.</div>`;
 }else if(k==='drones'){
 title='DRONES';html=tabBar('drones',[['upgrades','UPGRADES'],['suits','SUITS'],['fuel','FUEL']]);
 if(menuTabs.drones==='upgrades'){
 const cost=game.drone?Math.round(95*Math.pow(1.85,game.droneLevel)):110;
 html+=`<div class="section-label">AUTO-MINING</div><div class="summary">${cell('ACTIVE',game.drone?'YES':'NO')}${cell('DRONE LV',game.droneLevel)}${cell('GOLD',game.gold)}</div>`+
 `<div class="resource-line"><div class="resource-glyph">◇</div><div class="resource-body"><strong>${game.drone?'MINING DRONE':'UNLOCK MINING DRONE'}</strong><span>${game.drone?'1 attack / '+(5/(1+.15*game.droneLevel)).toFixed(1)+' seconds':'Automatic mining while playing'}</span><small>◉ ${fmt(cost)} · ${game.drone?'LEVEL '+game.droneLevel:'ONE-TIME UNLOCK'}</small></div><div class="resource-actions"><button class="micro-btn buy" data-act="${game.drone?'droneup':'dronebuy'}" ${game.gold<cost?'disabled':''}>${game.drone?'UP':'BUY'}</button></div></div>`+
 `<div class="tiny-help">Drone attacks run independently of the hand. More advanced drone mechanics are not enabled in this build.</div>`;
 }else if(menuTabs.drones==='suits'){
 html+=`<div class="section-label">SUITS</div><div class="resource-line"><div class="resource-glyph">◇</div><div class="resource-body"><strong>DEFAULT SUIT</strong><span>Equipped visual appearance</span><small>Additional suits are not available</small></div><div class="resource-actions"><button class="micro-btn chosen" disabled>USED</button></div></div>`;
 }else{
 html+=`<div class="section-label">FUEL</div><div class="notice">Fuel mechanics are not enabled in this build. Drones use the automatic attack timer shown in Upgrades; there is no fuel inventory to spend.</div>`;
 }
 }else if(k==='obelisk'){
 title='THE OBELISK';html=tabBar('obelisk',[['fight','FIGHT'],['rewards','REWARDS'],['unlocks','UNLOCKS'],['info','INFO']]);
 if(menuTabs.obelisk==='fight'){
 let wait=Math.max(0,Math.ceil((game.bossReadyAt-Date.now())/1000));
 html+=`<div class="section-label">OBELISK ${game.obeliskLevel+1} · BATTLE</div><div class="obelisk-summary"><div class="obelisk-emblem">♜</div><div class="obelisk-stats"><div class="line"><span>HEALTH</span><strong>${fmt(game.bossRemaining)} / ${fmt(bossMax())}</strong></div><div class="line"><span>ARMOR</span><strong>${fmt(bossArmor(game.obeliskLevel))}</strong></div><div class="line"><span>PICKAXE DAMAGE</span><strong>${fmt(pickDamage(game))}</strong></div><div class="line"><span>ATTEMPT</span><strong>30 SEC</strong></div></div></div><div class="obelisk-actions">${bossFight?'<button class="btn" data-act="exitboss">RETREAT</button>':`<button class="btn gold" data-act="fight" ${wait>0?'disabled':''}>${wait?'COOLDOWN '+wait+'s':'ATTACK OBELISK'}</button>`}</div><div class="tiny-help">Progress is retained between fights. Bombs cannot damage the Obelisk.</div>`;
 }else if(menuTabs.obelisk==='rewards'){
 html+=`<div class="section-label">OBELISK VICTORY REWARDS</div><div class="summary">${cell('WINS',game.obeliskLevel)}${cell('CURRENT',game.obeliskLevel+1)}${cell('CLAIMS','—')}</div><div class="resource-line disabled-research"><div class="resource-glyph">✦</div><div class="resource-body"><strong>REWARDS</strong><span>Rewards are claimable in v2.2.50+</span><small>TABLE & REQUIREMENTS UNVERIFIED</small></div><div class="resource-actions"><button class="micro-btn buy" disabled>CLAIM</button></div></div><div class="tiny-help">No claimable rewards are simulated or granted in this prototype.</div>`;
 }else if(menuTabs.obelisk==='unlocks'){
 html+=`<div class="panel-intro">Milestones below are prototype approximations pending level-by-level reference verification.</div><div class="section-label">PROGRESSION UNLOCKS</div>`;
 for(const [n,feature] of [[1,'Workshop'],[2,'Advanced Drones'],[4,'Skill Tree'],[10,'Challenges'],[15,'Cards'],[17,'Pets'],[23,'Stargazing']])html+=`<div class="unlock-row"><span>OB ${n}</span><strong>${feature}</strong><small class="${game.obeliskLevel>=n?'unlocked':''}">${game.obeliskLevel>=n?'UNLOCKED':'LOCKED'}</small></div>`;
 }else html+=`<div class="panel-intro">Obelisk fights have armor reduction before critical bonuses. Progress toward defeating the current Obelisk remains between attempts.</div><div class="line"><span>Attempt duration</span><strong>30 seconds (prototype)</strong></div><div class="line"><span>Bombs</span><strong>Cannot damage Obelisk</strong></div><div class="notice">Original balance and exact reward sequence require further runtime reference footage.</div>`;
}else if(k==='prestige'){
 let pp=availablePrestige(game);html=`<div class="big-card"><div class="icon">✦</div><h2>PRESTIGE RESET</h2><p>Reach level 20 to Prestige.<br>Your current reward: <b>${fmt(pp)} prestige points</b>.</p><button class="btn" data-act="prestige" ${!pp?'disabled':''}>PRESTIGE +${pp} POINTS</button></div><div class="notice">Prestige resets level, floor, gold, ores, bars and regular upgrades. Keeps artifacts, gems, drone and Obelisk progression.</div><div class="section-label">PRESTIGE COUNT: ${game.prestiges}</div>`;
}else if(k==='artifacts'){
 html=`<div class="panel-intro">Spend Prestige Points on permanent artifacts.</div><div class="summary">${cell('POINTS',game.prestigePoints)}${cell('PRESTIGES',game.prestiges)}${cell('DAMAGE',pickDamage(game))}</div>`+ARTIFACTS.map(a=>{let lvl=game.artifacts[a.id],cost=artifactCost(a,lvl);return item('✦',a.name,a.desc,'✦ '+fmt(cost)+' prestige pts','artifact:'+a.id,lvl>=a.cap?'MAXED':'UPGRADE',lvl<a.cap&&game.prestigePoints>=cost,lvl+'/'+a.cap)}).join('');
}else if(k==='workshop'){
 html=`<div class="panel-intro">Unlocked by your first Obelisk defeat. This study implements a basic craftable bonus.</div>`+item('⚒','Reinforced Handle','A permanent small boost to drone damage.','◉ '+fmt(300+game.dronePoints*180)+' gold','workshop:reinforce','CRAFT',game.gold>=300+game.dronePoints*180,game.dronePoints+' upgrades');
}else if(k==='skills'){
 title='SKILL TREE';const unlocked=game.autoFloorUnlocked;
 html=`<div class="section-label">SKILL TREE · FLOOR AUTOMATION</div><div class="summary">${cell('SKILL POINTS',game.skillPoints)}${cell('GEMS',game.gems)}${cell('OBELISK',game.obeliskLevel)}</div>`+
 `<div class="panel-intro">Auto-Floor is a permanent unlock. First reach Obelisk ${AUTO_FLOOR_OBELISK_GATE}, then spend ${AUTO_FLOOR_SKILL_COST} skill points. The Skill Tree gate is historically documented; the exact current unlock route is not verified.</div>`+
 `<div class="resource-line"><div class="resource-glyph">✥</div><div class="resource-body"><strong>SKILL POINT</strong><span>Convert ${SKILL_POINT_GEM_PRICE} Gems to 1 Skill Point.</span><small>Current: ${game.skillPoints} · Permanent</small></div><div class="resource-actions"><button class="micro-btn buy" data-act="skillpoint" ${(unlocked||game.gems<SKILL_POINT_GEM_PRICE)?'disabled':''}>${SKILL_POINT_GEM_PRICE} ◆</button></div></div>`+
 `<div class="resource-line"><div class="resource-glyph">↧</div><div class="resource-body"><strong>AUTO-FLOOR ACCESS</strong><span>Automatically descend after clearing the deepest floor.</span><small>${unlocked?'UNLOCKED · survives Prestige':game.skillPoints+' / '+AUTO_FLOOR_SKILL_COST+' Skill Points required'}</small></div><div class="resource-actions"><button class="micro-btn ${unlocked?'good':'buy'}" data-act="autounlock" ${!unlocked&&game.skillPoints>=AUTO_FLOOR_SKILL_COST?'':'disabled'}>${unlocked?'OWNED':'UNLOCK'}</button></div></div>`+
 `<div class="tiny-help">Once unlocked, switch AUTO ON/OFF on the right floor controls. It never skips required rocks and stays OFF until you enable it.</div>`;
 }else if(k==='challenges'){
 html='<div class="big-card"><div class="icon">★</div><h2>CHALLENGES</h2><p>Not implemented yet.</p></div>';
}else if(k==='stats'){
 title='STAT PAGES';
 const statTable=(name,rows)=>`<section class="stats-table"><h2>${name}</h2>${rows.map(([label,value])=>`<div class="stat-line"><span>${label}</span><strong>${typeof value==='number'?fmt(value):esc(value)}</strong></div>`).join('')}</section>`;
 const n=key=>game.upgrades[key]||0;
 const recharge=bombRechargeInfo();
 html=`<div class="stats-v026"><div class="stats-topbar"><span>STAT PAGES</span>`+tabBar('stats',[['1','1'],['2','2'],['3','3']])+`</div>`;
 if(menuTabs.stats==='1'){
  html+=`<div class="stats-grid">`+
   statTable('PICKAXE STATS',[['Damage',pickDamage(game)],['Attack Speed',(1000/Math.max(80,270-12*n('attack'))).toFixed(2)+'/s'],['Radius',Math.round(handReach(game))+' px'],['Pickaxe Level',n('pick')],['Crit Upgrade',n('crit')],['Multi-Rock Upgrade',n('multirock')]])+
   statTable('BOMB STATS',[['Bomb Damage',bombDamage(game)],['Charges',game.bombs+' / '+game.bombMax],['Recharge Rate',recharge.rate+'s / charge'],['Next Charge',secs(recharge.remaining)],['Until Full',secs(recharge.full)],['Bomb Upgrade',n('bomb')]])+
   statTable('DRONE STATS',[['Unlocked',game.drone?'YES':'NO'],['Drone Level',game.drone?game.droneLevel:'—'],['Drone Points',game.drone?game.dronePoints:'—'],['Attack Interval',game.drone?(5/Math.max(1,1+.15*game.droneLevel)).toFixed(2)+'s':'—']])+
   statTable('MISC STATS',[['Miner Level',game.level],['Deepest Floor',game.highestFloor],['Prestiges',game.prestiges],['Obelisks Defeated',game.obeliskLevel],['Gems Owned',game.gems]])+`</div>`;
 }else if(menuTabs.stats==='2'){
  html+=`<div class="stats-grid">`+
   statTable('FLOOR PROGRESS',[['Current Floor',game.floor],['Deepest Floor',game.highestFloor],['Floor Cleared',getFloorProgress(game)+' / '+floorQuota(game.floor)],['Auto-Floor',game.autoFloorUnlocked?(game.autoFloor?'ON':'OFF'):'LOCKED']])+
   statTable('MINING TOTALS',[['Rocks Broken',game.rocksBroken],['Ore Mined',game.totalMined],['Manual Hits',game.totalClicks]])+
   statTable('ECONOMY',[['Gold',game.gold],['Gems',game.gems],['Prestige Points',game.prestigePoints||0],['Skill Points',game.skillPoints||0]])+
   statTable('CRAFT / SELL',[['Ore Types',Object.values(game.ore).filter(v=>v>0).length],['Bar Types',Object.values(game.bars).filter(v=>v>0).length],['Locked Ore Types',Object.values(game.sellLocks||{}).filter(Boolean).length]])+`</div>`;
 }else{
  html+=`<div class="section-label">RECENT ACTIVITY</div><div class="stats-activity">`+
   ((game.log||[]).length?(game.log||[]).slice(0,20).map(a=>`<div class="line"><span>${esc(a.text)}</span><small>${new Date(a.t).toLocaleTimeString()}</small></div>`).join(''):'<div class="stats-empty">No activity recorded yet.</div>')+`</div>`+
   `<div class="tiny-help">Only recorded or directly calculated statistics are shown.</div>`;
 }
 html+=`</div>`;
 }else if(k==='settings'){
 title='OPTIONS';html=tabBar('settings',[['general','GENERAL'],['gameplay','GAMEPLAY'],['display','DISPLAY'],['offline','OFFLINE'],['menus','MENUS'],['sound','SOUND'],['numbers','NUMBERS'],['saving','SAVING']]);
 const t=menuTabs.settings;
 if(t==='general')html+=`<div class="panel-intro">The real v2.2.50 options page reorganized settings into multiple tabs. These pages are being recreated individually.</div><div class="line"><span>Build</span><strong>Research v0.5</strong></div><div class="line"><span>Current Save</span><strong>LOCAL ONLY</strong></div>`;
 else if(t==='sound')html+=`<div class="section-label">MUSIC AND SOUND EFFECTS</div><div class="line"><span>Sound effects and feedback</span><button class="btn" data-act="sound">${game.settings.sound?'ON':'OFF'}</button></div><div class="notice">Other independent volume controls are not implemented yet.</div>`;
 else if(t==='saving')html+=`<div class="panel-intro">Local browser save. No accounts or cloud synchronization.</div><div class="chip-row"><button class="btn good" data-act="save">SAVE NOW</button><button class="btn secondary" data-act="export">EXPORT SAVE</button></div><div class="chip-row"><button class="btn secondary" data-act="import">IMPORT SAVE</button><button class="btn danger" data-act="wipe">RESET SAVE</button></div><input hidden id="importFile" type="file" accept=".json,application/json">`;
 else if(t==='offline')html+=`<div class="section-label">OFFLINE PROGRESS</div><div class="line"><span>Maximum simulated drone time</span><strong>4 hours</strong></div><div class="line"><span>Offline rewards</span><strong>Basic drone only</strong></div><div class="notice">The real game provides additional settings for buff and fuel consumption offline. Those settings require their respective systems before becoming interactive.</div>`;
 else {const config={gameplay:['Hold to mine','Auto-floor navigation','Tap feedback'],display:['UI scaling','Damage number visibility','Effects intensity'],menus:['Three editable pins','Hide maxed upgrades','Menu indicators'],numbers:['Number notation','Separator format','Large numbers']};html+=`<div class="section-label">${t.toUpperCase()} SETTINGS</div>`+(config[t]||[]).map(label=>`<div class="setting-entry"><span>${label}</span><small>RESEARCH</small></div>`).join('')+`<div class="tiny-help">These options are visual references only; no unimplemented settings are clickable.</div>`;}

}
 showMarkup(title,html);
}
function confirmAction(title,body,yes){$('confirmTitle').textContent=title;$('confirmBody').textContent=body;$('confirm').classList.remove('hidden');$('confirmYes').onclick=()=>{$('confirm').classList.add('hidden');yes();};}
$('confirmCancel').onclick=()=>$('confirm').classList.add('hidden');
$('panelContent').addEventListener('click',e=>{const pinChoice=e.target.closest('button[data-pinpick]');if(pinChoice){pinEdit=true;pinEditIndex=Number(pinChoice.dataset.pinpick)||0;renderMenu();return;}const btn=e.target.closest('button[data-menu],button[data-act],button[data-tab]');if(!btn)return;if(btn.dataset.menu){
  const id=btn.dataset.menu;
  if(pinEdit&&currentMenu==='hub'&&id!=='hub'){
   if(!isUnlocked(id)||previewOnly.has(id))return notice('CANNOT PIN LOCKED OR UNAVAILABLE MENU');
   game.menuPins[pinEditIndex]=id;pinEditIndex=(pinEditIndex+1)%3;
   save();updatePinnedMenus();renderMenu();return;
  }
  openMenu(id);return;
 }if(btn.dataset.tab){const [section,tab]=btn.dataset.tab.split(':');menuTabs[section]=tab;renderMenu();$('panelContent').scrollTop=0;return;}const act=btn.dataset.act;let changed=false;
 if(act==='edit-pins'){pinEdit=!pinEdit;pinEditIndex=0;renderMenu();return;}
 if(act==='toggle-max'){hideMaxUpgrades=!hideMaxUpgrades;renderMenu();return;}
 if(act==='close-floor'){closeMenu();return;}
 if(act.startsWith('world:')){const world=Number(act.split(':')[1]);const done=game.floor===game.highestFloor&&canNextFloor(game);if(worldTabs(game,done).some(p=>p.world===world&&p.unlocked)){selectedFloorWorld=world;renderMenu();}return;}
 if(act.startsWith('floor:')){
  const to=Number(act.split(':')[1]);if(travelToFloor(game,to)){
   spawnRocks();save();updateHud();closeMenu();notice('TRAVELLED TO FLOOR '+game.floor);
  }else notice('FLOOR LOCKED OR ALREADY HERE');return;
 }
 if(act.startsWith('batch:')){craftBatch=act==='batch:all'?Infinity:Number(act.split(':')[1]);renderMenu();return;}
 if(act.startsWith('fraction:')){sellFraction=Number(act.split(':')[1]);renderMenu();return;}
 if(act==='lockall'||act==='unlockall'){for(const o of ORES.filter(o=>game.highestFloor>=o.min))game.sellLocks[o.id]=act==='lockall';save();renderMenu();return;}
 if(act.startsWith('lock:')){const id=act.split(':')[1];game.sellLocks[id]=!game.sellLocks[id];save();renderMenu();return;}
 if(act.startsWith('upgrade:')){changed=buyUpgrade(game,act.split(':')[1]);if(changed)playSfx('success');}
 else if(act.startsWith('artifact:'))changed=buyArtifact(game,act.split(':')[1]);
 else if(act.startsWith('craft:')){const key=act.split(':')[1],amount=craftBars(game,key,craftBatch);changed=amount>0;if(changed)notice('CRAFTED '+amount+' '+key.toUpperCase()+' BAR');}
 else if(act.startsWith('sell:')){const key=act.split(':')[1],gold=game.sellLocks[key]?0:sellOre(game,key,Math.ceil((game.ore[key]||0)*sellFraction));changed=gold>0;if(changed)notice('SOLD ORE FOR ◉ '+fmt(gold));}
 else if(act==='sellall'){let sum=0;for(const ore of ORES)if(!game.sellLocks[ore.id])sum+=sellOre(game,ore.id,Math.ceil((game.ore[ore.id]||0)*sellFraction));changed=sum>0;if(changed)notice('SOLD EVERYTHING FOR ◉ '+fmt(sum));}
 else if(act.startsWith('openitem:')){
  const amount=act.endsWith('all')?game.itemChests:1;
  const perform=()=>{const result=openItemChests(game,amount);if(result.opened){eventLog('Opened '+result.opened+' item chest'+(result.opened===1?'':'s'));notice('ITEM CHESTS OPENED: '+result.opened);save();renderMenu();updateHud();}};
  if(amount>10)confirmAction('OPEN ITEM CHESTS','Open '+amount+' item chests and move rewards to Consumables?',perform);
  else perform();return;
 }
 else if(act==='bomb'){changed=detonate('single')>0;}
 else if(act==='dronebuy'){if(!game.drone&&game.gold>=110){game.gold-=110;game.drone=true;changed=true;eventLog('Unlocked mining drone');notice('DRONE UNLOCKED');}}
 else if(act==='droneup'){const cost=Math.round(95*Math.pow(1.85,game.droneLevel));if(game.drone&&game.gold>=cost){game.gold-=cost;game.droneLevel++;changed=true;}}
 else if(act==='fight'){startBoss();changed=true;}
 else if(act==='exitboss'){stopBoss();changed=true;}
 else if(act==='prestige'){let pts=availablePrestige(game);if(pts){confirmAction('PRESTIGE RESET',`Reset temporary progress to earn ${pts} permanent points?`,()=>{const pins=[...game.menuPins],locks={...game.sellLocks};const permanentChests={itemChestDamage:game.itemChestDamage,itemChestEarned:game.itemChestEarned,itemChests:game.itemChests,relicChestDamage:game.relicChestDamage,relicChestEarned:game.relicChestEarned,relicChests:game.relicChests,consumables:structuredClone(game.consumables)};let got=prestige(game);Object.assign(game,permanentChests);normalizeFloorAutomation(game);game.menuPins=pins;game.sellLocks=locks;spawnRocks();notice('PRESTIGED +'+got+' POINTS');eventLog('Prestiged for '+got+' points');save();openMenu('artifacts');});}}
 else if(act==='skillpoint'){changed=purchaseSkillPoint(game);if(changed){eventLog('Converted gems to 1 Skill Point');notice('+1 SKILL POINT');}}
 else if(act==='autounlock'){changed=unlockAutoFloor(game);if(changed){eventLog('Unlocked automatic floor advance');notice('AUTO-FLOOR UNLOCKED!');playSfx('success');}}
 else if(act==='workshop:reinforce'){const cost=300+game.dronePoints*180;if(game.gold>=cost){game.gold-=cost;game.dronePoints++;changed=true;}}
 else if(act==='save'){save();notice('SAVED LOCALLY');}
 else if(act==='export'){save();const blob=new Blob([JSON.stringify(game,null,2)],{type:'application/json'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download='deep-mine-save-'+new Date().toISOString().slice(0,10)+'.json';document.body.append(a);a.click();a.remove();URL.revokeObjectURL(u);notice('SAVE EXPORTED');}
 else if(act==='import'){$('importFile').click();}
 else if(act==='sound'){game.settings.sound=!game.settings.sound;changed=true;}
 else if(act==='wipe'){confirmAction('DELETE LOCAL SAVE','This permanently resets your progress on this browser. Export first if needed.',()=>{game=newGame();game.menuPins=['craft','upgrades','sell'];game.sellLocks={};normalizeChests(game);updatePinnedMenus();spawnRocks();save();openMenu('hub');notice('LOCAL SAVE RESET');});}
 if(changed){save();renderMenu();updateHud();}
});
$('panelContent').addEventListener('change',async e=>{if(e.target.id!=='importFile'||!e.target.files?.length)return;try{const candidate=JSON.parse(await e.target.files[0].text());if(!isValidSave(candidate))return notice('INVALID OR INCOMPATIBLE SAVE');confirmAction('IMPORT BACKUP','Replace your current progress with this save?',()=>{game=candidate;if(!Array.isArray(game.menuPins)||game.menuPins.length!==3)game.menuPins=['craft','upgrades','sell'];if(!game.sellLocks||typeof game.sellLocks!=='object')game.sellLocks={};normalizeFloorAutomation(game);normalizeChests(game);updatePinnedMenus();game.lastSaved=Date.now();save();spawnRocks();openMenu('hub');notice('SAVE IMPORTED');});}catch{notice('CANNOT READ SAVE FILE');}});
$('itemChestMeter').onclick=()=>openMenu('chests');$('relicChestMeter').onclick=()=>openMenu('relics');
$('inventoryQuick').onclick=()=>openQuickDrawer('consumables');$('bombDrawerBtn').onclick=()=>openQuickDrawer('bombs');$('drawerClose').onclick=closeQuickDrawer;
 // A press fires immediately; a continued hold repeats every 1.25 seconds.
 $('drawerContent').addEventListener('pointerdown',e=>{
  if(!e.target.closest('[data-draw-action="fire-one"]')||e.button!==0)return;
  e.preventDefault();if(detonate('single')){bombHeld=true;bombNextHoldAt=nextBombHoldAt(performance.now());e.target.closest('[data-draw-action="fire-one"]').classList.add('holding');}
 });
 for(const kind of ['pointerup','pointercancel'])document.addEventListener(kind,()=>{const hadHold=bombHeld;bombHeld=false;if(hadHold&&quickDrawer==='bombs')renderQuickDrawer();});
 window.addEventListener('blur',()=>{bombHeld=false;});
 $('drawerContent').addEventListener('click',e=>{
  const action=e.target.closest('[data-draw-action]')?.dataset.drawAction;
  if(action==='select-basic'){renderQuickDrawer();return;}
  if(action==='fire-one'){if(e.detail===0)detonate('single');renderQuickDrawer();return;}
  if(action==='fire-all'){bombHeld=false;detonate('all');renderQuickDrawer();}
 });
 $('statusGroup').addEventListener('click',e=>{const menu=e.target.closest('[data-side]')?.dataset.side;if(menu==='bombs')openQuickDrawer('bombs');else if(menu)openMenu(menu);});
$('statusToggle').addEventListener('click',()=>{const rail=$('statusGroup');const collapsed=rail.classList.toggle('collapsed');$('statusToggle').setAttribute('aria-expanded',String(!collapsed));$('statusToggle').textContent=collapsed?'▸':'▾';});
 $('shopDock').querySelector('span').innerHTML=navIcons.store;$('menuDock').querySelector('span').innerHTML=navIcons.hub;$('shopDock').onclick=()=>openMenu('store');$('obeliskQuick').onclick=()=>{menuTabs.obelisk='fight';openMenu('obelisk');};$('statsQuick').onclick=()=>openMenu('stats');$('currenciesQuick').onclick=()=>openMenu('currencies');$('floorPair').onclick=()=>openMenu('floors');$('eventShortcut').classList.toggle('hidden',!eventActive);
 updatePinnedMenus();$('hubBtn').onclick=()=>openMenu('hub');$('floorMapBtn').onclick=()=>openMenu('floors');$('closeBtn').onclick=()=>closeMenu();$('hubCloseDock').onclick=()=>closeMenu();$('backBtn').onclick=()=>currentMenu==='hub'?closeMenu():openMenu('hub');$('floorUp').onclick=()=>changeFloor(1);$('floorDown').onclick=()=>changeFloor(-1);$('autoFloor').onclick=()=>{if(!game.autoFloorUnlocked){if(game.obeliskLevel>=AUTO_FLOOR_OBELISK_GATE)openMenu('skills');else notice('AUTO-FLOOR LOCKED · REACH OBELISK '+AUTO_FLOOR_OBELISK_GATE);return;}setAutoFloor(game,!game.autoFloor);const advanced=advanceCompletedFloors();save();updateHud();if(!advanced)notice('AUTO FLOOR '+(game.autoFloor?'ENABLED':'DISABLED'));};document.querySelectorAll('.dock button').forEach(b=>{if(b.id!=='hubCloseDock'&&b.id!=='shopDock')b.onclick=()=>openMenu(b.dataset.menu);});window.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('confirm').classList.contains('hidden'))$('confirm').classList.add('hidden');else closeMenu();}});let backgroundAt=null;document.addEventListener('visibilitychange',()=>{if(document.hidden){backgroundAt=Date.now();save();}else if(backgroundAt){const summary=offlineGrant(game,(Date.now()-backgroundAt)/1000);backgroundAt=null;if(summary.ore){eventLog('Drone gathered '+summary.ore+' ore while away');notice('DRONE RETURNED WITH '+summary.ore+' ORE');save();updateHud();}}});window.addEventListener('pagehide',save);
updateHud();requestAnimationFrame(draw);setInterval(tick,250);setInterval(save,8000);
if(offlineSummary&&offlineSummary.rocks){eventLog('Drone gathered '+offlineSummary.ore+' ore during '+Math.round(offlineSummary.seconds/60)+' minutes away');setTimeout(()=>notice('WELCOME BACK! DRONE MINED '+offlineSummary.ore+' ORE'),500);save();}
// Expose a small read-only debugging surface for automated smoke tests. Not part of game UI.
window.__deepMineTest={chests:()=>({item:chestStatus(game,'item'),relic:chestStatus(game,'relic'),items:structuredClone(game.consumables)}),recordChestDamage:damage=>recordChestDamage(game,damage),fireBombs:mode=>detonate(mode),bombHold:()=>({held:bombHeld,next:bombNextHoldAt}),bombRecharge:()=>bombRechargeInfo(),advanceBombRecharge,renderQuickDrawer,snapshot:()=>structuredClone(game),openMenu,rockCount:()=>rocks.length,wave:()=>({number:waveNumber,size:rocks.length,nextIn:nextWaveAt?secondsToWave(nextWaveAt,performance.now()):0,queued:Boolean(nextWaveAt)}),rocks:()=>rocks.map(r=>({id:r.id,x:r.x,y:r.y,hp:r.hp,ore:r.ore})),hand:()=>({...hand,radius:handReach(game)}),autoFloorInfo:()=>({unlocked:game.autoFloorUnlocked,on:game.autoFloor,points:game.skillPoints,obelisk:game.obeliskLevel}),drone:()=>({...droneMotion}),swingAt:(x,y)=>swingHand(x,y)};