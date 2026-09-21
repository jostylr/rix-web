import assert from 'node:assert/strict';
import path from 'node:path';
const { chromium } = await import(process.env.RIX_PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(import.meta.dir, '../docs');
const server = Bun.serve({hostname:'127.0.0.1', port:0, fetch(request) {
  const file = path.resolve(root, '.' + new URL(request.url).pathname);
  return file.startsWith(root + path.sep) ? new Response(Bun.file(file)) : new Response('Forbidden', {status:403});
}});
let browser;
try {
  browser = await chromium.launch({headless:true, ...(process.env.RIX_CHROME_EXECUTABLE ? {executablePath:process.env.RIX_CHROME_EXECUTABLE} : {})});
  const page = await browser.newPage();
  await page.route('https://**/*', route => route.abort());

  await page.goto(`http://127.0.0.1:${server.port}/tutorial/getting-started.html`);
  await page.waitForSelector('.lesson-sidebar details');
  await page.locator('.lesson-sidebar details').evaluateAll(nodes => nodes.forEach(node => node.open = true));
  await page.locator('.lesson-sidebar').hover();
  const beforeSidebarScroll = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 600);
  await page.waitForFunction(() => document.querySelector('.lesson-sidebar').scrollTop > 0);
  assert.equal(await page.evaluate(() => scrollY), beforeSidebarScroll);
  console.log('Sidebar scrolls without moving lesson');
  const cell = page.locator('.tutorial-cell').first();
  const input = cell.locator('[data-tutorial-source]');
  const button = cell.locator('[data-tutorial-run]');
  await input.fill('1 + 2;');
  await button.click();
  await page.waitForFunction(() => document.querySelector('[data-tutorial-run]').textContent === 'Re-Run Cell');
  assert.equal((await cell.locator('[data-tutorial-output]').innerText()).trim(), '3');
  await input.fill('2 + 3;');
  assert.equal(await button.innerText(), 'Run Cell');
  await button.click();
  await page.waitForFunction(() => document.querySelector('[data-tutorial-run]').textContent === 'Re-Run Cell');
  assert.equal((await cell.locator('[data-tutorial-output]').innerText()).trim(), '5');
  console.log('Worker results, Re-Run Cell, and edits verified');
  const mandelbrot = '.Plugin.Load("fractals"); grid := .fractals.Mandelbrot({= domain={= re=[-2,1], im=[-3/2,3/2] }, resolution=[16,16], maxIterations=12 }); .fractals.EscapeGraphic(grid, {= size=[480,480] });';
  await input.fill(mandelbrot.replace('[16,16]', '[128,128]').replace('maxIterations=12', 'maxIterations=100'));
  await button.click();
  assert.equal(await button.innerText(), 'Stop');
  assert.equal(await button.evaluate(node => getComputedStyle(node).animationName), 'tutorial-running-pulse');
  await page.waitForTimeout(500);
  await button.click();
  await page.waitForFunction(() => document.querySelector('[data-tutorial-run]').textContent === 'Run Cell');
  assert.equal(await cell.locator('.tutorial-run-status').innerText(), 'Stopped');
  console.log('Long Mandelbrot computation stays responsive and stops');
  await input.fill(mandelbrot);
  await button.click();
  await page.waitForFunction(() => document.querySelector('[data-tutorial-run]').textContent === 'Re-Run Cell', null, {timeout:120000});
  assert.ok(await cell.locator('[data-tutorial-output] svg').count() > 0);
  console.log('Mandelbrot finishes and renders its graphic');
  await input.fill('1 + ;');
  await button.click();
  await cell.locator('.error').waitFor();
  assert.equal(await button.innerText(), 'Run Cell');
  assert.equal(await button.isEnabled(), true);
  await page.goto(`http://127.0.0.1:${server.port}/tutorial/control-panels.html`);
  await page.locator('[data-tutorial-run]').first().click();
  await page.waitForFunction(() => document.querySelector('[data-tutorial-run]').textContent === 'Re-Run Cell');
  const slider = page.locator('.tutorial-output input[type=range]').first();
  await slider.fill('6');
  await slider.dispatchEvent('change');
  await page.waitForFunction(() => document.querySelector('.tutorial-output').textContent.includes('x² = 9'));
  console.log('Live slider updates preserved; failed runs restore Run Cell');
  for (const width of [820, 390]) {
    await page.setViewportSize({width, height:800});
    await page.goto(`http://127.0.0.1:${server.port}/tutorial/getting-started.html`);
    await page.waitForSelector('.lesson-sidebar details', {state:'attached'});
    if (width < 761) await page.locator('[data-toggle-contents]').click();
    await page.locator('.lesson-sidebar details').evaluateAll(nodes => nodes.forEach(node => node.open = true));
    await page.locator('.lesson-sidebar').hover();
    const before = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, 600);
    await page.waitForFunction(() => document.querySelector('.lesson-sidebar').scrollTop > 0);
    assert.equal(await page.evaluate(() => scrollY), before);
    console.log(`Independent contents scrolling at ${width}px`);
  }

} finally { await browser?.close(); server.stop(true); }
