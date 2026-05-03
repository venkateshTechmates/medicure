// Universal click-router for Medcure pages.
// Wires elements that look interactive (cards, rows, buttons) to their destination pages,
// using selector→href mappings. Also adds visual hover affordances so users see what's clickable.
//
// Each page sets `window.MC_ROUTES = [{sel: '...', href: '...', cursor: 'pointer'}]` BEFORE this script loads.
// We attach delegated listeners and wrap matching elements in <a>-like behaviour (window.location).
(function(){
  const routes = window.MC_ROUTES || [];

  // Inject hover affordance CSS
  if(!document.getElementById('mc-router-css')){
    const st = document.createElement('style');
    st.id = 'mc-router-css';
    st.textContent = `
      [data-mc-go]{cursor:pointer;transition:transform .15s ease, box-shadow .15s ease}
      [data-mc-go]:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(16,18,23,.10)}
      [data-mc-go]:active{transform:translateY(0)}
      [data-mc-go-soft]{cursor:pointer;transition:opacity .15s ease, background .15s ease}
      [data-mc-go-soft]:hover{opacity:.78}
    `;
    document.head.appendChild(st);
  }

  // Tag matching elements
  routes.forEach(r => {
    const els = document.querySelectorAll(r.sel);
    els.forEach(el => {
      el.dataset.mcGo = r.href;
      if(r.soft) el.dataset.mcGoSoft = '1';
      if(r.title) el.title = r.title;
    });
  });

  // Delegated click
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-mc-go]');
    if(!el) return;
    // Don't hijack actual <a> or <button> links/forms inside
    const innerLink = e.target.closest('a[href], button[type="submit"]');
    if(innerLink && innerLink !== el) return;
    const href = el.dataset.mcGo;
    if(!href) return;
    if(e.metaKey || e.ctrlKey || e.button === 1){
      window.open(href, '_blank');
    } else {
      window.location.href = href;
    }
  });
})();
