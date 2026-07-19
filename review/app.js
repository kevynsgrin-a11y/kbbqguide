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

  // Working state, seeded from the manifest proposals.
  const state = new Map();
  for (const a of DATA) {
    const lanes = {};
    for (const l of LANES) {
      const cur = (a.review && a.review.lanes && a.review.lanes[l]) || {};
      lanes[l] = {
        decision: cur.decision || '',
        reviewer: cur.reviewer || '',
        date: cur.date || '',
        notes: cur.notes || '',
      };
    }
    state.set(a.assetId, {
      editedAlt: a.proposedAlt || a.currentAlt || '',
      altDecision: a.proposedRole || a.currentAltDecision || 'informative',
      lanes,
    });
  }

  const listEl = document.getElementById('list');
  const countsEl = document.getElementById('counts');
  const filterEl = document.getElementById('filter');

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
    });
    const notes = document.createElement('input');
    notes.type = 'text';
    notes.placeholder = 'notes';
    notes.value = s.notes;
    notes.setAttribute('aria-label', `${lane} notes for ${assetId}`);
    notes.addEventListener('input', () => (s.notes = notes.value));
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
    ta.addEventListener('input', () => (s.editedAlt = ta.value));
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
        if (rb.checked) s.altDecision = role;
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
    render();
  });

  document.getElementById('export').addEventListener('click', () => {
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
    const payload = {
      exportedBy: reviewer || 'unnamed-operator',
      exportedDate: date || '',
      generatedFrom: 'review/index.html (Phase 10.6 workbench)',
      assets,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'decisions.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
  });

  filterEl.addEventListener('change', render);
  document.getElementById('reviewDate').value = new Date()
    .toISOString()
    .slice(0, 10);
  render();
})();
