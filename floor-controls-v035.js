// Floor control state and active-node helpers. Keeps floor unlocking in core.js.
import {floorQuota,getFloorProgress} from './core.js';

export function floorTravelDisplay(game){
  const remaining=Math.max(0,floorQuota(game.floor)-getFloorProgress(game));
  // Going down means a higher numbered floor; allow it once visited or newly unlocked.
  const canTravel=game.floor<game.highestFloor||remaining===0;
  return canTravel
    ? {label:'▼',canTravel:true,title:`Move down to floor ${game.floor+1}`}
    : {label:String(remaining),canTravel:false,title:`${remaining} full clears to unlock floor ${game.floor+1}`};
}

export function activeRocks(rocks){return rocks.filter(rock=>rock.hp>0);}
export function waveComplete(rocks){return rocks.length>0&&rocks.every(rock=>rock.hp<=0);}
