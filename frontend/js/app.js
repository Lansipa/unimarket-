/**
 * app.js - Parte pública de la página
 * --------------------------------------------------------------
 * Contiene: catálogo, publicar producto, formulario de contacto y chatbot.
 */

// ---------------------------------------------------------------
// UTILIDADES
// ---------------------------------------------------------------

// Evita que alguien escriba código HTML malicioso en un formulario y se ejecute en la página
function esc(texto) {
  return String(texto).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Muestra un aviso arriba durante 3 segundos
function aviso(texto, esError = false) {
  const caja = document.getElementById('aviso');
  caja.textContent = texto;
  caja.className = 'aviso' + (esError ? ' error' : '');
  clearTimeout(aviso.temporizador);
  aviso.temporizador = setTimeout(() => caja.classList.add('oculto'), 3000);
}

// Pone un botón en modo "cargando" mientras esperamos al servidor
async function conCarga(boton, textoCargando, tarea) {
  const textoOriginal = boton.textContent;
  boton.disabled = true;
  boton.textContent = textoCargando;
  try {
    await tarea();
  } finally {                       // finally se ejecuta siempre, haya error o no
    boton.disabled = false;
    boton.textContent = textoOriginal;
  }
}

const EMOJIS = { Snacks: '🍪', Libros: '📚', 'Tecnología': '💻', Ropa: '👕', Servicios: '🎓' };
const NOMBRES_TIPO = { venta: 'Venta', intercambio: 'Intercambio', servicio: 'Servicio' };

// ---------------------------------------------------------------
// CATÁLOGO
// ---------------------------------------------------------------

// Crea el HTML de una tarjeta de producto
function tarjetaProducto(p) {
  const precio = p.tipo === 'intercambio' ? 'Intercambio' : '$' + p.precio.toLocaleString('es-CO');
  const asunto = encodeURIComponent('UNiMarket: ' + p.nombre);
  return `
    <article class="tarjeta">
      <div class="tarjeta-imagen">${EMOJIS[p.categoria] || '🛒'}</div>
      <div class="tarjeta-cuerpo">
        <div class="etiquetas">
          <span class="etiqueta ${esc(p.tipo)}">${NOMBRES_TIPO[p.tipo]}</span>
          <span class="etiqueta">📍 ${esc(p.puntoEntrega)}</span>
        </div>
        <h3>${esc(p.nombre)}</h3>
        <span class="precio">${precio}</span>
        <p class="descripcion">${esc(p.descripcion)}</p>
        <p class="vendedor">Publica: ${esc(p.vendedor)}</p>
        <a class="boton boton-cian" href="mailto:${esc(p.contacto)}?subject=${asunto}">Contactar</a>
      </div>
    </article>`;
}

// Pide los productos al backend y los dibuja. Maneja 3 estados: cargando, error y vacío.
async function cargarProductos() {
  const estado = document.getElementById('estadoCatalogo');
  const grid = document.getElementById('grid');
  const buscar = document.getElementById('buscar').value.trim();
  const tipo = document.getElementById('filtroTipo').value;

  estado.className = 'estado';
  estado.textContent = 'Cargando artículos...';
  grid.innerHTML = '';

  try {
    const url = `/api/productos?buscar=${encodeURIComponent(buscar)}&tipo=${tipo}`;
    const productos = await api(url);

    if (productos.length === 0) {
      estado.textContent = 'No encontramos artículos. ¡Sé el primero en publicar uno!';
      return;
    }
    estado.textContent = '';
    grid.innerHTML = productos.map(tarjetaProducto).join('');
  } catch (error) {
    estado.className = 'estado error';
    estado.textContent = 'No pudimos cargar el catálogo. Revisa tu conexión e intenta de nuevo.';
  }
}

// Buscar mientras se escribe (esperamos 300 ms para no pedir en cada letra)
let temporizadorBusqueda;
document.getElementById('buscar').addEventListener('input', () => {
  clearTimeout(temporizadorBusqueda);
  temporizadorBusqueda = setTimeout(cargarProductos, 300);
});
document.getElementById('filtroTipo').addEventListener('change', cargarProductos);

// ---------------------------------------------------------------
// VENTANAS (dialog)
// ---------------------------------------------------------------
function abrir(id) { document.getElementById(id).showModal(); }
function cerrar(id) { document.getElementById(id).close(); }

document.getElementById('btnAbrirPublicar').onclick = () => abrir('dlgPublicar');
document.getElementById('btnHeroPublicar').onclick = () => abrir('dlgPublicar');
document.getElementById('btnAbrirLogin').onclick = () => abrir('dlgLogin');
document.querySelectorAll('[data-cerrar]').forEach(b => {
  b.onclick = () => cerrar(b.dataset.cerrar);
});

// ---------------------------------------------------------------
// PUBLICAR UN PRODUCTO
// ---------------------------------------------------------------
document.getElementById('formPublicar').addEventListener('submit', async (e) => {
  e.preventDefault(); // evita que el navegador recargue la página
  const boton = document.getElementById('btnPublicar');

  await conCarga(boton, 'Publicando...', async () => {
    try {
      await api('/api/productos', {
        method: 'POST',
        body: JSON.stringify({
          nombre: document.getElementById('pNombre').value,
          tipo: document.getElementById('pTipo').value,
          categoria: document.getElementById('pCategoria').value,
          precio: document.getElementById('pPrecio').value,
          puntoEntrega: document.getElementById('pPunto').value,
          descripcion: document.getElementById('pDescripcion').value,
          vendedor: document.getElementById('pVendedor').value,
          contacto: document.getElementById('pContacto').value
        })
      });
      e.target.reset();
      cerrar('dlgPublicar');
      aviso('¡Publicado! El administrador lo revisará pronto.');
    } catch (error) {
      aviso(error.message, true); // por ejemplo: "Usa tu correo institucional"
    }
  });
});

// ---------------------------------------------------------------
// FORMULARIO DE CONTACTO
// ---------------------------------------------------------------
document.getElementById('formContacto').addEventListener('submit', async (e) => {
  e.preventDefault();
  const boton = document.getElementById('btnContacto');

  await conCarga(boton, 'Enviando...', async () => {
    try {
      await api('/api/mensajes', {
        method: 'POST',
        body: JSON.stringify({
          nombre: document.getElementById('cNombre').value,
          correo: document.getElementById('cCorreo').value,
          asunto: document.getElementById('cAsunto').value,
          mensaje: document.getElementById('cMensaje').value
        })
      });
      e.target.reset();
      aviso('¡Mensaje enviado! Te responderemos pronto.');
    } catch (error) {
      aviso(error.message, true);
    }
  });
});

// ---------------------------------------------------------------
// CHATBOT UNiBot
// ---------------------------------------------------------------
document.getElementById('btnChat').onclick = () => {
  document.getElementById('chatVentana').classList.toggle('oculto');
};

// Agrega una burbuja al chat. quien = 'yo' o 'bot'
function burbuja(texto, quien) {
  const caja = document.getElementById('chatMensajes');
  const div = document.createElement('div');
  div.className = 'burbuja ' + quien;
  div.textContent = texto; // textContent (no innerHTML) = seguro
  caja.appendChild(div);
  caja.scrollTop = caja.scrollHeight;
  return div;
}

document.getElementById('formChat').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('chatInput');
  const pregunta = input.value.trim();
  if (!pregunta) return;

  burbuja(pregunta, 'yo');
  input.value = '';
  const espera = burbuja('Escribiendo...', 'bot'); // estado de carga

  try {
    const datos = await api('/api/chat', { method: 'POST', body: JSON.stringify({ mensaje: pregunta }) });
    espera.textContent = datos.respuesta;
  } catch (error) {
    espera.textContent = 'Ups, no pude responder ahora. Intenta de nuevo en un momento.';
  }
});

// ---------------------------------------------------------------
// INICIO: al abrir la página cargamos el catálogo
// ---------------------------------------------------------------
cargarProductos();
