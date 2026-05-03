// Shared nav for Medcure pages — with overflow "More" menu
(function(){
  const cur = (document.body.dataset.page || '').toLowerCase();
  const tabs = [
    {id:'overview', label:'Overview', href:'Medcure Dashboard.html', icon:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'},
    {id:'documents', label:'Documents', href:'pages/Documents.html'},
    {id:'message', label:'Message', href:'pages/Messages.html'},
    {id:'labs', label:'Labs', href:'pages/Labs.html'},
    {id:'patients', label:'Patients', href:'pages/Patients.html'},
    {id:'appointments', label:'Appointments', href:'pages/Appointments.html'},
    {id:'pharmacy', label:'Pharmacy', href:'pages/Pharmacy.html'},
    {id:'billing', label:'Billing', href:'pages/Billing.html'},
    {id:'inventory', label:'Stock', href:'pages/Inventory.html'},
    {id:'staff', label:'Staff', href:'pages/Staff.html'},
    {id:'ed', label:'ED', href:'pages/ED.html'},
    {id:'settings', label:'Settings', href:'pages/Settings.html'},
    {id:'telemetry', label:'Telemetry', href:'pages/Telemetry.html'},
    {id:'sitemap', label:'Map', href:'pages/Sitemap.html', icon:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'},
  ];
  const nav = document.getElementById('medcure-nav');
  if(!nav) return;
  const base = document.body.dataset.base || '';

  nav.innerHTML = `
    <a class="logo" href="${base}Medcure Dashboard.html">
      <span class="logo-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12c0-4 3-7 7-7s7 3 7 7-3 7-7 7"/><path d="M20 12c0 4-3 7-7 7"/></svg></span>
      <span>Medcure</span>
    </a>
    <div class="tabs" id="mc-tabs">
      ${tabs.map((t,i) => `<a class="tab ${cur===t.id?'active':''}" data-i="${i}" href="${base}${t.href}">
        ${t.icon?`<span class="ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${t.icon}</svg></span>`:''}
        ${t.label}
      </a>`).join('')}
      <button class="tab tab-more" id="mc-more" aria-haspopup="true" aria-expanded="false" style="display:none">
        <span class="ic"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg></span>
        More
      </button>
      <div class="tab-menu" id="mc-menu" role="menu"></div>
    </div>
    <div class="nav-right">
      <button class="icon-btn" aria-label="search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></button>
      <button class="icon-btn" aria-label="notifications"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg><span class="dot"></span></button>
      <button class="tenant-switch" id="mc-tenant" aria-label="switch organization">
        <span class="tenant-pic">M</span>
        <span class="tenant-meta">
          <span class="tenant-name">Mercy Health</span>
          <span class="tenant-loc">Main · Cincinnati</span>
        </span>
        <span class="chev"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span>
      </button>
      <div class="tenant-menu" id="mc-tenant-menu" role="menu">
        <div class="tm-head">
          <div class="tm-eyebrow">Switch organization</div>
          <a class="tm-manage" href="${base}pages/TenantSelector.html">Manage all →</a>
        </div>
        <a class="tm-row act" href="#" onclick="event.preventDefault()">
          <span class="tm-pic" style="background:#0e1116">M</span>
          <span><b>Mercy Health</b><i>Main · 12 patients · on call</i></span>
          <span class="tm-check">✓</span>
        </a>
        <a class="tm-row" href="${base}pages/TenantSelector.html">
          <span class="tm-pic" style="background:#1a8a48">N</span>
          <span><b>Northcare Pediatrics</b><i>Consultant · 3 patients</i></span>
        </a>
        <a class="tm-row" href="${base}pages/TenantSelector.html">
          <span class="tm-pic" style="background:#1a3a5c">A</span>
          <span><b>Aurora Outpatient</b><i>Telehealth MD · 28 panel</i></span>
        </a>
        <a class="tm-row" href="${base}pages/TenantSelector.html">
          <span class="tm-pic" style="background:#5c1a3a">R</span>
          <span><b>Riverside Trauma</b><i>Locum · per-diem</i></span>
        </a>
        <a class="tm-row pending" href="${base}pages/TenantSelector.html">
          <span class="tm-pic" style="background:#a06e0d">S</span>
          <span><b>St. Olive's Memorial</b><i>⏳ Invite pending</i></span>
        </a>
        <div class="tm-sep"></div>
        <a class="tm-row" href="${base}pages/TenantSelector.html"><span class="tm-pic plus">+</span><span><b>Create / join organization</b><i>New tenant or invite code</i></span></a>
      </div>
      <div class="profile" id="mc-profile">
        <div class="avatar"></div>
        <div>
          <div class="name">Albert Drobo</div>
          <div class="handle">Attending · IM</div>
        </div>
        <span class="chev"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></span>
      </div>
      <div class="profile-menu" id="mc-profile-menu" role="menu">
        <div class="pm-head">
          <div class="pm-ava"></div>
          <div>
            <div class="pm-nm">Albert Drobo, MD</div>
            <div class="pm-em">a.drobo@mercy.health</div>
          </div>
        </div>
        <a class="pm-row" href="${base}pages/PatientProfile.html"><span>👤</span> My profile</a>
        <a class="pm-row" href="${base}pages/Settings.html"><span>⚙</span> Settings &amp; preferences</a>
        <a class="pm-row" href="${base}pages/Settings.html"><span>⚷</span> Security &amp; 2FA</a>
        <a class="pm-row" href="${base}pages/Signout.html"><span>↪</span> Hand-off / sign-out (clinical)</a>
        <div class="pm-sep"></div>
        <a class="pm-row" href="${base}pages/TenantSelector.html"><span>⇆</span> Switch organization</a>
        <a class="pm-row danger" href="${base}pages/Logout.html"><span>⤴</span> Sign out of Medcure</a>
      </div>
    </div>
  `;

  // Inject overflow CSS once
  if(!document.getElementById('mc-nav-overflow-css')){
    const st = document.createElement('style');
    st.id = 'mc-nav-overflow-css';
    st.textContent = `
      .tabs{position:relative;flex-wrap:nowrap;overflow:visible;min-width:0}
      .tabs .tab{white-space:nowrap;flex:none}
      .tab-more{cursor:pointer;display:inline-flex;align-items:center;gap:6px}
      .tab-menu{position:absolute;top:calc(100% + 8px);right:0;background:#fff;border-radius:14px;box-shadow:0 12px 32px rgba(14,17,22,.14),0 2px 6px rgba(14,17,22,.06);padding:6px;min-width:180px;display:none;z-index:50}
      .tab-menu.open{display:block}
      .tab-menu a{display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:9px;font:600 13px "Plus Jakarta Sans";color:var(--ink-soft,#5f6471);text-decoration:none}
      .tab-menu a:hover{background:#f4f6f9;color:var(--ink,#0e1116)}
      .tab-menu a.active{background:#0e1116;color:#fff}

      /* Tenant switcher */
      .nav-right{position:relative}
      .tenant-switch{display:inline-flex;align-items:center;gap:8px;background:#fafbfc;border:1px solid var(--line,#e6e8ee);border-radius:10px;padding:5px 10px 5px 5px;cursor:pointer;font-family:"Plus Jakarta Sans",sans-serif;transition:.15s;margin-right:4px}
      .tenant-switch:hover{border-color:#0e1116;background:#fff}
      .tenant-pic{width:26px;height:26px;border-radius:7px;background:#0e1116;color:#fff;display:grid;place-items:center;font-family:"Instrument Serif",serif;font-size:14px;flex:none}
      .tenant-meta{display:flex;flex-direction:column;align-items:flex-start;line-height:1.1}
      .tenant-name{font-size:11.5px;font-weight:800;color:var(--ink,#0e1116)}
      .tenant-loc{font-size:9.5px;color:var(--ink-mute,#8a8f9c);font-weight:600;margin-top:1px;text-transform:uppercase;letter-spacing:.04em}
      .tenant-switch .chev{color:var(--ink-mute,#8a8f9c);margin-left:2px}

      .tenant-menu{position:absolute;top:calc(100% + 6px);right:96px;background:#fff;border-radius:14px;box-shadow:0 16px 40px rgba(14,17,22,.16),0 2px 6px rgba(14,17,22,.06);padding:8px;min-width:280px;display:none;z-index:60;border:1px solid var(--line,#e6e8ee)}
      .tenant-menu.open{display:block}
      .tm-head{display:flex;justify-content:space-between;align-items:center;padding:6px 8px 8px}
      .tm-eyebrow{font-size:9.5px;font-weight:800;color:var(--ink-mute,#8a8f9c);text-transform:uppercase;letter-spacing:.06em}
      .tm-manage{font-size:10.5px;font-weight:700;color:var(--ink,#0e1116);text-decoration:none;border-bottom:1px solid var(--line,#e6e8ee)}
      .tm-row{display:grid;grid-template-columns:32px 1fr auto;gap:10px;align-items:center;padding:8px 10px;border-radius:9px;text-decoration:none;color:var(--ink,#0e1116);transition:.12s}
      .tm-row:hover{background:#fafbfc}
      .tm-row.act{background:#0e1116;color:#fff}
      .tm-row.act:hover{background:#0e1116}
      .tm-row b{display:block;font-size:12px;font-weight:800}
      .tm-row i{display:block;font-size:10px;font-style:normal;color:var(--ink-mute,#8a8f9c);margin-top:1px;font-weight:600}
      .tm-row.act i{color:rgba(255,255,255,.6)}
      .tm-pic{width:32px;height:32px;border-radius:8px;color:#fff;display:grid;place-items:center;font-family:"Instrument Serif",serif;font-size:15px}
      .tm-pic.plus{background:#fafbfc;color:var(--ink-mute,#8a8f9c);border:1.5px dashed var(--line,#cdd1da);font-family:"Plus Jakarta Sans";font-size:18px;font-weight:600}
      .tm-check{font-size:12px;font-weight:800;color:#27c26b}
      .tm-row.act .tm-check{color:#27c26b}
      .tm-row.pending b::after{content:" ⏳";font-size:9px}
      .tm-sep{height:1px;background:var(--line,#e6e8ee);margin:6px 8px}

      /* Profile menu */
      .profile{cursor:pointer;position:relative}
      .profile-menu{position:absolute;top:calc(100% + 6px);right:0;background:#fff;border-radius:14px;box-shadow:0 16px 40px rgba(14,17,22,.16),0 2px 6px rgba(14,17,22,.06);padding:6px;min-width:240px;display:none;z-index:60;border:1px solid var(--line,#e6e8ee)}
      .profile-menu.open{display:block}
      .pm-head{display:flex;gap:10px;padding:10px 10px 12px;border-bottom:1px solid var(--line,#e6e8ee);margin-bottom:4px}
      .pm-ava{width:36px;height:36px;border-radius:50%;background:url('https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=80&h=80&fit=crop&crop=faces') center/cover;flex:none}
      .pm-nm{font-size:12.5px;font-weight:800}
      .pm-em{font-size:10px;color:var(--ink-mute,#8a8f9c);font-family:"JetBrains Mono",monospace;margin-top:1px}
      .pm-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:9px;font-size:12px;font-weight:600;color:var(--ink-soft,#5f6471);text-decoration:none}
      .pm-row:hover{background:#fafbfc;color:var(--ink,#0e1116)}
      .pm-row.danger{color:#c43c3c}
      .pm-row.danger:hover{background:#ffe3e3;color:#a02828}
      .pm-row span{width:18px;display:inline-grid;place-items:center;font-size:13px}
      .pm-sep{height:1px;background:var(--line,#e6e8ee);margin:4px 8px}

      @media (max-width:980px){
        .tenant-meta,.profile>div:not(.avatar){display:none}
        .tenant-menu{right:60px}
      }
    `;
    document.head.appendChild(st);
  }

  const tabsEl = nav.querySelector('#mc-tabs');
  const moreBtn = nav.querySelector('#mc-more');
  const menu = nav.querySelector('#mc-menu');
  const tabEls = Array.from(tabsEl.querySelectorAll('a.tab[data-i]'));

  function fit(){
    // Reset visibility
    tabEls.forEach(el => el.style.display = '');
    moreBtn.style.display = 'none';
    menu.innerHTML = '';

    const navRect = nav.getBoundingClientRect();
    const right = nav.querySelector('.nav-right');
    const logo = nav.querySelector('.logo');
    const reserved = (logo?.offsetWidth || 0) + (right?.offsetWidth || 0) + 60; // gaps + padding
    const available = navRect.width - reserved;

    let used = 0;
    const moreW = 84; // approx width of More button
    const overflow = [];

    // First pass: measure each tab
    const widths = tabEls.map(el => el.offsetWidth + 6);

    let total = widths.reduce((a,b)=>a+b,0);
    if(total <= available){ return; } // fits, no overflow

    // Need overflow — keep tabs that fit before "More"
    const cap = available - moreW;
    used = 0;
    for(let i=0;i<tabEls.length;i++){
      if(used + widths[i] <= cap){
        used += widths[i];
      } else {
        overflow.push(tabEls[i]);
      }
    }
    overflow.forEach(el => el.style.display = 'none');

    if(overflow.length){
      moreBtn.style.display = 'inline-flex';
      menu.innerHTML = overflow.map(el => {
        const i = +el.dataset.i;
        const t = tabs[i];
        const active = cur === t.id ? 'active' : '';
        return `<a class="${active}" href="${base}${t.href}">${t.label}</a>`;
      }).join('');
    }
  }

  moreBtn.addEventListener('click', e => {
    e.stopPropagation();
    menu.classList.toggle('open');
    moreBtn.setAttribute('aria-expanded', menu.classList.contains('open'));
  });
  document.addEventListener('click', e => {
    if(!menu.contains(e.target) && e.target !== moreBtn){
      menu.classList.remove('open');
      moreBtn.setAttribute('aria-expanded','false');
    }
  });

  // Tenant switcher dropdown
  const tBtn = nav.querySelector('#mc-tenant');
  const tMenu = nav.querySelector('#mc-tenant-menu');
  const profile = nav.querySelector('#mc-profile');
  const pMenu = nav.querySelector('#mc-profile-menu');
  if(tBtn && tMenu){
    tBtn.addEventListener('click', e => { e.stopPropagation(); tMenu.classList.toggle('open'); pMenu?.classList.remove('open'); });
  }
  if(profile && pMenu){
    profile.addEventListener('click', e => { e.stopPropagation(); pMenu.classList.toggle('open'); tMenu?.classList.remove('open'); });
  }
  document.addEventListener('click', e => {
    if(tMenu && !tMenu.contains(e.target) && e.target !== tBtn && !tBtn.contains(e.target)) tMenu.classList.remove('open');
    if(pMenu && !pMenu.contains(e.target) && !profile.contains(e.target)) pMenu.classList.remove('open');
  });

  // Run after layout
  requestAnimationFrame(() => requestAnimationFrame(fit));
  if(window.ResizeObserver){
    new ResizeObserver(fit).observe(nav);
  } else {
    window.addEventListener('resize', fit);
  }
})();
