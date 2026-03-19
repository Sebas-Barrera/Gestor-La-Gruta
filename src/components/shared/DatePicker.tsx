import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { parseLocalDate, formatISODate, formatDisplayDate } from '@/lib/dates';
import { es } from 'react-day-picker/locale';

interface DatePickerProps {
  /** Fecha seleccionada en formato ISO "YYYY-MM-DD" o "" (vacío) */
  value: string;
  /** Callback al seleccionar/deseleccionar. Retorna "YYYY-MM-DD" o "" */
  onChange: (value: string) => void;
  placeholder?: string;
  /** Función para deshabilitar fechas específicas en el calendario */
  disabled?: (date: Date) => boolean;
  /** Mes por defecto al abrir el calendario */
  defaultMonth?: Date;
  /** Alineación del popover respecto al trigger */
  align?: 'start' | 'center' | 'end';
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  disabled,
  defaultMonth,
  align = "start",
}: DatePickerProps) {
  const selected = parseLocalDate(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "h-10 w-full px-3 rounded-lg border border-input text-sm text-left",
            "flex items-center gap-2 bg-background",
            "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
            "transition-colors duration-200",
            selected ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <CalendarIcon className="w-4 h-4 opacity-50 flex-shrink-0" />
          <span className="truncate">
            {selected ? formatDisplayDate(formatISODate(selected)) : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-3 shadow-lg border-border relative z-50 rounded-xl bg-white"
        align={align}
      >
        <Calendar
          locale={es}
          mode="single"
          showOutsideDays={false}
          weekStartsOn={1}
          selected={selected}
          onSelect={(date) => onChange(formatISODate(date))}
          disabled={disabled}
          defaultMonth={defaultMonth || selected}
          classNames={{
            months:
              "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 relative",
            month: "space-y-4",
            caption_label:
              "text-sm font-semibold capitalize flex justify-center pt-1",
            nav: "flex items-center w-full absolute top-0 inset-x-0 justify-between",
            table: "w-full border-collapse space-y-2",
            head_row: "flex w-full mb-2",
            weekday:
              "text-muted-foreground rounded-md w-9 font-medium text-[0.8rem] capitalize text-center",
            row: "flex w-full mt-2",
            cell: "h-9 w-9 text-center text-sm p-0 flex items-center justify-center relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: cn(
              "h-9 w-9 p-0 font-normal aria-selected:opacity-100 flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground",
            ),
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
