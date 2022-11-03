(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WXB76Z4');

(function(w,d) {
    const loadIframe = (d) => {
        const noscript = d.createElement('noscript');
        const iframe = d.createElement('iframe');
        iframe.setAttribute('src', "https://www.googletagmanager.com/ns.html?id=GTM-WXB76Z4");
        iframe.setAttribute('height', '0');
        iframe.setAttribute('width', '0');
        iframe.setAttribute('style', 'display:none;visibility:hidden');
        noscript.appendChild(iframe);
        d.body.appendChild(noscript);
    };

    w.onload(loadIframe(d));
})(window, document);