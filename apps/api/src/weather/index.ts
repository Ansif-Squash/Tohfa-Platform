/**
 * Weather module entry point.
 *
 * Re-exports the contract and the one real gateway, and exposes the
 * singleton the rest of the app imports so nothing outside this package
 * constructs an `OpenWeatherMapGateway` directly. There is no provider
 * selection here on purpose — see `gateway.ts`'s docblock for why there is
 * no mock/stub provider to select between.
 */
import { openWeatherMapGateway } from './openweathermap.weather.js';

export * from './gateway.js';
export * from './openweathermap.weather.js';

export const weatherGateway = openWeatherMapGateway;
