import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Edit3, Trash2, Barcode } from 'lucide-react';
import { ImageUrlField } from '@/components/shared/ImageUrlField';
import { TouchInput } from '@/components/shared/TouchInput';
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog';
import { urlToBase64, isBase64Image, isLocalPath } from '@/lib/imageUtils';
import { useInventory } from '@/contexts/InventoryContext';
import type { Product } from '@/types';

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  product: Product;
  onSave: (data: Partial<Product>) => void;
  onDelete?: (product: Product) => void;
}

export function ProductFormModal({ open, onClose, product, onSave, onDelete }: ProductFormModalProps) {
  const { productBarcodes } = useInventory();

  /** Producto escaneado = tiene código de barras → no aplica "Producto por peso" */
  const isScannedProduct = Boolean(product.barcode);

  // Obtener todos los códigos de barras asociados a este producto
  const associatedBarcodes = useMemo(() => {
    return productBarcodes.filter(pb => pb.productId === product.id);
  }, [productBarcodes, product.id]);

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Edit3 className="w-4 h-4 text-blue-600" />
            Editar Producto
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 px-6 py-4 overflow-y-auto">
          {/* Columna Izquierda */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre</label>
              <TouchInput
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="min-h-[40px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">SKU</label>
              <TouchInput value={product.sku} disabled className="bg-gray-50 min-h-[40px]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Categoría</label>
                <TouchInput
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="min-h-[40px]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Subcategoría</label>
                <TouchInput
                  value={formData.subcategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                  className="min-h-[40px]"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Proveedor</label>
              <TouchInput
                value={formData.supplier}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                className="min-h-[40px]"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Código de Barras Principal</label>
              <TouchInput
                value={formData.barcode}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  barcode: e.target.value.replace(/0D0A/gi, '').replace(/[\r\n]/g, '')
                }))}
                placeholder="Opcional"
                className="min-h-[40px]"
              />
            </div>

            {/* Sección: Códigos de barras registrados */}
            {associatedBarcodes.length > 0 && (
              <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200 space-y-2">
                <div className="flex items-center gap-2">
                  <Barcode className="w-4 h-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-900">Códigos de Barras Registrados</p>
                    <p className="text-[10px] text-blue-600">
                      {associatedBarcodes.length} código(s) asociado(s)
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {associatedBarcodes.map((pb) => (
                    <div
                      key={pb.id}
                      className="flex items-center justify-between p-2 bg-white rounded border border-blue-200"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono font-semibold text-gray-900 truncate">{pb.barcode}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-gray-600 truncate">{pb.label || 'Sin etiqueta'}</span>
                          <span className="text-[10px] text-blue-600 font-medium whitespace-nowrap">
                            · {pb.quantityPerScan} {product.unit}{pb.quantityPerScan > 1 ? 's' : ''}
                          </span>
                          {pb.isDefault && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
                              Principal
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-blue-600 text-center pt-1">
                  💡 Escanea cualquiera para agregar/quitar stock
                </p>
              </div>
            )}

            {associatedBarcodes.length === 0 && formData.barcode && (
              <div className="p-2 bg-amber-50 rounded border border-amber-200">
                <p className="text-[10px] text-amber-700 text-center">
                  ⚠️ Sin códigos en el sistema de multi-barcode
                </p>
              </div>
            )}
          </div>

          {/* Columna Derecha */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Precio ($)</label>
              <TouchInput
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                className="min-h-[40px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Ctd. Mínima{formData.isWeightBased ? ` (${formData.weightUnit})` : ''}
                </label>
                <TouchInput
                  type="number"
                  step={formData.isWeightBased ? '0.1' : '1'}
                  value={formData.minStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, minStock: Number(e.target.value) }))}
                  className="min-h-[40px]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Ctd. Máxima{formData.isWeightBased ? ` (${formData.weightUnit})` : ''}
                </label>
                <TouchInput
                  type="number"
                  step={formData.isWeightBased ? '0.1' : '1'}
                  value={formData.maxStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxStock: Number(e.target.value) }))}
                  className="min-h-[40px]"
                />
              </div>
            </div>

            {!isScannedProduct && !product.isWeightBased && (
              <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Producto por peso</p>
                  <p className="text-xs text-gray-500">Activar si se mide por peso/vol.</p>
                </div>
                <Switch
                  checked={formData.isWeightBased}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isWeightBased: checked }))}
                  className="data-[state=checked]:bg-blue-500"
                />
              </div>
            )}

            {!isScannedProduct && formData.isWeightBased && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Unidad de Medida</label>
                <select
                  value={formData.weightUnit}
                  onChange={(e) => setFormData(prev => ({ ...prev, weightUnit: e.target.value as 'kg' | 'g' | 'ml' | 'L' }))}
                  className="w-full min-h-[40px] px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="kg">Kilogramos (kg)</option>
                  <option value="g">Gramos (g)</option>
                  <option value="ml">Mililitros (ml)</option>
                  <option value="L">Litros (L)</option>
                </select>
              </div>
            )}

            <ImageUrlField
              value={formData.image}
              onChange={(v) => setFormData(prev => ({ ...prev, image: v }))}
            />
          </div>

        </div>

        {/* Acciones - Footer fijo */}
        <div className="col-span-1 md:col-span-2 flex gap-3 px-6 py-4 border-t shrink-0 bg-white">
          {onDelete && (
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(true)}
              className="min-h-[42px] px-3 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              disabled={isSaving}
              title="Eliminar producto permanentemente"
            >
              <Trash2 className="w-5 h-5 mx-1" />
            </Button>
          )}
          <Button variant="outline" onClick={handleClose} className="flex-1 min-h-[42px]" disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="flex-1 min-h-[42px] bg-blue-500 hover:bg-blue-600">
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </DialogContent>

      {/* Alerta de confirmación de eliminación */}
      {onDelete && (
        <DeleteConfirmDialog
          open={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            setShowDeleteConfirm(false);
            onDelete(product);
          }}
          title="Eliminar Producto"
          description={`¿Estás seguro de que deseas eliminar permanentemente el producto "${product.name}" de este bar? Esta acción no se puede deshacer.`}
        />
      )}
    </Dialog>
  );
}
