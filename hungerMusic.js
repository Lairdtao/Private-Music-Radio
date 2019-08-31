var EventCenter = {
    on: function(type, handler) {
        $(document).on(type, handler)
    },
    fire: function(type, data) {
        $(document).trigger(type, data)
    }
}


var footer = {
    init: function() { //初始化
        this.$footer = $('footer')
        this.$ul = this.$footer.find('ul')
        this.$box = this.$footer.find('.box')
        this.$leftbtn = this.$footer.find('.icon-left')
        this.$rightbtn = this.$footer.find('.icon-right')
        this.isToEnd = false
        this.isToStart = true
        this.isAnimate = false
        this.bind()
        this.render()
    },
    bind: function() { //绑定事件
        var _this = this
        this.$rightbtn.on('click', function() {
            if (_this.isAnimate) return
            var itemwidth = _this.$box.find('li').outerWidth(true)
            var rowCount = Math.floor(_this.$box.width() / itemwidth)


            if (!_this.isToEnd) { //如果没有到结束,则进行以下事件
                _this.isAnimate = true
                _this.$ul.animate({
                    left: '-=' + rowCount * itemwidth
                }, 400, function() {
                    _this.isAnimate = false //使动画在完成之前事件点击无效,防止点击过快导致动画崩溃
                    _this.isToStart = false
                    if (parseFloat(_this.$box.width()) - parseFloat(_this.$ul.css('left')) >= parseFloat(_this.$ul.css('width'))) {
                        _this.isToEnd = true
                    }
                })
            }
        })
        this.$leftbtn.on('click', function() {
            if (_this.isAnimate) return
            var itemwidth = _this.$box.find('li').outerWidth(true)
            var rowCount = Math.floor(_this.$box.width() / itemwidth)

            if (!_this.isToStart) {
                _this.isAnimate = true

                _this.$ul.animate({
                    left: '+=' + rowCount * itemwidth
                }, 400, function() {
                    _this.isAnimate = false

                    _this.isToEnd = false
                    if (parseFloat(_this.$ul.css('left')) >= 0) {
                        _this.isToStart = true
                    }
                })
            }
        })
        this.$footer.on('click', 'li', function() {
            $(this).addClass('active')
                .siblings().removeClass('active')
            EventCenter.fire('select-albumn', {
                channelId: $(this).attr('data-channel-id'),
                channelName: $(this).attr('data-channel-name')
            })
        })
    },
    render: function() { //获取数据
        var _this = this
        $.getJSON('https://jirenguapi.applinzi.com/fm/getChannels.php').done(function(ret) {
            console.log(ret);
            _this.renderfooter(ret.channels)
        }).fail(function() {
            console.log('error');
        })
    },




    renderfooter: function(data) {
        var _this = this
        var html = ''
        data.forEach(function(channel) {
            html += '<li data-channel-id=' + channel.channel_id + ' data-channel-name=' + channel.name + '>' +
                ' <div class="cover" style="background-image:url(' + channel.cover_small + ')"></div>' +
                ' <h3>"' + channel.name + '"</h3>' +
                '</li>'
            _this.$ul.html(html)
        })
        _this.setStyle()
    },


    setStyle: function() {
        var count = this.$footer.find('li').length //查找li的总数量 ,这里不能缩写,数据未到时li为空
        var width = this.$footer.find('li').outerWidth(true) //查找li的长度包括外边距
        console.log(count, width);
        this.$ul.css({ //给ul设置长度为li的数量乘上长度
            width: count * width + 'px',
        })
    }
}


var Fm = {
    init: function() {
        this.$container = $('#page-music')
        this.audio = new Audio()
        this.audio.autoplay = true

        this.bind()
    },
    bind: function() {
        var _this = this
        EventCenter.on('select-albumn', function(e, channelobj) {
            _this.channelId = channelobj.channelId
            _this.channelName = channelobj.channelName
            _this.loadMusic()
        })

        this.$container.find('.btn-play').on('click', function() {
            var $btn = $(this)
            if ($btn.hasClass('icon-play')) {
                $btn.removeClass('icon-play').addClass('icon-stop')
                _this.audio.play()
            } else {
                $btn.removeClass('icon-stop').addClass('icon-play')
                _this.audio.pause()
            }
        })
        this.$container.find('.btn-next').on('click', function() {
            _this.loadMusic(function() {
                _this.setMusic()
            })
        })
        this.audio.addEventListener('play', function() {
            console.log('ok');
            clearInterval(_this.timecolck)
            _this.timecolck = setInterval(function() {
                    _this.updateStatus()
                }, 1000) //设置计时器,每秒刷新一次
        })

        this.audio.addEventListener('pause', function() {
            clearInterval(_this.timecolck) //清除计时器
        })
    },
    loadMusic() {
        var _this = this
        console.log('loadMusic....');
        $.getJSON('https://jirenguapi.applinzi.com/fm/getSong.php', { channel: _this.channelId })
            .done(function(ret) {
                _this.song = ret['song'][0]
                _this.setMusic()
                _this.loadLyric()
            })
    },
    loadLyric() {
        var _this = this
        console.log('loadMusic....');
        $.getJSON('https://jirenguapi.applinzi.com/fm/getLyric.php', { sid: this.song.sid })
            .done(function(ret) {
                var lyric = ret.lyric
                var lyricobj = {}
                lyric.split('\n').forEach(function(line) {
                    //[0.1:12.24][0.1:48.09]
                    var times = line.match(/\d{2}:\d{2}/g)
                        //times==['0.1:12.24']['0.1:48.09']
                    var str = line.replace(/\[.+?\]/g, '')
                    if (Array.isArray(times)) { //如果它是数组则进行以下函数(有些为空所以不是数组)
                        times.forEach(function(time) {
                            lyricobj[time] = str
                        })
                    }

                })
                _this.lyricobj = lyricobj
            })
    },

    setMusic: function() {
        var _this = this
        console.log(this.song)
        this.audio.src = this.song.url
        $('.bg').css('background-image', 'url(' + this.song.picture + ')')
        _this.$container.find('.aside figure').css('background-image', 'url(' + this.song.picture + ')')
        _this.$container.find('.detail h1').text(this.song.title)
        _this.$container.find('.detail .author').text(this.song.artist)
        _this.$container.find('.tag').text(this.channelName)
        _this.$container.find('.btn-play').removeClass('icon-play').addClass('icon-stop') //每次切换歌曲时重置播放按钮
    },
    updateStatus: function() {
        var min = Math.floor(this.audio.currentTime / 60)
        var second = Math.floor(Fm.audio.currentTime % 60) + '' //加上空格变成字符串
        second = second.length === 2 ? second : '0' + second
        this.$container.find('.time').text(min + ':' + second)
            //设置进度条百分比长度
        this.$container.find('.bar-progress').css('width', this.audio.currentTime / this.audio.duration * 100 + '%')

        var line = this.lyricobj['0' + min + ':' + second]
        if (line) {
            this.$container.find('.lyric p').text(line).boomText()
        }
    }
}

$.fn.boomText = function(type) {
    type = type || 'rollIn'
    console.log(type)
    this.html(function() {
        var arr = $(this).text()
            .split('')
            .map(function(word) {
                return '<span class="boomText">' + word + '</span>'
            })
        return arr.join('')
    })
    var index = 0
    var $boomTexts = $(this).find('span')
    var clock = setInterval(function() {
        $boomTexts.eq(index).addClass('animated ' + type)
        index++
        if (index >= $boomTexts.length) {
            clearInterval(clock)
        }
    }, 300)
}
footer.init()
Fm.init()