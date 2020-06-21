"use strict"

class WCTrackPlayer extends HTMLElement {

    constructor(file, audioCtx) {
        super();
        this.audioCtx = audioCtx;
        this.file = file;

        this.isMuted = false;
        this.isSolo = false;

        this.runOnMainThread = false;
    }

    connectedCallback() {
        this.innerHTML = this._template();

        // handle events
        this.querySelector('.btn-mute').addEventListener('click', e => this.mute());
        this.querySelector('.btn-solo').addEventListener('click', e => this.solo());

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
        this._sourceNode = this.audioCtx.createBufferSource();
        this._pannerNode = this.audioCtx.createStereoPanner();
        this._gainNode   = this.audioCtx.createGain();

        // connect nodes
        this._sourceNode.connect(this._pannerNode);
        this._pannerNode.connect(this._gainNode);
        this._gainNode.connect(mixer);

        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (read) => {
                
                // decoded data
                return this.audioCtx.decodeAudioData(read.target.result)
                    .then(decodedData => {
                        this.buffer = decodedData;
                        this._sourceNode.buffer = this.buffer;
                        
                        console.log("buffer fulled!");
                        
                        this._drawWaveform(decodedData);
                        
                        resolve(true);
                    });
            }
    
            reader.readAsArrayBuffer(this.file);
        } );
        
    }

    _drawWaveform(buffer) {
        let canvas = this.querySelector('.canvas-waveform');
        let pcm = buffer.getChannelData(0); // Float32Array describing left channel  
        
        if (this.runOnMainThread) {
            displayBuffer(canvas, pcm);
            //setTimeout(e => displayBuffer(canvas, pcm), 0);
        } else {
            const offscreen = canvas.transferControlToOffscreen();
            const worker = new Worker('js/worker.js');
            worker.postMessage({ canvas: offscreen, buffer: pcm }, [offscreen, pcm.buffer]); // transferrable arraybuffers
        }
    }

    start() {
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
        }
        else {
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

    _template() {
        return  `
        <style>
            .track {
                display: flex;
            }

            .track.muted .waveform { opacity: 0.6; }
            .track.muted .btn-mute { background: var(--color-primary); color: white }
            .track.solo  .btn-solo { background: var(--color-primary); color: white }

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