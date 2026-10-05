import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeConfig,classifyStatus,percentage,matches,escapeHTML,displayState} from '../src/model.js';
const config=normalizeConfig({});
test('German and English states; paper errors take priority',()=>{
  for(const [raw,kind] of [['Bereit','ready'],['READY','ready'],['Ausdruck','printing'],['printing','printing'],['Energiesparen','powersave'],['sleep','powersave'],['No paper / printing','no_paper'],['not ready','other'],['','unknown'],['unknown','unknown'],['unavailable','unavailable']])assert.equal(classifyStatus(raw,config).kind,kind,raw);
});
test('Tray suffixes only classify in a no-paper state',()=>{
  for(const raw of ['Kein Papier Z1','No paper Tray 1','Kein Papier Fach 1'])assert.deepEqual(classifyStatus(raw,config).trays,['tray1']);
  assert.deepEqual(classifyStatus('Kein Papier Fach 2',config).trays,['tray2']);
  assert.deepEqual(classifyStatus('Kein Papier Fach 1 Fach 2',config).trays,['tray1','tray2']);
  assert.deepEqual(classifyStatus('Tray 1 printing',config).trays,[]);
});
test('Replacement patterns, empty categories, and YAML source immutability',()=>{
  const source={status_patterns:{ready:['=online'],printing:[]}};
  const custom=normalizeConfig(source);
  assert.equal(classifyStatus('Online',custom).kind,'ready');
  assert.equal(classifyStatus('Bereit',custom).kind,'other');
  assert.equal(classifyStatus('printing',custom).kind,'other');
  custom.status_patterns.ready.push('x');assert.deepEqual(source.status_patterns.ready,['=online']);
});
test('Safe pattern matching: substring, exact, wildcard, literal regex characters',()=>{
  assert.ok(matches('Error: no paper',['no paper']));
  assert.ok(matches('  READY  ',['=ready']));
  assert.ok(!matches('not ready',['=ready']));
  assert.ok(matches('Kein Papier Fach 2',['*fach ?']));
  assert.ok(matches('[abc]',['[abc]']));
  assert.ok(!matches('abc',['[abc]']));
  assert.ok(!matches('anything',['','   ']));
});
test('Unknown percentages never become zero; valid zero, localized decimals and clamping',()=>{
  for(const input of [null,undefined,'',' ','unknown','unavailable','abc','NaN','Infinity'])assert.equal(percentage(input),null);
  for(const [raw,want] of [['0',0],['20%',20],['12,5',12.5],['150',100],['-2',0]])assert.equal(percentage(raw),want);
});
test('Entity IDs have no defaults, configuration validates and preserves extras',()=>{
  assert.deepEqual(config.entities,{});
  for(const invalid of [{warning_threshold:-1},{warning_threshold:NaN},{warning_threshold:101},{entities:[]},{status_patterns:{ready:'ready'}},{animation:'false'},{language:'xx'}])assert.throws(()=>normalizeConfig(invalid));
  assert.deepEqual(normalizeConfig({grid_options:{columns:6}}).grid_options,{columns:6});
});
test('Escaping and units',()=>{
  assert.equal(escapeHTML('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;');
  assert.equal(displayState({state:'12345',attributes:{unit_of_measurement:'pages'}},'en'),'12,345 pages');
  assert.equal(displayState({state:'unavailable'},'en'),'—');
});
