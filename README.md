### Load with fetch

```JS
fetch('assets/bloch_prayer.mp3')
    .then(response => {
      if (!response.ok) {
        throw new Error("HTTP error, status = " + response.status);
      }
      return response.arrayBuffer();
    })
    .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
    .then(decodedData => {
      source.buffer = decodedData;
      console.log("buffer fulled!");
    });
```

### clone buffer
```JS
    // clona el buffer para trasnferirlo a distintos workers
    let pcm = new Float32Array(buffer.getChannelData(0).length);
    pcm.set(buffer.getChannelData(0))
```