import test from 'node:test';
import assert from 'node:assert/strict';
import {bombSpendCount,nextBombHoldAt,BOMB_HOLD_INTERVAL_MS} from '../bomb-controls-v025.js';
test('regular fire uses one selected bomb charge',()=>{assert.equal(bombSpendCount(3,'single'),1);assert.equal(bombSpendCount(0,'single'),0)});
test('Fire All uses every currently available charge',()=>{assert.equal(bombSpendCount(3,'all'),3);assert.equal(bombSpendCount(120,'all'),120);assert.equal(bombSpendCount(-4,'all'),0);assert.equal(bombSpendCount(NaN,'all'),0)});
test('manual hold has the distinct 1.25-second cadence',()=>{assert.equal(BOMB_HOLD_INTERVAL_MS,1250);assert.equal(nextBombHoldAt(500),1750)});
