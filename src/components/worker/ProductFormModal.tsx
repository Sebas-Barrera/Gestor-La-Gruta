import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Edit3 } from 'lucide-react';
import { ImageUrlField } from '@/components/shared/ImageUrlField';
import { urlToBase64, isBase64Image, isLocalPath } from '@/lib/imageUtils';
import type { Product } from '@/types';

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  product: Product;
  onSave: (data: Partial<Product>) => void;
}

export function ProductFormModal({ open, onClose, product, onSave }: ProductFormModalProps) {
  /** Producto escaneado = tiene código de barras → no aplica "Producto por peso" */
  const isScannedProduct = Boolean(product.barcode);

  const [formData, setFormData] = useState({
    name: product.name,
    category: product.category,
    subcategory: product.subcategory,
    supplier: product.supplier,
    price: product.price,
    minStock: product.minStock,
    maxStock: product.maxStock,
    barcode: product.barcode || '',
    isWeightBased: product.isWeightBased || false,
    weightUnit: product.weightUnit || 'kg' as const,
    image: product.image || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);

    let imageValue = formData.image.trim();

    // Convertir URL externa a base64 para soporte offline
    if (imageValue && !isBase64Image(imageValue) && !isLocalPath(imageValue)) {
      try {
        imageValue = await urlToBase64(imageValue);
      } catch {
        // Si falla la conversión, guardar la URL original
      }
    }

    onSave({ ...formData, image: imageValue || undefined });
    setIsSaving(false);
    onClose();
  };

  const handleClose = () => {
    setFormData({
      name: product.name,
      category: product.category,
      subcategory: product.subcategory,
      supplier: product.supplier,
      price: product.price,
      minStock: product.minStock,
      maxStock: product.maxStock,
      barcode: product.barcode || '',
      isWeightBased: product.isWeightBased || false,
      weightUnit: product.weightUnit || 'kg',
      image: product.image || '',
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-blue-600" />
            </div>
            Editar Producto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* SKU (readonly) */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">SKU</label>
            <Input value={product.sku} disabled className="bg-gray-50 min-h-[44px]" />
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nombre</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="min-h-[44px]"
            />
          </div>

          {/* Category + Subcategory */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Categoría</label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="min-h-[44px]"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Subcategoría</label>
              <Input
                value={formData.subcategory}
                onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                className="min-h-[44px]"
              />
            </div>
          </div>

          {/* Supplier */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Proveedor</label>
            <Input
              value={formData.supplier}
              onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
              className="min-h-[44px]"
            />
          </div>

          {/* Price */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Precio ($)</label>
            <Input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
              className="min-h-[44px]"
            />
          </div>

          {/* MinStock + MaxStock — muestra la unidad de peso si aplica */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Stock Mínimo{formData.isWeightBased ? ` (${formData.weightUnit})` : ''}
              </label>
              <Input
                type="number"
                step={formData.isWeightBased ? '0.1' : '1'}
                value={formData.minStock}
                onChange={(e) => setFormData(prev => ({ ...prev, minStock: Number(e.target.value) }))}
                className="min-h-[44px]"
              />
              <p className="text-xs text-gray-500 mt-1">Umbral para alerta de stock bajo</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                Stock Máximo{formData.isWeightBased ? ` (${formData.weightUnit})` : ''}
              </label>
              <Input
                type="number"
                step={formData.isWeightBased ? '0.1' : '1'}
                value={formData.maxStock}
                onChange={(e) => setFormData(prev => ({ ...prev, maxStock: Number(e.target.value) }))}
                className="min-h-[44px]"
              />
            </div>
          </div>

          {/* Barcode */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Código de Barras</label>
            <Input
              value={formData.barcode}
              onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
              placeholder="Opcional"
              className="min-h-[44px]"
            />
          </div>

          {/*
            * Toggle "Producto por peso":
            *   - Producto escaneado (tiene barcode) → oculto (no aplica)
            *   - Producto ya pesado (isWeightBased) → oculto (redundante)
            *   - Producto sin barcode y sin peso   → visible (permite activar)
            */}
          {!isScannedProduct && !product.isWeightBased && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Producto por peso</p>
                <p className="text-xs text-gray-500">Activar si el producto se mide por peso/volumen</p>
              </div>
              <Switch
                checked={formData.isWeightBased}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isWeightBased: checked }))}
                className="data-[state=checked]:bg-blue-500"
              />
            </div>
          )}

          {/* Selector de unidad de peso — visible si el producto es (o se marcó como) pesado */}
          {!isScannedProduct && formData.isWeightBased && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Unidad de Peso</label>
              <select
                value={formData.weightUnit}
                onChange={(e) => setFormData(prev => ({ ...prev, weightUnit: e.target.value as 'kg' | 'g' | 'ml' | 'L' }))}
                className="w-full min-h-[44px] px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="kg">Kilogramos (kg)</option>
                <option value="g">Gramos (g)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="L">Litros (L)</option>
              </select>
            </div>
          )}

          {/* Imagen del producto */}
          <ImageUrlField
            value={formData.image}
            onChange={(v) => setFormData(prev => ({ ...prev, image: v }))}
          />

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1 min-h-[44px]" disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="flex-1 min-h-[44px] bg-blue-500 hover:bg-blue-600">
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
