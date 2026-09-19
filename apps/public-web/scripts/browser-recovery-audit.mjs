import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Read-only audit: no form submissions, cloud mutations, auth bypass, or credentials.
const appRoot = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(appRoot, 'dist/public');
const output = process.env.RECOVERY_AUDIT_OUTPUT || path.join(appRoot, 'audit-output');
fs.mkdirSync(output, { recursive: true });
const report = { observedAt: new Date().toISOString(), sourceSha: process.env.RECOVERY_SOURCE_SHA || null,
  limitations: ['Local static server is not Cloudflare edge emulation.', 'Production probes are unauthenticated.',
    'Browser non-GET/HEAD requests are blocked; forms/chat/database writes are not tested.',
    'Chromium only; this is not exhaustive functional, accessibility, or security coverage.'],
  http: [], pages: [], localFailures: [], liveFailures: [] };
const hash = data => createHash('sha256').update(data).digest('hex');
const safeUrl = value => { try { const u = new URL(value); return u.origin + u.pathname; } catch { return String(value).slice(0, 100); } };
const routes = ['/', '/projects/', '/contact/', '/pricing/', '/assessment/', '/solar-carport/phitsanulok/', '/home-solution/'];
const remoteImage = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663541525436/DfaBNh7LYBahFVi2JKfAUv/carport-wide-1_30e3af4c.jpeg';
async function probe(url, group) {
  const record = { url: safeUrl(url), group };
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(12000), redirect: 'follow' });
    const bytes = Buffer.from(await response.arrayBuffer());
    record.status = response.status; record.finalUrl = safeUrl(response.url);
    record.bytes = bytes.length; record.sha256 = hash(bytes);
    record.headers = Object.fromEntries(['content-type','cache-control','cf-cache-status','cf-ray','server','content-security-policy','cf-mitigated']
      .map(k => [k, response.headers.get(k)]).filter(([,v]) => v));
    const text = bytes.toString('utf8');
    record.html = /^\s*(?:<!doctype html|<html)/i.test(text);
    if (group === 'api') record.json = (() => { try { JSON.parse(text); return true; } catch { return false; } })();
    if (record.html) record.title = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.slice(0,200) || null;
    return { record, text };
  } catch (error) { record.error = String(error.message).slice(0,200); return { record }; }
}
async function parallel(items, worker, concurrency=3) {
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) { const item = items[cursor++]; await worker(item); }
  }));
}
const home = await probe('https://www.sirinx.co/', 'live-page'); report.http.push(home.record);
const urls = routes.slice(1).map(route => ['https://www.sirinx.co'+route, 'live-page']);
for (const value of [remoteImage, 'https://www.sirinx.co/assets/optimized/solar-carport-hero-960.jpg',
  'https://www.sirinx.co/cdn-cgi/image/width=960,quality=76,format=auto,fit=scale-down/'+remoteImage]) urls.push([value,'image']);
urls.push(['https://www.sirinx.co/api/trpc/auth.me?batch=1','api']);
const initialAssets = [...new Set(Array.from((home.text || '').matchAll(/(?:src|href)=["'](\/assets\/[^"']+\.(?:js|css))["']/g), m => m[1]))].slice(0,12);
for (const asset of initialAssets) urls.push(['https://www.sirinx.co'+asset, 'initial-asset']);
await parallel(urls, async ([url,group]) => report.http.push((await probe(url,group)).record));
for (const item of report.http) {
  if (item.error || item.status >= 400 || (['image','initial-asset','api'].includes(item.group) && item.html)) report.liveFailures.push(item.url);
}
console.log('SIRINX_HTTP_AUDIT '+JSON.stringify(report.http));

const headerLines = fs.readFileSync(path.join(dist, '_headers'), 'utf8').split(/\r?\n/);
const commonHeaders = {}; let headerScope = '';
for (const line of headerLines) {
  if (!line.trim() || line.trim().startsWith('#')) continue;
  if (!/^\s/.test(line)) { headerScope = line.trim(); continue; }
  const colon = line.indexOf(':');
  if (headerScope === '/*' && colon > 0) commonHeaders[line.slice(0,colon).trim()] = line.slice(colon+1).trim();
}
// Serve only the compiled public directory. A missing backend returns a real 503, not fake success.
const mime = { '.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json',
  '.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.avif':'image/avif','.svg':'image/svg+xml','.ico':'image/x-icon',
  '.webp':'image/webp','.xml':'application/xml','.woff2':'font/woff2' };
const server = http.createServer((req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
    if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    if (pathname.startsWith('/api/')) { res.writeHead(503,{'Content-Type':'application/json'}); res.end('{"error":"BACKEND_NOT_IN_STATIC_AUDIT"}'); return; }
    let file = path.resolve(dist, '.'+pathname);
    if (file !== dist && !file.startsWith(dist+path.sep)) { res.writeHead(403); res.end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file=path.join(file,'index.html');
    if (!fs.existsSync(file)) {
      if (pathname.startsWith('/assets/')) { res.writeHead(404); res.end(); return; }
      file=path.join(dist,'index.html');
    }
    res.writeHead(200,{...commonHeaders,'Content-Type':mime[path.extname(file)]||'application/octet-stream'});
    if (req.method === 'HEAD') res.end(); else fs.createReadStream(file).pipe(res);
  } catch { res.writeHead(500); res.end(); }
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const localOrigin='http://127.0.0.1:'+server.address().port;
let browser;
try {
  const require = createRequire(path.join(process.env.RECOVERY_TOOLS_NODE_MODULES, 'playwright/package.json'));
  const { chromium } = require('playwright'); browser = await chromium.launch({headless:true});
  for (const [environment,origin] of [['local',localOrigin],['live','https://www.sirinx.co']]) {
    for (const [device,viewport] of [['desktop',{width:1365,height:900}],['mobile',{width:390,height:844}]]) {
      const context=await browser.newContext({viewport, serviceWorkers:'block'});
      await context.route('**/*', route => ['GET','HEAD'].includes(route.request().method()) ? route.continue() : route.abort('blockedbyclient'));
      for (const route of routes) {
        const page=await context.newPage(); const row={environment,device,route,errors:[],badResponses:[],blockedWrites:0};
        page.on('pageerror',error=>row.errors.push(String(error.message).slice(0,240)));
        page.on('request',request=>{if(!['GET','HEAD'].includes(request.method())) row.blockedWrites++;});
        page.on('response',response=>{
          if (response.status()>=400 && !response.url().includes('/api/')) row.badResponses.push({url:safeUrl(response.url()),status:response.status()});
          const type=response.request().resourceType();
          if (['script','stylesheet','image'].includes(type) && (response.headers()['content-type']||'').includes('text/html')) row.badResponses.push({url:safeUrl(response.url()),problem:'HTML_FOR_'+type});
        });
        try {
          const navigation=await page.goto(origin+route,{waitUntil:'domcontentloaded',timeout:18000}); row.status=navigation?.status();
          await page.waitForTimeout(1400);
          for (let i=0;i<4;i++) { await page.evaluate(index=>window.scrollTo(0,index*window.innerHeight),i); await page.waitForTimeout(350); }
          await page.evaluate(()=>window.scrollTo(0,0));
          const snapshot=await page.evaluate(()=>({title:document.title,h1:Array.from(document.querySelectorAll('h1')).map(n=>n.textContent?.trim()),
            rootTextLength:document.querySelector('#root')?.textContent?.length||0,
            staticShell:!!document.querySelector('[data-sirinx-static-shell]'),
            horizontalOverflow:document.documentElement.scrollWidth>innerWidth+2,
            images:Array.from(document.images).filter(i=>!!i.currentSrc).map(i=>({src:i.currentSrc,loaded:i.complete&&i.naturalWidth>0,broken:i.complete&&i.naturalWidth===0}))}));
          row.title=snapshot.title;row.h1=snapshot.h1;row.rootTextLength=snapshot.rootTextLength;row.staticShell=snapshot.staticShell;row.horizontalOverflow=snapshot.horizontalOverflow;
          row.images={total:snapshot.images.length,loaded:snapshot.images.filter(i=>i.loaded).length,broken:snapshot.images.filter(i=>i.broken).map(i=>safeUrl(i.src))};
          row.renderOk=row.status===200&&row.rootTextLength>300&&!row.staticShell&&row.h1.length>0&&row.errors.length===0;
          row.assetsOk=row.images.broken.length===0&&row.badResponses.length===0;
          row.ok=row.renderOk&&row.assetsOk;
          if (route==='/'||route==='/projects/') {
            row.screenshot=`${environment}-${device}-${route==='/'?'home':'projects'}.png`;
            await page.screenshot({path:path.join(output,row.screenshot),fullPage:false,timeout:10000});
          }
        } catch(error) { row.error=String(error.message).slice(0,240);row.ok=false; }
        if (!row.ok) report[environment==='local'?'localFailures':'liveFailures'].push(`${device}:${route}`);
        report.pages.push(row);console.log('SIRINX_BROWSER_PAGE '+JSON.stringify(row));await page.close();
      }
      await context.close();
    }
  }
} catch(error) { report.localFailures.push(String(error.message)); }
finally {
  if (browser) await browser.close(); await new Promise(resolve=>server.close(resolve));
  report.finishedAt=new Date().toISOString(); report.productionReady=false;
  fs.writeFileSync(path.join(output,'browser-audit.json'),JSON.stringify(report,null,2));
  console.log('SIRINX_BROWSER_SUMMARY '+JSON.stringify({localFailures:report.localFailures,liveFailures:report.liveFailures,pages:report.pages.length,productionReady:false}));
}
if (report.localFailures.length) process.exitCode=1;
