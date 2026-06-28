# WebMundial

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.27.

## Development server

To start a local development server, run:

```bash
npm start
```
o
```bash
npx ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

---

## 📱 Distribución Móvil con Capacitor

Para generar la versión nativa móvil (Android/iOS) usando Capacitor, sigue estos pasos:

### 1. Construir la aplicación web
Compila el proyecto de Angular para generar los archivos listos en `dist/web-mundial/browser`:
```bash
npm run build
```

### 2. Sincronizar con Capacitor
Copia los archivos compilados a las plataformas móviles nativas y sincroniza los plugins:
```bash
npx cap sync
```

### 3. Agregar plataformas (si no se han agregado antes)
Para inicializar los directorios nativos de Android o iOS:
```bash
npx cap add android
npx cap add ios
```

### 4. Abrir en los entornos nativos (Android Studio / Xcode)
Para abrir el proyecto en el IDE nativo y compilar o depurar la aplicación:
```bash
npx cap open android
npx cap open ios
```

### 5. Ejecutar directamente desde la terminal
Si tienes un dispositivo físico conectado o un emulador abierto:
```bash
npx cap run android
npx cap run ios
```

---

## 🚀 Despliegue en Vercel

Para desplegar la aplicación en Vercel, tienes dos opciones principales:

### Opción A: Despliegue mediante CLI (Línea de Comandos)

1. **Instalar la CLI de Vercel globalmente (si no la tienes):**
   ```bash
   npm install -g vercel
   ```
2. **Iniciar sesión en tu cuenta de Vercel:**
   ```bash
   vercel login
   ```
3. **Desplegar en entorno de pruebas (Preview):**
   ```bash
   vercel
   ```
4. **Desplegar en producción (Production):**
   ```bash
   vercel --prod
   ```

> [!NOTE]
> Vercel leerá automáticamente la configuración especificada en tu archivo `vercel.json` (que ya define `dist/web-mundial/browser` como directorio de salida).

### Opción B: Integración Continua (Recomendado)
1. Sube tu código a un repositorio Git (GitHub, GitLab, Bitbucket).
2. Ve al panel de [Vercel](https://vercel.com/) y selecciona **Add New > Project**.
3. Importa tu repositorio.
4. Vercel detectará que es un proyecto Angular y usará la configuración de tu archivo `vercel.json` de forma automática. Cada vez que hagas `git push`, se redesplegará automáticamente.
