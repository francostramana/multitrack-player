"use strict"

importScripts('waveform.js');

self.onmessage = function(evt) {

    if (evt.data.canvas) {
        let canvas = evt.data.canvas;
        const buffer = evt.data.buffer;

        displayBuffer(canvas, buffer);
    }

}