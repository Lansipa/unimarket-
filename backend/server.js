/**
 * UNiMarket - Backend (servidor)
 * --------------------------------------------------------------
 * Qué hace este archivo:
 *   1. Recibe peticiones del frontend (GET, POST, PUT, DELETE).
 *   2. Lee y guarda datos en archivos JSON (carpeta /data).
 *   3. Protege las rutas del administrador con un "token".
 *
 * Los "endpoints" (rutas) están en la sección ENDPOINTS, más abajo.
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(cors());          // permite que el frontend (otra URL) llame a esta API
app.use(express.json());  // permite leer el cuerpo (body) de las peticiones en JSON

// Mientras desarrollas, el backend también muestra el frontend en http://localhost:3000
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ---------------------------------------------------------------
// CONFIGURACIÓN
// ---------------------------------------------------------------
const PUERTO = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || 'admin@unal.edu.co';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123'; // CÁMBIALA al publicar
const RUTA_PRODUCTOS = path.join(__dirname, 'data', 'productos.json');
const RUTA_MENSAJES = path.join(__dirname, 'data', 'mensajes.json');
const TIPOS_VALIDOS = ['venta', 'intercambio', 'servicio'];

// ---------------------------------------------------------------
// FUNCIONES AUXILIARES: leer y guardar archivos JSON
// ---------------------------------------------------------------
function leer(ruta) {
  try {
    return JSON.parse(fs.readFileSync(ruta, 'utf8'));
  } catch (error) {
    return []; // si el archivo no existe o está dañado, empezamos vacíos
  }
}

function guardar(ruta, datos) {
  // null, 2 = deja el JSON con sangría para que sea legible
  fs.writeFileSync(ruta, JSON.stringify(datos, null, 2));
}

// Solo correos de la Universidad Nacional (validación básica de "estudiante")
function esCorreoInstitucional(correo) {
  return /^[^@\s]+@unal\.edu\.co$/i.test(correo || '');
}

// ---------------------------------------------------------------
// AUTENTICACIÓN DEL ADMIN
// Cuando el admin entra bien, le damos un token aleatorio y lo guardamos
// en memoria. Luego el frontend lo envía en cada petición protegida.
// ---------------------------------------------------------------
const tokensValidos = new Set();

function soloAdmin(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!tokensValidos.has(token)) {
    return res.status(401).json({ error: 'Necesitas iniciar sesión como administrador.' });
  }
  next(); // el token es válido: continúa hacia el endpoint
}

// ===============================================================
// ENDPOINTS
// ===============================================================

// --- Login del admin ---------------------------------------------
app.post('/api/login', (req, res) => {
  const { usuario, clave } = req.body;
  if (usuario !== ADMIN_USER || clave !== ADMIN_PASS) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  }
  const token = crypto.randomBytes(24).toString('hex');
  tokensValidos.add(token);
  res.json({ token });
});

// --- Productos (público): solo los aprobados, con búsqueda y filtro --
app.get('/api/productos', (req, res) => {
  const { buscar = '', tipo = '' } = req.query;
  let lista = leer(RUTA_PRODUCTOS).filter(p => p.estado === 'aprobado');

  if (tipo) lista = lista.filter(p => p.tipo === tipo);
  if (buscar) {
    const texto = buscar.toLowerCase();
    lista = lista.filter(p =>
      (p.nombre + ' ' + p.descripcion + ' ' + p.categoria).toLowerCase().includes(texto)
    );
  }
  res.json(lista);
});

// --- Productos (admin): TODOS, incluidos los pendientes ----------------
app.get('/api/admin/productos', soloAdmin, (req, res) => {
  res.json(leer(RUTA_PRODUCTOS));
});

// --- Publicar un producto (público). Queda "pendiente" hasta que el admin lo apruebe
app.post('/api/productos', (req, res) => {
  const { nombre, tipo, categoria, precio, descripcion, puntoEntrega, vendedor, contacto } = req.body;

  // Validaciones: si algo está mal respondemos 400 con un mensaje claro
  if (!nombre || !descripcion || !vendedor || !contacto) {
    return res.status(400).json({ error: 'Completa nombre, descripción, tu nombre y tu correo.' });
  }
  if (!TIPOS_VALIDOS.includes(tipo)) {
    return res.status(400).json({ error: 'El tipo debe ser venta, intercambio o servicio.' });
  }
  if (!esCorreoInstitucional(contacto)) {
    return res.status(400).json({ error: 'Usa tu correo institucional (@unal.edu.co).' });
  }
  const precioNumero = Number(precio) || 0;
  if (precioNumero < 0) {
    return res.status(400).json({ error: 'El precio no puede ser negativo.' });
  }

  const productos = leer(RUTA_PRODUCTOS);
  const nuevo = {
    id: Date.now(),
    nombre: nombre.trim(),
    tipo,
    categoria,
    precio: tipo === 'intercambio' ? 0 : precioNumero,
    descripcion: descripcion.trim(),
    puntoEntrega,
    vendedor: vendedor.trim(),
    contacto: contacto.trim().toLowerCase(),
    estado: 'pendiente',
    fecha: new Date().toISOString()
  };
  productos.unshift(nuevo); // unshift = lo pone de primero
  guardar(RUTA_PRODUCTOS, productos);
  res.status(201).json(nuevo);
});

// --- Aprobar un producto (admin) --------------------------------
app.put('/api/productos/:id', soloAdmin, (req, res) => {
  const productos = leer(RUTA_PRODUCTOS);
  const producto = productos.find(p => p.id === Number(req.params.id));
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });

  if (!['aprobado', 'pendiente'].includes(req.body.estado)) {
    return res.status(400).json({ error: 'Estado inválido.' });
  }
  producto.estado = req.body.estado;
  guardar(RUTA_PRODUCTOS, productos);
  res.json(producto);
});

// --- Borrar un producto (admin) ---------------------------------
app.delete('/api/productos/:id', soloAdmin, (req, res) => {
  const productos = leer(RUTA_PRODUCTOS);
  const restantes = productos.filter(p => p.id !== Number(req.params.id));
  if (restantes.length === productos.length) {
    return res.status(404).json({ error: 'Producto no encontrado.' });
  }
  guardar(RUTA_PRODUCTOS, restantes);
  res.json({ ok: true });
});

// --- Formulario de contacto (público) ----------------------------
app.post('/api/mensajes', (req, res) => {
  const { nombre, correo, asunto, mensaje } = req.body;
  if (!nombre || !correo || !asunto || !mensaje) {
    return res.status(400).json({ error: 'Completa todos los campos.' });
  }
  const mensajes = leer(RUTA_MENSAJES);
  const nuevo = { id: Date.now(), nombre, correo, asunto, mensaje, fecha: new Date().toISOString() };
  mensajes.unshift(nuevo);
  guardar(RUTA_MENSAJES, mensajes);
  res.status(201).json({ ok: true });
});

// --- Ver mensajes de contacto (admin) ----------------------------
app.get('/api/mensajes', soloAdmin, (req, res) => {
  res.json(leer(RUTA_MENSAJES));
});

// --- Chatbot "UNiBot" (IA personalizada) -------------------------
// Conoce los productos reales de la base de datos y habla con el tono de la marca.
// Si existe la variable ANTHROPIC_API_KEY usa una IA real (Claude); si no, usa reglas simples.
app.post('/api/chat', async (req, res) => {
  const pregunta = (req.body.mensaje || '').trim();
  if (!pregunta) return res.status(400).json({ error: 'Escribe una pregunta.' });

  const productos = leer(RUTA_PRODUCTOS).filter(p => p.estado === 'aprobado');

  // Resumen de los productos para dárselo a la IA como "conocimiento"
  const catalogo = productos
    .map(p => `- ${p.nombre} (${p.tipo}, $${p.precio} COP, entrega: ${p.puntoEntrega})`)
    .join('\n');

  // Opción A: IA real
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const respuesta = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-5-5',
          max_tokens: 300,
          // "system" = instrucciones de personalidad y conocimiento del negocio
          system:
            'Eres UNiBot, el asistente de UNiMarket, el marketplace de estudiantes de la Universidad Nacional sede Medellín. ' +
            'Hablas cercano, amable y breve, como un compañero de campus. ' +
            'Solo recomiendas productos de este catálogo:\n' + catalogo + '\n' +
            'Para vender: botón "Publicar" y esperar aprobación del admin. Si no sabes algo, dilo.',
          messages: [{ role: 'user', content: pregunta }]
        })
      });
      const datos = await respuesta.json();
      return res.json({ respuesta: datos.content[0].text });
    } catch (error) {
      console.log('Falló la IA, uso respuestas simples:', error.message);
    }
  }

  // Opción B: reglas simples (funciona sin internet ni claves)
  res.json({ respuesta: respuestaSimple(pregunta.toLowerCase(), productos) });
});

function respuestaSimple(texto, productos) {
  // 1) ¿Menciona algo que esté en el catálogo?
  const coincidencias = productos.filter(p =>
    (p.nombre + ' ' + p.categoria).toLowerCase().split(' ')
      .some(palabra => palabra.length > 3 && texto.includes(palabra))
  );
  if (coincidencias.length > 0) {
    const lista = coincidencias.map(p => `${p.nombre} (entrega: ${p.puntoEntrega})`).join(', ');
    return `¡Mira lo que encontré! ${lista}. Pulsa "Contactar" en la tarjeta para escribirle al vendedor.`;
  }
  // 2) Temas frecuentes
  if (texto.includes('vender') || texto.includes('publicar')) {
    return 'Para vender, pulsa "Publicar", llena el formulario con tu correo @unal.edu.co y espera la aprobación del administrador. ¡Así cuidamos el campus!';
  }
  if (texto.includes('intercambi') || texto.includes('cambio')) {
    return 'En UNiMarket puedes intercambiar: publica tu artículo con tipo "Intercambio" y cuenta qué buscas a cambio.';
  }
  if (texto.includes('pago') || texto.includes('pagar')) {
    return 'UNiMarket no procesa pagos. Se acuerda directamente con el vendedor y se entrega en un punto del campus.';
  }
  // 3) Respuesta por defecto
  return 'Soy UNiBot 🎓. Pregúntame por snacks, libros, servicios o cómo vender en el campus.';
}

// ---------------------------------------------------------------
app.listen(PUERTO, () => {
  console.log(`UNiMarket funcionando en http://localhost:${PUERTO}`);
});
