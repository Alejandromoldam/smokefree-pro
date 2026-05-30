# Vercel Deploy Checklist (SmokeFree Pro)

## 1) Build de producción

- [ ] Ejecutar `npm run build` sin errores.
- [ ] Confirmar rutas compiladas:
  - `/`
  - `/api/catalog`
  - `/api/product/[handle]`
  - `/producto/[handle]`
  - `/api/cart/*`

## 2) Variables de entorno (Vercel Project Settings > Environment Variables)

- [ ] `SHOPIFY_STORE_DOMAIN`
- [ ] `SHOPIFY_STOREFRONT_PRIVATE_TOKEN` (recomendado)
- [ ] `SHOPIFY_STOREFRONT_ACCESS_TOKEN` (opcional alternativo)
- [ ] `SHOPIFY_API_VERSION` (ej. `2025-04`)
- [ ] `SITE_URL` (dominio final, ej. `https://smokefreepro.com`)

## 3) Seguridad de tokens

- [ ] No guardar tokens en variables `NEXT_PUBLIC_*`.
- [ ] Verificar que el frontend no lea `process.env.*TOKEN`.
- [ ] Consumir Shopify solo desde rutas server (`/api/*`) y server components.

## 4) Shopify Storefront seguro

- [ ] Token válido de Headless/Storefront (no `atkn_`).
- [ ] Scopes Storefront habilitados (lectura productos/colecciones/inventario y checkout/cart según flujo).
- [ ] App instalada en la tienda correcta.

## 5) Rutas dinámicas de producto

- [ ] Abrir `/producto/[handle]` con un handle real.
- [ ] Confirmar status 200 en producción.

## 6) Catálogo Shopify en producción

- [ ] `GET /api/catalog` responde `ok: true`.
- [ ] Se muestran productos reales (imagen, precio, disponibilidad, descripción corta).
- [ ] Filtros y orden funcionan.

## 7) Carrito y checkout

- [ ] Agregar producto al carrito desde catálogo.
- [ ] Ajustar cantidad y eliminar línea.
- [ ] `Finalizar compra` genera `checkoutUrl` real de Shopify.
- [ ] Redirección a checkout funciona.

## 8) SEO dinámico

- [ ] `title`: `Nombre del producto | SmokeFree Pro`.
- [ ] `meta description` real recortada 150-160 chars.
- [ ] Open Graph con imagen real del producto.
- [ ] Twitter card `summary_large_image`.

## 9) Responsive móvil

- [ ] Home/catálogo sin desbordes en móvil.
- [ ] Página producto con sticky buy bar correcta.
- [ ] Drawer de carrito usable en móvil.

## 10) Go-live en Vercel

- [ ] Conectar repo en Vercel.
- [ ] Framework preset: Next.js.
- [ ] Build command: `npm run build`.
- [ ] Start command: `npm run start` (auto en Vercel para Next).
- [ ] Asignar dominio y TLS activo.
- [ ] Revalidar `/`, `/api/catalog`, `/producto/[handle]` y checkout.

## Nota de QA local

En `next start` local por `http://localhost`, las cookies `secure` no se envían.  
En Vercel (HTTPS) ese comportamiento es correcto y el carrito server-side funciona normalmente.
