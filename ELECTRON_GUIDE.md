# Electron - Guia de Integracion

## Dependencias instaladas

| Paquete | Version | Tipo | Proposito |
|---|---|---|---|
| `electron` | ^35.7.5 | devDependency | Motor principal, ventana nativa |
| `electron-builder` | ^26.8.1 | devDependency | Empaquetado e instaladores |
| `concurrently` | ^9.2.1 | devDependency | Ejecutar Vite + Electron en paralelo |
| `wait-on` | ^9.0.4 | devDependency | Esperar a que Vite inicie antes de abrir Electron |

### Comando de instalacion

```bash
npm install --save-dev electron@^35.7.5 electron-builder@^26.8.1 concurrently@^9.2.1 wait-on@^9.0.4
```

---

## Comandos disponibles

### Desarrollo

| Comando | Descripcion |
|---|---|
| `npm run dev` | Inicia la app **en el navegador** (Vite normal, como siempre) |
| `npm run electron:dev` | Inicia la app **en ventana Electron** con hot reload |

### Compilacion

| Comando | Descripcion |
|---|---|
| `npm run build` | Compila solo frontend (para navegador/deploy web) |
| `npm run electron:build` | Compila + empaqueta instalador de escritorio |

### Preview

| Comando | Descripcion |
|---|---|
| `npm run preview` | Preview del build web en navegador |
| `npm run electron:preview` | Preview del build en ventana Electron (sin hot reload) |

### Auxiliares

| Comando | Descripcion |
|---|---|
| `npm run electron:compile` | Solo compila los archivos TypeScript de Electron a CJS |

---

## Estructura de archivos Electron

```
app/
├── electron/
│   ├── main.ts          -> Proceso principal (crea ventana, ciclo de vida)
│   ├── preload.ts       -> Puente seguro frontend <-> backend (IPC)
│   └── tsconfig.json    -> Config TS para compilar a CommonJS
├── dist-electron/        -> Output compilado (gitignored)
│   ├── main.js
│   ├── preload.js
│   └── package.json     -> {"type":"commonjs"} (generado automaticamente)
├── src/                  -> App React (sin cambios mayores)
├── electron-builder.yml  -> Config de empaquetado
└── package.json          -> Scripts actualizados
```

---

## Empaquetado (generar instaladores)

### Windows
```bash
npm run electron:build -- --win
```
Genera: `dist-electron-app/` -> archivo `.exe` (NSIS installer)

### macOS
```bash
npm run electron:build -- --mac
```
Genera: `dist-electron-app/` -> archivo `.dmg`

### Linux
```bash
npm run electron:build -- --linux
```
Genera: `dist-electron-app/` -> archivo `.AppImage` o `.deb`

### Todas las plataformas (desde macOS)
```bash
npm run electron:build -- --win --mac --linux
```

> **Nota**: Para compilar para Windows desde macOS necesitas Wine instalado, o usar CI/CD (GitHub Actions).

---

## Arquitectura IPC (para tu companero del backend)

```
+-----------------------------------------+
|           Renderer Process              |
|       (Tu app React - src/)             |
|                                         |
| window.electronAPI.invoke('canal', data)|
|              |                          |
+-----------------------------------------+
               |
+-----------------------------------------+
|           Preload Script                |
|       (electron/preload.ts)             |
|  contextBridge.exposeInMainWorld(...)   |
|              |                          |
+-----------------------------------------+
               |
+-----------------------------------------+
|           Main Process                  |
|        (electron/main.ts)               |
|                                         |
| ipcMain.handle('canal', handler)        |
|              |                          |
| SQLite / File System / Hardware         |
+-----------------------------------------+
```

### Ejemplo de flujo futuro (referencia para backend)

```typescript
// En React (renderer) - usa window.electronAPI
const products = await window.electronAPI.invoke('db:query', { table: 'products' })

// En preload.ts - ya configurado, expone electronAPI al renderer
// No necesita cambios, los canales se definen con tipos

// En main.ts - tu companero implementara los handlers
ipcMain.handle('db:query', async (_event, params) => {
  return db.query(params) // SQLite
})
```

---

## Modo Kiosk (monitores tactiles)

El main.ts incluye soporte para modo kiosk. Para activarlo:

- **Atajo**: `Ctrl+Shift+K` alterna entre modo kiosk y modo normal
- **Por defecto**: arranca en modo ventana normal durante desarrollo
- En produccion se puede configurar para arrancar directamente en kiosk

### Modo kiosk = pantalla completa sin barra de titulo, ideal para bares.

---

## Notas importantes

1. **HashRouter**: Se usa `HashRouter` en vez de `BrowserRouter` para compatibilidad con `file://`
2. **Navegador sigue funcionando**: `npm run dev` abre en el navegador como siempre
3. **Hot reload**: Cambios en React se reflejan en Electron (Vite sirve la app)
4. **Seguridad**: `nodeIntegration` esta deshabilitado, todo pasa por el preload (buena practica)
5. **CommonJS**: Los archivos Electron se compilan a CJS con `tsc` para evitar problemas ESM/CJS
6. **ELECTRON_RUN_AS_NODE**: Los scripts limpian esta variable automaticamente

## Troubleshooting

### Electron no abre o `require('electron')` falla
Verifica que `ELECTRON_RUN_AS_NODE` NO este definida en tu terminal:
```bash
echo $ELECTRON_RUN_AS_NODE
# Si devuelve "1", ejecuta:
unset ELECTRON_RUN_AS_NODE
```

### El puerto 5173 ya esta en uso
Cierra otros procesos de Vite o cambia el puerto en `vite.config.ts`.

### DevTools muestra errores de "Autofill.enable"
Es un warning interno de Chromium, completamente inofensivo. Ignorar.
