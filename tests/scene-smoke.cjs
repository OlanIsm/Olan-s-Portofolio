// Serve the repo with `python -m http.server 8765`, then `node tests/scene-smoke.cjs`.
// Uses an existing Playwright install; PLAYWRIGHT_MODULE and CHROME_PATH are optional.
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const browser = await chromium.launch(process.env.CHROME_PATH
    ? { executablePath: process.env.CHROME_PATH, headless: true }
    : { channel: 'chrome', headless: true });
  const failures = [];
  try {
    for (const mobile of [false, true]) {
      const page = await browser.newPage({
        viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
        isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 3 : 1,
        reducedMotion: mobile ? 'reduce' : 'no-preference'
      });
      page.on('pageerror', error => failures.push(error.message));
      page.on('console', message => {
        if (message.type() === 'error' || /mergeBufferGeometries.*failed/.test(message.text())) failures.push(message.text());
      });
      await page.goto(process.env.TEST_URL || 'http://127.0.0.1:8765');
      await page.waitForSelector('body[data-ready=true]', { timeout: 60000 });
      await page.waitForSelector('#loader', { state: 'detached' });
      const outsideCalls = await page.evaluate(async () => {
        const { renderer, scene, camera } = await import('/js/scene/sceneSetup.js');
        renderer.render(scene, camera);
        return renderer.info.render.calls;
      });
      assert.ok(outsideCalls < 300, `Exterior draw calls: ${outsideCalls}`);

      // Record actual frames: no camera crossing, and swap only under an opaque cover.
      await page.evaluate(async () => {
        const { camera } = await import('/js/scene/sceneSetup.js');
        const { exteriorGroup } = await import('/js/scene/exteriorScene.js');
        window.entranceFrames = [];
        window.recordEntrance = true;
        function sample() {
          entranceFrames.push({ outside: exteriorGroup.visible, z: camera.position.z,
            opacity: Number(getComputedStyle(document.getElementById('light-pop')).opacity) });
          if (recordEntrance) requestAnimationFrame(sample);
        }
        requestAnimationFrame(sample);
      });
      const start = Date.now();
      await page.locator('[data-action=enter]').click();
      await page.waitForSelector('body[data-scene=ROOM]');
      await page.waitForFunction(() => !document.getElementById('light-pop').getAnimations().length);
      const frames = await page.evaluate(() => { recordEntrance = false; return entranceFrames; });
      assert.ok(frames.filter(f => f.outside).every(f => f.z >= 7.9), 'Camera crossed the portal before covering the exterior');
      const swap = frames.find((f, i) => i > 0 && !f.outside && frames[i - 1].outside);
      assert.ok(swap && swap.opacity >= 0.99, 'Scene swap was visible');
      assert.ok(Date.now() - start < 4000, 'Entrance has an unnecessary delay');

      const roomState = await page.evaluate(async () => {
        const { scene, renderer, camera } = await import('/js/scene/sceneSetup.js');
        renderer.render(scene, camera);
        const group = scene.getObjectByName('RoomContainer');
        return { visible: group.visible, calls: renderer.info.render.calls,
          targets: group.children.filter(o => o.userData.clickable).length,
          width: document.documentElement.scrollWidth, viewport: innerWidth };
      });
      assert.ok(roomState.visible && roomState.targets === 10, 'Interactive room objects lost during batching');
      assert.ok(roomState.calls < 250, `Room draw calls: ${roomState.calls}`);
      assert.equal(roomState.width, roomState.viewport, 'Horizontal overflow');

      // All five destinations remain reachable with touch and keyboard navigation.
      for (const id of ['laptop', 'about', 'plant', 'shelf', 'poster']) {
        await page.locator(`[data-view=${id}]`).focus();
        await page.keyboard.press('Enter');
        await page.waitForSelector('#modal.open');
        assert.ok((await page.locator('#modal-body').textContent()).trim().length > 30);
        await page.keyboard.press('Escape');
        await page.waitForSelector('#modal.open', { state: 'hidden' });
        await page.waitForTimeout(mobile ? 50 : 1000);
      }

      // Geometry batching preserves the positions of indexed/nonindexed and moving parts.
      const batched = await page.evaluate(async () => {
        const THREE = await import('three');
        const { batchStatic } = await import('/js/scene/sceneUtils.js');
        const root = new THREE.Group(); root.position.set(4, 2, -3); root.rotation.y = 0.4;
        const mat = new THREE.MeshBasicMaterial();
        const moving = new THREE.Group(); root.add(moving);
        for (let i = 0; i < 5; i++) {
          let geo = new THREE.BoxGeometry(1, 2, 1);
          if (i > 1) geo = geo.toNonIndexed();
          const mesh = new THREE.Mesh(geo, mat); mesh.position.set(i * 2, i, -i);
          (i === 4 ? moving : root).add(mesh);
        }
        function bounds() {
          root.updateMatrixWorld(true);
          const result = new THREE.Box3(), vertex = new THREE.Vector3();
          root.traverse(object => {
            if (!object.isMesh) return;
            const positions = object.geometry.attributes.position;
            for (let i = 0; i < positions.count; i++) result.expandByPoint(vertex.fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld));
          });
          return result;
        }
        const before = bounds();
        batchStatic(root, [moving]);
        const after = bounds();
        return { error: before.min.distanceTo(after.min) + before.max.distanceTo(after.max),
          moving: moving.children.length, batches: root.children.filter(o => o.isMesh).length };
      });
      assert.ok(batched.error < 0.00001 && batched.moving === 1 && batched.batches === 2, `Batching changed geometry or swallowed a moving part: ${JSON.stringify(batched)}`);

      await page.locator('#back-btn').click();
      await page.waitForSelector('body[data-scene=OUTSIDE]');
      await page.waitForFunction(() => !document.getElementById('light-pop').getAnimations().length);
      await page.locator('[data-action=projects]').click();
      await page.waitForSelector('#modal.open');
      console.log(`${mobile ? 'Mobile / reduced motion' : 'Desktop'} passed: exterior ${outsideCalls}, room ${roomState.calls} draw calls; entrance, five destinations, re-entry and batching.`);
      await page.close();
    }
    assert.deepEqual(failures, [], 'Browser errors');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
