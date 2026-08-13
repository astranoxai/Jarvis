import { ToolDefinition } from './types.js';

export const weatherTool: ToolDefinition = {
  name: 'get_weather',
  description: 'Get current weather for a city.',
  permission: 'read_only',

  parameters: {
    type: 'object',
    properties: {
      city: {
        type: 'string',
        description: 'City name, for example Lucknow or Delhi.'
      }
    },
    required: ['city'],
    additionalProperties: false
  },

  async execute(args) {
    const city = String(args.city ?? '').trim();

    if (!city) {
      throw new Error('City is required');
    }

    const geoResponse = await fetch(
      'https://geocoding-api.open-meteo.com/v1/search?' +
      new URLSearchParams({
        name: city,
        count: '1',
        language: 'en',
        format: 'json'
      })
    );

    if (!geoResponse.ok) {
      throw new Error('Weather location lookup failed');
    }

    const geo = await geoResponse.json() as any;

    if (!geo.results?.length) {
      throw new Error(`Could not find ${city}`);
    }

    const location = geo.results[0];

    const weatherResponse = await fetch(
      'https://api.open-meteo.com/v1/forecast?' +
      new URLSearchParams({
        latitude: String(location.latitude),
        longitude: String(location.longitude),
        current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
        temperature_unit: 'celsius',
        wind_speed_unit: 'kmh',
        timezone: 'auto'
      })
    );

    if (!weatherResponse.ok) {
      throw new Error('Weather request failed');
    }

    const weather = await weatherResponse.json() as any;

    return {
      city: location.name,
      country: location.country,
      temperature_c: weather.current.temperature_2m,
      humidity_percent: weather.current.relative_humidity_2m,
      wind_speed_kmh: weather.current.wind_speed_10m,
      weather_code: weather.current.weather_code,
      time: weather.current.time
    };
  }
};
