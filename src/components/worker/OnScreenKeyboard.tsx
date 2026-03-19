import { cn } from '@/lib/utils';
import { Delete, CornerDownLeft, X } from 'lucide-react';

interface OnScreenKeyboardProps {
  visible: boolean;
  onKeyPress: (key: string) => void;
  onClose: () => void;
  mode?: 'alpha' | 'numeric';
}

const alphaRows = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
];

const numericKeys = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'DEL'],
];

export function OnScreenKeyboard({ visible, onKeyPress, onClose, mode = 'alpha' }: OnScreenKeyboardProps) {
  if (!visible) return null;

  const handleKey = (key: string) => {
    if (key === 'DEL') {
      onKeyPress('Backspace');
    } else if (key === 'SPACE') {
      onKeyPress(' ');
    } else if (key === 'ENTER') {
      onKeyPress('Enter');
    } else {
      onKeyPress(key);
    }
  };

  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 z-50 bg-gray-100 border-t border-gray-300 shadow-2xl',
      'animate-in slide-in-from-bottom duration-300'
    )}>
      {/* Close button */}
      <div className="flex justify-end px-4 pt-2">
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="px-2 pb-4">
        {mode === 'alpha' ? (
          <div className="space-y-1.5">
            {alphaRows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center gap-1">
                {row.map((key) => (
                  <button
                    key={key}
                    onClick={() => handleKey(key)}
                    className="min-w-[36px] h-11 px-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-300 active:scale-95 transition-all duration-100 shadow-sm"
                  >
                    {key}
                  </button>
                ))}
                {rowIndex === 2 && (
                  <button
                    onClick={() => handleKey('DEL')}
                    className="min-w-[56px] h-11 px-3 rounded-lg bg-gray-200 border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-300 active:scale-95 transition-all duration-100"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            {/* Bottom row */}
            <div className="flex justify-center gap-1">
              <button
                onClick={() => handleKey('SPACE')}
                className="flex-1 max-w-[300px] h-11 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-500 hover:bg-blue-50 active:scale-[0.98] transition-all duration-100 shadow-sm"
              >
                espacio
              </button>
              <button
                onClick={() => handleKey('ENTER')}
                className="min-w-[80px] h-11 px-4 rounded-lg bg-blue-500 border border-blue-500 flex items-center justify-center gap-1 text-white text-sm font-medium hover:bg-blue-600 active:scale-95 transition-all duration-100"
              >
                <CornerDownLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-[200px] mx-auto space-y-1.5">
            {numericKeys.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center gap-1.5">
                {row.map((key) => (
                  <button
                    key={key}
                    onClick={() => handleKey(key)}
                    className={cn(
                      'w-14 h-12 rounded-lg border text-base font-medium active:scale-95 transition-all duration-100 shadow-sm',
                      key === 'DEL'
                        ? 'bg-gray-200 border-gray-300 text-gray-600 hover:bg-gray-300'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300'
                    )}
                  >
                    {key === 'DEL' ? <Delete className="w-5 h-5 mx-auto" /> : key}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
