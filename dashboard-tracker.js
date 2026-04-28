(function(){
  function readJSON(key, fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback));}catch(_){return fallback;}}
  function writeJSON(key, value){try{localStorage.setItem(key, JSON.stringify(value));}catch(_){}}
  function text(sel, root){const el=(root||document).querySelector(sel);return el?el.textContent.trim():'';}
  function getLogged(){return readJSON('jebai_logged', null) || {};}
  function storeName(){return (document.querySelector('.store-hero-info h1')?.textContent || document.title || 'Jebai Center').replace('— Jebai Center','').trim();}
  function savePurchaseFromClick(target){
    const card = target.closest('.product-card, .store-card, .promo-card-ref, .about-card-ref') || document.body;
    const logged = getLogged();
    const product = text('.product-name', card) || target.getAttribute('data-product') || target.textContent.trim() || 'Produto / contato';
    const price = text('.product-price', card) || target.getAttribute('data-price') || 'Preço sob consulta';
    const codeText = (card.textContent.match(/Cód:\s*([^\n]+)/i)||[])[1] || '';
    const purchases = readJSON('jebai_purchases', []);
    purchases.push({product: product.slice(0,160), price: price.slice(0,80), code: codeText.trim().slice(0,60), store: storeName(), status: 'Clique de compra', userName: logged.nome || 'Visitante', userEmail: logged.email || '', url: target.href || location.href, createdAt: new Date().toISOString()});
    writeJSON('jebai_purchases', purchases);
  }
  document.addEventListener('click', function(e){
    const a = e.target.closest('a,button'); if(!a) return;
    const label = (a.textContent || a.getAttribute('aria-label') || '').toLowerCase();
    const href = (a.getAttribute('href') || '').toLowerCase();
    if(a.classList.contains('btn-buy') || label.includes('compr') || label.includes('ver na loja') || href.includes('wa.me')) savePurchaseFromClick(a);
  }, true);
})();
