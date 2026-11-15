// Color Palette Generator App

class ColorPaletteGenerator {
    constructor() {
        this.currentPalette = [];
        this.lockedColors = new Set();
        this.colorMode = 'complementary';
        this.codeFormat = 'hex';
        this.history = [];
        this.maxHistory = 10;

        this.init();
    }

    async init() {
        try {
            await i18n.loadTranslations(i18n.currentLang);
            i18n.updateUI();
        } catch (e) {
            console.warn('i18n init failed:', e);
        }

        this.loadState();
        this.generatePalette(false);
        this.setupEventListeners();
        this.renderCuratedResources();
        initRelatedFunnels();

        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 300);
        }
    }

    setupEventListeners() {
        // Generate button and spacebar
        document.getElementById('generate-btn').addEventListener('click', () => this.generatePalette(true));
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                this.generatePalette(true);
            }
        });

        document.getElementById('saveCardBtn')?.addEventListener('click', () => this.generateStoryCard());
        document.getElementById('shareTwitterBtn')?.addEventListener('click', () => this.shareOnX());
        document.getElementById('shareUrlBtn')?.addEventListener('click', () => this.copyShareUrl());

        // Mode selector
        document.getElementById('mode-select').addEventListener('change', (e) => {
            this.colorMode = e.target.value;
            this.generatePalette(true);
        });

        // Code format buttons
        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.codeFormat = e.target.dataset.format;
                this.updateColorDisplay();
            });
        });

        // Export buttons
        document.getElementById('export-css-btn').addEventListener('click', () => this.exportCSS());
        document.getElementById('export-tailwind-btn').addEventListener('click', () => this.exportTailwind());
        document.getElementById('export-json-btn').addEventListener('click', () => this.exportJSON());

        // Modal
        document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('copy-export-btn').addEventListener('click', () => this.copyExportText());
        document.getElementById('export-modal').addEventListener('click', (e) => {
            if (e.target.id === 'export-modal') this.closeModal();
        });

        // History
        document.getElementById('clear-history-btn').addEventListener('click', () => {
            const btn = document.getElementById('clear-history-btn');
            if (!this.clearConfirmPending) {
                this.clearConfirmPending = true;
                this.showNotifyToast(this.tr('messages.confirmClear', 'Tap again to clear history'));
                if (btn) btn.dataset.confirm = 'pending';
                clearTimeout(this.clearConfirmTimer);
                this.clearConfirmTimer = setTimeout(() => {
                    this.clearConfirmPending = false;
                    if (btn) delete btn.dataset.confirm;
                }, 3500);
                return;
            }
            clearTimeout(this.clearConfirmTimer);
            this.clearConfirmPending = false;
            if (btn) delete btn.dataset.confirm;
            this.history = [];
            this.saveState();
            this.updateHistoryDisplay();
        });

        // Language selector
        document.getElementById('lang-toggle').addEventListener('click', () => {
            document.getElementById('lang-menu').classList.toggle('hidden');
        });

        document.querySelectorAll('.lang-option').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const lang = e.target.dataset.lang;
                await i18n.setLanguage(lang);
                this.updateLanguageDisplay();
                this.renderCuratedResources();
                initRelatedFunnels();
                document.getElementById('lang-menu').classList.add('hidden');
                this.saveState();
            });
        });
    }

    generatePalette(isUserAction = true) {
        if (isUserAction && typeof gtag !== 'undefined') {
            const lang = i18n.getCurrentLanguage() || 'ko';
            gtag('event', 'test_start', { app_name: 'color-palette', mode: this.colorMode, lang });
            gtag('event', 'test_complete', { app_name: 'color-palette', result_type: this.colorMode, lang });
            gtag('event', 'generate_palette');
        }
        // Generate base color
        const baseColor = this.randomColor();
        const palette = [baseColor];

        // Generate complementary colors based on mode
        switch (this.colorMode) {
            case 'complementary':
                palette.push(this.getComplementary(baseColor));
                palette.push(this.getLightVariant(baseColor));
                palette.push(this.getDarkVariant(baseColor));
                palette.push(this.getComplementary(this.getLightVariant(baseColor)));
                break;
            case 'analogous':
                palette.push(this.rotate(baseColor, 30));
                palette.push(this.rotate(baseColor, -30));
                palette.push(this.rotate(baseColor, 60));
                palette.push(this.rotate(baseColor, -60));
                break;
            case 'triadic':
                palette.push(this.rotate(baseColor, 120));
                palette.push(this.rotate(baseColor, 240));
                palette.push(this.getLightVariant(baseColor));
                palette.push(this.getDarkVariant(baseColor));
                break;
            case 'tetradic':
                palette.push(this.rotate(baseColor, 90));
                palette.push(this.rotate(baseColor, 180));
                palette.push(this.rotate(baseColor, 270));
                palette.push(this.getComplementary(baseColor));
                break;
            case 'monochromatic':
                palette.push(this.getLightVariant(baseColor, 0.3));
                palette.push(this.getLightVariant(baseColor, 0.6));
                palette.push(this.getDarkVariant(baseColor, 0.3));
                palette.push(this.getDarkVariant(baseColor, 0.6));
                break;
        }

        // Apply locked colors
        const newPalette = [];
        for (let i = 0; i < 5; i++) {
            if (this.lockedColors.has(i) && this.currentPalette[i]) {
                newPalette.push(this.currentPalette[i]);
            } else {
                newPalette.push(palette[Math.min(i, palette.length - 1)]);
            }
        }

        this.currentPalette = newPalette;
        this.updateColorDisplay();
        this.addToHistory();
        this.updatePaletteInfo();
        this.saveState();
    }

    randomColor() {
        const hue = Math.random() * 360;
        const saturation = 70 + Math.random() * 30;
        const lightness = 50 + Math.random() * 20;
        return { h: hue, s: saturation, l: lightness };
    }

    getComplementary(color) {
        const h = (color.h + 180) % 360;
        return { h, s: color.s, l: color.l };
    }

    rotate(color, degrees) {
        const h = (color.h + degrees + 360) % 360;
        return { h, s: color.s, l: color.l };
    }

    getLightVariant(color, amount = 0.15) {
        const l = Math.min(color.l + (100 - color.l) * amount, 95);
        return { h: color.h, s: color.s, l };
    }

    getDarkVariant(color, amount = 0.15) {
        const l = Math.max(color.l - color.l * amount, 10);
        return { h: color.h, s: color.s, l };
    }

    updateColorDisplay() {
        const slotsContainer = document.getElementById('color-slots');
        slotsContainer.innerHTML = '';

        this.currentPalette.forEach((color, index) => {
            const hexColor = this.hslToHex(color);
            const slot = document.createElement('div');
            slot.className = 'color-slot';
            if (this.lockedColors.has(index)) {
                slot.classList.add('locked');
            }

            const rgbColor = this.hslToRgb(color);
            const codeValue = this.formatColor(color, rgbColor, hexColor);

            slot.innerHTML = `
                <div class="color-display" style="background-color: ${hexColor};">
                    <div class="color-code">${codeValue}</div>
                    <div class="color-actions">
                        <button class="color-action-btn copy-btn" data-hex="${hexColor}">📋</button>
                        <button class="color-action-btn lock-btn" data-index="${index}">🔓</button>
                    </div>
                </div>
            `;

            // Copy color
            slot.querySelector('.copy-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const hex = e.target.dataset.hex;
                this.copyToClipboard(hex);
                this.showToast(i18n.t('messages.copied'));
            });

            // Lock/unlock color
            slot.querySelector('.lock-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(e.target.dataset.index);
                if (this.lockedColors.has(idx)) {
                    this.lockedColors.delete(idx);
                } else {
                    this.lockedColors.add(idx);
                }
                this.updateColorDisplay();
                this.saveState();
            });

            // Copy on slot click
            slot.addEventListener('click', () => {
                this.copyToClipboard(hexColor);
                this.showToast(i18n.t('messages.copied'));
            });

            slotsContainer.appendChild(slot);
        });

        // Update mode select
        document.getElementById('mode-select').value = this.colorMode;
    }

    formatColor(color, rgb, hex) {
        switch (this.codeFormat) {
            case 'hex':
                return hex;
            case 'rgb':
                return `rgb(${rgb.r},${rgb.g},${rgb.b})`;
            case 'hsl':
                return `hsl(${Math.round(color.h)},${Math.round(color.s)}%,${Math.round(color.l)}%)`;
            default:
                return hex;
        }
    }

    hslToRgb(color) {
        const h = color.h / 360;
        const s = color.s / 100;
        const l = color.l / 100;

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    hslToHex(color) {
        const rgb = this.hslToRgb(color);
        return `#${[rgb.r, rgb.g, rgb.b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('').toUpperCase()}`;
    }

    hexToHsl(hex) {
        let r = parseInt(hex.slice(1, 3), 16) / 255;
        let g = parseInt(hex.slice(3, 5), 16) / 255;
        let b = parseInt(hex.slice(5, 7), 16) / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        });
    }

    updatePaletteInfo() {
        // Calculate contrast (simple brightness-based)
        const avgBrightness = this.currentPalette.reduce((sum, c) => sum + c.l, 0) / this.currentPalette.length;
        const contrastLevel = avgBrightness < 30 ? i18n.t('info.veryDark') :
                             avgBrightness < 50 ? i18n.t('info.dark') :
                             avgBrightness < 70 ? i18n.t('info.balanced') :
                             i18n.t('info.light');

        document.getElementById('contrast-info').textContent = contrastLevel;

        // Temperature (warm/cool based on hue)
        const avgHue = this.currentPalette.reduce((sum, c) => sum + c.h, 0) / this.currentPalette.length;
        const temperature = avgHue < 60 || avgHue > 300 ? i18n.t('info.warm') : i18n.t('info.cool');
        document.getElementById('temperature-info').textContent = temperature;
    }

    addToHistory() {
        const palette = this.currentPalette.map(c => this.hslToHex(c));
        this.history.unshift(palette);
        if (this.history.length > this.maxHistory) {
            this.history.pop();
        }
        this.updateHistoryDisplay();
    }

    updateHistoryDisplay() {
        const historyGrid = document.getElementById('history-grid');

        if (this.history.length === 0) {
            historyGrid.innerHTML = `<div class="history-empty" data-i18n="messages.historyEmpty">${i18n.t('messages.historyEmpty')}</div>`;
            return;
        }

        historyGrid.innerHTML = this.history.map((palette, index) => `
            <div class="history-palette" data-index="${index}" title="Click to load">
                ${palette.map(hex => `<div class="history-color" style="background-color: ${hex};"></div>`).join('')}
            </div>
        `).join('');

        document.querySelectorAll('.history-palette').forEach(el => {
            el.addEventListener('click', () => {
                const index = parseInt(el.dataset.index);
                const palette = this.history[index];
                this.currentPalette = palette.map(hex => this.hexToHsl(hex));
                this.lockedColors.clear();
                this.updateColorDisplay();
                this.updatePaletteInfo();
            });
        });
    }

    exportCSS() {
        let css = ':root {\n';
        this.currentPalette.forEach((color, index) => {
            const hex = this.hslToHex(color);
            css += `  --color-${index + 1}: ${hex};\n`;
        });
        css += '}';
        this.showExportModal('CSS Variables', css);
    }

    exportTailwind() {
        let config = 'module.exports = {\n  theme: {\n    colors: {\n';
        this.currentPalette.forEach((color, index) => {
            const hex = this.hslToHex(color);
            config += `      'palette-${index + 1}': '${hex}',\n`;
        });
        config += '    }\n  }\n}';
        this.showExportModal('Tailwind Config', config);
    }

    exportJSON() {
        const data = {
            palette: this.currentPalette.map(color => ({
                hex: this.hslToHex(color),
                rgb: this.hslToRgb(color),
                hsl: {
                    h: Math.round(color.h),
                    s: Math.round(color.s),
                    l: Math.round(color.l)
                }
            })),
            mode: this.colorMode,
            timestamp: new Date().toISOString()
        };
        this.showExportModal('JSON Export', JSON.stringify(data, null, 2));
    }

    showExportModal(title, content) {
        const modal = document.getElementById('export-modal');
        document.getElementById('export-modal-title').textContent = title;
        document.getElementById('export-textarea').value = content;
        modal.classList.add('active');
    }

    closeModal() {
        document.getElementById('export-modal').classList.remove('active');
    }

    copyExportText() {
        const textarea = document.getElementById('export-textarea');
        textarea.select();
        this.copyToClipboard(textarea.value);
        this.showToast(i18n.t('messages.copied'));
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('active');
        setTimeout(() => toast.classList.remove('active'), 2000);
    }

    updateLanguageDisplay() {
        preserveLanguageLinks();
        // Update mode select options
        const modeSelect = document.getElementById('mode-select');
        const options = {
            'complementary': i18n.t('modes.complementary'),
            'analogous': i18n.t('modes.analogous'),
            'triadic': i18n.t('modes.triadic'),
            'tetradic': i18n.t('modes.tetradic'),
            'monochromatic': i18n.t('modes.monochromatic')
        };

        Array.from(modeSelect.options).forEach(option => {
            option.text = options[option.value] || option.value;
        });

        // Update history display
        if (this.history.length === 0) {
            document.getElementById('history-grid').innerHTML = `<div class="history-empty">${i18n.t('messages.historyEmpty')}</div>`;
        }

        // Update palette info
        this.updatePaletteInfo();

        // Update lang menu active state
        document.querySelectorAll('.lang-option').forEach(btn => {
            if (btn.dataset.lang === i18n.currentLang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    saveState() {
        const state = {
            palette: this.currentPalette,
            lockedColors: Array.from(this.lockedColors),
            colorMode: this.colorMode,
            codeFormat: this.codeFormat,
            history: this.history,
            language: i18n.currentLang
        };
        localStorage.setItem('colorPaletteState', JSON.stringify(state));
    }

    loadState() {
        let saved = null;
        try {
            saved = localStorage.getItem('colorPaletteState');
        } catch (e) {}
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.currentPalette = state.palette || [];
                this.lockedColors = new Set(state.lockedColors || []);
                this.colorMode = state.colorMode || 'complementary';
                this.codeFormat = state.codeFormat || 'hex';
                this.history = state.history || [];
                const hasUrlLang = new URLSearchParams(window.location.search).has('lang');
                if (!hasUrlLang && state.language && state.language !== i18n.currentLang) {
                    i18n.setLanguage(state.language);
                }
                if (this.currentPalette.length > 0) {
                    this.updateColorDisplay();
                    this.updatePaletteInfo();
                    this.updateHistoryDisplay();
                }
            } catch (e) {
                console.error('Failed to load state:', e);
            }
        }
    }

    tr(key, fallback) {
        const val = i18n.t(key);
        return val && val !== key ? val : fallback;
    }

    showNotifyToast(message) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('active');
        clearTimeout(this.__toastTimer);
        this.__toastTimer = setTimeout(() => toast.classList.remove('active'), 2200);
    }

    getShareUrl() {
        const lang = i18n.getCurrentLanguage() || 'en';
        return `${window.location.origin}/color-palette/?lang=${encodeURIComponent(lang)}&utm_source=share`;
    }

    shareOnX() {
        const shareUrl = this.getShareUrl();
        const text = this.tr('share.tweetText', 'Crafting accessible color harmonies with DopaBrain Color Palette Generator.');
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
        if (typeof gtag === 'function') {
            gtag('event', 'share', {
                method: 'twitter',
                app_name: 'color-palette',
                lang: i18n.getCurrentLanguage() || 'en'
            });
        }
    }

    async copyShareUrl() {
        const shareUrl = this.getShareUrl();
        const copied = this.tr('share.copied', 'Palette link copied!');
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try { await navigator.clipboard.writeText(shareUrl); } catch (e) {}
        } else {
            const ta = document.createElement('textarea');
            ta.value = shareUrl;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch (e) {}
            ta.remove();
        }
        this.showNotifyToast(copied);
        if (typeof gtag === 'function') {
            gtag('event', 'share', {
                method: 'clipboard',
                app_name: 'color-palette',
                lang: i18n.getCurrentLanguage() || 'en'
            });
        }
    }

    generateStoryCard() {
        const canvas = document.getElementById('shareCanvas');
        const saveBtn = document.getElementById('saveCardBtn');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const lang = i18n.getCurrentLanguage() || 'en';
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = this.tr('share.savingCard', 'Creating card...');
        }

        const w = 1080;
        const h = 1920;
        canvas.width = w;
        canvas.height = h;

        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(0.5, '#1e1b4b');
        grad.addColorStop(1, '#312e81');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#c7d2fe';
        ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
        ctx.fillText(this.tr('share.cardBadge', 'DOPABRAIN COLOR STUDIO'), 540, 170);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 64px system-ui, -apple-system, sans-serif';
        ctx.fillText(this.tr('share.cardTitle', 'Color Harmony Palette'), 540, 270);

        ctx.fillStyle = '#a5b4fc';
        ctx.font = '34px system-ui, -apple-system, sans-serif';
        ctx.fillText(this.tr('share.cardSubtitle', 'Balanced chromatic ratios & hex swatches'), 540, 330);

        const swatches = (this.currentPalette && this.currentPalette.length >= 5)
            ? this.currentPalette.slice(0, 5)
            : ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b'];

        swatches.forEach((hex, idx) => {
            const y = 440 + idx * 175;
            ctx.fillStyle = hex;
            ctx.beginPath();
            ctx.roundRect(120, y, 840, 145, 24);
            ctx.fill();

            ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
            ctx.beginPath();
            ctx.roundRect(150, y + 40, 230, 65, 16);
            ctx.fill();

            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 32px monospace';
            ctx.fillText(String(hex).toUpperCase(), 265, y + 83);
        });

        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(120, 1365, 840, 210, 28);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#a5b4fc';
        ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
        ctx.fillText(this.tr('share.cardModeLabel', 'HARMONY SCHEME'), 180, 1445);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px system-ui, -apple-system, sans-serif';
        const modeText = this.tr(`modes.${this.colorMode}`, this.colorMode);
        ctx.fillText(modeText, 180, 1515);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
        ctx.fillText(this.tr('share.cardCta', 'Generate free at dopabrain.com/color-palette'), 540, 1730);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '26px system-ui, -apple-system, sans-serif';
        ctx.fillText(`dopabrain.com/color-palette/?lang=${lang}`, 540, 1795);

        try {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'dopabrain-color-palette.png';
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {}

        this.showNotifyToast(this.tr('share.savedCard', 'Palette card saved!'));
        if (typeof gtag === 'function') {
            gtag('event', 'save_image', {
                app_name: 'color-palette',
                result_type: this.colorMode || 'complementary',
                lang
            });
        }

        if (saveBtn) {
            setTimeout(() => {
                saveBtn.disabled = false;
                saveBtn.textContent = this.tr('share.saveCard', 'Save Palette Card');
            }, 600);
        }
    }

    renderCuratedResources() {
        const container = document.getElementById('curated-resources-card');
        if (!container) return;
        const curated = i18n.t('curated');
        if (!curated || typeof curated !== 'object' || !Array.isArray(curated.books)) return;

        const lang = i18n.getCurrentLanguage() || 'en';
        container.textContent = '';

        const header = document.createElement('div');
        header.className = 'curated-resources-header';
        const titleEl = document.createElement('h3');
        titleEl.className = 'curated-resources-title';
        titleEl.textContent = curated.title || '';
        const subEl = document.createElement('p');
        subEl.className = 'curated-resources-subtitle';
        subEl.textContent = curated.subtitle || '';
        header.appendChild(titleEl);
        header.appendChild(subEl);

        const list = document.createElement('div');
        list.className = 'curated-resources-list';

        curated.books.forEach((book) => {
            const link = document.createElement('a');
            link.className = 'curated-book-link';
            link.href = book.url;
            link.target = '_blank';
            link.rel = 'sponsored noopener noreferrer';

            const meta = document.createElement('div');
            meta.className = 'curated-book-meta';

            const bTitle = document.createElement('span');
            bTitle.className = 'curated-book-title';
            bTitle.textContent = book.title || '';

            const bAuthor = document.createElement('span');
            bAuthor.className = 'curated-book-author';
            bAuthor.textContent = book.author || '';

            const bNote = document.createElement('span');
            bNote.className = 'curated-book-note';
            bNote.textContent = book.note || '';

            meta.appendChild(bTitle);
            meta.appendChild(bAuthor);
            meta.appendChild(bNote);

            const badge = document.createElement('span');
            badge.className = 'curated-book-badge';
            badge.textContent = curated.badge || 'Book';

            link.appendChild(meta);
            link.appendChild(badge);

            link.addEventListener('click', () => {
                if (typeof gtag === 'function') {
                    gtag('event', 'curated_resource_click', {
                        app_name: 'color-palette',
                        resource_type: 'book',
                        item_id: book.id || 'book',
                        lang
                    });
                }
            });

            list.appendChild(link);
        });

        const noteEl = document.createElement('p');
        noteEl.className = 'curated-affiliate-note';
        noteEl.textContent = curated.affiliateNote || '';

        container.appendChild(header);
        container.appendChild(list);
        container.appendChild(noteEl);
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', async () => {
    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeToggle.textContent = savedTheme === 'light' ? '🌙' : '☀️';
        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            themeToggle.textContent = next === 'light' ? '🌙' : '☀️';
        });
    }

    app = new ColorPaletteGenerator();
    initRelatedFunnels();
});

function preserveLanguageLinks() {
    initRelatedFunnels();
}

// Funnel bridge & language preservation
function initRelatedFunnels() {
    const urlParams = new URLSearchParams(window.location.search);
    const lang = (window.i18n && typeof window.i18n.getCurrentLanguage === 'function' ? window.i18n.getCurrentLanguage() : null) || urlParams.get('lang') || 'ko';
    const base = (window.location.origin && window.location.origin !== 'null') ? window.location.origin : 'https://dopabrain.com';
    document.querySelectorAll('.related-grid a, .related-card').forEach(link => {
        const baseHref = link.getAttribute('data-base-href') || link.getAttribute('href');
        if (!baseHref || baseHref.startsWith('http') || baseHref.startsWith('#')) return;
        try {
            const url = new URL(baseHref, base);
            url.searchParams.set('lang', lang);
            if (!url.searchParams.has('source')) url.searchParams.set('source', 'color_palette_result');
            link.setAttribute('href', url.pathname + url.search);
        } catch(e) {}
        if (!link.dataset.trackedCta) {
            link.dataset.trackedCta = 'true';
            link.addEventListener('click', () => {
                const liveLang = (window.i18n && typeof window.i18n.getCurrentLanguage === 'function' ? window.i18n.getCurrentLanguage() : null) || new URLSearchParams(window.location.search).get('lang') || 'ko';
                if (typeof gtag === 'function') {
                    gtag('event', 'content_cta_click', {
                        cta_surface: 'color_palette_related',
                        destination: link.getAttribute('href'),
                        source: 'color_palette',
                        lang: liveLang
                    });
                }
            });
        }
    });
}
