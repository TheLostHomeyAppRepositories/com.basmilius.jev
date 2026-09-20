import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

window.onHomeyReady = function (): void {
    document.documentElement.lang = Homey.__('language') === 'nl' ? 'nl' : 'en';
    createApp(App).mount('#app');
    Homey.ready();
};
