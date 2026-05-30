# SmokeFree Pro Headless

Tienda headless en Next.js 14 conectada a Shopify Storefront API.

## Requisitos

- Node.js 18+ (recomendado 20 LTS)
- Variables de entorno configuradas en `.env.local`

## Variables de entorno

Usa variables **server-side** (sin `NEXT_PUBLIC` para tokens):

```env
SHOPIFY_STORE_DOMAIN=all-in-one-22092396.myshopify.com
SHOPIFY_STOREFRONT_PRIVATE_TOKEN=your_headless_private_token_here
# opcional alternativo:
# SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_access_token_here
SHOPIFY_API_VERSION=2025-04
SITE_URL=https://tu-dominio.com
```

Notas:

- Usa token de Storefront (Headless), no token `atkn_`.
- No expongas tokens en variables `NEXT_PUBLIC_*`.
- `SITE_URL` se usa para metadatos SEO canónicos/OpenGraph.

## Desarrollo local

```bash
npm install
npm run dev
```

Vista local: [http://localhost:4020](http://localhost:4020) si corres en puerto 4020, o el puerto que asigne Next.

## Validaciones recomendadas

```bash
npm run lint
npm run build
```

## Endpoints clave

- `GET /api/catalog` catálogo real Shopify
- `GET /api/product/[handle]` detalle real del producto
- `POST /api/cart/create` crea carrito Shopify y devuelve `checkoutUrl`
- `POST /api/cart/add|update|remove` operaciones de carrito

## Deploy en Vercel

Sigue el checklist de producción en:

- [VERCEL_DEPLOY_CHECKLIST.md](./VERCEL_DEPLOY_CHECKLIST.md)
