
(function(){
  const TIGER_EMAIL = 'tigerhew@gmail.com';

  const I18N_CONFIRM = {
    zh: {
      confirmPurchase: '确认购买',
      alertMsg: '谢谢您的购买，已完成购买程序，系统会在24小时内处理。请耐心等候。\n\n系统会通过电邮，发送游戏平台登入账号及密码。',
      mailSubject: '课堂游戏网站购买订单',
      mailIntro: '阿虎老师您好，以下是课堂游戏网站购买订单：',
      mailFooter: '系统通知：收据将发送至购买者电邮，游戏平台登入账号及密码将在24小时内发送至电邮。',
      needEmail: '请先填写购买者电邮地址。'
    },
    en: {
      confirmPurchase: 'Confirm purchase',
      alertMsg: 'Thank you for your purchase. The purchase process has been completed. The system will process it within 24 hours. Please wait patiently.\n\nThe game platform login account and password will be sent to you by email.',
      mailSubject: 'Classroom Game Website Purchase Order',
      mailIntro: 'Dear Teacher Ah Hu, here is the classroom game website purchase order:',
      mailFooter: 'System notice: The receipt will be sent to the buyer’s email. The game platform login account and password will be emailed within 24 hours.',
      needEmail: 'Please fill in the buyer email address first.'
    },
    ms: {
      confirmPurchase: 'Sahkan pembelian',
      alertMsg: 'Terima kasih atas pembelian anda. Proses pembelian telah selesai. Sistem akan memprosesnya dalam masa 24 jam. Sila tunggu dengan sabar.\n\nAkaun log masuk dan kata laluan platform permainan akan dihantar melalui e-mel.',
      mailSubject: 'Pesanan Pembelian Laman Permainan Kelas',
      mailIntro: 'Cikgu Ah Hu, berikut ialah pesanan pembelian laman permainan kelas:',
      mailFooter: 'Notis sistem: Resit akan dihantar ke e-mel pembeli. Akaun log masuk dan kata laluan platform permainan akan dihantar melalui e-mel dalam masa 24 jam.',
      needEmail: 'Sila isi alamat e-mel pembeli terlebih dahulu.'
    }
  };

  function currentLang(){
    const active = document.querySelector('.langBtn.active');
    const lang = active ? active.dataset.lang : (localStorage.getItem('landing_lang_v4') || localStorage.getItem('landing_lang_v3') || 'zh');
    return ['zh','en','ms'].includes(lang) ? lang : 'zh';
  }
  function t(key){
    return (I18N_CONFIRM[currentLang()] && I18N_CONFIRM[currentLang()][key]) || I18N_CONFIRM.zh[key] || key;
  }
  function updateButtonText(){
    const btn = document.getElementById('copy');
    if(!btn) return;
    btn.textContent = t('confirmPurchase');
    btn.classList.add('confirmPurchaseBtn');
  }
  function generateLatestOrderText(){
    try{
      const gen = document.getElementById('gen');
      if(gen) gen.click();
    }catch(e){}
    const preview = document.getElementById('preview');
    return preview ? preview.textContent.trim() : '';
  }
  function sendEmailToTiger(orderText){
    const buyerEmail = (document.getElementById('buyerEmail') && document.getElementById('buyerEmail').value.trim()) || '';
    if(!buyerEmail){
      alert(t('needEmail'));
      return false;
    }
    const body = `${t('mailIntro')}\n\n${orderText}\n\nBuyer email / 购买者电邮: ${buyerEmail}\n\n${t('mailFooter')}`;
    const mailto = `mailto:${TIGER_EMAIL}?subject=${encodeURIComponent(t('mailSubject'))}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    return true;
  }
  function confirmPurchase(e){
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const orderText = generateLatestOrderText();
    alert(t('alertMsg'));
    sendEmailToTiger(orderText);
  }
  function bind(){
    const btn = document.getElementById('copy');
    if(btn){
      updateButtonText();
      btn.onclick = confirmPurchase;
    }

    document.querySelectorAll('.langBtn').forEach(btn=>{
      btn.addEventListener('click', ()=>setTimeout(updateButtonText, 80));
    });

    setTimeout(updateButtonText, 200);
    setTimeout(updateButtonText, 800);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
