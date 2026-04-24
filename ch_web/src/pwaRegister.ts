import { registerSW } from 'virtual:pwa-register'

/** Evento global para que la UI muestre un aviso (p. ej. toast con “Recargar”). */
export const CH_PWA_UPDATE_EVENT = 'ch-pwa-update-available'

let applyServiceWorkerUpdate: ((reloadPage?: boolean) => Promise<void>) | undefined

/**
 * Debe llamarse una vez al arranque (desde `main.tsx`).
 * Con `registerType: 'autoUpdate'`, cuando hay build nuevo se dispara `onNeedRefresh`.
 */
export function initPwaRegistration(): void {
  applyServiceWorkerUpdate = registerSW({
    immediate: true,
    onNeedRefresh() {
      window.dispatchEvent(new CustomEvent(CH_PWA_UPDATE_EVENT))
    },
    onRegisteredSW(_swScriptUrl, registration) {
      if (!registration) return
      const probe = () => {
        void registration.update()
      }
      probe()
      window.setInterval(probe, 4 * 60 * 1000)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') probe()
      })
    },
  })
}

/** Activa el SW en espera y recarga (patrón vite-plugin-pwa / workbox-window). */
export function reloadAppWithNewServiceWorker(): Promise<void> {
  if (!applyServiceWorkerUpdate) {
    window.location.reload()
    return Promise.resolve()
  }
  return applyServiceWorkerUpdate(true).catch(() => {
    window.location.reload()
  })
}

/** Fuerza al navegador a buscar un `sw.js` nuevo (útil junto al botón de refrescar datos). */
export function checkForServiceWorkerUpdate(): void {
  void navigator.serviceWorker?.getRegistration().then((r) => {
    void r?.update()
  })
}
