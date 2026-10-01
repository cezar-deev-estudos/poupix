import type { NextConfig } from "next";
import * as fs from "fs";
import * as path from "path";

// Template do Service Worker — embutido aqui para ser regenerado a cada build com versão única
const SW_TEMPLATE = `// Poupix PRO - Service Worker (gerado automaticamente em build)
const CACHE_NAME = 'poupix-pro-BUILD_VERSION';

const PRECACHE_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => { if (key !== CACHE_NAME) return caches.delete(key); }))
    )
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
  }
});

self.addEventListener('fetch', (event) => {
  // Ignorar requests que nao sao http/https (ex: chrome-extension://)
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  // Ignorar Supabase, APIs, HMR/Turbopack, _next e metodos nao-GET
  if (
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname.includes('_next/data') ||
    url.searchParams.has('_rsc') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  // Paginas HTML: NETWORK-FIRST sempre
  if (
    event.request.mode === 'navigate' ||
    (event.request.headers.get('accept') || '').includes('text/html')
  ) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) {
            try {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
            } catch (_) {}
          }
          return res;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Ativos estaticos: Network com fallback para cache
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res && res.status === 200) {
          try {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
          } catch (_) {}
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
`;

// Gera versão única por build e escreve sw.js apenas em produção ou se o arquivo ainda não existir
const swOutputPath = path.join(process.cwd(), 'public', 'sw.js');
const shouldGenerateSW = process.env.NODE_ENV === 'production' || !fs.existsSync(swOutputPath);

if (shouldGenerateSW) {
  const BUILD_VERSION = Date.now().toString(36);
  const swContent = SW_TEMPLATE.replace(/BUILD_VERSION/g, BUILD_VERSION);
  fs.writeFileSync(swOutputPath, swContent, 'utf-8');
  console.log(`[SW] Service Worker gerado: poupix-pro-${BUILD_VERSION}`);
}

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      {
        source: '/',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate, max-age=0' },
        ],
      },
    ];
  },
};

export default nextConfig;
