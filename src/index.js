import Hls from 'hls.js';
import { thisTypeOf, timeStyle, dom, isIE, isiPhone, createDom } from './utils'

export default class Radio {
  constructor(container, options) {
    this.container = document.querySelector(container)
    this.options = options;
    this.MEDIA = null;
    this._audioCtx = null;
    this._hls = null;
    this._firstPlayed = false;
    this._currentDuration = '';
    this._url = '';
    this._playlist = null;
    this._lastIndex = null;
    this._currentDistance = 0;
    this._move = false;
    this._x = 0;
    this._volumeProgressWidth = 0;

    this.eles = {};

    
    

    for (const [key, value] of Object.entries(this.options.controls)) {
      this.eles[key] = createDom(value)
      if (key == 'volumeProgress') {
        this.eles.volumeProgressInner = createDom('.voice-volume-progress-inner');
        this.eles.volumeHand = createDom('.voice-volume-progress-handle');
        this.eles.volumeProgressInner.appendChild(this.eles.volumeHand)
        this.eles[key].appendChild(this.eles.volumeProgressInner)
      }
      if (key == 'audioProgress') {
        this.eles.audioProgressInner = createDom('.voice-audio-progress-inner')
        this.eles.audioProgressHand = createDom('.voice-audio-progress-handle')
        this.eles.audioProgressInner.appendChild(this.eles.audioProgressHand)
        this.eles[key].appendChild(this.eles.audioProgressInner)
      }
    }

    console.log(this.eles)
    this.renderHtml(this.container)

    this.init()
  }

  renderHtml(dom){
    var voiceDom = createDom('.voice')
    var voiceController = createDom('.voice-controller')

    if (this.eles.totalTime || this.eles.currentTime || this.eles.audioProgress) {
      var middle = createDom('.voice-middle')
      var center = createDom('.voice-center')

      if (this.eles.audioProgress) {
        center.appendChild(this.eles.audioProgress)
      }
      if (this.eles.totalTime || this.eles.currentTime) {
        var time = createDom('.voice-time')
        time.innerHTML = '/'
        this.eles.currentTime.innerHTML = '00:00'
        time.prepend(this.eles.currentTime)
        this.eles.totalTime.innerHTML = '00:00'
        time.appendChild(this.eles.totalTime)
        center.appendChild(time)
      }
      if (this.eles.currentTitle) {
        center.appendChild(this.eles.currentTitle)
      }
      middle.appendChild(center)
      voiceController.appendChild(middle)
    }

    if (this.eles.playBtn || this.eles.prevBtn || this.eles.nextBtn) {
      var left = createDom('.voice-left')
      if (this.eles.nextBtn || this.eles.prevBtn) {
        left.appendChild(this.eles.prevBtn)
        left.appendChild(this.eles.playBtn)
        left.appendChild(this.eles.nextBtn)
      } else {
        left.appendChild(this.eles.playBtn)
      }
      voiceController.appendChild(left)
    }
    
    if (this.eles.volumeProgress || this.eles.muteBtn) {
      var right = createDom('.voice-right')
      var volume = createDom('.voice-volume')
      if (this.eles.muteBtn) {
        volume.appendChild(this.eles.muteBtn)
      }
      if (this.eles.volumeProgress) {
        volume.appendChild(this.eles.volumeProgress)
      }
      right.appendChild(volume)
      voiceController.appendChild(right)
    }

    voiceDom.appendChild(voiceController)

    dom.appendChild(voiceDom)

  }

  init() {
    this._volumeProgressWidth = this.eles['volumeProgress'].clientWidth

    this.MEDIA = new Audio();
    this.MEDIA.crossOrigin = 'anonymous';
    if (window.AudioContext || window.webkitAudioContext) {
      this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var source = this._audioCtx.createMediaElementSource(this.MEDIA);
      source.connect(this._audioCtx.destination);
    }

    if (this.MEDIA.canPlayType('application/vnd.apple.mpegurl')) {
      // 浏览器默认支持m3u8
      console.log("默认支持m3u8")
    } else if (Hls.isSupported()) {
      // 支持hls
      this._hls = new Hls({
        debug: false
      });
      this._hls.attachMedia(this.MEDIA);
      this._hls.on(Hls.Events.MEDIA_ATTACHED, function () {
        console.log('已经绑定了');
      });
    } else {
      console.log('请升级您的浏览器')
    }

    this.bindDOM()

    this.MEDIA.addEventListener('play', this.audioEvents.bind(this))
    this.MEDIA.addEventListener('pause', this.audioEvents.bind(this))
    this.MEDIA.addEventListener('ended', this.audioEvents.bind(this))
    this.MEDIA.addEventListener('error', this.audioEvents.bind(this))
    this.MEDIA.addEventListener('volumechange', this.audioEvents.bind(this))
    this.MEDIA.addEventListener('loadedmetadata', this.audioEvents.bind(this))
    this.MEDIA.addEventListener('timeupdate', this.audioEvents.bind(this))
  }

  _load(e) {
    this.pause()
    if (e.indexOf(".m3u8") <= 1) {
      // 不是m3u8格式的
      this.MEDIA.src = e,
      this.MEDIA.load()
    } else {
      isIE();
      this._hls.trigger(Hls.Events.MEDIA_ATTACHING, {
        media: this.MEDIA
      });
      this.loadSource(e)
    }
    isIE() || this._audioCtx.resume()

    /*
    if(this._playlist[this._currentIndex].live){
      // 直播
      this.MEDIA.removeEventListener('loadedmetadata', this.audioEvents.bind(this))
      this.MEDIA.removeEventListener('timeupdate', this.audioEvents.bind(this))
      this.eles.totalTime.innerHTML = '00:00';
    } else {
      // 避免重复重新绑定
      this.MEDIA.addEventListener('loadedmetadata', this.audioEvents.bind(this))
      this.MEDIA.addEventListener('timeupdate', this.audioEvents.bind(this))
    }
    */
  }

  load(e) {
    e.length > 0 && (this._playlist = [].concat(e),
    this._currentIndex = 0,
    this._load(this._playlist[this._currentIndex].url))

    
  }

  loadSource(e) {
    this._url = e,
    isiPhone() && (this.MEDIA.src = e),
    this._hls.trigger(Hls.Events.MANIFEST_LOADING, {
        url: e
    })
  }

  startLoad(e){
    void 0 === e && (e = -1),
    this._hls.networkControllers.forEach(function(t){
      t.startLoad(e)
    })
  }

  

  audioEvents(event){
    switch (event.type) {
      case 'loadstart':
          this.eles.playBtn.classList.add('loading')
          break;
      case 'loadedmetadata':
          if (this._playlist[this._currentIndex].live){
            this._currentDuration = '00:00'
          } else {
            this._currentDuration = timeStyle(this.MEDIA.duration)
          }
          console.log('_currentDuration', this._currentDuration)
          if (this._firstPlayed == true) {
            this.eles.totalTime.innerHTML = this._currentDuration
          }
          break;
      case 'play':
      case 'pause':
        if (event.type == "play") {
          this.eles.currentTitle.innerHTML = this._playlist[this._currentIndex].live ? '正在直播:' + this._playlist[this._currentIndex].title : '正在播放:' + this._playlist[this._currentIndex].title
          if (this._firstPlayed == false) {
            // 第一次播放
            this.eles.totalTime.innerHTML = this._currentDuration
            if (this.options.loop) {
              this.eles.nextBtn.classList.remove('voice-btn-disable')
              this.eles.prevBtn.classList.remove('voice-btn-disable')
            } else {
              // 不是循环播放
              console.log('不是循环播放')
              if (this._currentIndex == 0) {
                this.eles.prevBtn.classList.add('voice-btn-disable')
              } else
              if (this._currentIndex == this._playlist.length -1) {
                this.eles.nextBtn.classList.add('voice-btn-disable')
              } else {
                this.eles.nextBtn.classList.remove('voice-btn-disable')
                this.eles.prevBtn.classList.remove('voice-btn-disable')
              }
            }
            
            this.eles.prevBtn.addEventListener('click', this.prev.bind(this))
            this.eles.nextBtn.addEventListener('click', this.next.bind(this))

            this._firstPlayed = true

          }
          
          this.eles.playBtn.classList.add('voice-btn-pause')
          this._isPlay = true
          
        } else {
          this.eles.playBtn.classList.remove('voice-btn-pause')
          this._isPlay = false
        }

        this.options.watchState && typeof this.options.watchState == 'function' ? this.options.watchState({
          currentIndex: this._currentIndex,
          isPlay: this._isPlay,
          live: this._playlist[this._currentIndex].live
        }) : null;

        break;
      case 'ended':
        if (this.options.continuous) {
          // 连续
          this.next()
        }
        break;
      case 'volumechange':
          var currentVolume = this.getVolume()
          if (currentVolume == 0) {
              this.eles.muteBtn.classList.add('voice-btn-muted')
              this.eles.volumeProgressInner.style.width = 0
          } else {
              this.eles.muteBtn.classList.remove('voice-btn-muted')
              this.eles.volumeProgressInner.style.width = currentVolume * 100 + '%'
          }
          break;
      case 'timeupdate':
        if (this._playlist[this._currentIndex].live) {
          this.eles.currentTime.innerHTML = '00:00'
          this.eles.audioProgressInner.style.width = "0%"
        } else {
          this.eles.currentTime.innerHTML = timeStyle(this.MEDIA.currentTime)
          this.eles.audioProgressInner.style.width = this.MEDIA.currentTime / this.MEDIA.duration * 100 + "%"
        }
        
          break;
      case 'error':
          alert('音频加载错误！')
          break;
      case 'canplay':
        this.eles.playBtn.classList.remove('loading')
        break;
      default:
          break
    }
  }

  playStop(e) {
    if (this._isPlay === true) {
      this.pause()
    } else {
      if (this._firstPlayed === false) {
        var that = this;
        this._audioCtx.resume().then(() => {
          that.play()
        });
      } else {
        this.play()
      }
    }
    return false
  };

  pause(){
    if (this.MEDIA) {
      isIE()
      this.MEDIA.pause()
    }
    this.stopLoad()
  }

  play() {
    isIE(),
    this.startLoad(),
    this.MEDIA && this.MEDIA.play()
  }

  stopLoad(){
    this._hls.networkControllers.forEach((function(e) {
            e.stopLoad()
        }
    ))
  }

  append(param){
    if(thisTypeOf(param) == '[object Array]') {
      if (this._currentIndex == this._playlist.length - 1 && this.options.loop == false) {
        this.eles.nextBtn.classList.remove('voice-btn-disable')
      }
      this._playlist = this._playlist.concat(param)
    }
    if (thisTypeOf(param) == '[object Object]') {
      if (this._currentIndex == this._playlist.length - 1 && this.options.loop == false) {
        this.eles.nextBtn.classList.remove('voice-btn-disable')
      }
      this._playlist.push(param)
    }
    console.log(this._playlist)
  }

  prev() {
    if (this._playlist.length > 0) {
      if (this.options.loop) {
        this._currentIndex = (this._currentIndex + this._playlist.length - 1) % this._playlist.length,
        this._load(this._playlist[this._currentIndex].url),
        this.play()
      } else {
        if (this._currentIndex > 0) {
          if (this._currentIndex == this._playlist.length - 1) {
            this.eles.nextBtn.classList.remove('voice-btn-disable')
          }
          this._currentIndex = this._currentIndex - 1
          this._load(this._playlist[this._currentIndex].url),
          this.play()
          if (this._currentIndex == 0) {
            this.eles.prevBtn.classList.add('voice-btn-disable')
          }
        }
      }
      
    }
  }

  next() {
    if (this._playlist.length > 0) {
      if (this.options.loop) {
        // 循环
        this._currentIndex = (this._currentIndex + 1) % this._playlist.length,
        this._load(this._playlist[this._currentIndex].url),
        this.play()
      } else {
        // 不循环
        console.log("连续但是不循环")
        if (this._currentIndex < this._playlist.length - 1) {
          if (this._currentIndex == 0) {
            this.eles.prevBtn.classList.remove('voice-btn-disable')
          }
          this._currentIndex = this._currentIndex + 1
          console.log('当前index', this._currentIndex)
          this._load(this._playlist[this._currentIndex].url),
          this.play()
          if (this._currentIndex == this._playlist.length - 1) {
            this.eles.nextBtn.classList.add('voice-btn-disable')
          }
        }
      }
    }
  }

  jump(num) {
    console.log('jump', num)
    console.log('jump', this._currentIndex)
    
    if (this._currentIndex == num) {
      if (this._firstPlayed == false) {
        // 第一次播放
        this._currentIndex = num,
        this._load(this._playlist[this._currentIndex].url)
        this.play()
      } else {
        if (this._isPlay) {
          // 正在播放，需要暂停
          this.pause()
        } else {
          this.play()
        }
      }
    } else {
      this._currentIndex = num,
      this._load(this._playlist[this._currentIndex].url)
      this.play()
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
        this.setVolume(percent)
        // if (currentHanlder.hasClass('progress-bar_handle')) {
        //     if (sum > audioProgressWidth) {
        //         sum = audioProgressWidth
        //     }

        //     var percent = sum / audioProgressWidth
        //     // 从指定的时间点开始播放
        //     this.api.seek(this.api.media.duration * percent)
        // }
    }
  }

  mouseupHanlder(e) {
    this._move = false
  }

  getVolume(){
    return this.MEDIA.volume
  }

  setVolume (number) {
    (number >= 0 || number <= 1) && (this.MEDIA.volume = number)
  }

  mute(){
    if (this.getVolume() == 0) {
      this.setVolume(this.volume)
    } else {
      this.setVolume(0)
    }
  }

  bindDOM(){
    this.eles.playBtn.addEventListener('click', this.playStop.bind(this))
    this.eles.muteBtn.addEventListener('click', this.mute.bind(this))
    
    
    this.eles.volumeHand.addEventListener('mousedown', this.mousedownHanlder.bind(this))
    document.addEventListener('mousemove', this.mousemoveHanlder.bind(this))
    document.addEventListener('mouseup', this.mouseupHanlder.bind(this))
  }

  offBindDOM(){
    this.eles.playBtn.removeEventListener('click', this.playStop.bind(this))
    this.eles.muteBtn.removeEventListener('click', this.mute.bind(this))
    
    
    this.eles.volumeHand.removeEventListener('mousedown', this.mousedownHanlder.bind(this))
    document.removeEventListener('mousemove', this.mousemoveHanlder.bind(this))
    document.removeEventListener('mouseup', this.mouseupHanlder.bind(this))
  }


  destroy() {
    this._hls.trigger(Hls.Events.DESTROYING),
    this.detachMedia(),
    this._hls.coreComponents.concat(this._hls.networkControllers).forEach((function(e) {
            e.destroy()
        }
    )),
    this._url = null,
    this._hls.removeAllListeners(),
    this._hls.autoLevelCapping = -1

    this.offBindDOM()
  }

  detachMedia(){
    this._hls.trigger(Hls.Events.MEDIA_DETACHING);
    this.MEDIA = null
  }
}





