$(function() {
  let lastRadioLoad = 'record';
  var pageIndex = 1;
  var radioList;

  var audioList = [
    {
      live: false,
      title: '两部门印发通知：严格规范涉及保险理赔司法鉴定工作(m3u8)',
      url: 'https://mediastorage.cnr.cn/record/audio/cnr/ygxw/2021/1129/dd83d8bd9d10c1638159162435322580/dd83d8bd9d10c1638159162435322580.m3u8?auth=8da8e77322d90f0b7c1d2ed153097d52',
    },
    {
      live: false,
      title: '国家卫健委向内蒙古派出工作组指导疫情处置工作(m3u8)',
      url: 'https://mediastorage.cnr.cn/record/audio/cnr/ygxw/2021/1129/5ba86c876cf2b163817551004275227/5ba86c876cf2b163817551004275227.m3u8?auth=ba1e73aae40af2cf7b7cfca3e0c4f3f0',
    },

    {
      live: false,
      title: '（长）北京警方对摩托车非法改装行为开展持续整治工作(m3u8)',
      url: 'https://mediastorage.cnr.cn/record/audio/cnr/ygxw/2021/1204/fc0abfe5e3bdf1638620176028636741/fc0abfe5e3bdf1638620176028636741.m3u8?auth=67d4e6dab040e47dc83b23c3fafbe4a5',
    },
    {
      live: false,
      title: '江西省人大常委会副主任龚建华涉嫌严重违纪违法接受审查调查(mp3)',
      url: 'https://mediastorage.cnr.cn/record/audio/cnr/ygxw/2021/1129/c108d9ffef64d163815913152169293/c108d9ffef64d163815913152169293.mp3?auth=0801240afece6013a0477cc8cc0a1e0b',
    },
    {
      live: false,
      title: '中国短道速滑队获北京冬奥满额资格(mp3)',
      url: 'https://mediastorage.cnr.cn/record/audio/cnr/ygxw/2021/1129/f965081186c641638159091997737962/f965081186c641638159091997737962.mp3?auth=67b295d8e32ef89426f52dff730f5130',
    },
  ];

  function render(array) {
    var str = '';
    for (let i = 0; i < array.length; i++) {
      str += '<li>' + array[i].title + '</li>';
    }
    $('#list').append(str);
  }

  render(audioList);

  $('#list').on('click', 'li', function() {
    var CURRENT = 'record';
    var index = $(this).index();
    if (lastRadioLoad !== CURRENT) {
    // 需要重新load
      radio.reload(audioList);
      lastRadioLoad = CURRENT;
    }
    radio.jump(index);
  });
  $('#live-list').on('click', '.item', function() {
    var CURRENT = 'live';
    var index = $(this).index();
    if (lastRadioLoad !== CURRENT) {
    // 需要重新load
      radio.reload(radioList);
      lastRadioLoad = CURRENT;
    }
    radio.jump(index);
  });

  const radio = new CRadio('.voice-wrapper', {
    continuous: true, // 连续播放
    loop: true, // 禁止循环播放
    controls: {
      playBtn: '.voice-btn-play',
      prevBtn: '.voice-btn-prev',
      nextBtn: '.voice-btn-next',
      muteBtn: '.voice-btn-mute',
      totalTime: '.voice-time-total',
      currentTime: '.voice-time-current',
      currentTitle: '.voice-title',
      volumeProgress: '.voice-volume-progress',
      audioProgress: '.voice-audio-progress',
    },
    watchState: watchStateHandler,
  });

  function watchStateHandler(states) {
    console.log('watchState', states);
    if (states.isPlay) {
    // 正在播放
      if (states.live) {
      // 是直播
        $('.item').eq(states.currentIndex).addClass('current');
      } else {
      // 录播
        $('li').eq(states.currentIndex).addClass('current');
      }
    } else {
    // 暂停
      // eslint-disable-next-line no-lonely-if
      if (states.live) {
      // 直播
        $('.item').eq(states.currentIndex).removeClass('current');
      } else {
      // 录播
        $('li').eq(states.currentIndex).removeClass('current');
      }
    }
  }

  radio.load(audioList);

  $('.getList').on('click', function() {
  // 栏目接口
    var settings = {
      url: 'http://apppc.cnr.cn/cnr45609411d2c5a16/e281277129d478c12c2ed58e84ca906b/f76a0411ae1ff31be9f9e28f0b51348b',
      method: 'POST',
      timeout: 0,
      headers: {
        'Content-Type': 'application/json',
      },
      dataType: 'json',
      data: JSON.stringify({
        chanId: '83', // 早出发
        pageIndex: pageIndex,
        perPage: 5,
        lastNewsId: '',
        docPubTime: '',
      }),
    };

    $.ajax(settings).done(function (response) {
      if (response && Number(response.code) === 200) {
        if (response.message.toUpperCase() === 'SUCCESS') {
          let str = '';
          if (response.data.categories.length === 0) {
            str += '<p>当前日期暂无数据</p>';
          } else {
            const items = response.data.categories[0].detail;

            const newItems = items.map(function(item) {
              return {
                title: item.name,
                url: item.other_info9,
                live: false,
              };
            });

            render(newItems);
            radio.append(newItems);
            pageIndex += 1;
          }
        } else {
          console.log(response.message);
        }
      } else {
        console.log(response.code);
      }
    });
  });

  const renderLive = function(array) {
    var str = '';
    for (let i = 0; i < array.length; i++) {
      str += '<div class="item">'
            + '<img src="' + array[i].img + '">'
            + '<div class="name">' + array[i].title + '</div>'
          + '</div>';
    }
    $('#live-list').append(str);
  };

  $('.reload').on('click', function() {
    $.ajax({
      url: 'http://pacc.radio.cn/ygw/getlivebytype',
      method: 'get',
      dataType: 'json',
      data: {
        chanType: 1,
        pageIndex: 1,
        perPage: 17,
      },
    }).done(function (response) {
      console.log(response);
      radioList = response.data.categories[0].detail.map(function(item) {
        return {
          title: item.name,
          img: item.other_info6,
          url: item.other_info11[2].url,
          live: true,
        };
      });

      renderLive(radioList);

      // 切换直播
    /* radio.destroy()
    radio = new Radio('.voice-wrapper', {
      continuous: true, //连续播放
      loop: false, // 禁止循环播放
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
      watchState: watchStateHandler
    })
    radio.load(radioList) */
    // radio.load(radioList)
    // radio.append(radioList)
    });
  });
});
