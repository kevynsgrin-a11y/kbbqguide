// Phase 10.6 media review workbench. Local-only; no network. Renders every asset
// with its proposed alt + per-lane controls and exports review/decisions.json for
// `npm run review:apply`. Nothing here writes to the site.
(function () {
  const DATA = window.__REVIEW_DATA__ || [];
  const LANES = window.__REVIEW_LANES__ || [
    'food',
    'safety',
    'cultural',
    'accessibility',
    'brand',
  ];
  const DECISIONS = ['', 'approve', 'reject', 'replace', 'defer'];
  const STORAGE_KEY = 'kbbqguide-phase-10-review-draft-v1';

  function loadDraft() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch {
      return null;
    }
  }

  const savedDraft = loadDraft();
  const savedAssets = new Map(
    Array.isArray(savedDraft?.assets)
      ? savedDraft.assets.map((asset) => [asset.assetId, asset])
      : [],
  );

  // Working state, seeded from the manifest proposals.
  const state = new Map();
  for (const a of DATA) {
    const saved = savedAssets.get(a.assetId);
    const lanes = {};
    for (const l of LANES) {
      const cur = (a.review && a.review.lanes && a.review.lanes[l]) || {};
      const savedLane = saved?.lanes?.[l] || {};
      lanes[l] = {
        decision: savedLane.decision || cur.decision || '',
        reviewer: savedLane.reviewer || cur.reviewer || '',
        date: savedLane.date || cur.date || '',
        notes: savedLane.notes || cur.notes || '',
      };
    }
    state.set(a.assetId, {
      editedAlt: saved?.editedAlt || a.proposedAlt || a.currentAlt || '',
      altDecision:
        saved?.altDecision ||
        a.proposedRole ||
        a.currentAltDecision ||
        'informative',
      lanes,
    });
  }

  const listEl = document.getElementById('list');
  const countsEl = document.getElementById('counts');
  const filterEl = document.getElementById('filter');

  function payload() {
    const reviewer = document.getElementById('reviewerName').value.trim();
    const date = document.getElementById('reviewDate').value;
    const assets = DATA.map((a) => {
      const s = state.get(a.assetId);
      const lanes = {};
      for (const l of LANES) {
        const lane = s.lanes[l];
        lanes[l] = {
          decision: lane.decision,
          reviewer: lane.reviewer || (lane.decision ? reviewer : ''),
          date: lane.date || (lane.decision ? date : ''),
          notes: lane.notes,
        };
      }
      return {
        assetId: a.assetId,
        editedAlt: s.editedAlt,
        altDecision: s.altDecision,
        lanes,
      };
    });
    return {
      exportedBy: reviewer || 'unnamed-operator',
      exportedDate: date || '',
      generatedFrom: 'review/index.html (Phase 10.6 workbench)',
      assets,
    };
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload()));
    } catch {
      // The visible export fallback still works if file:// storage is disabled.
    }
  }

  function laneDecided(assetId) {
    const s = state.get(assetId);
    return LANES.every((l) => s.lanes[l].decision);
  }

  function shown() {
    const f = filterEl.value;
    return DATA.filter((a) => {
      if (f === 'overclaim') return a.overclaimFlag;
      if (f === 'undecided') return !laneDecided(a.assetId);
      return true;
    });
  }

  function updateCounts() {
    const total = DATA.length;
    const overclaim = DATA.filter((a) => a.overclaimFlag).length;
    const done = DATA.filter((a) => laneDecided(a.assetId)).length;
    countsEl.textContent = `${total} assets · ${overclaim} overclaim-corrected · ${done}/${total} fully lane-decided`;
  }

  function laneControl(assetId, lane) {
    const s = state.get(assetId).lanes[lane];
    const wrap = document.createElement('div');
    wrap.className = 'lane';
    const title = document.createElement('strong');
    title.textContent = lane === 'cultural' ? 'cultural / language' : lane;
    const sel = document.createElement('select');
    sel.setAttribute('aria-label', `${lane} decision for ${assetId}`);
    for (const d of DECISIONS) {
      const o = document.createElement('option');
      o.value = d;
      o.textContent =
        d === '' ? '— undecided —' : d === 'defer' ? 'defer-to-specialist' : d;
      if (d === s.decision) o.selected = true;
      sel.appendChild(o);
    }
    sel.addEventListener('change', () => {
      s.decision = sel.value;
      updateCounts();
      persist();
    });
    const notes = document.createElement('input');
    notes.type = 'text';
    notes.placeholder = 'notes';
    notes.value = s.notes;
    notes.setAttribute('aria-label', `${lane} notes for ${assetId}`);
    notes.addEventListener('input', () => {
      s.notes = notes.value;
      persist();
    });
    wrap.append(title, sel, notes);
    return wrap;
  }

  function card(a) {
    const s = state.get(a.assetId);
    const el = document.createElement('article');
    el.className = 'card';
    el.id = `card-${a.assetId}`;

    const img = document.createElement('img');
    img.src = a.imageSrc;
    img.alt = `Preview of ${a.assetId}`;
    img.loading = 'lazy';
    const left = document.createElement('div');
    left.appendChild(img);
    const summ = document.createElement('p');
    summ.className = 'note';
    summ.textContent = a.visibleSummary || '';
    left.appendChild(summ);

    const right = document.createElement('div');
    const idrow = document.createElement('div');
    idrow.className = 'idrow';
    const id = document.createElement('strong');
    id.textContent = a.assetId;
    idrow.appendChild(id);
    const usage = document.createElement('span');
    usage.className = 'pill';
    usage.textContent = a.usage;
    idrow.appendChild(usage);
    if (a.overclaimFlag) {
      const p = document.createElement('span');
      p.className = 'pill warn';
      p.textContent = a.interimAltCorrectionApplied
        ? 'overclaim — alt corrected (interim)'
        : 'overclaim flagged';
      idrow.appendChild(p);
    }
    right.appendChild(idrow);

    const cur = document.createElement('details');
    const curS = document.createElement('summary');
    curS.textContent = 'Current live alt text';
    const curP = document.createElement('p');
    curP.className = 'note';
    curP.textContent = a.currentAlt;
    cur.append(curS, curP);
    right.appendChild(cur);

    if (a.overclaimNote) {
      const on = document.createElement('details');
      const onS = document.createElement('summary');
      onS.textContent = 'Why this was flagged';
      const onP = document.createElement('p');
      onP.className = 'note';
      onP.textContent = a.overclaimNote;
      on.append(onS, onP);
      right.appendChild(on);
    }

    const f1 = document.createElement('label');
    f1.className = 'field';
    const f1s = document.createElement('span');
    f1s.textContent = 'Alt text (editable — proposed prefilled)';
    const ta = document.createElement('textarea');
    ta.value = s.editedAlt;
    ta.setAttribute('aria-label', `Alt text for ${a.assetId}`);
    ta.addEventListener('input', () => {
      s.editedAlt = ta.value;
      persist();
    });
    f1.append(f1s, ta);
    right.appendChild(f1);

    const roleRow = document.createElement('div');
    roleRow.className = 'role-row';
    const roleLabel = document.createElement('span');
    roleLabel.className = 'note';
    roleLabel.textContent = 'Role:';
    roleRow.appendChild(roleLabel);
    for (const role of ['informative', 'decorative']) {
      const lab = document.createElement('label');
      const rb = document.createElement('input');
      rb.type = 'radio';
      rb.name = `role-${a.assetId}`;
      rb.value = role;
      rb.checked = s.altDecision === role;
      rb.addEventListener('change', () => {
        if (rb.checked) {
          s.altDecision = role;
          persist();
        }
      });
      lab.append(rb, document.createTextNode(` ${role}`));
      roleRow.appendChild(lab);
    }
    const rr = document.createElement('span');
    rr.className = 'note';
    rr.textContent = a.roleRationale ? `(${a.roleRationale})` : '';
    roleRow.appendChild(rr);
    right.appendChild(roleRow);

    const lanes = document.createElement('div');
    lanes.className = 'lanes';
    for (const lane of LANES) lanes.appendChild(laneControl(a.assetId, lane));
    right.appendChild(lanes);

    el.append(left, right);
    return el;
  }

  function render() {
    listEl.replaceChildren(...shown().map(card));
    updateCounts();
  }

  document.getElementById('bulkApply').addEventListener('click', () => {
    const lane = document.getElementById('bulkLane').value;
    const decision = document.getElementById('bulkDecision').value;
    const reviewer = document.getElementById('reviewerName').value.trim();
    const date = document.getElementById('reviewDate').value;
    if (!reviewer || !date) {
      alert('Enter a reviewer name and date before bulk-applying a lane.');
      return;
    }
    for (const a of shown()) {
      const s = state.get(a.assetId).lanes[lane];
      s.decision = decision;
      s.reviewer = reviewer;
      s.date = date;
    }
    persist();
    render();
  });

  function triggerDownload(json) {
    const blob = new Blob([json], {
      type: 'application/json',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'decisions.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1_000);
  }

  function showExportFallback(json) {
    document.getElementById('exportFallback')?.remove();
    const panel = document.createElement('section');
    panel.id = 'exportFallback';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Export decisions fallback');
    panel.style.cssText =
      'position:fixed;inset:1rem;z-index:20;background:#fffdf8;border:2px solid #b83c2b;border-radius:.6rem;padding:1rem;display:grid;grid-template-rows:auto auto 1fr auto;gap:.6rem;box-shadow:0 12px 40px #0005';

    const heading = document.createElement('strong');
    heading.textContent = 'Your decisions are ready';
    const help = document.createElement('p');
    help.className = 'note';
    help.textContent =
      'If Chrome did not download decisions.json, use Copy JSON, paste it into Notepad, and save the file as decisions.json.';
    const text = document.createElement('textarea');
    text.value = json;
    text.readOnly = true;
    text.setAttribute('aria-label', 'Exported decisions JSON');
    text.style.cssText =
      'width:100%;height:100%;min-height:16rem;font:12px/1.35 monospace';

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:.5rem;flex-wrap:wrap';
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'primary';
    copy.textContent = 'Copy JSON';
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(json);
      } catch {
        text.focus();
        text.select();
        document.execCommand('copy');
      }
      copy.textContent = 'Copied — paste into Notepad';
    });
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Try download again';
    retry.addEventListener('click', () => triggerDownload(json));
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Close';
    close.addEventListener('click', () => panel.remove());
    actions.append(copy, retry, close);
    panel.append(heading, help, text, actions);
    document.body.appendChild(panel);
    copy.focus();
  }

  document.getElementById('export').addEventListener('click', () => {
    const json = JSON.stringify(payload(), null, 2);
    persist();
    triggerDownload(json);
    showExportFallback(json);
  });

  filterEl.addEventListener('change', render);
  const reviewerName = document.getElementById('reviewerName');
  const reviewDate = document.getElementById('reviewDate');
  reviewerName.value = savedDraft?.exportedBy || '';
  reviewDate.value =
    savedDraft?.exportedDate || new Date().toISOString().slice(0, 10);
  reviewerName.addEventListener('input', persist);
  reviewDate.addEventListener('input', persist);
  render();
})();
