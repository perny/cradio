import Hls from 'hls.js';
import Promise from 'promise-polyfill';
import { thisTypeOf, timeStyle, prepend, isIE, isiPhone, createDom } from './utils'


export default class Radio{
  constructor(container, options) {
    this._container = document.querySelector(container)
    this._options = options;
    
    this.hls = null
    this.audio = document.createElement("audio")
    this.audio.autoplay = true
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
    this._current = null

    this._eles = {};

    
    

    for (const [key, value] of Object.entries(this._options.controls)) {
      this._eles[key] = createDom(value)
      if (key == 'volumeProgress') {
        this._eles.volumeProgressInner = createDom('.voice-volume-progress-inner');
        this._eles.volumeHand = createDom('.voice-volume-progress-handle');
        this._eles.volumeProgressInner.appendChild(this._eles.volumeHand)
        this._eles[key].appendChild(this._eles.volumeProgressInner)
      }
      if (key == 'audioProgress') {
        this._eles.audioProgressInner = createDom('.voice-audio-progress-inner')
        this._eles.audioProgressHand = createDom('.voice-audio-progress-handle')
        this._eles.audioProgressInner.appendChild(this._eles.audioProgressHand)
        this._eles[key].appendChild(this._eles.audioProgressInner)
      }
    }

    console.log(this)
    this.renderHtml(this._container)

    this.bindDOM();
    this._volumeProgressWidth = this._eles['volumeProgress'].clientWidth;
  }

  renderHtml(dom){
    var voiceDom = createDom('.voice')
    var voiceController = createDom('.voice-controller')

    if (this._eles.totalTime || this._eles.currentTime || this._eles.audioProgress) {
      var middle = createDom('.voice-middle')
      var center = createDom('.voice-center')

      if (this._eles.audioProgress) {
        center.appendChild(this._eles.audioProgress)
      }
      if (this._eles.totalTime || this._eles.currentTime) {
        var time = createDom('.voice-time')
        time.innerHTML = '/'
        this._eles.currentTime.innerHTML = '00:00'
        prepend(time, this._eles.currentTime)
        this._eles.totalTime.innerHTML = '00:00'
        time.appendChild(this._eles.totalTime)
        center.appendChild(time)
      }
      if (this._eles.currentTitle) {
        center.appendChild(this._eles.currentTitle)
      }
      middle.appendChild(center)
      voiceController.appendChild(middle)
    }

    if (this._eles.playBtn || this._eles.prevBtn || this._eles.nextBtn) {
      var left = createDom('.voice-left')
      if (this._eles.nextBtn || this._eles.prevBtn) {
        this._eles.prevBtn.classList.add('voice-btn-disable')
        this._eles.nextBtn.classList.add('voice-btn-disable')
        this._eles.playBtn.classList.add('voice-btn-disable')
        left.appendChild(this._eles.prevBtn)
        left.appendChild(this._eles.playBtn)
        left.appendChild(this._eles.nextBtn)
      } else {
        left.appendChild(this._eles.playBtn)
      }
      voiceController.appendChild(left)
    }
    
    if (this._eles.volumeProgress || this._eles.muteBtn) {
      var right = createDom('.voice-right')
      var volume = createDom('.voice-volume')
      if (this._eles.muteBtn) {
        volume.appendChild(this._eles.muteBtn)
      }
      if (this._eles.volumeProgress) {
        volume.appendChild(this._eles.volumeProgress)
      }
      right.appendChild(volume)
      voiceController.appendChild(right)
    }

    voiceDom.appendChild(voiceController)

    dom.appendChild(voiceDom)
  }

  _load(url) {
    if (url.indexOf(".m3u8") <= 1) {
      this.audio.src = url;
      this.audio.load();
    } else {
      this._loadsource(url)
    }

    this.addAudioEventListeners(this.audio)
  }

  load(e) {
    console.log('load')
    if (e.length > 0) {
      this._playlist = [].concat(e)
      //this._currentIndex = 0
      //this._current = this._playlist[this._currentIndex]
    }
  }

  reload(e){
    if (this._isPlay) {
      this.pause()
    }
    this.load(e)
  }

  _loadsource(url) {
    if (isiPhone()) {
      this.audio.src = url
    } else {
      if(this.hls) {
        this.hls.destroy()
        this.hls = null
      }
  
      this.hls = new Hls({
        debug: false
      })
      this.hls.loadSource(url)
      this.hls.attachMedia(this.audio)
    }
  }

  audioEvents(event){
    switch (event.type) {
      case 'loadedmetadata':
          if (this._current.live){
            this._currentDuration = '00:00'
          } else {
            this._currentDuration = timeStyle(this.audio.duration)
          }
          console.log('_currentDuration', this._currentDuration)
          
          this._eles.totalTime.innerHTML = this._currentDuration
          this._eles.currentTitle.innerHTML = this._current.live ? '当前直播: ' + this._current.title : '当前播放: ' + this._current.title
          break;
      case 'play':
      case 'pause':
        console.log(event.type)
        if (event.type == "play") {
          if (this._firstPlayed == false) {
            // 第一次播放
            this._eles.prevBtn.addEventListener('click', this.prev.bind(this))
            this._eles.nextBtn.addEventListener('click', this.next.bind(this))

            this._firstPlayed = true
          }

          if (this._options.loop) {
            this._eles.nextBtn.classList.remove('voice-btn-disable')
            this._eles.prevBtn.classList.remove('voice-btn-disable')
          } else {
            // 不是循环播放
            console.log('不是循环播放')
            if (this._currentIndex == 0) {
              this._eles.prevBtn.classList.add('voice-btn-disable')
              this._eles.nextBtn.classList.remove('voice-btn-disable')
            } else
            if (this._currentIndex == this._playlist.length -1) {
              this._eles.nextBtn.classList.add('voice-btn-disable')
              this._eles.prevBtn.classList.remove('voice-btn-disable')
            } else {
              this._eles.nextBtn.classList.remove('voice-btn-disable')
              this._eles.prevBtn.classList.remove('voice-btn-disable')
            }
          }
          
          this._eles.playBtn.classList.add('voice-btn-pause')
          this._isPlay = true
          this._lastUrl = this._current.url
        } else {
          this._eles.playBtn.classList.remove('voice-btn-pause')
          this._isPlay = false
        }

        this._options.watchState && typeof this._options.watchState == 'function' ? this._options.watchState({
          ...this._current,
          isPlay: this._isPlay,
          currentIndex: this._currentIndex
        }) : null;

        break;
      case 'ended':
        if (this._options.continuous) {
          // 连续
          this.next()
        }
        break;
      case 'playing':
        console.log('playing')
        break;
      case 'volumechange':
          var currentVolume = this.getVolume()
          console.log('currentVolume', currentVolume)
          if (currentVolume == 0) {
              this._eles.muteBtn.classList.add('voice-btn-muted')
              this._eles.volumeProgressInner.style.width = 0
          } else {
              this._eles.muteBtn.classList.remove('voice-btn-muted')
              this._eles.volumeProgressInner.style.width = currentVolume * 100 + '%'
          }
          break;
      case 'timeupdate':
        if (this._current.live) {
          this._eles.currentTime.innerHTML = '00:00'
          this._eles.audioProgressInner.style.width = "0%"
        } else {
          this._eles.currentTime.innerHTML = timeStyle(this.audio.currentTime)
          this._eles.audioProgressInner.style.width = this.audio.currentTime / this.audio.duration * 100 + "%"
        }
        
        break;
      case 'error':
        console.log('error', error)
        alert('音频加载错误！')
        break;
      case 'canplay':
      case 'canplaythrough':
        this._eles.playBtn.classList.remove('voice-btn-disable')
        console.log(event.type)
        break;
      case 'durationchange':
        console.log('durationchange')
        break;
      default:
          break
    }
  }

  playStop(e) {

    if (this._current) {
      if (this._isPlay) {
        this.pause()
      } else {
        this.play()
      }
    }
  };

  pause(){
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

  addAudioEventListeners(audio){
    audio.removeEventListener('play', this.audioEvents.bind(this))
    audio.removeEventListener('pause', this.audioEvents.bind(this))
    audio.removeEventListener('ended', this.audioEvents.bind(this))
    audio.removeEventListener('error', this.audioEvents.bind(this))
    audio.removeEventListener('volumechange', this.audioEvents.bind(this))
    audio.removeEventListener('loadedmetadata', this.audioEvents.bind(this))
    audio.removeEventListener('loadeddata', this.audioEvents.bind(this))
    audio.removeEventListener('timeupdate', this.audioEvents.bind(this))

    audio.removeEventListener('canplay', this.audioEvents.bind(this));
    audio.removeEventListener('playing', this.audioEvents.bind(this));
    audio.removeEventListener('canplaythrough', this.audioEvents.bind(this));
    audio.removeEventListener('durationchange', this.audioEvents.bind(this));


    audio.addEventListener('play', this.audioEvents.bind(this))
    audio.addEventListener('pause', this.audioEvents.bind(this))
    audio.addEventListener('ended', this.audioEvents.bind(this))
    audio.addEventListener('error', this.audioEvents.bind(this))
    audio.addEventListener('volumechange', this.audioEvents.bind(this))
    audio.addEventListener('loadedmetadata', this.audioEvents.bind(this))
    audio.addEventListener('loadeddata', this.audioEvents.bind(this))
    audio.addEventListener('timeupdate', this.audioEvents.bind(this))

    audio.addEventListener('canplay', this.audioEvents.bind(this));
    audio.addEventListener('playing', this.audioEvents.bind(this));
    audio.addEventListener('canplaythrough', this.audioEvents.bind(this));
    audio.addEventListener('durationchange', this.audioEvents.bind(this));
  }

  append(param){
    if(thisTypeOf(param) == '[object Array]') {
      if (this._currentIndex == this._playlist.length - 1 && this._options.loop == false) {
        this._eles.nextBtn.classList.remove('voice-btn-disable')
      }
      this._playlist = this._playlist.concat(param)
    }
    if (thisTypeOf(param) == '[object Object]') {
      if (this._currentIndex == this._playlist.length - 1 && this._options.loop == false) {
        this._eles.nextBtn.classList.remove('voice-btn-disable')
      }
      this._playlist.push(param)
    }
    console.log(this._playlist)
  }

  prev() {
    if (this._playlist.length > 0) {
      let num
      if (this._options.loop) {
        num = (this._currentIndex + this._playlist.length - 1) % this._playlist.length;
      } else {
        num = this._currentIndex - 1
      }
      this.jump(num)
    }
  }

  next() {
    if (this._playlist.length > 0) {
      let num
      if (this._options.loop) {
        num = (this._currentIndex + 1) % this._playlist.length;
      } else {
        num = this._currentIndex + 1
      }
      this.jump(num)
    }
  }

  jump(num) {
    console.log('jump', num)
    console.log('jump', this)

    if (this._playlist[num]) {
      if (num == this._currentIndex && this._playlist[num] == this._current) {
        if (this._isPlay) {
          this.pause()
        } else {
          this.play()
        }
      } else {
        if (this._isPlay) {
          this.pause()
        }
        setTimeout(() => {
          this._currentIndex = num;
          this._current = this._playlist[this._currentIndex]
          this._load(this._current.url)
        }, 0);
      }
    }
  }

  mousedownHanlder(e) {
    var target = e.target;
    this._move = true
    this._x = e.pageX;
    this._currentDistance = target.offsetLeft + target.clientWidth / 2
  }

  mousemoveHanlder(e) {
    if (this._move) {
        var diff = e.pageX - this._x;
        var sum = this._currentDistance + diff

        if (sum < 0) {
            sum = 0
        }

        if (sum > this._volumeProgressWidth) {
          sum = this._volumeProgressWidth
        }

        var percent = sum / this._volumeProgressWidth
        console.log(percent.toFixed(2))
        this.setVolume(percent.toFixed(2))
    }
  }

  mouseupHanlder(e) {
    this._move = false
  }

  getVolume(){
    return this.audio.volume
  }

  setVolume (number) {
    if (number >= 0 || number <= 1){
      console.log('number', Number(number))
      this.audio.volume = Number(number)
    }
  }

  mute(){
    console.log('mute')
    if (this.getVolume() == 0) {
      this.setVolume(this.volume)
    } else {
      this.volume = this.getVolume()
      this.setVolume(0)
    }
  }

  bindDOM(){
    console.log('bindDOM')
    this._eles.playBtn.addEventListener('click', this.playStop.bind(this))
    this._eles.muteBtn.addEventListener('click', this.mute.bind(this))
    
    
    this._eles.volumeHand.addEventListener('mousedown', this.mousedownHanlder.bind(this))
    document.addEventListener('mousemove', this.mousemoveHanlder.bind(this))
    document.addEventListener('mouseup', this.mouseupHanlder.bind(this))
  }

  offBindDOM(){
    this._eles.playBtn.removeEventListener('click', this.playStop.bind(this))
    this._eles.muteBtn.removeEventListener('click', this.mute.bind(this))
    
    
    this._eles.volumeHand.removeEventListener('mousedown', this.mousedownHanlder.bind(this))
    document.removeEventListener('mousemove', this.mousemoveHanlder.bind(this))
    document.removeEventListener('mouseup', this.mouseupHanlder.bind(this))
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

    this.offBindDOM()
  }

}





