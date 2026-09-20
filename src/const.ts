import type { Settings } from './types';

export const SETTING_API_KEY = 'jev_api_key';
export const SETTING_CONFIG = 'jev_config';
export const API_URL = 'https://api.typesafe.ai/v1/systemone';
export const DEFAULT_SETTINGS: Settings = {model: 'jev-latest', timeoutSeconds: 10, maxCallsPerMinute: 30};
