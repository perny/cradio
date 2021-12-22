# CRadio
audio player support m3u8/mp3

## usage
- initialize CRadio
```javascript
var radio = new CRadio('.voice-wrapper', {
  continuous: true,
  loop: false, 
  controls: {
    playBtn: '.voice-btn-play',
    prevBtn: '.voice-btn-prev',
    nextBtn: '.voice-btn-next',
    muteBtn: '.voice-btn-mute',
    totalTime: '.voice-time-total',
    currentTime: '.voice-time-current',
    volumeProgress: '.voice-volume-progress',
    audioProgress: '.voice-audio-progress',
  },
  watchState: function(state) {
    console.log(state)
  }
})
```
- load playlist
```javascript
radio.load([
  "title": "audio title",
  "url": "audio url",
  "live": true/false
])
```
- add playlist
```javascript
radio.append({
  "title": "audio title",
  "url": "audio url",
  "live": true/false
})
or
radio.append([
  {
    "title": "audio title1",
    "url": "audio url1",
    "live": true/false
  },
  {
    "title": "audio title2",
    "url": "audio url2",
    "live": true/false
  }
])
```
- reset CRadio
```javascript
radio.destroy()
```
- reload CRadio
```javascript
radio.reload([
  {
    "title": "audio title1",
    "url": "audio url1",
    "live": true/false
  },
  {
    "title": "audio title2",
    "url": "audio url2",
    "live": true/false
  }
])