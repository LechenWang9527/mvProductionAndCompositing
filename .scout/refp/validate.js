const fs=require('fs');
const j=JSON.parse(fs.readFileSync('docs/notes/prompts_picks.json','utf8'));
const okS=['00 hook','01 dufu','02 dufu-son','03 hook','04 liubang','05 you-too','06 war','07 ledger','08 wind','09 hook-marpol','10 biwu','11 ppt','12 no-complaint','13 hook-marpol','14 laocao','15 wuhan','16 gaoxiaofan','17 gary','18 chuanyong','19 allen','20 xiaoma','21 hook-marpol','22 finale'];
console.log('styles',j.styles.length,'techniques',j.techniques.length,'rules',j.export_rules.length,'avoid',j.avoid.length,'recs',j.recommendations.length);
const bad=[]; j.styles.forEach(s=>{ s.sections.forEach(x=>{ if(!okS.includes(x)) bad.push(s.id+':'+x); });
 if(!s.id||!s.name||!s.visual||!s.pitfall) bad.push('missing field '+s.id);
 if(s.prompt.length<3||s.prompt.length>5) bad.push('prompt count '+s.id+'='+s.prompt.length); });
console.log('bad sections/fields:',bad.length?bad:'none');
const ids=j.styles.map(s=>s.id); console.log('dup ids:', ids.filter((v,i)=>ids.indexOf(v)!==i).length?ids.filter((v,i)=>ids.indexOf(v)!==i):'none');
const used=new Set(); j.styles.forEach(s=>s.sections.forEach(x=>used.add(x)));
console.log('sections covered',used.size,'/23 ->',okS.filter(x=>!used.has(x)).join(', ')||'all');
// markdown table row count
const md=fs.readFileSync('docs/REFPROMPTS.md','utf8');
const rows=(md.match(/^\| \*\*[A-Z]{1,2}\d+/gm)||[]).length;
console.log('md style rows',rows,'md bytes',Buffer.byteLength(md),'md lines',md.split('\n').length);
const idsInMd=[...md.matchAll(/^\| \*\*([A-Z]{1,2}\d+)\*\*/gm)].map(m=>m[1]);
console.log('md ids not in json:',idsInMd.filter(x=>!ids.includes(x)).join(',')||'none');
console.log('json ids not in md:',ids.filter(x=>!idsInMd.includes(x)).join(',')||'none');
