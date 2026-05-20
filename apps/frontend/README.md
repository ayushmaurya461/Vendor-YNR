# Frontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.9.

## Development server

To start a local development server, run:

```bash
ng serve
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

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Android (Capacitor)

This app ships as a native Android project via [Capacitor](https://capacitorjs.com/).

### Prerequisites

- [Android Studio](https://developer.android.com/studio) with Android SDK
- JDK 17+
- API server running locally (`apps/api`, port 3000)

### Build and run on emulator

```bash
cd apps/frontend
npm run cap:run:android
```

Or open the project in Android Studio:

```bash
npm run cap:sync
npm run cap:android
```

### API URL on device

- **Android emulator**: API calls go to `http://10.0.2.2:3000` (maps to your machine’s `localhost`).
- **Physical device**: use your computer’s LAN IP in `src/environments/environment.development.ts`, or add a dedicated build configuration.

Ensure the API is reachable from the device and that `FRONTEND_ORIGIN` in `apps/api/.env` includes your web dev origin (Capacitor’s `https://localhost` is allowed in development automatically).

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
