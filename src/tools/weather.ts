import { ToolDefinition } from './types.js';

export const weatherTool: ToolDefinition = {
  name: 'get_weather',

  description:
    'Get the current weather for a city using Open-Meteo.',

  permission: 'read_only',

  parameters: {
    type: 'object',

    properties: {
      city: {
        type: 'string',
        description:
          'City name, for example Lucknow or Delhi.'
      }
    },

    required: ['city'],
    additionalProperties: false
  },

  async execute(args) {
    const city =
      String(
        args.city ?? ''
      ).trim();

    if (!city) {
      return {
        success: false,
        error: 'City is required'
      };
    }

    try {
      const geoResponse =
        await fetch(
          'https://geocoding-api.open-meteo.com/v1/search?' +
          new URLSearchParams({
            name: city,
            count: '1',
            language: 'en',
            format: 'json'
          })
        );

      if (!geoResponse.ok) {
        return {
          success: false,
          error:
            'Weather location lookup failed'
        };
      }

      const geo =
        await geoResponse.json() as any;

      if (
        !geo.results ||
        geo.results.length === 0
      ) {
        return {
          success: false,
          error:
            `Could not find weather location: ${city}`
        };
      }

      const location =
        geo.results[0];

      const weatherResponse =
        await fetch(
          'https://api.open-meteo.com/v1/forecast?' +
          new URLSearchParams({
            latitude:
              String(
                location.latitude
              ),

            longitude:
              String(
                location.longitude
              ),

            current:
              [
                'temperature_2m',
                'relative_humidity_2m',
                'weather_code',
                'wind_speed_10m'
              ].join(','),

            temperature_unit:
              'celsius',

            wind_speed_unit:
              'kmh',

            timezone:
              'auto'
          })
        );

      if (!weatherResponse.ok) {
        return {
          success: false,
          error:
            'Weather request failed'
        };
      }

      const weather =
        await weatherResponse.json() as any;

      const current =
        weather?.current;

      if (!current) {
        return {
          success: false,
          error:
            'Weather service returned no current conditions'
        };
      }

      return {
        success: true,

        city:
          location.name,

        region:
          location.admin1 ?? '',

        country:
          location.country ?? '',

        latitude:
          location.latitude,

        longitude:
          location.longitude,

        temperature_c:
          current.temperature_2m,

        humidity_percent:
          current.relative_humidity_2m,

        wind_speed_kmh:
          current.wind_speed_10m,

        weather_code:
          current.weather_code,

        time:
          current.time
      };

    } catch (error) {
      return {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : String(error)
      };
    }
  }
};