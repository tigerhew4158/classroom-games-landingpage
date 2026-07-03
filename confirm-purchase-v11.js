
(function(){
  const LABELS = {
    zh: '确认购买',
    en: 'Confirm purchase',
    ms: 'Sahkan pembelian'
  };
  const QR_LABELS = {
    zh: "DuitNow / Touch 'n Go 付款二维码",
    en: "DuitNow / Touch 'n Go payment QR",
    ms: "Kod QR bayaran DuitNow / Touch 'n Go"
  };
  function lang(){
    const active = document.querySelector('.langBtn.active');
    const v = active ? active.dataset.lang : (localStorage.getItem('landing_lang_v4') || localStorage.getItem('landing_lang_v3') || 'zh');
    return ['zh','en','ms'].includes(v) ? v : 'zh';
  }
  function apply(){
    const btn = document.getElementById('copy');
    if(btn){
      const label = LABELS[lang()] || LABELS.zh;
      if(btn.textContent.trim() !== label) btn.textContent = label;
      btn.dataset.i = 'confirmPurchase';
      btn.classList.add('confirmPurchaseBtn');
    }
    const qrText = document.querySelector('.qrImageBox small');
    if(qrText){
      qrText.textContent = QR_LABELS[lang()] || QR_LABELS.zh;
    }
  }
  function ensureQr(){
    const qr = document.querySelector('.qrPlaceholder');
    if(qr && !qr.querySelector('img')){
      qr.classList.add('qrImageBox');
      qr.innerHTML = '<img src="assets/DUITNOW.png" alt="DuitNow / Touch n Go QR Payment"><small></small>';
    }
  }
  function init(){
    ensureQr();
    apply();
    document.querySelectorAll('.langBtn').forEach(btn=>btn.addEventListener('click',()=>setTimeout(apply,80)));
    const btn = document.getElementById('copy');
    if(btn){
      new MutationObserver(apply).observe(btn, {childList:true, subtree:true, characterData:true, attributes:true});
    }
    setInterval(apply, 1000);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
