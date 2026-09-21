import { expect, test } from 'bun:test';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseRequest } from '../src/brain/request';

const root = join(import.meta.dir, '..');
const languages = ['ar', 'da', 'de', 'en', 'es', 'fr', 'it', 'ko', 'nl', 'no', 'pl', 'ru', 'sv'];
const json = (path: string) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const english = json('locales/en.json');

test('settings and store descriptions cover every supported language', () => {
    expect(readdirSync(join(root, 'locales')).filter(file => file.endsWith('.json')).map(file => file.slice(0, -5)).sort()).toEqual(languages);
    const manifest = json('.homeycompose/app.json');
    expect(Object.keys(manifest.name).sort()).toEqual(languages);
    expect(Object.keys(manifest.description).sort()).toEqual(languages);
    for (const language of languages) {
        const locale = json(`locales/${language}.json`);
        expect(locale.language).toBe(language);
        expect(Object.keys(locale.settings).sort()).toEqual(Object.keys(english.settings).sort());
        for (const value of Object.values(locale.settings)) expect(typeof value === 'string' && value.trim().length > 0).toBe(true);
        expect(manifest.description[language].length).toBeGreaterThan(0);
        const readme = readFileSync(join(root, language === 'en' ? 'README.txt' : `README.${language}.txt`), 'utf8');
        expect(readme).toContain('TypeSafe');
        expect(readme).toContain('Advanced Flow');
        expect(readme).toContain('12.4');
        expect(readme.length).toBeGreaterThan(500);
    }
});

test('all card translations preserve argument placeholders', () => {
    function inspect(value: unknown): void {
        if (!value || typeof value !== 'object') return;
        if (Array.isArray(value)) {
            value.forEach(inspect);
            return;
        }
        const object = value as Record<string, unknown>;
        if (typeof object.en === 'string') {
            expect(Object.keys(object).sort()).toEqual(languages);
            const placeholders = (text: string) => [...text.matchAll(/\[\[([^\]]+)\]\]/g)].map(match => match[1]).sort();
            for (const language of languages) {
                expect(typeof object[language]).toBe('string');
                expect((object[language] as string).trim().length).toBeGreaterThan(0);
                expect(placeholders(object[language] as string)).toEqual(placeholders(object.en));
            }
        } else {
            Object.values(object).forEach(inspect);
        }
    }
    for (const file of readdirSync(join(root, '.homeycompose/flow/actions'))) inspect(json(`.homeycompose/flow/actions/${file}`));
});

test('translated JSON examples remain valid Jev requests', () => {
    for (const language of languages) {
        const example = json(`locales/${language}.json`).settings.example;
        const request = parseRequest(example);
        expect(Object.keys(request.questions)).toEqual(['scene', 'notify']);
        expect(request.questions.scene.type).toBe('choice');
        expect(request.questions.notify.type).toBe('noul');
    }
});
