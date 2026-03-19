import { useState, useEffect } from 'react';
import { Check, ChevronDown, Plus } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ComboboxFieldProps {
  /** Texto del label del campo */
  label: string;
  /** Valor seleccionado actualmente */
  value: string;
  /** Callback al seleccionar o escribir un valor */
  onChange: (value: string) => void;
  /** Lista de opciones predeterminadas para autocompletar */
  options: string[];
  /** Texto placeholder cuando no hay valor */
  placeholder?: string;
  /** Marcar campo como obligatorio (muestra asterisco) */
  required?: boolean;
  /** Mensaje de error de validación */
  error?: string;
  /** Desactivar interacción */
  disabled?: boolean;
}

/**
 * Campo de formulario con autocompletado y opción de agregar nuevos valores.
 *
 * Usa Command (cmdk) + Popover para mostrar una lista filtrable de opciones.
 * Si el texto escrito no coincide con ninguna opción, muestra un botón
 * "Agregar [texto]" para añadir un valor personalizado.
 *
 * Backend: los valores nuevos agregados por el usuario deben persistirse
 * mediante POST al endpoint correspondiente del catálogo.
 *
 * @example
 * <ComboboxField
 *   label="Categoría"
 *   value={form.category}
 *   onChange={(v) => updateField('category', v)}
 *   options={DEFAULT_CATEGORIES}
 *   placeholder="Buscar o agregar categoría..."
 *   required
 *   error={errors.category}
 * />
 */
export function ComboboxField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Buscar...',
  required,
  error,
  disabled,
}: ComboboxFieldProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Limpiar búsqueda al cerrar el popover
  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const trimmedSearch = search.trim();

  // Filtrar opciones según búsqueda
  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(trimmedSearch.toLowerCase()),
  );

  // Verificar si el texto buscado ya existe en las opciones (case-insensitive)
  const searchExistsInOptions = options.some(
    (opt) => opt.toLowerCase() === trimmedSearch.toLowerCase(),
  );

  const handleSelect = (selected: string) => {
    onChange(selected);
    setOpen(false);
  };

  const handleAddNew = () => {
    if (!trimmedSearch) return;
    onChange(trimmedSearch);
    setOpen(false);
  };

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'flex min-h-[44px] w-full items-center justify-between rounded-lg border px-3 py-2 text-sm',
              'bg-white transition-colors duration-200',
              'hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
              error
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-200',
              value ? 'text-gray-900' : 'text-gray-400',
            )}
          >
            <span className="truncate text-left">{value || placeholder}</span>
            <ChevronDown
              className={cn(
                'ml-2 h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200',
                open && 'rotate-180',
              )}
            />
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[--radix-popover-trigger-width] min-w-[240px] p-0 shadow-lg border-gray-200 rounded-xl overflow-hidden"
          align="start"
          sideOffset={6}
        >
          <Command shouldFilter={false}>
            {/* Input de búsqueda personalizado */}
            <div className="px-3 py-2.5 border-b border-gray-100">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={placeholder}
                className="w-full text-sm outline-none bg-transparent text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <CommandList className="max-h-[220px] overflow-y-auto p-1.5">
              {filteredOptions.length === 0 && !trimmedSearch && (
                <CommandEmpty className="py-4 text-center text-sm text-gray-400">
                  Sin opciones disponibles.
                </CommandEmpty>
              )}

              {filteredOptions.length === 0 && trimmedSearch && !searchExistsInOptions && (
                <CommandGroup>
                  <CommandItem
                    onSelect={handleAddNew}
                    className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg cursor-pointer text-blue-600 hover:bg-blue-50"
                  >
                    <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center shrink-0">
                      <Plus className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">
                      Agregar &quot;{trimmedSearch}&quot;
                    </span>
                  </CommandItem>
                </CommandGroup>
              )}

              {filteredOptions.length > 0 && (
                <CommandGroup>
                  {filteredOptions.map((opt) => {
                    const isSelected = value === opt;
                    return (
                      <CommandItem
                        key={opt}
                        value={opt}
                        onSelect={() => handleSelect(opt)}
                        className={cn(
                          'flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg cursor-pointer',
                          isSelected && 'bg-blue-50',
                        )}
                      >
                        <div
                          className={cn(
                            'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors',
                            isSelected
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300 bg-white',
                          )}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <span
                          className={cn(
                            'text-sm',
                            isSelected
                              ? 'font-medium text-blue-700'
                              : 'text-gray-700',
                          )}
                        >
                          {opt}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              )}

              {/* Opción "Agregar" cuando hay resultados pero el texto no coincide exacto */}
              {trimmedSearch &&
                !searchExistsInOptions &&
                filteredOptions.length > 0 && (
                  <CommandGroup>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <CommandItem
                        onSelect={handleAddNew}
                        className="flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg cursor-pointer text-blue-600 hover:bg-blue-50"
                      >
                        <div className="w-5 h-5 rounded-md bg-blue-100 flex items-center justify-center shrink-0">
                          <Plus className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium">
                          Agregar &quot;{trimmedSearch}&quot;
                        </span>
                      </CommandItem>
                    </div>
                  </CommandGroup>
                )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
