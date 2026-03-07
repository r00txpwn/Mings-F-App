import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartChange: (date: string) => void;
  onEndChange: (date: string) => void;
  startLabel: string;
  endLabel: string;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseDate(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

function isSame(a: string, b: string) {
  return a === b;
}

function formatDisplay(dateStr: string) {
  if (!dateStr) return '';
  const { year, month, day } = parseDate(dateStr);
  return `${String(day).padStart(2, '0')}.${String(month + 1).padStart(2, '0')}.${year}`;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  startLabel,
  endLabel,
}: DateRangePickerProps) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [open, setOpen] = useState(false);
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (startDate) {
      const { year, month } = parseDate(startDate);
      setViewYear(year);
      setViewMonth(month);
    }
  }, [open]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleDayClick = (dateStr: string) => {
    if (selecting === 'start') {
      onStartChange(dateStr);
      if (endDate && dateStr > endDate) {
        onEndChange('');
      }
      setSelecting('end');
    } else {
      if (startDate && dateStr < startDate) {
        onStartChange(dateStr);
        onEndChange('');
        setSelecting('end');
      } else {
        onEndChange(dateStr);
        setSelecting('start');
        setOpen(false);
      }
    }
  };

  const firstDay = new Date(viewYear, viewMonth, 1);
  let startWeekday = firstDay.getDay() - 1;
  if (startWeekday < 0) startWeekday = 6;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isInRange = (dateStr: string) => {
    if (!startDate || !endDate) return false;
    return dateStr > startDate && dateStr < endDate;
  };

  const isRangeStart = (dateStr: string) => startDate && isSame(dateStr, startDate);
  const isRangeEnd = (dateStr: string) => endDate && isSame(dateStr, endDate);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="w-full flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 transition-colors text-left"
        onClick={() => setOpen(!open)}
      >
        <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
        <span className="text-sm whitespace-nowrap truncate">
          {startDate && endDate ? (
            <span className="text-gray-900 dark:text-white">{formatDisplay(startDate)} — {formatDisplay(endDate)}</span>
          ) : startDate ? (
            <><span className="text-gray-900 dark:text-white">{formatDisplay(startDate)}</span><span className="text-gray-400 dark:text-gray-500"> — {endLabel}</span></>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">{startLabel} — {endLabel}</span>
          )}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 w-[296px] animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={prevMonth}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-0.5 mb-2">
            <button
              type="button"
              onClick={() => setSelecting('start')}
              className={`flex-1 text-center text-xs py-1.5 rounded-md transition-colors ${
                selecting === 'start'
                  ? 'bg-teal-600 text-white font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {startDate ? formatDisplay(startDate) : startLabel}
            </button>
            <span className="text-gray-300 dark:text-gray-600 text-[10px] px-1">→</span>
            <button
              type="button"
              onClick={() => setSelecting('end')}
              className={`flex-1 text-center text-xs py-1.5 rounded-md transition-colors ${
                selecting === 'end'
                  ? 'bg-teal-600 text-white font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {endDate ? formatDisplay(endDate) : endLabel}
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center text-[10px] font-medium text-gray-400 dark:text-gray-500 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`e-${i}`} className="h-9" />;
              }

              const dateStr = toDateStr(viewYear, viewMonth, day);
              const isStart = isRangeStart(dateStr);
              const isEnd = isRangeEnd(dateStr);
              const inRange = isInRange(dateStr);
              const isToday = dateStr === toDateStr(now.getFullYear(), now.getMonth(), now.getDate());

              let cellBg = '';
              let textClass = 'text-gray-700 dark:text-gray-200';
              let roundedClass = '';

              if (isStart && isEnd) {
                cellBg = 'bg-teal-600 dark:bg-teal-500';
                textClass = 'text-white';
                roundedClass = 'rounded-lg';
              } else if (isStart) {
                cellBg = 'bg-teal-600 dark:bg-teal-500';
                textClass = 'text-white';
                roundedClass = endDate ? 'rounded-l-lg' : 'rounded-lg';
              } else if (isEnd) {
                cellBg = 'bg-teal-600 dark:bg-teal-500';
                textClass = 'text-white';
                roundedClass = 'rounded-r-lg';
              } else if (inRange) {
                cellBg = 'bg-teal-50 dark:bg-teal-900/20';
                textClass = 'text-teal-800 dark:text-teal-200';
              }

              return (
                <div
                  key={dateStr}
                  className={`h-9 flex items-center justify-center ${cellBg} ${roundedClass}`}
                >
                  <button
                    onClick={() => handleDayClick(dateStr)}
                    className={`w-8 h-8 flex items-center justify-center text-sm transition-colors rounded-md
                      ${textClass}
                      ${!isStart && !isEnd && !inRange ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                      ${isToday && !isStart && !isEnd ? 'font-bold ring-1 ring-teal-400 dark:ring-teal-500' : ''}
                    `}
                  >
                    {day}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
