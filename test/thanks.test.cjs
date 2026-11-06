// Offline: no browser, dependencies, remote requests, or real signup submissions.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const helper=read('shared/thanks.js');
function receiptFixture({receipt=null,storageBlocked=false,source='charm',render=false,search='',hash=''}={}) {
 const stored=new Map(receipt===null?[]:[['veynor.waitlist.receipt.v1',JSON.stringify(receipt)]]),assignments=[],replaced=[];
 const els=Object.fromEntries(['[data-thanks-title]','[data-thanks-copy]','[data-thanks-back]'].map(x=>[x,{textContent:'neutral',href:'index.html'}]));
 const window={sessionStorage:{setItem(k,v){if(storageBlocked)throw Error('blocked');stored.set(k,v)},getItem(k){if(storageBlocked)throw Error('blocked');return stored.get(k)||null},removeItem(k){if(storageBlocked)throw Error('blocked');stored.delete(k)}},location:{assign(x){assignments.push(x)},search,hash,pathname:'/thank-you.html'},history:{replaceState(...args){replaced.push(args)}}};
 const document={querySelector(s){return s==='[data-waitlist-thanks]'?(render?{}:null):els[s]}};
 vm.runInNewContext(helper,{window,document,Date,JSON});
 return {window,stored,assignments,replaced,els,confirm:()=>window.VeynorThanks.afterWaitlist({getAttribute:()=>source})};
}
test('success receipt contains only allowed brand and time, never email',()=>{
 const f=receiptFixture(); assert.equal(f.confirm(),true);assert.deepEqual(f.assignments,['thank-you.html']);
 const r=JSON.parse([...f.stored.values()][0]);assert.deepEqual(Object.keys(r).sort(),['at','brand']);assert.equal(r.brand,'charm');
});
test('unknown source cannot become an external URL',()=>{
 for(const source of ['https://evil.example/?email=a@b.com','__proto__','constructor',null]){
  const f=receiptFixture({source});f.confirm();assert.equal(JSON.parse([...f.stored.values()][0]).brand,'veynor');assert.deepEqual(f.assignments,['thank-you.html']);
 }
});
test('blocked storage keeps visitor on original inline success',()=>{const f=receiptFixture({storageBlocked:true});assert.equal(f.confirm(),false);assert.deepEqual(f.assignments,[])});
test('direct visit cannot confirm signup even with crafted query; query and fragment removed',()=>{
 const f=receiptFixture({render:true,search:'?success=true&brand=charm&email=private@example.com&next=https://evil.example',hash:'#email=private@example.com'});
 assert.equal(f.els['[data-thanks-title]'].textContent,'neutral');assert.deepEqual(f.replaced,[[null,'','/thank-you.html']]);assert.deepEqual(f.assignments,[]);
});
test('fresh receipts confirm correct brand once with allowlisted return links',()=>{
 for(const brand of ['charm','solis','veynor']){
  const f=receiptFixture({render:true,receipt:{brand,at:Date.now()}});
  assert.equal(f.els['[data-thanks-title]'].textContent,"You're on the Veynor list.");
  assert.equal(f.els['[data-thanks-back]'].href,{charm:'charm.html',solis:'solis.html',veynor:'index.html'}[brand]);assert.equal(f.stored.size,0);
  vm.runInNewContext(helper,{window:f.window,document:{querySelector:s=>s==='[data-waitlist-thanks]'?{}:{textContent:'neutral'}},Date,JSON});
  assert.equal(f.stored.size,0);
 }
});
test('stale, future, unknown, malformed and missing receipts stay neutral',()=>{
 for(const receipt of [{brand:'charm',at:Date.now()-301000},{brand:'charm',at:Date.now()+60000},{brand:'https://evil.example',at:Date.now()},{brand:'constructor',at:Date.now()},{brand:'charm',at:'today'},[],null]){
 const f=receiptFixture({render:true,receipt});assert.equal(f.els['[data-thanks-title]'].textContent,'neutral');assert.equal(f.stored.size,0);
 }
});
async function submitFixture(legacy,{ok=true,data={success:true},jsonFailure=false,networkFailure=false,valid=true,disabled=false,captcha=false}={}) {
 let handler,fetches=[],confirmed=0,watched=0;
 const status={textContent:'',className:''},input={value:'person@example.com'},btn={disabled};
 const form={querySelector:s=>s==='input[type=email]'?input:btn,parentElement:{querySelector:()=>status},reportValidity:()=>valid,matches:()=>true,getAttribute:()=> 'charm',addEventListener:(name,fn)=>{if(name==='submit')handler=fn}};
 const window={VeynorThanks:{afterWaitlist(){confirmed++}},matchMedia:()=>({matches:true}),scrollY:0,addEventListener(){}};
 if(captcha)window.VeynorCaptcha={watch(){watched++},fields:async()=>({challenge:'captcha-answer',honeypot:''})};
 const document={querySelectorAll:s=>s==='form[data-waitlist]'?[form]:[],getElementById:()=>null,querySelector:()=>null,addEventListener:(name,fn)=>{if(name==='submit')handler=fn}};
 const context=vm.createContext({window,document,navigator:{},fetch:async(url,opts)=>{fetches.push({url,body:JSON.parse(opts.body)});if(networkFailure)throw Error('offline');return{ok,json:async()=>{if(jsonFailure)throw Error('bad JSON');return data}}},console,setTimeout,clearTimeout,requestAnimationFrame:()=>{}});
 vm.runInContext(read(legacy?'shared/site.js':'waitlist.js'),context);
 const event={preventDefault(){},target:form};
 if(legacy)await vm.runInContext('submitWaitlist',context)(event);else await handler(event);
 return{fetches,confirmed,status,input,btn,watched};
}
for(const legacy of [false,true]){
 const label=legacy?'legacy shared/site.js':'current waitlist.js';
 test(label+': confirms only HTTP ok with boolean true',async()=>{
  const f=await submitFixture(legacy);assert.equal(f.confirmed,1);assert.equal(f.input.value,'');assert.equal(f.btn.disabled,false);assert.deepEqual(f.fetches[0].body,{email:'person@example.com'});
  for(const options of [{ok:false},{data:{success:false}},{data:{success:'true'}},{data:{success:1}},{data:{}},{data:null},{jsonFailure:true},{networkFailure:true}]){
   const bad=await submitFixture(legacy,options);assert.equal(bad.confirmed,0,JSON.stringify(options));assert.equal(bad.input.value,'person@example.com');assert.equal(bad.btn.disabled,false);assert.ok(bad.status.textContent);
  }
 });
 test(label+': native invalid/unchecked required field and pending button prevent request',async()=>{
  for(const options of [{valid:false},{disabled:true}]){const f=await submitFixture(legacy,options);assert.equal(f.fetches.length,0);assert.equal(f.confirmed,0)}
 });
 test(label+': existing captcha fields and watch retained',async()=>{
  const f=await submitFixture(legacy,{captcha:true});assert.equal(f.watched,1);assert.deepEqual(f.fetches[0].body,{email:'person@example.com',challenge:'captcha-answer',honeypot:''});
 });
}
test('every existing waitlist form has a brand and helper before handler; consent preserved',()=>{
 for(const [file,brand] of [['charm.html','charm'],['solis.html','solis'],['home.html','veynor'],['solis-classic.html','solis']]){
  const s=read(file),forms=[...s.matchAll(/<form\b[^>]*data-waitlist[^>]*>/g)];assert.ok(forms.length);
  for(const form of forms)assert.ok(form[0].includes('data-waitlist-brand="'+brand+'"'));
  assert.ok(s.indexOf('shared/thanks.js')<s.indexOf(file==='home.html'||file==='solis-classic.html'?'shared/site.js':'src="waitlist.js"'));
 }
 assert.match(read('charm.html'),/type="checkbox" required/);
});
test('static App Store handoffs ignore all query input, preserve official destinations and normal back',()=>{
 for(const [slug,id] of [['bettermade','6793692530'],['carspotz','6790891644']]){
  const s=read(slug+'-thanks.html');assert.match(s,new RegExp('href="https://apps.apple.com/us/app/'+slug+'/id'+id+'"'));
  assert.match(s,/doesn't download or install/);assert.match(s,/href="index.html#apps"/);assert.doesNotMatch(s,/<script|target=|window\.open|location|download=/);
  assert.match(read('index.html'),new RegExp('href="'+slug+'-thanks.html">Get '+(slug==='bettermade'?'BetterMade':'CarSpotz')+'</a>'));
 }
 // No app query parser / redirect endpoint: unknown app, next, email values cannot select URLs.
 assert.match(read('index.html'),/href="https:\/\/clikey.store\/">Play Clikey chess/);
 assert.match(read('index.html'),/href="https:\/\/clikey.store\/one-more-floor\/index.html">Play One More Floor/);
});
