"use strict"

class WCDropZone extends HTMLElement {

    constructor() {
        super();
        const template = document.createElement('template');
        template.innerHTML = this._template();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(document.importNode(template.content, true));
    }

    connectedCallback() {

        // we want to prevent the default behavior for window drops
        window.addEventListener('dragleave', e => e.preventDefault(), false);
        window.addEventListener('dragover', e => e.preventDefault(), false);
        window.addEventListener('drop', e => e.preventDefault(), false);

        let dropzone = this.shadowRoot.querySelector('.dropzone');
        dropzone.addEventListener('dragover', function(ev) {
                ev.preventDefault();
                dropzone.classList.add('dragover');
            }, false);

        dropzone.addEventListener('dragleave', ev => {
                ev.preventDefault();
                dropzone.classList.remove('dragover');
            }, false);

        // see {https://developer.mozilla.org/es/docs/DragDrop/Drag_and_Drop/drag_and_drop_archivo}
        dropzone.addEventListener('drop', ev => {
            console.log('File(s) dropped');
            dropzone.classList.remove('dragover');

            // Prevent default behavior (Prevent file from being opened)
            ev.preventDefault();

            let files = [];
            if (ev.dataTransfer.items) {
                // Use DataTransferItemList interface to access the file(s)
                for (var i = 0; i < ev.dataTransfer.items.length; i++) {
                    // If dropped items aren't files, reject them
                    if (ev.dataTransfer.items[i].kind === 'file') {
                        let file = ev.dataTransfer.items[i].getAsFile();
                        files.push(file);
                        console.log('... file[' + i + '].name = ' + file.name);
                    }
                } 
            } else {
              // Use DataTransfer interface to access the file(s)
              for (var i = 0; i < ev.dataTransfer.files.length; i++) {
                files.push(ev.dataTransfer.files[i]);
                console.log('... file[' + i + '].name = ' + ev.dataTransfer.files[i].name);
              }
            } 

            this.dispatchEvent(new CustomEvent('filesdropped', {detail: files}));

        });
    }

    _template() {
        return `
            <style>
            .dropzone {
                margin: 5px;
                display: flex;
                height: 250px;
            
                justify-content: center;
                align-items: center;
            
                border: 2px dashed #ccc;
                color: #ccc;
              }
              
              .dropzone.dragover {
                border-color: #000;
                color: #000;
              }
            </style>
            
            <div id="main-dropzone" class="dropzone">
                Drop your files here...
            </div>
        `;
    }
    
}

customElements.define('wc-dropzone', WCDropZone);