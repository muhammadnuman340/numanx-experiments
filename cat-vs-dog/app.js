/* Cat vs Dog classifier: EfficientNet-B0 + sigmoid, converted to TensorFlow.js.
   Input: 160x160 RGB, pixel values 0-255 (the model rescales internally).
   Output: probability that the photo is a dog. Everything runs in the browser. */
(() => {
  'use strict';
  const SIZE = 160;
  const MODEL_URL = 'model/model.json';
  const $ = (id) => document.getElementById(id);
  const els = {
    drop: $('drop'), preview: $('preview'), video: $('video'), empty: $('drop-empty'),
    file: $('file'), cam: $('cam'), camText: $('cam-text'), flip: $('flip'),
    status: $('status'), progress: $('progress'), answer: $('answer'),
    label: $('label'), conf: $('conf'), fill: $('meter-fill'), pin: $('meter-pin'),
    pcat: $('pcat'), pdog: $('pdog'), note: $('note'), timing: $('timing'), canvas: $('canvas'),
  };
  const ctx = els.canvas.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  let model = null;
  let stream = null;
  let facing = 'environment';
  let loopTimer = null;
  let busy = false;

  function setStatus(text, isError = false) {
    els.status.textContent = text;
    els.status.classList.toggle('error', isError);
    els.status.hidden = !text;
  }

  async function loadModel() {
    try {
      try { await tf.setBackend('webgl'); } catch (_) { await tf.setBackend('cpu'); }
      await tf.ready();
      model = await tf.loadGraphModel(MODEL_URL, {
        onProgress: (f) => {
          const pct = Math.round(f * 100);
          els.progress.firstElementChild.style.width = pct + '%';
          els.progress.setAttribute('aria-valuenow', String(pct));
          setStatus('Loading the model… ' + pct + '%');
        },
      });
      // Warm-up run so the first real prediction is fast.
      tf.tidy(() => model.predict(tf.zeros([1, SIZE, SIZE, 3])));
      els.progress.classList.add('done');
      setStatus('Ready. Upload a photo or turn on the camera.');
      window.__modelReady = true;
    } catch (err) {
      console.error(err);
      els.progress.classList.add('done');
      setStatus('The model could not be loaded. Check your connection and reload the page.', true);
    }
  }

  // Preprocess like training: the dataset photos are about 500 px wide and were squashed to 160x160
  // with TensorFlow's bilinear resize. So: cap the long side at 512 px (keeps memory low for big
  // phone photos), then use the same bilinear resize to 160x160.
  const MAX_SIDE = 512;
  async function classify(source) {
    if (!model || busy) return null;
    busy = true;
    try {
      const w = source.videoWidth || source.naturalWidth || source.width;
      const h = source.videoHeight || source.naturalHeight || source.height;
      const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
      els.canvas.width = Math.max(1, Math.round(w * scale));
      els.canvas.height = Math.max(1, Math.round(h * scale));
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(source, 0, 0, els.canvas.width, els.canvas.height);
      const t0 = performance.now();
      const out = tf.tidy(() => {
        const x = tf.image.resizeBilinear(tf.browser.fromPixels(els.canvas).toFloat(), [SIZE, SIZE], false, true);
        return model.predict(x.expandDims(0));
      });
      const p = (await out.data())[0];
      out.dispose();
      const ms = performance.now() - t0;
      show(p, ms);
      return p;
    } finally {
      busy = false;
    }
  }

  function show(p, ms) {
    const dog = p >= 0.5;
    const conf = dog ? p : 1 - p;
    els.answer.hidden = false;
    setStatus('');
    els.label.textContent = dog ? 'Dog' : 'Cat';
    els.label.className = 'label ' + (dog ? 'dog' : 'cat');
    els.conf.textContent = (conf * 100).toFixed(1) + '% sure';
    els.fill.style.width = (p * 100).toFixed(1) + '%';
    els.pin.style.left = (p * 100).toFixed(1) + '%';
    els.pcat.textContent = ((1 - p) * 100).toFixed(1) + '%';
    els.pdog.textContent = (p * 100).toFixed(1) + '%';
    if (conf < 0.75) {
      els.note.hidden = false;
      els.note.textContent = 'Not very sure. Is one cat or dog clearly visible? This model always answers cat or dog, even for photos with neither.';
    } else {
      els.note.hidden = true;
    }
    els.timing.textContent = 'Inference ' + ms.toFixed(0) + ' ms on ' + tf.getBackend().toUpperCase();
    window.__lastProb = p;
  }

  function showImage(url) {
    stopCamera();
    els.preview.onload = () => classify(els.preview);
    els.preview.src = url;
    els.preview.hidden = false;
    els.video.hidden = true;
    els.empty.hidden = true;
    els.drop.classList.add('filled');
  }

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      setStatus('Please choose an image file (JPG, PNG, WebP…).', true);
      return;
    }
    if (els.preview.dataset.url) URL.revokeObjectURL(els.preview.dataset.url);
    const url = URL.createObjectURL(file);
    els.preview.dataset.url = url;
    showImage(url);
  }

  // Upload, drag and drop, paste
  els.file.addEventListener('change', () => { handleFile(els.file.files[0]); els.file.value = ''; });
  ['dragenter', 'dragover'].forEach((t) => els.drop.addEventListener(t, (e) => { e.preventDefault(); els.drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((t) => els.drop.addEventListener(t, (e) => { e.preventDefault(); els.drop.classList.remove('over'); }));
  els.drop.addEventListener('drop', (e) => handleFile(e.dataTransfer.files[0]));
  els.drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); els.file.click(); } });
  window.addEventListener('paste', (e) => {
    const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
    if (item) handleFile(item.getAsFile());
  });

  // Camera
  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('Your browser does not support camera access here.', true);
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
    } catch (err) {
      setStatus(err.name === 'NotAllowedError' ? 'Camera permission was denied. You can still upload a photo.' : 'No camera could be opened. You can still upload a photo.', true);
      return;
    }
    els.video.srcObject = stream;
    await els.video.play();
    els.video.hidden = false;
    els.preview.hidden = true;
    els.empty.hidden = true;
    els.drop.classList.add('filled');
    els.camText.textContent = 'Stop camera';
    els.flip.hidden = false;
    const tick = async () => {
      if (!stream) return;
      if (els.video.readyState >= 2) await classify(els.video);
      loopTimer = setTimeout(tick, 250);
    };
    tick();
  }

  function stopCamera() {
    clearTimeout(loopTimer);
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    els.video.srcObject = null;
    els.video.hidden = true;
    els.camText.textContent = 'Use camera';
    els.flip.hidden = true;
    if (els.preview.hidden) { els.empty.hidden = false; els.drop.classList.remove('filled'); }
  }

  els.cam.addEventListener('click', () => (stream ? stopCamera() : startCamera()));
  els.flip.addEventListener('click', async () => {
    facing = facing === 'environment' ? 'user' : 'environment';
    stopCamera();
    await startCamera();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopCamera(); });

  // Hook for automated tests: classify an image URL and return the dog probability.
  window.__classifyUrl = (url) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => resolve(await classify(img));
    img.onerror = reject;
    img.src = url;
  });

  loadModel();
})();
