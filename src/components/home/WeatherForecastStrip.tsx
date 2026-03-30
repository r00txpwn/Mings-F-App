import { useEffect, useMemo, useState } from 'react';
import { Cloud, CloudDrizzle, CloudRain, CloudSnow, Sun, Wind } from 'lucide-react';
import { fetchSevenDayForecast } from '../../services/weather/openMeteo';
import type { WeatherDay } from '../../types/weather';
import { useLanguage } from '../../contexts/LanguageContext';

function getDayLabel(
  date: string,
  index: number,
  todayLabel: string,
  locale: string,
) {
  if (index === 0) return todayLabel;
  return new Date(date).toLocaleDateString(locale, { weekday: 'short' }).toUpperCase();
}

function getWeatherMeta(code: number, labels: { clear: string; cloudy: string; fog: string; rain: string; snow: string; storm: string; mixed: string }) {
  if (code === 0) return { label: labels.clear, Icon: Sun };
  if (code >= 1 && code <= 3) return { label: labels.cloudy, Icon: Cloud };
  if (code >= 45 && code <= 48) return { label: labels.fog, Icon: Cloud };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { label: labels.rain, Icon: CloudRain };
  if (code >= 71 && code <= 77) return { label: labels.snow, Icon: CloudSnow };
  if (code >= 95) return { label: labels.storm, Icon: CloudDrizzle };
  return { label: labels.mixed, Icon: CloudDrizzle };
}

export function WeatherForecastStrip() {
  const { t, language } = useLanguage();
  const locale = language === 'az' ? 'az-AZ' : language === 'ru' ? 'ru-RU' : 'en-US';
  const [days, setDays] = useState<WeatherDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const result = await fetchSevenDayForecast();
      if (cancelled) return;
      setDays(result.days);
      setStale(result.stale);
      setLoading(false);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }).map((_, idx) => (
            <div
              key={idx}
              className="h-[78px] min-w-0 animate-pulse rounded-xl border border-cockpit-200/70 bg-white/70 dark:border-white/10 dark:bg-slate-900/70"
            />
          ))}
        </div>
      );
    }

    if (days.length === 0) {
      return (
        <div className="rounded-2xl border border-cockpit-200/70 bg-white/75 px-4 py-3 text-xs text-slate-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300">
          {t.weatherUnavailable}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day, idx) => {
          const weather = getWeatherMeta(day.weatherCode, {
            clear: t.clear,
            cloudy: t.cloudy,
            fog: t.fog,
            rain: t.rain,
            snow: t.snow,
            storm: t.storm,
            mixed: t.mixed,
          });
          return (
            <div
              key={day.date}
              className="group min-w-0 rounded-xl border border-cockpit-200/70 bg-white/80 p-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-cockpit-glow dark:border-white/10 dark:bg-slate-900/75"
            >
              <div className="flex items-center justify-between">
                <span className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-cockpit-700 dark:text-cockpit-300">
                  {getDayLabel(day.date, idx, t.today, locale)}
                </span>
                <weather.Icon className="ml-1 h-3.5 w-3.5 shrink-0 text-cockpit-700 dark:text-cockpit-300" />
              </div>
              <p className="mt-1.5 truncate text-sm font-bold text-slate-900 dark:text-white">
                {Math.round(day.tempMax)}°/{Math.round(day.tempMin)}°
              </p>
              <p className="truncate text-[10px] text-slate-600 dark:text-slate-300">{weather.label}</p>
              <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] text-slate-500 dark:text-slate-400">
                <Wind className="h-3 w-3 shrink-0" />
                {Math.round(day.windMax)}km/h
              </p>
            </div>
          );
        })}
      </div>
    );
  }, [days, loading, t, locale]);

  return (
    <section className="w-full min-w-0 max-w-[760px]">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cockpit-600 dark:text-cockpit-400">
          {t.sevenDay}
        </p>
        {stale ? <span className="text-[10px] text-amber-600 dark:text-amber-300">{t.cached}</span> : null}
      </div>
      {content}
    </section>
  );
}

