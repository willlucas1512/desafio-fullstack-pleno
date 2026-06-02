"use client";

import { useEffect } from "react";
import { Accessibility, type IAccessibilityOptions } from "accessibility";

const options: IAccessibilityOptions = {
  icon: { img: "accessible" },
  session: { persistent: true },
  language: { textToSpeechLang: "pt-BR", speechToTextLang: "pt-BR" },
  labels: {
    menuTitle: "Acessibilidade",
    increaseText: "Aumentar texto",
    decreaseText: "Diminuir texto",
    increaseTextSpacing: "Aumentar espaçamento",
    decreaseTextSpacing: "Diminuir espaçamento",
    increaseLineHeight: "Aumentar entrelinha",
    decreaseLineHeight: "Diminuir entrelinha",
    invertColors: "Inverter cores",
    grayHues: "Tons de cinza",
    underlineLinks: "Sublinhar links",
    bigCursor: "Cursor grande",
    readingGuide: "Guia de leitura",
    textToSpeech: "Ler em voz alta",
    speechToText: "Falar para escrever",
    disableAnimations: "Desativar animações",
    resetTitle: "Redefinir",
    closeTitle: "Fechar",
    hotkeyPrefix: "Atalho: ",
  },
};

export function AccessibilityWidget() {
  useEffect(() => {
    const instance = new Accessibility(options);
    return () => instance.destroy();
  }, []);

  return null;
}
