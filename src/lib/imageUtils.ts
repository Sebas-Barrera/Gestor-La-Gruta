/**
 * Utilidades para manejo de imágenes de productos.
 *
 * Estas funciones permiten convertir URLs de imágenes externas a data URLs
 * en formato base64, de modo que las imágenes se almacenen directamente en
 * la base de datos y funcionen sin conexión a internet.
 *
 * ────────────────────────────────────────────────────────────────
 * Flujo de almacenamiento:
 *   1. El usuario pega una URL de imagen en el formulario
 *   2. El frontend descarga la imagen y la convierte a base64
 *   3. Se almacena el data URL (ej: "data:image/png;base64,iVBOR...")
 *      en el campo `products.image` (tipo TEXT en DB)
 *   4. Para renderizar, se usa el data URL directamente en <img src="">
 *
 * Nota para backend:
 *   - El campo `image` puede contener:
 *     a) Un data URL base64 (generado por el frontend para offline)
 *     b) Una ruta relativa (ej: "/products/coca355lata.png")
 *     c) NULL si el producto no tiene imagen
 *   - Tamaño estimado por imagen: 30-100 KB en base64
 *   - Si se implementa almacenamiento de archivos (S3, etc.), el backend
 *     puede reemplazar el base64 por una URL servida desde el storage
 * ────────────────────────────────────────────────────────────────
 */

/**
 * Convierte una URL de imagen a un data URL en formato base64.
 *
 * Utiliza un elemento <img> + <canvas> para descargar y codificar la imagen.
 * Funciona con URLs externas siempre que el servidor permita CORS,
 * y con rutas locales (ej: "/products/coca355lata.png").
 *
 * @param url - URL de la imagen a convertir
 * @param maxWidth - Ancho máximo para redimensionar (default: 256px, optimiza almacenamiento)
 * @returns Promise con el data URL base64 (ej: "data:image/png;base64,...")
 * @throws Error si la imagen no puede cargarse
 *
 * @example
 * const base64 = await urlToBase64('https://example.com/product.png');
 * // → "data:image/png;base64,iVBORw0KGgo..."
 */
export function urlToBase64(url: string, maxWidth = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo crear contexto de canvas'));
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      reject(new Error(`No se pudo cargar la imagen: ${url}`));
    };

    img.src = url;
  });
}

/**
 * Determina si un string es un data URL de imagen en base64.
 *
 * @param value - String a evaluar
 * @returns true si el string comienza con "data:image/"
 */
export function isBase64Image(value: string): boolean {
  return value.startsWith('data:image/');
}

/**
 * Determina si un string es una ruta local de imagen (ej: "/products/coca.png").
 *
 * @param value - String a evaluar
 * @returns true si es una ruta relativa a un archivo de imagen
 */
export function isLocalPath(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//');
}

/**
 * Determina si un string parece ser una URL válida de imagen.
 * Acepta URLs http/https y rutas relativas con extensiones de imagen comunes.
 *
 * @param value - String a evaluar
 * @returns true si parece ser una URL de imagen válida
 */
export function isValidImageUrl(value: string): boolean {
  if (!value.trim()) return false;
  if (isBase64Image(value)) return true;
  if (isLocalPath(value)) return true;

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
