
function displayBuffer(canvas, pcm) {
    display_normal(canvas, pcm);
    //display_231iyi(canvas, pcm);
}

/**
 * 
 * @param {HTMLCanvas} canvas canvas to render waveform
 * @param {Float32Array} pcm pulse-code modulation
 */
function display_normal(canvas, pcm) {

    let context = canvas.getContext('2d');

    let canvasWidth = canvas.width;
    let canvasHeight = canvas.height;

    context.save();
    context.fillStyle = _getColor();
    context.fillRect(0, 0, canvasWidth, canvasHeight);
    context.strokeStyle = '#FFF';
    context.globalCompositeOperation = 'lighter';
    context.translate(0, canvasHeight / 2);
    context.globalAlpha = 1; // 0.06
    for (let i=0; i < pcm.length; i+=16) {
        let x = Math.floor (canvasWidth * i / pcm.length);
        let y = pcm[i] * canvasHeight / 2; // mirar GC
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x+1, y);
        context.stroke();
    }
    context.restore();
    console.log('done normal');
}

/**
 * 
 * @param {HTMLCanvas} canvas canvas to render waveform
 * @param {Float32Array} pcm pulse-code modulation
 */
function display_231iyi(canvas, pcm) {
    let context = canvas.getContext('2d');

    let canvasWidth = canvas.width;
    let canvasHeight = canvas.height;

  // we 'resample' with cumul, count, variance
  // Offset 0 : PositiveCumul  1: PositiveCount  2: PositiveVariance
  //        3 : NegativeCumul  4: NegativeCount  5: NegativeVariance
  // that makes 6 data per bucket
  var resampled = new Float64Array(canvasWidth * 6 );
  var i=0, j=0, buckIndex = 0;
  var min=1e3, max=-1e3;
  var thisValue=0, res=0;
  var sampleCount = pcm.length;
  // first pass for mean
  for (i=0; i<sampleCount; i++) {
       // in which bucket do we fall ?
       buckIndex = 0 | ( canvasWidth * i / sampleCount );
       buckIndex *= 6;
       // positive or negative ?
       thisValue = pcm[i];
       if (thisValue>0) {
           resampled[buckIndex    ] += thisValue;
           resampled[buckIndex + 1] +=1;               
       } else if (thisValue<0) {
           resampled[buckIndex + 3] += thisValue;
           resampled[buckIndex + 4] +=1;                           
       }
       if (thisValue<min) min=thisValue;
       if (thisValue>max) max = thisValue;
  }
  // compute mean now
  for (i=0, j=0; i<canvasWidth; i++, j+=6) {
      if (resampled[j+1] != 0) {
            resampled[j] /= resampled[j+1]; ;
      }
      if (resampled[j+4]!= 0) {
            resampled[j+3] /= resampled[j+4];
      }
  }
  // second pass for mean variation  ( variance is too low)
  for (i=0; i<pcm.length; i++) {
       // in which bucket do we fall ?
       buckIndex = 0 | (canvasWidth * i / pcm.length );
       buckIndex *= 6;
       // positive or negative ?
       thisValue = pcm[i];
       if (thisValue>0) {
           resampled[buckIndex + 2] += Math.abs( resampled[buckIndex] - thisValue );               
       } else  if (thisValue<0) {
           resampled[buckIndex + 5] += Math.abs( resampled[buckIndex + 3] - thisValue );                           
       }
  }
  // compute mean variation/variance now
  for (i=0, j=0; i<canvasWidth; i++, j+=6) {
       if (resampled[j+1]) resampled[j+2] /= resampled[j+1];
       if (resampled[j+4]) resampled[j+5] /= resampled[j+4];   
  }
  context.save();
  context.fillStyle = '#00bcd4';
  context.fillRect(0,0,canvasWidth,canvasHeight );
  context.translate(0.5,canvasHeight / 2);   
  context.scale(1, 200);

  for (var i=0; i< canvasWidth; i++) {
       j=i*6;
      // draw from positiveAvg - variance to negativeAvg - variance 
      context.strokeStyle = '#EEE';
      context.beginPath();
      context.moveTo( i  , (resampled[j] - resampled[j+2] ));
      context.lineTo( i  , (resampled[j +3] + resampled[j+5] ) );
      context.stroke();
      // draw from positiveAvg - variance to positiveAvg + variance 
      context.strokeStyle = '#FFF';
      context.beginPath();
      context.moveTo( i  , (resampled[j] - resampled[j+2] ));
      context.lineTo( i  , (resampled[j] + resampled[j+2] ) );
      context.stroke();
      // draw from negativeAvg + variance to negativeAvg - variance 
      // context.strokeStyle = '#FFF';
      context.beginPath();
      context.moveTo( i  , (resampled[j+3] + resampled[j+5] ));
      context.lineTo( i  , (resampled[j+3] - resampled[j+5] ) );
      context.stroke();
  }
  context.restore();
  console.log('done 231 iyi');
}

function _getColor() {
    const colors = ['#00bcd4', '#2ecc71', '#9b59b6', '#f1c40f', '#e67e22', '#eb4d4b'];
    return colors[Math.floor(Math.random()* colors.length)];
}


