import { useEffect, useRef, useCallback } from 'react';
import type { Product } from '@/types';

interface UseGlobalScaleDetectorOptions {
  /** Productos del bar activo que son de peso (isWeightBased = true) */
  products: Product[];
  /** true = modo ENTRADA, false = modo SALIDA */
  isAddMode: boolean;
  /** Desactiva el listener (ej: cuando hay un modal abierto) */
  enabled: boolean;
  /** Producto pesado detectado automáticamente */
  onProductWeighed: (product: Product, weight: number) => void;
  /** No se encontraron productos de báscula */
  onNoWeightProducts: () => void;
}

/**
 * Hook global que simula detección de báscula física.
 *
 * Detecta la combinación de teclas Ctrl+W (Cmd+W en Mac) para simular
 * que una báscula física ha detectado peso automáticamente.
 *
 * La simulación genera un peso aleatorio entre 0.1 y 10.0 kg y selecciona
 * un producto de la lista de productos con isWeightBased = true.
 *
 * NOTA: Para conectar una báscula real en producción, usar Web Serial API
 * o un backend proxy que escuche el puerto serial de la báscula.
 */
export function useGlobalScaleDetector({
  products,
  isAddMode,
  enabled,
  onProductWeighed,
  onNoWeightProducts,
}: UseGlobalScaleDetectorOptions) {
  // Refs estables para los callbacks (evitar re-suscripciones)
  const productsRef = useRef(products);
  const isAddModeRef = useRef(isAddMode);
  const onProductWeighedRef = useRef(onProductWeighed);
  const onNoWeightProductsRef = useRef(onNoWeightProducts);

  productsRef.current = products;
  isAddModeRef.current = isAddMode;
  onProductWeighedRef.current = onProductWeighed;
  onNoWeightProductsRef.current = onNoWeightProducts;

  const simulateWeightDetection = useCallback(() => {
    // Filtrar productos de báscula (isWeightBased = true)
    const weightProducts = productsRef.current.filter(p => p.isWeightBased);

    if (weightProducts.length === 0) {
      onNoWeightProductsRef.current();
      return;
    }

    // Generar peso simulado aleatorio (0.1 - 10.0 kg)
    const simulatedWeight = parseFloat((Math.random() * 9.9 + 0.1).toFixed(2));

    // Seleccionar producto:
    // - Si hay solo 1: auto-seleccionar
    // - Si hay múltiples: seleccionar aleatorio
    const selectedProduct = weightProducts.length === 1
      ? weightProducts[0]
      : weightProducts[Math.floor(Math.random() * weightProducts.length)];

    onProductWeighedRef.current(selectedProduct, simulatedWeight);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el foco está en un input/textarea (formularios abiertos)
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      // Detectar Ctrl+W (Windows/Linux) o Cmd+W (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault(); // Evitar cerrar tab del navegador
        simulateWeightDetection();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, simulateWeightDetection]);
}
