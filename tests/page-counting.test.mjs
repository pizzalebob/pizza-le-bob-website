import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../assets/visitor-tracking.js',import.meta.url),'utf8');
function run(choice=null,privacy=false){
 const sent=[],writes=[],listeners={},settings={style:{}},stored=new Map(choice?[['plb-analytics-choice-v1',choice]]:[]);let page='home';
 const context={location:{pathname:'/',search:''},navigator:{globalPrivacyControl:privacy},crypto,URLSearchParams,requestAnimationFrame:fn=>fn(),localStorage:{getItem:k=>stored.get(k)||null,removeItem:k=>stored.delete(k),setItem:(k,v)=>{writes.push([k,v]);stored.set(k,v);}},document:{createElement:()=>settings,querySelector:s=>s.includes('active-section')?{id:page}:{append:()=>{}}},window:{addEventListener:(n,f)=>listeners[n]=f},fetch:(_url,options)=>{sent.push(JSON.parse(options.body));return Promise.resolve();}};
 vm.runInNewContext(source,context);return {sent,writes,settings,navigate:p=>{page=p;listeners.hashchange();}};
}
test('counts without acceptance or persistent identifiers, deduplicates consecutive views and honours opt-out',()=>{
 const state=run();assert.equal(state.sent.length,1);assert.equal(state.writes.length,0);assert.equal(state.sent[0].visitor,undefined);assert.equal(state.sent[0].mode,'aggregate');
 state.navigate('home');assert.equal(state.sent.length,1);state.navigate('menu');assert.equal(state.sent.length,2);assert.notEqual(state.sent[0].event,state.sent[1].event);
 state.settings.onclick();state.navigate('gallery');assert.equal(state.sent.length,2);assert.equal(state.writes[0][1],'no');
 state.settings.onclick();assert.equal(state.sent.length,3);
});
test('existing refusal and browser privacy signals prevent counting',()=>{
 assert.equal(run('no').sent.length,0);assert.equal(run(null,true).sent.length,0);assert.equal(run('yes',true).sent.length,0);
});
