import {inspectNumeral,NUMERAL_EXAMPLES} from './numeral-playground-model.js';
const element=id=>document.getElementById(id);
let current=null;
function render(){
 try{
  const model=inspectNumeral({kind:element('family').value,radix:Number(element('radix').value),tokens:element('tokens').value.split('\n')},element('source').value,Number(element('budget').value));
  element('result').innerHTML=model.html;
  element('status').textContent=model.roundtrip===true?`Exact value ${model.value}. Canonical literal ${model.literal} parses back to the same value.`:`Exact value ${model.value}. Digit budget exhausted; this prefix is incomplete.`;
  element('status').dataset.error='false';current=model;
 }catch(error){element('status').textContent=error.message+" The last valid result remains below.";element('status').dataset.error='true';}
}
element('family').addEventListener('change',()=>{const preset=NUMERAL_EXAMPLES[element('family').value];element('radix').value=preset.radix;element('tokens').value=preset.tokens.join('\n');element('source').value=preset.source;});
element('numeral-form').addEventListener('submit',event=>{event.preventDefault();render();});
function save(name,content,type){const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([content],{type}));link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);}
element('save-json').addEventListener('click',()=>{if(current)save('numeral-exact.json',current.json,'application/json');});
element('save-text').addEventListener('click',()=>{if(current)save('numeral.txt',current.text,'text/plain');});
element('save-html').addEventListener('click',()=>{if(current)save('numeral.html','<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Exact numeral snapshot</title><body>'+current.html+'</body></html>','text/html');});
render();
