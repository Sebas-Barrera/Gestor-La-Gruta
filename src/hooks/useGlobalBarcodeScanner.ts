import { useEffect, useRef, useCallback } from 'react';
import { lookupBarcode } from '@/lib/barcodeLookup';
import { cleanBarcode } from '@/lib/barcodeUtils';
import type { Product, ProductBarcode } from '@/types';

interface UseGlobalBarcodeScannerOptions {
  /** Productos del bar activo */
  products: Product[];
  /** Tabla de barcodes (multi-barcode support) */
  productBarcodes: ProductBarcode[];
  /** true = modo ENTRADA, false = modo SALIDA */
  isAddMode: boolean;
  /** Desactiva el listener (ej: cuando hay un modal abierto) */
  enabled: boolean;
  /** Producto encontrado por escaneo */
  onProductScanned: (product: Product, productBarcode?: ProductBarcode) => void;
  /** Código de barras no encontrado */
  onBarcodeNotFound: (barcode: string) => void;
}

/**
 * Hook global que detecta escaneos de código de barras físico.
 *
 * Los escáneres físicos funcionan como teclados:
 *   - Envían caracteres muy rápido (< 80ms entre cada tecla)
 *   - Terminan con Enter
 *
 * El hook acumula caracteres rápidos y, al recibir Enter,
 * busca el código con `lookupBarcode()` y dispara los callbacks.
 */
export function useGlobalBarcodeScanner({
  products,
  productBarcodes,
  isAddMode,
  enabled,
  onProductScanned,
  onBarcodeNotFound,
}: UseGlobalBarcodeScannerOptions) {
  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Refs estables para los callbacks (evitar re-suscripciones)
  const productsRef = useRef(products);
  const productBarcodesRef = useRef(productBarcodes);
  const isAddModeRef = useRef(isAddMode);
  const onProductScannedRef = useRef(onProductScanned);
  const onBarcodeNotFoundRef = useRef(onBarcodeNotFound);

  productsRef.current = products;
  productBarcodesRef.current = productBarcodes;
  isAddModeRef.current = isAddMode;
  onProductScannedRef.current = onProductScanned;
  onBarcodeNotFoundRef.current = onBarcodeNotFound;

  const resetBuffer = useCallback(() => {
    bufferRef.current = '';
    lastKeyTimeRef.current = 0;
  }, []);

  useEffect(() => {
    if (!enabled) {
      resetBuffer();
      return;
    }

    const MAX_KEY_INTERVAL = 80; // ms — un humano tarda > 100ms entre teclas
    const MIN_BARCODE_LENGTH = 4; // códigos de barras tienen al menos 4 dígitos

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el foco está en un input/textarea (formularios abiertos)
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const now = Date.now();

      if (e.key === 'Enter') {
        // Evaluar si el buffer acumulado es un código de barras
        const code = cleanBarcode(bufferRef.current);
        if (code.length >= MIN_BARCODE_LENGTH) {
          e.preventDefault();

          // Buscar el código
          const result = lookupBarcode(
            code,
            productsRef.current,
            productBarcodesRef.current,
          );

          if (result) {
            onProductScannedRef.current(result.product, result.productBarcode);
          } else {
            onBarcodeNotFoundRef.current(code);
          }
        }
        resetBuffer();
        return;
      }

      // Solo acumular caracteres imprimibles de 1 carácter
      if (e.key.length !== 1) return;

      const elapsed = now - lastKeyTimeRef.current;

      if (lastKeyTimeRef.current === 0 || elapsed < MAX_KEY_INTERVAL) {
        // Input rápido → acumular
        bufferRef.current += e.key;
      } else {
        // Demasiado lento → reiniciar con este carácter
        bufferRef.current = e.key;
      }

      lastKeyTimeRef.current = now;

      // Auto-limpiar el buffer si no llega más input en 200ms
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(resetBuffer, 200);
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      resetBuffer();
    };
  }, [enabled, resetBuffer]);
}
