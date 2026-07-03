
(function(){
  const API_ENDPOINT = '/api/confirm-purchase';
  const AHU_WHATSAPP = '60167895429';

  const I18N_CONFIRM = {
    zh: {
      confirmPurchase: '确认购买',
      sending: '正在提交订单...',
      success: '谢谢您的购买，已完成购买程序，系统会在24小时内处理。请耐心等候。\n\n系统会通过电邮，发送游戏平台登入账号及密码。\n\n系统也已打开 WhatsApp 订单讯息，请按发送给阿虎老师。',
      fail: '订单提交失败，请检查网络或联系阿虎老师。',
      needEmail: '请先填写购买者电邮地址。',
      needName: '请先填写购买者姓名。',
      fileTooLarge: '付款截图太大，请上传 4MB 以下的图片或PDF。',
      whatsappTitle: '课堂游戏网站购买订单',
      whatsappIntro: '阿虎老师您好，以下是课堂游戏网站购买订单：',
      popupBlocked: '订单电邮已发送。WhatsApp 视窗可能被浏览器阻挡，请点击下方 WhatsApp 按钮手动发送。'
    },
    en: {
      confirmPurchase: 'Confirm purchase',
      sending: 'Submitting order...',
      success: 'Thank you for your purchase. The purchase process has been completed. The system will process it within 24 hours. Please wait patiently.\n\nThe game platform login account and password will be sent to you by email.\n\nA WhatsApp order message has also been opened. Please press Send to notify Teacher Ah Hu.',
      fail: 'Order submission failed. Please check your network or contact Teacher Ah Hu.',
      needEmail: 'Please fill in the buyer email address first.',
      needName: 'Please fill in the buyer name first.',
      fileTooLarge: 'The payment screenshot is too large. Please upload an image or PDF under 4MB.',
      whatsappTitle: 'Classroom Game Website Purchase Order',
      whatsappIntro: 'Dear Teacher Ah Hu, here is the classroom game website purchase order:',
      popupBlocked: 'The order email has been sent. The WhatsApp window may have been blocked by the browser. Please use the WhatsApp button below to send it manually.'
    },
    ms: {
      confirmPurchase: 'Sahkan pembelian',
      sending: 'Sedang menghantar pesanan...',
      success: 'Terima kasih atas pembelian anda. Proses pembelian telah selesai. Sistem akan memprosesnya dalam masa 24 jam. Sila tunggu dengan sabar.\n\nAkaun log masuk dan kata laluan platform permainan akan dihantar melalui e-mel.\n\nMesej pesanan WhatsApp juga telah dibuka. Sila tekan Hantar kepada Cikgu Ah Hu.',
      fail: 'Penghantaran pesanan gagal. Sila semak rangkaian atau hubungi Cikgu Ah Hu.',
      needEmail: 'Sila isi alamat e-mel pembeli terlebih dahulu.',
      needName: 'Sila isi nama pembeli terlebih dahulu.',
      fileTooLarge: 'Tangkapan skrin bayaran terlalu besar. Sila muat naik imej atau PDF di bawah 4MB.',
      whatsappTitle: 'Pesanan Pembelian Laman Permainan Kelas',
      whatsappIntro: 'Cikgu Ah Hu, berikut ialah pesanan pembelian laman permainan kelas:',
      popupBlocked: 'E-mel pesanan telah dihantar. Tetingkap WhatsApp mungkin disekat oleh pelayar. Sila gunakan butang WhatsApp di bawah untuk menghantarnya secara manual.'
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
  function buyerInfo(){
    return {
      name: (document.getElementById('buyerName') && document.getElementById('buyerName').value.trim()) || '',
      phone: (document.getElementById('buyerPhone') && document.getElementById('buyerPhone').value.trim()) || '',
      email: (document.getElementById('buyerEmail') && document.getElementById('buyerEmail').value.trim()) || ''
    };
  }
  function generateLatestOrderText(){
    try{
      if(typeof generateOrder === 'function') generateOrder();
      const gen = document.getElementById('gen');
      if(gen) gen.click();
    }catch(e){}
    const preview = document.getElementById('preview');
    return preview ? preview.textContent.trim() : '';
  }
  function fileToBase64(file){
    return new Promise((resolve, reject)=>{
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve({ filename: file.name, mimeType: file.type || 'application/octet-stream', contentBase64: base64 });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  async function getProofPayload(){
    const input = document.getElementById('paymentProof');
    const file = input && input.files && input.files[0];
    if(!file) return null;
    if(file.size > 4 * 1024 * 1024){
      throw new Error('FILE_TOO_LARGE');
    }
    return fileToBase64(file);
  }
  function buildWhatsAppLink(orderText){
    const message = `${t('whatsappIntro')}\n\n${orderText}`;
    return `https://wa.me/${AHU_WHATSAPP}?text=${encodeURIComponent(message)}`;
  }
  function updateWhatsAppButton(orderText){
    const wa = document.getElementById('whatsappOrder');
    if(wa) wa.href = buildWhatsAppLink(orderText || generateLatestOrderText());
  }
  async function confirmPurchase(e){
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const info = buyerInfo();
    if(!info.name){ alert(t('needName')); return; }
    if(!info.email){ alert(t('needEmail')); return; }

    const btn = document.getElementById('copy');
    const oldText = btn ? btn.textContent : '';
    if(btn){ btn.disabled = true; btn.textContent = t('sending'); }

    let whatsappWindow = null;
    try{
      // Open a blank tab immediately during the user click to avoid popup blockers.
      whatsappWindow = window.open('', '_blank');
      if(whatsappWindow){
        whatsappWindow.document.write('<p style="font-family:Arial,sans-serif;padding:20px">Preparing WhatsApp message...</p>');
      }
    }catch(e){ whatsappWindow = null; }

    try{
      const orderText = generateLatestOrderText();
      const proof = await getProofPayload();
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lang: currentLang(),
          buyer: info,
          orderText,
          paymentProof: proof,
          pageUrl: location.href,
          submittedAt: new Date().toISOString()
        })
      });
      const data = await response.json().catch(()=>({}));
      if(!response.ok || !data.ok){
        throw new Error(data.error || 'SUBMIT_FAILED');
      }

      const waLink = buildWhatsAppLink(orderText);
      updateWhatsAppButton(orderText);
      if(whatsappWindow){
        whatsappWindow.location.href = waLink;
      }else{
        // Fallback: set manual WhatsApp button link and let buyer click it.
        console.warn(t('popupBlocked'));
      }
      alert(t('success'));
    }catch(err){
      console.error(err);
      if(whatsappWindow && !whatsappWindow.closed) whatsappWindow.close();
      if(err && err.message === 'FILE_TOO_LARGE') alert(t('fileTooLarge'));
      else alert(t('fail') + (err && err.message ? '\n' + err.message : ''));
    }finally{
      if(btn){ btn.disabled = false; btn.textContent = oldText || t('confirmPurchase'); updateButtonText(); }
    }
  }
  function bind(){
    const btn = document.getElementById('copy');
    if(btn){
      updateButtonText();
      btn.onclick = confirmPurchase;
    }
    const wa = document.getElementById('whatsappOrder');
    if(wa){
      wa.addEventListener('click', ()=>updateWhatsAppButton());
    }
    document.querySelectorAll('.langBtn').forEach(btn=>{
      btn.addEventListener('click', ()=>setTimeout(()=>{ updateButtonText(); updateWhatsAppButton(); }, 80));
    });
    setTimeout(()=>{ updateButtonText(); updateWhatsAppButton(); }, 200);
    setTimeout(()=>{ updateButtonText(); updateWhatsAppButton(); }, 800);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
