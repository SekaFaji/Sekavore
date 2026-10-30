// Sekavore mining-field renderer v0.18: self-contained procedural art.
// Drawing only. Rock ownership, health, damage, targeting and rewards stay in core/game.
const FIELD_WIDTH = 360;
const FIELD_HEIGHT = 602;
let cachedImage = null;
let cachedFloor = -1;
const impacts = [];
const colors = [
  {floor:'#635f5b',top:'#817970',mid:'#77716a',dark:'#534f4e',edge:'#494846',glow:'#ffd04d',gold:'#d59427'},
  {floor:'#5a5959',top:'#777472',mid:'#6d6969',dark:'#4e4d51',edge:'#41434c',glow:'#f5c257',gold:'#b97a29'},
  {floor:'#535e61',top:'#727a7b',mid:'#647071',dark:'#485254',edge:'#3d4c51',glow:'#f0b75a',gold:'#b78336'},
  {floor:'#62545a',top:'#7b6a72',mid:'#6c5c65',dark:'#4e424c',edge:'#413842',glow:'#f5b961',gold:'#b8743c'}
];
function hash(x,y,k=0){let q=Math.sin(x*91.371+y*173.137+k*41.77)*43758.5453;return q-Math.floor(q);}
function polygon(c,pts,fill,stroke=null,width=1){c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke();}}
function line(c,pts,color,width){c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.strokeStyle=color;c.lineWidth=width;c.lineCap='square';c.lineJoin='bevel';c.stroke();}
function box(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));}
function drawFloorImage(floor){
 const canvas=document.createElement('canvas');canvas.width=FIELD_WIDTH;canvas.height=FIELD_HEIGHT;
 const c=canvas.getContext('2d',{alpha:false});const pal=colors[Math.floor((floor-1)/5)%colors.length];
 box(c,0,0,360,602,pal.edge);
 // Large uneven flagstones form the readable cave floor, rather than repeating pebbles.
 for(let gy=-2;gy<21;gy++)for(let gx=-2;gx<15;gx++){
  // Offset and outline vary per stone, avoiding a repeated diagonal-block pattern.
  const xx=gx*31+(gy%2)*15+hash(gx,gy,1)*13-10;
  const yy=gy*32+hash(gx,gy,2)*12-9;
  const w=28+hash(gx,gy,3)*15,h=29+hash(gx,gy,4)*13;
  const pts=[[xx+hash(gx,gy,7)*9,yy+1],[xx+w*.43,yy-3],[xx+w,yy+hash(gx,gy,8)*9],
             [xx+w+2,yy+h*.39],[xx+w*.7,yy+h],[xx+w*.17,yy+h+2],
             [xx-4,yy+h*.63],[xx-2,yy+h*.25]];
  const shade=hash(gx,gy,6),f=shade>.75?pal.top:shade>.21?pal.mid:pal.floor;
  polygon(c,pts,f,pal.edge,2.3);
  polygon(c,[[xx+8,yy+4],[xx+w*.45,yy+1],[xx+w*.78,yy+6],[xx+w*.41,yy+7]],pal.top);
  line(c,[[xx+3,yy+h*.62],[xx+10,yy+h*.85],[xx+w*.47,yy+h*.84]],pal.dark,1.4);
  if(shade>.77){line(c,[[xx+w*.65,yy+7],[xx+w*.53,yy+h*.42],[xx+w*.74,yy+h*.63]],pal.dark,1.2)}
  // Dithered stone grain and worn edges vary across the original floor tiles.
  if(shade>.14){
   const mx=xx+w*(.27+hash(gx,gy,11)*.25), my=yy+h*(.32+hash(gx,gy,12)*.26);
   box(c,mx,my,2,1,pal.dark);
   if(shade>.61)box(c,mx+5,my+4,2,2,pal.top);
  }
 }
 // Thin amber seams inside selected fractures. These are drawn once per floor.
 c.save();c.globalAlpha=.38;
 for(let i=0;i<17;i++){
  const x=12+hash(i,7,1)*326, y=16+hash(i,8,2)*555;
  const pts=[[x,y],[x+6,y+10],[x+1,y+20],[x+10,y+27],[x+6,y+39]];
  line(c,pts,pal.glow,8);line(c,pts,pal.gold,4);
 }
 c.restore();
 for(let i=0;i<17;i++){
  const x=12+hash(i,7,1)*326, y=16+hash(i,8,2)*555;
  const pts=[[x,y],[x+6,y+10],[x+1,y+20],[x+10,y+27],[x+6,y+39]];
  line(c,pts,pal.edge,5);line(c,pts,pal.gold,3);line(c,pts,pal.glow,1.4);
  if(i%3===0)line(c,[[x+1,y+20],[x-8,y+27],[x-11,y+32]],pal.gold,2);
 }
 // Tiny ore glints are scenery only; there is no collectible node underneath.
 for(let i=0;i<75;i++){
  const x=hash(i,3,1)*360,y=hash(i,4,2)*600;
  if(y>270&&i%3===0)continue;
  const dark=hash(i,5,3)>.46;
  polygon(c,[[x,y],[x+3,y-4],[x+7,y-2],[x+6,y+3],[x+2,y+4]],dark?'#c89431':'#9b7541','#66553e',.9);
  box(c,x+2,y-2,2,2,dark?'#ffd665':'#caaf6c');
 }
 // Small cached cracks and embedded chips reduce repeating slab patterns.
 for(let i=0;i<42;i++){
  const x=8+hash(i,18,1)*344, y=12+hash(i,25,2)*575;
  const z=hash(i,31,3);
  if(z>.69){line(c,[[x-5,y-2],[x+1,y+2],[x+3,y+8]],pal.dark,1);box(c,x+3,y+6,2,2,pal.top);}
  else if(z>.31){polygon(c,[[x,y],[x+4,y-3],[x+7,y-1],[x+6,y+4],[x+1,y+5]],pal.dark);box(c,x+2,y-2,3,1,pal.top);}
 }
 // The side edges are dark stone, but no longer dominate the mining area.
 for(let s of [0,351])for(let y=0;y<602;y+=31){
  let z=hash(s,y,1)*8;
  polygon(c,[[s-7,y],[s+7+z,y+5],[s+7+z,y+22],[s-7,y+29]],pal.dark);
  box(c,s,y+5,4,15,pal.top);
 }
 box(c,0,0,360,5,'#443c3e');box(c,0,598,360,4,'#40393d');
 return canvas;
}
export function drawCavernGround(ctx,floor,now=performance.now()){
 if(cachedFloor!==floor||!cachedImage){cachedImage=drawFloorImage(floor);cachedFloor=floor}
 ctx.drawImage(cachedImage,0,0);
 // Low-contrast decorative dust motes drift above the cached floor.
 const seconds=now/1000;
 ctx.save();
 for(let i=0;i<13;i++){
  const x=9+hash(i,37,1)*342+Math.sin(seconds*(.27+hash(i,20,1)*.24)+i)*3;
  const travel=seconds*(3.1+hash(i,19,2)*3.0);
  const y=(hash(i,23,2)*610-travel%610+610)%610;
  const glint=(Math.sin(seconds*(.55+hash(i,21,3)) + i*1.3)+1)*.5;
  ctx.globalAlpha=.075+glint*.13;
  box(ctx,x,y,i%5===0?3:2,i%4===0?3:2,i%4===0?'#ffd176':'#ead9b7');
 }
 ctx.restore();
}
function stone(ctx,x,y,z,pal,seed){
 const dark=pal.dark,top=pal.top;
 polygon(ctx,[[x-z,y+z*.32],[x-z*.9,y-z*.48],[x-z*.42,y-z*.84],[x+z*.22,y-z],[x+z*.8,y-z*.54],[x+z,y+z*.24],[x+z*.48,y+z*.72],[x-z*.34,y+z*.68]],dark,'#27252a',1);
 polygon(ctx,[[x-z*.9,y-z*.42],[x-z*.30,y-z*.83],[x+z*.22,y-z*.95],[x+z*.46,y-z*.45],[x+z*.23,y+z*.22],[x-z*.5,y+z*.2]],pal.mid);
 polygon(ctx,[[x-z*.86,y-z*.39],[x-z*.24,y-z*.79],[x+z*.10,y-z*.82],[x-z*.05,y-z*.53],[x-z*.63,y-z*.12]],top);
 line(ctx,[[x+z*.46,y-z*.39],[x+z*.20,y+z*.23],[x+z*.48,y+z*.55]],pal.edge,1.5);
 if(seed>1){box(ctx,x-z*.63,y-z*.62,z*.33,2,pal.light)}
}
export function drawCavernRock(ctx,r,ores){
 const fresh=impacts.findLast(e=>!e.broken&&e.x===r.x&&e.y===r.y&&(performance.now()-e.born)<140);
 const shake=fresh?Math.max(0,1-(performance.now()-fresh.born)/185):0;
 const now=performance.now();
 const hover=Math.sin(now*.00125+r.x*.071+r.y*.039)*.45;
 const x=Math.round(r.x+(shake?Math.sin(now*.27+r.x)*shake*2.7:0));
 const y=Math.round(r.y+hover+(shake?Math.cos(now*.33+r.y)*shake*1.7:0));
 const z=Math.round(r.size||15),v=(r.variant||0)%4;
 const ore=ores.find(o=>o.id===r.ore)||ores[0];
 const pal={dark:'#29272d',mid:'#49474b',top:'#817e7c',edge:'#222128',light:'#b9b0a2'};
 const metal={dark:'#514c49',mid:'#77716c',top:'#b2ada5',edge:'#3b3739',light:'#e0d4ba'};
 box(ctx,x-z+1,y+z*.55,z*2+3,4,'#28202299');
 if(v===0){
  // Broad anthracite clump with offset pebbles.
  stone(ctx,x-4,y+1,z*.82,pal,1);stone(ctx,x+z*.43,y+z*.26,z*.72,pal,0);stone(ctx,x+1,y-z*.14,z*.78,pal,0);
 }else if(v===1){
  // Layered metallic ore lumps.
  stone(ctx,x-4,y+1,z*.82,metal,2);stone(ctx,x+z*.42,y+z*.34,z*.60,metal,2);stone(ctx,x+2,y-z*.36,z*.75,metal,1);
 }else if(v===2){
  // Ore seam with a cluster of colored mineral faces.
  stone(ctx,x,y+2,z,metal,2);
  polygon(ctx,[[x-z*.42,y],[x-z*.10,y-z*.68],[x+z*.14,y-z*.53],[x+z*.19,y+z*.14]],ore.edge,'#332b31',1);
  polygon(ctx,[[x-z*.30,y-1],[x-z*.06,y-z*.56],[x+z*.02,y-z*.42],[x+z*.07,y+1]],ore.color);
  polygon(ctx,[[x+z*.25,y+z*.12],[x+z*.49,y-z*.34],[x+z*.65,y+z*.20],[x+z*.38,y+z*.41]],ore.color);
 }else{
  // Dark root-like mineral growth, not a new gameplay object.
  line(ctx,[[x,y+z*.7],[x-4,y+3],[x-1,y-z*.6]],'#29262a',5);
  line(ctx,[[x-1,y+3],[x-z*.88,y+z*.32],[x-z,y+z*.72]],'#332a27',3);
  line(ctx,[[x+2,y+5],[x+z*.75,y+z*.21],[x+z*.88,y-z*.35]],'#332a27',3);
  stone(ctx,x-2,y-z*.23,z*.58,pal,0);
  box(ctx,x-1,y-z*.39,3,4,ore.color);
 }
 // Each rock has an ore cue, even for basic tin.
 box(ctx,x-z*.55,y+z*.35,3,3,ore.edge);box(ctx,x-z*.47,y+z*.23,2,2,ore.color);
 // Tiny mineral facets shimmer independently of gameplay.
 const fleck=((Math.floor(now/680)+Math.floor(r.x))%5===0);
 if(v===1||v===2){
  box(ctx,x+z*.1,y-z*.7,3,2,ore.edge);
  box(ctx,x+z*.13,y-z*.68,2,2,ore.color);
  if(fleck){ctx.save();ctx.globalAlpha=.7;box(ctx,x+z*.26,y-z*.75,2,2,'#fff4c7');ctx.restore();}
 }
 const damage=r.max>0?Math.max(0,1-r.hp/r.max):0;
 if(damage>.12){line(ctx,[[x+z*.05,y-z*.35],[x-1,y-2],[x+z*.29,y+z*.28]],'#211d24',Math.min(3,1+damage*2));}
 if(damage>0){box(ctx,x-z,y-z-13,2*z,4,'#161820');box(ctx,x-z+1,y-z-12,(2*z-2)*Math.max(0,1-damage),2,'#e3a16d')}
 // Short, nonrectangular chipping gleam at a genuinely struck rock.
 if(shake>0){
  ctx.save();ctx.globalAlpha=Math.min(.5,shake*.48);
  const sparkleY=y-z*.55;
  line(ctx,[[x-z*.46,sparkleY],[x-z*.18,sparkleY-3],[x+z*.03,sparkleY-2]],ore.color,2);
  box(ctx,x+z*.35,y-z*.33,3,2,'#ffeed4');
  ctx.restore();
 }
}
export function recordMiningImpact(x,y,oreColor='#e8cb78',broken=false){
 impacts.push({x,y,color:oreColor,born:performance.now(),broken});
 if(impacts.length>26)impacts.splice(0,impacts.length-26);
}
export function drawMiningImpacts(ctx,now=performance.now()){
 for(let i=impacts.length-1;i>=0;i--){
  const e=impacts[i],t=(now-e.born)/(e.broken?500:300);
  if(t>=1){impacts.splice(i,1);continue}
  ctx.save();ctx.globalAlpha=(1-t)*.7;const reach=7+t*(e.broken?25:12);
  ctx.strokeStyle=e.broken?'#ffcf6a':e.color;ctx.lineWidth=e.broken?2:1.4;
  for(let a=0;a<6;a++){const theta=a*Math.PI/3+(e.x%6)*.12;const u=Math.cos(theta),v=Math.sin(theta);
   line(ctx,[[e.x+u*reach*.52,e.y+v*reach*.52],[e.x+u*reach,e.y+v*reach]],ctx.strokeStyle,ctx.lineWidth);
  }
  // Flecks follow real rock impacts, with no effect on hit-testing or loot.
  for(let k=0;k<(e.broken?12:5);k++){
   const a=k*2.39996+e.x*.031,dist=(2+t*(e.broken?31:15))*(.55+(k%3)*.18);
   const fx=e.x+Math.cos(a)*dist,fy=e.y+Math.sin(a)*dist-t*t*7;
   box(ctx,fx,fy,k%2?2:3,k%3?2:3,k%3===0?'#eab462':e.color);
  }
  // Angular debris, short luminous core, and a fading break-only dust burst.
  ctx.globalAlpha=(1-t)*.38;
  const shardCount=e.broken?7:3;
  for(let j=0;j<shardCount;j++){
   const theta=j*2.39996+e.y*.034, radial=3+t*(e.broken?21:10);
   const sx=e.x+Math.cos(theta)*radial,sy=e.y+Math.sin(theta)*radial-t*5;
   polygon(ctx,[[sx,sy-3],[sx+2,sy],[sx,sy+4],[sx-2,sy+1]],j%2?'#f4d88e':e.color);
  }
  ctx.globalAlpha=(1-t)*.19;
  box(ctx,e.x-4,e.y-4,8,7,'#ffe2a7');
  if(e.broken){
   ctx.globalAlpha=(1-t)*.22;
   for(let k=0;k<5;k++){
    const dx=(k-2)*7*(.4+t),dy=-3-t*9+(k%2)*3;
    box(ctx,e.x+dx-3,e.y+dy,5+t*3,3+t*2,'#d9cbad');
   }
  }
  ctx.restore();
 }
}
export function resetMiningVisuals(){impacts.length=0;cachedFloor=-1;cachedImage=null}