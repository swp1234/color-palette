class I18n {
    constructor() {
        this.translations = {};
        this.supportedLanguages = ['ko', 'en', 'zh', 'hi', 'ru', 'ja', 'es', 'pt', 'id', 'tr', 'de', 'fr'];
        this.currentLang = this.detectLanguage();
        document.documentElement.lang = this.currentLang;
    }

    detectLanguage() {
        try {
            const params = new URLSearchParams(window.location.search);
            const urlLang = params.get('lang');
            if (urlLang && this.supportedLanguages.includes(urlLang)) return urlLang;
        } catch (e) {}
        try {
            const savedLang = localStorage.getItem('app_language');
            if (savedLang && this.supportedLanguages.includes(savedLang)) return savedLang;
        } catch (e) {}
        const browserLang = (navigator.language || navigator.userLanguage).split('-')[0];
        if (this.supportedLanguages.includes(browserLang)) return browserLang;
        return 'en';
    }

    async loadTranslations(lang) {
        try {
            const response = await fetch(`js/locales/${lang}.json`);
            if (!response.ok) throw new Error('Not found');
            this.translations[lang] = await response.json();
            return true;
        } catch (e) {
            if (lang !== 'en') return this.loadTranslations('en');
            return false;
        }
    }

    t(key) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];
        for (const k of keys) {
            if (value && value[k]) value = value[k];
            else return key;
        }
        return value;
    }

    async setLanguage(lang) {
        if (!this.supportedLanguages.includes(lang)) return false;
        if (!this.translations[lang]) await this.loadTranslations(lang);
        this.currentLang = lang;
        document.documentElement.lang = lang;
        try { localStorage.setItem('app_language', lang); } catch (e) {}
        this.updateUI();
        return true;
    }

    updateUI() {
        document.documentElement.lang = this.currentLang;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const val = this.t(key);
            if (val && val !== key) el.textContent = val;
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const val = this.t(key);
            if (val && val !== key) el.placeholder = val;
        });
        const titleVal = this.t('app.title');
        if (titleVal && titleVal !== 'app.title') document.title = titleVal;
        const meta = document.querySelector('meta[name="description"]');
        const descVal = this.t('app.description');
        if (meta && descVal && descVal !== 'app.description') meta.content = descVal;
        document.querySelectorAll('.lang-option').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === this.currentLang);
        });
    }

    getCurrentLanguage() {
        return this.currentLang;
    }

    getLanguageName(lang) {
        const names = {
            'ko': '한국어',
            'en': 'English',
            'zh': '简体中文',
            'hi': 'हिन्दी',
            'ru': 'Русский',
            'ja': '日本語',
            'es': 'Español',
            'pt': 'Português',
            'id': 'Bahasa Indonesia',
            'tr': 'Türkçe',
            'de': 'Deutsch',
            'fr': 'Français'
        };
        return names[lang] || lang;
    }
}

const i18n = new I18n();
window.i18n = i18n;
