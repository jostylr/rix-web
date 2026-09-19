import {Context,createDefaultRegistry,createDefaultSystemContext,parseAndEvaluate,formatValue} from '../../rix/src/index.js';
import {renderOutputHtml,formatOutputText} from '../../rix/src/runtime/output.js';
import {encodeOutputJSON} from '../../rix/src/runtime/output-json.js';
import {numeralValue} from '../../rix/src/eval/functions/numerals.js';
const field=(value,key)=>value.entries.get(key.toLowerCase());
export const NUMERAL_EXAMPLES=Object.freeze({
 ordinary:{kind:'ordinary',radix:10,tokens:[...'0123456789'],source:'123.25'},
 multiToken:{kind:'multiToken',radix:3,tokens:['zero','one','two'],source:'onetwo.zeroone'},
 balanced:{kind:'balanced',radix:3,tokens:['T','0','1'],source:'1T.1T'},
 negative:{kind:'negative',radix:-2,tokens:['0','1'],source:'110.1'},
});
export function inspectNumeral(spec,source,maxDigits=128){
 const state={context:new Context(),registry:createDefaultRegistry(),systemContext:createDefaultSystemContext()};
 state.context.setFresh('definition',numeralValue(spec));state.context.setFresh('spelling',{type:'string',value:source});state.context.setFresh('budget',numeralValue(maxDigits));
 const [value,expansion,view]=parseAndEvaluate('.Plugin.Load("radix");system=.radix.System("numberSystem",definition);.radix.Define(system);value=.radix.Parse(system,spelling);[value,.radix.Format(system,value,{= maxDigits=budget }),.radix.View(system,spelling,{= maxDigits=budget })]',state).values;
 const literal=field(expansion,'literal')?.value??null;
 const roundtrip=literal?String(parseAndEvaluate(literal,state))===String(value):null;
 return {value:String(value),literal,status:field(expansion,'status').value,roundtrip,
  carries:(field(field(expansion,'integer'),'carries')?.values||[]).map(row=>Object.fromEntries(['before','digit','radix','after'].map(key=>[key,String(field(row,key))]))),
  html:renderOutputHtml(view,formatValue),text:formatOutputText(view,formatValue),json:encodeOutputJSON(view)};
}
