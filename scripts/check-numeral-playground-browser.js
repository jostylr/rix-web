#!/usr/bin/env bun
import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdir,readFile} from 'node:fs/promises';
import {inspectNumeral,NUMERAL_EXAMPLES} from '../src/numeral-playground-model.js';
const root=path.resolve(import.meta.dir,'..'),directory=path.join(root,'tmp/numeral-browser');
await mkdir(path.join(directory,'assets'),{recursive:true});
const initial=inspectNumeral(NUMERAL_EXAMPLES.ordinary,NUMERAL_EXAMPLES.ordinary.source);
const html=(await readFile(path.join(root,'src/numeral-playground.html'),'utf8')).replace('<!--INITIAL-->',initial.html);
await Bun.write(path.join(directory,'index.html'),html);await Bun.write(path.join(directory,'assets/numeral-playground.css'),await readFile(path.join(root,'src/numeral-playground.css')));
const bundle=await Bun.build({entrypoints:[path.join(root,'src/numeral-playground.js')],outdir:path.join(directory,'assets'),target:'browser'});assert.equal(bundle.success,true);
const server=Bun.serve({hostname:'127.0.0.1',port:0,fetch(request){const pathname=new URL(request.url).pathname;const allowed={'/':'index.html','/assets/numeral-playground.js':'assets/numeral-playground.js','/assets/numeral-playground.css':'assets/numeral-playground.css'};return allowed[pathname]?new Response(Bun.file(path.join(directory,allowed[pathname]))):new Response('Not found',{status:404});}});
let browser;
try{
 const {chromium}=await import(process.env.RIX_PLAYWRIGHT_MODULE||'playwright');browser=await chromium.launch({headless:true,...(process.env.RIX_CHROME_EXECUTABLE?{executablePath:process.env.RIX_CHROME_EXECUTABLE}:{})});
 const staticContext=await browser.newContext({javaScriptEnabled:false}),staticPage=await staticContext.newPage();await staticPage.goto(`http://127.0.0.1:${server.port}/`);assert.match(await staticPage.locator('#result').innerText(),/Integer carry steps/);await staticContext.close();
 const context=await browser.newContext({viewport:{width:1100,height:950}}),page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(`http://127.0.0.1:${server.port}/`);
 await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('parses back'));
 for(const family of ['multiToken','balanced','negative','ordinary']){await page.locator('#family').selectOption(family);await page.locator('button[type=submit]').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('parses back'));assert.equal(await page.locator('#status').getAttribute('data-error'),'false');}
 await page.locator('#source').fill('1/97');await page.locator('#budget').fill('3');await page.locator('button[type=submit]').click();assert.match(await page.locator('#status').innerText(),/budget exhausted/);assert.match(await page.locator('#result').innerText(),/prefix is not a complete numeral/);
 await page.locator('#budget').fill('128');await page.locator('#source').fill('123.25');await page.locator('button[type=submit]').click();
 for(const [button,name,needle]of [['save-html','snapshot.html','Integer carry steps'],['save-json','snapshot.json','ratmath.numeral-system@1'],['save-text','snapshot.txt','493/4']]){const ready=page.waitForEvent('download');await page.locator('#'+button).click();const download=await ready;const filename=path.join(directory,name);await download.saveAs(filename);const text=await readFile(filename,'utf8');assert.ok(text.includes(needle)||button==='save-text'&&text.includes('123..1/4'));}
 await page.locator('#source').fill('<script>');await page.locator('button[type=submit]').click();assert.equal(await page.locator('#status').getAttribute('data-error'),'true');assert.equal(await page.locator('#result script').count(),0);
 await page.locator('#family').selectOption('negative');await page.locator('button[type=submit]').click();await page.screenshot({path:path.join(directory,'wide.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>document.documentElement.style.fontSize='200%');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true);await page.screenshot({path:path.join(directory,'narrow.png'),fullPage:true});
 assert.deepEqual(errors,[]);console.log('Numeral browser acceptance passed: four families, keyboard, no-JS initial output, exact exports, malformed input, and narrow 200% layout.');
}finally{await browser?.close();server.stop(true);}
