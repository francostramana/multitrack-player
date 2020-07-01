"use strict"

import { applyAmp } from '../wasm/filter.js';

export class WCTrackPlayer extends HTMLElement {

    constructor(file, mixer, audioCtx) {
        super();

        this.mixer = mixer;
        this.audioCtx = audioCtx;
        this.file = file;

        this.isMuted = false;
        this.isSolo = false;
        this.isAmp = false;

        this.runOffMainThread = true;
    }

    connectedCallback() {
        this.innerHTML = this._template();

        // handle events
        this.querySelector('.btn-mute').addEventListener('click', e => this.mute());
        this.querySelector('.btn-solo').addEventListener('click', e => this.solo());
        this.querySelector('.btn-amp').addEventListener('click', e => this.amp());

        this.querySelector('.gain-control').addEventListener('input', e => {
            this._gainNode.gain.value = e.target.value / 100 ;
        });

        const panControl =  this.querySelector('.pan-control');
        panControl.addEventListener('input', e => {
            let value = e.target.value;
            if (Math.abs(value) < 20) {
                value = panControl.value = 0;
            }
        
            this._pannerNode.pan.value = (value/100);
        });
    }

    prepare() {

        // set up the different audio nodes we will use for this track player
        // source node will be create on start
        this._pannerNode = this.audioCtx.createStereoPanner();
        this._gainNode   = this.audioCtx.createGain();

        // connect nodes
        this._pannerNode.connect(this._gainNode);
        this._gainNode.connect(this.mixer);

        // load buffer
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (read) => {
                
                // decoded data
                return this.audioCtx.decodeAudioData(read.target.result)
                    .then(decodedData => {
                        this.buffer = decodedData;
                        this.original = this._clone(this.buffer);
                        
                        console.log("buffers fulled!");
                        
                        this._drawWaveform(decodedData);
                        
                        resolve(true);
                    });
            }
    
            reader.readAsArrayBuffer(this.file);
        } );
        
    }

    _drawWaveform(buffer) {
        const canvas = document.createElement("canvas");
        canvas.width = 1600; //TODO: set width relative to duration
        canvas.height = 120; 
         
        this.querySelector('.waveform').replaceChild(canvas, this.querySelector('.waveform canvas'));

        let pcm = buffer.getChannelData(0); // Float32Array describing left channel  
        
        if (!this.runOffMainThread) {
            displayBuffer(canvas, pcm);
            //setTimeout(e => displayBuffer(canvas, pcm), 0);
        } else {
            const offscreen = canvas.transferControlToOffscreen();
            const worker = new Worker('js/worker.js');
            worker.postMessage({ canvas: offscreen, buffer: pcm }, [offscreen]); // transferable arraybuffer
        }
    }

    start() {

        if (!this.buffer) {
            throw new Error("file buffer not loaded yet!");
        }

        // recreate source node and connect
        this._sourceNode = this.audioCtx.createBufferSource();
        this._sourceNode.buffer = this.buffer;
        this._sourceNode.connect(this._pannerNode);

        this._sourceNode.start(0);
    }

    pause() {
        throw "Not implemented yet";
    }

    stop() {
        this._sourceNode.stop(0);
    }

    mute(value) {
        this.isMuted = value ? value : !this.isMuted;
      
        if (this.isMuted) {
            this.snapGain = this._gainNode.gain.value;
            this._gainNode.gain.value = 0;
            this.querySelector('.track').classList.add('muted');
        } else {
            this._gainNode.gain.value = this.snapGain;
            this.querySelector('.track').classList.remove('muted');
        }
    }

    solo() {
        /*
        this.isSolo = !this.isSolo;

        if (this.isSolo) {
            this.querySelector('.track').classList.add('solo');
        }
        else {
            this.querySelector('.track').classList.remove('solo');
        }
        */

        this.dispatchEvent(new CustomEvent('soloToggled', {detail: {active: this.isSolo}}));

    }

    async amp() {
        this.isAmp = !this.isAmp;

        if (this.isAmp) {
            for (let i = 0; i < this.buffer.numberOfChannels; i++) {
                let channelData = this.buffer.getChannelData(i);
                let channelDataAmp = await applyAmp(channelData);
                this.buffer.getChannelData(i).set(channelDataAmp);
            }

            this.querySelector('.track').classList.add('amp');
        } else {
            //TODO: back to original buffer
            for (let i = 0; i < this.buffer.numberOfChannels; i++) {
                this.buffer.getChannelData(i).set(this.original.getChannelData(i));
            }

            this.querySelector('.track').classList.remove('amp');
        }

        this._drawWaveform(this.buffer);

    }

    _clone(buffer) {
        const bufferClone = this.audioCtx.createBuffer(
            buffer.numberOfChannels,
            buffer.length,
            buffer.sampleRate);

        for (let i = 0; i < this.buffer.numberOfChannels; i++) {
            bufferClone.copyToChannel(buffer.getChannelData(i), i)
        }

        return bufferClone;

    }

    _template() {
        return  `
        <style>
            .track {
                display: flex;
            }

            .track.muted .waveform { opacity: 0.6; }
            .track.muted .btn-mute { background: var(--color-primary); color: white }
            .track.solo  .btn-solo { background: var(--color-primary); color: white }
            .track.amp   .btn-amp  { background: var(--color-primary); color: white }

            .track .controls {
                background: #e7e7e7;
                width: 200px;
            }
        
            .track .waveform {
                position: relative;
                background: #f0f0f0;
                flex-grow: 1;
                
                display: flex;
                justify-content: center;
                align-items: center;
            }
                .track .waveform canvas {
                    position: absolute;
                    top: 0;
                    left: 0;

                    width: 100%;
                    height: 100%;
                    border-radius: 10px;
                }
                
        </style>
        <div class="track border-solid border-b border-gray-400">
            <div class="controls p-1">
                <header class="mb-1 p-2 bg-gray-400 text-sm font-semibold rounded">${this.file.name}</header>
                <div class="tools">
                    <div class="flex">
                        <button class="btn-mute text-sm flex-grow bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l">
                            MUTE
                        </button>
                        <button class="btn-solo text-sm flex-grow bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r">
                            SOLO
                        </button>
                        <button class="btn-amp text-sm flex-grow bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 ml-1 rounded">
                            A
                        </button>
                    </div>
                    <div class="tool-level mt-1">
                        <input type="range" name="gain-control" class="gain-control w-full" min="0" max="100" value="100"/>
                        <input type="range" name="pan-control" class="pan-control w-full" min="-100" max="100" value="0"/> 
                    </div>
                </div>
            </div>
            <div class="waveform">
                <div class='text-gray-600'> Generating audio waveform... </div>
                <canvas class="canvas-waveform" width="1600" height="120"></canvas>
            </div>
        </div>
        `;
    }
}

customElements.define('wc-track-player', WCTrackPlayer);