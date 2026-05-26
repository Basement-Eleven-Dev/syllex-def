class PcmProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._bufferSize = 2048;
    this._buffer = new Float32Array(this._bufferSize);
    this._bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0];
    
    for (let i = 0; i < channelData.length; i++) {
      this._buffer[this._bufferIndex++] = channelData[i];
      
      if (this._bufferIndex >= this._bufferSize) {
        // Quando il buffer è pieno, lo inviamo al thread principale
        this.port.postMessage(this._buffer);
        this._buffer = new Float32Array(this._bufferSize);
        this._bufferIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor('pcm-processor', PcmProcessor);
