// Rendering-only per-node sprite cache. Nodes live only for one mining wave.
// Keep visual state separate from saves, ore rewards, targeting, and floor progress.
export const ROCK_SPRITE_SIZE=80;
const half=ROCK_SPRITE_SIZE/2;
const cache=new WeakMap();

export function drawCachedRock(ctx,rock,ores,paintRock,now=performance.now()){
  const hp=rock.hp>0?rock.hp:0;
  let entry=cache.get(rock);
  if(!entry){
    const image=document.createElement('canvas');
    image.width=ROCK_SPRITE_SIZE;image.height=ROCK_SPRITE_SIZE;
    const painter=image.getContext('2d');
    if(!painter){paintRock(ctx,rock,ores);return;}
    painter.imageSmoothingEnabled=false;
    entry={image,painter,hp:null};cache.set(rock,entry);
  }
  if(entry.hp!==hp){
    const p=entry.painter;
    p.setTransform(1,0,0,1,0,0);p.clearRect(0,0,ROCK_SPRITE_SIZE,ROCK_SPRITE_SIZE);
    p.save();p.translate(half-Math.round(rock.x),half-Math.round(rock.y));
    if(hp===0){p.globalAlpha=.74;p.filter='brightness(.31) saturate(.36)';}
    paintRock(p,rock,ores,true); // Static sprite; impacts are drawn independently.
    p.restore();
    entry.hp=hp;
  }
  let dx=0,dy=0;
  if(hp>0){
    dy=Math.round(rock.y+Math.sin(now*.00125+rock.x*.071+rock.y*.039)*.45)-Math.round(rock.y);
    const age=now-(rock.hitAt??-Infinity);
    if(age>=0&&age<185){
      const shake=1-age/185;
      dx=Math.round(Math.sin(now*.27+rock.x)*shake*2.7);
      dy+=Math.round(Math.cos(now*.33+rock.y)*shake*1.7);
    }
  }
  ctx.drawImage(entry.image,Math.round(rock.x)-half+dx,Math.round(rock.y)-half+dy);
  // Keep the original occasional mineral shimmer at negligible cost.
  if(hp>0&&((rock.variant||0)%4===1||(rock.variant||0)%4===2)
     &&(Math.floor(now/680)+Math.floor(rock.x))%5===0){
    const z=Math.round(rock.size||15);
    ctx.save();ctx.globalAlpha=.7;ctx.fillStyle='#fff4c7';
    ctx.fillRect(Math.round(rock.x+z*.26+dx),Math.round(rock.y+z*-0.75+dy),2,2);
    ctx.restore();
  }
}
