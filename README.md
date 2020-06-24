## Why (super) Vainilla JS?
Amamos todo lo relacionado con Tooling y FW's JS, pero este proyecto fué armado con fines educativos y nuestro interés es que no se pierde el punto central. Cada uno/a lo puede aplicar en su framework favorito. 

Para correrlo simplemente copiá la carpeta en tu web server favorito, o si tenés **npm** ejecuta: `npm run start` (previamente instala dependencias con `npm install`). Este comando levantará el proyecto en _http://localhost:8080_.

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
