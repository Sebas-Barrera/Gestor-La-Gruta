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
import { Plus, ScanLine } from "lucide-react";
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
  isBoxBarcode?: boolean;
  quantityPerBox?: number;
  individualBarcode?: string;
  barId: string;
  isWeightBased: boolean;
  weightUnit: "kg" | "g" | "ml" | "L";
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
  /** Unidad pre-llenada desde un helper visual (ej. 'caja') */
  initialUnit?: string;
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
  unit: "botella",
  barcode: "",
  isBoxBarcode: false,
  quantityPerBox: 24,
  individualBarcode: "",
  barId: "",
  isWeightBased: false,
  weightUnit: "kg",
  image: "",
};

// Estado local adicional para controlar si es un producto empaquetado (independiente de la unidad)
interface FormStateExtended extends CreateProductData {
  _isPackagedProduct?: boolean;
}

export function AddProductModal({
  open,
  onClose,
  onSave,
  barId,
  barName,
  initialBarcode,
  initialUnit,
  initialQuantityPerBox,
}: AddProductModalProps) {
  const { products: allProducts } = useInventory();
  const [form, setForm] = useState<FormStateExtended>({
    ...INITIAL_FORM,
    unit: initialUnit && initialUnit !== "caja" ? initialUnit : INITIAL_FORM.unit,
    quantityPerBox: initialQuantityPerBox || INITIAL_FORM.quantityPerBox,
    barId,
    _isPackagedProduct: initialUnit === "caja",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hasInitialBarcode = !!initialBarcode;
  const isPackagedProduct = form._isPackagedProduct || false;

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
        barcode: initialBarcode || "",
        unit: initialUnit && initialUnit !== "caja" ? initialUnit : "botella",
        quantityPerBox: initialQuantityPerBox || 24,
        _isPackagedProduct: initialUnit === "caja",
      });
      setErrors({});
    }
  }, [open, barId, initialBarcode, initialUnit, initialQuantityPerBox]);

  const updateField = <K extends keyof FormStateExtended>(
    key: K,
    value: FormStateExtended[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear error on change
    if (errors[key as string]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "El nombre es obligatorio";
    if (!form.sku.trim()) errs.sku = "El SKU es obligatorio";
    if (!form.category.trim()) errs.category = "La categoría es obligatoria";
    if (!form.subcategory.trim())
      errs.subcategory = "La subcategoría es obligatoria";
    if (!form.supplier.trim()) errs.supplier = "El proveedor es obligatorio";
    if (form.minStock < 0)
      errs.minStock = "El stock mínimo no puede ser negativo";
    if (form.maxStock <= 0)
      errs.maxStock = "El stock máximo debe ser mayor a 0";
    if (form.minStock >= form.maxStock)
      errs.minStock = "El stock mínimo debe ser menor al máximo";
    if (!form.unit.trim()) errs.unit = "La unidad es obligatoria";

    // Validar configuración de caja si está habilitada
    if (isPackagedProduct && form.barcode) {
      if (!form.quantityPerBox || form.quantityPerBox <= 1) {
        errs.quantityPerBox = "El paquete debe tener más de 1 pieza";
      }
      if (!form.individualBarcode?.trim()) {
        errs.individualBarcode = "Obligatorio registrar código de pieza suelta";
      }
    }

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
      isBoxBarcode: isPackagedProduct,
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
                <p className="text-xs text-green-600 font-medium">
                  Producto escaneado
                </p>
                <p className="text-sm font-mono font-semibold text-green-900">
                  {initialBarcode}
                </p>
              </div>
            </div>
          )}

          {/* Nombre */}
          <FormField label="Nombre del Producto" required error={errors.name}>
            <TouchInput
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Ej: Coca Cola 355ml"
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

          {/* Precio + Unidad */}
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Precio ($)" error={errors.price}>
              <TouchInput
                type="number"
                value={form.price || ""}
                onChange={(e) => updateField("price", Number(e.target.value))}
                placeholder="0.00"
                className="min-h-[44px]"
                />
            </FormField>
            <FormField label="Unidad" required error={errors.unit}>
              <TouchInput
                value={form.unit}
                onChange={(e) => updateField("unit", e.target.value)}
                placeholder="Ej: botella, lata, kg"
                className="min-h-[44px]"
                />
            </FormField>
          </div>

          {/* Cantidad a Ingresar + Stock Mínimo + Stock Máximo */}
          <div className="grid grid-cols-3 gap-3">
            <FormField label={isPackagedProduct ? "Paquetes" : "Cantidad"}>
              <TouchInput
                type="number"
                value={form.stock || ""}
                onChange={(e) => updateField("stock", Number(e.target.value))}
                placeholder="0"
                className="min-h-[44px]"
                />
            </FormField>
            <FormField label="Stock Mín." required error={errors.minStock}>
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
            <FormField label="Stock Máx." required error={errors.maxStock}>
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

          {/* Código de Barras */}
          <FormField label={hasInitialBarcode ? "Código de Barras Base" : "Código de Barras (Opcional)"}>
            <TouchInput
              value={form.barcode}
              onChange={(e) => updateField("barcode", cleanBarcode(e.target.value))}
              placeholder="Ej: 7501099100058"
              readOnly={hasInitialBarcode}
              className={cn(
                "min-h-[44px]",
                hasInitialBarcode &&
                  "bg-gray-100 text-gray-600 font-mono cursor-not-allowed",
              )}
            />
          </FormField>

          {/* Toggle: Producto empaquetado */}
          {form.barcode && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                id="packaged-product-toggle"
                checked={isPackagedProduct}
                onChange={(e) => updateField("_isPackagedProduct", e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="packaged-product-toggle" className="flex-1 cursor-pointer">
                <p className="text-sm font-medium text-gray-900">
                  Este producto viene en caja/paquete
                </p>
                <p className="text-xs text-gray-500">
                  Activa esta opción para configurar cuántas piezas individuales contiene cada paquete
                </p>
              </label>
            </div>
          )}

          {/* Configuración de piezas en caja/paquete */}
          {isPackagedProduct && form.barcode && (
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📦</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900">Configuración de Paquete</p>
                  <p className="text-xs text-amber-700">El stock final será en unidades individuales ({form.unit || "piezas"})</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label={`${form.unit || "Piezas"} por paquete`} required error={errors.quantityPerBox}>
                  <TouchInput
                    type="number"
                    value={form.quantityPerBox || ""}
                    onChange={(e) => updateField("quantityPerBox", Number(e.target.value))}
                    placeholder="24"
                    className="min-h-[44px] bg-white"
                        />
                </FormField>
                <FormField label="Código de pieza suelta" required error={errors.individualBarcode}>
                  <TouchInput
                    value={form.individualBarcode || ""}
                    onChange={(e) => updateField("individualBarcode", cleanBarcode(e.target.value))}
                    placeholder="Ej: 75010..."
                    className="min-h-[44px] bg-white"
                        />
                </FormField>
              </div>

              {form.stock > 0 && (form.quantityPerBox ?? 0) > 1 && (
                <div className="mt-2 p-2 bg-white/60 rounded-lg border border-amber-300">
                  <p className="text-xs text-amber-800 font-medium text-center">
                    📊 Stock final: {form.stock} paquete(s) × {form.quantityPerBox} {form.unit || "piezas"} = <span className="font-bold text-amber-900">{form.stock * (form.quantityPerBox ?? 1)} {form.unit || "unidades"}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Imagen del producto */}
          <ImageUrlField
            value={form.image}
            onChange={(v) => updateField("image", v)}
          />

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
              className="flex-1 min-h-[44px] bg-blue-500 hover:bg-blue-600"
            >
              {isSaving ? "Guardando..." : "Agregar Producto"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
