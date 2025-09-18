// block-uqload-ads.js
(function () {
  'use strict';

  // Mots-clés dans l'URL qui indiquent souvent une publicité
  const adUrlKeywords = ['ad', 'ads', 'banner', 'advert', 'sponsor', 'promo'];

  // Seuils de taille (px) en dessous desquels un iframe est probablement une bannière pub
  const WIDTH_THRESHOLD = 400;
  const HEIGHT_THRESHOLD = 150;

  // Action à effectuer : 'remove' ou 'hide' (hide met display:none)
  const ACTION = 'remove'; // changez en 'hide' si vous préférez masquer

  // Fonction utilitaire : test si une URL appartient à uqload.com
  function isUqloadUrl(url) {
    try {
      const u = new URL(url, location.href);
      return u.hostname.includes('uqload.com') || u.hostname.endsWith('.uqload.com');
    } catch (e) {
      return false;
    }
  }

  // Fonction utilitaire : test si l'URL contient des indices de pub
  function urlLooksLikeAd(url) {
    if (!url) return false;
    const lower = url.toLowerCase();
    return adUrlKeywords.some(k => lower.includes(k));
  }

  // Décide si un iframe est probablement une pub
  function isProbableAdIframe(iframe) {
    const src = iframe.getAttribute('src') || iframe.dataset.src || '';
    // 1) si l'URL n'est pas uqload, on ignore
    if (!isUqloadUrl(src)) return false;

    // 2) si l'URL contient un mot-clé d'ad => probable pub
    if (urlLooksLikeAd(src)) return true;

    // 3) si l'iframe a de très petites dimensions (attributs ou style) -> probable bannière
    const widthAttr = iframe.getAttribute('width');
    const heightAttr = iframe.getAttribute('height');

    // obtenir dimensions calculées (si déjà dans le DOM)
    const rect = iframe.getBoundingClientRect ? iframe.getBoundingClientRect() : { width: 0, height: 0 };
    const width = parseInt(widthAttr) || Math.round(rect.width) || 0;
    const height = parseInt(heightAttr) || Math.round(rect.height) || 0;

    if ((width && width < WIDTH_THRESHOLD) || (height && height < HEIGHT_THRESHOLD)) return true;

    // 4) sinon: on considère que ce n'est probablement pas une pub (ex : lecteur vidéo)
    return false;
  }

  // Appliquer l'action sur l'iframe (remove/hide)
  function handleIframe(iframe) {
    try {
      if (!iframe || iframe._uqloadHandled) return;
      iframe._uqloadHandled = true; // marque pour éviter traitements répétés

      if (!iframe.src && iframe.dataset && iframe.dataset.src) {
        // lazy-loaded iframe (data-src) : vérifier data-src aussi
        iframe.src = iframe.dataset.src;
      }

      if (isProbableAdIframe(iframe)) {
        console.log('Block Uqload ad-iframe:', iframe.src || iframe.dataset.src || '(no-src)');
        if (ACTION === 'remove') {
          iframe.remove();
        } else {
          iframe.style.display = 'none';
        }
        return true;
      }
      // Si on arrive ici : iframe Uqload mais pas considérée pub -> ne rien faire.
      return false;
    } catch (e) {
      // sécurité : ne pas bloquer le script en cas d'erreur
      console.error('Error handling iframe:', e);
      return false;
    }
  }

  // Scan initial
  function scanExistingIframes() {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(handleIframe);
  }

  // Observer pour iframes ajoutées dynamiquement
  function watchForIframes() {
    const observer = new MutationObserver(mutations => {
      for (const mut of mutations) {
        // check added nodes
        if (mut.addedNodes && mut.addedNodes.length) {
          mut.addedNodes.forEach(node => {
            if (node.tagName === 'IFRAME') {
              handleIframe(node);
            } else if (node.querySelectorAll) {
              // s'il y a des iframes plus bas dans la hiérarchie
              const nested = node.querySelectorAll('iframe');
              nested.forEach(handleIframe);
            }
          });
        }
        // also check attribute changes (ex: data-src becomes src)
        if (mut.type === 'attributes' && mut.target && mut.target.tagName === 'IFRAME') {
          handleIframe(mut.target);
        }
      }
    });

    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'data-src', 'width', 'height']
    });
  }

  // Kick off after DOM ready
  function init() {
    scanExistingIframes();
    watchForIframes();

    // Optionnel : nettoyage périodique (au cas où)
    setInterval(scanExistingIframes, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
