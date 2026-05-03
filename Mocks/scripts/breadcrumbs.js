// Shared breadcrumb component for Medcure detail pages.
// Render anywhere by setting data-bc='[{"label":"Patients","href":"Patients.html"}, ...]' on a container.
(function(){
  const els = document.querySelectorAll('[data-bc]');
  els.forEach(host => {
    let crumbs = [];
    try { crumbs = JSON.parse(host.dataset.bc); } catch(e){ return; }
    const sep = '<span class="bc-sep"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg></span>';
    host.classList.add('bc-bar');
    host.innerHTML = crumbs.map((c,i) => {
      const last = i === crumbs.length - 1;
      if(last) return `<span class="bc-cur">${c.label}</span>`;
      return `<a class="bc-link" href="${c.href}">${c.label}</a>${sep}`;
    }).join('');
  });

  if(!document.getElementById('mc-bc-css')){
    const st = document.createElement('style');
    st.id = 'mc-bc-css';
    st.textContent = `
      .bc-bar{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--ink-mute);margin:6px 4px 14px;flex-wrap:wrap}
      .bc-link{color:var(--ink-soft);text-decoration:none;font-weight:600;padding:4px 8px;border-radius:8px;transition:.15s}
      .bc-link:hover{background:#fff;color:var(--ink)}
      .bc-sep{color:var(--ink-mute);display:inline-grid;place-items:center}
      .bc-cur{color:var(--ink);font-weight:700;padding:4px 8px}
    `;
    document.head.appendChild(st);
  }
})();
