const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    for (const mobile of [false, true]) {
      const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, isMobile: mobile, hasTouch: mobile });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(process.env.TEST_URL || 'http://127.0.0.1:8765');
      await page.waitForSelector('body[data-ready=true]', { timeout: 60000 });
      await page.waitForSelector('#loader', { state: 'detached' });
      await page.locator('[data-action=enter]').click();
      await page.waitForSelector('body[data-scene=ROOM]');
      await page.waitForFunction(() => !document.getElementById('light-pop').getAnimations().length);
      const layout = await page.evaluate(async () => {
        const { scene } = await import('/js/scene/sceneSetup.js');
        const THREE = await import('three');
        const cabinet = scene.getObjectByName('FigurineCabinet');
        const a = scene.getObjectByName('CozyArcade');
        const left = scene.getObjectByName('FloorLampLeft'), right = scene.getObjectByName('FloorLampRight');
        return { rotation: cabinet.rotation.y, maxX: new THREE.Box3().setFromObject(cabinet).max.x,
          leftForward: left.position.z > a.position.z, rightForward: right.position.z > cabinet.position.z };
      });
      assert.equal(layout.rotation, -Math.PI / 2);
      assert.ok(layout.maxX < 8 && layout.maxX > 7.7, 'Cabinet back meets right wall');
      assert.ok(layout.leftForward && layout.rightForward, 'Lamps sit forward of props');
      const open = async () => { await page.locator('#help-btn').click(); await page.locator('#guide-arcade').click(); };
      await open();
      assert.equal(await page.locator('#modal-body').evaluate(e => e.scrollTop), 0, 'New game opens at top');
      const capture = async name => {
        if (!process.env.SCREENSHOT_DIR) return;
        fs.mkdirSync(process.env.SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({ path: path.join(process.env.SCREENSHOT_DIR, `${mobile ? 'mobile' : 'desktop'}-arcade-${name}.png`) });
      };
      await capture('ready');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      await page.locator('.arcade-play').click();
      await page.keyboard.down('ArrowLeft'); await page.waitForTimeout(350); await page.keyboard.up('ArrowLeft');
      const shipX = await page.evaluate(() => {
        const ctx = document.getElementById('arcade-canvas').getContext('2d');
        const pixels = ctx.getImageData(0, 360, 320, 1).data;
        for (let x = 0; x < 320; x++) if (pixels[x * 4] === 149 && pixels[x * 4 + 1] === 198) return x;
        return -1;
      });
      assert.ok(shipX > 0 && shipX < 130, `Keyboard moves ship: ${shipX}`);
      await page.locator('#arcade-pause').click();
      assert.equal(await page.locator('.arcade-play').textContent(), 'RESUME MISSION');
      const paused = await page.locator('#arcade-canvas').evaluate(c => c.toDataURL());
      await page.waitForTimeout(250);
      assert.equal(await page.locator('#arcade-canvas').evaluate(c => c.toDataURL()), paused, 'Pause freezes canvas');
      await page.locator('.arcade-play').click();
      const canvas = page.locator('#arcade-canvas');
      const bounds = await canvas.boundingBox();
      await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
      await page.mouse.down(); await page.mouse.move(bounds.x + bounds.width * .8, bounds.y + bounds.height / 2); await page.mouse.up();
      await page.evaluate(() => window.dispatchEvent(new Event('blur')));
      assert.equal(await page.locator('.arcade-play').textContent(), 'RESUME MISSION');
      await page.locator('.arcade-play').click();
      await page.waitForTimeout(1000); await capture('playing');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#modal').evaluate(e => e.classList.contains('open')), false);
      const closed = await canvas.evaluate(c => c.toDataURL());
      await page.waitForTimeout(250);
      assert.equal(await canvas.evaluate(c => c.toDataURL()), closed, 'Closing stops loop');
      await page.evaluate(() => localStorage.setItem('olan-space-patrol-best', '12300'));
      await open();
      assert.equal(await page.locator('#arcade-best').textContent(), '12300');
      await page.locator('.arcade-play').click();
      await page.keyboard.press('p'); await page.keyboard.press('p');
      assert.equal(await page.locator('.arcade-overlay').isVisible(), false);
      await page.locator('#arcade-pause').click();
      await page.clock.install();
      // Backgrounding is already checked above. Keep this accelerated mission
      // deterministic even if the OS changes focus during headless execution.
      await page.evaluate(() => {
        Math.random = () => .5;
        window.addEventListener('blur', e => e.stopImmediatePropagation(), true);
        document.addEventListener('visibilitychange', e => e.stopImmediatePropagation(), true);
      });
      await page.locator('.arcade-play').click();
      await page.keyboard.down('ArrowLeft');
      await page.clock.runFor(1500);
      await page.keyboard.up('ArrowLeft');
      await page.clock.runFor(30000);
      assert.equal(await page.locator('.arcade-play').textContent(), 'PLAY AGAIN');
      assert.equal(await page.locator('#arcade-lives').getAttribute('aria-label'), '0 lives');
      await page.locator('.arcade-play').click();
      await page.clock.runFor(50);
      assert.equal(await page.locator('#arcade-lives').getAttribute('aria-label'), '3 lives');
      assert.equal(await page.locator('#arcade-score').textContent(), '00000');
      await page.locator('#modal-close').click();
      assert.deepEqual(errors, []);
      console.log(`${mobile ? 'Mobile' : 'Desktop'} arcade passed.`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
