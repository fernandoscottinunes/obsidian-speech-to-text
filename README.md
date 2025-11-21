# Speech to Text

Capture audio (window/screen or microphone), send WAV chunks to an HTTP STT endpoint, and insert the returned text into the active note.

## Requirements
- Obsidian desktop (uses Electron + Web Audio APIs; desktop only).
- A speech-to-text endpoint (e.g., Whisper API from Groq/OpenAI, local Whisper server, Vosk/AssemblyAI/Deepgram, etc.).

## Install from source
1) `npm install`  
2) `npm run build` (generates `main.js` and, if configured in `esbuild.config.mjs`, copies it to your vault’s plugin folder).  
3) Enable the plugin in Obsidian (safe mode off).

## Plugin settings
- **STT Endpoint (HTTP)**: URL that receives the WAV.
- **API Key (optional)**: sent as `Authorization: Bearer <key>`.
|- **Model**: `model` field in multipart body (for OpenAI/Groq-style APIs, e.g., `whisper-large-v3`).
|- **Language (optional)**: `language` field in multipart body (e.g., `pt`).
|- **Send as multipart/form-data**: if off, sends raw `audio/wav`.
|- **File field (form-data)**: multipart field name (default `file`).
|- **Text field in JSON response**: where the backend returns the transcript (default `text`, fallback `transcript`).
|- **Chunk duration (ms)**: size of audio chunks sent.

## Usage
1) Click the mic icon (or command) and choose the source (window/screen or microphone).
2) The plugin captures audio via Web Audio, generates 16-bit WAV, sends chunks to the endpoint, and writes text at the cursor position.
3) Hover tooltip shows `[REC]` and the source; the status bar also shows the current state.

## Technical notes
- PCM capture with `AudioContext` + `ScriptProcessorNode`, preferred sample rate ~16 kHz (may vary by device).
- Each chunk is sent as mono 16-bit WAV (`audio/wav`). If multipart is on, it uses `file=<blob>`; otherwise, raw body with `Content-Type: audio/wav`.
- Desktop only (`isDesktopOnly: true`).

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

## License
MIT
