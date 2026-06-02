"use client";

import { useEffect, useRef } from "react";

const PLUGIN_SRC = "https://vlibras.gov.br/app/vlibras-plugin.js";
const PLUGIN_ID = "vlibras-plugin";
const APP_URL = "https://vlibras.gov.br/app";

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
      if (typeof window.onload === "function") {
        window.onload(new Event("load"));
      }
    };

    if (window.VLibras) {
      init();
      return;
    }

    const existing = document.getElementById(
      PLUGIN_ID,
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", init);
      return;
    }

    const script = document.createElement("script");
    script.id = PLUGIN_ID;
    script.src = PLUGIN_SRC;
    script.async = true;
    script.onload = init;
    document.body.appendChild(script);
  }, []);

  return <div ref={containerRef} />;
}
