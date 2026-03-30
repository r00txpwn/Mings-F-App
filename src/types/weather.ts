export interface WeatherDay {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  windMax: number;
}

export interface WeatherForecastResult {
  days: WeatherDay[];
  stale: boolean;
}

