import type { ApiRequest } from '@basmilius/homey-common';
import type JevApp from './src/index';
import { identifier, record } from './src/validation';

type Request = ApiRequest<JevApp, unknown, {id: string}>;

module.exports = {
    getSettings({homey}: Request) {
        return (homey.app as JevApp).getSettings();
    },
    saveSettings({homey, body}: Request) {
        return (homey.app as JevApp).saveSettings(body);
    },
    testConnection({homey}: Request) {
        return (homey.app as JevApp).testConnection();
    },
    getDecisions({homey}: Request) {
        return (homey.app as JevApp).decisions.snapshot();
    },
    saveDecision({homey, body}: Request) {
        return (homey.app as JevApp).decisions.save(body);
    },
    deleteDecision({homey, params}: Request) {
        (homey.app as JevApp).decisions.remove(identifier(params.id));
        return {success: true};
    },
    testDecision({homey, body}: Request) {
        const data = record(body);
        return (homey.app as JevApp).decisions.evaluate(identifier(data.id), data.context, true);
    }
};
