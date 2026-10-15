(() => {
  const MASTER_URL = '/data/bess-master.json';
  const recordHost = document.getElementById('bess-product-records');
  const sourceList = document.getElementById('bess-source-list');

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function renderMaster(master) {
    if (recordHost) {
      recordHost.replaceChildren();
      for (const product of master.products || []) {
        const card = make('article', 'bess-product-card');
        const top = make('div', 'bess-product-top');
        const identity = make('div');
        identity.append(make('p', 'bess-kicker', `${product.manufacturer} · ผู้ผลิต`));
        identity.append(make('h3', '', product.model));
        top.append(identity, make('span', 'bess-status-pill', product.recordStateLabel));
        card.append(top);
        const specs = make('dl', 'bess-spec-grid');
        for (const spec of product.specifications || []) {
          const item = make('div', 'bess-spec');
          item.append(make('dt', '', spec.label), make('dd', '', spec.value));
          specs.append(item);
        }
        card.append(specs);
        const source = master.sources.find((entry) => entry.id === product.sourceId);
        const sourceNote = make('p', 'bess-inline-note', `แหล่งที่มา: ${source ? source.publisher : 'ไม่ระบุ'} · ตรวจ ${source ? source.reviewedAt : master.reviewedAt} · ค่าผู้ผลิตรายงาน ไม่ใช่ผลตรวจอิสระ`);
        card.append(sourceNote);
        for (const conflict of product.conflicts || []) {
          const callout = make('div', 'bess-conflict');
          callout.append(make('strong', '', `ต้องยืนยัน: ${conflict.field}`), make('span', '', conflict.details));
          card.append(callout);
        }
        card.append(make('p', 'bess-caution', product.engineeringCaveat));
        recordHost.append(card);
      }
    }

    if (sourceList) {
      sourceList.replaceChildren();
      for (const source of master.sources || []) {
        if (!['SRC-DOE-STORAGE', 'SRC-GSL-GBP2', 'SRC-SIRINX-ASSESSMENT'].includes(source.id)) continue;
        const item = make('li');
        const link = make('a', '', source.title);
        link.href = source.url;
        link.rel = 'noopener noreferrer';
        link.target = '_blank';
        link.append(make('small', '', `${source.publisher} · ${source.status} · ตรวจ ${source.reviewedAt}`));
        item.append(link);
        sourceList.append(item);
      }
    }
  }

  fetch(MASTER_URL, { credentials: 'same-origin', cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error('Master unavailable');
      return response.json();
    })
    .then(renderMaster)
    .catch(() => {
      if (recordHost) recordHost.replaceChildren(make('p', 'bess-caution', 'อ่าน BESS master ไม่สำเร็จ; โปรดตรวจไฟล์ /data/bess-master.json ใน local prototype'));
    });

  const form = document.getElementById('bess-assessment-form');
  const output = document.getElementById('bess-assessment-output');
  if (!form || !output) return;

  const renderBrief = (result) => {
    const title = make('h3', '', 'BRIEF ตัวอย่าง · ไม่ใช่ผลประเมิน');
    const statement = make('p', '', `สถานะ: ${result.state || 'SCENARIO · INPUT BRIEF ONLY'} · persisted=${result.persisted === false ? 'false' : 'false'} · calculationPerformed=${result.calculationPerformed === false ? 'false' : 'false'}`);
    const summary = make('p', '', 'ข้อมูลทั่วไปถูกจัดเป็น brief เพื่อให้ผู้เชี่ยวชาญตรวจต่อเท่านั้น; ไม่มีการคำนวณผลตอบแทน ขนาดระบบ หรือคำแนะนำทางวิศวกรรม');
    const list = make('ul');
    const brief = result.brief || result.siteContext || {};
    for (const [key, value] of Object.entries(brief)) {
      if (value === '' || value === null || value === undefined) continue;
      list.append(make('li', '', `${key}: ${String(value)}`));
    }
    output.replaceChildren(title, statement, summary, list);
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(['businessType', 'province', 'bessGoal', 'loadProfile', 'existingSolar', 'siteDataStatus'].map((key) => [key, formData.get(key) || '']));
    payload.solution = 'BESS / ESS';
    payload.monthlyBillRange = 'not-provided';
    payload.siteAreaRange = 'not-provided';

    const isLocalMock = window.location.hostname === '127.0.0.1' && window.location.port === '8766';
    if (!isLocalMock) {
      renderBrief({ demoOnly: true, persisted: false, calculationPerformed: false, leadCreated: false, state: 'SCENARIO · BROWSER ONLY', brief: payload });
      return;
    }

    output.replaceChildren(make('p', 'bess-loading', 'ส่งเฉพาะ mock API ใน loopback…'));
    try {
      const response = await fetch('/api/v1/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'same-origin',
        cache: 'no-store'
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Mock request failed');
      renderBrief(result);
    } catch (error) {
      output.replaceChildren(make('h3', '', 'ไม่สามารถเรียก mock API'), make('p', '', `${error.message}. ไม่มีการส่งข้อมูลไปยังระบบอื่น`));
    }
  });

  form.addEventListener('reset', () => {
    window.setTimeout(() => output.replaceChildren(make('h3', '', 'ขอบเขตของแบบประเมิน'), make('p', '', 'สร้างเฉพาะ brief สำหรับทบทวน ไม่คำนวณขนาดแบตเตอรี่ ผลตอบแทน หรือผลประหยัด และไม่สร้าง lead'), make('p', '', 'สถานะ: DEMO · ไม่มีการบันทึก · ไม่มีการส่งข้อมูล')), 0);
  });
})();
