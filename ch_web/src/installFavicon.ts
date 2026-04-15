/** Asegura el favicon al cargar JS: un SW viejo puede haber servido index.html sin enlaces de icono (pestaña gris). */
const href = `${import.meta.env.BASE_URL}pwa-32x32.png?v=9`
let link = document.querySelector("link[data-ch-favicon='1']") as HTMLLinkElement | null
if (!link) {
  link = document.createElement('link')
  link.rel = 'icon'
  link.type = 'image/png'
  link.setAttribute('data-ch-favicon', '1')
  document.head.appendChild(link)
}
link.href = href
