/* Studio Aerith — Split Sections (vanilla JS) */
(function () {
  const SELECTOR = '[data-sa-plugin="split-sections"]';

  // Squarespace section elements vary. This targets the common cases.
  function findSectionEl(el) {
    return (
      el.closest('section') ||
      el.closest('.page-section') ||
      el.closest('[data-section-id]')
    );
  }

  function parseWidths(str, count) {
    if (!str) return Array(count).fill(100 / count + '%');
    const parts = str.split(',').map(s => s.trim()).filter(Boolean);
    // If fewer widths provided than count, fill the rest equally
    while (parts.length < count) parts.push(100 / count + '%');
    return parts.slice(0, count);
  }

  function getStickyTop() {
    // Try to account for fixed headers; fallback to 0.
    // Squarespace often sets CSS vars like --header-height; we can’t rely on it, but we try.
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

    // Collect the sections: firstSection + next (count-1) section siblings
    const sections = [firstSection];
    let sib = firstSection.nextElementSibling;

    while (sib && sections.length < count) {
      // Only include elements that look like sections
      const isSection =
        sib.tagName.toLowerCase() === 'section' ||
        sib.classList.contains('page-section') ||
        sib.hasAttribute('data-section-id');

      if (isSection) sections.push(sib);
      sib = sib.nextElementSibling;
    }

    // If we didn’t find enough sections, do nothing
    if (sections.length < count) return;

    // Prevent double-initialization
    if (firstSection.previousElementSibling?.classList?.contains('sa-split-wrap')) return;

    const wrap = document.createElement('div');
    wrap.className = 'sa-split-wrap';

    // Settings
    const widths = parseWidths(marker.getAttribute('data-split-widths'), count);

    const stickyIndex = parseInt(marker.getAttribute('data-sticky-section') || '0', 10); // 1-based; 0 disables
    const border = marker.getAttribute('data-border') || '0px';
    const borderColor = marker.getAttribute('data-border-color') || 'transparent';
    const background = marker.getAttribute('data-background') || 'transparent';
    const mobileReverse = (marker.getAttribute('data-mobile-reverse') || 'false').toLowerCase() === 'true';
    const mobileBreakpoint = parseInt(marker.getAttribute('data-mobile-breakpoint') || '799', 10);

    wrap.style.setProperty('--sa-border', border);
    wrap.style.setProperty('--sa-border-color', borderColor);
    wrap.style.setProperty('--sa-background', background);
    wrap.style.setProperty('--sa-sticky-top', getStickyTop());

    // Insert wrapper before first section, then move sections into it as panels
    firstSection.parentNode.insertBefore(wrap, firstSection);

    sections.forEach((sec, i) => {
      sec.classList.add('sa-split-panel');
      sec.style.width = widths[i];

      // Sticky (1-based index)
      if (stickyIndex === i + 1) sec.classList.add('sa-sticky');

      // Order (mobile reverse handled by JS + class on wrap)
      if (mobileReverse) sec.style.order = String(count - i);
      else sec.style.order = String(i + 1);

      wrap.appendChild(sec);
    });

    // Mobile stacking at custom breakpoint:
    // We can’t write dynamic media queries per instance easily, so we toggle class based on window width.
    function updateMobile() {
      if (window.innerWidth <= mobileBreakpoint) wrap.classList.add('sa-mobile-stack');
      else wrap.classList.remove('sa-mobile-stack');
    }
    updateMobile();
    window.addEventListener('resize', updateMobile, { passive: true });

    // Remove the marker block so it doesn’t render spacing
    // (Keep it if you prefer; up to you.)
    marker.style.display = 'none';
  }

  function init() {
    // Don't run in Squarespace editor too aggressively
    const isEditMode = document.body.classList.contains('sqs-edit-mode-active');
    document.querySelectorAll(SELECTOR).forEach(marker => {
      if (isEditMode) return;
      applySplit(marker);
    });
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
