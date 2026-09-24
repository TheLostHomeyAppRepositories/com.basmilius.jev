import { mock } from 'bun:test';

/**
 * The `homey` module only exists on a Homey. The flow entities reach it through
 * the base classes of `@basmilius/homey-common`, so the tests stand in with
 * empty classes that carry no behavior.
 */
class Base {
}

const homey = {
    App: Base,
    Device: Base,
    Driver: Base
};

mock.module('homey', () => ({
    ...homey,
    default: homey
}));
