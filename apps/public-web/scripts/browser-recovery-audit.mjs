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
  http: [], pages: [], portfolioChecks: [], localFailures: [], liveFailures: [] };
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
  '.webp':'image/webp','.mp4':'video/mp4','.xml':'application/xml','.woff2':'font/woff2' };
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
    const size=fs.statSync(file).size;
    const headers={...commonHeaders,'Content-Type':mime[path.extname(file)]||'application/octet-stream','Accept-Ranges':'bytes'};
    // Native video metadata/playback must exercise the compiled MP4, including byte-range requests.
    if (req.headers.range) {
      const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      let start=0,end=size-1;
      if (match?.[1]) { start=Number(match[1]); if(match[2]) end=Math.min(Number(match[2]),size-1); }
      else if (match?.[2]) start=Math.max(0,size-Number(match[2]));
      if (!match || (!match[1]&&!match[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start<0 || start>end || start>=size) {
        res.writeHead(416,{...headers,'Content-Range':`bytes */${size}`});res.end();return;
      }
      res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});
      if(req.method==='HEAD')res.end();else fs.createReadStream(file,{start,end}).pipe(res);
      return;
    }
    res.writeHead(200,{...headers,'Content-Length':size});
    if (req.method === 'HEAD') res.end(); else fs.createReadStream(file).pipe(res);
  } catch { res.writeHead(500); res.end(); }
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const localOrigin='http://127.0.0.1:'+server.address().port;

// Compiled portfolio regression gates. DOM classes and native semantics are tested, not source text.
async function auditPortfolio(page, device) {
  const result={environment:'local',device,route:'/projects/',gates:[],ok:false};
  const expected=[['ruean-phae-royal-park',11],['holatel',10],['suphalai-residence',6]];
  const check=(condition,message)=>{if(!condition)throw new Error(message);};
  const gate=async(name,run)=>{
    try { const evidence=await run();result.gates.push({name,ok:true,...evidence});return true; }
    catch(error) { result.gates.push({name,ok:false,error:String(error.message).slice(0,300)});return false; }
  };
  const rendered=await gate('three-projects-and-27-photos',async()=>{
    await page.locator('.confirmed-portfolio .cp-project[data-project]').first().waitFor({state:'visible',timeout:8000});
    const sections=await page.locator('.cp-project[data-project]').evaluateAll(nodes=>nodes.map(node=>({
      id:node.dataset.project,photos:node.querySelectorAll('.cp-gallery img').length,
      heading:node.querySelector('h2')?.textContent?.trim(),labelledBy:node.getAttribute('aria-labelledby'),
    })));
    check(JSON.stringify(sections.map(({id,photos})=>[id,photos]))===JSON.stringify(expected),'Expected Royal Park 11, Holatel 10 and residence 6 photos in three sections');
    check(sections.every(section=>section.heading&&section.labelledBy),'Project sections must have labelled headings');
    check(await page.locator('.cp-gallery img').count()===27,'Expected exactly 27 gallery images');
    return {sections,photoCount:27};
  });
  if (!rendered) { result.skipped=['hero-clear-of-header','all-gallery-images','project-filters','lightbox','native-video','horizontal-overflow'];return result; }

  await gate('hero-clear-of-header',async()=>{
    await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
    await page.waitForFunction(()=>window.scrollY===0,null,{timeout:3000});
    const layout=await page.evaluate(()=>{
      const measure=selector=>{
        const node=document.querySelector(selector);
        if(!node)return null;
        const rect=node.getBoundingClientRect();const style=getComputedStyle(node);
        return {top:rect.top,bottom:rect.bottom,left:rect.left,right:rect.right,width:rect.width,height:rect.height,
          position:style.position,visible:rect.width>0&&rect.height>0&&style.display!=='none'&&style.visibility==='visible'&&Number(style.opacity)>0};
      };
      return {scrollY,viewportWidth:innerWidth,viewportHeight:innerHeight,
        header:measure('nav.fixed'),eyebrow:measure('.cp-hero .cp-eyebrow'),heading:measure('.cp-hero h1'),image:measure('.cp-hero-image img')};
    });
    // Retain numeric geometry even if the overlap assertion fails.
    result.heroLayout=layout;
    check(layout.header?.visible&&layout.header.position==='fixed','Expected the fixed Navbar from Layout');
    for(const [name,rect] of [['eyebrow',layout.eyebrow],['heading',layout.heading],['image',layout.image]]) {
      check(rect?.visible,`Hero ${name} must be visible`);
      check(rect.top>=layout.header.bottom-0.5,`Hero ${name} must begin below the fixed Navbar`);
      if(name!=='image')check(rect.top<layout.viewportHeight,`Hero ${name} must begin inside the first viewport`);
    }
    return layout;
  });

  await gate('all-gallery-images',async()=>{
    const images=page.locator('.cp-gallery img');
    const loaded=[];
    for(let index=0;index<await images.count();index++) {
      const image=images.nth(index);
      await image.scrollIntoViewIfNeeded({timeout:5000});
      const handle=await image.elementHandle();
      try { await page.waitForFunction(node=>node.complete&&node.naturalWidth>0,handle,{timeout:8000}); }
      finally { await handle.dispose(); }
      const evidence=await image.evaluate(node=>({src:node.currentSrc||node.src,complete:node.complete,
        naturalWidth:node.naturalWidth,naturalHeight:node.naturalHeight,alt:node.alt}));
      evidence.src=safeUrl(evidence.src);
      loaded.push(evidence);
    }
    check(loaded.length===27&&loaded.every(image=>image.complete&&image.naturalWidth>0&&image.naturalHeight>0&&image.alt.trim()),'Every gallery image must finish loading with nonzero natural dimensions and alt text');
    return {count:loaded.length,images:loaded};
  });

  await gate('project-filters',async()=>{
    const filters=page.locator('.cp-filters[role="group"] button');
    check(await filters.count()===4,'Expected All plus three project filter buttons');
    const selections=[];
    try {
      for(let index=0;index<expected.length;index++) {
        const button=filters.nth(index+1);
        await button.click();
        await page.waitForFunction(({id,count})=>{
          const sections=document.querySelectorAll('.cp-project[data-project]');
          return sections.length===1&&sections[0].getAttribute('data-project')===id&&document.querySelectorAll('.cp-gallery img').length===count;
        },{id:expected[index][0],count:expected[index][1]},{timeout:5000});
        check(await button.getAttribute('aria-pressed')==='true','Selected filter must expose aria-pressed=true');
        check(await page.locator('.cp-filters button[aria-pressed="true"]').count()===1,'Only one filter may be selected');
        selections.push({project:expected[index][0],visiblePhotos:expected[index][1]});
      }
    } finally { await filters.first().click(); }
    await page.waitForFunction(()=>document.querySelectorAll('.cp-project[data-project]').length===3&&document.querySelectorAll('.cp-gallery img').length===27,null,{timeout:5000});
    check(await filters.first().getAttribute('aria-pressed')==='true','All filter must restore selected state');
    return {selections,allRestored:true};
  });

  await gate('lightbox',async()=>{
    const trigger=page.locator('.cp-project[data-project="ruean-phae-royal-park"] .cp-gallery button').first();
    const triggerHandle=await trigger.elementHandle();
    const beforeOverflow=await page.evaluate(()=>document.body.style.overflow);
    const dialog=page.locator('dialog.cp-dialog');
    let firstSource;
    let nextSource;
    try {
      await trigger.click();
      await page.locator('dialog.cp-dialog[open]').waitFor({state:'visible',timeout:5000});
      check(await dialog.evaluate(node=>node.contains(document.activeElement)),'Focus must enter the native lightbox dialog');
      firstSource=await dialog.locator('img').getAttribute('src');
      check(Boolean(firstSource),'Lightbox must contain the selected photo');
      await page.waitForFunction(()=>{const image=document.querySelector('dialog.cp-dialog img');return image?.complete&&image.naturalWidth>0;},null,{timeout:8000});
      check((await dialog.locator('.cp-dialog-controls [aria-live]').textContent())?.trim()==='1 / 11','Initial lightbox counter must be 1 / 11');
      await dialog.locator('.cp-dialog-controls button').last().click();
      await page.waitForFunction(src=>document.querySelector('dialog.cp-dialog img')?.getAttribute('src')!==src,firstSource,{timeout:5000});
      nextSource=await dialog.locator('img').getAttribute('src');
      await page.waitForFunction(()=>{const image=document.querySelector('dialog.cp-dialog img');return image?.complete&&image.naturalWidth>0;},null,{timeout:8000});
      check((await dialog.locator('.cp-dialog-controls [aria-live]').textContent())?.trim()==='2 / 11','Next button must advance the lightbox counter');
      await page.keyboard.press('ArrowLeft');
      await page.waitForFunction(src=>document.querySelector('dialog.cp-dialog img')?.getAttribute('src')===src,firstSource,{timeout:5000});
      check((await dialog.locator('.cp-dialog-controls [aria-live]').textContent())?.trim()==='1 / 11','ArrowLeft must return to the first photo');
      await page.keyboard.press('Escape');
      await page.waitForFunction(()=>!document.querySelector('dialog.cp-dialog')?.open,null,{timeout:5000});
      await page.waitForFunction(node=>document.activeElement===node,triggerHandle,{timeout:5000});
      check(await page.evaluate(()=>document.body.style.overflow)===beforeOverflow,'Closing lightbox must restore body scrolling');
      return {opened:true,photosDecoded:true,nextSourceChanged:firstSource!==nextSource,arrowNavigation:true,escapeClosed:true,focusRestored:true};
    } finally {
      if(await dialog.evaluate(node=>node.open))await page.keyboard.press('Escape');
      await triggerHandle.dispose();
    }
  });

  await gate('native-video',async()=>{
    const video=page.locator('.cp-project[data-project="suphalai-residence"] .cp-video video');
    check(await page.locator('.cp-project .cp-video video').count()===1,'Expected one confirmed residential video');
    await video.scrollIntoViewIfNeeded({timeout:5000});
    const handle=await video.elementHandle();
    try {
      await page.waitForFunction(node=>node.readyState>=1&&Number.isFinite(node.duration),handle,{timeout:12000});
      const metadata=await video.evaluate(node=>({duration:node.duration,width:node.videoWidth,height:node.videoHeight,
        controls:node.controls,playsInline:node.playsInline,autoplay:node.autoplay,paused:node.paused,
        preload:node.preload,src:node.currentSrc,poster:node.poster}));
      metadata.src=safeUrl(metadata.src);metadata.poster=safeUrl(metadata.poster);
      check(metadata.controls&&metadata.playsInline&&!metadata.autoplay&&metadata.paused,'Video must use native controls, playsInline and no unsolicited autoplay');
      check(metadata.preload==='metadata','Video must preload metadata only');
      check(Math.abs(metadata.duration-43.11)<0.5,'Residential source duration must remain about 43.11 seconds');
      check(metadata.width===960&&metadata.height===540,'Residential video must retain its 960 x 540 native dimensions');
      const startTime=await video.evaluate(async node=>{
        node.muted=true;
        await Promise.race([node.play(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Muted playback start timed out')),8000))]);
        return node.currentTime;
      });
      await page.waitForFunction(({node,start})=>node.currentTime>start+0.2,{node:handle,start:startTime},{timeout:6000});
      const playback=await video.evaluate(node=>({currentTime:node.currentTime,muted:node.muted,paused:node.paused}));
      check(playback.muted&&!playback.paused&&playback.currentTime>startTime+0.2,'Muted native playback must advance');
      return {metadata,mutedByAudit:true,startTime,endTime:playback.currentTime,playbackAdvanced:true};
    } finally { await video.evaluate(node=>node.pause());await handle.dispose(); }
  });

  await gate('horizontal-overflow',async()=>{
    await page.evaluate(()=>window.scrollTo(0,0));
    const layout=await page.evaluate(()=>({viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,
      bodyWidth:document.body.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth+2}));
    check(!layout.overflow,'Portfolio must not overflow horizontally');
    return layout;
  });
  result.ok=result.gates.every(item=>item.ok);
  return result;
}

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
          if(environment==='local'&&route==='/projects/') {
            const portfolio=await auditPortfolio(page,device);
            report.portfolioChecks.push(portfolio);row.portfolioOk=portfolio.ok;
            // Keep original render/assets requirements; interaction errors and overflow are additive gates.
            row.ok=row.ok&&portfolio.ok&&!row.horizontalOverflow&&row.errors.length===0&&row.badResponses.length===0;
            console.log('SIRINX_PORTFOLIO_CHECKS '+JSON.stringify(portfolio));
          }
          if (route==='/'||route==='/projects/') {
            if(environment==='local'&&route==='/projects/') {
              await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:'instant'}));
              await page.waitForFunction(()=>window.scrollY===0,null,{timeout:3000});
            }
            row.screenshotScrollY=await page.evaluate(()=>window.scrollY);
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
  console.log('SIRINX_PORTFOLIO_SUMMARY '+JSON.stringify({checks:report.portfolioChecks.map(item=>({device:item.device,ok:item.ok,gates:item.gates.map(gate=>({name:gate.name,ok:gate.ok}))})),productionReady:false}));
}
if (report.localFailures.length) process.exitCode=1;
