/* Animals + Human classifier: MobileNetV2 (Keras 3) converted to a TensorFlow.js graph model.
   Input: 224x224 RGB, raw 0-255 floats (the model rescales to [-1, 1] itself).
   Outputs: 13 class probabilities and the 1,280-number "gap" embedding.
   Every setting (class order, temperature, thresholds, display names) is read from class_names.json.
   Everything runs in the browser; no photo is uploaded. */
(() => {
  'use strict';
  const BASE = 'model/';
  const $ = (id) => document.getElementById(id);
  const els = {
    drop: $('drop'), preview: $('preview'), video: $('video'), empty: $('drop-empty'),
    file: $('file'), cam: $('cam'), camText: $('cam-text'), flip: $('flip'),
    status: $('status'), progress: $('progress'), answer: $('answer'),
    label: $('label'), conf: $('conf'), bars: $('bars'), thrLegend: $('thr-legend'),
    reasons: $('reasons'), timing: $('timing'), canvas: $('canvas'), known: $('known-list'),
  };
  const ctx = els.canvas.getContext('2d', { willReadFrequently: true });

  let model = null;
  let cfg = null;      // class_names.json
  let C = null;        // derived: size, indexes, names
  let bank = null;     // { rows, dim, vecs: Float32Array (L2-normalised rows), labels: string[] }
  let stream = null;
  let facing = 'environment';
  let loopTimer = null;
  let busy = false;
  let pending = null;  // newest photo that arrived while a prediction was running

  function setStatus(text, isError = false) {
    els.status.textContent = text;
    els.status.classList.toggle('error', isError);
    els.status.hidden = !text;
  }
  function setProgress(f) {
    const pct = Math.round(f * 100);
    els.progress.firstElementChild.style.width = pct + '%';
    els.progress.setAttribute('aria-valuenow', String(pct));
    setStatus('Loading the model… ' + pct + '%');
  }

  async function fetchOk(url, as) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(url + ' → HTTP ' + r.status);
    return as === 'json' ? r.json() : r.arrayBuffer();
  }

  function setupConfig(c) {
    const names = c.class_names;
    const idx = (n) => {
      const i = names.indexOf(n);
      if (i < 0) throw new Error('class_names.json has no class "' + n + '"');
      return i;
    };
    const unknown = (c.unknown_classes || []).map(idx);
    const human = idx('human');
    const unkAnimal = idx('unknown_animal');
    const notAnimal = idx('not_animal_or_human');
    const animals = names.map((_, i) => i).filter((i) => i !== human && !unknown.includes(i));
    const display = names.map((n) => (c.display_names && c.display_names[n]) || n);
    // Short form for lists and sentences: "Unknown animal (not one of my 10)" -> "Unknown animal"
    const short = display.map((d) => d.replace(/\s*\(.*\)\s*$/, ''));
    const [h, w] = c.img_size || [224, 224];
    return { names, human, unkAnimal, notAnimal, unknown, animals, display, short, h, w };
  }

  function setupBank(meta, buf) {
    const { rows, dim, scale } = meta;
    const q = new Int8Array(buf);
    if (q.length !== rows * dim) throw new Error('bank.bin has ' + q.length + ' values, expected ' + rows * dim);
    if (!Array.isArray(meta.labels) || meta.labels.length !== rows) throw new Error('bank.json labels do not match rows');
    const vecs = new Float32Array(rows * dim);
    for (let r = 0; r < rows; r++) {
      let ss = 0;
      const o = r * dim;
      for (let j = 0; j < dim; j++) { const v = q[o + j] / scale; vecs[o + j] = v; ss += v * v; }
      const inv = 1 / (Math.sqrt(ss) || 1);
      for (let j = 0; j < dim; j++) vecs[o + j] *= inv;
    }
    return { rows, dim, vecs, labels: meta.labels };
  }

  async function loadModel() {
    try {
      try { await tf.setBackend('webgl'); } catch (_) { await tf.setBackend('cpu'); }
      await tf.ready();
      const [c, meta, bankBuf] = await Promise.all([
        fetchOk(BASE + 'class_names.json', 'json'),
        fetchOk(BASE + 'bank.json', 'json'),
        fetchOk(BASE + 'bank.bin'),
      ]);
      cfg = c;
      C = setupConfig(c);
      bank = setupBank(meta, bankBuf);
      if (els.known) els.known.textContent = C.animals.map((i) => C.short[i]).join(', ') + ' and ' + C.short[C.human].toLowerCase() + 's';
      els.thrLegend.textContent = 'confidence threshold ' + pct0(cfg.confidence_threshold);
      model = await tf.loadGraphModel(BASE + 'model.json', { onProgress: setProgress });
      // Warm-up run so the first real prediction is fast.
      tf.tidy(() => { model.predict(tf.zeros([1, C.h, C.w, 3])); });
      els.progress.classList.add('done');
      setStatus('Ready. Upload a photo or turn on the camera.');
      window.__modelReady = true;
      if (pending) { const p = pending; pending = null; run(p); }
    } catch (err) {
      console.error(err);
      els.progress.classList.add('done');
      setStatus('The model could not be loaded. Check your connection and reload the page.', true);
    }
  }

  // ---------- Inference ----------

  // Preprocess like training: EXIF orientation already applied (createImageBitmap "from-image" for files),
  // then squash the WHOLE image to 224x224 (no crop, no letterbox) with high-quality smoothing,
  // and feed raw RGB 0-255 as float32.
  async function predict(source) {
    els.canvas.width = C.w;
    els.canvas.height = C.h;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, C.w, C.h);
    ctx.drawImage(source, 0, 0, C.w, C.h);
    const outs = tf.tidy(() => {
      const x = tf.browser.fromPixels(els.canvas, 3).toFloat().expandDims(0);
      const y = model.predict(x);
      return Array.isArray(y) ? y : Object.values(y);
    });
    try {
      // Tell the two outputs apart by size: 13 probabilities vs 1,280-number embedding.
      const probsT = outs.find((t) => t.shape[t.shape.length - 1] === C.names.length);
      const embT = outs.find((t) => t.shape[t.shape.length - 1] === bank.dim);
      if (!probsT || !embT) throw new Error('Unexpected model outputs: ' + outs.map((t) => t.shape.join('x')).join(', '));
      const [probs, emb] = await Promise.all([probsT.data(), embT.data()]);
      return { probs: Array.from(probs), emb: Float32Array.from(emb) };
    } finally {
      outs.forEach((t) => t.dispose());
    }
  }

  // Cosine similarity of the (L2-normalised) embedding to every bank row.
  function similarities(emb) {
    let ss = 0;
    for (let j = 0; j < emb.length; j++) ss += emb[j] * emb[j];
    const inv = 1 / (Math.sqrt(ss) || 1);
    const { rows, dim, vecs } = bank;
    const sims = new Float32Array(rows);
    for (let r = 0; r < rows; r++) {
      let s = 0;
      const o = r * dim;
      for (let j = 0; j < dim; j++) s += vecs[o + j] * emb[j];
      sims[r] = s * inv;
    }
    return sims;
  }

  // The decision rule, ported exactly from training (same order).
  function decide(probs, emb) {
    const T = cfg.temperature;
    const logits = probs.map((v) => Math.log(Math.max(v, 1e-12)) / T);
    const m = Math.max(...logits);
    const ex = logits.map((v) => Math.exp(v - m));
    const sum = ex.reduce((a, b) => a + b, 0);
    const p = ex.map((v) => v / sum);

    let top = 0;
    for (let i = 1; i < p.length; i++) if (p[i] > p[top]) top = i;
    const conf = p[top];

    const sims = similarities(emb);
    let maxsim = -Infinity;
    for (let r = 0; r < sims.length; r++) if (sims[r] > maxsim) maxsim = sims[r];

    const unkType = p[C.unkAnimal] >= p[C.notAnimal] ? C.unkAnimal : C.notAnimal;
    const thr = cfg.confidence_threshold;
    const simThr = cfg.similarity_threshold;
    const isAnimal = C.animals.includes(top);

    let answer, reason;
    if ((isAnimal || top === C.unkAnimal) && p[C.human] >= cfg.human_ratio * conf) {
      answer = C.human; reason = 'human_priority';
    } else if (top === C.unkAnimal || top === C.notAnimal) {
      answer = top; reason = 'unknown_class';
    } else if (top === C.human) {
      answer = C.human; reason = (conf < thr || maxsim < simThr) ? 'human_kept' : 'model';
    } else if (conf < thr) {
      answer = unkType; reason = 'low_confidence';
    } else if (maxsim < simThr) {
      answer = unkType; reason = 'unfamiliar';
    } else {
      answer = top; reason = 'model';
    }
    return { p, top, conf, maxsim, sims, unkType, answer, reason };
  }

  // ---------- Output ----------

  const pct0 = (v) => Math.round(v * 100) + '%';
  const level = (c) => (c >= 0.9 ? 'high' : c >= 0.7 ? 'medium' : 'low');
  const sim2 = (v) => v.toFixed(2);

  function reasonSentence(d) {
    const { p, top, conf, maxsim, answer } = d;
    const thr = cfg.confidence_threshold;
    const simThr = cfg.similarity_threshold;
    const S = C.short;
    switch (d.reason) {
      case 'human_priority':
        return 'The human score (' + pct0(p[C.human]) + ') is at least ' + pct0(cfg.human_ratio) + ' of the top score (' + pct0(conf) +
          ' for ' + S[top] + '), so the human-priority rule answers Human: a likely person is never called an animal.';
      case 'unknown_class':
        return 'The model itself chose "' + S[top] + '". It was trained with this extra class for ' +
          (top === C.unkAnimal ? 'animals that are not one of its 10.' : 'objects, scenes and drawings.');
      case 'human_kept':
        return 'The top guess is Human. A likely person is never rejected, so the answer stays Human even though ' +
          (conf < thr ? 'confidence ' + pct0(conf) + ' is below the threshold ' + pct0(thr) : 'the picture looks unfamiliar (similarity ' + sim2(maxsim) + ' is below ' + sim2(simThr) + ')') + '.';
      case 'low_confidence':
        return 'Top confidence ' + pct0(conf) + ' is below the threshold ' + pct0(thr) + ', so the model is not sure enough to name it. ' +
          'Its score for "' + S[C.unkAnimal] + '" is ' + pct0(p[C.unkAnimal]) + ' vs "' + S[C.notAnimal] + '" ' + pct0(p[C.notAnimal]) +
          ', so the answer is "' + S[answer] + '".';
      case 'unfamiliar':
        return 'Confidence ' + pct0(conf) + ' is high enough, but the picture is unlike the training photos (similarity ' + sim2(maxsim) +
          ' is below ' + sim2(simThr) + '), so it is treated as unknown. Its score for "' + S[C.unkAnimal] + '" is ' + pct0(p[C.unkAnimal]) +
          ' vs "' + S[C.notAnimal] + '" ' + pct0(p[C.notAnimal]) + ', so the answer is "' + S[answer] + '".';
      default:
        return 'Confidence ' + pct0(conf) + ' is at or above the threshold ' + pct0(thr) + ' and the picture is familiar (similarity ' +
          sim2(maxsim) + ' ≥ ' + sim2(simThr) + '), so the model\'s answer is accepted.';
    }
  }

  function li(parent, title, text) {
    const item = document.createElement('li');
    const b = document.createElement('b');
    b.textContent = title + ' ';
    item.append(b, document.createTextNode(text));
    parent.append(item);
  }

  function show(d, ms) {
    const S = C.short;
    const order = d.p.map((v, i) => i).sort((a, b) => d.p[b] - d.p[a]);
    const isUnknown = C.unknown.includes(d.answer);

    els.answer.hidden = false;
    setStatus('');
    els.label.textContent = C.display[d.answer];
    els.label.className = 'label ' + (isUnknown ? 'unknown' : 'known');
    els.conf.textContent = (d.p[d.answer] * 100).toFixed(1) + '% (calibrated confidence for this answer)';

    // Top-4 bars with the threshold line
    els.bars.replaceChildren();
    order.slice(0, 4).forEach((i) => {
      const row = document.createElement('li');
      row.className = 'bar-row' + (i === d.answer ? ' is-answer' : '') + (C.unknown.includes(i) ? ' is-unknown' : '');
      const name = document.createElement('span');
      name.className = 'bar-name';
      name.textContent = S[i];
      name.title = C.display[i];
      const track = document.createElement('span');
      track.className = 'bar-track';
      const fill = document.createElement('span');
      fill.className = 'bar-fill';
      fill.style.width = (d.p[i] * 100).toFixed(1) + '%';
      const thr = document.createElement('span');
      thr.className = 'bar-thr';
      thr.style.left = (cfg.confidence_threshold * 100) + '%';
      track.append(fill, thr);
      const val = document.createElement('span');
      val.className = 'bar-val';
      val.textContent = (d.p[i] * 100).toFixed(1) + '%';
      row.append(name, track, val);
      els.bars.append(row);
    });

    // Plain-language reasons
    els.reasons.replaceChildren();
    const second = order[0] === d.top ? order[1] : order[0];
    const gap = Math.round((d.conf - d.p[second]) * 100);
    li(els.reasons, 'Top guess:', S[d.top] + ' with ' + pct0(d.conf) + ' calibrated confidence (' + level(d.conf) + ').');
    li(els.reasons, 'Runner-up:', S[second] + ' (' + pct0(d.p[second]) + '); gap ' + gap + ' points: ' + (gap > 40 ? 'a clear decision.' : 'a close call.'));
    li(els.reasons, 'Decision rule:', reasonSentence(d));
    const near = Array.from(d.sims.keys()).sort((a, b) => d.sims[b] - d.sims[a]).slice(0, 3);
    const agree = near.filter((r) => bank.labels[r] === C.names[d.answer]).length;
    li(els.reasons, 'Most similar training photos:', near.map((r) => {
      const i = C.names.indexOf(bank.labels[r]);
      return (i >= 0 ? S[i] : bank.labels[r]) + ' (' + sim2(d.sims[r]) + ')';
    }).join(', ') + '; ' + agree + ' of 3 agree with the final answer.');
    li(els.reasons, 'Familiarity:', 'closest match ' + sim2(d.maxsim) + (d.maxsim >= cfg.similarity_threshold
      ? ' is at or above the familiarity bar ' + sim2(cfg.similarity_threshold) + ', so this looks like the photos it learned from.'
      : ' is below the familiarity bar ' + sim2(cfg.similarity_threshold) + ', so this looks unlike the photos it learned from.'));

    els.timing.textContent = 'Inference ' + ms.toFixed(0) + ' ms on ' + tf.getBackend().toUpperCase();
    window.__last = { answer: C.names[d.answer], reason: d.reason, top: C.names[d.top], conf: d.conf, maxsim: d.maxsim, p: d.p };
  }

  // Runs one prediction; if busy, keeps only the newest photo and runs it next.
  async function run(source) {
    if (!model) { pending = source; return null; }
    if (busy) { if (pending && pending.close) pending.close(); pending = source; return null; }
    busy = true;
    try {
      const t0 = performance.now();
      const { probs, emb } = await predict(source);
      const d = decide(probs, emb);
      show(d, performance.now() - t0);
      return window.__last;
    } catch (err) {
      console.error(err);
      setStatus('Something went wrong reading that image. Try another photo.', true);
      return null;
    } finally {
      if (source && source.close) source.close();  // free ImageBitmaps
      busy = false;
      if (pending && model) { const p = pending; pending = null; run(p); }
    }
  }

  // ---------- Input ----------

  async function toBitmap(blob) {
    return createImageBitmap(blob, { imageOrientation: 'from-image' });
  }

  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      setStatus('Please choose an image file (JPG, PNG, WebP…).', true);
      return;
    }
    stopCamera();
    if (els.preview.dataset.url) URL.revokeObjectURL(els.preview.dataset.url);
    const url = URL.createObjectURL(file);
    els.preview.dataset.url = url;
    els.preview.src = url;
    els.preview.hidden = false;
    els.video.hidden = true;
    els.empty.hidden = true;
    els.drop.classList.add('filled');
    let bmp;
    try {
      bmp = await toBitmap(file);
    } catch (err) {
      console.error(err);
      setStatus('This browser cannot read that image format. Try a JPG or PNG.', true);
      return;
    }
    if (!model) setStatus('Photo received. It will be checked as soon as the model has loaded…');
    run(bmp);
  }

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
      if (els.video.readyState >= 2 && model && !busy) await run(els.video);
      loopTimer = setTimeout(tick, 300);
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

  // Hook for automated tests: classify an image URL; resolves to { answer, reason, top, conf, maxsim, p }.
  window.__classifyUrl = async (url) => {
    const blob = await (await fetch(url)).blob();
    return run(await toBitmap(blob));
  };

  // Hook for automated tests: apply the decision rule to given model outputs.
  window.__decide = (probs, emb) => {
    const d = decide(Array.from(probs), Float32Array.from(emb));
    return { answer: C.names[d.answer], reason: d.reason, conf: d.conf, maxsim: d.maxsim };
  };

  loadModel();
})();
