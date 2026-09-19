import {expect,test} from 'bun:test';
import {inspectNumeral,NUMERAL_EXAMPLES} from '../src/numeral-playground-model.js';
import {decodeOutputJSON} from '../../rix/src/runtime/output-json.js';
test('all four playground families reuse public RiX parsers and portable document evidence',()=>{
 for(const spec of Object.values(NUMERAL_EXAMPLES)){
  const result=inspectNumeral(spec,spec.source);expect(result.roundtrip).toBe(true);expect(result.literal).toStartWith('`.numberSystem:');expect(result.html).toContain('Integer carry steps');expect(result.text).toContain('Place contributions');expect(result.carries.length).toBeGreaterThan(0);
  const restored=decodeOutputJSON(result.json).value;expect(restored.metadata.get('system').entries.get('system').entries.get('radix').value).toBe(BigInt(spec.radix));
 }
});
test('incomplete or malformed input never gets an exact round-trip claim',()=>{
 const spec=NUMERAL_EXAMPLES.ordinary,result=inspectNumeral(spec,'1/97',3);expect(result.literal).toBeNull();expect(result.roundtrip).toBeNull();expect(result.html).toContain('budget exhausted');
 expect(()=>inspectNumeral({...spec,tokens:['a','ab'],radix:2,kind:'multiToken'},'a')).toThrow('prefix-free');
 expect(()=>inspectNumeral(spec,'<script>')).toThrow('invalid token');
});
