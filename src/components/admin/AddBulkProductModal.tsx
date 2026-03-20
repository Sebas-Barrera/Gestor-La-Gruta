import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TouchInput } from '@/components/shared/TouchInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField } from '@/components/shared/FormField';
import { ComboboxField } from '@/components/shared/ComboboxField';
import { ImageUrlField } from '@/components/shared/ImageUrlField';
import { Scale } from 'lucide-react';
import { urlToBase64, isBase64Image, isLocalPath } from '@/lib/imageUtils';
import {
  BULK_CATEGORIES,
  BULK_SUBCATEGORIES,
  BULK_SUPPLIERS,
  WEIGHT_UNITS,
} from '@/data/catalogDefaults';
import type { CreateBulkProductData } from '@/types';

/**
 * Modal dedicado para registrar productos a granel (peso/volumen).
 *
 * Se abre desde el ScaleOverlay cuando el usuario quiere agregar un
 * producto nuevo que se mide por peso (frutas, verduras, especias, etc.).
 *
 * Diferencias con AddProductModal (escáner):
 *   - Sin campo de código de barras (los productos a granel no tienen)
 *   - isWeightBased siempre true (implícito, no necesita toggle)
 *   - Selector de unidad de peso siempre visible
 *   - Catálogos específicos para granel (BULK_CATEGORIES, BULK_SUBCATEGORIES)
 *
 * Backend:
 *   POST /api/products con:
 *     isWeightBased = true
 *     barcode = NULL
 *     unit = weightUnit (el backend debe sincronizar estos campos)
 *
 *   El backend genera el `id` y calcula `status` basado en stock vs minStock.
 */

interface AddBulkProductModalProps {
  open: boolean;
  onClose: () => void;
  /** Callback con los datos del nuevo producto a granel. Conectar: POST /api/products */
  onSave: (data: CreateBulkProductData) => void;
  /** ID del bar al que se asignará el producto (pre-seleccionado) */
  barId: string;
  /** Nombre del bar (solo para mostrar en UI) */
  barName: string;
}

const INITIAL_FORM: CreateBulkProductData = {
  name: '',
  sku: '',
  category: '',
  subcategory: '',
  supplier: '',
  price: 0,
  stock: 0,
  minStock: 1,
  maxStock: 10,
  weightUnit: 'kg',
  barId: '',
  image: '',
};

export function AddBulkProductModal({ open, onClose, onSave, barId, barName }: AddBulkProductModalProps) {
  const [form, setForm] = useState<CreateBulkProductData>({ ...INITIAL_FORM, barId });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // --- Catálogos con soporte para valores nuevos agregados en sesión ---
  const [addedCategories, setAddedCategories] = useState<string[]>([]);
  const [addedSubcategories, setAddedSubcategories] = useState<Record<string, string[]>>({});
  const [addedSuppliers, setAddedSuppliers] = useState<string[]>([]);

  const categories = useMemo(
    () => [...BULK_CATEGORIES, ...addedCategories],
    [addedCategories],
  );

  const subcategoryOptions = useMemo(() => {
    const defaults = BULK_SUBCATEGORIES[form.category] || [];
    const added = addedSubcategories[form.category] || [];
    return [...defaults, ...added];
  }, [form.category, addedSubcategories]);

  const suppliers = useMemo(
    () => [...BULK_SUPPLIERS, ...addedSuppliers],
    [addedSuppliers],
  );

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setForm({ ...INITIAL_FORM, barId });
      setErrors({});
    }
  }, [open, barId]);

  const updateField = <K extends keyof CreateBulkProductData>(key: K, value: CreateBulkProductData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
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
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSaving(true);

    let imageValue = (form.image || '').trim();

    // Convertir URL externa a base64 para soporte offline
    if (imageValue && !isBase64Image(imageValue) && !isLocalPath(imageValue)) {
      try {
        imageValue = await urlToBase64(imageValue);
      } catch {
        // Si falla la conversión, guardar la URL original
      }
    }

    const cleanData: CreateBulkProductData = {
      ...form,
      name: form.name.trim(),
      sku: form.sku.trim(),
      category: form.category.trim(),
      subcategory: form.subcategory.trim(),
      supplier: form.supplier.trim(),
      image: imageValue || undefined,
      barId,
    };

    onSave(cleanData);
    setIsSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Scale className="w-5 h-5 text-purple-600" />
            </div>
            Agregar Producto a Granel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Bar asignado (readonly) */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600 font-medium">Bar asignado</p>
            <p className="text-sm font-semibold text-blue-900">{barName}</p>
          </div>

          {/* Indicador de producto a granel */}
          <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <Scale className="w-4 h-4 text-purple-600" />
            <div>
              <p className="text-xs text-purple-600 font-medium">Producto a granel</p>
              <p className="text-sm font-semibold text-purple-900">Se medirá por peso / volumen</p>
            </div>
          </div>

          {/* Nombre */}
          <FormField label="Nombre del Producto" required error={errors.name}>
            <TouchInput
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Ej: Azúcar estándar, Limón, Aceite de oliva"
              className="min-h-[44px]"
            />
          </FormField>

          {/* SKU */}
          <FormField label="SKU" required error={errors.sku}>
            <TouchInput
              value={form.sku}
              onChange={(e) => updateField('sku', e.target.value)}
              placeholder="Ej: AG-AZU-001, FV-LIM-001"
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
              const allSubs = [
                ...(BULK_SUBCATEGORIES[v] || []),
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

          {/* Precio + Unidad de peso */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Precio ($)" required error={errors.price}>
              <TouchInput
                type="number"
                value={form.price || ''}
                onChange={(e) => updateField('price', Number(e.target.value))}
                placeholder="0.00"
                className="min-h-[44px]"
              />
            </FormField>
            <FormField label="Unidad de Peso / Volumen" required>
              <Select
                value={form.weightUnit}
                onValueChange={(v) => updateField('weightUnit', v as CreateBulkProductData['weightUnit'])}
              >
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEIGHT_UNITS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {/* Stock Inicial + Stock Mínimo + Stock Máximo */}
          <div className="grid grid-cols-3 gap-3">
            <FormField label={`Stock Inicial (${form.weightUnit})`}>
              <TouchInput
                type="number"
                step="0.1"
                value={form.stock || ''}
                onChange={(e) => updateField('stock', Number(e.target.value))}
                placeholder="0"
                className="min-h-[44px]"
              />
            </FormField>
            <FormField label={`Stock Mínimo (${form.weightUnit})`} required error={errors.minStock}>
              <TouchInput
                type="number"
                step="0.1"
                value={form.minStock || ''}
                onChange={(e) => updateField('minStock', Number(e.target.value))}
                placeholder="1"
                className="min-h-[44px]"
              />
            </FormField>
            <FormField label={`Stock Máximo (${form.weightUnit})`} required error={errors.maxStock}>
              <TouchInput
                type="number"
                step="0.1"
                value={form.maxStock || ''}
                onChange={(e) => updateField('maxStock', Number(e.target.value))}
                placeholder="10"
                className="min-h-[44px]"
              />
            </FormField>
          </div>

          {/* Hint sobre unidades */}
          <p className="text-xs text-gray-500 -mt-2">
            Los valores de stock están en la unidad seleccionada ({form.weightUnit}).
            El stock mínimo define el umbral para alertas de "stock bajo".
          </p>

          {/* Imagen del producto */}
          <ImageUrlField
            value={form.image || ''}
            onChange={(v) => updateField('image', v)}
          />

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 min-h-[44px]" disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving} className="flex-1 min-h-[44px] bg-purple-500 hover:bg-purple-600">
              {isSaving ? 'Guardando...' : 'Agregar Producto a Granel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
