const {chromium}=require('playwright');
(async()=>{const [,, qs, out]=process.argv; const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1080,height:1920}});
p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('file://'+__dirname+'/capa.html?'+qs); await p.waitForSelector('body[data-pronto]'); await p.waitForTimeout(200);
await p.locator('#capa').screenshot({path:out, type:'jpeg', quality:92}); await b.close();})();
