import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

window.onHomeyReady = function (): void {
    const language = Homey.__('language');
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    createApp(App).mount('#app');
    Homey.ready();
};
