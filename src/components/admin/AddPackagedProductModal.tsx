import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TouchInput } from "@/components/shared/TouchInput";
import { FormField } from "@/components/shared/FormField";
import { ComboboxField } from "@/components/shared/ComboboxField";
import { ImageUrlField } from "@/components/shared/ImageUrlField";
import { Package, ScanLine, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import { urlToBase64, isBase64Image, isLocalPath } from "@/lib/imageUtils";
import { generateSku } from "@/lib/skuGenerator";
import { cleanBarcode } from "@/lib/barcodeUtils";
import { useInventory } from "@/contexts/InventoryContext";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_SUBCATEGORIES,
  DEFAULT_SUPPLIERS,
} from "@/data/catalogDefaults";
import type { CreateProductData } from "@/components/admin/AddProductModal";

/**
 * Modal especializado para registrar productos que vienen en caja/paquete.
 *
 * Diferencia clave vs AddProductModal:
 * - Tiene 2 secciones claramente separadas: Información del Paquete + Información del Producto Individual
 * - Guarda DOS códigos de barras: uno para la caja y otro para el producto suelto
 * - Ambos códigos se guardan en la tabla ProductBarcodes con diferentes quantityPerScan
 *
 * Flujo:
 * 1. Usuario escanea código de caja desconocido → UnknownBarcodeModal → opción "Caja" → este modal
 * 2. Completa datos de la caja (código, tipo empaquetado, piezas)
 * 3. Completa datos del producto individual (código, presentación, nombre, etc.)
 * 4. Al guardar → crea 1 Product + 2 ProductBarcodes
 */

interface AddPackagedProductModalProps {
  open: boolean;
  onClose: () => void;
  /** Callback con los datos del nuevo producto. Aquí conectar: POST /api/products */
  onSave: (data: CreateProductData) => void;
  /** ID del bar al que se asignará el producto (pre-seleccionado) */
  barId: string;
  /** Nombre del bar (solo para mostrar en UI) */
  barName: string;
  /** Código de barras de la CAJA pre-llenado desde el escáner */
  initialBoxBarcode?: string;
  /** Cantidad de piezas por caja pre-llenada (desde UnknownBarcodeModal) */
  initialQuantityPerBox?: number;
}

const INITIAL_FORM: CreateProductData = {
  name: "",
  sku: "",
  category: "",
  subcategory: "",
  supplier: "",
  price: 0,
  stock: 0,
  minStock: 10,
  maxStock: 100,
  unit: "bote", // Unidad del producto individual
  barcode: "", // Barcode de la CAJA
  isBoxBarcode: true, // Siempre true en este modal
  quantityPerBox: 24,
  individualBarcode: "", // Barcode del producto SUELTO
  barId: "",
  isWeightBased: false,
  weightUnit: "kg",
  image: "",
};

export function AddPackagedProductModal({
  open,
  onClose,
  onSave,
  barId,
  barName,
  initialBoxBarcode,
  initialQuantityPerBox,
}: AddPackagedProductModalProps) {
  const { products: allProducts } = useInventory();
  const [form, setForm] = useState<CreateProductData>({
    ...INITIAL_FORM,
    quantityPerBox: initialQuantityPerBox || INITIAL_FORM.quantityPerBox,
    barId,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hasInitialBarcode = !!initialBoxBarcode;

  // Auto-generar SKU cuando cambian nombre o categoría
  useEffect(() => {
    if (form.name.trim() && form.category.trim()) {
      const existingSkus = allProducts.map((p) => p.sku);
      const sku = generateSku(form.category, form.name, existingSkus);
      setForm((prev) => ({ ...prev, sku }));
    }
  }, [form.name, form.category, allProducts]);

  // --- Opciones de catálogos (con soporte para valores nuevos agregados en sesión) ---
  const [addedCategories, setAddedCategories] = useState<string[]>([]);
  const [addedSubcategories, setAddedSubcategories] = useState<
    Record<string, string[]>
  >({});
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
        barcode: initialBoxBarcode || "",
        quantityPerBox: initialQuantityPerBox || 24,
        isBoxBarcode: true,
      });
      setErrors({});
    }
  }, [open, barId, initialBoxBarcode, initialQuantityPerBox]);

  const updateField = <K extends keyof CreateProductData>(
    key: K,
    value: CreateProductData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear error on change
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    // Validaciones de la CAJA
    if (!form.barcode.trim()) errs.barcode = "El código de la caja es obligatorio";
    if (!form.quantityPerBox || form.quantityPerBox <= 1) {
      errs.quantityPerBox = "El paquete debe tener más de 1 pieza";
    }

    // Validaciones del PRODUCTO INDIVIDUAL
    if (!form.individualBarcode?.trim()) {
      errs.individualBarcode = "El código del producto suelto es obligatorio";
    }
    if (!form.unit.trim()) errs.unit = "La presentación del producto individual es obligatoria";

    // Validaciones generales del producto
    if (!form.name.trim()) errs.name = "El nombre es obligatorio";
    if (!form.sku.trim()) errs.sku = "El SKU es obligatorio";
    if (!form.category.trim()) errs.category = "La categoría es obligatoria";
    if (!form.subcategory.trim())
      errs.subcategory = "La subcategoría es obligatoria";
    if (!form.supplier.trim()) errs.supplier = "El proveedor es obligatorio";
    if (form.price <= 0) errs.price = "El precio debe ser mayor a 0";
    if (form.minStock < 0)
      errs.minStock = "El stock mínimo no puede ser negativo";
    if (form.maxStock <= 0)
      errs.maxStock = "El stock máximo debe ser mayor a 0";
    if (form.minStock >= form.maxStock)
      errs.minStock = "El stock mínimo debe ser menor al máximo";

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
      isBoxBarcode: true, // Siempre true en este modal
      quantityPerBox: form.quantityPerBox,
      individualBarcode: form.individualBarcode?.trim(),
      image: imageValue,
      barId,
    };

    // TODO: POST /api/products — enviar cleanData al backend
    onSave(cleanData);
    setIsSaving(false);
    onClose();
  };

  // Stock final en unidades individuales
  const finalStock = form.stock * (form.quantityPerBox || 1);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Box className="w-5 h-5 text-amber-600" />
            </div>
            Agregar Producto en Caja/Paquete
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Bar asignado (readonly) */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600 font-medium">Bar asignado</p>
            <p className="text-sm font-semibold text-blue-900">{barName}</p>
          </div>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* SECCIÓN 1: INFORMACIÓN DEL PAQUETE/CAJA                      */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900">📦 Información del Paquete/Caja</p>
                <p className="text-xs text-amber-700">Datos del empaquetado (código de caja, cantidad de piezas)</p>
              </div>
            </div>

            {/* Código de barras de la CAJA */}
            <FormField label="Código de barras de la caja/paquete" required error={errors.barcode}>
              {hasInitialBarcode && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <ScanLine className="w-4 h-4 text-green-600" />
                  <p className="text-xs text-green-600 font-medium">Código escaneado automáticamente</p>
                </div>
              )}
              <TouchInput
                value={form.barcode}
                onChange={(e) => updateField("barcode", cleanBarcode(e.target.value))}
                placeholder="Ej: 7501099100058"
                readOnly={hasInitialBarcode}
                className={cn(
                  "min-h-[44px] bg-white",
                  hasInitialBarcode &&
                    "bg-gray-100 text-gray-600 font-mono cursor-not-allowed",
                )}
              />
            </FormField>

            {/* Piezas por paquete */}
            <FormField label="Piezas por paquete" required error={errors.quantityPerBox}>
              <TouchInput
                type="number"
                value={form.quantityPerBox || ""}
                onChange={(e) => updateField("quantityPerBox", Number(e.target.value))}
                placeholder="Ej: 24"
                className="min-h-[44px] bg-white"
              />
              <p className="text-xs text-amber-700 mt-1">
                Cantidad de unidades individuales que contiene cada paquete
              </p>
            </FormField>
          </div>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* SECCIÓN 2: INFORMACIÓN DEL PRODUCTO INDIVIDUAL               */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                <ScanLine className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-900">🏷️ Información del Producto Individual</p>
                <p className="text-xs text-blue-700">Datos de la pieza suelta (código individual, presentación)</p>
              </div>
            </div>

            {/* Código de barras del PRODUCTO SUELTO */}
            <FormField label="Código de barras del producto suelto" required error={errors.individualBarcode}>
              <TouchInput
                value={form.individualBarcode || ""}
                onChange={(e) => updateField("individualBarcode", cleanBarcode(e.target.value))}
                placeholder="Ej: 7501234567890"
                className="min-h-[44px] bg-white"
              />
              <p className="text-xs text-blue-700 mt-1">
                Este código se usará para escanear piezas individuales (sueltas)
              </p>
            </FormField>

            {/* Presentación del producto individual */}
            <FormField label="Presentación del producto individual" required error={errors.unit}>
              <TouchInput
                value={form.unit}
                onChange={(e) => updateField("unit", e.target.value)}
                placeholder="Ej: bote, botella, vasito, lata"
                className="min-h-[44px] bg-white"
              />
              <p className="text-xs text-blue-700 mt-1">
                ¿Cómo se presenta el producto cuando viene suelto?
              </p>
            </FormField>
          </div>

          {/* Preview del stock final */}
          {form.stock > 0 && form.quantityPerBox > 1 && (
            <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
              <p className="text-xs text-green-700 font-medium text-center">
                📊 Stock final a registrar:
              </p>
              <p className="text-sm text-green-900 font-bold text-center mt-1">
                {form.stock} paquete(s) × {form.quantityPerBox} {form.unit || "piezas"} = {" "}
                <span className="text-lg text-green-700">{finalStock} {form.unit || "unidades"}</span>
              </p>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* SECCIÓN 3: DATOS GENERALES DEL PRODUCTO                      */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="space-y-4 pt-2 border-t-2 border-gray-200">
            <p className="text-sm font-semibold text-gray-700">Datos Generales del Producto</p>

            {/* Nombre */}
            <FormField label="Nombre del Producto" required error={errors.name}>
              <TouchInput
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Ej: Crema Comestible Toñanes"
                className="min-h-[44px]"
              />
            </FormField>

            {/* SKU (auto-generado) */}
            <FormField label="SKU (auto-generado)" required error={errors.sku}>
              <TouchInput
                value={form.sku}
                readOnly
                placeholder="Se genera al completar nombre y categoría"
                className="min-h-[44px] bg-gray-100 text-gray-600 font-mono cursor-not-allowed"
              />
            </FormField>

            {/* Categoría */}
            <ComboboxField
              label="Categoría"
              value={form.category}
              onChange={(v) => {
                if (!categories.includes(v)) {
                  setAddedCategories((prev) => [...prev, v]);
                }
                updateField("category", v);
                // Limpiar subcategoría si ya no pertenece a la nueva categoría
                const allSubs = [
                  ...(DEFAULT_SUBCATEGORIES[v] || []),
                  ...(addedSubcategories[v] || []),
                ];
                if (form.subcategory && !allSubs.includes(form.subcategory)) {
                  updateField("subcategory", "");
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
                  setAddedSubcategories((prev) => ({
                    ...prev,
                    [form.category]: [...(prev[form.category] || []), v],
                  }));
                }
                updateField("subcategory", v);
              }}
              options={subcategoryOptions}
              placeholder={
                form.category
                  ? "Buscar o agregar subcategoría..."
                  : "Selecciona una categoría primero"
              }
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
                  setAddedSuppliers((prev) => [...prev, v]);
                }
                updateField("supplier", v);
              }}
              options={suppliers}
              placeholder="Buscar proveedor..."
              required
              error={errors.supplier}
            />

            {/* Precio + Paquetes a Ingresar */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Precio (por unidad individual)" required error={errors.price}>
                <TouchInput
                  type="number"
                  value={form.price || ""}
                  onChange={(e) => updateField("price", Number(e.target.value))}
                  placeholder="0.00"
                  className="min-h-[44px]"
                />
              </FormField>
              <FormField label="Paquetes a Ingresar">
                <TouchInput
                  type="number"
                  value={form.stock || ""}
                  onChange={(e) => updateField("stock", Number(e.target.value))}
                  placeholder="0"
                  className="min-h-[44px]"
                />
              </FormField>
            </div>

            {/* Stock Mínimo + Stock Máximo */}
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Stock Mínimo" required error={errors.minStock}>
                <TouchInput
                  type="number"
                  value={form.minStock || ""}
                  onChange={(e) =>
                    updateField("minStock", Number(e.target.value))
                  }
                  placeholder="10"
                  className="min-h-[44px]"
                />
              </FormField>
              <FormField label="Stock Máximo" required error={errors.maxStock}>
                <TouchInput
                  type="number"
                  value={form.maxStock || ""}
                  onChange={(e) =>
                    updateField("maxStock", Number(e.target.value))
                  }
                  placeholder="100"
                  className="min-h-[44px]"
                />
              </FormField>
            </div>

            {/* Hint sobre stock mínimo */}
            <p className="text-xs text-gray-500 -mt-2">
              El stock mínimo define el umbral para alertas de "stock bajo".
            </p>

            {/* Imagen del producto */}
            <ImageUrlField
              value={form.image}
              onChange={(v) => updateField("image", v)}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 min-h-[44px]"
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex-1 min-h-[44px] bg-amber-500 hover:bg-amber-600"
            >
              {isSaving ? "Guardando..." : "Agregar Producto"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
