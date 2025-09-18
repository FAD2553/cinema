// block-ads.js
document.addEventListener('DOMContentLoaded', function () {
    // Liste de mots-clés ou domaines souvent utilisés pour les pubs
    const adPatterns = [
        'doubleclick',
        'adservice',
        'googlesyndication',
        'adsystem',
        'advert',
        'pub',
        'uqload',
        'aliexpress',
        'banner'
    ];

    // Supprime les iframes correspondant aux patterns
    function removeAdIframes() {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
            const src = iframe.src || '';
            if (adPatterns.some(pattern => src.toLowerCase().includes(pattern))) {
                console.log('Iframe publicitaire supprimée:', src);
                iframe.remove();
            }
        });
    }

    // Premier nettoyage
    removeAdIframes();

    // Surveille l’ajout dynamique d’iframes (ex. pubs chargées plus tard)
    const observer = new MutationObserver(removeAdIframes);
    observer.observe(document.body, { childList: true, subtree: true });
});


