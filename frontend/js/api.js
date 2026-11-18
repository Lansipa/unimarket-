/**
 * api.js - Comunicación con el backend
 * --------------------------------------------------------------
 * Aquí está UNA sola función (api) que hace todos los fetch.
 * Así, si cambia la dirección del servidor, solo cambias API_URL.
 */

// Local:       'http://localhost:3000'
// Publicado:   pon aquí la URL de tu backend (por ejemplo la de Render)
const API_URL = 'http://localhost:3000';

// Token del administrador (se llena cuando inicia sesión)
let tokenAdmin = null;

/**
 * Hace una petición al backend.
 * - ruta:      '/api/productos'
 * - opciones:  { method: 'POST', body: JSON.stringify({...}) }
 * Si el servidor responde con error (400, 401, 404...), lanza un Error con el mensaje.
 */
async function api(ruta, opciones = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (tokenAdmin) headers.Authorization = 'Bearer ' + tokenAdmin;

  const respuesta = await fetch(API_URL + ruta, { ...opciones, headers });
  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) throw new Error(datos.error || 'Algo salió mal. Intenta de nuevo.');
  return datos;
}
