import { App, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface DesktopCapturerSource {
    id: string;
    name: string;
}

interface AudioSource {
    id: string;
    name: string;
}

interface STTSettings {
    endpointUrl: string;
    apiKey: string;
    useFormData: boolean;
    model: string;
    language: string;
    fileField: string;
    textField: string;
    chunkMs: number;
    silenceThreshold: number;
    maxBufferedChunks: number;
    maxConsecutiveWordRepeats: number;
    uiLanguage: 'en' | 'pt' | 'system';
}

type UILang = 'en' | 'pt';

const translations: Record<UILang, Record<string, string>> = {
    en: {
        ribbonStart: 'Start transcription',
        ribbonStop: 'Stop transcription',
        statusInactive: 'STT inactive',
        statusRecording: '[REC] Recording',
        statusRecordingWithSource: '[REC] Recording | Source: {source}',
        tooltipStart: 'Start transcription',
        tooltipStop: 'Stop transcription\n{statusLine}',
        startNotice: 'Starting transcription from: {source}',
        alreadyRunning: 'Transcription is already running.',
        noTracks: 'No audio track found in the selected source.',
        startError: 'Error accessing the audio source: {error}',
        stopNotice: 'Transcription stopped.',
        chunkError: 'Error transcribing chunk: {error}',
        sendChunkError: 'Configure the STT endpoint in the plugin settings.',
        modalTitle: 'Select Audio Source',
        modalSourceLabel: 'Audio source',
        modalStatusScanning: 'Scanning system...',
        modalHelp: 'Choose a window/screen or microphone to capture audio.',
        modalStartButton: 'Start Transcription',
        modalDesktopModuleError: 'Error: Could not load module for screen capture.',
        modalDesktopLog: 'Speech-to-Text: Populating audio sources...',
        modalDesktopError: 'Error fetching desktop sources.',
        modalDevicesError: 'Error fetching media devices.',
        modalNoSources: 'No audio sources found. Check permissions.',
        modalLoaded: 'Sources loaded',
        sourcePrefixWindow: 'Window',
        sourcePrefixScreen: 'Screen',
        settingsTitle: 'Speech to Text Settings (external API)',
        settingEndpointName: 'STT Endpoint (HTTP)',
        settingEndpointDesc: 'URL that will receive audio and return text.',
        settingApiKeyName: 'API Key (optional)',
        settingApiKeyDesc: 'Sent as Authorization: Bearer <key>.',
        settingModelName: 'Model (e.g.: whisper-large-v3)',
        settingModelDesc: 'Some APIs require the model field in multipart body.',
        settingLanguageName: 'Language (optional)',
        settingLanguageDesc: 'language field for the backend (e.g.: pt, en).',
        settingFormDataName: 'Send as multipart/form-data',
        settingFormDataDesc: 'If off, sends binary blob with Content-Type audio/wav.',
        settingFileFieldName: 'File field (form-data)',
        settingFileFieldDesc: 'Multipart field name that receives the audio.',
        settingTextFieldName: 'Text field in JSON response',
        settingTextFieldDesc: 'Field name with the transcription (fallback to "transcript").',
        settingChunkName: 'Chunk duration (ms)',
        settingChunkDesc: 'Cut length; smaller values send more requests.',
        settingSilenceName: 'Silence RMS threshold',
        settingSilenceDesc: 'Drops near-silent chunks; lower values let more noise pass. Default: 0.0015.',
        settingBufferName: 'Queued audio chunks',
        settingBufferDesc: 'Max chunks waiting to send before discarding excess (avoids lag). Default: 12.',
        settingRepeatsName: 'Allowed consecutive repeats',
        settingRepeatsDesc: 'How many times the same word may repeat before being filtered. Default: 2.',
        settingUiLanguageName: 'Plugin language',
        settingUiLanguageDesc: 'UI language. System follows Obsidian language when supported.',
        settingUiOptionSystem: 'System',
        settingUiOptionEn: 'English (en-US)',
        settingUiOptionPt: 'Portuguese (pt-BR)',
    },
    pt: {
        ribbonStart: 'Iniciar transcri\u00e7\u00e3o',
        ribbonStop: 'Parar transcri\u00e7\u00e3o',
        statusInactive: 'STT inativo',
        statusRecording: '[REC] Gravando',
        statusRecordingWithSource: '[REC] Gravando | Fonte: {source}',
        tooltipStart: 'Iniciar transcri\u00e7\u00e3o',
        tooltipStop: 'Parar transcri\u00e7\u00e3o\n{statusLine}',
        startNotice: 'Iniciando transcri\u00e7\u00e3o da fonte: {source}',
        alreadyRunning: 'A transcri\u00e7\u00e3o j\u00e1 est\u00e1 em andamento.',
        noTracks: 'Nenhuma trilha de \u00e1udio encontrada na fonte selecionada.',
        startError: 'Erro ao acessar a fonte de \u00e1udio: {error}',
        stopNotice: 'Transcri\u00e7\u00e3o interrompida.',
        chunkError: 'Erro ao transcrever chunk: {error}',
        sendChunkError: 'Configure o endpoint STT nas configura\u00e7\u00f5es do plugin.',
        modalTitle: 'Selecione a Fonte de \u00c1udio',
        modalSourceLabel: 'Fonte de \u00e1udio',
        modalStatusScanning: 'Varredura do sistema...',
        modalHelp: 'Escolha uma janela/tela ou microfone para capturar o \u00e1udio.',
        modalStartButton: 'Iniciar Transcri\u00e7\u00e3o',
        modalDesktopModuleError: 'Erro: N\u00e3o foi poss\u00edvel carregar o m\u00f3dulo para captura de tela.',
        modalDesktopLog: 'Speech-to-Text: Populando fontes de \u00e1udio...',
        modalDesktopError: 'Erro ao buscar fontes do desktop.',
        modalDevicesError: 'Erro ao buscar dispositivos de m\u00eddia.',
        modalNoSources: 'Nenhuma fonte de \u00e1udio encontrada. Verifique permiss\u00f5es.',
        modalLoaded: 'Fontes carregadas',
        sourcePrefixWindow: 'Janela',
        sourcePrefixScreen: 'Tela',
        settingsTitle: 'Configura\u00e7\u00f5es do Speech to Text (API externa)',
        settingEndpointName: 'Endpoint STT (HTTP)',
        settingEndpointDesc: 'URL que receber\u00e1 o \u00e1udio e retornar\u00e1 o texto.',
        settingApiKeyName: 'API Key (opcional)',
        settingApiKeyDesc: 'Enviada como Authorization: Bearer <chave>.',
        settingModelName: 'Modelo (ex.: whisper-large-v3)',
        settingModelDesc: 'Algumas APIs exigem o campo model no corpo multipart.',
        settingLanguageName: 'Idioma (opcional)',
        settingLanguageDesc: 'Campo language para o backend (ex.: pt, en).',
        settingFormDataName: 'Enviar como multipart/form-data',
        settingFormDataDesc: 'Se desativado, envia o blob bin\u00e1rio com Content-Type audio/wav.',
        settingFileFieldName: 'Campo do arquivo (form-data)',
        settingFileFieldDesc: 'Nome do campo multipart que receber\u00e1 o \u00e1udio.',
        settingTextFieldName: 'Campo do texto na resposta JSON',
        settingTextFieldDesc: 'Nome do campo com a transcri\u00e7\u00e3o (fallback para \"transcript\").',
        settingChunkName: 'Dura\u00e7\u00e3o do chunk (ms)',
        settingChunkDesc: 'Tempo de corte; valores menores enviam mais requisi\u00e7\u00f5es.',
        settingSilenceName: 'Limite RMS de sil\u00eancio',
        settingSilenceDesc: 'Descarta chunks quase silenciosos; valores menores deixam passar mais ru\u00eddo. Padr\u00e3o: 0.0015.',
        settingBufferName: 'Buffers de \u00e1udio em fila',
        settingBufferDesc: 'Limite de chunks aguardando envio antes de descartar o excesso (evita travar). Padr\u00e3o: 12.',
        settingRepeatsName: 'Repeti\u00e7\u00f5es consecutivas permitidas',
        settingRepeatsDesc: 'Quantas vezes a mesma palavra pode se repetir em sequ\u00eancia antes de ser filtrada. Padr\u00e3o: 2.',
        settingUiLanguageName: 'Idioma do plugin',
        settingUiLanguageDesc: 'Idioma da interface. Sistema segue o idioma do Obsidian quando suportado.',
        settingUiOptionSystem: 'Sistema',
        settingUiOptionEn: 'Ingl\u00eas (en-US)',
        settingUiOptionPt: 'Portugu\u00eas (pt-BR)',
    },
};

export default class SpeechToTextPlugin extends Plugin {
    isTranscribing = false;
    currentStream: MediaStream | null = null;
    audioContext: AudioContext | null = null;
    audioProcessor: ScriptProcessorNode | null = null;
    audioSource: MediaStreamAudioSourceNode | null = null;
    ribbonIconEl: HTMLElement | null = null;
    statusBarItem: HTMLElement | null = null;
    activeSourceName: string | null = null;
    sampleBuffers: Float32Array[] = [];
    samplesCollected = 0;
    targetSampleRate = 16000;
    maxBufferedChunks = 12;
    maxConsecutiveWordRepeats = 2;
    currentLang: UILang = 'en';
    lastTranscriptTail = '';
    // Small noise gate to avoid sending pure silence to the STT backend
    silenceRmsThreshold = 0.0015;
    pendingControllers: AbortController[] = [];
    settings!: STTSettings;

    async onload() {
        this.settings = await this.loadSettings();
        this.applyTuningSettings();
        this.addSettingTab(new STTSettingTab(this.app, this));
        this.injectStyles();
        this.statusBarItem = this.addStatusBarItem();
        this.updateStatusBar(this.t('statusInactive'));

        this.ribbonIconEl = this.addRibbonIcon('mic', this.t('ribbonStart'), () => {
            if (this.isTranscribing) {
                this.stopTranscription();
                return;
            }
            new AudioSourceSelectorModal(this.app, this, (source) => {
                this.startTranscription(source);
            }).open();
        });
        this.ribbonIconEl?.addClass('stt-ribbon-icon');
        this.setRibbonTooltip(this.t('tooltipStart'));

        this.addCommand({
            id: 'start-transcription',
            name: this.t('ribbonStart'),
            callback: () => {
                if (this.isTranscribing) {
                    new Notice(this.t('alreadyRunning'));
                    return;
                }
                new AudioSourceSelectorModal(this.app, this, (source) => {
                    this.startTranscription(source);
                }).open();
            },
        });
        this.applyLanguage();
    }

    async startTranscription(source: AudioSource) {
        if (this.isTranscribing) return;

        new Notice(this.t('startNotice', { source: source.name }));
        this.isTranscribing = true;
        this.lastTranscriptTail = '';

        try {
            let stream: MediaStream;

            if (source.id.startsWith('window:') || source.id.startsWith('screen:')) {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: source.id,
                        },
                    } as any,
                    video: {
                        mandatory: {
                            chromeMediaSource: 'desktop',
                            chromeMediaSourceId: source.id,
                        },
                    } as any,
                });
            } else {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: { deviceId: { exact: source.id } },
                    video: false,
                });
            }

            const audioTracks = stream.getAudioTracks();
            if (!audioTracks || audioTracks.length === 0) {
                throw new Error(this.t('noTracks'));
            }

            this.currentStream = stream;
            this.activeSourceName = source.name;
            this.markRecording(true);
            await this.startPCMRecorder(stream);
        } catch (error: any) {
            console.error('Speech-to-Text: Failed to start transcription:', error);
            new Notice(this.t('startError', { error: error?.message || String(error) }));
            this.stopTranscription();
        }
    }

    stopTranscription() {
        if (!this.isTranscribing) return;

        if (this.audioProcessor) {
            this.audioProcessor.disconnect();
            this.audioProcessor.onaudioprocess = null;
            this.audioProcessor = null;
        }
        if (this.audioSource) {
            this.audioSource.disconnect();
            this.audioSource = null;
        }
        if (this.audioContext) {
            this.audioContext.close().catch(() => null);
            this.audioContext = null;
        }
        if (this.currentStream) {
            this.currentStream.getTracks().forEach((track) => track.stop());
            this.currentStream = null;
        }
        this.activeSourceName = null;
        this.markRecording(false);

        this.sampleBuffers = [];
        this.samplesCollected = 0;
        this.lastTranscriptTail = '';

        this.pendingControllers.forEach((controller) => controller.abort());
        this.pendingControllers = [];

        this.isTranscribing = false;
        new Notice('Transcrição interrompida.');
    }

    private async startPCMRecorder(stream: MediaStream) {
        if (this.audioContext) {
            this.stopTranscription();
        }

        const audioContext = new AudioContext({ sampleRate: this.targetSampleRate });
        this.targetSampleRate = audioContext.sampleRate;
        this.audioContext = audioContext;

        const sourceNode = audioContext.createMediaStreamSource(stream);
        this.audioSource = sourceNode;

        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        this.audioProcessor = processor;

        let baseOffset: number | null = null;
        const editorGetter = () => this.app.workspace.activeEditor?.editor;
        const samplesPerChunk = Math.max(1, Math.round((this.targetSampleRate * this.settings.chunkMs) / 1000));

        processor.onaudioprocess = async (event: AudioProcessingEvent) => {
            const channelData = event.inputBuffer.getChannelData(0);
            // clone data because the buffer is reused
            const clone = new Float32Array(channelData.length);
            clone.set(channelData);

            this.sampleBuffers.push(clone);
            this.samplesCollected += clone.length;
            this.trimBacklog(samplesPerChunk);

            while (this.samplesCollected >= samplesPerChunk) {
                const chunkSamples = this.takeSamples(samplesPerChunk);
                if (this.isMostlySilence(chunkSamples)) {
                    continue;
                }
                const wavBlob = this.encodeWav(chunkSamples, this.targetSampleRate);

                try {
                    const transcript = await this.sendChunk(wavBlob, 'audio/wav');
                    const editor = editorGetter();
                    if (!transcript || !editor) continue;

                    let insertText = this.cleanTranscript(transcript, this.lastTranscriptTail);
                    if (!insertText) continue;

                    if (baseOffset === null) {
                        baseOffset = editor.posToOffset(editor.getCursor());
                    }

                    if (baseOffset > 0 && insertText && !/^\s/.test(insertText)) {
                        const prevChar = editor.getRange(
                            editor.offsetToPos(baseOffset - 1),
                            editor.offsetToPos(baseOffset)
                        );
                        if (prevChar && !/\s/.test(prevChar)) {
                            insertText = ' ' + insertText;
                        }
                    }

                    const insertPos = editor.offsetToPos(baseOffset);
                    // Insert text at current base offset; avoid invalid ranges
                    editor.replaceRange(insertText, insertPos);
                    baseOffset += insertText.length;
                    this.lastTranscriptTail = this.updateTail(this.lastTranscriptTail, insertText);
                    editor.setCursor(editor.offsetToPos(baseOffset));
                } catch (sendError: any) {
                    console.error('Speech-to-Text: Erro ao enviar chunk PCM para STT:', sendError);
                    new Notice(this.t('chunkError', { error: sendError?.message || String(sendError) }));
                    this.stopTranscription();
                }
            }
        };

        sourceNode.connect(processor);
        processor.connect(audioContext.destination);
        console.log('Speech-to-Text: Captura PCM iniciada com SampleRate', this.targetSampleRate);
    }

    private takeSamples(count: number): Float32Array {
        const out = new Float32Array(count);
        let offset = 0;

        while (offset < count && this.sampleBuffers.length > 0) {
            const buffer = this.sampleBuffers[0];
            const needed = count - offset;

            if (buffer.length <= needed) {
                out.set(buffer, offset);
                offset += buffer.length;
                this.sampleBuffers.shift();
            } else {
                out.set(buffer.subarray(0, needed), offset);
                this.sampleBuffers[0] = buffer.subarray(needed);
                offset += needed;
            }
        }

        this.samplesCollected -= count;
        return out;
    }

    private trimBacklog(samplesPerChunk: number) {
        const maxSamples = samplesPerChunk * this.maxBufferedChunks;
        if (this.samplesCollected <= maxSamples) return;

        const overflow = this.samplesCollected - maxSamples;
        this.discardSamples(overflow);
        console.warn('Speech-to-Text: Buffer overflow, discarding old samples to keep performance:', overflow);
    }

    private discardSamples(count: number) {
        let remaining = count;
        while (remaining > 0 && this.sampleBuffers.length > 0) {
            const buffer = this.sampleBuffers[0];
            if (buffer.length <= remaining) {
                remaining -= buffer.length;
                this.sampleBuffers.shift();
            } else {
                this.sampleBuffers[0] = buffer.subarray(remaining);
                remaining = 0;
            }
        }
        this.samplesCollected = Math.max(0, this.samplesCollected - count);
    }

    private isMostlySilence(samples: Float32Array): boolean {
        if (samples.length === 0) return true;

        let sumSquares = 0;
        let peak = 0;
        for (let i = 0; i < samples.length; i++) {
            const value = samples[i];
            const abs = Math.abs(value);
            peak = Math.max(peak, abs);
            sumSquares += value * value;
        }

        const rms = Math.sqrt(sumSquares / samples.length);
        return rms < this.silenceRmsThreshold && peak < this.silenceRmsThreshold * 4;
    }

    private cleanTranscript(incoming: string, previousTail: string): string {
        if (!incoming) return incoming;

        const normalizedIncoming = incoming.trimStart();
        if (!previousTail) {
            return this.dedupeConsecutiveWords(normalizedIncoming);
        }

        const prevWords = previousTail.trim().split(/\s+/);
        const nextWords = normalizedIncoming.split(/\s+/);
        const maxOverlap = Math.min(6, prevWords.length, nextWords.length);

        for (let overlap = maxOverlap; overlap > 0; overlap--) {
            const tailPhrase = prevWords.slice(-overlap).join(' ').toLowerCase();
            const headPhrase = nextWords.slice(0, overlap).join(' ').toLowerCase();
            if (tailPhrase === headPhrase) {
                const remainder = nextWords.slice(overlap).join(' ');
                return this.dedupeConsecutiveWords(remainder);
            }
        }

        return this.dedupeConsecutiveWords(normalizedIncoming);
    }

    private updateTail(previousTail: string, appended: string): string {
        const combined = previousTail + appended;
        return combined.slice(-200);
    }

    applyTuningSettings() {
        this.silenceRmsThreshold = Number.isFinite(this.settings.silenceThreshold)
            ? Math.max(0, this.settings.silenceThreshold)
            : 0.0015;
        this.maxBufferedChunks =
            Number.isFinite(this.settings.maxBufferedChunks) && this.settings.maxBufferedChunks > 0
                ? Math.round(this.settings.maxBufferedChunks)
                : 12;
        this.maxConsecutiveWordRepeats =
            Number.isFinite(this.settings.maxConsecutiveWordRepeats) && this.settings.maxConsecutiveWordRepeats >= 1
                ? Math.round(this.settings.maxConsecutiveWordRepeats)
                : 2;
    }

    private resolveLanguage(): UILang {
        if (this.settings.uiLanguage === 'system') {
            const obsLang =
                (this.app.vault as any).getConfig?.('language') ??
                (this.app.vault as any).getConfig?.('lang') ??
                (this.app as any).app?.loadLocalStorage?.('language');
            if (typeof obsLang === 'string' && obsLang.toLowerCase().startsWith('pt')) {
                return 'pt';
            }
            return 'en';
        }
        return this.settings.uiLanguage === 'pt' ? 'pt' : 'en';
    }

    applyLanguage() {
        this.currentLang = this.resolveLanguage();
        if (this.isTranscribing) {
            this.markRecording(true);
        } else {
            this.setRibbonTooltip(this.t('tooltipStart'));
            this.updateStatusBar(this.t('statusInactive'));
        }
    }

    t(key: string, vars: Record<string, string | number> = {}): string {
        const dict = translations[this.currentLang] || translations.en;
        const fallback = translations.en;
        const template = dict[key] ?? fallback[key] ?? key;
        return template.replace(/\{(\w+)\}/g, (match, k) =>
            vars[k] !== undefined ? String(vars[k]) : match
        );
    }

    private dedupeConsecutiveWords(text: string): string {
        if (!text) return text;

        const tokens = text.split(/(\s+)/);
        const output: string[] = [];
        let lastWord = '';
        let repeatCount = 0;

        const normalize = (token: string) => token.toLowerCase().replace(/[^a-z0-9\u00c0-\u017f]+/gi, '');

        for (const token of tokens) {
            if (/^\s+$/.test(token)) {
                output.push(token);
                continue;
            }

            const normalized = normalize(token);
            if (normalized && normalized === lastWord) {
                repeatCount += 1;
                if (repeatCount >= this.maxConsecutiveWordRepeats) {
                    continue;
                }
            } else {
                lastWord = normalized;
                repeatCount = 0;
            }

            output.push(token);
        }

        return output.join('').replace(/\s+/g, ' ').trim();
    }

    private encodeWav(samples: Float32Array, sampleRate: number): Blob {
        // 16-bit PCM WAV
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);

        const writeString = (offset: number, str: string) => {
            for (let i = 0; i < str.length; i++) {
                view.setUint8(offset + i, str.charCodeAt(i));
            }
        };

        const pcm = new Int16Array(samples.length);
        for (let i = 0; i < samples.length; i++) {
            const s = Math.max(-1, Math.min(1, samples[i]));
            pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + pcm.length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true); // PCM chunk size
        view.setUint16(20, 1, true); // audio format PCM
        view.setUint16(22, 1, true); // channels
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true); // byte rate (16-bit mono)
        view.setUint16(32, 2, true); // block align
        view.setUint16(34, 16, true); // bits per sample
        writeString(36, 'data');
        view.setUint32(40, pcm.length * 2, true);

        for (let i = 0; i < pcm.length; i++) {
            view.setInt16(44 + i * 2, pcm[i], true);
        }

        return new Blob([buffer], { type: 'audio/wav' });
    }

    private async sendChunk(blob: Blob, mimeTypeUsed: string): Promise<string | null> {
        if (!this.settings.endpointUrl) {
            throw new Error('Configure o endpoint STT nas configurações do plugin.');
        }

        const controller = new AbortController();
        this.pendingControllers.push(controller);
        const headers: Record<string, string> = {};

        if (!this.settings.useFormData) {
            headers['Content-Type'] = mimeTypeUsed;
        }
        if (this.settings.apiKey) {
            headers['Authorization'] = `Bearer ${this.settings.apiKey}`;
        }

        const body = this.settings.useFormData
            ? (() => {
                  const form = new FormData();
                  form.append(this.settings.fileField || 'file', blob, 'audio.wav');
                  if (this.settings.model) {
                      form.append('model', this.settings.model);
                  }
                  if (this.settings.language) {
                      form.append('language', this.settings.language);
                  }
                  return form;
              })()
            : blob;

        const response = await fetch(this.settings.endpointUrl, {
            method: 'POST',
            headers,
            body,
            signal: controller.signal,
        });

        this.pendingControllers = this.pendingControllers.filter((c) => c !== controller);

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status}: ${text}`);
        }

        const contentType = response.headers.get('Content-Type') || '';
        if (contentType.includes('application/json')) {
            const json = await response.json();
            const field = this.settings.textField || 'text';
            const result = (json as any)[field] ?? (json as any).transcript ?? '';
            return typeof result === 'string' ? result : JSON.stringify(result);
        }

        return await response.text();
    }

    async loadSettings(): Promise<STTSettings> {
        const defaultSettings: STTSettings = {
            endpointUrl: '',
            apiKey: '',
            useFormData: true,
            model: '',
            language: '',
            fileField: 'file',
            textField: 'text',
            chunkMs: 4000,
            silenceThreshold: 0.0015,
            maxBufferedChunks: 12,
            maxConsecutiveWordRepeats: 2,
            uiLanguage: 'en',
        };
        const loaded = await this.loadData();
        return Object.assign({}, defaultSettings, loaded);
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    onunload() {
        this.stopTranscription();
        const style = document.getElementById('stt-plugin-styles');
        if (style) style.remove();
    }

    private markRecording(active: boolean) {
        if (active) {
            this.ribbonIconEl?.addClass('stt-recording');
            const status = this.activeSourceName
                ? this.t('statusRecordingWithSource', { source: this.activeSourceName })
                : this.t('statusRecording');
            const tooltip = this.t('tooltipStop', { statusLine: status });
            this.setRibbonTooltip(tooltip);
            this.updateStatusBar(status);
        } else {
            this.ribbonIconEl?.removeClass('stt-recording');
            this.setRibbonTooltip(this.t('tooltipStart'));
            this.updateStatusBar(this.t('statusInactive'));
        }
    }

    private setRibbonTooltip(text: string) {
        if (!this.ribbonIconEl) return;
        this.ribbonIconEl.setAttribute('aria-label', text);
        this.ribbonIconEl.setAttribute('data-tooltip', text);
    }

    private updateStatusBar(text: string) {
        if (this.statusBarItem) {
            this.statusBarItem.setText(text);
        }
    }

    private injectStyles() {
        const style = document.createElement('style');
        style.id = 'stt-plugin-styles';
        style.textContent = `
        .stt-ribbon-icon.stt-recording {
            color: var(--text-accent);
            background: var(--background-modifier-success);
            border-radius: 6px;
        }
        .tooltip {
            text-align: left;
            white-space: pre-wrap;
            word-wrap: break-word;
            max-width: 320px;
        }
        .stt-source-modal .source-row {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 16px;
        }
        .stt-source-modal {
            padding: 12px 16px 16px 16px;
        }
        .stt-source-modal h2 {
            margin-top: 4px;
            margin-bottom: 10px;
            font-size: 20px;
            font-weight: 700;
            color: var(--text-normal);
        }
        .stt-divider {
            border-top: 1px solid var(--background-modifier-border);
            margin: 6px 0 14px 0;
        }
        .stt-field {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .stt-label-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 12px;
        }
        .stt-label {
            font-weight: 600;
            font-size: 16px;
            color: var(--text-normal);
        }
        .stt-status {
            color: var(--text-faint);
            font-size: 12px;
        }
        .stt-help {
            color: var(--text-muted);
            font-size: 13px;
        }
        .stt-actions {
            margin-top: 14px;
            display: flex;
            justify-content: flex-start;
        }
        .stt-source-modal .status {
            color: var(--text-faint);
            font-size: 12px;
        }
        .stt-source-modal select {
            width: 100%;
            max-width: 260px;
        }
        `;
        document.head.appendChild(style);
    }
}

class AudioSourceSelectorModal extends Modal {
    onSubmit: (source: AudioSource) => void;
    isLoading = true;
    selectEl: HTMLSelectElement | null = null;
    startButton: HTMLButtonElement | null = null;
    statusText: HTMLElement | null = null;
    sources: AudioSource[] = [];
    plugin: SpeechToTextPlugin;

    constructor(app: App, plugin: SpeechToTextPlugin, onSubmit: (source: AudioSource) => void) {
        super(app);
        this.onSubmit = onSubmit;
        this.plugin = plugin;
    }

    async onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('stt-source-modal');
        contentEl.createEl('h2', { text: this.plugin.t('modalTitle') });
        contentEl.createDiv({ cls: 'stt-divider' });

        const field = contentEl.createDiv({ cls: 'stt-field' });
        const labelRow = field.createDiv({ cls: 'stt-label-row' });
        labelRow.createEl('div', { text: this.plugin.t('modalSourceLabel'), cls: 'stt-label' });
        this.statusText = labelRow.createEl('div', { cls: 'stt-status', text: this.plugin.t('modalStatusScanning') });

        field.createEl('div', {
            text: this.plugin.t('modalHelp'),
            cls: 'stt-help',
        });

        this.selectEl = field.createEl('select', { cls: 'dropdown' });

        const actions = contentEl.createDiv({ cls: 'stt-actions' });
        this.startButton = actions.createEl('button', { text: this.plugin.t('modalStartButton'), cls: 'mod-cta' });

        this.selectEl.disabled = true;
        this.startButton.disabled = true;

        this.startButton.onclick = () => {
            const selectedSourceId = this.selectEl?.value;
            const selectedSource = this.sources.find((s) => s.id === selectedSourceId);
            if (selectedSource) {
                this.onSubmit(selectedSource);
                this.close();
            }
        };

        await this.populateSources();
    }

    private async populateSources() {
        console.log('Speech-to-Text: Populando fontes de áudio...');

        const electron = window.require('electron');
        const remote = (electron as any).remote;
        if (!remote || !remote.desktopCapturer) {
            console.error('Speech-to-Text: Módulo desktopCapturer do Electron não encontrado.');
            this.statusText?.setText('Erro: Não foi possível carregar o módulo para captura de tela.');
            return;
        }

        const { desktopCapturer } = remote;
        const audioSources: AudioSource[] = [];

        try {
            const sources: DesktopCapturerSource[] = await desktopCapturer.getSources({ types: ['window', 'screen'] });
            const audioKeywords = [
                'chrome',
                'edge',
                'firefox',
                'brave',
                'opera',
                'spotify',
                'music',
                'player',
                'vlc',
                'teams',
                'zoom',
                'meet',
                'webex',
                'skype',
                'discord',
                'youtube',
                'netflix',
                'prime video',
                'hbo',
                'disney',
                'call',
                'meeting',
                'conference',
                'stream',
            ];
            const looksAudioCapable = (name: string) => {
                const lowered = name.toLowerCase();
                return audioKeywords.some((kw) => lowered.includes(kw));
            };

            const filteredSources = sources.filter((source) => {
                if (!source.name || source.name.includes('Obsidian')) return false;
                if (source.id.startsWith('screen:')) return true; // system audio is available
                return looksAudioCapable(source.name);
            });

            filteredSources.forEach((source) => {
                const labelPrefix = source.id.startsWith('screen:') ? this.plugin.t('sourcePrefixScreen') : this.plugin.t('sourcePrefixWindow');
                audioSources.push({ id: source.id, name: `${labelPrefix}: ${source.name}` });
            });

            console.log(
                'Speech-to-Text: Fontes de tela/janela filtradas',
                filteredSources.length,
                'de',
                sources.length
            );
        } catch (error) {
            console.error(this.plugin.t('modalDesktopError'), error);
            this.statusText?.setText(this.plugin.t('modalDesktopError'));
            this.statusText?.setText(this.plugin.t('modalDesktopError'));
            this.statusText?.setText(this.plugin.t('modalDesktopError'));
        }

        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const audioInputs = devices.filter((device) => device.kind === 'audioinput');
            audioInputs.forEach((device, index) => {
                audioSources.push({ id: device.deviceId, name: device.label || `Microfone ${index + 1}` });
            });
        } catch (error) {
            console.error('Speech-to-Text: Erro ao buscar dispositivos de mídia:', error);
        }

        this.sources = audioSources;
        if (audioSources.length === 0) {
            this.statusText?.setText('Nenhuma fonte de áudio encontrada. Verifique permissões.');
            return;
        }

        if (this.selectEl) {
            this.selectEl.empty();
            audioSources.forEach((source) => {
                this.selectEl?.createEl('option', { text: source.name, value: source.id });
            });
            this.selectEl.disabled = false;
        }
        if (this.startButton) {
            this.startButton.disabled = false;
        }
        this.statusText?.setText(this.plugin.t('modalLoaded'));
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class STTSettingTab extends PluginSettingTab {
    plugin: SpeechToTextPlugin;

    constructor(app: App, plugin: SpeechToTextPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        const t = this.plugin.t.bind(this.plugin);
        containerEl.createEl('h2', { text: t('settingsTitle') });

        new Setting(containerEl)
            .setName(t('settingUiLanguageName'))
            .setDesc(t('settingUiLanguageDesc'))
            .addDropdown((dropdown) =>
                dropdown
                    .addOption('system', t('settingUiOptionSystem'))
                    .addOption('en', t('settingUiOptionEn'))
                    .addOption('pt', t('settingUiOptionPt'))
                    .setValue(this.plugin.settings.uiLanguage)
                    .onChange(async (value) => {
                        this.plugin.settings.uiLanguage =
                            value === 'pt' || value === 'system' ? value : 'en';
                        await this.plugin.saveSettings();
                        this.plugin.applyLanguage();
                    })
            );

        new Setting(containerEl)
            .setName(t('settingEndpointName'))
            .setDesc(t('settingEndpointDesc'))
            .addText((text) =>
                text
                    .setPlaceholder('https://my-api.stt/transcribe')
                    .setValue(this.plugin.settings.endpointUrl)
                    .onChange(async (value) => {
                        this.plugin.settings.endpointUrl = value.trim();
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName(t('settingApiKeyName'))
            .setDesc(t('settingApiKeyDesc'))
            .addText((text) =>
                text
                    .setPlaceholder('api-key')
                    .setValue(this.plugin.settings.apiKey)
                    .onChange(async (value) => {
                        this.plugin.settings.apiKey = value.trim();
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName(t('settingModelName'))
            .setDesc(t('settingModelDesc'))
            .addText((text) =>
                text
                    .setPlaceholder('whisper-large-v3')
                    .setValue(this.plugin.settings.model)
                    .onChange(async (value) => {
                        this.plugin.settings.model = value.trim();
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName(t('settingLanguageName'))
            .setDesc(t('settingLanguageDesc'))
            .addText((text) =>
                text
                    .setPlaceholder('pt')
                    .setValue(this.plugin.settings.language)
                    .onChange(async (value) => {
                        this.plugin.settings.language = value.trim();
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName(t('settingFormDataName'))
            .setDesc(t('settingFormDataDesc'))
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.useFormData).onChange(async (value) => {
                    this.plugin.settings.useFormData = value;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName(t('settingFileFieldName'))
            .setDesc(t('settingFileFieldDesc'))
            .addText((text) =>
                text
                    .setPlaceholder('file')
                    .setValue(this.plugin.settings.fileField)
                    .onChange(async (value) => {
                        this.plugin.settings.fileField = value || 'file';
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName(t('settingTextFieldName'))
            .setDesc(t('settingTextFieldDesc'))
            .addText((text) =>
                text
                    .setPlaceholder('text')
                    .setValue(this.plugin.settings.textField)
                    .onChange(async (value) => {
                        this.plugin.settings.textField = value || 'text';
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName(t('settingChunkName'))
            .setDesc(t('settingChunkDesc'))
            .addText((text) =>
                text
                    .setPlaceholder('4000')
                    .setValue(String(this.plugin.settings.chunkMs))
                    .onChange(async (value) => {
                        const num = Number(value);
                        this.plugin.settings.chunkMs = Number.isFinite(num) && num > 500 ? num : 4000;
                        await this.plugin.saveSettings();
                        this.plugin.applyTuningSettings();
                    })
            );

        new Setting(containerEl)
            .setName(t('settingSilenceName'))
            .setDesc(t('settingSilenceDesc'))
            .addText((text) =>
                text
                    .setPlaceholder('0.0015')
                    .setValue(String(this.plugin.settings.silenceThreshold))
                    .onChange(async (value) => {
                        const num = Number(value);
                        this.plugin.settings.silenceThreshold = Number.isFinite(num) && num >= 0 ? num : 0.0015;
                        await this.plugin.saveSettings();
                        this.plugin.applyTuningSettings();
                    })
            );

        new Setting(containerEl)
            .setName(t('settingBufferName'))
            .setDesc(t('settingBufferDesc'))
            .addText((text) =>
                text
                    .setPlaceholder('12')
                    .setValue(String(this.plugin.settings.maxBufferedChunks))
                    .onChange(async (value) => {
                        const num = Number(value);
                        this.plugin.settings.maxBufferedChunks =
                            Number.isFinite(num) && num > 0 ? Math.round(num) : 12;
                        await this.plugin.saveSettings();
                        this.plugin.applyTuningSettings();
                    })
            );

        new Setting(containerEl)
            .setName(t('settingRepeatsName'))
            .setDesc(t('settingRepeatsDesc'))
            .addText((text) =>
                text
                    .setPlaceholder('2')
                    .setValue(String(this.plugin.settings.maxConsecutiveWordRepeats))
                    .onChange(async (value) => {
                        const num = Number(value);
                        this.plugin.settings.maxConsecutiveWordRepeats =
                            Number.isFinite(num) && num >= 1 ? Math.round(num) : 2;
                        await this.plugin.saveSettings();
                        this.plugin.applyTuningSettings();
                    })
            );
    }
}

