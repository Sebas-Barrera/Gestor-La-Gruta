import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/shared/FormField';
import { TouchInput } from '@/components/shared/TouchInput';
import { AlertCircle, Package, Boxes, Link } from 'lucide-react';

/**
 * Modal que se muestra cuando un barcode escaneado no existe en el sistema.
 *
 * Presenta 2 opciones:
 *   1. **Registrar producto nuevo** — con sub-opción: Individual (1 pieza) o Caja (N piezas).
 *      - Individual → delega a AddProductModal con barcode pre-llenado (quantityPerScan = 1).
 *      - Caja → delega a AddProductModal + al guardar se crea un ProductBarcode con la cantidad.
 *   2. **Agregar código a producto existente** → delega a AddBarcodeToProductModal.
 *
 * Este modal NO persiste nada directamente. Solo captura la decisión del usuario
 * y delega al componente padre (InventorySection) para abrir el flujo correspondiente.
 *
 * Backend: No requiere endpoint propio. Solo orquesta flujos existentes:
 *   - Opción 1 → POST /api/products + POST /api/products/:productId/barcodes (si es caja)
 *   - Opción 2 → POST /api/products/:productId/barcodes
 */

interface UnknownBarcodeModalProps {
  open: boolean;
  onClose: () => void;
  /** El código de barras que no fue encontrado en el sistema */
  barcode: string;
  /**
   * Opción 1A: Registrar producto individual (1 pieza por escaneo).
   * El parent abre AddProductModal con barcode pre-llenado.
   */
  onRegisterIndividualProduct: (barcode: string) => void;
  /**
   * Opción 1B: Registrar producto empaquetado (múltiples piezas por escaneo).
   * El parent abre AddPackagedProductModal con barcode de caja pre-llenado.
   *
   * @param boxBarcode   — código de la caja/paquete
   * @param boxQuantity  — piezas por caja
   */
  onRegisterPackagedProduct: (boxBarcode: string, boxQuantity: number) => void;
  /**
   * Opción 2: Agregar barcode a producto existente.
   * El parent abre AddBarcodeToProductModal con este barcode.
   */
  onAddToExistingProduct: (barcode: string) => void;
}

export function UnknownBarcodeModal({
  open,
  onClose,
  barcode,
  onRegisterIndividualProduct,
  onRegisterPackagedProduct,
  onAddToExistingProduct,
}: UnknownBarcodeModalProps) {
  const [selectedOption, setSelectedOption] = useState<'new' | 'existing' | null>(null);
  const [productType, setProductType] = useState<'individual' | 'box'>('individual');
  const [boxQuantity, setBoxQuantity] = useState('24');
  const [boxError, setBoxError] = useState('');

  const resetState = () => {
    setSelectedOption(null);
    setProductType('individual');
    setBoxQuantity('24');
    setBoxError('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleRegisterNew = () => {
    if (productType === 'box') {
      const qty = Number(boxQuantity) || 0;
      if (qty < 2) {
        setBoxError('La cantidad por caja debe ser al menos 2');
        return;
      }
      onRegisterPackagedProduct(barcode, qty);
    } else {
      onRegisterIndividualProduct(barcode);
    }
    resetState();
  };

  const handleAddToExisting = () => {
    onAddToExistingProduct(barcode);
    resetState();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            Código No Encontrado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Barcode escaneado */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-600 font-medium">Código escaneado</p>
            <p className="text-sm font-mono font-semibold text-amber-900">{barcode}</p>
            <p className="text-xs text-amber-600 mt-1">
              Este código no está asociado a ningún producto.
            </p>
          </div>

          {/* Vista inicial: 2 opciones */}
          {!selectedOption && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">¿Qué deseas hacer?</p>

              <button
                onClick={() => setSelectedOption('new')}
                className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Registrar producto nuevo</p>
                  <p className="text-xs text-gray-500">
                    Crear un producto nuevo con este código de barras
                  </p>
                </div>
              </button>

              <button
                onClick={() => setSelectedOption('existing')}
                className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-green-400 hover:bg-green-50/50 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <Link className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Agregar código a producto existente</p>
                  <p className="text-xs text-gray-500">
                    Asociar este código a un producto ya registrado
                  </p>
                </div>
              </button>

              <Button variant="outline" onClick={handleClose} className="w-full min-h-[44px]">
                Cancelar
              </Button>
            </div>
          )}

          {/* Sub-vista: Tipo de producto (Individual / Caja) */}
          {selectedOption === 'new' && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">¿Qué tipo de código es?</p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { setProductType('individual'); setBoxError(''); }}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    productType === 'individual'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <Package className={`w-6 h-6 mx-auto mb-1 ${productType === 'individual' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <p className="text-sm font-medium text-gray-900">Individual</p>
                  <p className="text-xs text-gray-500">1 pieza por escaneo</p>
                </button>

                <button
                  onClick={() => setProductType('box')}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    productType === 'box'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <Boxes className={`w-6 h-6 mx-auto mb-1 ${productType === 'box' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <p className="text-sm font-medium text-gray-900">Caja</p>
                  <p className="text-xs text-gray-500">Múltiples piezas</p>
                </button>
              </div>

              {productType === 'box' && (
                <FormField label="Piezas por caja" required error={boxError}>
                  <TouchInput
                    type="number"
                    value={boxQuantity}
                    onChange={(e) => { setBoxQuantity(e.target.value); setBoxError(''); }}
                    placeholder="Ej: 24"
                    className="min-h-[44px]"
                  />
                </FormField>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSelectedOption(null)} className="flex-1 min-h-[44px]">
                  Atrás
                </Button>
                <Button onClick={handleRegisterNew} className="flex-1 min-h-[44px] bg-blue-500 hover:bg-blue-600">
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* Sub-vista: Confirmar agregar a existente */}
          {selectedOption === 'existing' && (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  Se abrirá un buscador para seleccionar el producto al que quieres
                  asociar el código <span className="font-mono font-semibold">{barcode}</span>.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSelectedOption(null)} className="flex-1 min-h-[44px]">
                  Atrás
                </Button>
                <Button onClick={handleAddToExisting} className="flex-1 min-h-[44px] bg-green-500 hover:bg-green-600">
                  Buscar Producto
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
