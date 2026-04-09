# Despliegue al servidor (Control hidráulico)

Este proyecto sirve **frontend + API** desde un solo proceso Node (`ch_backend`), que expone la SPA compilada en `ch_web/dist` y las rutas `/api/*`.

## Antes de publicar la PWA a usuarios

- **HTTPS:** el **service worker** y la **instalación como app** requieren contexto seguro. **`http://IP-pública` suele no alcanzar** para que “Instalar aplicación” funcione igual que en localhost.
- **Recomendación:** dominio con **TLS** (Let’s Encrypt + nginx o el proxy que uses) y abrir **80/443** en el firewall.
- En el **build de producción** en el servidor: **no** uses `VITE_API_BASE_URL` si el navegador abre la misma URL que sirve el API (mismo host y puerto). Las peticiones irán a `/api/...` en el mismo origen.
- Tu `.env.production.local` (preview local con `:4000`) **no se sube a Git**; el servidor no lo necesita si todo va unificado en Express.

## En tu PC (subir código)

```bash
git add .
git status   # confirmar que no figure ch_backend/.env ni otros secretos
git commit -m "Descripción del cambio"
git push origin main
```

## En el servidor (SSH)

Ejemplo (ajustá usuario, IP y ruta de la `.pem`):

```bash
ssh -i "ruta/a/tu-clave.pem" ubuntu@TU_IP
cd ~/control-hidraulico
git pull origin main
cd ch_web
npm ci
npm run build
cd ../ch_backend
pm2 restart ch-backend
# o: pm2 restart all
```

**Importante:** hace falta **`npm ci`** (o `npm install`) **después de cada `git pull`** en `ch_web`. Si saltás ese paso, faltan paquetes (p. ej. `vite-plugin-pwa`) y `npm run build` / `tsc` fallan. No uses `npm install --omit=dev` para compilar el front: Vite y la PWA están en `devDependencies`.

Comprobar logs: `pm2 logs ch-backend --lines 50`.

## Verificación rápida

1. Abrí la URL pública con **HTTPS** (cuando esté configurado).
2. DevTools → **Application** → Manifest y Service Worker activos.
3. Menú del navegador → **Instalar** / agregar a inicio.
4. Login Jira vía backend: revisar que listados y transiciones respondan.

## Firewall (Lightsail u otro)

- **SSH 22**
- **HTTP 80** y/o **HTTPS 443** según cómo expongas el sitio
- Si Node escucha en **4000** sin proxy, abrir **TCP 4000** a los clientes (menos recomendable que 80/443 detrás de nginx).

## DNS

Registro **A** (o **AAAA**) del dominio apuntando a la IP estática de la instancia; luego Certbot (u otro) para el certificado.
