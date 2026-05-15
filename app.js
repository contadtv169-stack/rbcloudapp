const DB='rbcloud_db',V=3,KK='rb_cfg',FK='rb_faces',PK='rb_pin',FE='rb_face_en',LK='rb_locked';
let db,fs=[],cfg={prv:'groq',ep:'',key:'',mod:'llama-3.3-70b-versatile',tts:'system',ek:'',ev:'21m00Tcm4TlvDq8ikWAM'};
let pid=null,call=false,rec=null,ir=false;
const $=id=>document.getElementById(id);
const _E=atob('cm9iZXJpYWFyYXVqbzEyM0BnbWFpbC5jb20=');
const _P=atob('YW1vcjExMTc=');

function initDB(){return new Promise((rs,rj)=>{
  const r=indexedDB.open(DB,V);
  r.onupgradeneeded=e=>{
    const d=e.target.result;
    if(!d.objectStoreNames.contains('f')){
      const s=d.createObjectStore('f',{keyPath:'id',autoIncrement:true});
      s.createIndex('t','t');s.createIndex('c','c');s.createIndex('n','n');s.createIndex('ts','ts');
    }
  };
  r.onsuccess=e=>{db=e.target.result;rs()};
  r.onerror=e=>rj(e.target.error);
})}

function cat(m,n){return m.startsWith('image/')?'p':m.startsWith('video/')?'v':'d'}
function ic(f){
  if(f.c==='p')return'🖼️';if(f.c==='v')return'🎬';
  const e=f.n.split('.').pop().toLowerCase(),ix={pdf:'📄',doc:'📝',docx:'📝',xls:'📊',xlsx:'📊',zip:'📦',rar:'📦',mp3:'🎵',wav:'🎵',txt:'📃',json:'📋',png:'🖼️',jpg:'🖼️',jpeg:'🖼️',gif:'🖼️'};
  return ix[e]||'📁';
}
function sz(b){if(!b)return'0 B';const u=['B','KB','MB','GB'];let i=0,s=b;while(s>=1024&&i<3){s/=1024;i++}return s.toFixed(i>0?1:0)+' '+u[i]}
function df(ts){const d=new Date(ts);return d.toLocaleDateString('pt-BR')+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
function url(d,t){return URL.createObjectURL(new Blob([d],{type:t||'application/octet-stream'}))}
function rs(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,64)+'px'}

// LOGIN
function doLogin(){
  const e=$('login-email').value.trim(),p=$('login-password').value;
  if(e===_E&&p===_P){
    $('login-screen').classList.add('hidden');
    localStorage.setItem('rb_logged','1');
    faceEnabled()?showFace():boot();
  }else $('login-error').textContent='❌ Email ou senha incorretos';
}
function doLogout(){
  if(!confirm('Sair?'))return;
  localStorage.removeItem('rb_logged');
  $('app').classList.add('hidden');$('login-screen').classList.remove('hidden');
  $('login-email').value='';$('login-password').value='';$('login-error').textContent='';
}

// FACE
function faceEnabled(){return localStorage.getItem(FE)==='1'}
function getFace(){try{return JSON.parse(localStorage.getItem(FK))}catch{return null}}
function getPin(){return localStorage.getItem(PK)||''}
function locked(){try{return new Set(JSON.parse(localStorage.getItem(LK)))}catch{return new Set}}

async function showFace(){
  if(!faceEnabled()){$('app').classList.remove('hidden');boot();return}
  $('face-screen').classList.remove('hidden');$('app').classList.add('hidden');
  $('face-status').textContent='Preparando...';
  try{
    const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:320,height:240}});
    $('face-video').srcObject=s;window._fs=s;
    $('face-status').textContent='Olhe para a câmera';
  }catch{$('face-status').textContent='Câmera indisponível. Use PIN.';$('#face-btn')&&($('#face-btn').disabled=true)}
}
async function tryFaceUnlock(){
  $('face-status').textContent='⏳ Verificando...';$('face-loading').classList.remove('hidden');$('face-err').textContent='';
  try{
    const m=await matchFace($('face-video'));
    if(m){$('face-screen').classList.add('hidden');$('app').classList.remove('hidden');stopFace();boot()}
    else{$('face-err').textContent='❌ Não reconhecido';$('face-status').textContent='Tente novamente'}
  }catch(e){$('face-err').textContent='Erro: '+e.message;$('face-status').textContent='Tente novamente'}
  $('face-loading').classList.add('hidden');
}
function skipFace(){
  const p=getPin();
  if(!p){$('face-screen').classList.add('hidden');$('app').classList.remove('hidden');stopFace();boot();return}
  const pp=prompt('🔑 PIN:');
  if(pp===p){$('face-screen').classList.add('hidden');$('app').classList.remove('hidden');stopFace();boot()}
  else alert('PIN incorreto');
}
function stopFace(){if(window._fs){window._fs.getTracks().forEach(t=>t.stop());window._fs=null}}

async function detectLM(vid){
  if(!window.FaceDetector)throw new Error('FaceDetector não disponível');
  const fd=new FaceDetector({fastMode:true,maxDetectedFaces:1});
  const f=await fd.detect(vid);
  if(!f||!f.length)return null;
  const ff=f[0];
  if(ff.landmarks&&ff.landmarks.length)return ff.landmarks.map(l=>({x:l.location.x,y:l.location.y}));
  const b=ff.boundingBox;
  return[{x:b.x,y:b.y},{x:b.x+b.width,y:b.y},{x:b.x,y:b.y+b.height},{x:b.x+b.width,y:b.y+b.height},{x:b.x+b.width/2,y:b.y+b.height/2}];
}
function cmpFaces(a,b){
  if(!a||!b||a.length<2||b.length<2)return false;
  const len=Math.min(a.length,b.length);
  function norm(p){const cx=p.reduce((s,o)=>s+o.x,0)/p.length,cy=p.reduce((s,o)=>s+o.y,0)/p.length,sc=Math.sqrt(p.reduce((s,o)=>s+(o.x-cx)**2+(o.y-cy)**2,0)/p.length);return p.map(o=>({x:(o.x-cx)/sc,y:(o.y-cy)/sc}))}
  const n1=norm(a),n2=norm(b);let d=0;
  for(let i=0;i<len;i++)d+=Math.sqrt((n1[i].x-n2[i].x)**2+(n1[i].y-n2[i].y)**2);
  return d/len<.5;
}
async function matchFace(vid){const f=getFace();if(!f)return false;const d=await detectLM(vid);return d?cmpFaces(d,f):false}

function toggleFace(){
  const cb=$('face-tg');
  if(cb.checked){$('face-enroll').classList.remove('hidden');startEnroll()}
  else{localStorage.removeItem(FK);localStorage.setItem(FE,'0');$('face-enroll').classList.add('hidden');stopFace()}
}
async function startEnroll(){
  try{const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:320,height:240}});$('enroll-vid').srcObject=s;window._es=s}
  catch{$('enroll-st').textContent='❌ Câmera indisponível'}
}
async function captureFace(){
  $('enroll-st').textContent='⏳ Capturando...';
  try{const lm=await detectLM($('enroll-vid'));if(!lm){$('enroll-st').textContent='❌ Nenhum rosto';return}
    localStorage.setItem(FK,JSON.stringify(lm));localStorage.setItem(FE,'1');$('face-tg').checked=true;$('enroll-st').textContent='✅ Rosto cadastrado!';cancelEnroll()
  }catch(e){$('enroll-st').textContent='❌ '+e.message}
}
function cancelEnroll(){if(window._es){window._es.getTracks().forEach(t=>t.stop());window._es=null}$('face-enroll').classList.add('hidden')}

// FILE OPERATIONS
async function up(files){
  const p=$('up-prog'),f=$('bar-fill'),t=$('bar-txt');
  p.classList.remove('hidden');const a=Array.from(files);let d=0;
  for(const fl of a){
    const buf=await readF(fl);
    await saveF({n:fl.n||fl.name,t:fl.type||'application/octet-stream',s:fl.size,c:cat(fl.type,fl.n||fl.name),d:buf,ts:Date.now()});
    d++;const pct=Math.round(d/a.length*100);f.style.width=pct+'%';t.textContent=(fl.n||fl.name)+' - '+pct+'%';
  }
  setTimeout(()=>{p.classList.add('hidden');f.style.width='0';t.textContent='0%';loadF()},800);
}
function readF(f){return new Promise((rs,rj)=>{const r=new FileReader;r.onload=()=>rs(r.result);r.onerror=rj;r.readAsArrayBuffer(f)})}
function saveF(r){return new Promise((rs,rj)=>{const t=db.transaction('f','readwrite');const q=t.objectStore('f').add(r);q.onsuccess=()=>rs();q.onerror=()=>rj(q.error)})}
function getAll(){return new Promise((rs,rj)=>{const t=db.transaction('f','readonly');const q=t.objectStore('f').getAll();q.onsuccess=()=>rs(q.result);q.onerror=()=>rj(q.error)})}
function delF(id){return new Promise((rs,rj)=>{const t=db.transaction('f','readwrite');const q=t.objectStore('f').delete(id);q.onsuccess=()=>rs();q.onerror=()=>rj(q.error)})}

async function loadF(){fs=await getAll();fs.sort((a,b)=>b.ts-a.ts);home();prof();stg()}

function home(){
  const q=($('srch')?.value||'').toLowerCase();
  let f=fs;if(q)f=f.filter(x=>x.n.toLowerCase().includes(q));
  const l=locked();
  const ph=fs.filter(x=>x.c==='p').length,vi=fs.filter(x=>x.c==='v').length,dc=fs.filter(x=>x.c==='d').length;
  $('stats').innerHTML=`<div class="stat-c"><div class="n">${ph}</div><div class="l">Fotos</div></div><div class="stat-c"><div class="n">${vi}</div><div class="l">Vídeos</div></div><div class="stat-c"><div class="n">${dc}</div><div class="l">Documentos</div></div>`;
  const g=$('flist');
  if(!f.length){g.innerHTML='<div class="empty"><div class="e">⛅</div><p>Nenhum arquivo</p></div>';return}
  g.innerHTML=f.map(x=>{
    const lk=l.has(String(x.id));
    return `<div class="fc${lk?' pin':''}"><div class="fi">${ic(x)}</div><div class="info"><div class="nm">${x.n}</div><div class="mt">${sz(x.s)} • ${df(x.ts)}</div></div><div class="ac">
      ${lk?`<button onclick="faskPid(${x.id})" title="Protegido">🔒</button>`:`<button onclick="prev(${x.id})" title="Ver">👁️</button>`}
      <button onclick="${lk?`faskPid(${x.id})`:`dl(${x.id})`}" title="Baixar">⬇️</button>
      <button onclick="askPinDel(${x.id})" title="Excluir">🗑️</button>
    </div></div>`;
  }).join('');
}

function askPinDel(id){
  const pin=getPin();
  if(!pin){if(confirm('Excluir sem PIN?'))delFile(id);return}
  pid=id;$('pin-chk').value='';$('pin-del-err').textContent='';$('pin-modal').classList.remove('hidden');
}
function verifyPinDel(){
  if($('pin-chk').value===getPin()){$('pin-modal').classList.add('hidden');delFile(pid)}
  else $('pin-del-err').textContent='❌ PIN incorreto!';
}
async function delFile(id){
  await delF(id);loadF();
  const a=document.querySelector('.nav-i.active');if(!a)return;
  if(a.dataset.t==='fotos')phts();if(a.dataset.t==='videos')vids();
}

function faskPid(id){pid=id;faceEnabled()?faceFile():pinFile()}
async function faceFile(){
  try{
    const s=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:320,height:240}});
    const v=document.createElement('video');v.srcObject=s;v.autoplay=true;v.playsinline=true;v.muted=true;v.style.display='none';
    document.body.appendChild(v);
    await new Promise(r=>setTimeout(r,600));
    const m=await matchFace(v);
    s.getTracks().forEach(t=>t.stop());v.remove();
    if(m)showP(pid);else alert('❌ Rosto não reconhecido');
  }catch{alert('❌ Câmera indisponível');pinFile()}
}
function pinFile(){
  const p=prompt('🔑 PIN:');
  if(p===getPin())showP(pid);
  else if(p!==null)alert('❌ PIN incorreto');
}

function showP(id){
  const f=fs.find(x=>x.id===id);if(!f)return;
  const m=$('modal'),b=$('modal-body'),u=url(f.d,f.t);
  if(f.c==='p')b.innerHTML=`<img src="${u}" alt="${f.n}">`;
  else if(f.c==='v')b.innerHTML=`<video src="${u}" controls autoplay></video>`;
  else b.innerHTML=`<div style="text-align:center;padding:40px"><div style="font-size:64px;margin-bottom:12px">📄</div><h3>${f.n}</h3><p style="color:var(--tx2);margin:8px 0">${sz(f.s)}</p><button class="btn primary" onclick="dl(${f.id})" style="margin-top:12px">⬇️ Baixar</button></div>`;
  m.classList.remove('hidden');
}

function dl(id){const f=fs.find(x=>x.id===id);if(!f)return;const u=url(f.d,f.t),a=document.createElement('a');a.href=u;a.download=f.n;document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(()=>URL.revokeObjectURL(u),1e4)}

function phts(){
  const g=$('pht-grid'),p=fs.filter(f=>f.c==='p'),l=locked();
  if(!p.length){g.innerHTML='<div class="empty"><div class="e">🖼️</div><p>Nenhuma foto</p></div>';return}
  g.innerHTML=p.map(f=>`<div class="photo-c" onclick="${l.has(String(f.id))?'faskPid('+f.id+')':'prev('+f.id+')'}"><img src="${url(f.d,f.t)}" loading="lazy">${l.has(String(f.id))?'<div class="lk">🔒</div>':''}<div class="ol">${f.n}</div></div>`).join('');
}
function vids(){
  const g=$('vid-grid'),v=fs.filter(f=>f.c==='v'),l=locked();
  if(!v.length){g.innerHTML='<div class="empty"><div class="e">🎬</div><p>Nenhum vídeo</p></div>';return}
  g.innerHTML=v.map(f=>`<div class="vid-c" onclick="${l.has(String(f.id))?'faskPid('+f.id+')':'prev('+f.id+')'}"><video src="${url(f.d,f.t)}" preload="metadata"></video>${l.has(String(f.id))?'<div class="lk">🔒</div>':''}<div class="ol">${f.n}</div></div>`).join('');
}

function clearAll(){if(!confirm('Limpar TUDO?'))return;const t=db.transaction('f','readwrite');t.objectStore('f').clear();loadF();stg()}

function prev(id){showP(id)}
function prof(){const ph=fs.filter(x=>x.c==='p').length,vi=fs.filter(x=>x.c==='v').length,dc=fs.filter(x=>x.c==='d').length;$('pf-pho').textContent=ph+' fotos';$('pf-vid').textContent=vi+' vídeos';$('pf-doc').textContent=dc+' docs'}
function stg(){const t=fs.reduce((s,f)=>s+(f.s||0),0);$('stg-info').textContent=sz(t)}

// PEOPLE
let pp=[];
async function scanFaces(){
  const btn=$('scan-faces-btn');if(btn)btn.textContent='⏳...';
  const pht=fs.filter(f=>f.c==='p');pp=[];
  if(!window.FaceDetector){$('pcnt').textContent='FaceDetector não suportado';if(btn)btn.textContent='🔍 Detectar';return}
  for(const f of pht){
    try{
      const u=url(f.d,f.t),img=new Image;
      await new Promise((rs,rj)=>{img.onload=rs;img.onerror=rj;img.src=u});
      const fd=new FaceDetector({fastMode:true}),fa=await fd.detect(img);
      URL.revokeObjectURL(u);
      if(fa?.length)pp.push({id:f.id,n:f.n,faces:fa.map(x=>({w:x.boundingBox.width,h:x.boundingBox.height,x:x.boundingBox.x,y:x.boundingBox.y}))});
    }catch{}
  }
  renderP();if(btn)btn.textContent='🔍 Detectar';
}
function renderP(){
  const g=$('pgrid'),c=$('pcnt');
  if(!pp.length){g.innerHTML='<div class="empty"><div class="e">👥</div><p>Clique em Detectar</p></div>';c.textContent='';return}
  let grp=[];
  for(const p of pp){for(const f of p.faces){let found=false;for(const g of grp){if(Math.abs(f.w-g.w)<20&&Math.abs(f.h-g.h)<20){g.photos.push(p.id);g.w=(g.w+f.w)/2;g.h=(g.h+f.h)/2;found=true;break}}if(!found)grp.push({photos:[p.id],w:f.w,h:f.h})}}
  c.textContent=grp.length+' pessoas';
  g.innerHTML=grp.map((gr,i)=>{const f=fs.find(x=>x.id===gr.photos[0]),u=f?url(f.d,f.t):'';return`<div class="pc" onclick="showGrp(${i})">${u?`<img class="pa" src="${u}">`:`<div class="pp">👤</div>`}<div class="pn">Pessoa ${i+1}</div><div class="pct">${gr.photos.length} fotos</div></div>`}).join('');
}
function showGrp(i){
  const grp=pp.filter(p=>{for(const f of p.faces){if(Math.abs(f.w-pp[i]?.faces?.[0]?.w||0)<20)return true}return false});
  const m=$('modal'),b=$('modal-body');
  b.innerHTML='<h3 style="margin-bottom:12px">👤 Pessoa '+(i+1)+'</h3><div class="pht-grid">'+grp.map(p=>{const f=fs.find(x=>x.id===p.id);return f?`<div class="photo-c" onclick="prev(${f.id})"><img src="${url(f.d,f.t)}" loading="lazy"><div class="ol">${f.n}</div></div>`:''}).join('')+'</div>';
  m.classList.remove('hidden');
}

// AI CONFIG
function loadCfg(){
  try{const s=localStorage.getItem(KK);if(s)cfg=JSON.parse(s)}catch{}
  $('ai-prov').value=cfg.prv;$('ai-end').value=cfg.ep||'';$('ai-key').value=cfg.key||'';$('ai-mod').value=cfg.mod||'llama-3.3-70b-versatile';
  $('tts-prov').value=cfg.tts||'system';$('el-key').value=cfg.ek||'';$('el-voice').value=cfg.ev||'21m00Tcm4TlvDq8ikWAM';
}
function saveAI(){cfg.prv=$('ai-prov').value;cfg.ep=$('ai-end').value.trim();cfg.key=$('ai-key').value.trim();cfg.mod=$('ai-mod').value.trim();localStorage.setItem(KK,JSON.stringify(cfg));$('ai-st').textContent='✅';setTimeout(()=>$('ai-st').textContent='',3e3)}
function saveVoice(){cfg.tts=$('tts-prov').value;cfg.ek=$('el-key').value.trim();cfg.ev=$('el-voice').value.trim();localStorage.setItem(KK,JSON.stringify(cfg));$('vo-st').textContent='✅';setTimeout(()=>$('vo-st').textContent='',3e3)}
function savePin(){const p=$('pin-inp').value.trim();if(p&&p.length<4){$('pin-st').textContent='❌ Mín 4 dígitos';return}p?localStorage.setItem(PK,p):localStorage.removeItem(PK);$('pin-st').textContent='✅';setTimeout(()=>$('pin-st').textContent='',3e3)}
function toggleVis(id){const i=$(id);i.type=i.type==='password'?'text':'password'}

// THEME
function toggleTheme(){
  const b=$('theme-btn'),s=$('theme-sel');
  const d=!document.body.classList.contains('theme-light');
  document.body.classList.toggle('theme-light');b.textContent=d?'☀️':'🌙';s.value=d?'light':'dark';
  document.getElementById('theme-color').content=d?'#f0ecf8':'#0f0a1a';
  localStorage.setItem('rb_theme',d?'light':'dark');
}
function setTheme(v){document.body.className=v==='light'?'theme-light':'';$('theme-btn').textContent=v==='dark'?'🌙':'☀️';document.getElementById('theme-color').content=v==='dark'?'#0f0a1a':'#f0ecf8';localStorage.setItem('rb_theme',v)}

// CHAT
function ep(){
  if(cfg.prv==='gemini')return{url:'https://generativelanguage.googleapis.com/v1beta/models/'+(cfg.mod||'gemini-2.0-flash')+':generateContent?key='+cfg.key,type:'gemini'};
  if(cfg.prv==='groq')return{url:'https://api.groq.com/openai/v1/chat/completions',type:'oa',key:cfg.key,mod:cfg.mod||'llama-3.3-70b-versatile'};
  const b=cfg.ep||'https://api.openai.com/v1';return{url:b+'/chat/completions',type:'oa',key:cfg.key,mod:cfg.mod||'gpt-4o-mini'};
}
function addM(t,r){
  const c=$('chat-msgs'),d=document.createElement('div');
  d.className='msg '+r;
  d.innerHTML=t+'<span class="t">'+new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+'</span>';
  c.appendChild(d);c.scrollTop=c.scrollHeight;
}
async function sendChat(){
  const i=$('chat-inp'),t=i.value.trim();if(!t)return;
  addM(t,'user');i.value='';i.style.height='auto';
  const ld=document.createElement('div');ld.className='msg ai';ld.id='chld';ld.textContent='⏳';
  $('chat-msgs').appendChild(ld);
  try{
    const e=ep();let r='';
    if(e.type==='gemini'){
      const q=await fetch(e.url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:t}]}]})});
      const d=await q.json();r=d?.candidates?.[0]?.content?.parts?.[0]?.text||'❌ '+(d?.error?.message||'');
    }else{
      if(!e.key){r='⚠️ Configure a API no Perfil'}else{
        const q=await fetch(e.url,{method:'POST',headers:{'Authorization':'Bearer '+e.key,'Content-Type':'application/json'},body:JSON.stringify({model:e.mod,messages:[{role:'user',content:t}],max_tokens:2e3})});
        const d=await q.json();r=d?.choices?.[0]?.message?.content||'❌ '+(d?.error?.message||'');
      }
    }
    document.getElementById('chld')?.remove();addM(r,'ai');
    if(call)spk(r);
  }catch(e){document.getElementById('chld')?.remove();addM('❌ '+e.message,'ai')}
}
function quick(p){const i=$('chat-inp');i.value=p;i.focus();rs(i)}

// VOICE
function toggleVoice(){
  if(!('webkitSpeechRecognition'in window)&&!('SpeechRecognition'in window)){addM('⚠️ Voz não disponível','ai');return}
  if(ir){stpV();return}
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  rec=new SR;rec.lang='pt-BR';rec.continuous=false;rec.interimResults=false;
  rec.onstart=()=>{ir=true;$('vb').textContent='⏹️';shR()};
  rec.onresult=e=>{$('chat-inp').value=e.results[0][0].transcript;rs($('chat-inp'));hdR();sendChat()};
  rec.onerror=()=>{hdR();addM('⚠️ Não entendi','ai')};
  rec.onend=()=>{ir=false;$('vb').textContent='🎤';hdR()};
  rec.start();
}
function stpV(){if(rec){rec.stop();ir=false;$('vb').textContent='🎤';hdR()}}
let ri=null;
function shR(){if(!ri){ri=document.createElement('div');ri.className='rec';ri.textContent='🎤 Gravando...';document.body.appendChild(ri)}}
function hdR(){if(ri){ri.remove();ri=null}}

// CALL AI
function spk(t){
  if(cfg.tts==='elevenlabs'&&cfg.ek){
    fetch('https://api.elevenlabs.io/v1/text-to-speech/'+(cfg.ev||'21m00Tcm4TlvDq8ikWAM'),{method:'POST',headers:{'xi-api-key':cfg.ek,'Content-Type':'application/json'},body:JSON.stringify({text:t,model_id:'eleven_monolingual_v1',voice_settings:{stability:.5,similarity_boost:.5}})})
    .then(r=>r.blob()).then(b=>{new Audio(URL.createObjectURL(b)).play()}).catch(()=>{});
  }else{const u=new SpeechSynthesisUtterance(t);u.lang='pt-BR';u.rate=1.1;speechSynthesis.speak(u)}
}
function callAI(){
  call=true;$('call-ov').classList.remove('hidden');$('call-st').textContent='🎤 Fale...';lis();
}
function lis(){
  if(!call)return;
  if(!('webkitSpeechRecognition'in window)&&!('SpeechRecognition'in window)){$('call-st').textContent='Voz não disponível';return}
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  const r=new SR;r.lang='pt-BR';r.continuous=false;r.interimResults=false;
  r.onresult=e=>{const t=e.results[0][0].transcript;$('call-st').textContent='Você: '+t;$('chat-inp').value=t;sendChat();setTimeout(()=>{if(call)lis()},3e3)};
  r.onerror=()=>setTimeout(()=>{if(call)lis()},3e3);
  r.start();
}
function endCall(){call=false;$('call-ov').classList.add('hidden');speechSynthesis.cancel()}

// IMAGE GEN
async function genImg(){
  const p=$('img-prompt').value.trim();if(!p)return alert('Descrição');
  if(cfg.prv==='groq'){addM('⚠️ Groq não gera imagens. Use OpenAI.','ai');return}
  $('img-load').classList.remove('hidden');$('img-res').classList.add('hidden');
  try{
    if(!cfg.key){$('img-load').classList.add('hidden');addM('⚠️ Configure a API','ai');return}
    const b=cfg.ep||'https://api.openai.com/v1';
    const q=await fetch(b+'/images/generations',{method:'POST',headers:{'Authorization':'Bearer '+cfg.key,'Content-Type':'application/json'},body:JSON.stringify({model:'dall-e-3',prompt:p,n:1,size:'1024x1024'})});
    const d=await q.json();const u=d?.data?.[0]?.url;
    if(!u){$('img-load').classList.add('hidden');addM('❌ '+(d?.error?.message||'Erro'),'ai');return}
    $('img-load').classList.add('hidden');$('gen-img').src=u;$('img-res').classList.remove('hidden');
    addM(`🎨 <a href="${u}" target="_blank" style="color:var(--ac)">Imagem gerada</a>`,'ai');
  }catch(e){$('img-load').classList.add('hidden');addM('❌ '+e.message,'ai')}
}
function dlImg(){const i=$('gen-img');if(!i.src)return;const a=document.createElement('a');a.href=i.src;a.download='rb-'+Date.now()+'.png';document.body.appendChild(a);a.click();document.body.removeChild(a)}

// BOOT
function boot(){
  $('app').classList.remove('hidden');
  loadCfg();
  loadF();
  const t=localStorage.getItem('rb_theme');
  if(t){setTheme(t);$('theme-sel').value=t}
  $('face-tg').checked=faceEnabled();
  const p=getPin();if(p)$('pin-inp').value=p;

  // Nav
  document.querySelectorAll('.nav-i').forEach(i=>{
    i.addEventListener('click',()=>{
      document.querySelectorAll('.nav-i').forEach(n=>n.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
      i.classList.add('active');$('tab-'+i.dataset.t).classList.add('active');
      if(i.dataset.t==='home')loadF();if(i.dataset.t==='fotos')phts();if(i.dataset.t==='videos')vids();if(i.dataset.t==='pessoas')renderP();
    });
  });

  // Drop
  const dz=$('drop-zone'),fi=$('file-inp');
  dz.addEventListener('click',()=>fi.click());
  dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('dragover')});
  dz.addEventListener('dragleave',()=>dz.classList.remove('dragover'));
  dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('dragover');if(e.dataTransfer.files.length)up(e.dataTransfer.files)});
  fi.addEventListener('change',()=>{if(fi.files.length){up(fi.files);fi.value=''}});

  // Search
  $('srch').addEventListener('input',()=>home());

  // Chat enter
  $('chat-inp').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat()}});

  // Provider autofill
  $('ai-prov').addEventListener('change',()=>{
    const v=$('ai-prov').value;
    if(v==='groq'){$('ai-end').value='https://api.groq.com/openai/v1';$('ai-mod').value='llama-3.3-70b-versatile'}
    else if(v==='openai'){$('ai-end').value='';$('ai-mod').value='gpt-4o-mini'}
    else if(v==='gemini'){$('ai-end').value='';$('ai-mod').value='gemini-2.0-flash'}
  });

  // Modal close
  document.querySelectorAll('.mclose,.mclose2').forEach(el=>{el.addEventListener('click',()=>{el.closest('.modal').classList.add('hidden')})});
  window.addEventListener('click',e=>{if(e.target.classList.contains('modal'))e.target.classList.add('hidden')});
}

// START
document.addEventListener('DOMContentLoaded',async()=>{
  if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
  await initDB();
  const lg=localStorage.getItem('rb_logged');
  if(lg==='1'){$('login-screen').classList.add('hidden');faceEnabled()?showFace():boot()}
  else{$('login-screen').classList.remove('hidden');$('login-password').addEventListener('keydown',e=>{if(e.key==='Enter')doLogin()})}
});
