// =============================================
// JoyPop 关卡数据 (50关)
// =============================================
import { OBJECTIVE_TYPE } from '../config/GameConfig.js';

// 障碍物类型
export const OBSTACLE = {
  ICE: 'ice',     // 冰块 (消除1次)
  ICE2: 'ice2',   // 厚冰 (消除2次)
  CAGE: 'cage',   // 铁笼 (消除2次相邻)
  STONE: 'stone', // 石头 (不可消，道具才能)
  JAM: 'jam',     // 果酱 (周围消除蔓延)
};

// 关卡生成辅助函数
function level(id, moves, objectives, obstacles = [], specialStart = [], minTileTypes = 4) {
  return { id, moves, objectives, obstacles, specialStart, minTileTypes };
}

function obj(type, target, count, icon = '') {
  return { type, target, count, done: 0, icon };
}

export const LEVELS = [
  // ===================== 第一章：籁蛋园 (1-10) =====================
  level(1,  20, [obj(OBJECTIVE_TYPE.CLEAR_COUNT, null, 20, 'tile_strawberry')], [], [], 4),
  level(2,  22, [obj(OBJECTIVE_TYPE.CLEAR_COUNT, null, 30, 'tile_grape')], [], [], 4),
  level(3,  18, [obj(OBJECTIVE_TYPE.CLEAR_COLOR, 0,   15, 'tile_strawberry'), obj(OBJECTIVE_TYPE.CLEAR_COLOR, 2, 15, 'tile_orange')], [], [], 4),
  level(4,  20, [obj(OBJECTIVE_TYPE.BREAK_ICE, null,  10, 'tile_crystal')],
    [{r:3,c:2}, {r:3,c:3}, {r:3,c:4}, {r:2,c:1}, {r:2,c:5}, {r:4,c:2}, {r:4,c:3}, {r:4,c:4}, {r:1,c:3}, {r:5,c:3}], [], 5),
  level(5,  24, [obj(OBJECTIVE_TYPE.CLEAR_COUNT, null, 40, 'star_gold'), obj(OBJECTIVE_TYPE.CLEAR_COLOR, 6, 10, 'tile_diamond')], [], [], 5),
  level(6,  22, [obj(OBJECTIVE_TYPE.BREAK_ICE, null,  15, 'tile_crystal')],
    [{r:0,c:0},{r:0,c:6},{r:1,c:1},{r:1,c:5},{r:2,c:2},{r:2,c:4},{r:3,c:0},{r:3,c:6},{r:4,c:1},{r:4,c:5},{r:5,c:2},{r:5,c:4},{r:6,c:0},{r:6,c:3},{r:6,c:6}], [], 5),
  level(7,  20, [obj(OBJECTIVE_TYPE.REACH_SCORE, null, 5000, 'star_gold')], [], [], 5),
  level(8,  25, [obj(OBJECTIVE_TYPE.CLEAR_COLOR, 1, 20, 'tile_grape'), obj(OBJECTIVE_TYPE.CLEAR_COLOR, 3, 20, 'tile_blueberry')], [], [], 5),
  level(9,  18, [obj(OBJECTIVE_TYPE.BREAK_CAGE, null, 8, 'ui_lock')],
    [{r:2,c:1,type:OBSTACLE.CAGE},{r:2,c:5,type:OBSTACLE.CAGE},{r:3,c:0,type:OBSTACLE.CAGE},{r:3,c:6,type:OBSTACLE.CAGE},{r:4,c:1,type:OBSTACLE.CAGE},{r:4,c:5,type:OBSTACLE.CAGE},{r:5,c:2,type:OBSTACLE.CAGE},{r:5,c:4,type:OBSTACLE.CAGE}], [], 5),
  level(10, 30, [obj(OBJECTIVE_TYPE.CLEAR_COUNT, null, 60, 'star_gold'), obj(OBJECTIVE_TYPE.REACH_SCORE, null, 8000, 'star_gold')], [], [], 6),

  // ===================== 第二章：冰雪山 (11-20) =====================
  level(11, 22, [obj(OBJECTIVE_TYPE.BREAK_ICE, null, 12, 'tile_crystal'), obj(OBJECTIVE_TYPE.CLEAR_COLOR, 3, 15, 'tile_blueberry')],
    [{r:0,c:0},{r:0,c:1},{r:0,c:2},{r:0,c:4},{r:0,c:5},{r:0,c:6},{r:6,c:0},{r:6,c:2},{r:6,c:4},{r:6,c:6},{r:3,c:0},{r:3,c:6}], [], 5),
  level(12, 25, [obj(OBJECTIVE_TYPE.BREAK_ICE, null, 20, 'tile_crystal')],
    Array.from({length:14},(_,i)=>({r:Math.floor(i/7),c:i%7,type:OBSTACLE.ICE})), [], 5),
  level(13, 20, [obj(OBJECTIVE_TYPE.CLEAR_COLOR, 0, 25, 'tile_strawberry'), obj(OBJECTIVE_TYPE.CLEAR_COLOR, 4, 25, 'tile_watermelon')], [], [], 6),
  level(14, 22, [obj(OBJECTIVE_TYPE.BREAK_CAGE, null, 12, 'ui_lock')],
    [{r:1,c:1,type:OBSTACLE.CAGE},{r:1,c:3,type:OBSTACLE.CAGE},{r:1,c:5,type:OBSTACLE.CAGE},{r:3,c:0,type:OBSTACLE.CAGE},{r:3,c:2,type:OBSTACLE.CAGE},{r:3,c:4,type:OBSTACLE.CAGE},{r:3,c:6,type:OBSTACLE.CAGE},{r:5,c:1,type:OBSTACLE.CAGE},{r:5,c:3,type:OBSTACLE.CAGE},{r:5,c:5,type:OBSTACLE.CAGE},{r:2,c:2,type:OBSTACLE.CAGE},{r:4,c:4,type:OBSTACLE.CAGE}], [], 6),
  level(15, 24, [obj(OBJECTIVE_TYPE.REACH_SCORE, null, 10000, 'star_gold'), obj(OBJECTIVE_TYPE.CLEAR_COLOR, 6, 20, 'tile_diamond')], [], [], 6),
  level(16, 20, [obj(OBJECTIVE_TYPE.BREAK_ICE, null, 25, 'tile_crystal')],
    Array.from({length:25},(_,i)=>({r:Math.floor(i/5)+1,c:i%5+1})), [], 6),
  level(17, 26, [obj(OBJECTIVE_TYPE.CLEAR_COUNT, null, 80, 'star_gold'), obj(OBJECTIVE_TYPE.CLEAR_COLOR, 7, 15, 'tile_crystal')], [], [], 6),
  level(18, 22, [obj(OBJECTIVE_TYPE.BREAK_CAGE, null, 15, 'ui_lock'), obj(OBJECTIVE_TYPE.BREAK_ICE, null, 10, 'tile_crystal')],
    [{r:0,c:2,type:OBSTACLE.CAGE},{r:0,c:4,type:OBSTACLE.CAGE},{r:2,c:0,type:OBSTACLE.CAGE},{r:2,c:6,type:OBSTACLE.CAGE},{r:4,c:0,type:OBSTACLE.CAGE},{r:4,c:6,type:OBSTACLE.CAGE},{r:6,c:2,type:OBSTACLE.CAGE},{r:6,c:4,type:OBSTACLE.CAGE},{r:1,c:1},{r:1,c:5},{r:3,c:3},{r:5,c:1},{r:5,c:5},{r:0,c:0},{r:0,c:6}], [], 6),
  level(19, 20, [obj(OBJECTIVE_TYPE.REACH_SCORE, null, 12000, 'star_gold')], [], [], 7),
  level(20, 35, [obj(OBJECTIVE_TYPE.CLEAR_COUNT, null, 100, 'star_gold'), obj(OBJECTIVE_TYPE.BREAK_ICE, null, 20, 'tile_crystal'), obj(OBJECTIVE_TYPE.REACH_SCORE, null, 15000, 'star_gold')],
    Array.from({length:20},(_,i)=>({r:Math.floor(i/4),c:i%7})), [], 7),

  // ===================== 第三章：海底潜水 (21-30) =====================
  level(21, 25, [obj(OBJECTIVE_TYPE.CLEAR_COLOR, 3, 30, 'tile_blueberry'), obj(OBJECTIVE_TYPE.CLEAR_COLOR, 6, 20, 'tile_diamond')], [], [], 6),
  level(22, 22, [obj(OBJECTIVE_TYPE.BREAK_ICE, null, 25, 'tile_crystal'), obj(OBJECTIVE_TYPE.BREAK_CAGE, null, 8, 'ui_lock')],
    Array.from({length:25},(_,i)=>({r:Math.floor(i/5),c:i%5+1})), [], 6),
  level(23, 26, [obj(OBJECTIVE_TYPE.REACH_SCORE, null, 18000, 'star_gold'), obj(OBJECTIVE_TYPE.CLEAR_COUNT, null, 90, 'star_gold')], [], [], 7),
  level(24, 20, [obj(OBJECTIVE_TYPE.BREAK_CAGE, null, 20, 'ui_lock')],
    Array.from({length:20},(_,i)=>({r:Math.floor(i/4),c:i%7,type:OBSTACLE.CAGE})), [], 7),
  level(25, 28, [obj(OBJECTIVE_TYPE.CLEAR_COLOR, 1, 35, 'tile_grape'), obj(OBJECTIVE_TYPE.CLEAR_COLOR, 7, 25, 'tile_crystal'), obj(OBJECTIVE_TYPE.REACH_SCORE, null, 20000, 'star_gold')], [], [], 7),
  level(26, 22, [obj(OBJECTIVE_TYPE.BREAK_ICE, null, 30, 'tile_crystal')],
    Array.from({length:30},(_,i)=>({r:Math.floor(i/7),c:i%7})), [], 7),
  level(27, 25, [obj(OBJECTIVE_TYPE.CLEAR_COUNT, null, 110, 'star_gold'), obj(OBJECTIVE_TYPE.CLEAR_COLOR, 5, 25, 'tile_cherry')], [], [], 7),
  level(28, 24, [obj(OBJECTIVE_TYPE.BREAK_CAGE, null, 22, 'ui_lock'), obj(OBJECTIVE_TYPE.BREAK_ICE, null, 12, 'tile_crystal')],
    Array.from({length:22},(_,i)=>({r:Math.floor(i/4),c:i%7,type:i%2===0?OBSTACLE.CAGE:OBSTACLE.ICE})), [], 7),
  level(29, 22, [obj(OBJECTIVE_TYPE.REACH_SCORE, null, 25000, 'star_gold'), obj(OBJECTIVE_TYPE.CLEAR_COLOR, 6, 30, 'tile_diamond')], [], [], 7),
  level(30, 40, [obj(OBJECTIVE_TYPE.CLEAR_COUNT, null, 130, 'star_gold'), obj(OBJECTIVE_TYPE.BREAK_ICE, null, 25, 'tile_crystal'), obj(OBJECTIVE_TYPE.BREAK_CAGE, null, 15, 'ui_lock'), obj(OBJECTIVE_TYPE.REACH_SCORE, null, 30000, 'star_gold')],
    Array.from({length:25},(_,i)=>({r:Math.floor(i/5)+1,c:i%5+1})), [], 7),

  // ===================== 第四章：樱花森林 (31-40) =====================
  level(31, 26, [obj(OBJECTIVE_TYPE.CLEAR_COLOR, 0, 40, 'tile_strawberry'), obj(OBJECTIVE_TYPE.CLEAR_COLOR, 5, 30, 'tile_cherry')], [], [], 7),
  level(32, 24, [obj(OBJECTIVE_TYPE.BREAK_ICE, null, 35, 'tile_crystal'), obj(OBJECTIVE_TYPE.BREAK_CAGE, null, 12, 'ui_lock')],
    Array.from({length:35},(_,i)=>({r:Math.floor(i/7),c:i%7,type:i%3===0?OBSTACLE.ICE:OBSTACLE.ICE})), [], 7),
  level(33, 28, [obj(OBJECTIVE_TYPE.REACH_SCORE, null, 35000, 'star_gold'), obj(OBJECTIVE_TYPE.CLEAR_COUNT, null, 120, 'star_gold')], [], [], 7),
  level(34, 22, [obj(OBJECTIVE_TYPE.BREAK_CAGE, null, 28, 'ui_lock')],
    Array.from({length:28},(_,i)=>({r:Math.floor(i/4),c:i%7,type:OBSTACLE.CAGE})), [], 7),
  level(35, 30, [obj(OBJECTIVE_TYPE.CLEAR_COLOR, 7, 40, 'tile_crystal'), obj(OBJECTIVE_TYPE.CLEAR_COLOR, 6, 35, 'tile_diamond'), obj(OBJECTIVE_TYPE.REACH_SCORE, null, 40000, 'star_gold')], [], [], 7),
  level(36, 24, [obj(OBJECTIVE_TYPE.BREAK_ICE, null, 40, 'tile_crystal')],
    Array.from({length:40},(_,i)=>({r:Math.floor(i/7),c:i%7})), [], 7),
  level(37, 28, [obj(OBJECTIVE_TYPE.CLEAR_COUNT, null, 140, 'star_gold'), obj(OBJECTIVE_TYPE.CLEAR_COLOR, 2, 35, 'tile_orange')], [], [], 7),
  level(38, 26, [obj(OBJECTIVE_TYPE.BREAK_CAGE, null, 30, 'ui_lock'), obj(OBJECTIVE_TYPE.BREAK_ICE, null, 18, 'tile_crystal'), obj(OBJECTIVE_TYPE.REACH_SCORE, null, 45000, 'star_gold')],
    Array.from({length:30},(_,i)=>({r:Math.floor(i/5),c:i%6+1,type:i%3===0?OBSTACLE.CAGE:OBSTACLE.ICE})), [], 7),
  level(39, 24, [obj(OBJECTIVE_TYPE.REACH_SCORE, null, 50000, 'star_gold'), obj(OBJECTIVE_TYPE.CLEAR_COLOR, 1, 45, 'tile_grape')], [], [], 7),
  level(40, 45, [obj(OBJECTIVE_TYPE.CLEAR_COUNT, null, 160, 'star_gold'), obj(OBJECTIVE_TYPE.BREAK_ICE, null, 30, 'tile_crystal'), obj(OBJECTIVE_TYPE.BREAK_CAGE, null, 20, 'ui_lock'), obj(OBJECTIVE_TYPE.REACH_SCORE, null, 55000, 'star_gold')],
    Array.from({length:30},(_,i)=>({r:Math.floor(i/6),c:i%7})), [], 7),

  // ===================== 第五章：星空城堡 (41-50) =====================
  level(41, 28, [obj(OBJECTIVE_TYPE.CLEAR_COLOR, 6, 50, 'tile_diamond'), obj(OBJECTIVE_TYPE.CLEAR_COLOR, 7, 45, 'tile_crystal')], [], [], 7),
  level(42, 26, [obj(OBJECTIVE_TYPE.BREAK_ICE, null, 45, 'tile_crystal'), obj(OBJECTIVE_TYPE.BREAK_CAGE, null, 20, 'ui_lock')],
    Array.from({length:45},(_,i)=>({r:Math.floor(i/7),c:i%7,type:i%4===0?OBSTACLE.ICE2:OBSTACLE.ICE})), [], 7),
  level(43, 30, [obj(OBJECTIVE_TYPE.REACH_SCORE, null, 60000, 'star_gold'), obj(OBJECTIVE_TYPE.CLEAR_COUNT, null, 150, 'star_gold')], [], [], 7),
  level(44, 25, [obj(OBJECTIVE_TYPE.BREAK_CAGE, null, 35, 'ui_lock')],
    Array.from({length:35},(_,i)=>({r:Math.floor(i/5),c:i%7,type:OBSTACLE.CAGE})), [], 7),
  level(45, 32, [obj(OBJECTIVE_TYPE.CLEAR_COLOR, 0, 55, 'tile_strawberry'), obj(OBJECTIVE_TYPE.CLEAR_COLOR, 4, 50, 'tile_watermelon'), obj(OBJECTIVE_TYPE.REACH_SCORE, null, 70000, 'star_gold')], [], [], 7),
  level(46, 28, [obj(OBJECTIVE_TYPE.BREAK_ICE, null, 50, 'tile_crystal'), obj(OBJECTIVE_TYPE.CLEAR_COUNT, null, 160, 'star_gold')],
    Array.from({length:49},(_,i)=>({r:Math.floor(i/7),c:i%7})), [], 7),
  level(47, 30, [obj(OBJECTIVE_TYPE.CLEAR_COUNT, null, 170, 'star_gold'), obj(OBJECTIVE_TYPE.CLEAR_COLOR, 5, 50, 'tile_cherry'), obj(OBJECTIVE_TYPE.REACH_SCORE, null, 75000, 'star_gold')], [], [], 7),
  level(48, 28, [obj(OBJECTIVE_TYPE.BREAK_CAGE, null, 40, 'ui_lock'), obj(OBJECTIVE_TYPE.BREAK_ICE, null, 25, 'tile_crystal'), obj(OBJECTIVE_TYPE.REACH_SCORE, null, 80000, 'star_gold')],
    Array.from({length:40},(_,i)=>({r:Math.floor(i/5),c:i%8,type:i%2===0?OBSTACLE.CAGE:OBSTACLE.ICE})), [], 7),
  level(49, 30, [obj(OBJECTIVE_TYPE.REACH_SCORE, null, 90000, 'star_gold'), obj(OBJECTIVE_TYPE.CLEAR_COLOR, 6, 60, 'tile_diamond'), obj(OBJECTIVE_TYPE.CLEAR_COLOR, 7, 55, 'tile_crystal')], [], [], 7),
  level(50, 50, [obj(OBJECTIVE_TYPE.CLEAR_COUNT, null, 200, 'star_gold'), obj(OBJECTIVE_TYPE.BREAK_ICE, null, 40, 'tile_crystal'), obj(OBJECTIVE_TYPE.BREAK_CAGE, null, 30, 'ui_lock'), obj(OBJECTIVE_TYPE.REACH_SCORE, null, 100000, 'star_gold')],
    Array.from({length:49},(_,i)=>({r:Math.floor(i/7),c:i%7,type:i%3===0?OBSTACLE.CAGE:i%3===1?OBSTACLE.ICE:OBSTACLE.ICE2})), [], 7),
];

export function getLevel(id) {
  return LEVELS.find(l => l.id === id) || LEVELS[0];
}

export function getChapterForLevel(id) {
  if (id <= 10) return 1;
  if (id <= 20) return 2;
  if (id <= 30) return 3;
  if (id <= 40) return 4;
  return 5;
}
