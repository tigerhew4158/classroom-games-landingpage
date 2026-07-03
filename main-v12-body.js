const LEVEL_ORDER={S:1,P:2,H:3};
const HERO={zh:'assets/hero/hero_zh.jpg',en:'assets/hero/hero_en.jpg',ms:'assets/hero/hero_ms.jpg'};
const AHU_WHATSAPP='60167895429';
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
let lang=localStorage.getItem('landing_lang_v12')||'zh';
let currentFilter='all', currentModal=null, currentModalView='screen';
function t(k){return (I18N[lang]&&I18N[lang][k])||I18N.zh[k]||k;}
function gt(g){return g[lang]||g.zh;}
function gname(g){return gt(g).name||g.code;}
function gdesc(g){return gt(g).desc||'';}
function levelLabel(l){return l==='S'?t('beginner'):l==='P'?t('advanced'):t('high');}
function sortedGames(){return [...GAMES].sort((a,b)=>(LEVEL_ORDER[a.level]-LEVEL_ORDER[b.level])||a.code.localeCompare(b.code));}
function plan(){return $('#plan')?.value||'single';}
function selectedGames(){if(plan()==='all')return sortedGames();return $$('#purchaseList input:checked').map(cb=>GAMES.find(g=>g.code===cb.value)).filter(Boolean);}
function originalTotal(){if(plan()==='all')return 730;return selectedGames().reduce((s,g)=>s+g.price,0);}
function specialTotal(){if(plan()==='all')return 400;if(plan()==='bundle')return 100;return originalTotal();}
function saving(){return Math.max(0,originalTotal()-specialTotal());}
function savingPercent(){return originalTotal()?Math.round(saving()/originalTotal()*100):0;}
function setLanguage(newLang){lang=newLang;localStorage.setItem('landing_lang_v12',lang);applyText();renderGames(currentFilter);renderPurchase();updateSummary();generateOrder();if(currentModal)openModal(currentModal,currentModalView,false);}
function applyText(){
 document.documentElement.lang=lang==='zh'?'zh-CN':lang;
 $$('.langBtn').forEach(b=>b.classList.toggle('active',b.dataset.lang===lang));
 $$('[data-i]').forEach(el=>{const key=el.dataset.i;if(t(key)!==key)el.textContent=t(key);});
 $$('[data-ph]').forEach(el=>{const key=el.dataset.ph;if(t(key)!==key)el.placeholder=t(key);});
 if($('#heroLangImage'))$('#heroLangImage').src=HERO[lang]||HERO.zh;
 if($('#plan')){$('#plan').options[0].textContent=t('singlePlan');$('#plan').options[1].textContent=t('bundlePlan');$('#plan').options[2].textContent=t('allPlan');}
 if($('#payAmount'))$('#payAmount').textContent='RM'+specialTotal();
}
function renderGames(filter='all'){
 currentFilter=filter;
 const list=sortedGames().filter(g=>filter==='all'||g.level===filter);
 $('#gameGrid').innerHTML=list.map(g=>`<article class="gameCard level-${g.level}"><div class="gameThumb"><img src="${g.screen}" alt="${gname(g)}"><span class="codeBadge">${g.code}</span><span class="levelBadge">${levelLabel(g.level)}</span></div><div class="gameBody"><h3>${gname(g)}</h3><p>${gdesc(g)}</p><div class="gameMeta"><span>${t('modalPrice')} RM${g.price}</span><span>${t('modalFormat')}：${gt(g).format||''}</span></div><div class="gameActions"><button class="miniBtn" data-code="${g.code}" data-view="screen">${t('modalOpenIntro')}</button><button class="miniBtn primary" data-code="${g.code}" data-view="promo">${t('modalOpenPromo')}</button></div></div></article>`).join('');
 $$('.miniBtn').forEach(btn=>btn.onclick=()=>openModal(btn.dataset.code,btn.dataset.view));
 $$('.filter').forEach(b=>b.classList.toggle('active',b.dataset.f===filter));
}
function detail(title,body){return `<div class="detailCard"><h4>${title}</h4><p>${body||'-'}</p></div>`;}
function openModal(code,view='screen',show=true){
 const g=GAMES.find(x=>x.code===code); if(!g)return; currentModal=code; currentModalView=view; const info=gt(g); const img=view==='promo'?g.promo:g.screen;
 $('#modalBody').innerHTML=`<div class="modalContent"><div class="modalTop"><div class="previewPanel"><div class="previewTabs"><button class="previewTab ${view==='screen'?'active':''}" data-view="screen">${t('modalScreen')}</button><button class="previewTab ${view==='promo'?'active':''}" data-view="promo">${t('modalPromo')}</button></div><div class="previewFrame"><img id="modalPreviewImage" src="${img}" alt="${gname(g)}"><button class="viewSingle" id="viewSingleBtn">${view==='promo'?t('modalViewPromo'):t('modalViewScreen')}</button></div></div><div class="infoPanel"><div class="titleLine"><span class="codeChip">${g.code}</span><span class="levelChip">${levelLabel(g.level)}</span></div><h2>${info.name}</h2><p>${info.desc}</p><div class="highlights">${(info.highlights||[]).map(h=>`<span class="highlight">✨ ${h}</span>`).join('')}</div><div class="detailGrid">${detail(t('modalSubjects'),info.subjects)}${detail(t('modalCore'),info.core)}${detail(t('modalPrep'),info.prep)}${detail(t('modalScenes'),info.scenes)}</div><div class="metaRow"><div class="formatCard"><h4>${t('modalFormat')}</h4><p>${info.format||'-'}</p></div><div class="formatCard"><h4>${t('modalPrice')}</h4><p>RM${g.price}</p></div></div><div class="ctaRow"><button class="btn primary" id="modalBuyBtn">${t('chooseSingle')}</button><button class="btn glass" id="modalPromoBtn">${t('modalOpenPromo')}</button></div></div></div></div>`;
 $$('.previewTab').forEach(tab=>tab.onclick=()=>openModal(code,tab.dataset.view));
 $('#viewSingleBtn').onclick=()=>openLightbox(img);
 $('#modalBuyBtn').onclick=()=>{ $('#modal').classList.add('hidden'); $('#plan').value='single'; renderPurchase(); const cb=$(`#purchaseList input[value="${code}"]`); if(cb)cb.checked=true; updateSummary();generateOrder();document.querySelector('#checkoutFlow')?.scrollIntoView({behavior:'smooth'}); };
 $('#modalPromoBtn').onclick=()=>openModal(code,'promo');
 if(show)$('#modal').classList.remove('hidden');
}
function openLightbox(src){$('#lightboxImg').src=src;$('#lightbox').classList.remove('hidden');}
function groupHtml(title,cls,games,hint,checked=false,disabled=false){return `<div class="purchaseGroup level-${cls}"><div class="groupTitle"><span>${title}</span><span class="groupHint">${hint||''}</span></div><div class="groupList">${games.map(g=>`<label class="purchase level-${g.level}"><input type="checkbox" value="${g.code}" ${checked?'checked':''} ${disabled?'disabled':''}><span><span class="levelMini">${levelLabel(g.level)}</span> ${g.code} ${gname(g)}</span><strong>RM${g.price}</strong></label>`).join('')}</div></div>`;}
function renderPurchase(){
 const list=sortedGames(),s=list.filter(g=>g.level==='S'),p=list.filter(g=>g.level==='P'),h=list.filter(g=>g.level==='H'),sp=list.filter(g=>g.level==='S'||g.level==='P');
 if(plan()==='single'){ $('#planGuide').textContent=t('singleGuide'); $('#purchaseList').innerHTML=groupHtml(t('beginnerGroup'),'S',s,'RM20')+groupHtml(t('advancedGroup'),'P',p,'RM30')+groupHtml(t('highGroup'),'H',h,'RM50'); }
 else if(plan()==='bundle'){ $('#planGuide').textContent=t('bundleGuide'); $('#purchaseList').innerHTML=groupHtml(t('beginnerAdvancedGroup'),'P',sp,t('choose4'))+groupHtml(t('highGroup'),'H',h,t('choose1')); }
 else{ $('#planGuide').textContent=t('allGuide'); $('#purchaseList').innerHTML=groupHtml(t('beginnerGroup'),'S',s,t('includedAll'),true,true)+groupHtml(t('advancedGroup'),'P',p,t('includedAll'),true,true)+groupHtml(t('highGroup'),'H',h,t('includedAll'),true,true); }
 $$('#purchaseList input').forEach(cb=>cb.onchange=()=>{limitSelection(cb);updateSummary();generateOrder();hidePayment();});
}
function limitSelection(changed){ if(plan()!=='bundle')return; const g=GAMES.find(x=>x.code===changed.value); const ch=$$('#purchaseList input:checked'); const sp=ch.filter(cb=>{const gg=GAMES.find(x=>x.code===cb.value);return gg&&(gg.level==='S'||gg.level==='P')}); const hs=ch.filter(cb=>{const gg=GAMES.find(x=>x.code===cb.value);return gg&&gg.level==='H'}); if((g.level==='S'||g.level==='P')&&sp.length>4)changed.checked=false; if(g.level==='H'&&hs.length>1)changed.checked=false; }
function status(){ const sel=selectedGames(); if(plan()==='all')return{ok:true,msg:t('includedAll')}; if(plan()==='single')return{ok:sel.length>0,msg:sel.length?`${t('selectedCount')}：${sel.length}`:t('needSingle')}; const sp=sel.filter(g=>g.level==='S'||g.level==='P').length,h=sel.filter(g=>g.level==='H').length; return{ok:sp===4&&h===1,msg:`${t('beginnerAdvancedGroup')} ${sp}/4 ｜ ${t('highGroup')} ${h}/1`}; }
function discountHtml(){return `<div class="discountRows"><div class="discountRow"><span>${t('originalPrice')}</span><strong>RM${originalTotal()}</strong></div><div class="discountRow"><span>${t('specialPrice')}</span><strong>RM${specialTotal()}</strong></div><div class="discountRow saving"><span>${t('saving')}</span><strong>RM${saving()}${saving()?`（${t('savingPercent')} ${savingPercent()}%）`:''}</strong></div></div>`;}
function updateSummary(){ const sel=selectedGames(),st=status(); $('#payAmount')&&($('#payAmount').textContent='RM'+specialTotal()); $('#confirmSelection').disabled=!st.ok; $('#selectionSummary').innerHTML=`<h4>${t('orderConfirmTitle')}</h4><div><b>${t('orderPlan')}：</b>${$('#plan').selectedOptions[0].textContent}</div>${discountHtml()}<div class="${st.ok?'':'warning'}">${st.msg}</div><div class="summaryItems">${sel.map(g=>`<div class="summaryItem"><span>${g.code} · ${levelLabel(g.level)} · ${gname(g)}</span><strong>RM${g.price}</strong></div>`).join('')}</div>`; }
function hidePayment(){ $('#paymentPanel')?.classList.add('hidden'); }
function showPayment(){ const st=status(); if(!st.ok)return alert(st.msg); $('#paymentPanel')?.classList.remove('hidden'); generateOrder(); }
function orderText(){ const sel=selectedGames(); const games=plan()==='all'?'ALL / 全站模板':sel.map(g=>`${g.code} ${gname(g)}`).join(', '); const proof=$('#paymentProof')?.files?.[0]?.name||'-'; return `课堂游戏网站购买申请\n${t('orderPlan')}：${$('#plan').selectedOptions[0].textContent}\n老师姓名：${$('#buyerName').value||'-'}\n联系电话：${$('#buyerPhone').value||'-'}\n${t('receiptEmail')}：${$('#buyerEmail').value||'-'}\n${t('orderGames')}：${games||'-'}\n${t('originalPrice')}：RM${originalTotal()}\n${t('specialPrice')}：RM${specialTotal()}\n${t('saving')}：RM${saving()}${saving()?`（${t('savingPercent')} ${savingPercent()}%）`:''}\n${t('orderTotal')}：RM${specialTotal()}\n${t('paymentProof')}：${proof}\n${t('activationNotice')}`; }
function generateOrder(){ const text=orderText(); $('#preview').textContent=text; $('#whatsappOrder').href=`https://wa.me/${AHU_WHATSAPP}?text=${encodeURIComponent(text)}`; return text; }
function fileToBase64(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>{const s=String(r.result||'');resolve({filename:file.name,mimeType:file.type||'application/octet-stream',contentBase64:s.includes(',')?s.split(',')[1]:s});};r.onerror=reject;r.readAsDataURL(file);});}
async function submitOrder(e){ e&&e.preventDefault(); const name=$('#buyerName').value.trim(), email=$('#buyerEmail').value.trim(); if(!name)return alert(t('needName')); if(!email)return alert(t('needEmail')); const text=generateOrder(); const btn=$('#copy'); const old=btn.textContent; btn.disabled=true; btn.textContent=t('submitting'); let waWin=null; try{waWin=window.open('', '_blank'); if(waWin)waWin.document.write('<p style="font-family:Arial;padding:20px">Preparing WhatsApp...</p>');}catch(_){} try{let proof=null; const f=$('#paymentProof')?.files?.[0]; if(f)proof=await fileToBase64(f); const res=await fetch('/api/confirm-purchase',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lang,buyer:{name,phone:$('#buyerPhone').value.trim(),email},orderText:text,paymentProof:proof,pageUrl:location.href,submittedAt:new Date().toISOString()})}); const data=await res.json().catch(()=>({})); if(!res.ok||!data.ok)throw new Error(data.error||'Submit failed'); const wa=$('#whatsappOrder').href; if(waWin)waWin.location.href=wa; else window.open(wa,'_blank'); alert(t('successMsg')); }catch(err){ if(waWin&&!waWin.closed)waWin.close(); alert(t('submitFail')+'\n'+(err.message||err)); } finally{btn.disabled=false;btn.textContent=t('confirmPurchase');}}
function bind(){ $$('.langBtn').forEach(b=>b.onclick=()=>setLanguage(b.dataset.lang)); $$('.filter').forEach(b=>b.onclick=()=>renderGames(b.dataset.f)); $$('.plan').forEach(b=>b.onclick=e=>{e.preventDefault();$('#plan').value=b.dataset.plan;renderPurchase();updateSummary();generateOrder();hidePayment();document.querySelector('#checkoutFlow')?.scrollIntoView({behavior:'smooth'});}); $('#plan').onchange=()=>{renderPurchase();updateSummary();generateOrder();hidePayment();}; ['buyerName','buyerPhone','buyerEmail'].forEach(id=>$('#'+id).oninput=generateOrder); $('#confirmSelection').onclick=showPayment; $('#paymentProof').onchange=()=>{$('#proofFileName').textContent=$('#paymentProof').files[0]?.name||t('noFile');generateOrder();}; $('#copy').onclick=submitOrder; $('#whatsappOrder').onclick=()=>{generateOrder();}; $('#closeModal').onclick=()=>{$('#modal').classList.add('hidden');currentModal=null;}; $('#modal').onclick=e=>{if(e.target.id==='modal'){$('#modal').classList.add('hidden');currentModal=null;}}; $('#closeLightbox').onclick=()=>$('#lightbox').classList.add('hidden'); $('#lightbox').onclick=e=>{if(e.target.id==='lightbox')$('#lightbox').classList.add('hidden');}; document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',()=>setTimeout(()=>{},0));});}
function init(){applyText();renderGames();renderPurchase();updateSummary();generateOrder();bind();}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
