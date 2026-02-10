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
        this.generatePalette();
        this.setupEventListeners();

        const loader = document.getElementById('app-loader');
        if (loader) {
            loader.classList.add('hidden');
            setTimeout(() => loader.remove(), 300);
        }
    }

    setupEventListeners() {
        // Generate button and spacebar
        document.getElementById('generate-btn').addEventListener('click', () => this.generatePalette());
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                this.generatePalette();
            }
        });

        // Mode selector
        document.getElementById('mode-select').addEventListener('change', (e) => {
            this.colorMode = e.target.value;
            this.generatePalette();
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
            if (confirm(i18n.t('messages.confirmClear'))) {
                this.history = [];
                this.saveState();
                this.updateHistoryDisplay();
            }
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
                document.getElementById('lang-menu').classList.add('hidden');
                this.saveState();
            });
        });
    }

    generatePalette() {
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
        const saved = localStorage.getItem('colorPaletteState');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                this.currentPalette = state.palette || [];
                this.lockedColors = new Set(state.lockedColors || []);
                this.colorMode = state.colorMode || 'complementary';
                this.codeFormat = state.codeFormat || 'hex';
                this.history = state.history || [];
                if (state.language && state.language !== i18n.currentLang) {
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
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', async () => {
    app = new ColorPaletteGenerator();
});
