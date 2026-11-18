/**
 * admin.js - Login y panel del administrador
 * --------------------------------------------------------------
 * Flujo: el admin escribe usuario y clave -> el backend responde con un token
 * -> guardamos el token en api.js -> lo enviamos en cada petición protegida.
 */

// ---------------------------------------------------------------
// LOGIN
// ---------------------------------------------------------------
document.getElementById('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();
  const boton = document.getElementById('btnLogin');
  const error = document.getElementById('errorLogin');
  error.textContent = '';
  error.className = 'ayuda';

  await conCarga(boton, 'Entrando...', async () => {
    try {
      const datos = await api('/api/login', {
        method: 'POST',
        body: JSON.stringify({
          usuario: document.getElementById('lUsuario').value,
          clave: document.getElementById('lClave').value
        })
      });
      tokenAdmin = datos.token;
      e.target.reset();
      cerrar('dlgLogin');
      mostrarPanel();
    } catch (err) {
      error.textContent = err.message;
      error.className = 'ayuda error';
    }
  });
});

// Muestra el panel y carga sus datos
function mostrarPanel() {
  document.getElementById('panelAdmin').classList.remove('oculto');
  document.getElementById('panelAdmin').scrollIntoView();
  cargarPanel();
}

// Cerrar sesión: olvidamos el token y ocultamos el panel
document.getElementById('btnSalir').onclick = () => {
  tokenAdmin = null;
  document.getElementById('panelAdmin').classList.add('oculto');
  aviso('Sesión cerrada.');
};

// ---------------------------------------------------------------
// PANEL
// ---------------------------------------------------------------
async function cargarPanel() {
  const cajaProductos = document.getElementById('adminProductos');
  const cajaMensajes = document.getElementById('adminMensajes');
  cajaProductos.textContent = 'Cargando...';
  cajaMensajes.textContent = 'Cargando...';

  try {
    const [productos, mensajes] = await Promise.all([
      api('/api/admin/productos'),
      api('/api/mensajes')
    ]);

    cajaProductos.innerHTML = productos.length === 0
      ? '<p class="estado">Aún no hay productos.</p>'
      : productos.map(filaProducto).join('');

    cajaMensajes.innerHTML = mensajes.length === 0
      ? '<p class="estado">Aún no hay mensajes.</p>'
      : mensajes.map(filaMensaje).join('');
  } catch (error) {
    cajaProductos.textContent = error.message;
    cajaMensajes.textContent = '';
  }
}

function filaProducto(p) {
  const botonAprobar = p.estado === 'pendiente'
    ? `<button class="boton boton-verde" onclick="aprobar(${p.id})">Aprobar</button>` : '';
  return `
    <div class="fila">
      <div>
        <strong>${esc(p.nombre)}</strong>
        <small>${esc(p.vendedor)} · ${esc(p.contacto)}</small>
        <small class="${p.estado === 'pendiente' ? 'pendiente' : ''}">Estado: ${esc(p.estado)}</small>
      </div>
      <div class="fila-botones">
        ${botonAprobar}
        <button class="boton boton-rojo" onclick="borrar(${p.id})">Borrar</button>
      </div>
    </div>`;
}

function filaMensaje(m) {
  return `
    <div class="fila">
      <div>
        <strong>${esc(m.asunto)}</strong>
        <small>${esc(m.nombre)} · ${esc(m.correo)} · ${new Date(m.fecha).toLocaleDateString('es-CO')}</small>
        <p>${esc(m.mensaje)}</p>
      </div>
    </div>`;
}

// Aprobar un producto pendiente
async function aprobar(id) {
  try {
    await api('/api/productos/' + id, { method: 'PUT', body: JSON.stringify({ estado: 'aprobado' }) });
    aviso('Producto aprobado.');
    cargarPanel();
    cargarProductos(); // refresca el catálogo público
  } catch (error) {
    aviso(error.message, true);
  }
}

// Borrar un producto (pide confirmación primero)
async function borrar(id) {
  if (!confirm('¿Borrar este producto?')) return;
  try {
    await api('/api/productos/' + id, { method: 'DELETE' });
    aviso('Producto borrado.');
    cargarPanel();
    cargarProductos();
  } catch (error) {
    aviso(error.message, true);
  }
}
