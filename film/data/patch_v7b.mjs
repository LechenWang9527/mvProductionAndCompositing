// 修 v7 patch 里三处 MISS：按实际 PLAN 行挂插图窗
import fs from 'fs';
const p = 'E:/新建文件夹/实习/MV/film/src/shotfilm.js';
let s = fs.readFileSync(p, 'utf8');
const reps = [
  [`    57: { k: 'blueprintHall', p: { paper: true, title: '努力 没有白费' } },`,
   `    57: { k: 'blueprintHall', p: { paper: true, title: '努力 没有白费', inset: 'P03', insetLabel: 'MIXING · 车间' } },`],
  [`    62: { k: 'blueprintHall', p: { paper: true, title: '胎面 胎侧 常破边' } },`,
   `    62: { k: 'blueprintHall', p: { paper: true, title: '胎面 胎侧 常破边', inset: 'P02', insetLabel: 'TREAD · 断面' } },`],
  [`    72: { k: 'badgePerson', p: { name: 'Allen Ma', role: '年纪轻轻', id: 'REC 0024', years: '1', tickets: '数据', stamp: '别慌' } },`,
   `    72: { k: 'badgePerson', p: { name: 'Allen Ma', role: '年纪轻轻', id: 'REC 0024', years: '1', tickets: '数据', stamp: '别慌', inset: 'P07', insetLabel: 'BADGE · 空位' } },`],
  // 古代段挂纸纹（P06）：#9 蓝图与 #12 灯箱各一处
  [`    9: { k: 'blueprintHall', p: { paper: true, title: '安得广厦千万间' } },`,
   `    9: { k: 'blueprintHall', p: { paper: true, title: '安得广厦千万间', inset: 'P06', insetLabel: 'PAPER · 帘纹' } },`],
];
let hit = 0;
for (const [a, b] of reps) {
  if (s.includes(a)) { s = s.replace(a, b); hit++; } else console.log('MISS:', a.slice(0, 50));
}
fs.writeFileSync(p, s);
console.log('inset wired', hit, '/', reps.length);
