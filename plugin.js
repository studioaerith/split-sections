/* Studio Aerith — Split Sections (vanilla JS) */
(function () {
  const SELECTOR = '[data-sa-plugin="split-sections"]';

  // Squarespace section elements vary. This targets ALL known variants.
  function findSectionEl(el) {
    return (
      el.closest('[data-section-id]') ||
      el.closest('section') ||
      el.closest('.page-section') ||
      el.closest('[data-block-id]')
    );
  }

  function parseWidths(str, count) {
    if (!str) return Array(count).fill(100 / count + '%');
    const parts = str.split(',').map(s => s.trim()).filter(Boolean);
    while (parts.length < count) parts.push(100 / count + '%');
    return parts.slice(0, count);
  }

  function getStickyTop() {
    const root = document.documentElement;
    const headerHeight =
      getComputedStyle(root).getPropertyValue('--header-height') ||
      getComputedStyle(root).getPropertyValue('--sa-header-height') ||
      '0px';
    return headerHeight.trim() || '0px';
  }

  function applySplit(marker) {
    const firstSection = findSectionEl(marker);
    if (!firstSection) return;

    const count = Math.max(2, parseInt(marker.getAttribute('data-split-count') || '2', 10));

    const sections = [firstSection];
    let sib = firstSection.nextElementSibling;

    while (sib && sections.length < count) {
      const isSection =
        sib.hasAttribute('data-section-id') ||
        sib.tagName.toLowerCase() === 'section' ||
        sib.classList.contains('page-section');

      if (isSection) sections.push(sib);
      sib = sib.nextElementSibling;
    }

    if (sections.length < count) return;

    if (firstSection.previousElementSibling?.classList?.contains('sa-split-wrap')) return;

    const wrap = document.createElement('div');
    wrap.className = 'sa-split-wrap';

    const widths = parseWidths(marker.getAttribute('data-split-widths'), count);

    const stickyIndex = parseInt(marker.getAttribute('data-sticky-section') || '0', 10);
    const border = marker.getAttribute('data-border') || '0px';
    const borderColor = marker.getAttribute('data-border-color') || 'transparent';
    const mobileReverse = (marker.getAttribute('data-mobile-reverse') || 'false').toLowerCase() === 'true';
    const mobileBreakpoint = parseInt(marker.getAttribute('data-mobile-breakpoint') || '799', 10);

    wrap.style.setProperty('--sa-border', border);
    wrap.style.setProperty('--sa-border-color', borderColor);
    wrap.style.setProperty('--sa-sticky-top', getStickyTop());

    firstSection.parentNode.insertBefore(wrap, firstSection);

    sections.forEach((sec, i) => {
      sec.classList.add('sa-split-panel');
      sec.style.width = widths[i];

      if (stickyIndex === i + 1) sec.classList.add('sa-sticky');

      sec.style.order = mobileReverse ? String(count - i) : String(i + 1);

      wrap.appendChild(sec);
    });

    function updateMobile() {
      if (window.innerWidth <= mobileBreakpoint) wrap.classList.add('sa-mobile-stack');
      else wrap.classList.remove('sa-mobile-stack');
    }

    updateMobile();
    window.addEventListener('resize', updateMobile, { passive: true });

    marker.style.display = 'none';
  }

  function init() {
    const isEditMode = document.body.classList.contains('sqs-edit-mode-active');
    document.querySelectorAll(SELECTOR).forEach(marker => {
      if (isEditMode) return;
      applySplit(marker);
    });
  }

  // Wait for Squarespace to finish injecting sections
  function waitForSquarespace() {
    const ready =
      document.querySelector('[data-section-id]') ||
      document.querySelector('section') ||
      document.querySelector('.page-section');

    if (ready) {
      init();
    } else {
      setTimeout(waitForSquarespace, 200);
    }
  }

  waitForSquarespace();
})();
