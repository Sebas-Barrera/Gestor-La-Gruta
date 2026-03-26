import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/shared/FormField';
import { TouchInput } from '@/components/shared/TouchInput';
import { Link, Search, Package } from 'lucide-react';
import type { Product } from '@/types';

/**
 * Datos para crear un nuevo ProductBarcode (asociar barcode a producto existente).
 *
 * Estos datos se envían a:
 *   POST /api/products/:productId/barcodes
 *   Body: { barcode, quantityPerScan, label }
 *
 * El backend genera: id, createdAt, isDefault (false para barcodes adicionales).
 *
 * Tabla: `product_barcodes`
 * ────────────────────────────────────────────────────────────────
 * | Campo            | Tipo                | Valor                           |
 * |------------------|---------------------|---------------------------------|
 * | productId        | FK → products.id    | Producto seleccionado           |
 * | barcode          | VARCHAR(50) UNIQUE  | Código escaneado                |
 * | quantityPerScan  | INTEGER >= 1        | Piezas que representa el código |
 * | label            | VARCHAR(100)        | Etiqueta descriptiva            |
 * | isDefault        | BOOLEAN             | false (barcode adicional)       |
 * ────────────────────────────────────────────────────────────────
 */
export interface CreateBarcodeData {
  productId: string;
  barcode: string;
  quantityPerScan: number;
  label: string;
}

interface AddBarcodeToProductModalProps {
  open: boolean;
  onClose: () => void;
  /** Código de barras que se va a asociar (readonly, viene del escaneo) */
  barcode: string;
  /** Lista de productos disponibles para asociar */
  products: Product[];
  /**
   * Callback al confirmar la asociación.
   * El parent debe:
   *   1. Agregar el ProductBarcode al array local (mock)
   *   2. POST /api/products/:productId/barcodes (cuando haya backend)
   */
  onSave: (data: CreateBarcodeData) => void;
}

interface FormState {
  /** Raw string while editing — allows empty input. Parsed to number on submit. */
  quantityPerScan: string;
  label: string;
}

const INITIAL_FORM: FormState = {
  quantityPerScan: '1',
  label: '',
};

export function AddBarcodeToProductModal({
  open,
  onClose,
  barcode,
  products,
  onSave,
}: AddBarcodeToProductModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>({ ...INITIAL_FORM });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset al abrir/cerrar
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSelectedProduct(null);
      setForm({ ...INITIAL_FORM });
      setErrors({});
    }
  }, [open]);

  // Generar label automático al cambiar quantity
  useEffect(() => {
    const qty = Number(form.quantityPerScan) || 0;
    if (qty === 1) {
      setForm(prev => ({ ...prev, label: 'Individual' }));
    } else if (qty > 1 && !form.label.trim()) {
      setForm(prev => ({ ...prev, label: `Caja ${qty} pzas` }));
    }
  }, [form.quantityPerScan]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => { const next = { ...prev }; delete next[key]; return next; });
    }
  };

  const filtered = searchQuery.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.includes(searchQuery))
      )
    : [];

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!selectedProduct) errs.product = 'Selecciona un producto';
    const qty = Number(form.quantityPerScan) || 0;
    if (qty < 1) errs.quantityPerScan = 'Debe ser al menos 1';
    if (!form.label.trim()) errs.label = 'La etiqueta es obligatoria';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate() || !selectedProduct) return;

    onSave({
      productId: selectedProduct.id,
      barcode,
      quantityPerScan: Math.max(1, Number(form.quantityPerScan) || 1),
      label: form.label.trim(),
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Link className="w-5 h-5 text-green-600" />
            </div>
            Asociar Código a Producto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Barcode a asociar (readonly) */}
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-600 font-medium">Código a asociar</p>
            <p className="text-sm font-mono font-semibold text-green-900">{barcode}</p>
          </div>

          {/* Paso 1: Seleccionar producto */}
          {!selectedProduct ? (
            <div className="space-y-3">
              <FormField label="Buscar producto" required error={errors.product}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <TouchInput
                    placeholder="Buscar por nombre, SKU o código..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 min-h-[44px] text-base"
                    autoFocus
                  />
                </div>
              </FormField>

              {filtered.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
                  {filtered.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => { setSelectedProduct(product); setErrors({}); }}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-blue-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">
                          {product.sku} · {product.category}
                          {product.barcode && <span className="ml-1 text-gray-400">· {product.barcode}</span>}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">
                        {product.stock} {product.unit}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.trim() && filtered.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No se encontraron productos</p>
              )}
            </div>
          ) : (
            <>
              {/* Producto seleccionado */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">{selectedProduct.name}</p>
                    <p className="text-xs text-blue-700">
                      {selectedProduct.sku} · {selectedProduct.category} → {selectedProduct.subcategory}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setSelectedProduct(null); setSearchQuery(''); }}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    Cambiar
                  </Button>
                </div>
              </div>

              {/* Paso 2: Configurar barcode */}
              <FormField label="Piezas por escaneo" required error={errors.quantityPerScan}>
                <TouchInput
                  type="number"
                  value={form.quantityPerScan}
                  onChange={(e) => updateField('quantityPerScan', e.target.value)}
                  className="min-h-[44px]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  1 = individual · 6 = six-pack · 12 = docena · 24 = caja de 24
                </p>
              </FormField>

              <FormField label="Etiqueta" required error={errors.label}>
                <TouchInput
                  value={form.label}
                  onChange={(e) => updateField('label', e.target.value)}
                  placeholder="Ej: Caja 24 pzas, Six Pack, Individual"
                  className="min-h-[44px]"
                />
              </FormField>

              {/* Preview */}
              {(Number(form.quantityPerScan) || 0) > 1 && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Vista previa</p>
                  <p className="text-sm text-gray-900">
                    1 escaneo de <span className="font-semibold">{form.label || 'este código'}</span>
                    {' = '}
                    <span className="font-semibold text-blue-600">
                      {form.quantityPerScan} {selectedProduct.unit}
                    </span>
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1 min-h-[44px]">
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} className="flex-1 min-h-[44px] bg-green-500 hover:bg-green-600">
                  Asociar Código
                </Button>
              </div>
            </>
          )}

          {/* Cancelar (solo en paso 1) */}
          {!selectedProduct && (
            <Button variant="outline" onClick={onClose} className="w-full min-h-[44px]">
              Cancelar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
