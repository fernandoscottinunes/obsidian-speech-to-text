# Speech to Text

Capture audio from hardware/virtual devices (microphone, mixer, virtual cable), send WAV chunks to an HTTP STT endpoint, and insert the returned text into the active note.

## Requirements
- Obsidian desktop (uses Electron + Web Audio APIs; desktop only).
- A speech-to-text endpoint (e.g., Whisper API from Groq/OpenAI, local Whisper server, Vosk/AssemblyAI/Deepgram, etc.).

## Requisitos (pt-BR)
- Obsidian desktop (usa Electron + Web Audio APIs; apenas desktop).
- Um endpoint de speech-to-text (ex.: Whisper API da Groq/OpenAI, servidor Whisper local, Vosk/AssemblyAI/Deepgram, etc.).

## Install from source
1) `npm install`  
2) `npm run build` (generates `main.js` and, if configured in `esbuild.config.mjs`, copies it to your vault's plugin folder).  
3) Enable the plugin in Obsidian (safe mode off).

## Instalar a partir do codigo-fonte (pt-BR)
1) `npm install`  
2) `npm run build` (gera `main.js` e, se configurado em `esbuild.config.mjs`, copia para a pasta do plugin no seu vault).  
3) Ative o plugin no Obsidian (modo seguro desativado).

## Plugin settings
- **STT Endpoint (HTTP)**: URL that receives the WAV.
- **API Key (optional)**: sent as `Authorization: Bearer <key>`.
|- **Model**: `model` field in multipart body (for OpenAI/Groq-style APIs, e.g., `whisper-large-v3`).
|- **Language (optional)**: `language` field in multipart body (e.g., `pt`).
|- **Send as multipart/form-data**: if off, sends raw `audio/wav`.
|- **File field (form-data)**: multipart field name (default `file`).
|- **Text field in JSON response**: where the backend returns the transcript (default `text`, fallback `transcript`).
|- **Chunk duration (ms)**: size of audio chunks sent.

## Configuracoes do plugin (pt-BR)
- **Endpoint STT (HTTP)**: URL que recebe o WAV.
- **API Key (opcional)**: enviada como `Authorization: Bearer <chave>`.
|- **Modelo**: campo `model` no multipart (para APIs estilo OpenAI/Groq, ex.: `whisper-large-v3`).
|- **Idioma (opcional)**: campo `language` no multipart (ex.: `pt`).
|- **Enviar como multipart/form-data**: se desativado, envia raw `audio/wav`.
|- **Campo do arquivo (form-data)**: nome do campo multipart (padrao `file`).
|- **Campo do texto na resposta JSON**: onde o backend retorna a transcricao (padrao `text`, fallback `transcript`).
|- **Duracao do chunk (ms)**: tamanho dos blocos de audio enviados.

## Usage
1) Click the mic icon (or command) and choose an audio device (microphone, mixer, virtual cable).
2) The plugin captures audio via Web Audio, generates 16-bit WAV, sends chunks to the endpoint, and writes text at the cursor position.
3) Hover tooltip shows `[REC]` and the source; the status bar also shows the current state.

## Uso (pt-BR)
1) Clique no icone do microfone (ou comando) e escolha um dispositivo de audio (microfone, mixer, cabo virtual).
2) O plugin captura audio via Web Audio, gera WAV 16-bit, envia os chunks para o endpoint e escreve o texto no cursor.
3) O tooltip mostra `[REC]` e a fonte; a barra de status tambem mostra o estado atual.

## Technical notes
- PCM capture with `AudioContext` + `ScriptProcessorNode`, preferred sample rate ~16 kHz (may vary by device).
- Each chunk is sent as mono 16-bit WAV (`audio/wav`). If multipart is on, it uses `file=<blob>`; otherwise, raw body with `Content-Type: audio/wav`.
- Desktop only (`isDesktopOnly: true`).

## Notas tecnicas (pt-BR)
- Captura PCM com `AudioContext` + `ScriptProcessorNode`, sample rate preferido ~16 kHz (pode variar por dispositivo).
- Cada chunk e enviado como WAV mono 16-bit (`audio/wav`). Se multipart estiver ativo, usa `file=<blob>`; caso contrario, envia raw com `Content-Type: audio/wav`.
- Apenas desktop (`isDesktopOnly: true`).

## Capturing app audio (Chrome, etc.)
This plugin intentionally uses only audio input devices for compatibility across drivers and OS versions. To capture audio from apps, route the app audio to a virtual device and select it in the plugin.

### Recommended setup (Windows + Voicemeeter)
1) Install VB-Cable and Voicemeeter from the official VB-Audio site.
2) In Voicemeeter:
   - **A1**: MME -> your headphones/speakers (e.g., JBL Quantum 300)
   - **A2**: MME -> **CABLE Input**
3) Windows Mixer (Settings > System > Sound > Volume Mixer > Google Chrome):
   - **Output device**: **Voicemeeter Input**
   - **Input device**: **Default**
4) In the plugin, select **Voicemeeter Output** as the audio source.

### Simple setup (Windows + VB-Cable only)
1) Set Chrome output device to **CABLE Input**.
2) In Windows Sound > Recording, enable **Listen to this device** on **CABLE Output** and choose your headphones.
3) In the plugin, select **CABLE Output**.

## Captura de audio de apps (Chrome, etc.) - pt-BR
Este plugin usa apenas dispositivos de entrada de audio para manter compatibilidade entre drivers e sistemas. Para capturar audio de apps, direcione o audio para um dispositivo virtual e selecione-o no plugin.

### Configuracao recomendada (Windows + Voicemeeter)
1) Instale o VB-Cable e o Voicemeeter no site oficial da VB-Audio.
2) No Voicemeeter:
   - **A1**: MME -> seu fone/alto-falante (ex.: JBL Quantum 300)
   - **A2**: MME -> **CABLE Input**
3) Mixer do Windows (Configuracoes > Sistema > Som > Mixer de Volume > Google Chrome):
   - **Dispositivo de saida**: **Voicemeeter Input**
   - **Dispositivo de entrada**: **Padrao**
4) No plugin, selecione **Voicemeeter Output** como fonte de audio.

### Configuracao simples (Windows + VB-Cable apenas)
1) Defina a saida do Chrome para **CABLE Input**.
2) Em Som do Windows > Gravacao, habilite **Escutar este dispositivo** em **CABLE Output** e escolha seu fone.
3) No plugin, selecione **CABLE Output**.

## Checklist to publish to Obsidian community
- `manifest.json` and `package.json` share the same version and id `obsidian-speech-to-text`.
- `main.js` built from that commit.
- `README.md` and `LICENSE` (MIT) included in the public repo.
- Create a tag/release (e.g., `v1.0.0`) on GitHub containing the bundle.
- In your fork of `obsidianmd/obsidian-releases`, append to `community-plugins.json`:
  ```json
  { "id": "speech-to-text", "name": "Speech to Text", "author": "Fernando Scotti Nunes", "description": "Capture audio from any source and transcribe into the active note.", "repo": "fernandoscottinunes/obsidian-speech-to-text" }
  ```
- Open the PR with a link to the release/tag and a brief description of the plugin and STT settings.

## Checklist para publicar na comunidade Obsidian (pt-BR)
- `manifest.json` e `package.json` com a mesma versao e id `obsidian-speech-to-text`.
- `main.js` gerado a partir desse commit.
- `README.md` e `LICENSE` (MIT) no repo publico.
- Criar tag/release (ex.: `v1.0.0`) no GitHub contendo o bundle.
- No seu fork de `obsidianmd/obsidian-releases`, adicionar em `community-plugins.json`:
  ```json
  { "id": "speech-to-text", "name": "Speech to Text", "author": "Fernando Scotti Nunes", "description": "Capture audio from any source and transcribe into the active note.", "repo": "fernandoscottinunes/obsidian-speech-to-text" }
  ```
- Abrir o PR com link para a release/tag e uma breve descricao do plugin e das configuracoes STT.

## License
MIT



