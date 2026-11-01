// Floor control state and active-node helpers. Keeps floor unlocking in core.js.
import {floorQuota,getFloorProgress} from './core.js';

export function floorTravelDisplay(game){
  if(game.floor < game.highestFloor){
    return {label:'▼',canTravel:true,title:'Move to the next unlocked floor'};
  }
  const remaining=Math.max(0,floorQuota(game.floor)-getFloorProgress(game));
  return {label:String(remaining),canTravel:false,title:remaining?`${remaining} full clears to unlock the next floor`:'Next floor unlocked - use the up arrow'};
}

export function activeRocks(rocks){return rocks.filter(rock=>rock.hp>0);}
export function waveComplete(rocks){return rocks.length>0&&rocks.every(rock=>rock.hp<=0);}
