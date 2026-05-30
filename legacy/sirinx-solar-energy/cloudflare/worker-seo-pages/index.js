/**
 * SIRINX Solar Energy — SEO Pages Worker
 * Server-side render SEO landing pages สำหรับ 77 จังหวัดของไทย
 *
 * Routes:
 *   /solar/:province       → province landing page
 *   /sitemap.xml           → auto-generated sitemap
 *
 * Cache: KV store (CF KV binding: SEO_CACHE), TTL 1 hour
 */

// ทั้ง 77 จังหวัด (ชื่อภาษาอังกฤษ + ไทย)
const PROVINCES = [
  { slug: 'bangkok', th: 'กรุงเทพมหานคร', en: 'Bangkok', region: 'central' },
  { slug: 'samut-prakan', th: 'สมุทรปราการ', en: 'Samut Prakan', region: 'central' },
  { slug: 'nonthaburi', th: 'นนทบุรี', en: 'Nonthaburi', region: 'central' },
  { slug: 'pathum-thani', th: 'ปทุมธานี', en: 'Pathum Thani', region: 'central' },
  { slug: 'ayutthaya', th: 'พระนครศรีอยุธยา', en: 'Ayutthaya', region: 'central' },
  { slug: 'ang-thong', th: 'อ่างทอง', en: 'Ang Thong', region: 'central' },
  { slug: 'lopburi', th: 'ลพบุรี', en: 'Lopburi', region: 'central' },
  { slug: 'sing-buri', th: 'สิงห์บุรี', en: 'Sing Buri', region: 'central' },
  { slug: 'chai-nat', th: 'ชัยนาท', en: 'Chai Nat', region: 'central' },
  { slug: 'saraburi', th: 'สระบุรี', en: 'Saraburi', region: 'central' },
  { slug: 'chonburi', th: 'ชลบุรี', en: 'Chonburi', region: 'east' },
  { slug: 'rayong', th: 'ระยอง', en: 'Rayong', region: 'east' },
  { slug: 'chanthaburi', th: 'จันทบุรี', en: 'Chanthaburi', region: 'east' },
  { slug: 'trat', th: 'ตราด', en: 'Trat', region: 'east' },
  { slug: 'chachoengsao', th: 'ฉะเชิงเทรา', en: 'Chachoengsao', region: 'east' },
  { slug: 'prachin-buri', th: 'ปราจีนบุรี', en: 'Prachin Buri', region: 'east' },
  { slug: 'nakhon-nayok', th: 'นครนายก', en: 'Nakhon Nayok', region: 'east' },
  { slug: 'sa-kaeo', th: 'สระแก้ว', en: 'Sa Kaeo', region: 'east' },
  { slug: 'nakhon-ratchasima', th: 'นครราชสีมา', en: 'Nakhon Ratchasima', region: 'northeast' },
  { slug: 'buri-ram', th: 'บุรีรัมย์', en: 'Buri Ram', region: 'northeast' },
  { slug: 'surin', th: 'สุรินทร์', en: 'Surin', region: 'northeast' },
  { slug: 'si-sa-ket', th: 'ศรีสะเกษ', en: 'Si Sa Ket', region: 'northeast' },
  { slug: 'ubon-ratchathani', th: 'อุบลราชธานี', en: 'Ubon Ratchathani', region: 'northeast' },
  { slug: 'yasothon', th: 'ยโสธร', en: 'Yasothon', region: 'northeast' },
  { slug: 'chaiyaphum', th: 'ชัยภูมิ', en: 'Chaiyaphum', region: 'northeast' },
  { slug: 'amnat-charoen', th: 'อำนาจเจริญ', en: 'Amnat Charoen', region: 'northeast' },
  { slug: 'bueng-kan', th: 'บึงกาฬ', en: 'Bueng Kan', region: 'northeast' },
  { slug: 'nong-bua-lam-phu', th: 'หนองบัวลำภู', en: 'Nong Bua Lam Phu', region: 'northeast' },
  { slug: 'khon-kaen', th: 'ขอนแก่น', en: 'Khon Kaen', region: 'northeast' },
  { slug: 'udon-thani', th: 'อุดรธานี', en: 'Udon Thani', region: 'northeast' },
  { slug: 'loei', th: 'เลย', en: 'Loei', region: 'northeast' },
  { slug: 'nong-khai', th: 'หนองคาย', en: 'Nong Khai', region: 'northeast' },
  { slug: 'maha-sarakham', th: 'มหาสารคาม', en: 'Maha Sarakham', region: 'northeast' },
  { slug: 'roi-et', th: 'ร้อยเอ็ด', en: 'Roi Et', region: 'northeast' },
  { slug: 'kalasin', th: 'กาฬสินธุ์', en: 'Kalasin', region: 'northeast' },
  { slug: 'sakon-nakhon', th: 'สกลนคร', en: 'Sakon Nakhon', region: 'northeast' },
  { slug: 'nakhon-phanom', th: 'นครพนม', en: 'Nakhon Phanom', region: 'northeast' },
  { slug: 'mukdahan', th: 'มุกดาหาร', en: 'Mukdahan', region: 'northeast' },
  { slug: 'chiang-mai', th: 'เชียงใหม่', en: 'Chiang Mai', region: 'north' },
  { slug: 'lamphun', th: 'ลำพูน', en: 'Lamphun', region: 'north' },
  { slug: 'lampang', th: 'ลำปาง', en: 'Lampang', region: 'north' },
  { slug: 'uttaradit', th: 'อุตรดิตถ์', en: 'Uttaradit', region: 'north' },
  { slug: 'phrae', th: 'แพร่', en: 'Phrae', region: 'north' },
  { slug: 'nan', th: 'น่าน', en: 'Nan', region: 'north' },
  { slug: 'phayao', th: 'พะเยา', en: 'Phayao', region: 'north' },
  { slug: 'chiang-rai', th: 'เชียงราย', en: 'Chiang Rai', region: 'north' },
  { slug: 'mae-hong-son', th: 'แม่ฮ่องสอน', en: 'Mae Hong Son', region: 'north' },
  { slug: 'nakhon-sawan', th: 'นครสวรรค์', en: 'Nakhon Sawan', region: 'central' },
  { slug: 'uthai-thani', th: 'อุทัยธานี', en: 'Uthai Thani', region: 'central' },
  { slug: 'kamphaeng-phet', th: 'กำแพงเพชร', en: 'Kamphaeng Phet', region: 'central' },
  { slug: 'tak', th: 'ตาก', en: 'Tak', region: 'north' },
  { slug: 'sukhothai', th: 'สุโขทัย', en: 'Sukhothai', region: 'north' },
  { slug: 'phitsanulok', th: 'พิษณุโลก', en: 'Phitsanulok', region: 'north' },
  { slug: 'phichit', th: 'พิจิตร', en: 'Phichit', region: 'north' },
  { slug: 'phetchabun', th: 'เพชรบูรณ์', en: 'Phetchabun', region: 'north' },
  { slug: 'ratchaburi', th: 'ราชบุรี', en: 'Ratchaburi', region: 'west' },
  { slug: 'kanchanaburi', th: 'กาญจนบุรี', en: 'Kanchanaburi', region: 'west' },
  { slug: 'suphan-buri', th: 'สุพรรณบุรี', en: 'Suphan Buri', region: 'central' },
  { slug: 'nakhon-pathom', th: 'นครปฐม', en: 'Nakhon Pathom', region: 'central' },
  { slug: 'samut-sakhon', th: 'สมุทรสาคร', en: 'Samut Sakhon', region: 'central' },
  { slug: 'samut-songkhram', th: 'สมุทรสงคราม', en: 'Samut Songkhram', region: 'central' },
  { slug: 'phetchaburi', th: 'เพชรบุรี', en: 'Phetchaburi', region: 'west' },
  { slug: 'prachuap-khiri-khan', th: 'ประจวบคีรีขันธ์', en: 'Prachuap Khiri Khan', region: 'west' },
  { slug: 'nakhon-si-thammarat', th: 'นครศรีธรรมราช', en: 'Nakhon Si Thammarat', region: 'south' },
  { slug: 'krabi', th: 'กระบี่', en: 'Krabi', region: 'south' },
  { slug: 'phang-nga', th: 'พังงา', en: 'Phang Nga', region: 'south' },
  { slug: 'phuket', th: 'ภูเก็ต', en: 'Phuket', region: 'south' },
  { slug: 'surat-thani', th: 'สุราษฎร์ธานี', en: 'Surat Thani', region: 'south' },
  { slug: 'ranong', th: 'ระนอง', en: 'Ranong', region: 'south' },
  { slug: 'chumphon', th: 'ชุมพร', en: 'Chumphon', region: 'south' },
  { slug: 'songkhla', th: 'สงขลา', en: 'Songkhla', region: 'south' },
  { slug: 'satun', th: 'สตูล', en: 'Satun', region: 'south' },
  { slug: 'trang', th: 'ตรัง', en: 'Trang', region: 'south' },
  { slug: 'phatthalung', th: 'พัทลุง', en: 'Phatthalung', region: 'south' },
  { slug: 'pattani', th: 'ปัตตานี', en: 'Pattani', region: 'south' },
  { slug: 'yala', th: 'ยะลา', en: 'Yala', region: 'south' },
  { slug: 'narathiwat', th: 'นราธิวาส', en: 'Narathiwat', region: 'south' },
];

const PROVINCE_MAP = Object.fromEntries(PROVINCES.map((p) => [p.slug, p]));

// irradiation estimates (kWh/kWp/day) by region — simplified averages
const SOLAR_IRRADIATION = {
  central: 4.5,
  east: 4.6,
  northeast: 4.8,
  north: 4.3,
  west: 4.7,
  south: 4.9,
};

/**
 * Build full HTML page for a province
 */
function buildProvincePage(province) {
  const irr = SOLAR_IRRADIATION[province.region] || 4.5;
  const annualYield = (irr * 365).toFixed(0);
  const roi = ((irr * 365 * 0.9) / 1000).toFixed(2); // simplified MWh/kWp/year

  const title = `ติดตั้งโซลาร์เซลล์ ${province.th} | SIRINX Solar Energy`;
  const description = `ติดตั้งแผงโซลาร์เซลล์ในจังหวัด${province.th} ลดค่าไฟฟ้าสูงสุด 80% ผลตอบแทน ${annualYield} kWh/kWp/ปี ปรึกษาฟรี ออกแบบระบบโดยทีมผู้เชี่ยวชาญ`;
  const canonical = `https://sirinx.com/solar/${province.slug}`;

  // Schema.org LocalBusiness + Service structured data
  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `SIRINX Solar Energy ${province.th}`,
    description: description,
    url: canonical,
    areaServed: {
      '@type': 'AdministrativeArea',
      name: province.th,
    },
    serviceType: 'Solar Energy Installation',
    provider: {
      '@type': 'Organization',
      name: 'SIRINX Solar Energy',
      url: 'https://sirinx.com',
    },
    offers: {
      '@type': 'Offer',
      name: `ติดตั้งโซลาร์เซลล์${province.th}`,
      description: `ระบบโซลาร์เซลล์สำหรับโรงงาน โกดัง และโรงแรมในจังหวัด${province.th}`,
    },
  });

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${canonical}">

  <!-- Open Graph -->
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="https://sirinx.com/og-solar-${province.region}.jpg">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">

  <!-- Structured Data -->
  <script type="application/ld+json">${schema}</script>

  <style>
    body { font-family: 'Sarabun', sans-serif; background: #0A2342; color: #fff; margin: 0; }
    .hero { background: linear-gradient(135deg, #0A2342 0%, #1a3a5c 100%); padding: 80px 24px; text-align: center; }
    .hero h1 { font-size: 2.5rem; color: #F5A623; margin-bottom: 16px; }
    .hero p { font-size: 1.2rem; color: rgba(255,255,255,0.85); max-width: 600px; margin: 0 auto 32px; }
    .cta { background: #F5A623; color: #0A2342; border: none; padding: 16px 40px; font-size: 1.1rem; font-weight: 700; border-radius: 8px; cursor: pointer; text-decoration: none; display: inline-block; }
    .stats { display: flex; justify-content: center; gap: 40px; padding: 48px 24px; flex-wrap: wrap; }
    .stat { text-align: center; }
    .stat .value { font-size: 2rem; font-weight: 700; color: #10B981; }
    .stat .label { color: rgba(255,255,255,0.7); margin-top: 4px; }
    .section { max-width: 900px; margin: 0 auto; padding: 48px 24px; }
    h2 { color: #F5A623; font-size: 1.8rem; margin-bottom: 24px; }
  </style>
</head>
<body>
  <header style="background: rgba(10,35,66,0.95); padding: 16px 24px; display: flex; justify-content: space-between; align-items: center;">
    <a href="/" style="color: #F5A623; font-size: 1.4rem; font-weight: 700; text-decoration: none;">SIRINX Solar</a>
    <a href="/contact" class="cta" style="padding: 8px 24px; font-size: 1rem;">ติดต่อเรา</a>
  </header>

  <section class="hero">
    <h1>ติดตั้งโซลาร์เซลล์${province.th}</h1>
    <p>${description}</p>
    <a href="/contact?province=${province.slug}" class="cta">ปรึกษาฟรี ไม่มีข้อผูกมัด</a>
  </section>

  <div class="stats">
    <div class="stat">
      <div class="value">${irr}</div>
      <div class="label">kWh/kWp/วัน (ค่าเฉลี่ยภูมิภาค)</div>
    </div>
    <div class="stat">
      <div class="value">${annualYield}</div>
      <div class="label">kWh/kWp/ปี (ประมาณการ)</div>
    </div>
    <div class="stat">
      <div class="value">7-10 ปี</div>
      <div class="label">ระยะคืนทุน</div>
    </div>
    <div class="stat">
      <div class="value">25 ปี</div>
      <div class="label">อายุการใช้งานระบบ</div>
    </div>
  </div>

  <section class="section">
    <h2>ทำไมต้องเลือก SIRINX ใน${province.th}?</h2>
    <ul style="line-height: 2; color: rgba(255,255,255,0.85);">
      <li>ประสบการณ์ติดตั้งในภูมิภาค${province.region === 'central' ? 'กลาง' : province.region === 'northeast' ? 'อีสาน' : province.region === 'north' ? 'เหนือ' : province.region === 'south' ? 'ใต้' : 'ตะวันออก'}กว่า 10 ปี</li>
      <li>ระบบ AI 47 Ronin วิเคราะห์ ROI และออกแบบระบบให้เหมาะกับโรงงานคุณ</li>
      <li>รับประกันระบบ 25 ปี พร้อมบริการ O&M ครบวงจร</li>
      <li>ลดค่าไฟฟ้าได้สูงสุด 80% ตั้งแต่ปีแรก</li>
      <li>ทีมวิศวกรท้องถิ่นใน${province.th}พร้อมให้บริการ</li>
    </ul>
  </section>

  <footer style="text-align: center; padding: 40px 24px; color: rgba(255,255,255,0.5); border-top: 1px solid rgba(255,255,255,0.1);">
    <p>SIRINX Solar Energy | ติดตั้งโซลาร์เซลล์ทั่วประเทศไทย</p>
    <p>โทร: <a href="tel:+6620000000" style="color: #F5A623;">02-000-0000</a> | อีเมล: <a href="mailto:sales@sirinx.com" style="color: #F5A623;">sales@sirinx.com</a></p>
  </footer>
</body>
</html>`;
}

/**
 * Build XML sitemap for all province pages
 */
function buildSitemap() {
  const urls = PROVINCES.map(
    (p) => `  <url>
    <loc>https://sirinx.com/solar/${p.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://sirinx.com/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
${urls}
</urlset>`;
}

async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Sitemap
  if (path === '/sitemap.xml') {
    return new Response(buildSitemap(), {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  // Province pages: /solar/:slug
  const match = path.match(/^\/solar\/([a-z-]+)\/?$/);
  if (!match) {
    return new Response('Not Found', { status: 404 });
  }

  const slug = match[1];
  const province = PROVINCE_MAP[slug];
  if (!province) {
    return new Response('Province not found', { status: 404 });
  }

  // Check KV cache first (binding name: SEO_CACHE)
  const cacheKey = `seo:${slug}`;
  if (env.SEO_CACHE) {
    const cached = await env.SEO_CACHE.get(cacheKey);
    if (cached) {
      return new Response(cached, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
          'X-Cache': 'HIT',
        },
      });
    }
  }

  const html = buildProvincePage(province);

  // Store in KV with 1hr TTL
  if (env.SEO_CACHE) {
    await env.SEO_CACHE.put(cacheKey, html, { expirationTtl: 3600 });
  }

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Cache': 'MISS',
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  },
};
