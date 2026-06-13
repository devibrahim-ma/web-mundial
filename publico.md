# Guía de Dominio y Despliegue para Lanzamiento Público

Para lanzar la quiniela del Mundial 2026 al público con un dominio personalizado y sencillo, sigue estos pasos secuenciales:

---

## Paso 1: Registrar el Dominio

Debes elegir y comprar un nombre de dominio que sea corto, fácil de recordar y escribir (ej. `quinielamundial2026.com`, `quinielachavules.com`, `predicciones2026.net`).

### Registradores recomendados:
* **Namecheap** (Excelente relación calidad-precio y DNS rápido).
* **Porkbun** (Muy económico y transparente).
* **DonDominio** o **Arsys** (Si prefieres soporte en español y dominios locales como `.es`).

### Proceso de compra:
1. Entra al sitio web del registrador seleccionado.
2. Introduce tu nombre ideal en el buscador de dominios.
3. Si está disponible, añádelo al carrito de compra.
4. Completa el registro de usuario e introduce tus datos de pago. 
   > [!TIP]
   > Asegúrate de activar la opción gratuita de **Privacidad de WHOIS** (WHOIS Privacy) para evitar que tus datos personales sean públicos.

---

## Paso 2: Añadir el Dominio a Vercel

Vercel gestionará la redirección de tráfico y el certificado de seguridad SSL gratis de forma automática.

1. Ve a tu panel de **Vercel Dashboard**.
2. Selecciona tu proyecto `web-mundial`.
3. Ve a la pestaña superior **Settings** (Configuración) y en el menú lateral de la izquierda haz clic en **Domains** (Dominios).
4. Introduce tu dominio en el campo de texto (ej. `tu-dominio.com`) y pulsa **Add** (Añadir).
5. Vercel te preguntará si quieres añadir el dominio limpio y la redirección recomendada con `www` (ej. redirigir `tu-dominio.com` a `www.tu-dominio.com`). Elige **Add** en la opción recomendada.

---

## Paso 3: Configurar los registros DNS en tu Registrador

Una vez añadido a Vercel, este te mostrará un estado en rojo diciendo **Invalid Configuration** y te dará los registros exactos que debes configurar en tu registrador de dominios.

1. Abre una nueva pestaña, inicia sesión en tu registrador de dominios (donde compraste el dominio en el Paso 1).
2. Busca la sección de **Mis Dominios**, selecciona el tuyo y ve a **DNS Zone Editor** (Editor de Zona DNS / Configuración DNS).
3. Añade los siguientes dos registros (borra cualquier registro anterior del mismo tipo que tenga el nombre `@` o `www` para evitar conflictos):

### Registro A (Para el dominio sin www):
* **Tipo:** `A`
* **Nombre / Host / @:** `@` (o déjalo en blanco si tu registrador no requiere caracteres).
* **Valor / Destino:** `76.76.21.21` (Dirección IP oficial de Vercel).
* **TTL:** Por defecto o `3600`.

### Registro CNAME (Para el dominio con www):
* **Tipo:** `CNAME`
* **Nombre / Host / @:** `www`
* **Valor / Destino:** `cname.vercel-dns.com.`
* **TTL:** Por defecto o `3600`.

---

## Paso 4: Verificación y Certificado SSL

1. Regresa a la pestaña de Vercel y haz clic en el botón **Refresh** o espera unos minutos.
2. Vercel detectará el cambio DNS en internet (este proceso de propagación puede tardar entre 2 y 15 minutos en completarse).
3. Cuando la configuración DNS sea correcta, el estado cambiará a color verde indicando **Valid Configuration**.
4. Vercel generará el certificado de seguridad SSL en unos segundos y el sitio pasará a ser seguro automáticamente (`https://www.tu-dominio.com`).

---

## Paso 5: Probar el Dominio

1. Abre tu navegador de internet en modo incógnito.
2. Entra a `https://www.tu-dominio.com` y comprueba que cargue tu quiniela perfectamente.
3. Prueba también a entrar a `https://tu-dominio.com` (sin `www`) y comprueba que redirija de manera óptima a la versión de `www`.
