export class AudioSystem {
    constructor() {
        this.context = null;
        this.fanBuffer = null;
        this.fanSource = null;
        this.processingBuffer = null;
        this.processingSource = null;
        this.clickBuffer = null;
    }

    async init() {
        if (this.context) return;
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        await Promise.all([
            this._loadSound('click.mp3', 'clickBuffer'),
            this._loadSound('processing.mp3', 'processingBuffer'),
            this._loadSound('/computer_fan.ogg', 'fanBuffer'),
            this._loadSound('/mixkit-typewriter-soft-click-1125.wav', 'typeBuffer')
        ]);
    }

    async _loadSound(url, target) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            this[target] = await this.context.decodeAudioData(arrayBuffer);
        } catch (e) { console.error(`Failed to load ${url}`, e); }
    }

    playClick() {
        if (!this.clickBuffer || !this.context) return;
        const source = this.context.createBufferSource();
        source.buffer = this.clickBuffer;
        const gain = this.context.createGain();
        gain.gain.value = 0.6;
        source.connect(gain).connect(this.context.destination);
        source.start(0);
    }

    playType() {
        if (!this.typeBuffer || !this.context) return;
        const source = this.context.createBufferSource();
        source.buffer = this.typeBuffer;
        const gain = this.context.createGain();
        gain.gain.value = 0.4;
        source.connect(gain).connect(this.context.destination);
        source.start(0);
    }

    startFan() {
        if (!this.fanBuffer || !this.context || this.fanSource) return;
        this.fanSource = this.context.createBufferSource();
        this.fanSource.buffer = this.fanBuffer;
        this.fanSource.loop = true;
        const gain = this.context.createGain();
        gain.gain.value = 0.3;
        this.fanSource.connect(gain).connect(this.context.destination);
        this.fanSource.start(0);
    }

    stopFan() {
        if (this.fanSource) {
            try { this.fanSource.stop(); } catch(e) {}
            this.fanSource = null;
        }
    }

    startProcessing() {
        if (!this.processingBuffer || !this.context) return;
        this.stopProcessing();
        this.processingSource = this.context.createBufferSource();
        this.processingSource.buffer = this.processingBuffer;
        this.processingSource.loop = true;
        const gain = this.context.createGain();
        gain.gain.value = 0.4;
        this.processingSource.connect(gain).connect(this.context.destination);
        this.processingSource.start(0);
    }

    stopProcessing() {
        if (this.processingSource) {
            try { this.processingSource.stop(); } catch(e) {}
            this.processingSource = null;
        }
    }

    async resume() {
        if (this.context && this.context.state === 'suspended') {
            await this.context.resume();
        }
    }
}

export const audio = new AudioSystem();