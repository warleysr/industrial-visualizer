/**
 * Web Worker executing Offline DSP Kick & Drop Analysis without blocking the 3D render loop.
 */

import { analyzeAudioPCM } from './kickAnalyzer.js';

self.onmessage = (event) => {
  const { id, monoSamples, sampleRate, options } = event.data || {};
  try {
    const analysis = analyzeAudioPCM(monoSamples, sampleRate, options || {});
    const transfer = [];
    if (analysis.waveform && analysis.waveform.buffer) {
      transfer.push(analysis.waveform.buffer);
    }
    if (analysis.subProfile && analysis.subProfile.buffer) {
      transfer.push(analysis.subProfile.buffer);
    }
    self.postMessage({ id, ok: true, analysis }, transfer);
  } catch (err) {
    self.postMessage({
      id,
      ok: false,
      error: err && err.message ? err.message : String(err)
    });
  }
};
