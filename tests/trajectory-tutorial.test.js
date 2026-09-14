import {test,expect} from 'bun:test';
import {Context,createDefaultSystemContext,parseAndEvaluate,parseAndEvaluateAsync,renderOutputHtml,formatValue} from '../../rix/src/index.js';
import {createBundledPluginCatalog} from '../src/generated/bundled-plugin-catalog.js';
import {linkedGraphicSelectionIds} from '../../rix/src/tools/graphic-view.js';
for(const [mode,evaluate] of [['sync',parseAndEvaluate],['async',parseAndEvaluateAsync]]) {
    test(`${mode}: linked tutorial renders three coordinated panels`,async()=> {
        const source=await Bun.file(new URL('../../rix/plugins/plot/tutorial.md',import.meta.url)).text();
        const cell=[...source.matchAll(/```\{\.rix exec=true\}\n([\s\S]*?)```/g)].map(m=>m[1]).find(s=>s.includes('.plot.LinkedTrajectory'));
        const result=await evaluate(cell,{context:new Context(),systemContext:createDefaultSystemContext({pluginCatalog:createBundledPluginCatalog()})});
        expect(result.metadata.get('panels').values).toHaveLength(3);
        expect(linkedGraphicSelectionIds(result,'panel-1-trajectory-1')).toHaveLength(3);
        expect(renderOutputHtml(result,formatValue)).toContain('panel-3-trajectory-4');
    },60000);
    test(`${mode}: event overlay tutorial renders with retained classification`,async()=> {
        const source=await Bun.file(new URL('../../rix/plugins/plot/tutorial.md',import.meta.url)).text();
        const cell=[...source.matchAll(/```\{\.rix exec=true\}\n([\s\S]*?)```/g)].map(m=>m[1]).find(s=>s.includes('.plot.EventTrajectory'));
        const result=await evaluate(cell,{context:new Context(),systemContext:createDefaultSystemContext({pluginCatalog:createBundledPluginCatalog()})});
        expect(result.metadata.get('plot').entries.get('eventoverlays').values).toHaveLength(1);
        expect(renderOutputHtml(result,formatValue)).toContain('certifiedUniqueEvent');
    },30000);
    test(`${mode}: phase portrait tutorial renders retained enclosures in the browser`,async()=> {
        const source=await Bun.file(new URL('../../rix/plugins/plot/tutorial.md',import.meta.url)).text();
        const cells=[...source.matchAll(/```\{\.rix exec=true\}\n([\s\S]*?)```/g)].map(match=>match[1]);
        const cell=cells.find(code=>code.includes('.plot.PhasePortrait'));
        expect(cell).toBeDefined();
        const result=await evaluate(cell,{context:new Context(),systemContext:createDefaultSystemContext({pluginCatalog:createBundledPluginCatalog()})});
        const plot=result.metadata.get('plot');
        expect(plot.entries.get('kind').value).toBe('phase_portrait');
        expect(plot.entries.get('status').value).toBe('enclosed');
        expect(plot.entries.get('records').values).toHaveLength(4);
        const html=renderOutputHtml(result,formatValue);
        expect(html).toContain('trajectory-1');
        expect(html).toContain('Source-certified tube');
    },30000);
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
