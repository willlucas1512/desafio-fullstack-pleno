import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // O plugin do VLibras (vlibras.gov.br/app/vlibras-plugin.js) faz 302 para o
      // CDN cdn.jsdelivr.net, e o CSP valida a URL FINAL do redirect — por isso o
      // jsdelivr precisa entrar no script-src (senão o widget nem carrega). Os
      // assets do widget (fonte de ícones, imagens) também vêm do jsdelivr.
      // O VLibras carrega chunks de www.vlibras.gov.br (subdomínio), que o CSP NÃO
      // cobre com o apex — daí o wildcard *.vlibras.gov.br (o `*.` não inclui o
      // apex, então mantemos os dois).
      // O loader do Unity (player do VLibras) injeta um <script> a partir de uma
      // URL blob: — sem `blob:` aqui o script-src bloqueia o player inteiro.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://vlibras.gov.br https://*.vlibras.gov.br https://cdn.jsdelivr.net",
      // O player do VLibras (Unity) também cria um Web Worker a partir de um blob:
      // para descompactar os assets. Sem worker-src ele cai no script-src e o
      // worker é bloqueado.
      "worker-src 'self' blob:",
      // Material Icons (widget de acessibilidade) carrega o CSS do Google Fonts...
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // ...a fonte do menu vem do gstatic; as do VLibras vêm do jsdelivr, do apex
      // vlibras.gov.br e do Adobe Fonts/Typekit (use.typekit.net), usado pela UI
      // do player do widget.
      "font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net https://vlibras.gov.br https://*.vlibras.gov.br https://use.typekit.net",
      "img-src 'self' data: blob: https://vlibras.gov.br https://*.vlibras.gov.br https://cdn.jsdelivr.net",
      // Dados vão same-origin pelo BFF (/api/proxy) — 'self' cobre. A API externa
      // só é acessada server-side, então não precisa entrar no connect-src.
      "connect-src 'self' https://vlibras.gov.br https://*.vlibras.gov.br https://cdn.jsdelivr.net",
      "frame-src 'self' https://vlibras.gov.br https://*.vlibras.gov.br",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; '),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingRoot: path.join(dirname, '../..'),
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
