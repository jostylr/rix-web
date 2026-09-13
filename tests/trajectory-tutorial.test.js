import {test,expect} from 'bun:test';
import {Context,createDefaultSystemContext,parseAndEvaluate,parseAndEvaluateAsync,renderOutputHtml,formatValue} from '../../rix/src/index.js';
import {createBundledPluginCatalog} from '../src/generated/bundled-plugin-catalog.js';
for(const [mode,evaluate] of [['sync',parseAndEvaluate],['async',parseAndEvaluateAsync]]) {
    test(`${mode}: trajectory tutorial renders with the browser plugin catalog`,async()=> {
        const source=await Bun.file(new URL('../../rix/plugins/plot/tutorial.md',import.meta.url)).text();
        const cells=[...source.matchAll(/```\{\.rix exec=true\}\n([\s\S]*?)```/g)].map(match=>match[1]);
        const cell=cells.find(code=>code.includes('.plot.Trajectory'));
        expect(cell).toBeDefined();
        const result=await evaluate(cell,{context:new Context(),systemContext:createDefaultSystemContext({pluginCatalog:createBundledPluginCatalog()})});
        const plot=result.metadata.get('plot');
        expect(plot.entries.get('kind').value).toBe('trajectory');
        expect(plot.entries.get('unresolvedregions').values).toHaveLength(1);
        const html=renderOutputHtml(result,formatValue);
        expect(html).toContain('trajectory-uncomputed');
        expect(html).toContain('trajectory-1');
        expect(html).toContain('Source-certified tube');
    },30000);
}
