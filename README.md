# UNiMarket

Marketplace para estudiantes de la Universidad Nacional (sede Medellín). Proyecto final Jóvenes creaTIvos 2026.

## Carpetas
```
unimarket/
├── frontend/          Lo que ve el usuario (se publica en GitHub Pages)
│   ├── index.html     La página completa
│   ├── css/estilos.css
│   └── js/
│       ├── api.js     Función que habla con el backend
│       ├── app.js     Catálogo, publicar, contacto y chatbot
│       └── admin.js   Login y panel del administrador
├── backend/           El servidor (se publica en Render u otro servicio)
│   ├── server.js      Todos los endpoints
│   └── data/          Base de datos en JSON (productos.json, mensajes.json)
└── arquitectura.md    El plano del proyecto (entregable del taller)
```

## Cómo correrlo en tu computador
1. Instala Node.js (nodejs.org).
2. En una terminal:
   ```
   cd backend
   npm install
   npm start
   ```
3. Abre http://localhost:3000
4. Admin de prueba: `admin@unal.edu.co` / `admin123`

## Cómo publicarlo
GitHub Pages solo muestra páginas estáticas, así que va por partes:
1. **Backend** en Render (gratis): New Web Service → tu repo → Root Directory `backend` → Build `npm install` → Start `npm start`. En Environment agrega `ADMIN_USER` y `ADMIN_PASS` (cámbialos). Opcional: `ANTHROPIC_API_KEY` para la IA real.
2. En `frontend/js/api.js` cambia `API_URL` por la URL que te dé Render.
3. **Frontend** en GitHub Pages: Settings → Pages → rama `main`, carpeta `/frontend` (si solo permite `/root` o `/docs`, renombra `frontend` a `docs`).

Importante: en el plan gratuito de Render los archivos se reinician al redeployar; los datos de ejemplo vuelven a `data/`.
