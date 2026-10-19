// ═══════════════════════════════════════════════════════════════
// CONFIRM MODAL
// File: assets/js/confrim modal.js
// ═══════════════════════════════════════════════════════════════
function renderConfirmModal() {
  const modal = state.confirmModal;
  if (!modal) return '';
  
  return `
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-overlay">
      <div class="glass-strong rounded-3xl p-8 max-w-md w-full animate-scale text-center">
        <div class="text-6xl mb-5">${modal.icon || '❓'}</div>
        <h2 class="text-xl font-bold mb-3">${modal.title}</h2>
        <p class="text-white/70 text-sm mb-8 leading-relaxed">${modal.message}</p>
        ${modal.requirePhrase ? `
        <div class="mb-5 text-right">
          <label class="block text-xs text-white/60 mb-1.5">برای تایید، عبارت «<b dir="ltr" class="text-rose-300">${modal.requirePhrase}</b>» را وارد کنید:</label>
          <input id="confirm-phrase-input" class="input-style w-full text-center" dir="auto" placeholder="${modal.requirePhrase}">
        </div>` : ''}
        <div class="flex gap-4">
          <button 
            onclick="state.confirmModal = null; render()" 
            class="flex-1 btn-ghost py-3.5 rounded-xl font-semibold transition-all"
          >
            انصراف
          </button>
          <button 
            onclick="(function(){ if(window.__aryConfirmPhrase && !window.__aryConfirmPhrase()) return; if(window.__aryConfirmValidate && !window.__aryConfirmValidate()) return; state.confirmModal.onConfirm(); })()" 
            class="flex-1 ${modal.confirmClass || 'btn-primary'} py-3.5 rounded-xl font-semibold transition-all"
          >
            ${modal.confirmText || 'تایید'}
          </button>
        </div>
      </div>
    </div>
  `;
}

// اگر مودال اعتبارسنجی سفارشی بخواهد (validate: () => bool) — مثل فرم دلیل لغو
window.__aryConfirmValidate = function () {
  const m = window.state && state.confirmModal;
  if (!m || typeof m.validate !== 'function') return true;
  try { return !!m.validate(); } catch (e) { console.warn('[confirm] validate', e); return true; }
};

// اگر مودال «عبارت تایید» بخواهد، قبل از onConfirm بررسی می‌شود
window.__aryConfirmPhrase = function () {
  const m = window.state && state.confirmModal;
  if (!m || !m.requirePhrase) return true;
  const el = document.getElementById('confirm-phrase-input');
  const val = String((el && el.value) || '').trim();
  if (val !== String(m.requirePhrase).trim()) {
    if (window.toast) toast('عبارت تایید درست وارد نشده است', 'warning');
    if (el) { el.focus(); el.classList.add('ring-2','ring-rose-500/60'); setTimeout(()=>el.classList.remove('ring-2','ring-rose-500/60'),900); }
    return false;
  }
  return true;
};
