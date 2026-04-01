export const uiPage = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Async Email Control Room</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root{--bg:#f5eee3;--panel:rgba(255,251,246,.82);--line:rgba(87,70,50,.12);--text:#231f1a;--muted:#6c6258;--brand:#d86d3d;--brand2:#127a6d;--ok:#1f7a49;--warn:#a86a13;--bad:#b13a3a;--shadow:0 18px 50px rgba(82,58,40,.12)}
    *{box-sizing:border-box}body{margin:0;font-family:'Manrope',sans-serif;color:var(--text);background:
      radial-gradient(circle at top left,rgba(216,109,61,.22),transparent 28%),
      radial-gradient(circle at top right,rgba(18,122,109,.18),transparent 26%),
      linear-gradient(180deg,#faf4ec 0,#f2e7d8 100%)}
    .wrap{width:min(1360px,calc(100% - 24px));margin:18px auto 28px;display:grid;gap:16px}
    .hero,.panel{background:var(--panel);border:1px solid var(--line);border-radius:24px;box-shadow:var(--shadow);backdrop-filter:blur(16px)}
    .hero{padding:24px}.heroTop,.head,.row,.itemTop{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}
    .eyebrow,.chip,.badge{display:inline-flex;align-items:center;border-radius:999px;font-weight:800}
    .eyebrow{padding:8px 12px;background:rgba(216,109,61,.12);color:#9b401c;font-size:12px;letter-spacing:.11em;text-transform:uppercase}
    h1,h2,h3{font-family:'Space Grotesk',sans-serif;margin:0}h1{font-size:clamp(32px,4vw,54px);line-height:.95;max-width:11ch;margin-top:12px}
    p,.meta,small{color:var(--muted)}p{line-height:1.65}.chip{padding:10px 14px;background:rgba(177,58,58,.12);color:var(--bad);font-size:13px}
    .stats,.grid,.details{display:grid;gap:16px}.stats{grid-template-columns:repeat(6,1fr)}.grid{grid-template-columns:1.05fr .95fr}.details{grid-template-columns:.92fr 1.08fr}
    .stat,.card,.item,.log,.timelineItem{background:rgba(255,255,255,.65);border:1px solid rgba(87,70,50,.08);border-radius:18px}
    .stat{padding:16px}.stat span,.labelMini span{display:block;font-size:12px;color:var(--muted);margin-bottom:8px}.stat strong{font-size:30px;font-family:'Space Grotesk',sans-serif}
    .panel{padding:22px}.head p{margin:6px 0 0;font-size:14px}.stack{display:grid;gap:12px}.two{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
    label{display:grid;gap:6px;font-size:13px;font-weight:700;color:var(--muted)}input,textarea{width:100%;border:1px solid rgba(87,70,50,.14);border-radius:14px;padding:13px 14px;font:inherit;background:rgba(255,255,255,.88);color:var(--text)}
    textarea{min-height:140px;resize:vertical}input:focus,textarea:focus{outline:none;border-color:rgba(216,109,61,.7);box-shadow:0 0 0 4px rgba(216,109,61,.12)}
    .check{display:flex;align-items:center;gap:10px;color:var(--text)}.check input{width:18px;height:18px}.actions{display:flex;gap:10px;flex-wrap:wrap}
    button{border:none;border-radius:16px;padding:13px 16px;font:inherit;font-weight:800;cursor:pointer}.primary{background:linear-gradient(135deg,var(--brand),#ee9a5d);color:#fff}.secondary{background:rgba(255,255,255,.78);color:var(--text);border:1px solid rgba(87,70,50,.12)}
    .toast{display:none;padding:12px 14px;border-radius:16px;font-weight:700}.toast.show{display:block}.toast.ok{background:rgba(31,122,73,.12);color:var(--ok)}.toast.err{background:rgba(177,58,58,.12);color:var(--bad)}
    .hint{font-size:13px;color:var(--muted)}.state,.list,.logs,.timeline{display:grid;gap:10px}.list,.logs,.timeline{max-height:560px;overflow:auto;padding-right:4px}
    .item,.log,.timelineItem,.state{padding:15px}.item{cursor:pointer;transition:.18s transform,.18s border-color}.item:hover,.item.active{transform:translateY(-1px);border-color:rgba(216,109,61,.35);background:rgba(255,250,245,.92)}
    .badge{padding:7px 10px;font-size:12px;text-transform:capitalize}.queued{background:rgba(216,109,61,.12);color:#9b401c}.processing{background:rgba(54,100,198,.12);color:#2c55b9}.retry_scheduled,.warn{background:rgba(168,106,19,.14);color:var(--warn)}.succeeded,.info{background:rgba(31,122,73,.12);color:var(--ok)}.failed,.error{background:rgba(177,58,58,.12);color:var(--bad)}
    .metaGrid,.mini{display:grid;grid-template-columns:repeat(2,1fr);gap:10px 12px;margin-top:12px}.labelMini strong,.mono{word-break:break-word}.mono{font-family:Consolas,monospace}
    .empty{padding:22px;border:1px dashed rgba(87,70,50,.18);border-radius:18px;text-align:center;color:var(--muted)}
    @media (max-width:1100px){.stats,.grid,.details{grid-template-columns:1fr}}@media (max-width:720px){.wrap{width:min(100% - 14px,100%);margin:12px auto 18px}.hero,.panel{padding:18px;border-radius:18px}.two,.metaGrid,.mini,.stats{grid-template-columns:1fr}}
  </style>
</head>
<body>
<main class="wrap">
  <section class="hero">
    <div class="heroTop">
      <div>
        <div class="eyebrow">Async Email Control Room</div>
        <h1>Dynamic SMTP, async email jobs, live history.</h1>
        <p>SMTP config set করুন, real test email queue করুন, retry observe করুন, আর per-job history ও structured logs inspect করুন.</p>
      </div>
      <div class="chip" id="cfgChip">SMTP not configured</div>
    </div>
    <div class="stats">
      <div class="stat"><span>Total</span><strong id="sTotal">0</strong></div>
      <div class="stat"><span>Queued</span><strong id="sQueued">0</strong></div>
      <div class="stat"><span>Processing</span><strong id="sProcessing">0</strong></div>
      <div class="stat"><span>Retrying</span><strong id="sRetry">0</strong></div>
      <div class="stat"><span>Succeeded</span><strong id="sSuccess">0</strong></div>
      <div class="stat"><span>Failed</span><strong id="sFailed">0</strong></div>
    </div>
  </section>

  <section class="grid">
    <section class="panel">
      <div class="head"><div><h2>SMTP Configuration</h2><p>Dynamic SMTP save/update/test.</p></div></div>
      <div id="smtpToast" class="toast"></div>
      <form id="smtpForm" class="stack">
        <div class="two">
          <label>Host<input name="host" placeholder="smtp.gmail.com" required></label>
          <label>Port<input name="port" type="number" min="1" max="65535" placeholder="587" required></label>
        </div>
        <div class="two">
          <label>Username<input name="username" placeholder="smtp-user"></label>
          <label>Password<input name="password" type="password" placeholder="smtp-password"></label>
        </div>
        <div class="two">
          <label>From Email<input name="fromEmail" type="email" placeholder="noreply@example.com" required></label>
          <label>From Name<input name="fromName" placeholder="Delivery Bot"></label>
        </div>
        <label class="check"><input name="secure" type="checkbox">Use secure SMTP</label>
        <div class="actions">
          <button class="primary" type="submit" id="saveSmtp">Save SMTP</button>
          <button class="secondary" type="button" id="testSmtp">Test Connection</button>
        </div>
      </form>
      <div id="smtpState" class="state"></div>
    </section>

    <section class="panel">
      <div class="head"><div><h2>Send Test Email</h2><p>Simple recipient, subject and body. Optional failure simulation remains available for demo.</p></div></div>
      <div id="mailToast" class="toast"></div>
      <form id="mailForm" class="stack">
        <label>Recipient<input name="to" type="email" placeholder="new-email@example.com" required></label>
        <label>Subject<input name="subject" placeholder="Test subject" required></label>
        <label>Body<textarea name="body" placeholder="Write your message..." required></textarea></label>
        <div class="two">
          <label>Simulated Fail Attempts<input name="failAttempts" type="number" min="0" max="10" placeholder="0"></label>
          <label>Processing Delay (ms)<input name="processingDelayMs" type="number" min="0" max="30000" placeholder="0"></label>
        </div>
        <div class="hint">Simulation inputs optional. এগুলো retry flow দেখাতে useful.</div>
        <div class="actions">
          <button class="primary" type="submit" id="queueMail">Queue Email Job</button>
          <button class="secondary" type="button" id="refreshBtn">Refresh</button>
        </div>
      </form>
    </section>
  </section>

  <section class="details">
    <section class="panel">
      <div class="head"><div><h2>Job History</h2><p>Newest first.</p></div><div class="meta" id="jobCount">0 jobs</div></div>
      <div id="jobList" class="list"><div class="empty">No jobs yet.</div></div>
    </section>

    <section class="panel">
      <div class="head"><div><h2>Selected Job</h2><p>Track lifecycle, SMTP snapshot and related logs.</p></div></div>
      <div id="jobDetail" class="empty">Select a job to inspect details.</div>
      <div class="stack" style="margin-top:14px;">
        <div><h3 style="margin-bottom:10px;">Timeline</h3><div id="timeline" class="timeline"><div class="empty">Timeline will appear here.</div></div></div>
        <div><h3 style="margin-bottom:10px;">Job Logs</h3><div id="jobLogs" class="logs"><div class="empty">Related logs will appear here.</div></div></div>
      </div>
    </section>
  </section>

  <section class="panel">
    <div class="head"><div><h2>Recent Platform Logs</h2><p>SMTP updates, queue events, retries and failures.</p></div></div>
    <div id="allLogs" class="logs"><div class="empty">No logs yet.</div></div>
  </section>
</main>

<script>
const state={smtp:null,summary:null,jobs:[],logs:[],selectedJobId:null};
const el=id=>document.getElementById(id);
const E={smtpForm:el('smtpForm'),mailForm:el('mailForm'),smtpToast:el('smtpToast'),mailToast:el('mailToast'),saveSmtp:el('saveSmtp'),testSmtp:el('testSmtp'),queueMail:el('queueMail'),refreshBtn:el('refreshBtn')};
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const fmt=v=>v?new Date(v).toLocaleString():'N/A';
const toast=(node,kind,msg)=>{node.className='toast show '+kind;node.textContent=msg;setTimeout(()=>{node.className='toast';node.textContent='';},3200);};
const loading=(btn,flag,label)=>{btn.disabled=flag;btn.textContent=flag?'Working...':label;};
const badge=s=>'<span class="badge '+s+'">'+esc(String(s).replaceAll('_',' '))+'</span>';
async function api(path,opt={}){const res=await fetch(path,{headers:{'Content-Type':'application/json',...(opt.headers||{})},...opt});if(!res.ok){let m='Request failed';try{const b=await res.json();m=Array.isArray(b.message)?b.message.join(', '):(b.message||m);}catch{}throw new Error(m);}return res.status===204?null:res.json();}
function renderSummary(){const s=state.summary||{total:0,queued:0,processing:0,retryScheduled:0,succeeded:0,failed:0};el('sTotal').textContent=s.total;el('sQueued').textContent=s.queued;el('sProcessing').textContent=s.processing;el('sRetry').textContent=s.retryScheduled;el('sSuccess').textContent=s.succeeded;el('sFailed').textContent=s.failed;}
function hydrateSmtp(){const s=state.smtp;if(!s||!s.isConfigured)return;E.smtpForm.host.value=s.host||'';E.smtpForm.port.value=s.port||'';E.smtpForm.secure.checked=!!s.secure;E.smtpForm.username.value=s.username||'';E.smtpForm.password.value='';E.smtpForm.fromEmail.value=s.fromEmail||'';E.smtpForm.fromName.value=s.fromName||'';}
function renderSmtp(){const s=state.smtp;if(!s||!s.isConfigured){el('cfgChip').textContent='SMTP not configured';el('cfgChip').style.background='rgba(177,58,58,.12)';el('cfgChip').style.color='var(--bad)';el('smtpState').innerHTML='<strong>Current state</strong><p class="meta">No SMTP config saved yet.</p>';return;}el('cfgChip').textContent='SMTP ready';el('cfgChip').style.background='rgba(18,122,109,.12)';el('cfgChip').style.color='var(--brand2)';el('smtpState').innerHTML='<strong>Current state</strong><div class="metaGrid"><div class="labelMini"><span>Host</span><strong>'+esc(s.host)+'</strong></div><div class="labelMini"><span>Port</span><strong>'+esc(s.port)+'</strong></div><div class="labelMini"><span>Secure</span><strong>'+esc(s.secure?'Yes':'No')+'</strong></div><div class="labelMini"><span>Username</span><strong>'+esc(s.username||'None')+'</strong></div><div class="labelMini"><span>From</span><strong>'+esc(s.fromEmail)+'</strong></div><div class="labelMini"><span>Updated</span><strong>'+esc(fmt(s.updatedAt))+'</strong></div></div>';}
function renderJobs(){el('jobCount').textContent=state.jobs.length+' jobs';if(!state.jobs.length){el('jobList').innerHTML='<div class="empty">No jobs yet.</div>';return;}el('jobList').innerHTML=state.jobs.map(j=>'<article class="item'+(state.selectedJobId===j.id?' active':'')+'" data-id="'+j.id+'"><div class="itemTop"><div><h3>'+esc(j.payload.subject)+'</h3><small>'+esc(j.payload.to)+'</small></div>'+badge(j.status)+'</div><div class="metaGrid"><div class="labelMini"><span>Attempts</span><strong>'+esc(j.attemptsMade)+' / '+esc(j.maxAttempts)+'</strong></div><div class="labelMini"><span>Created</span><strong>'+esc(fmt(j.createdAt))+'</strong></div><div class="labelMini"><span>Next Run</span><strong>'+esc(fmt(j.nextRunAt))+'</strong></div><div class="labelMini"><span>Error</span><strong>'+esc(j.lastError||'None')+'</strong></div></div></article>').join('');document.querySelectorAll('[data-id]').forEach(n=>n.addEventListener('click',()=>{state.selectedJobId=n.getAttribute('data-id');renderJobs();renderSelected();}));}
function renderLog(entry){const fields=Object.entries(entry).filter(([k])=>!['id','timestamp','level','event'].includes(k)).map(([k,v])=>'<div class="labelMini"><span>'+esc(k)+'</span><strong class="'+((typeof v==='string'&&v.length>36)?'mono':'')+'">'+esc(typeof v==='object'?JSON.stringify(v):v)+'</strong></div>').join('');return '<article class="log"><div class="itemTop"><div><strong>'+esc(entry.event)+'</strong><small>'+esc(fmt(entry.timestamp))+'</small></div><span class="badge '+esc(entry.level)+'">'+esc(entry.level)+'</span></div><div class="metaGrid">'+fields+'</div></article>';}
function renderSelected(){const j=state.jobs.find(x=>x.id===state.selectedJobId)||(state.jobs[0]||null);if(!j){el('jobDetail').innerHTML='Select a job to inspect details.';el('timeline').innerHTML='<div class="empty">Timeline will appear here.</div>';el('jobLogs').innerHTML='<div class="empty">Related logs will appear here.</div>';return;}if(!state.selectedJobId)state.selectedJobId=j.id;el('jobDetail').innerHTML='<article class="item active" style="cursor:default"><div class="itemTop"><div><h3>'+esc(j.payload.subject)+'</h3><small>'+esc(j.payload.to)+'</small></div>'+badge(j.status)+'</div><p class="meta" style="margin:10px 0 0">'+esc(j.payload.body)+'</p><div class="mini"><div class="labelMini"><span>Job ID</span><strong class="mono">'+esc(j.id)+'</strong></div><div class="labelMini"><span>SMTP Host</span><strong>'+esc(j.payload.smtp.host)+'</strong></div><div class="labelMini"><span>Sender</span><strong>'+esc(j.payload.smtp.fromEmail)+'</strong></div><div class="labelMini"><span>Updated</span><strong>'+esc(fmt(j.updatedAt))+'</strong></div></div>'+(j.result?'<div class="metaGrid"><div class="labelMini"><span>Message ID</span><strong class="mono">'+esc(j.result.providerMessageId)+'</strong></div><div class="labelMini"><span>Accepted</span><strong>'+esc((j.result.accepted||[]).join(', ')||'None')+'</strong></div><div class="labelMini"><span>Rejected</span><strong>'+esc((j.result.rejected||[]).join(', ')||'None')+'</strong></div><div class="labelMini"><span>Response</span><strong>'+esc(j.result.response)+'</strong></div></div>':'')+'</article>';el('timeline').innerHTML=j.history?.length?j.history.slice().reverse().map(h=>'<article class="timelineItem"><div class="itemTop"><div><strong>'+esc(h.event)+'</strong><small>'+esc(fmt(h.timestamp))+'</small></div>'+badge(h.status)+'</div><p class="meta" style="margin:10px 0 0">'+esc(h.message)+'</p></article>').join(''):'<div class="empty">No timeline entries yet.</div>';const rel=state.logs.filter(l=>l.jobId===j.id);el('jobLogs').innerHTML=rel.length?rel.map(renderLog).join(''):'<div class="empty">No logs found for this job yet.</div>';}
function renderAllLogs(){el('allLogs').innerHTML=state.logs.length?state.logs.slice(0,20).map(renderLog).join(''):'<div class="empty">No logs yet.</div>';}
async function refresh(populate=true){const [smtp,summary,jobs,logs]=await Promise.all([api('/smtp-config'),api('/jobs/summary'),api('/jobs'),api('/logs')]);state.smtp=smtp;state.summary=summary;state.jobs=jobs;state.logs=logs;if(!state.selectedJobId&&jobs[0])state.selectedJobId=jobs[0].id;if(state.selectedJobId&&!jobs.some(j=>j.id===state.selectedJobId))state.selectedJobId=jobs[0]?jobs[0].id:null;renderSummary();renderSmtp();renderJobs();renderSelected();renderAllLogs();if(populate)hydrateSmtp();}
function smtpPayload(){return{host:E.smtpForm.host.value.trim(),port:Number(E.smtpForm.port.value),secure:E.smtpForm.secure.checked,username:E.smtpForm.username.value.trim()||undefined,password:E.smtpForm.password.value||undefined,fromEmail:E.smtpForm.fromEmail.value.trim(),fromName:E.smtpForm.fromName.value.trim()||undefined};}
E.smtpForm.addEventListener('submit',async e=>{e.preventDefault();loading(E.saveSmtp,true,'Save SMTP');try{await api('/smtp-config',{method:'PUT',body:JSON.stringify(smtpPayload())});toast(E.smtpToast,'ok','SMTP configuration saved.');await refresh();}catch(err){toast(E.smtpToast,'err',err.message)}finally{loading(E.saveSmtp,false,'Save SMTP');}});
E.testSmtp.addEventListener('click',async()=>{loading(E.testSmtp,true,'Test Connection');try{await api('/smtp-config/test',{method:'POST',body:JSON.stringify(smtpPayload())});toast(E.smtpToast,'ok','SMTP connection verified.');await refresh();}catch(err){toast(E.smtpToast,'err',err.message)}finally{loading(E.testSmtp,false,'Test Connection');}});
E.mailForm.addEventListener('submit',async e=>{e.preventDefault();loading(E.queueMail,true,'Queue Email Job');const payload={to:E.mailForm.to.value.trim(),subject:E.mailForm.subject.value.trim(),body:E.mailForm.body.value.trim()};const fail=E.mailForm.failAttempts.value,delay=E.mailForm.processingDelayMs.value;if(fail||delay){payload.simulate={};if(fail)payload.simulate.failAttempts=Number(fail);if(delay)payload.simulate.processingDelayMs=Number(delay);}try{const job=await api('/jobs/email',{method:'POST',body:JSON.stringify(payload)});toast(E.mailToast,'ok','Email job accepted into queue.');E.mailForm.subject.value='';E.mailForm.body.value='';E.mailForm.failAttempts.value='';E.mailForm.processingDelayMs.value='';state.selectedJobId=job.id;await refresh(false);}catch(err){toast(E.mailToast,'err',err.message)}finally{loading(E.queueMail,false,'Queue Email Job');}});
E.refreshBtn.addEventListener('click',()=>refresh(false).catch(err=>toast(E.mailToast,'err',err.message)));
refresh().catch(err=>toast(E.mailToast,'err',err.message));setInterval(()=>refresh(false).catch(()=>{}),3000);
</script>
</body>
</html>`;
