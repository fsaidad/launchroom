import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const base = process.env.LAUNCHROOM_URL || 'http://127.0.0.1:5173';
const session = () => `lr_workspace=${randomUUID()}`;
const cookie = session();
let checks = 0;
async function call(path='', method='GET', body, owner=cookie, headers={}) {
 const response = await fetch(`${base}/api/requests${path}`, {method, headers:{Cookie:owner,'Content-Type':'application/json',...headers},...(body!==undefined?{body:typeof body==='string'?body:JSON.stringify(body)}:{})});
 const text = await response.text();
 let data;try{data=JSON.parse(text);}catch{data={message:text};}
 return {status:response.status,body:data};
}
function check(condition,label){assert.ok(condition,label);checks++;console.log(`PASS ${label}`);}
const brief = {title:'Synthetic integration brief',market:'DE',language:'en',pageType:'comparison',budget:'medium',deadline:new Date(Date.now()+604800000).toISOString().slice(0,10),objective:'Compare three fictional partners using clear conditions and an accessible category filter.',acceptance:'Three cards, keyboard navigation, 360 px layout and an empty state.',idempotencyKey:randomUUID()};
check((await call()).body.requests.length===0,'new workspace is empty');
check((await call('','POST',{})).status===422,'invalid brief is rejected');
check((await call('','POST','{')).status===400,'malformed JSON is rejected');
check((await call('','POST',brief,cookie,{Origin:'https://foreign.invalid'})).status===403,'foreign origin is rejected');
const created=await call('','POST',brief);check(created.status===201,'valid brief is saved');
const id=created.body.request.id;
const replay=await call('','POST',brief);check(replay.status===200&&replay.body.request.id===id,'retry reuses the same request');
check((await call()).body.requests.length===1,'saved request persists on a fresh read');
check((await call(`/${id}`)).body.events.length===1,'retry does not duplicate history');
check((await call(`/${id}`,'GET',undefined,session())).status===404,'another workspace cannot read the request');
check((await call(`/${id}`,'PATCH',null)).status===422,'null update is rejected');
check((await call(`/${id}`,'PATCH',{version:1,status:'delivered'})).status===422,'status cannot skip required steps');
check((await call(`/${id}`,'PATCH',{version:1,status:'scoped'})).status===200,'scope confirmation is saved');
check((await call(`/${id}`,'PATCH',{version:1,status:'cancelled'})).status===409,'stale version is rejected');
const race=await Promise.all([call(`/${id}`,'PATCH',{version:2,status:'in_progress'}),call(`/${id}`,'PATCH',{version:2,status:'in_progress'})]);
check(race.map(x=>x.status).sort().join(',')==='200,409','only one concurrent update succeeds');
let detail=await call(`/${id}`);check(detail.body.request.version===3&&detail.body.events.length===3,'concurrent update keeps one history event');
check((await call(`/${id}`,'PATCH',{version:3,status:'delivered'})).status===200,'delivery completes the lifecycle');
check((await call(`/${id}`,'PATCH',{version:4,status:'scoped'})).status===422,'closed request cannot be reopened');
detail=await call(`/${id}`);check(detail.body.events.map(x=>x.status).join(',')==='received,scoped,in_progress,delivered','history preserves the lifecycle order');
const owner=session(); const double={...brief,idempotencyKey:randomUUID()};
const concurrent=await Promise.all([call('','POST',double,owner),call('','POST',double,owner)]);
check(concurrent.every(x=>[200,201].includes(x.status))&&concurrent[0].body.request.id===concurrent[1].body.request.id,'simultaneous duplicate submissions reuse the same ID');
check((await call(`/${concurrent[0].body.request.id}`,'GET',undefined,owner)).body.events.length===1,'simultaneous duplicates create one event');
const quota=session();const bulk=await Promise.all(Array.from({length:22},()=>call('','POST',{...brief,idempotencyKey:randomUUID()},quota)));
check(bulk.filter(x=>x.status===201).length===20&&bulk.filter(x=>x.status===429).length===2,'workspace quota holds under concurrent submissions');
console.log(`Verified ${checks} API checks against ${base}`);
