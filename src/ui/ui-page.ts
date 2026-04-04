export const uiPage = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AsyTest Console</title>
  <style>
    :root{--bg:#f5f7fb;--panel:#fff;--line:#d8e0eb;--text:#17202a;--muted:#66707d;--brand:#1f6feb;--brand2:#0ea5a4;--warn:#c37b16;--danger:#d94b4b;--ok:#18865d;--shadow:0 20px 40px rgba(15,23,42,.08)}
    *{box-sizing:border-box}body{margin:0;font:14px/1.45 Arial,sans-serif;color:var(--text);background:linear-gradient(180deg,#eef4fb,#f8fafc)}
    .wrap{max-width:1380px;margin:0 auto;padding:20px}.hidden{display:none!important}
    .top{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;margin-bottom:18px}
    .hero{padding:22px;border:1px solid var(--line);border-radius:20px;background:var(--panel);box-shadow:var(--shadow);flex:1}
    .hero h1{margin:0 0 8px;font-size:30px}.hero p{margin:0;color:var(--muted)}
    .session{min-width:300px;padding:18px;border:1px solid var(--line);border-radius:20px;background:var(--panel);box-shadow:var(--shadow)}
    .grid{display:grid;grid-template-columns:1.1fr .9fr;gap:16px}.col{display:grid;gap:16px}
    .panel{padding:18px;border:1px solid var(--line);border-radius:18px;background:var(--panel);box-shadow:var(--shadow)}
    .panel h2{margin:0 0 8px;font-size:18px}.sub{color:var(--muted);margin:0 0 14px}
    .stats{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}.stat{padding:14px;border:1px solid var(--line);border-radius:16px;background:#fbfdff}.stat b{display:block;font-size:24px;margin-top:4px}
    .row{display:flex;gap:10px;flex-wrap:wrap}.field{display:grid;gap:6px;margin-bottom:12px}.field label{font-weight:700;color:#334155}.field input,.field textarea,.field select{width:100%;padding:11px 12px;border:1px solid var(--line);border-radius:12px;background:#fff}
    .two{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.three{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
    textarea{min-height:120px;resize:vertical}
    button{border:0;border-radius:12px;padding:11px 14px;cursor:pointer;font-weight:700}
    .primary{background:var(--brand);color:#fff}.secondary{background:#eef3ff;color:#1e3a8a}.ghost{background:#f4f7fb;color:#1f2937}.warn{background:#fff7ed;color:#9a5b0d}.danger{background:#fff1f1;color:#b42318}
    .badge{display:inline-flex;padding:5px 9px;border-radius:999px;font-size:12px;font-weight:700}.queued{background:#e6f0ff;color:#2457a6}.processing{background:#e7f7ff;color:#0b699b}.retry_scheduled{background:#fff7e9;color:#9a5b0d}.succeeded{background:#e8fbf1;color:#12704b}.failed{background:#fff0f0;color:#b42318}
    .toast{padding:12px 14px;border-radius:12px;margin-bottom:12px}.toast.ok{background:#ecfdf5;color:#166534}.toast.err{background:#fef2f2;color:#b91c1c}
    table{width:100%;border-collapse:collapse}th,td{padding:11px 10px;border-bottom:1px solid #e9eef5;text-align:left;vertical-align:top}th{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
    .actions{display:flex;gap:8px;flex-wrap:wrap}.small{padding:8px 10px;border-radius:10px;font-size:12px}.mono{font-family:Consolas,monospace;word-break:break-word}
    .actionCol{min-width:260px}
    .statusline{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .modalWrap{position:fixed;inset:0;background:rgba(15,23,42,.56);display:flex;align-items:center;justify-content:center;padding:20px;z-index:50}
    .modal{width:min(900px,100%);max-height:90vh;overflow:auto;padding:20px;border-radius:20px;background:#fff;box-shadow:var(--shadow)}
    .modalHead{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:16px}
    .card{padding:12px;border:1px solid var(--line);border-radius:14px;background:#fbfdff}
    .modeGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:12px}
    .modeCard{border:1px solid var(--line);border-radius:14px;background:#fbfdff;padding:14px;cursor:pointer}
    .modeCard.active{border-color:var(--brand);box-shadow:0 0 0 3px rgba(31,111,235,.12)}
    .modeCard input{margin-right:8px}
    .modeCard b{display:block;margin-bottom:6px}
    .actionHint{padding:10px 12px;background:#f8fbff;border:1px solid #dbe7ff;border-radius:12px;color:#31518d;margin-bottom:12px}
    .timeline{display:grid;gap:10px}.timeline .card{border-left:4px solid #bfdbfe}
    .kv{display:grid;grid-template-columns:180px 1fr;gap:8px 12px}.empty{padding:24px;text-align:center;color:var(--muted);border:1px dashed var(--line);border-radius:16px}
    .authGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
    @media(max-width:1100px){.grid,.stats,.authGrid,.two,.three{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <section class="hero">
        <h1>AsyTest Email Testing Console</h1>
        <p>Run real email delivery tests or simulated failure tests from a modal, then inspect history, error details, and logs from action buttons.</p>
      </section>
      <aside class="session">
        <div id="sessionBox">
          <div id="sessionLoggedOut">
            <b>Session</b>
            <p class="sub">Login or signup to open the testing console.</p>
          </div>
          <div id="sessionLoggedIn" class="hidden">
            <b id="sessionName">Authenticated</b>
            <p class="sub" id="sessionMeta"></p>
            <div class="row">
              <button class="ghost" id="refreshAllBtn" type="button">Refresh</button>
              <button class="danger" id="logoutBtn" type="button">Logout</button>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <section id="authPanel" class="panel">
      <h2>Access</h2>
      <p class="sub">Use signup for a new tenant admin or login with an existing account.</p>
      <div id="authToast" class="hidden"></div>
      <div class="authGrid">
        <form id="signupForm" class="card">
          <h3>Signup</h3>
          <div class="field"><label>Tenant Name</label><input name="tenantName" required /></div>
          <div class="field"><label>Full Name</label><input name="fullName" required /></div>
          <div class="field"><label>Email</label><input name="email" type="email" required /></div>
          <div class="field"><label>Password</label><input name="password" type="password" required /></div>
          <button class="primary" type="submit">Create Account</button>
        </form>
        <form id="verifyForm" class="card">
          <h3>Verify Signup OTP</h3>
          <div class="field"><label>Email</label><input name="email" type="email" required /></div>
          <div class="field"><label>OTP</label><input name="otp" required /></div>
          <button class="secondary" type="submit">Verify OTP</button>
        </form>
        <form id="loginForm" class="card">
          <h3>Login</h3>
          <div class="field"><label>Email</label><input name="email" type="email" required /></div>
          <div class="field"><label>Password</label><input name="password" type="password" required /></div>
          <button class="primary" type="submit">Login</button>
        </form>
      </div>
    </section>

    <section id="appPanel" class="hidden">
      <div class="panel" style="margin-bottom:16px;">
        <div class="row" style="justify-content:space-between;align-items:center">
          <div>
            <h2 style="margin-bottom:6px;">Testing Overview</h2>
            <p class="sub" style="margin:0">The history table below supports detail, error, and log modals for each email job.</p>
          </div>
          <button class="primary" id="openRunModalBtn" type="button">Run Email Testing</button>
        </div>
        <div class="stats" style="margin-top:14px">
          <div class="stat"><span>Total</span><b id="statTotal">0</b></div>
          <div class="stat"><span>Queued</span><b id="statQueued">0</b></div>
          <div class="stat"><span>Processing</span><b id="statProcessing">0</b></div>
          <div class="stat"><span>Retrying</span><b id="statRetry">0</b></div>
          <div class="stat"><span>Succeeded</span><b id="statSucceeded">0</b></div>
          <div class="stat"><span>Failed</span><b id="statFailed">0</b></div>
        </div>
      </div>

      <div class="grid">
        <div class="col">
          <section class="panel">
            <div class="row" style="justify-content:space-between;align-items:center">
              <div>
                <h2>Testing Email History</h2>
                <p class="sub">Each row has visible action buttons for full details, error details, and job logs.</p>
              </div>
            </div>
            <div id="historyToast" class="hidden"></div>
            <div class="actionHint"><b>Row Actions:</b> Details opens the full job modal, Error Details opens failure and retry information, and Logs shows job-specific logs.</div>
            <div id="historyWrap">
              <div class="empty">No testing history yet.</div>
            </div>
          </section>
        </div>
        <div class="col">
          <section class="panel">
            <h2>SMTP Configuration</h2>
            <p class="sub">Admin users can update SMTP and then run real delivery tests from the modal.</p>
            <div id="smtpReadonly" class="empty hidden">SMTP information is visible here. Only admins can update it.</div>
            <form id="smtpForm" class="hidden">
              <div class="two">
                <div class="field"><label>Host</label><input name="host" required /></div>
                <div class="field"><label>Port</label><input name="port" type="number" required /></div>
              </div>
              <div class="two">
                <div class="field"><label>Username</label><input name="username" /></div>
                <div class="field"><label>Password</label><input name="password" type="password" /></div>
              </div>
              <div class="two">
                <div class="field"><label>From Email</label><input name="fromEmail" type="email" required /></div>
                <div class="field"><label>From Name</label><input name="fromName" /></div>
              </div>
              <div class="field"><label><input id="smtpSecure" type="checkbox" /> Secure SMTP</label></div>
              <div class="row">
                <button class="primary" type="submit">Save SMTP</button>
                <button class="secondary" id="testSmtpBtn" type="button">Test SMTP</button>
              </div>
            </form>
            <div id="smtpSummary" class="card" style="margin-top:14px"></div>
          </section>
        </div>
      </div>
    </section>
  </div>

  <div id="runModalWrap" class="modalWrap hidden">
    <div class="modal">
      <div class="modalHead">
        <div>
          <h2 style="margin:0">Run Email Testing</h2>
          <p class="sub" style="margin:6px 0 0">Choose between real delivery and simulated failure testing.</p>
        </div>
        <button class="ghost" type="button" data-close-modal="runModalWrap">Close</button>
      </div>
      <div id="runToast" class="hidden"></div>
      <form id="runForm">
        <div class="two">
          <div class="field"><label>Recipient Email</label><input name="to" type="email" required /></div>
          <div class="field"><label>Subject</label><input name="subject" required /></div>
        </div>
        <div class="field"><label>Body</label><textarea name="body" required></textarea></div>
        <div class="field">
          <label>Testing Mode</label>
          <div class="modeGrid">
            <label class="modeCard active" id="modeCardReal">
              <input type="radio" name="mode" value="real" checked />
              <b>Real Delivery Test</b>
              <span>Uses the current SMTP configuration and tries to deliver a real email.</span>
            </label>
            <label class="modeCard" id="modeCardSimulate">
              <input type="radio" name="mode" value="simulate-fail" />
              <b>Simulation Failed Test</b>
              <span>Forces retry/failure behavior so you can verify logs, errors, and history easily.</span>
            </label>
          </div>
        </div>
        <div id="simulateFields" class="three hidden">
          <div class="field"><label>Fail Attempts</label><input name="failAttempts" type="number" min="1" max="10" value="3" /></div>
          <div class="field"><label>Processing Delay (ms)</label><input name="processingDelayMs" type="number" min="0" max="30000" value="100" /></div>
          <div class="field"><label>Behavior</label><input value="Job will retry and likely fail based on attempts" disabled /></div>
        </div>
        <div class="row">
          <button class="primary" type="submit">Submit Test Job</button>
          <button class="ghost" type="button" data-close-modal="runModalWrap">Cancel</button>
        </div>
      </form>
    </div>
  </div>

  <div id="detailModalWrap" class="modalWrap hidden">
    <div class="modal">
      <div class="modalHead">
        <div>
          <h2 id="detailTitle" style="margin:0">Details</h2>
          <p class="sub" id="detailSubtitle" style="margin:6px 0 0"></p>
        </div>
        <button class="ghost" type="button" data-close-modal="detailModalWrap">Close</button>
      </div>
      <div id="detailBody"></div>
    </div>
  </div>

  <script>
    const state={token:localStorage.getItem('asytest_token')||'',profile:null,jobs:[],summary:null,smtp:null};
    const $=id=>document.getElementById(id);
    const els={authPanel:$('authPanel'),appPanel:$('appPanel'),authToast:$('authToast'),historyToast:$('historyToast'),runToast:$('runToast'),signupForm:$('signupForm'),verifyForm:$('verifyForm'),loginForm:$('loginForm'),smtpForm:$('smtpForm'),smtpReadonly:$('smtpReadonly'),smtpSummary:$('smtpSummary'),openRunModalBtn:$('openRunModalBtn'),runModalWrap:$('runModalWrap'),runForm:$('runForm'),simulateFields:$('simulateFields'),historyWrap:$('historyWrap'),detailModalWrap:$('detailModalWrap'),detailTitle:$('detailTitle'),detailSubtitle:$('detailSubtitle'),detailBody:$('detailBody'),sessionLoggedOut:$('sessionLoggedOut'),sessionLoggedIn:$('sessionLoggedIn'),sessionName:$('sessionName'),sessionMeta:$('sessionMeta'),refreshAllBtn:$('refreshAllBtn'),logoutBtn:$('logoutBtn'),testSmtpBtn:$('testSmtpBtn'),modeCardReal:$('modeCardReal'),modeCardSimulate:$('modeCardSimulate')};
    const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
    const fmt=v=>v?new Date(v).toLocaleString():'N/A';
    const badge=s=>'<span class="badge '+esc(s)+'">'+esc(String(s).replaceAll('_',' '))+'</span>';
    function showToast(node,message,kind){node.className='toast '+(kind==='error'?'err':'ok');node.textContent=message;node.classList.remove('hidden');setTimeout(()=>node.classList.add('hidden'),3400);}
    async function api(path,opt={}){const res=await fetch(path,{headers:{'Content-Type':'application/json',...(state.token?{Authorization:'Bearer '+state.token}:{}),...(opt.headers||{})},...opt});if(!res.ok){let msg='Request failed';try{const data=await res.json();msg=Array.isArray(data.message)?data.message.join(', '):(data.message||msg);}catch{}throw new Error(msg);}return res.status===204?null:res.json();}
    function setAuthUi(){const on=!!state.profile;els.authPanel.classList.toggle('hidden',on);els.appPanel.classList.toggle('hidden',!on);els.sessionLoggedOut.classList.toggle('hidden',on);els.sessionLoggedIn.classList.toggle('hidden',!on);if(on){els.sessionName.textContent=state.profile.fullName+' ('+state.profile.role+')';els.sessionMeta.textContent=state.profile.email+' | '+state.profile.tenantName;}}
    function setSummary(){const s=state.summary||{total:0,queued:0,processing:0,retryScheduled:0,succeeded:0,failed:0};$('statTotal').textContent=s.total;$('statQueued').textContent=s.queued;$('statProcessing').textContent=s.processing;$('statRetry').textContent=s.retryScheduled;$('statSucceeded').textContent=s.succeeded;$('statFailed').textContent=s.failed;}
    function renderSmtp(){const s=state.smtp;if(!state.profile)return;const admin=state.profile.role==='admin';els.smtpForm.classList.toggle('hidden',!admin);els.smtpReadonly.classList.toggle('hidden',admin);els.smtpReadonly.innerHTML='<div><b>SMTP configuration is managed by an admin.</b><p class="sub" style="margin:8px 0 0">You can still run real delivery tests if SMTP has already been configured.</p></div>';els.smtpSummary.innerHTML=s&&s.host?'<div class="kv"><b>Host</b><span>'+esc(s.host)+'</span><b>Port</b><span>'+esc(s.port)+'</span><b>Secure</b><span>'+esc(s.secure?'Yes':'No')+'</span><b>From</b><span>'+esc(s.fromEmail||'-')+'</span><b>Username</b><span>'+esc(s.username||'-')+'</span><b>Password Stored</b><span>'+(s.hasPassword?'Yes':'No')+'</span><b>Updated</b><span>'+esc(fmt(s.updatedAt))+'</span></div>':'<div class="empty">No SMTP configuration saved for this tenant yet.</div>';if(admin&&s&&s.host){els.smtpForm.host.value=s.host||'';els.smtpForm.port.value=s.port||'';els.smtpForm.username.value=s.username||'';els.smtpForm.password.value='';els.smtpForm.fromEmail.value=s.fromEmail||'';els.smtpForm.fromName.value=s.fromName||'';$('smtpSecure').checked=!!s.secure;}}
    function modeLabel(job){return job.metadata&&job.metadata.simulate&&job.metadata.simulate.failAttempts?'Simulated failure':'Real delivery';}
    function renderHistory(){if(!state.jobs.length){els.historyWrap.innerHTML='<div class="empty">No testing history yet.</div>';return;}els.historyWrap.innerHTML='<table><thead><tr><th>Recipient</th><th>Subject</th><th>Mode</th><th>Status</th><th>Attempts</th><th>Created</th><th class="actionCol">Actions</th></tr></thead><tbody>'+state.jobs.map(job=>'<tr><td>'+esc(job.toEmail)+'</td><td>'+esc(job.subject)+'</td><td>'+esc(modeLabel(job))+'</td><td>'+badge(job.status)+'</td><td>'+esc(job.attemptsMade)+' / '+esc(job.maxAttempts)+'</td><td>'+esc(fmt(job.createdAt))+'</td><td class="actionCol"><div class="actions"><button class="small ghost" data-action="details" data-id="'+job.id+'">View Details</button><button class="small warn" data-action="error" data-id="'+job.id+'">Error Details</button><button class="small secondary" data-action="logs" data-id="'+job.id+'">View Logs</button></div></td></tr>').join('')+'</tbody></table>';els.historyWrap.querySelectorAll('button[data-action]').forEach(btn=>btn.addEventListener('click',()=>handleHistoryAction(btn.dataset.action,btn.dataset.id)));}
    function currentRunMode(){const selected=document.querySelector('input[name="mode"]:checked');return selected?selected.value:'real';}
    function syncModeUi(){const mode=currentRunMode();els.simulateFields.classList.toggle('hidden',mode!=='simulate-fail');els.modeCardReal.classList.toggle('active',mode==='real');els.modeCardSimulate.classList.toggle('active',mode==='simulate-fail');}
    function openModal(id){$(id).classList.remove('hidden');}
    function closeModal(id){$(id).classList.add('hidden');}
    function setDetail(title,subtitle,html){els.detailTitle.textContent=title;els.detailSubtitle.textContent=subtitle;els.detailBody.innerHTML=html;openModal('detailModalWrap');}
    async function refreshDashboard(){if(!state.token)return;state.profile=await api('/auth/me');const reqs=[api('/jobs'),api('/jobs/summary'),api('/smtp-config')];const [jobs,summary,smtp]=await Promise.all(reqs);state.jobs=jobs;state.summary=summary;state.smtp=smtp;setAuthUi();setSummary();renderSmtp();renderHistory();}
    function detailsHtml(job){return '<div class="card" style="margin-bottom:12px"><div class="kv"><b>Job ID</b><span class="mono">'+esc(job.id)+'</span><b>Recipient</b><span>'+esc(job.toEmail)+'</span><b>Subject</b><span>'+esc(job.subject)+'</span><b>Mode</b><span>'+esc(modeLabel(job))+'</span><b>Status</b><span>'+badge(job.status)+'</span><b>Attempts</b><span>'+esc(job.attemptsMade)+' / '+esc(job.maxAttempts)+'</span><b>Last Error</b><span>'+esc(job.lastError||'No error')+'</span><b>Provider Message ID</b><span class="mono">'+esc(job.result&&job.result.providerMessageId||'-')+'</span><b>Provider Response</b><span class="mono">'+esc(job.result&&job.result.providerResponse||'-')+'</span></div></div><h3>Body</h3><div class="card" style="margin-bottom:12px">'+esc(job.body)+'</div><h3>History Timeline</h3><div class="timeline">'+(job.history&&job.history.length?job.history.map(item=>'<div class="card"><div class="statusline">'+badge(item.status)+'<b>'+esc(item.event)+'</b><span class="sub">'+esc(fmt(item.createdAt))+'</span></div><div style="margin-top:8px">'+esc(item.message)+'</div>'+(item.metadata?'<pre class="mono" style="white-space:pre-wrap;margin:10px 0 0">'+esc(JSON.stringify(item.metadata,null,2))+'</pre>':'')+'</div>').join(''):'<div class="empty">No history found.</div>')+'</div>';}
    function errorHtml(job){const errHistory=(job.history||[]).filter(item=>item.status==='failed'||item.status==='retry_scheduled');return '<div class="card" style="margin-bottom:12px"><div class="kv"><b>Current Status</b><span>'+badge(job.status)+'</span><b>Last Error</b><span>'+esc(job.lastError||'No error captured yet')+'</span><b>Attempts</b><span>'+esc(job.attemptsMade)+' / '+esc(job.maxAttempts)+'</span></div></div><h3>Error Related History</h3><div class="timeline">'+(errHistory.length?errHistory.map(item=>'<div class="card"><div class="statusline">'+badge(item.status)+'<b>'+esc(item.event)+'</b><span class="sub">'+esc(fmt(item.createdAt))+'</span></div><div style="margin-top:8px">'+esc(item.message)+'</div>'+(item.metadata?'<pre class="mono" style="white-space:pre-wrap;margin:10px 0 0">'+esc(JSON.stringify(item.metadata,null,2))+'</pre>':'')+'</div>').join(''):'<div class="empty">No error details for this job.</div>')+'</div>';}
    async function logsHtml(jobId){const logs=await api('/jobs/'+jobId+'/logs');return logs.length?'<div class="timeline">'+logs.map(log=>'<div class="card"><div class="statusline">'+badge(log.level==='info'?'succeeded':log.level==='warn'?'retry_scheduled':'failed')+'<b>'+esc(log.event)+'</b><span class="sub">'+esc(fmt(log.createdAt))+'</span></div><div style="margin-top:8px">'+esc(log.message)+'</div>'+(log.metadata?'<pre class="mono" style="white-space:pre-wrap;margin:10px 0 0">'+esc(JSON.stringify(log.metadata,null,2))+'</pre>':'')+'</div>').join('')+'</div>':'<div class="empty">No logs found for this job.</div>';}
    async function handleHistoryAction(action,id){const job=state.jobs.find(item=>item.id===id);if(!job)return;if(action==='details'){setDetail('Job Details',job.subject,detailsHtml(job));return;}if(action==='error'){setDetail('Error Details',job.subject,errorHtml(job));return;}if(action==='logs'){setDetail('Job Logs',job.subject,'<div class="empty">Loading logs...</div>');try{els.detailBody.innerHTML=await logsHtml(id);}catch(error){els.detailBody.innerHTML='<div class="empty">'+esc(error.message)+'</div>';}return;}}
    els.signupForm.addEventListener('submit',async e=>{e.preventDefault();try{const result=await api('/auth/signup',{method:'POST',body:JSON.stringify({tenantName:els.signupForm.tenantName.value,fullName:els.signupForm.fullName.value,email:els.signupForm.email.value,password:els.signupForm.password.value})});showToast(els.authToast,result.previewOtp?'Signup created. Verify OTP first. Preview OTP: '+result.previewOtp:result.message,'ok');}catch(error){showToast(els.authToast,error.message,'error');}});
    els.verifyForm.addEventListener('submit',async e=>{e.preventDefault();try{const result=await api('/auth/verify-signup-otp',{method:'POST',body:JSON.stringify({email:els.verifyForm.email.value,otp:els.verifyForm.otp.value})});showToast(els.authToast,result.message,'ok');}catch(error){showToast(els.authToast,error.message,'error');}});
    els.loginForm.addEventListener('submit',async e=>{e.preventDefault();try{const result=await api('/auth/login',{method:'POST',body:JSON.stringify({email:els.loginForm.email.value,password:els.loginForm.password.value})});state.token=result.accessToken;localStorage.setItem('asytest_token',state.token);await refreshDashboard();}catch(error){showToast(els.authToast,error.message,'error');}});
    els.logoutBtn.addEventListener('click',()=>{state.token='';state.profile=null;state.jobs=[];state.summary=null;state.smtp=null;localStorage.removeItem('asytest_token');setAuthUi();renderHistory();});
    els.refreshAllBtn.addEventListener('click',()=>refreshDashboard().catch(error=>showToast(els.historyToast,error.message,'error')));
    els.openRunModalBtn.addEventListener('click',()=>{syncModeUi();openModal('runModalWrap');});
    document.querySelectorAll('input[name="mode"]').forEach(input=>input.addEventListener('change',syncModeUi));
    document.querySelectorAll('[data-close-modal]').forEach(btn=>btn.addEventListener('click',()=>closeModal(btn.dataset.closeModal)));
    els.runForm.addEventListener('submit',async e=>{e.preventDefault();const mode=currentRunMode();const payload={to:els.runForm.to.value,subject:els.runForm.subject.value,body:els.runForm.body.value};if(mode==='simulate-fail'){payload.simulate={failAttempts:Number(els.runForm.failAttempts.value||3),processingDelayMs:Number(els.runForm.processingDelayMs.value||100)};}try{await api('/jobs/email',{method:'POST',body:JSON.stringify(payload)});showToast(els.historyToast,mode==='simulate-fail'?'Simulation failure test queued.':'Real email test queued.','ok');closeModal('runModalWrap');els.runForm.reset();document.querySelector('input[name="mode"][value="real"]').checked=true;syncModeUi();await refreshDashboard();}catch(error){showToast(els.runToast,error.message,'error');}});
    els.smtpForm.addEventListener('submit',async e=>{e.preventDefault();try{await api('/smtp-config',{method:'PUT',body:JSON.stringify({host:els.smtpForm.host.value,port:Number(els.smtpForm.port.value),username:els.smtpForm.username.value||undefined,password:els.smtpForm.password.value||undefined,fromEmail:els.smtpForm.fromEmail.value,fromName:els.smtpForm.fromName.value||undefined,secure:$('smtpSecure').checked})});showToast(els.historyToast,'SMTP updated successfully.','ok');await refreshDashboard();}catch(error){showToast(els.historyToast,error.message,'error');}});
    els.testSmtpBtn.addEventListener('click',async()=>{try{await api('/smtp-config/test',{method:'POST'});showToast(els.historyToast,'SMTP connection verified.','ok');}catch(error){showToast(els.historyToast,error.message,'error');}});
    (async()=>{syncModeUi();if(state.token){try{await refreshDashboard();}catch(error){localStorage.removeItem('asytest_token');state.token='';setAuthUi();}}else{setAuthUi();renderHistory();}})();
    setInterval(()=>{if(state.token){refreshDashboard().catch(()=>{});}},5000);
  </script>
</body>
</html>`;
