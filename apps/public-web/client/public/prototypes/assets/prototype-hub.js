const byId = (id) => document.getElementById(id);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function setOutput(node, value) {
  if (!node) return;
  node.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

// Route finder: filters only static cards in this document.
const routeFilter = byId('route-filter');
const routeCards = [...document.querySelectorAll('[data-route-card]')];
const routeEmpty = byId('route-empty');
const routeCount = byId('route-count');
function filterRoutes() {
  const query = (routeFilter?.value || '').trim().toLocaleLowerCase();
  let shown = 0;
  for (const card of routeCards) {
    const searchable = `${card.dataset.routeSearch || ''} ${card.textContent || ''}`.toLocaleLowerCase();
    const match = !query || searchable.includes(query);
    card.hidden = !match;
    if (match) shown += 1;
  }
  if (routeEmpty) routeEmpty.hidden = shown !== 0;
  if (routeCount) routeCount.textContent = query ? `พบ ${shown} จาก ${routeCards.length} พื้นที่` : `แสดงทุกพื้นที่ (${routeCards.length})`;
}
routeFilter?.addEventListener('input', filterRoutes);
filterRoutes();

// Site assessment: all values stay in this page; no calculation, network call, or storage.
const assessmentForm = byId('site-assessment-form');
assessmentForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(assessmentForm);
  const brief = {
    demoOnly: true,
    state: 'SCENARIO · INPUT BRIEF ONLY',
    siteContext: Object.fromEntries(['businessType', 'province', 'monthlyBillRange', 'siteAreaRange', 'solution'].map((key) => [key, form.get(key)])),
    calculationPerformed: false,
    roiForecastGenerated: false,
    leadCreated: false,
    persisted: false,
    nextStep: 'ผู้เชี่ยวชาญตรวจข้อมูลไซต์, source, หน่วย, สมมติฐาน และสิทธิ์ก่อนประเมินจริง'
  };
  setOutput(byId('assessment-result'), brief);
});
assessmentForm?.addEventListener('reset', () => window.setTimeout(() => setOutput(byId('assessment-result'), ''), 0));

// AI / cloud / partner / consent forms are local proposal previews; none submit remotely.
byId('ai-demo-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const topic = byId('ai-topic')?.value || 'solar-carport';
  const hasQuestion = Boolean((byId('ai-question')?.value || '').trim());
  setOutput(byId('ai-result'), {
    demoOnly: true,
    host: 'ai.sirinx.co · proposed',
    selectedTopic: topic,
    questionReceivedInBrowser: hasQuestion,
    llmCalled: false,
    persisted: false,
    response: 'ยังไม่มี AI service เชื่อมอยู่ จึงไม่สร้างคำตอบอัตโนมัติ; ควรยืนยันแหล่งข้อมูลและให้ผู้เชี่ยวชาญทบทวนก่อนตอบ'
  });
});

byId('cloud-demo-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  setOutput(byId('cloud-result'), {
    demoOnly: true,
    host: 'cloud.sirinx.co · proposed',
    workloadType: byId('cloud-workload')?.value || 'not_sure',
    dataClass: byId('cloud-data-class')?.value || 'unknown',
    providerRelationship: 'unverified',
    availability: 'unknown',
    pricing: 'unknown',
    capacityReserved: false,
    requestSent: false,
    persisted: false
  });
});

byId('partner-demo-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  setOutput(byId('partner-result'), {
    demoOnly: true,
    partnerType: form.get('partnerType'),
    region: form.get('region'),
    relationshipVerified: false,
    inquirySent: false,
    persisted: false,
    note: 'เป็นตัวอย่าง workflow เท่านั้น; ไม่มีข้อมูลติดต่อและไม่มีการสร้าง lead'
  });
});

byId('pricing-demo-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  setOutput(byId('pricing-result'), {
    demoOnly: true,
    solutionPackage: form.get('solutionPackage'),
    commercialStructure: form.get('commercialStructure'),
    priceAvailable: false,
    quoteCreated: false,
    roiCalculated: false,
    requiredInputs: ['approved site survey', 'load profile and tariff', 'structural/electrical review', 'current vendor offer and warranty', 'owner-approved commercial terms']
  });
});

byId('strategy-brief-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  setOutput(byId('strategy-result'), {
    demoOnly: true,
    proposedPillar: form.get('pillar'),
    reviewHorizon: form.get('horizon'),
    kpiApproved: false,
    businessForecastCreated: false,
    published: false,
    requiredOwners: ['strategy owner', 'evidence reviewer', 'executive approver']
  });
});

byId('about-content-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  setOutput(byId('about-result'), {
    demoOnly: true,
    contentRoute: form.get('route'),
    format: form.get('format'),
    sourceVerified: false,
    rightsReviewed: false,
    published: false,
    checklist: ['approved company facts', 'owner-approved title and biography', 'credential evidence', 'image/voice/video permissions', 'review date and correction path']
  });
});

const blogFilter = byId('blog-filter');
function filterBlogDrafts() {
  const selected = blogFilter?.value || 'all';
  const cards = [...document.querySelectorAll('[data-blog-topic]')];
  let shown = 0;
  for (const card of cards) {
    card.hidden = selected !== 'all' && card.dataset.blogTopic !== selected;
    if (!card.hidden) shown += 1;
  }
  const status = byId('blog-filter-status');
  if (status) status.textContent = `แสดง concept ${shown} จาก ${cards.length} รายการ · ยังไม่เผยแพร่`;
}
blogFilter?.addEventListener('change', filterBlogDrafts);
filterBlogDrafts();

byId('contact-route-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const intent = form.get('intent');
  const suggestedRoute = { assessment: '/co.html#assessment', partner: '#partners', correction: '/#policy', media: '#branding' }[intent] || 'owner_review_required';
  setOutput(byId('contact-route-result'), {
    demoOnly: true,
    intent,
    region: form.get('region'),
    suggestedPrototypeRoute: suggestedRoute,
    contactCaptured: false,
    inquirySent: false,
    persisted: false
  });
});

byId('consent-demo-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const assets = form.getAll('assets');
  const channels = form.getAll('channels');
  const checklist = [
    'ระบุวัตถุประสงค์และผู้อนุมัติการใช้',
    assets.length ? `ขออนุญาต asset ที่เลือกแยกกัน: ${assets.join(', ')}` : 'ยังไม่ได้เลือก asset — ต้องขออนุญาตก่อนใช้',
    channels.length ? `จำกัดช่องทาง: ${channels.join(', ')}` : 'ยังไม่ได้เลือก channel — ห้ามเผยแพร่',
    `ช่วงเวลา: ${form.get('duration') || 'review_required'}`,
    'มีวิธีแก้ไข/ถอนความยินยอมและวันทบทวน',
    'ตรวจ source/rights ของภาพ เสียง วิดีโอ quote และ credential ก่อนเผยแพร่'
  ];
  setOutput(byId('consent-result'), {
    demoOnly: true,
    role: form.get('role'),
    consentRecorded: false,
    persisted: false,
    checklist
  });
});

byId('rights-state-filter')?.addEventListener('change', (event) => {
  const selected = event.currentTarget.value;
  for (const row of document.querySelectorAll('[data-rights-state]')) {
    row.hidden = selected !== 'all' && row.dataset.rightsState !== selected;
  }
});
byId('preview-rights-flow')?.addEventListener('click', () => {
  setOutput(byId('rights-flow-result'), {
    demoOnly: true,
    recordChanged: false,
    persisted: false,
    preview: ['รับคำขอถอน/แก้ไข', 'หยุดการเผยแพร่ใหม่ระหว่างทบทวน', 'ตรวจช่องทางและสำเนาที่ใช้งาน', 'owner ยืนยันการแก้ไขหรือถอน', 'นำ asset ออกจากช่องทางตามขอบเขต', 'บันทึก audit โดยไม่เก็บข้อมูลเกินจำเป็น']
  });
});

// Synthetic back-office queue filter.
const queueFilter = byId('queue-filter');
queueFilter?.addEventListener('change', () => {
  const state = queueFilter.value;
  for (const card of document.querySelectorAll('[data-queue-state]')) {
    card.hidden = state !== 'all' && card.dataset.queueState !== state;
  }
});

// Hosted page uses in-browser fixtures; localhost:8766 calls only its same-origin mock API.
const apiSamples = {
  status: {
    method: 'GET', path: '/v1/status', request: null,
    response: { demoOnly: true, liveIntegrations: false, persisted: false, deviceCommands: false, note: 'Static proposal prototype; no real service connected.' }
  },
  knowledge: {
    method: 'GET', path: '/v1/knowledge?topic=solar-carport', request: null,
    response: { demoOnly: true, records: [{ id: 'ORG-01', topic: 'solar-carport', state: 'website_claim', title: 'Regional knowledge directory', sources: [{ url: 'https://www.sirinx.org/', publisher: 'SIRINX public website', reviewedAt: '2026-10-08', state: 'website_claim' }] }] }
  },
  evidence: {
    method: 'GET', path: '/v1/evidence', request: null,
    response: { demoOnly: true, records: [{ id: 'CO-01', state: 'website_claim', measured: false, verified: false, sourceUrl: 'https://www.sirinx.co/projects/' }, { id: 'SIM-00', state: 'scenario', persisted: false }] }
  },
  projects: {
    method: 'GET', path: '/v1/projects', request: null,
    response: { demoOnly: true, records: [{ id: 'SITE-CLAIM-01', name: 'Ruenphae Royal Park', state: 'website_claim', independentMeasurement: false }, { id: 'SITE-CLAIM-02', name: 'Holatel', state: 'website_claim · status variance noted', independentMeasurement: false }] }
  },
  assessment: {
    method: 'POST', path: '/v1/assessments', request: { businessType: 'hotel', province: 'not-provided', monthlyBillRange: 'not-provided', siteAreaRange: 'not-provided', solution: 'Solar Carport' },
    response: { demoOnly: true, calculationPerformed: false, forecastGenerated: false, leadCreated: false, persisted: false, status: 'scenario_brief_only' }
  },
  ai: {
    method: 'POST', path: '/v1/ai/knowledge-query', request: { topic: 'solar-carport', question: 'What public evidence is available?' },
    response: { demoOnly: true, llmCalled: false, persisted: false, response: 'No model connected. Verify sources and route the question to a human reviewer.', sources: [] }
  },
  cloud: {
    method: 'POST', path: '/v1/cloud/workload-intakes', request: { workloadType: 'inference', region: 'Thailand', dataClass: 'public' },
    response: { demoOnly: true, persisted: false, providerRelationship: 'unverified', availability: 'unknown', pricing: 'unknown', requestCreated: false }
  },
  consent: {
    method: 'POST', path: '/v1/brand-consents', request: { role: 'staff', assets: ['byline', 'video'], channels: ['website', 'blog', 'youtube'], duration: 'review_required' },
    response: { demoOnly: true, consentRecorded: false, persisted: false, checklist: ['owner approval', 'scope', 'expiry', 'withdrawal path'] }
  },
  pricing: {
    method: 'POST', path: '/v1/pricing/scenarios', request: { solutionPackage: 'solar_carport', commercialStructure: 'not_sure', region: 'not_provided' },
    response: { demoOnly: true, priceAvailable: false, quoteCreated: false, roiCalculated: false, persisted: false, requiredInputs: ['site survey', 'tariff/load profile', 'approved commercial terms'] }
  },
  editorial: {
    method: 'POST', path: '/v1/editorial/review-briefs', request: { route: 'blog', format: 'video', topic: 'Evidence-first solar assessment' },
    response: { demoOnly: true, sourceVerified: false, ownerReviewRequired: true, draftCreated: false, published: false, persisted: false }
  },
  contact: {
    method: 'POST', path: '/v1/contact/routing', request: { intent: 'assessment', region: 'Central' },
    response: { demoOnly: true, contactCaptured: false, inquirySent: false, persisted: false, suggestedPrototypeRoute: '/co.html#assessment' }
  },
  partner: {
    method: 'POST', path: '/v1/partner-inquiries', request: { partnerType: 'engineering', region: 'Central', interest: 'evidence workflow' },
    response: { demoOnly: true, status: 'preview_only', persisted: false, inquirySent: false }
  }
};
function updateApiPreview() {
  const key = byId('api-endpoint')?.value || 'status';
  const item = apiSamples[key];
  if (!item) return;
  const payload = item.request ? `\n${JSON.stringify(item.request, null, 2)}` : '';
  setOutput(byId('api-request-preview'), `${item.method} ${item.path}${payload}`);
  setOutput(byId('api-response'), 'เลือก endpoint แล้วกดปุ่มเพื่อแสดงผลจำลอง');
}
byId('api-endpoint')?.addEventListener('change', updateApiPreview);
byId('run-api-mock')?.addEventListener('click', async () => {
  const item = apiSamples[byId('api-endpoint')?.value || 'status'];
  if (!item) return;
  const isLoopbackMock = ['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.port === '8766';
  if (isLoopbackMock) {
    try {
      const response = await fetch(`/api${item.path}`, {
        method: item.method,
        headers: item.request ? { 'Content-Type': 'application/json' } : {},
        body: item.request ? JSON.stringify(item.request) : undefined,
        cache: 'no-store'
      });
      const data = await response.json();
      setOutput(byId('api-response'), { httpStatus: response.status, mock: true, sameOriginLoopback: true, networkRequestMade: true, response: data });
    } catch (error) {
      setOutput(byId('api-response'), { mock: true, sameOriginLoopback: true, error: String(error?.message || error).slice(0, 160), note: 'No external endpoint is attempted.' });
    }
    return;
  }
  setOutput(byId('api-response'), { httpStatus: 200, mock: true, sameOriginLoopback: false, networkRequestMade: false, response: item.response });
});
updateApiPreview();

// Optional 3D: dependencies are dynamically imported only after the user chooses Load.
let rendererModule = null;
let rendererHandle = null;
const load3dButton = byId('load-3d');
const show2dButton = byId('show-2d');
const startMotionButton = byId('start-motion');
const pauseMotionButton = byId('pause-motion');
const sceneRoot = byId('scene3d-root');
const scene2d = byId('scene-2d');
const renderStatus = byId('render-status');
const setRenderStatus = (message) => { if (renderStatus) renderStatus.textContent = message; };

load3dButton?.addEventListener('click', async () => {
  if (rendererHandle) {
    scene2d.hidden = true;
    sceneRoot.hidden = false;
    rendererHandle.render();
    setRenderStatus('3D scene พร้อมแล้ว · ไม่มี live data หรือการเชื่อมต่อภายนอก');
    return;
  }
  load3dButton.disabled = true;
  load3dButton.textContent = 'กำลังโหลด local modules…';
  try {
    sceneRoot.hidden = false;
    const moduleUrl = new URL('/assets/render-3d.js', window.location.origin);
    rendererModule = await import(moduleUrl.href);
    rendererHandle = await rendererModule.mount({ container: sceneRoot });
    scene2d.hidden = true;
    startMotionButton.disabled = reduceMotion.matches;
    pauseMotionButton.disabled = false;
    byId('scene-angle')?.dispatchEvent(new Event('input'));
    load3dButton.textContent = '3D พร้อมแล้ว';
    setRenderStatus(reduceMotion.matches
      ? '3D แบบนิ่งพร้อมแล้ว · ระบบ reduced-motion เปิดอยู่ จึงปิด motion'
      : '3D แบบนิ่งพร้อมแล้ว · เริ่ม motion ได้เมื่อเลือกเอง');
  } catch (error) {
    sceneRoot.hidden = true;
    scene2d.hidden = false;
    load3dButton.disabled = false;
    load3dButton.textContent = 'ลองโหลด 3D อีกครั้ง';
    const reason = String(error?.message || error).slice(0, 180);
    setRenderStatus(`โหลด WebGL ไม่สำเร็จ; คง SVG 2D ไว้ใช้งาน · ${reason}`);
  }
});

show2dButton?.addEventListener('click', () => {
  rendererHandle?.pauseMotion();
  sceneRoot.hidden = true;
  scene2d.hidden = false;
  setRenderStatus('กลับสู่ SVG 2D fallback · พร้อมใช้งานโดยไม่ต้องใช้ WebGL');
});

byId('scene-angle')?.addEventListener('input', (event) => {
  const degrees = Number(event.currentTarget.value) || 0;
  if (rendererHandle) rendererHandle.setAngle(degrees);
});

startMotionButton?.addEventListener('click', () => {
  if (reduceMotion.matches) {
    setRenderStatus('Motion ปิดไว้ตาม prefers-reduced-motion; ยังคงใช้งานฉาก 2D/3D แบบนิ่งได้');
    return;
  }
  if (!rendererHandle) return;
  rendererHandle.startMotion();
  pauseMotionButton.disabled = false;
  setRenderStatus('กำลังเล่น clay motion · กดหยุดได้ทุกเมื่อ');
});

pauseMotionButton?.addEventListener('click', () => {
  rendererHandle?.pauseMotion();
  setRenderStatus('หยุด motion แล้ว · ฉาก 3D แบบนิ่งยังคงพร้อมใช้');
});

reduceMotion.addEventListener?.('change', (event) => {
  if (startMotionButton) startMotionButton.disabled = event.matches || !rendererHandle;
  if (event.matches) {
    rendererHandle?.pauseMotion();
    setRenderStatus('ระบบ reduced-motion เปิดอยู่ · motion ถูกหยุด แต่ 2D/3D แบบนิ่งยังใช้งานได้');
  }
});
