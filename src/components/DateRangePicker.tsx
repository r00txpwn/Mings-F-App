import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../contexts/LanguageContext';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartChange: (date: string) => void;
  onEndChange: (date: string) => void;
  startLabel: string;
  endLabel: string;
  quickRanges?: boolean;
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

const toISO = (date: Date) => date.toISOString().split('T')[0];

function getQuickRanges() {
  const now = new Date();
  const today = toISO(now);
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(now.getDate() - 1);
  const yesterday = toISO(yesterdayDate);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return {
    today: { start: today, end: today },
    yesterday: { start: yesterday, end: yesterday },
    thisWeek: { start: toISO(weekStart), end: today },
  };
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  startLabel,
  endLabel,
  quickRanges = true,
}: DateRangePickerProps) {
  const { t } = useLanguage();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [open, setOpen] = useState(false);
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [desktopPosition, setDesktopPosition] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const clickedTrigger = ref.current?.contains(target);
      const clickedPopover = popoverRef.current?.contains(target);
      if (!clickedTrigger && !clickedPopover) {
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

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const trigger = ref.current?.getBoundingClientRect();
      if (!trigger) return;

      const mobile = window.innerWidth < 768;
      setIsMobileViewport(mobile);
      if (mobile) return;

      const popoverWidth = 360;
      const margin = 12;
      const x = Math.min(
        Math.max(trigger.left, margin),
        Math.max(margin, window.innerWidth - popoverWidth - margin)
      );
      const y = Math.round(trigger.bottom + 8);
      setDesktopPosition({ top: y, left: Math.round(x) });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
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
  const quick = getQuickRanges();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm shadow-sm transition-colors hover:border-slate-300 dark:border-violet-400/20 dark:bg-slate-950/65"
        onClick={() => setOpen(!open)}
      >
        <Calendar className="h-4 w-4 flex-shrink-0 text-slate-500 dark:text-slate-400" />
        <span className="text-sm whitespace-nowrap truncate">
          {startDate && endDate ? (
            <span className="text-slate-900 dark:text-white">{formatDisplay(startDate)} — {formatDisplay(endDate)}</span>
          ) : startDate ? (
            <><span className="text-slate-900 dark:text-white">{formatDisplay(startDate)}</span><span className="text-slate-400 dark:text-slate-500"> — {endLabel}</span></>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">{startLabel} — {endLabel}</span>
          )}
        </span>
      </button>

      {open && (
        <>
          {createPortal(
            <>
              <button
                type="button"
                aria-label="Close date picker"
                className="fixed inset-0 z-[90] bg-black/35 backdrop-blur-[1px] md:hidden"
                onClick={() => setOpen(false)}
              />
              <div
                ref={popoverRef}
                className={`fixed z-[100] animate-fadeIn rounded-3xl border border-slate-200 bg-slate-100 p-4 shadow-xl dark:border-white/10 dark:bg-slate-900 ${
                  isMobileViewport
                    ? 'inset-x-3 top-20 max-h-[80vh] overflow-y-auto'
                    : 'w-[360px] max-h-[80vh] overflow-y-auto'
                }`}
                style={
                  isMobileViewport
                    ? undefined
                    : { top: desktopPosition.top, left: desktopPosition.left }
                }
              >
                <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="rounded-xl bg-slate-200 p-2 text-slate-700 transition-colors hover:bg-slate-300 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="rounded-xl bg-slate-200 p-2 text-slate-700 transition-colors hover:bg-slate-300 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                </div>

                <div className="mb-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSelecting('start')}
                  className={`flex-1 rounded-lg py-1.5 text-center text-xs transition-colors ${
                    selecting === 'start'
                      ? 'bg-violet-600 font-medium text-white'
                      : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-white/10'
                  }`}
                >
                  {startDate ? formatDisplay(startDate) : startLabel}
                </button>
                <span className="px-1 text-[10px] text-slate-300 dark:text-slate-600">→</span>
                <button
                  type="button"
                  onClick={() => setSelecting('end')}
                  className={`flex-1 rounded-lg py-1.5 text-center text-xs transition-colors ${
                    selecting === 'end'
                      ? 'bg-violet-600 font-medium text-white'
                      : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-white/10'
                  }`}
                >
                  {endDate ? formatDisplay(endDate) : endLabel}
                </button>
                </div>

                <div className="mb-1 grid grid-cols-7">
                {DAY_LABELS.map((d) => (
                  <div key={d} className="py-1 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {d}
                  </div>
                ))}
                </div>

                <div className="grid grid-cols-7">
                {cells.map((day, i) => {
                  if (day === null) {
                    return <div key={`e-${i}`} className="h-8" />;
                  }

                  const dateStr = toDateStr(viewYear, viewMonth, day);
                  const isStart = isRangeStart(dateStr);
                  const isEnd = isRangeEnd(dateStr);
                  const inRange = isInRange(dateStr);
                  const isToday = dateStr === toDateStr(now.getFullYear(), now.getMonth(), now.getDate());

                  let cellBg = '';
                  let textClass = 'text-slate-700 dark:text-slate-200';
                  let roundedClass = '';

                  if (isStart && isEnd) {
                    cellBg = 'bg-blue-500 dark:bg-blue-500';
                    textClass = 'text-white';
                    roundedClass = 'rounded-lg';
                  } else if (isStart) {
                    cellBg = 'bg-blue-500 dark:bg-blue-500';
                    textClass = 'text-white';
                    roundedClass = endDate ? 'rounded-l-lg' : 'rounded-lg';
                  } else if (isEnd) {
                    cellBg = 'bg-blue-500 dark:bg-blue-500';
                    textClass = 'text-white';
                    roundedClass = 'rounded-r-lg';
                  } else if (inRange) {
                    cellBg = 'bg-blue-100 dark:bg-blue-900/30';
                    textClass = 'text-slate-900 dark:text-blue-100';
                  }

                  return (
                    <div
                      key={dateStr}
                      className={`h-8 flex items-center justify-center ${cellBg} ${roundedClass}`}
                    >
                      <button
                        type="button"
                        onClick={() => handleDayClick(dateStr)}
                        className={`flex h-7 w-7 items-center justify-center rounded-md text-sm transition-colors
                          ${textClass}
                          ${!isStart && !isEnd && !inRange ? 'hover:bg-slate-200 dark:hover:bg-white/10' : ''}
                          ${isToday && !isStart && !isEnd ? 'font-bold ring-1 ring-violet-400 dark:ring-violet-500' : ''}
                        `}
                      >
                        {day}
                      </button>
                    </div>
                  );
                })}
                </div>

                {quickRanges && (
                  <div className="mt-4 grid gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onStartChange(quick.today.start);
                      onEndChange(quick.today.end);
                      setOpen(false);
                    }}
                    className="rounded-2xl bg-slate-200 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-300 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20"
                  >
                    {t.today}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onStartChange(quick.yesterday.start);
                      onEndChange(quick.yesterday.end);
                      setOpen(false);
                    }}
                    className="rounded-2xl bg-slate-200 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-300 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20"
                  >
                    {t.yesterday}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onStartChange(quick.thisWeek.start);
                      onEndChange(quick.thisWeek.end);
                      setOpen(false);
                    }}
                    className="rounded-2xl bg-slate-200 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-300 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20"
                  >
                    {t.thisWeek}
                  </button>
                  </div>
                )}
              </div>
            </>,
            document.body,
          )}
        </>
      )}
    </div>
  );
}
