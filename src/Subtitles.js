import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import './App.css';

class Subtitles extends Component {
    state = {
        add: 0
    };

    subtitles = [[0, "Пример текста cубтитров"]];
    dragging_subtitles = false;
    current_subtitle = null;
    audioCtx = new AudioContext();
    audio_source = null;
    play_subtitle = false;
    synth = window.speechSynthesis;
    
    addSubtitle = () => {
        if (this.audio_source != null && this.play_subtitle == true) {
            let subtitles = document.getElementsByClassName('subtitles-item');

            this.audio_source.stop();  
            this.synth.cancel();                  

            for (let item = 0; item < subtitles.length; item++) {
                subtitles[item].childNodes[1].childNodes[0].setAttribute('data-action', 'play');
                subtitles[item].childNodes[1].childNodes[0].innerHTML = "<img src='/img/icon-play.png'/>";
            }
        }

        this.play_subtitle = false;
        this.subtitles = [...this.subtitles, [this.subtitles[this.subtitles.length - 1][0] + 5, "Пример текста cубтитров"]];
        
        this.setState({add: 0});
    }

    remove = (e) => {
        if (this.audio_source != null && this.play_subtitle == true) {
            let subtitles = document.getElementsByClassName('subtitles-item');
            this.audio_source.stop();   
            this.synth.cancel();                 

            for (let item = 0; item < subtitles.length; item++) {
                subtitles[item].childNodes[1].childNodes[0].setAttribute('data-action', 'play');
                subtitles[item].childNodes[1].childNodes[0].innerHTML = "<img src='/img/icon-play.png'/>";
            }
        }

        this.play_subtitle = false;
        this.subtitles.splice(parseInt(e.target.getAttribute('data-id')), 1);
        this.setState({add: 1});
    }

    play = (e) => {
        if (this.props.audio_buffer) {
            if (e.target.getAttribute('data-action') == 'play') {
                if (this.audio_source != null && this.play_subtitle == true) {
                    let subtitles = document.getElementsByClassName('subtitles-btn-play');

                    this.audio_source.stop();   
                    this.synth.cancel();                 

                    for (let item = 0; item < subtitles.length; item++) {
                        subtitles[item].setAttribute('data-action', 'play');
                        subtitles[item].innerHTML = "<img src='/img/icon-play.png'/>";
                    }
                }

                var subtitle_id = parseInt(e.target.parentNode.parentNode.getAttribute('data-id'));
                this.audioCtx =  this.props.audio_ctx;
                this.audio_source = this.audioCtx.createBufferSource()
                this.audio_source.buffer = this.props.audio_buffer;

                let gain_node = this.audioCtx.createGain();
                gain_node.gain.value = 0.1;

                this.audio_source.connect(gain_node).connect(this.audioCtx.destination);
                
                let duration = 0;

                if (subtitle_id < this.subtitles.length - 1) {
                    duration = this.subtitles[subtitle_id + 1][0] - this.subtitles[subtitle_id][0]
                } else {
                    duration = this.audio_source.buffer.duration - this.subtitles[subtitle_id][0]
                }

                let speech = new SpeechSynthesisUtterance(this.subtitles[subtitle_id][1]);
                speech.voice = this.synth.getVoices()[20];
                this.synth.speak(speech);
               
                this.audio_source.start(0, parseFloat(e.target.parentNode.parentNode.getAttribute('data-time')), duration);

                this.audio_source.onended = () => {
                    document.getElementsByClassName('subtitles-btn-play')[subtitle_id].setAttribute('data-action', 'play');
                    document.getElementsByClassName('subtitles-btn-play')[subtitle_id].innerHTML = "<img src='/img/icon-play.png'/>";
                }

                this.play_subtitle = true;
                e.target.setAttribute('data-action', 'stop');
                e.target.innerHTML = "<img src='/img/icon-stop.png'/>";
            } else if (e.target.getAttribute('data-action') == 'stop') {
                this.audio_source.stop();
                this.synth.cancel();
                this.play_subtitle = false;
                e.target.setAttribute('data-action', 'play');
                e.target.innerHTML = "<img src='/img/icon-play.png'/>";
            }
           
        }
    };

    editText = (e) => {
        this.subtitles[parseInt(e.target.parentNode.getAttribute('data-id'))][1] = e.target.innerText
    }

    createJSON = () => {
        let file_link = document.createElement("a");
        let subtitles_data = [];
        let date = new Date();

        this.subtitles.map((element, index) => {
            let time = '00:00:00,000';
            if (index < this.subtitles.length - 1) {
                time = this.formatTime(element[0], this.subtitles[index + 1][0]);
            } else {
                time = this.formatTime(element[0], this.props.audio_buffer.duration);
            }

            subtitles_data.push({
                id: index,
                name: "Диктор",
                time: time,
                content: element[1],
                tag: "",
                setting: "voice_1"
            });
        });
        
        const file = new Blob(
            [JSON.stringify(subtitles_data)], {
                type: 'application/json'
            }
        )
    
        file_link.href = URL.createObjectURL(file);
        file_link.download = `subtitles${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
        file_link.click();
    }

    formatTime(time_start, time_end) {
        let hours = [Math.floor(time_start / 3600), Math.floor(time_end / 3600)];
        let minutes = [Math.floor((time_start - hours[0] * 3600) / 60), Math.floor((time_end - hours[1] * 3600) / 60)];
        let seconds = [(time_start - (hours[0] * 3600 + minutes[0] * 60)).toFixed(3).replace('.', ','), (time_end - (hours[1] * 3600 + minutes[1] * 60)).toFixed(3).replace('.', ',')]

        return hours[0].toString().padStart(2, '0') + ':' + minutes[0].toString().padStart(2, '0') + ':' + seconds[0].padStart(6, '0') + ' --> ' + hours[1].toString().padStart(2, '0') + ':' + minutes[1].toString().padStart(2, '0') + ':' + seconds[1].padStart(6, '0');
    }

    handleSubtitleMouseDown = (e) => {
        this.current_subtitle = e.target;
        this.dragging_subtitles = true;
    }

    render() {
        let canvas = document.getElementById("waveform");

        document.addEventListener('mouseup', () => {
            this.dragging_subtitles = false;
        });
        
        document.addEventListener('mousemove', (e) => { 
            if(this.dragging_subtitles == true && e.target.classList.contains('subtitles-item')) {
                if (this.audio_source != null && this.play_subtitle == true) {
                    let subtitles = document.getElementsByClassName('subtitles-btn-play');

                    this.audio_source.stop();    
                    this.synth.cancel();           

                    for (let item = 0; item < subtitles.length; item++) {
                        subtitles[item].setAttribute('data-action', 'play');
                        e.target.childNodes[1].childNodes[0].innerHTML = "<img src='/img/icon-play.png'/>";
                    }
                }

                this.play_subtitle = false;
                this.audioCtx =  this.props.audio_ctx;
                this.audio_source = this.audioCtx.createBufferSource()
                this.audio_source.buffer = this.props.audio_buffer;
                this.audio_source.connect(this.audioCtx.destination);                
                
                let subtitle_id = parseInt(this.current_subtitle.getAttribute('data-id'));
                let subtitle_position = e.clientY + parseInt(document.getElementById('waveform-editor').getAttribute("data-scroll")) - (parseInt(this.current_subtitle.getAttribute('data-id')) + 1) * 28.8;

                if (canvas != null) {
                    let audio_time = ((e.clientY - 28.9 + parseInt(document.getElementById('waveform-editor').getAttribute("data-scroll"))) * this.audio_source.buffer.duration /  canvas.clientHeight);
                    
                    if(subtitle_id > 0 && subtitle_id < this.subtitles.length - 1 && this.subtitles[subtitle_id - 1][0] + 1 < audio_time && this.subtitles[subtitle_id + 1][0] - 1 > audio_time) {
                        if (this.current_subtitle.querySelector('.subtitles-time')) {
                            this.current_subtitle.querySelector('.subtitles-time').innerText = `${audio_time.toFixed(1)}s`;
                            this.current_subtitle.setAttribute('data-time', audio_time);
                            this.current_subtitle.style.top = `${subtitle_position}px`;
                            this.subtitles[subtitle_id][0] = audio_time;
                        }
                    } else if ((subtitle_id == 0 && this.subtitles.length == 1 && audio_time >= 0) || (subtitle_id == 0  && this.subtitles.length > 1 && this.subtitles[subtitle_id + 1][0] - 1 > audio_time && audio_time >= 0)) {
                        if (this.current_subtitle.querySelector('.subtitles-time')) {
                            this.current_subtitle.querySelector('.subtitles-time').innerText = `${audio_time.toFixed(1)}s`;
                            this.current_subtitle.setAttribute('data-time', audio_time);
                            this.current_subtitle.style.top = `${subtitle_position}px`;
                            this.subtitles[subtitle_id][0] = audio_time;
                        }
                    } else if (subtitle_id == this.subtitles.length - 1  && this.subtitles.length > 1 && this.subtitles[subtitle_id - 1][0] + 1 < audio_time && audio_time <= this.audio_source.buffer.duration - 2) {
                        if (this.current_subtitle.querySelector('.subtitles-time')) {
                            this.current_subtitle.querySelector('.subtitles-time').innerText = `${audio_time.toFixed(1)}s`;
                            this.current_subtitle.setAttribute('data-time', audio_time);
                            this.current_subtitle.style.top = `${subtitle_position}px`;
                            this.subtitles[subtitle_id][0] = audio_time;
                        }
                    }
                }
            }
        });

        if(this.props.upload_file == 1) {   
            this.audioCtx =  this.props.audio_ctx;
            this.audio_source = this.audioCtx.createBufferSource()
            this.audio_source.buffer = this.props.audio_buffer;
            this.audio_source.connect(this.audioCtx.destination);   
            var audio_duration = this.audio_source.buffer.duration;  

            setTimeout(() => 
            {
                let subtitles = document.getElementsByClassName('subtitles-item');
                this.subtitles.map((element, index) => {
                    subtitles[index].childNodes[2].innerText = element[1];
                });
            }, 1000);

            return <div className="subtitles-container" id="subtitles-container">
                { 
                    this.subtitles.map((element, index) => {
                        const sybtitles_style = {top: Math.round(canvas.clientHeight / audio_duration * element[0] - (28.8 * index))+'px'};
                        return <div className="subtitles-item" key={index} data-id={index} data-time={element[0]} style={sybtitles_style} onMouseDown={this.handleSubtitleMouseDown}>
                            <div className="subtitles-drag"></div>
                            <div className="subtitles-action">
                                <button className="subtitles-btn-play" data-action="play" onClick={this.play}>
                                    <img src='/img/icon-play.png'/>
                                </button>
                                <button className="subtitles-btn-remove" data-id={index} data-action="play" onClick={this.remove}>
                                    <img src='/img/icon-delete.png'/>
                                </button>
                            </div>
                            <span className="subtitles-text" contentEditable="true" onBlur={this.editText}>{element[1]}</span>
                            <span className="subtitles-time">{element[0].toFixed(1)}s</span>  
                        </div>;
                    })
                } 
                <div className='subtitles-container-action'>
                    <button className='add-subtitle-btn' onClick={this.addSubtitle}>+ Добавить субтитры</button>
                    <button className='download-subtitle-btn' onClick={this.createJSON}>Скачать JSON-файл</button>
                </div>
            </div>
        } else {
            return <div className="subtitles-container" id="subtitles-container"></div>
        }
    }
}

export default Subtitles;