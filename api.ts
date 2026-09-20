import type { ApiRequest } from '@basmilius/homey-common';
import type JevApp from './src/index';

type Request = ApiRequest<JevApp, unknown>;

module.exports = {
    getSettings({homey}: Request) {
        return (homey.app as JevApp).getSettings();
    },
    saveSettings({homey, body}: Request) {
        return (homey.app as JevApp).saveSettings(body);
    },
    testConnection({homey}: Request) {
        return (homey.app as JevApp).testConnection();
    }
};
