"use strict"

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
let btnPause = document.querySelector('#btn-pause');
let btnStop = document.querySelector('#btn-stop');
let btnGainControl = document.querySelector('#gain-control');
let btnPanControl = document.querySelector('#pan-control');

// handlers
btnNew.addEventListener('click', newMedia);
btnPlay.addEventListener('click', play);
btnPause.addEventListener('click', pause);
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
  
  media = [];
  setStatus('waiting');
  renderTracks();
}


function load(files) {
  let aTracks = [];

  let startTime = (new Date).getTime();

  // create media tracks
  files.forEach(file => {
    const track = new WCTrackPlayer(file, audioCtx);
    track.addEventListener('soloToggled', e => setSolo(e.srcElement, e.detail.active));
    
    aTracks.push(track.prepare());
    media.push(track);
  });

  // append to view
  renderTracks();

  Promise.all(aTracks)
    .then(e => {
      setStatus('prepared');

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

function pause() {
  media.forEach(track => track.pause());
}

function stop() {
  if (audioCtx.state != "suspended") {
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

function renderTracks() {
  const wrap = document.querySelector("#wrap-editor");
  wrap.textContent = '';
  media.forEach(track => wrap.appendChild(track));
}

