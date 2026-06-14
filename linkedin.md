# 🚀 Guía LinkedIn — Mundial 2026 Quiniela App

---

## ✅ Verificación Técnica Antes de Subir a Vercel

### Estado del backend (Functions serverless de Vercel)

| Función | Archivo | Estado | Notas |
|---|---|---|---|
| Resultados reales (partidos) | `api/matches.js` | ✅ OK | Proxy a `api.football-data.org` usando el token guardado en Firebase. Funciona igual en Vercel. |
| Info de equipo + jugadores | `api/team.js` | ✅ OK | Funciona en Vercel como Serverless Function automáticamente. |

### ¿Funcionará en Vercel?

**SÍ**, con matices:

- Las llamadas a Firebase (Realtime Database) funcionan desde el navegador directamente — **no necesitan servidor**. Vercel solo actúa como host del Angular build.
- Las rutas `/api/team` y `/api/matches` son **Serverless Functions de Vercel** — se detectan automáticamente porque están en la carpeta `/api/`. Funcionan exactamente igual en producción.
- El token de la API de football-data.org se guarda en Firebase (`mundial_global/apiToken`) y se pasa desde el cliente a la función serverless. ✅

> ⚠️ **Punto crítico**: El token de `football-data.org` tiene límite de peticiones en el plan gratuito (10 req/min). Como el sincronismo lo gestiona el admin manualmente desde Firebase, esto **no debería ser un problema**.

---

### Verificaciones clave de `api/team.js`

#### 1. ¿Incluye los 23 jugadores?
✅ **SÍ** — El servidor obtiene la plantilla de Wikipedia (`2026_FIFA_World_Cup_squads`), que tiene los 26 convocados oficiales. Parsea todas las filas `nat-fs-player` de la tabla del país correspondiente. Si Wikipedia falla, usa TheSportsDB como fallback (que puede devolver menos).

#### 2. ¿Busca imagen cotejando el nombre completo?
✅ **SÍ, con protecciones**:
- Primero compara contra los ~10 jugadores que devuelve `lookup_all_players.php` (busca si un nombre contiene al otro tras normalizar acentos y signos)
- Para los que no encuentre foto, hace `searchplayers.php` individualmente
- Tiene **`PLAYER_NAME_OVERRIDES`** para apodos conocidos (`"Rodri"` → `"Rodrigo Hernández Cascante"`, `"Pedri"`, `"Gavi"`, `"Neymar"`, etc.)
- Filtra jugadores retirados (equipos que empiezan por `_` o contienen `"retired"`)

> ⚠️ **Punto débil conocido**: TheSportsDB puede devolver el primer resultado de la búsqueda si no hay coincidencia exacta. El código usa `matchedPlayer || activePlayers[0]`, lo que en jugadores con nombres muy comunes puede dar falsos positivos. Esto ya es una limitación de la API gratuita.

#### 3. ¿Filtra sub-17, sub-21, etc.?
✅ **SÍ** — La fuente principal es **Wikipedia** con la página `2026_FIFA_World_Cup_squads` (la plantilla oficial del Mundial absoluto). No hay confusión con categorías inferiores porque la página es específica de la competición.

El fallback de TheSportsDB sí podría traer equipos sub-21 si se busca por nombre, pero el ID que se pasa (`sportsDbId`) pertenece a la selección absoluta tal como está definido en `constants.ts`.

#### 4. ¿Traduce la descripción?
✅ **SÍ** — Usa `MyMemory` (API gratuita, sin key). Prioridad:
1. Si TheSportsDB tiene `strDescriptionES` → la usa directamente
2. Si no → traduce `strDescriptionEN` con MyMemory (límite 450 chars)
3. Si MyMemory falla → devuelve el texto en inglés

---

## 📦 Mejoras Recomendadas Antes de Publicar (Opciones Gratuitas)

### 1. 🖼️ Almacenamiento de imágenes — Alternativas gratuitas a S3

| Servicio | Plan gratuito | Ideal para |
|---|---|---|
| **Cloudinary** | 25 GB storage / 25 GB bandwidth/mes | Imágenes optimizadas con CDN, transformaciones automáticas (resize, webp) |
| **Supabase Storage** | 1 GB gratuito | Compatible con S3 API, perfecto si ya usas Supabase |
| **Firebase Storage** | 5 GB gratuito | Ya tienes Firebase — podrías subir las fotos de perfil aquí |
| **GitHub + jsDelivr** | Ilimitado (para assets estáticos) | Para imágenes pequeñas de perfil como las actuales |

**Recomendación**: Las imágenes de perfil (`ibra.jpeg`, etc.) son ~10-100 KB cada una — **no necesitas S3**. Donde sí tiene sentido usar Cloudinary es para las fotos de los jugadores que ahora vienen de TheSportsDB. Podrías cachearlas ahí para no depender de una API externa.

### 2. ⚡ Optimización de rendimiento

- **Lazy loading de imágenes**: Añadir `loading="lazy"` a todos los `<img>` de banderas y jugadores
- **Service Worker / PWA**: Añadir `@angular/pwa` para que funcione offline y se pueda instalar como app
- **`ng build --configuration production`**: Compilar en modo producción minimiza y hace tree-shaking del bundle. Vercel lo hace automáticamente si el script `build` es `ng build`

### 3. 🔐 Seguridad de Firebase

- Actualmente las **Firebase Rules** probablemente están en modo `test` (permitir todo). Antes de publicar:
  - Usuarios solo pueden leer/escribir su propio perfil
  - Solo el admin puede escribir `mundial_global/realResults`
  - Regla de ejemplo en el README

### 4. 🌐 SEO básico

- Añadir `<meta name="description">` en `index.html`
- Añadir `og:title`, `og:image`, `og:description` para que al compartir el link en WhatsApp/LinkedIn se vea una preview bonita
- Ejemplo: imagen con el logo del Mundial 2026 + "Quiniela Chavules"

---

## 📢 Cómo Promocionar en LinkedIn

### Formato recomendado: **Post con vídeo + texto + imágenes** (en ese orden de impacto)

El algoritmo de LinkedIn penaliza los posts con solo links externos. Lo más efectivo:

1. **Vídeo corto** (30-60 segundos) grabando la pantalla: navegar por la app, cambiar de perfil, ver la clasificación. Puedes grabarlo con OBS (gratis) o con la herramienta de captura de pantalla de Windows.
2. **Imágenes** de la interfaz si no tienes vídeo (3-4 capturas en el carrusel de LinkedIn)
3. **El link en el primer comentario**, no en el post (LinkedIn penaliza posts con links externos).

---

### 📝 Texto del Post (versión recomendada)

```
🌍 Hice una quiniela del Mundial 2026 para mis amigos... y se me fue un poco de las manos.

Lo que empezó como "metemos los partidos en un Excel" se convirtió en una aplicación web completa con:

⚽ Predicciones de fase de grupos y eliminatorias
📊 Clasificación en tiempo real (Firebase Realtime Database)
🗓️ Calendario sincronizado con la API de football-data.org
📋 Plantillas oficiales de los 26 convocados (Wikipedia + TheSportsDB)
🎨 Diseño responsivo con glassmorphism y temas por perfil

Stack: Angular 17 · Firebase · Vercel (Serverless Functions) · TheSportsDB API · Wikipedia API · MyMemory Translate

Todo sin gastar un solo euro en infraestructura. 0€/mes en producción.

Soy recién graduado y esto es lo que hago en mi tiempo libre. Si buscas a alguien con ganas de construir cosas reales, hablemos. 💬

🔗 [Enlace en comentarios]

#Angular #Firebase #Vercel #DesarrolloWeb #OpenToWork #FrontendDeveloper #WorldCup2026 #SideProject
```

---

### 💡 Tips adicionales para el post

| Tip | Por qué |
|---|---|
| Publica **martes o miércoles por la mañana** (9-11h) | Mayor actividad en LinkedIn |
| Etiqueta **tecnologías** con `#Angular #Firebase` | Apareces en búsquedas de reclutadores |
| Pon `#OpenToWork` o la bandera verde | Los reclutadores lo buscan activamente |
| Responde a **todos los comentarios** en las primeras 2 horas | El algoritmo amplifica posts con engagement rápido |
| Comparte en **grupos de programación** de LinkedIn | Amplifica el alcance orgánico |
| Añade el link de la web en tu **sección "Proyectos"** del perfil | Los reclutadores revisan esta sección |

---

### 🎯 Puntos clave que debes destacar para reclutadores

- **"0€/mes"** — Demuestra que sabes elegir tecnología con criterio económico
- **"Tiempo real"** con Firebase — Muy valorado en cualquier producto SaaS
- **Serverless Functions** en Vercel — Arquitectura moderna sin servidor propio
- **APIs externas** (football-data, TheSportsDB, Wikipedia, MyMemory) — Integración real
- **Diseño propio** (no template) — Angular standalone components + Tailwind CSS
- **Problema real resuelto** — No es un todo-list: es una app que tus amigos usan

---

### 📌 También haz esto además del post

1. **Añade el proyecto en tu perfil** → Sección "Proyectos" con capturas y el link
2. **Actualiza tu titular** → p.ej: _"Desarrollador Frontend | Angular · Firebase | Buscando primera oportunidad"_
3. **Envía mensaje privado** a 5-10 reclutadores tech con el link de la app (personalizado, no spam)
4. **Comparte el proyecto en GitHub** con README detallado — muchos reclutadores revisan el GitHub

