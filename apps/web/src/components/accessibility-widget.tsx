'use client';

import { useEffect } from 'react';
import { Accessibility, type IAccessibilityOptions } from 'accessibility';

// Menu de acessibilidade "um clique" (aumentar texto, contraste, tons de cinza,
// sublinhar links, guia de leitura, leitura por voz, etc.), no estilo do widget do
// site da Prefeitura. Botão flutuante no canto inferior direito (o VLibras fica à
// esquerda, então não se sobrepõem).
const options: IAccessibilityOptions = {
  // Ícone do botão: ligatura do Material Icons. O default `accessibility` é a
  // figura de pessoa de braços abertos; `accessible` é a cadeira de rodas — o
  // Símbolo Internacional de Acesso, reconhecido como o símbolo universal de PCD.
  icon: { img: 'accessible' },
  session: { persistent: true },
  language: { textToSpeechLang: 'pt-BR', speechToTextLang: 'pt-BR' },
  labels: {
    menuTitle: 'Acessibilidade',
    increaseText: 'Aumentar texto',
    decreaseText: 'Diminuir texto',
    increaseTextSpacing: 'Aumentar espaçamento',
    decreaseTextSpacing: 'Diminuir espaçamento',
    increaseLineHeight: 'Aumentar entrelinha',
    decreaseLineHeight: 'Diminuir entrelinha',
    invertColors: 'Inverter cores',
    grayHues: 'Tons de cinza',
    underlineLinks: 'Sublinhar links',
    bigCursor: 'Cursor grande',
    readingGuide: 'Guia de leitura',
    textToSpeech: 'Ler em voz alta',
    speechToText: 'Falar para escrever',
    disableAnimations: 'Desativar animações',
    resetTitle: 'Redefinir',
    closeTitle: 'Fechar',
    hotkeyPrefix: 'Atalho: ',
  },
};

export function AccessibilityWidget() {
  useEffect(() => {
    const instance = new Accessibility(options);
    return () => instance.destroy();
  }, []);

  return null;
}
