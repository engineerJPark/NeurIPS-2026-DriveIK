/* Optional convenience only. All paper content, figures, tables and videos are HTML. */
'use strict';

const copyButton = document.getElementById('copy-bibtex');
const copyStatus = document.getElementById('copy-status');

if (copyButton) {
  copyButton.hidden = false;
  copyButton.addEventListener('click', async () => {
    const citation = document.getElementById('bibtex-code');
    let copied = false;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(citation.textContent);
        copied = true;
      }
    } catch (_) {
      // Fall back for browsers that restrict clipboard access.
    }

    if (!copied) {
      const field = document.createElement('textarea');
      field.value = citation.textContent;
      field.style.position = 'fixed';
      field.style.top = '-1000px';
      document.body.append(field);
      field.select();
      try { copied = document.execCommand('copy'); } catch (_) { copied = false; }
      field.remove();
      copyButton.focus({ preventScroll: true });
    }

    if (copied) {
      copyStatus.textContent = 'BibTeX copied.';
    } else {
      const range = document.createRange();
      range.selectNodeContents(citation);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      copyStatus.textContent = 'Copy the selected text, or use Download .bib.';
    }
  });
}
