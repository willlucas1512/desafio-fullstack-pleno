'use client';

import { useEffect, useRef } from 'react';

const PLUGIN_SRC = 'https://vlibras.gov.br/app/vlibras-plugin.js';
const PLUGIN_ID = 'vlibras-plugin';
const APP_URL = 'https://vlibras.gov.br/app';

// Widget de tradução para Libras mantido pelo Governo Federal (VLibras).
// O VLibras é um widget antigo que muta o DOM diretamente; por isso o markup `vw`
// é injetado como HTML cru num container que o React não reconcilia, evitando que
// o React remova os nós que o plugin cria (iframe do player). O script é carregado
// no useEffect (pós-montagem) e o Widget é instanciado no onload.
export function VLibras() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || container.childElementCount > 0) return;

    container.innerHTML = `
      <div vw class="enabled">
        <div vw-access-button class="active"></div>
        <div vw-plugin-wrapper>
          <div class="vw-plugin-top-wrapper"></div>
        </div>
      </div>`;

    const init = () => {
      new window.VLibras.Widget(APP_URL);
      // O plugin adia a construção do widget para o evento `window.onload`. Num SPA
      // (Next) esse evento já disparou quando o script injeta, então o handler nunca
      // rodaria — invocamos manualmente o que o construtor registrou em window.onload.
      if (typeof window.onload === 'function') {
        window.onload(new Event('load'));
      }
    };

    if (window.VLibras) {
      init();
      return;
    }

    const existing = document.getElementById(PLUGIN_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', init);
      return;
    }

    const script = document.createElement('script');
    script.id = PLUGIN_ID;
    script.src = PLUGIN_SRC;
    script.async = true;
    script.onload = init;
    document.body.appendChild(script);
  }, []);

  return <div ref={containerRef} />;
}
