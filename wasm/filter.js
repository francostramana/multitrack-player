// Imports are from the demo-util folder in the repo
// https://github.com/torch2424/wasm-by-example/blob/master/demo-util/

import { wasmBrowserInstantiate } from "../wasm/instantiateWasm.js";


// Function to convert float samples to byte samples
// This is mostly for demostration purposes.
// Float samples follow the Web Audio API spec:
// https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer
// Byte samples are represented as follows:
// 127 is silence, 0 is negative max, 256 is positive max
const floatSamplesToByteSamples = floatSamples => {
  const byteSamples = new Uint8Array(floatSamples.length);
  for (let i = 0; i < floatSamples.length; i++) {
    const diff = floatSamples[i] * 127;
    byteSamples[i] = 127 + diff;
  }
  return byteSamples;
};

// Function to convert byte samples to float samples
// This is mostly for demostration purposes.
// Float samples follow the Web Audio API spec:
// https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer
// Byte samples are represented as follows:
// 127 is silence, 0 is negative max, 256 is positive max
const byteSamplesToFloatSamples = byteSamples => {
  const floatSamples = new Float32Array(byteSamples.length);
  for (let i = 0; i < byteSamples.length; i++) {
    const byteSample = byteSamples[i];
    const floatSample = (byteSample - 127) / 127;
    floatSamples[i] = floatSample;
  }
  return floatSamples;
};

export const applyAmp = async (samples) => {
  // Instantiate our wasm module
  const wasmModule = await wasmBrowserInstantiate("./wasm/index.wasm");

  // Get our exports object, with all of our exported Wasm Properties
  const exports = wasmModule.instance.exports;

  // Get our memory object from the exports
  const memory = exports.memory;

  // Create a Uint8Array to give us access to Wasm Memory
  const wasmByteMemoryArray = new Uint8Array(memory.buffer);

  // Final amplified samples
  const amplifiedAudioSamples = new Float32Array(samples.length);


  let outputFinalBuffer = new Uint8Array(samples.length); 
  for (let i = 1024; i < samples.length; i += 1024) {
    let subSamples = samples.slice(i-1024, i);
    
    // Convert our float audio samples to a byte format for demonstration purposes
    const originalByteAudioSamples = floatSamplesToByteSamples(subSamples);

    // Fill our wasm memory with the converted Audio Samples,
    // and store it at our INPUT_BUFFER_POINTER (wasm memory index)
    wasmByteMemoryArray.set(
      originalByteAudioSamples,
      exports.INPUT_BUFFER_POINTER.valueOf()
    );

    // Amplify our loaded samples with our export Wasm function
    exports.amplifyAudioInBuffer();

    // Slice out the amplified byte audio samples
    const outputBuffer = wasmByteMemoryArray.slice(
      exports.OUTPUT_BUFFER_POINTER.valueOf(),
      exports.OUTPUT_BUFFER_POINTER.valueOf() +
        exports.OUTPUT_BUFFER_SIZE.valueOf()
    );

    outputFinalBuffer.set(outputBuffer, i - 1024);
  }

  // Convert our amplified byte samples into float samples,
  // and set the outputBuffer to our amplifiedAudioSamples
  amplifiedAudioSamples.set(byteSamplesToFloatSamples(outputFinalBuffer));

  // Return new samples
  return Promise.resolve(amplifiedAudioSamples);
};
