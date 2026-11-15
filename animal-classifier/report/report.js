/* Report page: sections are collapsed <details>. Opening a section from the "On this page" links
   (or from a #link in the address bar) expands it first, then scrolls to it.
   "Open all / Close all" toggles every section. External file because the CSP blocks inline scripts. */
(() => {
  'use strict';
  const all = () => [...document.querySelectorAll('main section > details')];
  const toggle = document.getElementById('toggle-all');

  function syncToggle() {
    if (!toggle) return;
    const anyClosed = all().some((d) => !d.open);
    toggle.textContent = anyClosed ? 'Open all sections' : 'Close all sections';
  }

  function openFromHash(scroll) {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    const section = document.getElementById(id);
    const details = section && section.querySelector(':scope > details');
    if (!details) return;
    details.open = true;
    if (scroll) section.scrollIntoView({ block: 'start' });
  }

  document.querySelectorAll('.secnav a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      history.replaceState(null, '', a.getAttribute('href'));
      openFromHash(true);
    });
  });
  window.addEventListener('hashchange', () => openFromHash(true));

  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = all().some((d) => !d.open);
      all().forEach((d) => { d.open = open; });
      syncToggle();
    });
  }
  all().forEach((d) => d.addEventListener('toggle', syncToggle));

  openFromHash(true);
  syncToggle();
})();
