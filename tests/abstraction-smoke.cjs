// Serve with `python -m http.server 8765`, then `node tests/abstraction-smoke.cjs`.
// Reuses the Playwright installation used by scene-smoke.cjs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const browser = await chromium.launch(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH, headless: true }
    : { channel: 'chrome', headless: true });
  const failures = [];
  const captures = process.env.CAPTURE_DIR;
  if (captures) fs.mkdirSync(captures, { recursive: true });
  try {
    for (const mobile of [false, true]) {
      const name = mobile ? 'mobile' : 'desktop';
      const page = await browser.newPage({
        viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
        isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1,
        reducedMotion: mobile ? 'reduce' : 'no-preference'
      });
      await page.addInitScript(() => {
        const create = BaseAudioContext.prototype.createDynamicsCompressor;
        BaseAudioContext.prototype.createDynamicsCompressor = function(...args) {
          const node = create.apply(this, args);
          window.horrorCompressor = node;
          return node;
        };
      });
      page.on('pageerror', error => failures.push(error.message));
      page.on('console', message => { if (message.type() === 'error') failures.push(message.text()); });
      await page.goto(process.env.TEST_URL || 'http://127.0.0.1:8765');
      await page.waitForSelector('body[data-ready=true]', { timeout: 60000 });
      await page.waitForSelector('#loader', { state: 'detached' });
      await page.locator('[data-action=enter]').click();
      await page.waitForSelector('body[data-scene=ROOM]');
      await page.waitForFunction(() => !document.getElementById('light-pop').getAnimations().length);
      if (mobile) await page.locator('#ac-access').click();
      else {
        // Exercise the actual 3D raycast as well as the accessible HTML target.
        await page.locator('#ac-access').evaluate(element => { element.style.pointerEvents = 'none'; });
        const point = await page.evaluate(async () => {
          const { scene, camera } = await import('/js/scene/sceneSetup.js');
          const THREE = await import('three');
          const p = scene.getObjectByName('AirConditioner').getWorldPosition(new THREE.Vector3()).project(camera);
          return { x: (p.x + 1) * innerWidth / 2, y: (1 - p.y) * innerHeight / 2 };
        });
        await page.waitForTimeout(550);
        await page.mouse.click(point.x, point.y);
        await page.locator('#ac-access').evaluate(element => { element.style.pointerEvents = ''; });
      }
      await page.waitForSelector('#ac-keypad[open]');
      assert.ok(await page.locator('#ac-submit').isDisabled());
      await page.keyboard.press('Escape');
      await page.waitForSelector('#ac-keypad[open]', { state: 'hidden' });
      assert.equal(await page.locator('body').getAttribute('data-scene'), 'ROOM');
      await page.locator('#ac-access').click();
      if (captures) await page.screenshot({ path: `${captures}/keypad-${name}.png` });
      for (const digit of '111111') await page.locator(`[data-pin="${digit}"]`).click();
      await page.locator('#ac-submit').click();
      assert.match(await page.locator('#ac-status').textContent(), /Incorrect/);
      assert.equal(await page.locator('body').getAttribute('data-abstraction'), null);
      await page.keyboard.press('Backspace');
      assert.equal(await page.locator('#ac-digits').getAttribute('aria-label'), '5 of 6 digits entered', 'Backspace after a rejected code must remove only one digit');
      assert.ok(await page.locator('#ac-submit').isDisabled());
      await page.locator('[data-pin="1"]').click();
      await page.locator('#ac-submit').click();

      await page.locator('[data-pin="1"]').click();
      await page.locator('[data-pin="9"]').click();
      await page.locator('[data-pin="delete"]').click();
      assert.equal(await page.locator('#ac-digits').getAttribute('aria-label'), '1 of 6 digits entered');
      await page.locator('[data-pin="clear"]').click();
      if (mobile) {
        // Physical keyboard is also supported, including Enter to submit.
        await page.keyboard.type('190406');
        await page.keyboard.press('Enter');
      } else {
        for (const digit of '190406') await page.locator(`[data-pin="${digit}"]`).click();
        await page.locator('#ac-submit').click();
      }
      await page.waitForSelector('body[data-abstraction=shifting]');
      if (captures && !mobile) {
        await page.waitForTimeout(4500);
        await page.screenshot({ path: `${captures}/shifting-desktop.png` });
      }
      await page.waitForSelector('body[data-abstraction=ruined]', { timeout: 30000 });
      await page.waitForTimeout(600);
      const ruin = await page.evaluate(async () => {
        const { scene, composer, camera } = await import('/js/scene/sceneSetup.js');
        const { bgMusic, clickSound } = await import('/js/audio/audioManager.js');
        const effect = scene.getObjectByName('AbstractionRoom');
        return {
          rifts: effect.children.filter(o => o.name === 'RealityRift').length,
          fires: effect.children.filter(o => o.name === 'AbstractionFire').length,
          enabled: composer.passes.at(-1).enabled,
          displacement: composer.passes.at(-1).uniforms.uAmount.value,
          musicStopped: bgMusic.paused, playbackRate: clickSound.playbackRate,
          camera: camera.rotation.z, width: document.documentElement.scrollWidth, viewport: innerWidth
        };
      });
      assert.equal(ruin.rifts, 17);
      assert.equal(ruin.fires, 7);
      assert.ok(ruin.enabled && ruin.musicStopped && ruin.playbackRate < 1);
      await page.waitForFunction(async () => {
        const { scene } = await import('/js/scene/sceneSetup.js');
        return !!scene.getObjectByName('AbstractedKaufmo');
      }, null, { timeout: 30000 });
      const monster = await page.evaluate(async () => {
        const { scene } = await import('/js/scene/sceneSetup.js');
        const THREE = await import('three');
        const object = scene.getObjectByName('AbstractedKaufmo');
        return { visible: object.visible, height: new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3()).y };
      });
      assert.ok(!monster.visible && monster.height > 4, `Abstracted monster should wait outside: ${JSON.stringify(monster)}`);
      assert.equal(ruin.width, ruin.viewport, 'Horizontal overflow');
      if (mobile) assert.equal(ruin.displacement, 0, 'Reduced motion must disable glitch bursts');
      if (captures) await page.screenshot({ path: `${captures}/room-${name}.png` });
      await page.evaluate(() => {
        window.horrorAnalyser = horrorCompressor.context.createAnalyser();
        horrorAnalyser.fftSize = 8192;
        horrorCompressor.connect(horrorAnalyser);
      });
      const measureAudio = () => page.evaluate(() => {
        const values = new Float32Array(horrorAnalyser.fftSize);
        horrorAnalyser.getFloatTimeDomainData(values);
        return { rms: Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length),
          peak: Math.max(...values.map(Math.abs)) };
      });
      await page.waitForTimeout(500);
      const audible = await measureAudio();
      assert.ok(audible.rms > .005 && audible.peak < .9, 'Dark mix must be audible without clipping');
      await page.locator('#abstraction-sound').click();
      assert.equal(await page.locator('#abstraction-sound').getAttribute('aria-pressed'), 'true');
      await page.waitForTimeout(2200);
      assert.ok((await measureAudio()).rms < audible.rms * .03, 'Mute must silence the actual mix');
      await page.locator('#abstraction-sound').click();
      await page.waitForTimeout(1400);
      assert.ok((await measureAudio()).rms > .005, 'Unmute must restore the mix');

      await page.locator('#back-btn').click();
      await page.waitForSelector('body[data-scene=OUTSIDE]');
      await page.waitForFunction(() => !document.getElementById('light-pop').getAnimations().length);
      assert.equal(await page.locator('.menu-title').textContent(), 'what have you done');
      await page.waitForFunction(async () => {
        const { scene } = await import('/js/scene/sceneSetup.js');
        return scene.getObjectByName('AbstractedKaufmo')?.visible === true;
      }, null, { timeout: 30000 });
      assert.ok(await page.locator('#asset-credit').isVisible());
      if (captures) {
        await page.waitForTimeout(600);
        await page.screenshot({ path: `${captures}/${name}.png` });
      }
      await page.locator('[data-action=enter]').click();
      await page.waitForSelector('body[data-scene=ROOM]');
      await page.waitForFunction(() => !document.getElementById('light-pop').getAnimations().length);
      assert.equal(await page.locator('body').getAttribute('data-abstraction'), 'ruined');
      await page.locator('[data-view=laptop]').click();
      await page.waitForSelector('#modal.open');
      assert.ok((await page.locator('#modal-body').textContent()).length > 30, 'Portfolio remains usable');
      await page.keyboard.press('Escape');
      await page.locator('#abstraction-reset').click();
      await page.waitForSelector('body[data-ready=true]', { timeout: 60000 });
      assert.equal(await page.locator('body').getAttribute('data-abstraction'), null, 'Restore must reset all corruption');
      assert.equal(await page.locator('.menu-title').textContent(), 'OLAN.DEV');
      console.log(`${name}: keypad, wrong PIN, edit/clear, unlock, corruption, audio, outside reveal, re-entry and restore passed.`);
      await page.close();
    }
    assert.deepEqual(failures, [], 'Browser / shader errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
