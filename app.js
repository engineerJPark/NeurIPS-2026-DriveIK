/* A dependency-free project page. All research values come from the supplied paper/assets. */
'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const svgNS = 'http://www.w3.org/2000/svg';
const signed = (value, digits = 2) => `${value < 0 ? '−' : value > 0 ? '+' : ''}${Math.abs(value).toFixed(digits)}`;

function svgElement(tag, attributes, text) {
  const element = document.createElementNS(svgNS, tag);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  if (text !== undefined) element.textContent = text;
  return element;
}

function initExperiment() {
  if (!window.EXPERIMENTS) return;
  const data = window.EXPERIMENTS;
  let caseIndex = 0;
  let variantKey = 'Near';
  const copy = {
    Near: ['Vehicle placed directly ahead', 'A near-range obstacle produces a shorter predicted travel distance.'],
    Far: ['Vehicle placed near the road horizon', 'A farther road obstacle produces a smaller average endpoint reduction than the near obstacle.'],
    VeryFar: ['Small vehicle at the road horizon', 'The much smaller horizon obstacle has a weaker average effect on endpoint range.'],
    Sky: ['Small vehicle placed in the sky', 'The sky insertion has a near-zero signed mean change across the dataset. Individual predictions can still change.'],
    SkyFar: ['Sky placement · same scale as Far', 'At the same sprite scale as Far, sky placement has a smaller mean absolute response (1.04 m vs. 1.81 m).']
  };
  const chart = $('#trajectory-chart');
  const x = value => 155 + value * 10.5;
  const y = value => 308 - value * 7.8;

  function drawPlot(before, after, delta) {
    chart.replaceChildren();
    chart.append(svgElement('title', {id: 'trajectory-title'}, 'Trajectory before and after obstacle insertion'));
    chart.append(svgElement('desc', {id: 'trajectory-description'}, `Exact saved mean waypoints for ${data.cases[caseIndex].label}, ${variantKey} insertion. Green solid: original. Coral dashed: inserted. Endpoint range change ${signed(delta)} meters. Lateral and forward distances are in meters.`));
    chart.append(svgElement('rect', {x: 58, y: 24, width: 194, height: 285, rx: 4, fill: '#142534'}));
    for (let tick = 0; tick <= 35; tick += 5) {
      chart.append(svgElement('line', {x1: 60, x2: 250, y1: y(tick), y2: y(tick), stroke: '#304251', 'stroke-width': .7}));
      chart.append(svgElement('text', {x: 44, y: y(tick) + 3, fill: '#99afc0', 'font-family': 'Inter, sans-serif', 'font-size': 9, 'text-anchor': 'end'}, tick));
    }
    [-8, -4, 0, 4, 8].forEach(tick => {
      chart.append(svgElement('line', {x1: x(tick), x2: x(tick), y1: 26, y2: 308, stroke: tick === 0 ? '#607788' : '#304251', 'stroke-width': .7, 'stroke-dasharray': tick === 0 ? '4 5' : '2 6'}));
      chart.append(svgElement('text', {x: x(tick), y: 325, fill: '#99afc0', 'font-size': 9, 'text-anchor': 'middle', 'font-family': 'Inter, sans-serif'}, tick));
    });
    chart.append(svgElement('text', {x: 155, y: 345, fill: '#a0b3c4', 'font-size': 9, 'text-anchor': 'middle', 'font-family': 'Inter, sans-serif'}, 'Lateral (m)'));
    chart.append(svgElement('text', {x: 15, y: 170, fill: '#a0b3c4', 'font-size': 9, 'text-anchor': 'middle', transform: 'rotate(-90 15 170)', 'font-family': 'Inter, sans-serif'}, 'Forward (m)'));
    [[before, '#82d5b2', false], [after, '#ff9a88', true]].forEach(([points, color, dashed]) => {
      const attributes = {points: [[0, 0], ...points].map(([px, py]) => `${x(px)},${y(py)}`).join(' '), fill: 'none', stroke: color, 'stroke-width': 2.6, 'stroke-linejoin': 'round', 'stroke-linecap': 'round'};
      if (dashed) attributes['stroke-dasharray'] = '5 4';
      chart.append(svgElement('polyline', attributes));
      points.forEach(([px, py]) => chart.append(svgElement('circle', {cx: x(px), cy: y(py), r: 2.5, fill: color, stroke: '#142534', 'stroke-width': .7})));
      const [px, py] = points[points.length - 1];
      chart.append(svgElement('circle', {cx: x(px), cy: y(py), r: 4.5, fill: '#142534', stroke: color, 'stroke-width': 2}));
    });
    chart.append(svgElement('rect', {x: x(0) - 5, y: y(0) - 5, width: 10, height: 15, rx: 2, fill: '#d8e4ed', stroke: '#101c27', 'stroke-width': 1.5}));
  }

  function render() {
    const selected = data.cases[caseIndex];
    const variant = selected.variants[variantKey];
    const aggregate = data.variants.find(item => item.key === variantKey);
    $('#scene-before').src = selected.original;
    $('#scene-before').alt = `Original front-camera view: ${selected.label}`;
    $('#scene-after').src = variant.image;
    $('#scene-after').alt = `${selected.label} with an inserted vehicle: ${copy[variantKey][0].toLowerCase()}`;
    $('#placement-label').textContent = copy[variantKey][0];
    $('#experiment-insight').textContent = copy[variantKey][1];
    $('#example-delta').innerHTML = `${signed(variant.delta_m)} <small>m</small>`;
    $('#mean-delta').innerHTML = `${signed(aggregate.mean_signed_delta_m)} <small>m</small>`;
    $$('[data-variant]').forEach(button => {
      const active = button.dataset.variant === variantKey;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    drawPlot(variant.before, variant.after, variant.delta_m);
  }
  $$('[data-variant]').forEach(button => button.addEventListener('click', () => {
    variantKey = button.dataset.variant;
    render();
  }));
  $('#scene-select').addEventListener('change', event => {
    caseIndex = Number(event.target.value);
    render();
  });
  $('#comparison-range').addEventListener('input', event => {
    const value = Number(event.target.value);
    $('#image-comparison').style.setProperty('--split', `${value}%`);
    event.target.setAttribute('aria-valuetext', `${value} percent original image, ${100 - value} percent obstacle-inserted image`);
  });
  render();
}

function initBenchmarks() {
  // Selected rows, copied from the paper's NAVSIM and nuScenes tables.
  const datasets = {
    v1: {max: 100, rows: [['OpenDriveVLA*', '0.5B', 73.2, 'baseline'], ['AutoVLA', '3B', 89.1], ['ReCogDrive', '2B', 89.6], ['DriveVLA-W0', '7B', 90.2], ['DriveFine', '8B', 91.8], ['Ours', '0.5B', 92.2, 'ours']]},
    v2: {max: 100, rows: [['OpenDriveVLA*', '0.5B', 70.2, 'baseline'], ['ReCogDrive', '2B', 83.6], ['DriveVLA-W0', '7B', 86.5], ['Ours (SFT)', '0.5B', 89.3], ['DriveFine', '8B', 89.7], ['Ours', '0.5B', 90.6, 'ours']]},
    nuscenes: {max: 0.5, rows: [['DriveVLM', '7B', .40], ['OpenDriveVLA', '0.5B', .35, 'baseline'], ['OpenDriveVLA', '7B', .33], ['EMMA', 'Gemini', .32], ['Impromptu-VLA', '3B', .30], ['Ours', '0.5B', .06, 'ours']]}
  };
  Object.entries(datasets).forEach(([key, dataset]) => {
    const host = $(`[data-chart="${key}"]`);
    dataset.rows.forEach(([name, size, score, className = '']) => {
      const row = document.createElement('div');
      row.className = `chart-row ${className}`;
      const digits = key === 'nuscenes' ? 2 : 1;
      row.innerHTML = `<span class="chart-label">${name}<small>${size}</small></span><div class="chart-bar-track" aria-hidden="true"><div class="chart-bar" style="--value:${score / dataset.max * 100}%"></div></div><span class="chart-value">${score.toFixed(digits)}</span>`;
      host.append(row);
    });
  });
  const tabs = $$('[data-benchmark]');
  function selectTab(tab, focus = false) {
    tabs.forEach(item => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      $(`#${item.getAttribute('aria-controls')}`).hidden = !active;
    });
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        selectTab(tabs[next], true);
      }
    });
  });
  selectTab(tabs[0]);
}

function initVideos() {
  const videos = {
    overview: {title: 'Research overview', poster: 'overview-poster.webp', description: 'A silent, captioned walkthrough of the motivation, visual-state architecture, and experimental results.'},
    driving: {title: 'Driving examples', poster: 'driving-poster.webp', description: 'Selected left-turn, right-turn, urban, and nighttime examples comparing saved baseline and model predictions. Playback is interpolated; metrics describe these clips only.'},
    counterfactual: {title: 'Obstacle interventions', poster: 'counterfactual-poster.webp', description: 'Explore near, far, and sky obstacle insertions, with exact saved predictions and a placement comparison at the same sprite scale.'}
  };
  const video = $('#research-video');
  $$('[data-video]').forEach(button => button.addEventListener('click', () => {
    if (button.classList.contains('active')) return;
    const key = button.dataset.video;
    const selected = videos[key];
    video.pause();
    video.poster = `assets/media/${selected.poster}`;
    $('source', video).src = `assets/media/${key}.mp4`;
    $('track', video).src = `assets/media/${key}.vtt`;
    video.setAttribute('aria-label', `${selected.title} video`);
    video.load();
    $('#video-description').textContent = selected.description;
    $('#video-download').href = `assets/media/${key}.mp4`;
    $$('[data-video]').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
  }));
}

function initCitation() {
  const button = $('#copy-citation');
  let resetTimer;
  button.addEventListener('click', async () => {
    const citation = $('#citation-text').textContent;
    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(citation);
        copied = true;
      }
    } catch (_) { /* The browser may deny clipboard permission. Try the local-file fallback. */ }
    if (!copied) {
      const field = document.createElement('textarea');
      field.value = citation;
      field.style.position = 'fixed';
      field.style.top = '-1000px';
      document.body.append(field);
      field.select();
      try { copied = document.execCommand('copy'); } catch (_) { copied = false; }
      field.remove();
      button.focus({preventScroll: true});
    }
    button.textContent = copied ? 'Copied ✓' : 'Select & copy below';
    $('#copy-status').textContent = copied ? 'BibTeX citation copied to clipboard.' : 'Automatic copying is unavailable. Select the citation below, or download the BibTeX file.';
    if (!copied) {
      const range = document.createRange();
      range.selectNodeContents($('#citation-text'));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => { button.textContent = 'Copy citation'; }, 3500);
  });
}

initExperiment();
initBenchmarks();
initVideos();
initCitation();
