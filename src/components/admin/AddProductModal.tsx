import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';
import { ComboboxField } from '@/components/shared/ComboboxField';
import { ImageUrlField } from '@/components/shared/ImageUrlField';
import { Plus, ScanLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { urlToBase64, isBase64Image, isLocalPath } from '@/lib/imageUtils';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_SUBCATEGORIES,
  DEFAULT_SUPPLIERS,
} from '@/data/catalogDefaults';
/**
 * Datos necesarios para crear un nuevo producto.
 * El backend debe generar el `id` y calcular el `status` basado en stock/maxStock.
 *
 * Mapeo sugerido para la DB:
 * - name        → VARCHAR(255), NOT NULL
 * - sku         → VARCHAR(50), UNIQUE, NOT NULL
 * - category    → VARCHAR(100), NOT NULL (o FK a tabla categories)
 * - subcategory → VARCHAR(100), NOT NULL (o FK a tabla subcategories)
 * - supplier    → VARCHAR(255), NOT NULL (o FK a tabla suppliers)
 * - price       → DECIMAL(10,2), NOT NULL
 * - stock       → DECIMAL(10,2), DEFAULT 0
 * - minStock    → DECIMAL(10,2), NOT NULL (umbral para alerta de stock bajo)
 * - maxStock    → DECIMAL(10,2), NOT NULL
 * - unit        → VARCHAR(20), NOT NULL (ej: 'lata', 'botella', 'kg')
 * - barcode     → VARCHAR(50), NULLABLE, UNIQUE
 * - barId       → FK → bars.id, NOT NULL
 * - isWeightBased → BOOLEAN, DEFAULT false
 * - weightUnit  → ENUM('kg','g','ml','L'), NULLABLE
 * - image       → TEXT, NULLABLE (data URL base64 o ruta local para offline)
 */
export interface CreateProductData {
  name: string;
  sku: string;
  category: string;
  subcategory: string;
  supplier: string;
  price: number;
  stock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  barcode: string;
  barId: string;
  isWeightBased: boolean;
  weightUnit: 'kg' | 'g' | 'ml' | 'L';
  /** Imagen del producto — data URL base64 o ruta local. Tipo DB: TEXT NULLABLE */
  image: string;
}

interface AddProductModalProps {
  open: boolean;
  onClose: () => void;
  /** Callback con los datos del nuevo producto. Aquí conectar: POST /api/products */
  onSave: (data: CreateProductData) => void;
  /** ID del bar al que se asignará el producto (pre-seleccionado) */
  barId: string;
  /** Nombre del bar (solo para mostrar en UI) */
  barName: string;
  /** Código de barras pre-llenado desde el escáner (readonly cuando presente) */
  initialBarcode?: string;
}

const INITIAL_FORM: CreateProductData = {
  name: '',
  sku: '',
  category: '',
  subcategory: '',
  supplier: '',
  price: 0,
  stock: 0,
  minStock: 10,
  maxStock: 100,
  unit: 'botella',
  barcode: '',
  barId: '',
  isWeightBased: false,
  weightUnit: 'kg',
  image: '',
};

export function AddProductModal({ open, onClose, onSave, barId, barName, initialBarcode }: AddProductModalProps) {
  const [form, setForm] = useState<CreateProductData>({ ...INITIAL_FORM, barId });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hasInitialBarcode = !!initialBarcode;

  // --- Opciones de catálogos (con soporte para valores nuevos agregados en sesión) ---
  const [addedCategories, setAddedCategories] = useState<string[]>([]);
  const [addedSubcategories, setAddedSubcategories] = useState<Record<string, string[]>>({});
  const [addedSuppliers, setAddedSuppliers] = useState<string[]>([]);

  const categories = useMemo(
    () => [...DEFAULT_CATEGORIES, ...addedCategories],
    [addedCategories],
  );

  const subcategoryOptions = useMemo(() => {
    const defaults = DEFAULT_SUBCATEGORIES[form.category] || [];
    const added = addedSubcategories[form.category] || [];
    return [...defaults, ...added];
  }, [form.category, addedSubcategories]);

  const suppliers = useMemo(
    () => [...DEFAULT_SUPPLIERS, ...addedSuppliers],
    [addedSuppliers],
  );

  // Reset form when modal opens or barId changes
  useEffect(() => {
    if (open) {
      setForm({
        ...INITIAL_FORM,
        barId,
        barcode: initialBarcode || '',
      });
      setErrors({});
    }
  }, [open, barId, initialBarcode]);

  const updateField = <K extends keyof CreateProductData>(key: K, value: CreateProductData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    // Clear error on change
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'El nombre es obligatorio';
    if (!form.sku.trim()) errs.sku = 'El SKU es obligatorio';
    if (!form.category.trim()) errs.category = 'La categoría es obligatoria';
    if (!form.subcategory.trim()) errs.subcategory = 'La subcategoría es obligatoria';
    if (!form.supplier.trim()) errs.supplier = 'El proveedor es obligatorio';
    if (form.price <= 0) errs.price = 'El precio debe ser mayor a 0';
    if (form.minStock < 0) errs.minStock = 'El stock mínimo no puede ser negativo';
    if (form.maxStock <= 0) errs.maxStock = 'El stock máximo debe ser mayor a 0';
    if (form.minStock >= form.maxStock) errs.minStock = 'El stock mínimo debe ser menor al máximo';
    if (!form.unit.trim()) errs.unit = 'La unidad es obligatoria';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSaving(true);

    let imageValue = form.image.trim();

    // Convertir URL externa a base64 para soporte offline
    if (imageValue && !isBase64Image(imageValue) && !isLocalPath(imageValue)) {
      try {
        imageValue = await urlToBase64(imageValue);
      } catch {
        // Si falla la conversión, guardar la URL original
      }
    }

    const cleanData: CreateProductData = {
      ...form,
      name: form.name.trim(),
      sku: form.sku.trim(),
      category: form.category.trim(),
      subcategory: form.subcategory.trim(),
      supplier: form.supplier.trim(),
      unit: form.unit.trim(),
      barcode: form.barcode.trim(),
      image: imageValue,
      barId,
    };

    // TODO: POST /api/products — enviar cleanData al backend
    onSave(cleanData);
    setIsSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            Agregar Producto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Bar asignado (readonly) */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600 font-medium">Bar asignado</p>
            <p className="text-sm font-semibold text-blue-900">{barName}</p>
          </div>

          {/* Indicador de código escaneado */}
          {hasInitialBarcode && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <ScanLine className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs text-green-600 font-medium">Producto escaneado</p>
                <p className="text-sm font-mono font-semibold text-green-900">{initialBarcode}</p>
              </div>
            </div>
          )}

          {/* Nombre */}
          <FormField label="Nombre del Producto" required error={errors.name}>
            <Input
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Ej: Coca Cola 355ml"
              className="min-h-[44px]"
            />
          </FormField>

          {/* SKU */}
          <FormField label="SKU" required error={errors.sku}>
            <Input
              value={form.sku}
              onChange={(e) => updateField('sku', e.target.value)}
              placeholder="Ej: CC-355-001"
              className="min-h-[44px]"
            />
          </FormField>

          {/* Categoría */}
          <ComboboxField
            label="Categoría"
            value={form.category}
            onChange={(v) => {
              if (!categories.includes(v)) {
                setAddedCategories(prev => [...prev, v]);
              }
              updateField('category', v);
              // Limpiar subcategoría si ya no pertenece a la nueva categoría
              const allSubs = [
                ...(DEFAULT_SUBCATEGORIES[v] || []),
                ...(addedSubcategories[v] || []),
              ];
              if (form.subcategory && !allSubs.includes(form.subcategory)) {
                updateField('subcategory', '');
              }
            }}
            options={categories}
            placeholder="Buscar o agregar categoría..."
            required
            error={errors.category}
          />

          {/* Subcategoría */}
          <ComboboxField
            label="Subcategoría"
            value={form.subcategory}
            onChange={(v) => {
              if (!subcategoryOptions.includes(v)) {
                setAddedSubcategories(prev => ({
                  ...prev,
                  [form.category]: [...(prev[form.category] || []), v],
                }));
              }
              updateField('subcategory', v);
            }}
            options={subcategoryOptions}
            placeholder={form.category ? 'Buscar o agregar subcategoría...' : 'Selecciona una categoría primero'}
            required
            error={errors.subcategory}
            disabled={!form.category}
          />

          {/* Proveedor */}
          <ComboboxField
            label="Proveedor"
            value={form.supplier}
            onChange={(v) => {
              if (!suppliers.includes(v)) {
                setAddedSuppliers(prev => [...prev, v]);
              }
              updateField('supplier', v);
            }}
            options={suppliers}
            placeholder="Buscar proveedor..."
            required
            error={errors.supplier}
          />

          {/* Precio + Unidad */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Precio ($)" required error={errors.price}>
              <Input
                type="number"
                value={form.price || ''}
                onChange={(e) => updateField('price', Number(e.target.value))}
                placeholder="0.00"
                className="min-h-[44px]"
              />
            </FormField>
            <FormField label="Unidad" required error={errors.unit}>
              <Input
                value={form.unit}
                onChange={(e) => updateField('unit', e.target.value)}
                placeholder="Ej: botella, lata, kg"
                className="min-h-[44px]"
              />
            </FormField>
          </div>

          {/* Stock Inicial + Stock Mínimo + Stock Máximo */}
          <div className="grid grid-cols-3 gap-3">
            <FormField label="Stock Inicial">
              <Input
                type="number"
                value={form.stock || ''}
                onChange={(e) => updateField('stock', Number(e.target.value))}
                placeholder="0"
                className="min-h-[44px]"
              />
            </FormField>
            <FormField label="Stock Mínimo" required error={errors.minStock}>
              <Input
                type="number"
                value={form.minStock || ''}
                onChange={(e) => updateField('minStock', Number(e.target.value))}
                placeholder="10"
                className="min-h-[44px]"
              />
            </FormField>
            <FormField label="Stock Máximo" required error={errors.maxStock}>
              <Input
                type="number"
                value={form.maxStock || ''}
                onChange={(e) => updateField('maxStock', Number(e.target.value))}
                placeholder="100"
                className="min-h-[44px]"
              />
            </FormField>
          </div>

          {/* Hint sobre stock mínimo */}
          <p className="text-xs text-gray-500 -mt-2">
            El stock mínimo define el umbral para alertas de "stock bajo".
          </p>

          {/* Código de Barras */}
          <FormField label="Código de Barras">
            <Input
              value={form.barcode}
              onChange={(e) => updateField('barcode', e.target.value)}
              placeholder="Opcional"
              readOnly={hasInitialBarcode}
              className={cn(
                'min-h-[44px]',
                hasInitialBarcode && 'bg-gray-100 text-gray-600 font-mono cursor-not-allowed'
              )}
            />
          </FormField>

          {/* Imagen del producto */}
          <ImageUrlField
            value={form.image}
            onChange={(v) => updateField('image', v)}
          />

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 min-h-[44px]" disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving} className="flex-1 min-h-[44px] bg-blue-500 hover:bg-blue-600">
              {isSaving ? 'Guardando...' : 'Agregar Producto'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
