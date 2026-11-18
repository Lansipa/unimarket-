# Arquitectura de UNiMarket

## 1. Qué es
Mi aplicación sirve para que los estudiantes de la Universidad Nacional (sede Medellín) puedan comprar, vender e intercambiar productos y servicios dentro del campus sin tener que buscar en grupos de WhatsApp desordenados.

## 2. Qué hace
### Imprescindible (MVP)
- Ver los artículos disponibles (acción número uno)
- Buscar y filtrar artículos por tipo
- Publicar un artículo (queda pendiente de aprobación)
- Enviar un mensaje de contacto
- (Admin) Iniciar sesión, aprobar/borrar artículos y leer mensajes

### Deseable
- Preguntarle a UNiBot por productos (IA)
- Subir foto del producto
- Calificar vendedores

### Fuera de alcance por ahora
- No procesa pagos reales
- No tiene registro de usuarios ni app de celular
- No envía correos automáticos

## 3. Quién lo usa
| Rol | Qué puede hacer | Qué no |
|-----|-----------------|--------|
| Visitante (estudiante) | Ver catálogo, publicar, contactar, chatear con UNiBot | Aprobar o borrar publicaciones, leer mensajes |
| Admin | Todo lo anterior + aprobar, borrar, leer mensajes | — |

**¿Necesito registro?** No. La app no tiene que recordar nada que pertenezca a una persona. Para evitar abusos, quien publica debe escribir un correo @unal.edu.co y el admin aprueba cada publicación. El admin no se registra: se crea a mano (usuario y clave en variables del servidor).

## 4. Qué guarda
### Colección: productos (`backend/data/productos.json`)
| Campo | Tipo | ¿Obligatorio? | Ejemplo |
|-------|------|---------------|---------|
| id | Número | Sí | 1730000000000 |
| nombre | Texto | Sí | "Brownies caseros" |
| tipo | Texto con opciones | Sí | "venta" / "intercambio" / "servicio" |
| categoria | Texto | Sí | "Snacks" |
| precio | Número | Sí | 3500 |
| descripcion | Texto | Sí | "Con nueces" |
| puntoEntrega | Texto | Sí | "Cafetería" |
| vendedor | Texto | Sí | "Laura Sierra" |
| contacto | Texto | Sí | "lsierra@unal.edu.co" |
| estado | Texto con opciones | Sí | "pendiente" / "aprobado" |
| fecha | Fecha (texto ISO) | Sí | "2026-11-01T10:00:00.000Z" |

### Colección: mensajes (`backend/data/mensajes.json`)
| Campo | Tipo | ¿Obligatorio? | Ejemplo |
|-------|------|---------------|---------|
| id | Número | Sí | 1730000000000 |
| nombre | Texto | Sí | "Ana Ríos" |
| correo | Texto | Sí | "ana@mail.com" |
| asunto | Texto | Sí | "Sugerencia" |
| mensaje | Texto | Sí | "Podrían agregar..." |
| fecha | Fecha (texto ISO) | Sí | "2026-11-05T09:00:00.000Z" |

**Relación:** las dos colecciones son independientes (no se referencian).
**Datos sensibles:** no se guardan contraseñas de usuarios. La clave del admin vive en una variable de entorno, no en el JSON. El correo del vendedor es público en la tarjeta (se necesita para contactarlo).

## 5. Endpoints
| Acción | Verbo | Ruta | Devuelve | Códigos |
|--------|-------|------|----------|---------|
| Ver artículos aprobados (con búsqueda) | GET | /api/productos?buscar=&tipo= | Lista | 200 |
| Publicar artículo | POST | /api/productos | El creado | 201 / 400 |
| Iniciar sesión admin | POST | /api/login | Token | 200 / 401 |
| Ver todos los artículos (admin) | GET | /api/admin/productos | Lista | 200 / 401 |
| Aprobar artículo (admin) | PUT | /api/productos/:id | El editado | 200 / 400 / 401 / 404 |
| Borrar artículo (admin) | DELETE | /api/productos/:id | { ok: true } | 200 / 401 / 404 |
| Enviar mensaje de contacto | POST | /api/mensajes | { ok: true } | 201 / 400 |
| Ver mensajes (admin) | GET | /api/mensajes | Lista | 200 / 401 |
| Preguntar a UNiBot | POST | /api/chat | { respuesta } | 200 / 400 |

## 6. Pantallas
| Pantalla | Quién la ve | Endpoint | Estado vacío / carga / error |
|----------|-------------|----------|------------------------------|
| Inicio (hero) | Todos | — | — |
| Catálogo | Todos | GET /api/productos | "No encontramos artículos. ¡Sé el primero en publicar uno!" · "Cargando artículos..." · "No pudimos cargar el catálogo..." |
| Publicar (ventana) | Todos | POST /api/productos | Mensaje de error claro (ej. correo no institucional) |
| Contacto | Todos | POST /api/mensajes | Botón "Enviando..." y aviso de éxito/error |
| Panel admin | Admin | GET /api/admin/productos, GET /api/mensajes | "Aún no hay productos." / "Aún no hay mensajes." |
| Chat UNiBot | Todos | POST /api/chat | "Escribiendo..." y mensaje de error amable |

## 7. Recorrido de la acción principal (ver artículos)
```
El usuario abre la página (o escribe en el buscador)
        ↓
El frontend ejecuta fetch("/api/productos?buscar=libro&tipo=", { method: "GET" })
        ↓
Llega al endpoint GET /api/productos
        ↓
El backend valida: nada obligatorio; filtra solo estado "aprobado"
        ↓
Lee productos.json (fs.readFileSync) y filtra por texto y tipo
        ↓
Responde con código 200 y la lista de productos
        ↓
El frontend muestra las tarjetas (o "No encontramos artículos")
```

## 8. Decisiones y pendientes
- Decidí usar archivos JSON como base de datos porque es lo más simple de explicar y no requiere instalar nada.
- Decidí NO tener registro de usuarios y aprobar publicaciones a mano, para ahorrar trabajo y aun así moderar.
- Decidí que el chatbot use reglas simples y, si hay una clave, una IA real con el catálogo como conocimiento.
- Todavía no sé cómo verificar de verdad que alguien es estudiante (hoy solo se revisa que el correo termine en @unal.edu.co).
- Todavía no sé cómo guardar los datos de forma permanente en un servidor gratuito (los archivos JSON pueden reiniciarse).
- Todavía no sé cómo cifrar la clave del admin (pendiente: bcrypt).
- Necesito apoyo en: publicar el backend en internet y conectarlo con GitHub Pages.
