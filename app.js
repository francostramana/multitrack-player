"use strict"

import { WCTrackPlayer} from './components/track-player.component.js';

const runOnMainThread = false;

// context audio 
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

let media = [];

// set up the different audio nodes we will use for the app
const mixer = audioCtx.createGain();
const gain = audioCtx.createGain();
const panner = audioCtx.createStereoPanner();

const analyser = audioCtx.createAnalyser();
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;
    analyser.smoothingTimeConstant = 0.85;

// ui
let btnNew = document.querySelector('#btn-new');
let btnPlay = document.querySelector('#btn-play');
let btnStop = document.querySelector('#btn-stop');
let btnGainControl = document.querySelector('#gain-control');
let btnPanControl = document.querySelector('#pan-control');

// handlers
btnNew.addEventListener('click', newMedia);
btnPlay.addEventListener('click', play);
btnStop.addEventListener('click', stop);
btnGainControl.addEventListener('input', e => setGain(e.target.value));
btnPanControl.addEventListener('input', e => setPan(e.target.value));

// dropzone
document.querySelector("#main-dropzone").addEventListener('filesdropped', e => load(e.detail));

// init app
init();

function init() {
  // input
  mixer.connect(panner);
  panner.connect(gain);
  gain.connect(analyser);

  // output
  analyser.connect(audioCtx.destination);

  newMedia();
}

function newMedia() {
  console.log("New media prepared...");
  
  stop();  
  clear();
  media = [];
  
  setStatus('waiting');
}


function load(files) {
  let aTracks = [];

  let startTime = (new Date).getTime();

  // create media tracks
  for (let file of files) {

    // create track and append to view
    const track = new WCTrackPlayer(file, mixer, audioCtx);
    track.addEventListener('soloToggled', e => setSolo(e.srcElement, e.detail.active));
    render(track);
    
    aTracks.push(track.prepare());
    media.push(track);
  }


  Promise.all(aTracks)
    .then(e => {
      enablePlayer();

      let timeDiff = (new Date).getTime() - startTime; //in ms
      console.log(`Time to player enabled: ${timeDiff}ms`);
    })
    .catch(e => {
      setStatus('error');
      console.log(e)
    });
}

function play() {
  media.forEach(track => track.start());
  setStatus('playing');
}

function stop() {
  if (audioCtx.state != 'suspended') {
    media.forEach(track => track.stop());
  }

  setStatus('stopped');
}

function setSolo(currentTrack, active) {
  media
    .filter(track => track != currentTrack)
    .forEach(track => track.mute(active));
}

function setGain(value) {
    gain.gain.value = (value/100); 
}

function setPan(value) {
    if (Math.abs(value) < 20) {
        value = 0;
        btnPanControl.value = 0;
    }

    panner.pan.value = (value/100);
}



// VIEW

function setStatus(status) {
  const body = document.querySelector("body");
  body.dataset.status = status;
}

function render(track) {
  document.querySelector("#wrap-editor").appendChild(track);
}

function clear() {
  const wrap = document.querySelector("#wrap-editor");
  wrap.textContent = '';
}

function enablePlayer() {
  setStatus('prepared');
}

