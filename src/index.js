import './radio.scss';
import Hls from 'hls.js/dist/hls.min.js';
import {
  thisTypeOf, timeStyle, prepend, isIE, isiPhone, createDom, isNumber,
} from './utils';

window.Promise = window.Promise || Promise;
export default class Radio {
  constructor(container, options) {
    this._container = document.querySelector(container);
    this._options = options;

    this.hls = null;
    this.audio = document.createElement('audio');
    this.audio.autoplay = true;
    this.audio.crossOrigin = 'anonymous';

    this._firstPlayed = false;
    this._currentDuration = '';
    this._lastUrl = null;
    this._playlist = null;
    this._currentDistance = 0;
    this._move = false;
    this._x = 0;
    this._volumeProgressWidth = 0;
    this._currentIndex = null;
    this._current = null;

    this._eles = {};

    for (const [key, value] of Object.entries(this._options.controls)) {
      this._eles[key] = createDom(value);
      if (key === 'volumeProgress') {
        this._eles.volumeProgressInner = createDom('.voice-volume-progress-inner');
        this._eles.volumeHand = createDom('.voice-volume-progress-handle');
        this._eles.volumeProgressInner.appendChild(this._eles.volumeHand);
        this._eles[key].appendChild(this._eles.volumeProgressInner);
      }
      if (key === 'audioProgress') {
        this._eles.audioProgressInner = createDom('.voice-audio-progress-inner');
        this._eles.audioProgressHand = createDom('.voice-audio-progress-handle');
        this._eles.audioProgressInner.appendChild(this._eles.audioProgressHand);
        this._eles[key].appendChild(this._eles.audioProgressInner);
      }
    }
    this.renderHtml(this._container);

    this.bindDOM();
    this._volumeProgressWidth = this._eles.volumeProgress.clientWidth;
    this._audioProgressWidth = this._eles.audioProgress.clientWidth;
  }

  renderHtml(dom) {
    var voiceDom = createDom('.voice');
    var voiceController = createDom('.voice-controller');

    if (this._eles.totalTime || this._eles.currentTime || this._eles.audioProgress) {
      const middle = createDom('.voice-middle');
      const center = createDom('.voice-center');

      if (this._eles.audioProgress) {
        center.appendChild(this._eles.audioProgress);
      }
      if (this._eles.totalTime || this._eles.currentTime) {
        const time = createDom('.voice-time');
        time.innerHTML = '/';
        this._eles.currentTime.innerHTML = '00:00';
        prepend(time, this._eles.currentTime);
        this._eles.totalTime.innerHTML = '00:00';
        time.appendChild(this._eles.totalTime);
        center.appendChild(time);
      }
      if (this._eles.currentTitle) {
        center.appendChild(this._eles.currentTitle);
      }
      middle.appendChild(center);
      voiceController.appendChild(middle);
    }

    if (this._eles.playBtn || this._eles.prevBtn || this._eles.nextBtn) {
      const left = createDom('.voice-left');
      if (this._eles.nextBtn || this._eles.prevBtn) {
        this._eles.prevBtn.classList.add('voice-btn-disable');
        this._eles.nextBtn.classList.add('voice-btn-disable');
        this._eles.playBtn.classList.add('voice-btn-disable');
        left.appendChild(this._eles.prevBtn);
        left.appendChild(this._eles.playBtn);
        left.appendChild(this._eles.nextBtn);
      } else {
        left.appendChild(this._eles.playBtn);
      }
      voiceController.appendChild(left);
    }

    if (this._eles.volumeProgress || this._eles.muteBtn) {
      const right = createDom('.voice-right');
      const volume = createDom('.voice-volume');
      if (this._eles.muteBtn) {
        volume.appendChild(this._eles.muteBtn);
      }
      if (this._eles.volumeProgress) {
        volume.appendChild(this._eles.volumeProgress);
      }
      right.appendChild(volume);
      voiceController.appendChild(right);
    }

    voiceDom.appendChild(voiceController);

    dom.appendChild(voiceDom);
  }

  _load(url) {
    if (url.indexOf('.m3u8') <= 1) {
      this.audio.src = url;
      this.audio.load();
    } else {
      this._loadsource(url);
    }

    this.addAudioEventListeners(this.audio);
  }

  load(e) {
    if (e.length > 0) {
      this._playlist = [].concat(e);
      // this._currentIndex = 0
      // this._current = this._playlist[this._currentIndex]
    }
  }

  reload(e) {
    if (this._isPlay) {
      this.pause();
    }
    this.load(e);
  }

  _loadsource(url) {
    if (isiPhone()) {
      this.audio.src = url;
    } else {
      if (this.hls) {
        this.hls.destroy();
        this.hls = null;
      }

      this.hls = new Hls({
        debug: false,
      });
      this.hls.loadSource(url);
      this.hls.attachMedia(this.audio);
    }
  }

  audioEvents(event) {
    switch (event.type) {
      case 'loadedmetadata':
        if (this._current.live) {
          this._currentDuration = '00:00';
        } else {
          this._currentDuration = timeStyle(this.audio.duration);
        }

        this._eles.totalTime.innerHTML = this._currentDuration;
        this._eles.currentTitle.innerHTML = this._current.live ? '当前直播: ' + this._current.title : '当前播放: ' + this._current.title;
        break;
      case 'play':
      case 'pause':
        if (event.type === 'play') {
          if (this._firstPlayed === false) {
            // 第一次播放
            this._eles.prevBtn.addEventListener('click', this.prev.bind(this));
            this._eles.nextBtn.addEventListener('click', this.next.bind(this));

            this._firstPlayed = true;
          }

          if (this._options.loop) {
            this._eles.nextBtn.classList.remove('voice-btn-disable');
            this._eles.prevBtn.classList.remove('voice-btn-disable');
          } else {
            // 不是循环播放
            // eslint-disable-next-line no-lonely-if
            if (Number(this._currentIndex) === 0) {
              this._eles.prevBtn.classList.add('voice-btn-disable');
              this._eles.nextBtn.classList.remove('voice-btn-disable');
            } else if (Number(this._currentIndex) === this._playlist.length - 1) {
              this._eles.nextBtn.classList.add('voice-btn-disable');
              this._eles.prevBtn.classList.remove('voice-btn-disable');
            } else {
              this._eles.nextBtn.classList.remove('voice-btn-disable');
              this._eles.prevBtn.classList.remove('voice-btn-disable');
            }
          }

          this._eles.playBtn.classList.add('voice-btn-pause');
          this._isPlay = true;
          this._lastUrl = this._current.url;
        } else {
          this._eles.playBtn.classList.remove('voice-btn-pause');
          this._isPlay = false;
        }

        // eslint-disable-next-line no-unused-expressions
        this._options.watchState && typeof this._options.watchState === 'function' ? this._options.watchState({
          ...this._current,
          audioObj: this.audio,
          isPlay: this._isPlay,
          currentIndex: this._currentIndex,
        }) : null;

        break;
      case 'ended':
        if (this._options.continuous) {
          // 连续
          this.next();
        }
        break;
      case 'playing':
        break;
      case 'volumechange':
        // eslint-disable-next-line no-case-declarations
        const currentVolume = this.getVolume();
        if (currentVolume === 0) {
          this._eles.muteBtn.classList.add('voice-btn-muted');
          this._eles.volumeProgressInner.style.width = 0;
        } else {
          this._eles.muteBtn.classList.remove('voice-btn-muted');
          this._eles.volumeProgressInner.style.width = currentVolume * 100 + '%';
        }
        break;
      case 'timeupdate':
        if (this._current.live) {
          this._eles.currentTime.innerHTML = '00:00';
          this._eles.audioProgressInner.style.width = '0%';
        } else {
          this._eles.currentTime.innerHTML = timeStyle(this.audio.currentTime);
          this._eles.audioProgressInner.style.width = this.audio.currentTime / this.audio.duration * 100 + '%';
        }

        break;
      case 'error':
        break;
      case 'canplay':
      case 'canplaythrough':
        this._eles.playBtn.classList.remove('voice-btn-disable');
        break;
      case 'durationchange':
        break;
      default:
        break;
    }
  }

  playStop(e) {
    if (this._current) {
      if (this._isPlay) {
        this.pause();
      } else {
        this.play();
      }
    }
  }

  pause() {
    if (this.audio) {
      isIE();
      this.audio.pause();
    }
    if (this.hls) {
      this.hls.stopLoad();
    }
  }

  play() {
    isIE();
    this.hls && this.hls.startLoad();
    this.audio && this.audio.play();
  }

  addAudioEventListeners(audio) {
    if (this.lastEvents === undefined) {
      this.lastEvents = this.audioEvents.bind(this);
    } else {
      audio.removeEventListener('play', this.lastEvents);
      audio.removeEventListener('pause', this.lastEvents);
      audio.removeEventListener('ended', this.lastEvents);
      audio.removeEventListener('error', this.lastEvents);
      audio.removeEventListener('volumechange', this.lastEvents);
      audio.removeEventListener('loadedmetadata', this.lastEvents);
      audio.removeEventListener('loadeddata', this.lastEvents);
      audio.removeEventListener('timeupdate', this.lastEvents);

      audio.removeEventListener('canplay', this.lastEvents);
      audio.removeEventListener('playing', this.lastEvents);
      audio.removeEventListener('canplaythrough', this.lastEvents);
      audio.removeEventListener('durationchange', this.lastEvents);
    }

    audio.addEventListener('play', this.lastEvents);
    audio.addEventListener('pause', this.lastEvents);
    audio.addEventListener('ended', this.lastEvents);
    audio.addEventListener('error', this.lastEvents);
    audio.addEventListener('volumechange', this.lastEvents);
    audio.addEventListener('loadedmetadata', this.lastEvents);
    audio.addEventListener('loadeddata', this.lastEvents);
    audio.addEventListener('timeupdate', this.lastEvents);

    audio.addEventListener('canplay', this.lastEvents);
    audio.addEventListener('playing', this.lastEvents);
    audio.addEventListener('canplaythrough', this.lastEvents);
    audio.addEventListener('durationchange', this.lastEvents);
  }

  append(param) {
    if (thisTypeOf(param) === '[object Array]') {
      if (this._currentIndex === this._playlist.length - 1 && this._options.loop === false) {
        this._eles.nextBtn.classList.remove('voice-btn-disable');
      }
      this._playlist = this._playlist.concat(param);
    }
    if (thisTypeOf(param) === '[object Object]') {
      if (this._currentIndex === this._playlist.length - 1 && this._options.loop === false) {
        this._eles.nextBtn.classList.remove('voice-btn-disable');
      }
      this._playlist.push(param);
    }
  }

  prev() {
    if (this._playlist.length > 0) {
      let num;
      if (this._options.loop) {
        num = (this._currentIndex + this._playlist.length - 1) % this._playlist.length;
      } else {
        num = this._currentIndex - 1;
      }
      this.jump(num);
    }
  }

  next() {
    if (this._playlist.length > 0) {
      let num;
      if (this._options.loop) {
        num = (this._currentIndex + 1) % this._playlist.length;
      } else {
        num = this._currentIndex + 1;
      }
      this.jump(num);
    }
  }

  jump(num) {
    if (this._playlist[num]) {
      if (num === this._currentIndex && this._playlist[num] === this._current) {
        if (this._isPlay) {
          this.pause();
        } else {
          this.play();
        }
      } else {
        if (this._isPlay) {
          this.pause();
        }
        setTimeout(() => {
          this._currentIndex = num;
          this._current = this._playlist[this._currentIndex];
          this._load(this._current.url);
        }, 0);
      }
    }
  }

  mousedownHanlder(e) {
    var { target } = e;
    this._move = true;
    this._x = e.pageX;
    this._currentDistance = target.offsetLeft + target.clientWidth / 2;
  }

  mousemoveHanlder(e) {
    if (this._move) {
      const diff = e.pageX - this._x;
      let sum = this._currentDistance + diff;

      if (sum < 0) {
        sum = 0;
      }

      if (sum > this._volumeProgressWidth) {
        sum = this._volumeProgressWidth;
      }

      const percent = sum / this._volumeProgressWidth;
      this.setVolume(percent.toFixed(2));
    }
  }

  mouseupHanlder(e) {
    this._move = false;
  }

  getVolume() {
    return this.audio.volume;
  }

  setVolume(number) {
    if (number >= 0 || number <= 1) {
      this.audio.volume = Number(number);
    }
  }

  mute() {
    if (this.getVolume() === 0) {
      this.setVolume(this.volume);
    } else {
      this.volume = this.getVolume();
      this.setVolume(0);
    }
  }

  seek(event) {
    const scale = Number((event.offsetX / this._audioProgressWidth).toFixed(2));

    if (this._isPlay && this._current.live === false) {
      if (isNumber(this.audio.duration)) {
        this.audio.currentTime = this.audio.duration * scale;
      }
    }
  }

  bindDOM() {
    this._eles.playBtn.addEventListener('click', this.playStop.bind(this));
    this._eles.muteBtn.addEventListener('click', this.mute.bind(this));
    this._eles.audioProgress.addEventListener('click', this.seek.bind(this));

    this._eles.volumeHand.addEventListener('mousedown', this.mousedownHanlder.bind(this));
    document.addEventListener('mousemove', this.mousemoveHanlder.bind(this));
    document.addEventListener('mouseup', this.mouseupHanlder.bind(this));
  }

  offBindDOM() {
    this._eles.playBtn.removeEventListener('click', this.playStop.bind(this));
    this._eles.muteBtn.removeEventListener('click', this.mute.bind(this));

    this._eles.volumeHand.removeEventListener('mousedown', this.mousedownHanlder.bind(this));
    document.removeEventListener('mousemove', this.mousemoveHanlder.bind(this));
    document.removeEventListener('mouseup', this.mouseupHanlder.bind(this));
  }

  destroy() {
    this.trigger(Hls.Events.DESTROYING);
    this.detachMedia();
    this.removeAllListeners();
    this._autoLevelCapping = -1;
    this.url = null;
    this.networkControllers.forEach(function (component) {
      return component.destroy();
    });
    this.networkControllers.length = 0;
    this.coreComponents.forEach(function (component) {
      return component.destroy();
    });
    this.coreComponents.length = 0;

    this.offBindDOM();
  }
}
