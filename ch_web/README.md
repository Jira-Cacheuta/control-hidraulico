# Control hidráulico (ch_web)

Frontend **Vite + React** del panel de control. Las peticiones de datos van al backend (`/api` o URL configurada); el navegador no habla con Jira.

Despliegue en servidor (build, PM2, HTTPS/PWA): ver **[DEPLOY.md](../DEPLOY.md)** en la raíz del repo.

## Desarrollo

```bash
npm install
npm run dev
```

En desarrollo, Vite proxea `/api` a `http://localhost:4000`. El service worker **no** está activo por defecto (`devOptions.enabled: false`).

Variables útiles (archivo `.env` o `.env.local`):

- **`VITE_API_BASE_URL`**: base del API (vacío = mismo origen que el front, típico detrás del mismo host que reescribe `/api`; o URL absoluta del backend, p. ej. `https://api.ejemplo.com`).

## PWA (producción)

- **HTTPS**: obligatorio para registrar el service worker (localhost es excepción válida).
- **Instalación**: en Chrome/Edge, menú “Instalar aplicación” o icono en la barra de direcciones; en Android, “Añadir a inicio”.
- **Actualizaciones**: `registerType: 'autoUpdate'` — al desplegar un build nuevo, la próxima visita puede descargar el SW actualizado y aplicará la nueva versión (recarga típica tras activación).

### Comportamiento offline (Fase A)

- El SW **precachea** el shell (HTML, JS, CSS, activos declarados como `includeAssets`: íconos PWA, PDFs en `public/maps/`, etc.).
- Las rutas **`/api`…** usan **solo red** (`NetworkOnly`): sin red no hay caché de respuestas del API; la interfaz puede abrirse pero las pantallas que dependen de datos fallarán hasta recuperar conexión (coherente con datos vía Jira en el backend).

### Íconos PWA

La imagen maestra es `scripts/pwa-icon-source.png` (reemplazala si querés otro dibujo). Los PNG en `public/` se generan con:

```bash
npm run icons:pwa
```

(Requiere `sharp` y `to-ico` en devDependencies.)

En **Windows**, Edge a veces deja el acceso del **escritorio** con ícono genérico (cuadradito azul + flecha) aunque la **barra de tareas** muestre bien el dibujo: el `.lnk` apunta a `msedge.exe` y el Shell no siempre copia el ícono del manifest, sobre todo en `http://127.0.0.1`.

**Opción A — Manual:** clic derecho en el acceso → **Propiedades** → **Cambiar ícono** → elegí `ch_web\dist\favicon.ico` (ruta completa en tu disco).

**Opción B — Script:** con `dist` ya generado (`npm run build`), desde `ch_web`:

```bash
npm run shortcut:desktop
```

Crea `Control hidraulico.lnk` en el escritorio con `--app=http://127.0.0.1:4173/` y el ícono del `.ico`. Cambiá la URL con:  
`powershell -ExecutionPolicy Bypass -File scripts/windows-desktop-shortcut.ps1 -AppUrl "http://127.0.0.1:4000/"`.

Tras desplegar en un dominio real, reinstalá la PWA desde HTTPS; a veces el ícono del escritorio se comporta mejor que en localhost.

### Checklist manual tras un deploy

1. Abrir el sitio en **HTTPS**, comprobar que en DevTools → Application → Service Workers aparece activo y el manifest es válido.
2. Probar **instalar** la app y abrirla en modo **standalone**.
3. Publicar un cambio de front, volver a entrar y comprobar que se usa la **nueva versión** (o forzar “Actualizar” / recarga completa si el navegador la retiene en memoria).
4. **Sin red**: verificar que no se sirven respuestas viejas de `/api` por el SW (las peticiones deben fallar en red, no mostrar JSON cacheado “fantasma”).

## Build

```bash
npm run build
npm run preview
```

Si desplegás el front en una **subcarpeta**, ajustá `base` en `vite.config.ts` y mantené alineados `manifest.start_url` / `manifest.scope` (mismo valor que `base`).
