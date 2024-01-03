import React, { Component  } from 'react';
import ReactDOM from 'react-dom';
import './App.css';
import Subtitles from './Subtitles';


class App extends Component {
  canvas = null;
  canvasCtx = null;  
  file = null;
  zoom = 2500;
  audioCtx = new AudioContext();
  audio_buffer = null;
  waveform_scroll = 0;
  subtitles_items = [];
  state = {
    uploadFile: 0
  }

  handleFileUpload = async(e) => {
    if (e.target.files.length > 0) { 
      this.file = e.target.files[0];
      document.getElementById("editor-zoom").style.display = 'block';

      this.audioCtx.decodeAudioData(await this.file.arrayBuffer(), (buffer) => {
        this.audio_buffer = buffer;
        this.drawWaveform();
        this.setState({uploadFile: 1})
      });

    } else if (this.file == null) {
      this.audio_buffer = null;
      document.getElementById("editor-zoom").style.display = 'none';
      this.setState({uploadFile: 0})
    }
  };

  handleZoomChange = (e) => {
    this.zoom = parseInt(e.target.value);
    this.drawWaveform();

    document.querySelectorAll('.subtitles-item').forEach((item, index) => {
      let source = this.audioCtx.createBufferSource()
      source.buffer = this.audio_buffer;
      source.connect(this.audioCtx.destination);
      item.style.top = `${Math.round(this.canvas.clientHeight / source.buffer.duration * item.getAttribute('data-time') - (28.8 * index))}px`;
    })
  };

  drawWaveform = () => {
    this.canvas = document.getElementById("waveform");
    this.canvasCtx = this.canvas.getContext("2d");

    let source = this.audioCtx.createBufferSource()
    source.buffer = this.audio_buffer;
    source.connect(this.audioCtx.destination);
    let data = source.buffer.getChannelData(0);

    var second_interval = data.length / this.audio_buffer.duration;

    this.canvas.height = data.length / this.zoom;

    for(var i = 0; i < data.length; i+=this.zoom){
      var x = data[i] * (this.canvas.width - 80) / 2;
      var y = i / this.zoom + 12;

      if (i % second_interval === 0) {
        this.canvasCtx.fillStyle = '#b2b2b2';
        this.canvasCtx.fillRect(80, y - 2, 220, 2);
        this.canvasCtx.font = '500 24px system-ui';
        this.canvasCtx.fillText(i  / second_interval + ".0s", 0, y + 8);
      }

      this.canvasCtx.fillStyle = '#000000';
      this.canvasCtx.fillRect((this.canvas.width - 80) / 2 + x + 80, y, -x, 2);
    }
  };

  play = async () => {
    // if (source == null) {
    //   source = audioCtx.createBufferSource()
    //   audioCtx.decodeAudioData(await file.arrayBuffer(), function(buffer) {
    //     source.buffer = buffer;
    //     source.connect(audioCtx.destination);
    //     source.start(0);
    //   });
    // } else {
    //   source.play();
    // }
  };

  pause = async () => {
    // source.stop();
  };

  handleScrollWaveform = (e) => {
    this.waveform_scroll = e.target.scrollTop;
    document.getElementById('waveform-editor').setAttribute("data-scroll", e.target.scrollTop);
  }

  render() {
    return (
      <div className="App">
        <div className="subtitles-editor">
          <div className="waveform-editor" id="waveform-editor" onScroll={this.handleScrollWaveform} data-scroll="0" data-canvas="0">  
            <canvas id="waveform"></canvas>
            <Subtitles 
              upload_file = {this.state.uploadFile}
              audio_buffer = {this.audio_buffer}
              audio_ctx = {this.audioCtx}
            />
          </div>
          <div className="editor-options">
            <div className="file-upload">
              <input type="file" id="audio" accept="audio/*" onChange={this.handleFileUpload} />
            </div>
            <div id="editor-zoom" className='editor-zoom'>
              <label> Масштаб
                <select onChange={this.handleZoomChange}>
                  <option value={5000}>50%</option>
                  <option value={2500} defaultValue selected>100%</option>
                  <option value={1000}>200%</option>
                  <option value={500}>500%</option>
                </select>
              </label>
            </div>
          </div>
        </div> 
      </div>
    );
  }
}


export default App;