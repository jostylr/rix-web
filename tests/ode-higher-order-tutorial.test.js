import {test,expect} from 'bun:test';
import {Context,createDefaultSystemContext,parseAndEvaluate,parseAndEvaluateAsync} from '../../rix/src/index.js';
import {createBundledPluginCatalog} from '../src/generated/bundled-plugin-catalog.js';

for(const [mode,evaluate] of [['sync',parseAndEvaluate],['async',parseAndEvaluateAsync]]) {
    test(`${mode}: higher-order ODE tutorial executes with the browser plugin catalog`,async()=> {
        const source=await Bun.file(new URL('../../rix/plugins/ode/tutorial.md',import.meta.url)).text();
        const cells=[...source.matchAll(/```\{\.rix exec=true\}\n([\s\S]*?)```/g)].map(match=>match[1]);
        const cell=cells.find(code=>code.includes('fourth := problem.ValidatedTaylor'));
        expect(cell).toBeDefined();
        const result=await evaluate(cell,{context:new Context(),systemContext:createDefaultSystemContext({pluginCatalog:createBundledPluginCatalog()})});
        expect(String(result.values[2])).toBe('4');
    },30000);
    test(`${mode}: backward ODE tutorial executes with the browser plugin catalog`,async()=> {
        const source=await Bun.file(new URL('../../rix/plugins/ode/tutorial.md',import.meta.url)).text();
        const cells=[...source.matchAll(/```\{\.rix exec=true\}\n([\s\S]*?)```/g)].map(match=>match[1]);
        const cell=cells.find(code=>code.includes('backward := .ode.IVP'));
        expect(cell).toBeDefined();
        const result=await evaluate(cell,{context:new Context(),systemContext:createDefaultSystemContext({pluginCatalog:createBundledPluginCatalog()})});
        expect(result.values.map(v=>v?.type==='string'?v.value:String(v))).toEqual(['backward','1:0','0:0']);
    },30000);
}
