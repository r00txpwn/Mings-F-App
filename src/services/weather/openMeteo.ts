import type { WeatherDay, WeatherForecastResult } from '../../types/weather';

type CachedWeatherPayload = {
  fetchedDate: string;
  days: WeatherDay[];
};

const DEFAULT_LAT = 40.4093; // Baku
const DEFAULT_LON = 49.8671; // Baku
const CACHE_PREFIX = 'weather:v1';

function getLocation() {
  const lat = Number(import.meta.env.VITE_WEATHER_LAT ?? DEFAULT_LAT);
  const lon = Number(import.meta.env.VITE_WEATHER_LON ?? DEFAULT_LON);
  return { lat, lon };
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getCacheKey(lat: number, lon: number) {
  return `${CACHE_PREFIX}:${lat}:${lon}`;
}

function readCache(key: string): CachedWeatherPayload | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedWeatherPayload;
    if (!Array.isArray(parsed.days) || typeof parsed.fetchedDate !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(key: string, payload: CachedWeatherPayload) {
  window.localStorage.setItem(key, JSON.stringify(payload));
}

function toDays(daily: {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  wind_speed_10m_max: number[];
}): WeatherDay[] {
  const len = Math.min(
    daily.time.length,
    daily.weather_code.length,
    daily.temperature_2m_max.length,
    daily.temperature_2m_min.length,
    daily.wind_speed_10m_max.length,
  );

  const rows: WeatherDay[] = [];
  for (let i = 0; i < len; i += 1) {
    rows.push({
      date: daily.time[i],
      weatherCode: daily.weather_code[i],
      tempMax: daily.temperature_2m_max[i],
      tempMin: daily.temperature_2m_min[i],
      windMax: daily.wind_speed_10m_max[i],
    });
  }
  return rows.slice(0, 7);
}

export async function fetchSevenDayForecast(): Promise<WeatherForecastResult> {
  const { lat, lon } = getLocation();
  const cacheKey = getCacheKey(lat, lon);
  const today = getTodayKey();
  const cached = readCache(cacheKey);

  if (cached && cached.fetchedDate === today) {
    return { days: cached.days, stale: false };
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max');
  url.searchParams.set('forecast_days', '7');
  url.searchParams.set('timezone', 'auto');

  try {
    const response = await fetch(url.toString(), { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Weather API ${response.status}`);
    }

    const json = (await response.json()) as {
      daily?: {
        time: string[];
        weather_code: number[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        wind_speed_10m_max: number[];
      };
    };

    if (!json.daily) {
      throw new Error('Weather payload missing daily forecast');
    }

    const days = toDays(json.daily);
    writeCache(cacheKey, { fetchedDate: today, days });
    return { days, stale: false };
  } catch {
    if (cached) {
      return { days: cached.days, stale: true };
    }
    return { days: [], stale: true };
  }
}

