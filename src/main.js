/*
 * @packet main; 
 * @require util.touch;
 * @css style.main;
 * @template template.temp;
 */
Module({
    name: "picplayer",
    extend: "viewgroup",
    className: "picplayer",
    layout:module.getTemplate("@temp","picplayer"),
    option: {},
    init: function () {
        this.addChild({
            type: "@.picframe",
            container: this.dom
        });
        this._width = this.dom.width();
    },
    event_progress:function(e){
        this.finders("loading").html("Loading... "+e.data+" %");
        e.stopPropagation();
    },
    event_ready: function () {
        this.finders("loading").remove();
        var ths = this, picframe = this.getChildAt(0);
        this.dom.touch(function (e) {
            if (e.action === "down") {
                ths._move = true;
            } else if (e.action === "move") {
                if (e.direction === "left" || e.direction === "right") {
                    var a = Math.round((e.xis / ths._width) * picframe.getFrameSize());
                    picframe.gotoAndStop(a);
                }
            } else {
                ths._move = false;
            }
        });
    }
});
Module({
    name: "picframe",
    extend: "view",
    className: "picframe",
    template: module.getTemplate("@temp", "picframe"),
    option: {
        basePath: "images/fd.",
        from: 1,
        to: 330,
        suffix: "jpeg",
        type: "fit",
        time: 50,
        autoplay: false,
        background: "black"
    },
    init: function () {
        this.current = 0;
        this.render();
        var cvs = this.finders("canvas").get(0);
        this._width = this.dom.width();
        this._height = this.dom.height();
        cvs.width = this._width;
        cvs.height = this._height;
        this.canvas = cvs;
        this.ctx = cvs.getContext("2d");
        this.dom.css("background", this.option.background);
        var ths = this;
        this.loadPics().done(function () {
            if (ths.option.autoplay) {
                ths.play();
            } else {
                ths.gotoAndStop(0);
            }
        });
    },
    loadPics: function () {
        var ths = this, ps = $.promise();
        var paths = [];
        for (var i = this.option.from; i <= this.option.to; i++) {
            var t = i + "", p = "";
            if (t.length === 1) {
                p = "00" + i;
            } else if (t.length === 2) {
                p = "0" + i;
            } else {
                p = i;
            }
            paths.push(this.option.basePath + p + "." + this.option.suffix);
        }
        var queue = $.queue(), images = [];
        queue.complete(function () {
            ths.images = images;
            ps.resolve();
            ths.dispatchEvent("ready");
        });
        queue.progress(function (a) {
            ths.dispatchEvent("progress", Math.round((a.runed / a.total) * 100));
        });
        for (var i in paths) {
            queue.add(function (a, b) {
                var tp = this;
                $.loader().image(b, function () {
                    images.push(this);
                    tp.next();
                });
            }, null, paths[i]);
        }
        queue.run();
        ths.dispatchEvent("start");
        return ps;
    },
    getFrameSize: function () {
        return this.images.length;
    },
    renderFrame: function () {
        var image = this.images[this.current];
        var type = this.option.type;
        var sprite = this;
        this.ctx.clearRect(0, 0, this._width, this._height);
        if (type === "fit") {
            var _w = 0, _h, _x = 0, _y = 0;
            if (image.width > sprite._width) {
                _w = sprite._width;
                _h = (image.height / image.width) * _w;
                if (_h > sprite._height) {
                    _h = sprite._height;
                    _w = (image.width / image.height) * _h;
                }
            } else {
                _h = sprite._height;
                _w = (image.width / image.height) * _h;
                if (_w > sprite._width) {
                    _w = sprite._width;
                    _h = (image.height / image.width) * _w;
                }
            }
            _x = (sprite._width - _w) / 2;
            _y = (sprite._height - _h) / 2;
            sprite.ctx.drawImage(image, _x, _y, _w, _h);
        } else if (type === "repeat") {
            var _w = sprite._width, _h = sprite._height, _x = 0, _y = 0;
            while (true) {
                sprite.ctx.drawImage(image, _x, _y, image.width, image.height);
                _x += image.width;
                if (_x > _w) {
                    _y += image.height;
                    if (_y < _h) {
                        _x = 0;
                    } else {
                        break;
                    }
                }
            }
        } else if (type === "fill") {
            sprite.ctx.drawImage(image, 0, 0, sprite._width, sprite._height);
        } else if (type === "center") {
            var _w = image.width, _h = image.height, _x = 0, _y = 0;
            _x = (sprite._width - _w) / 2;
            _y = (sprite._height - _h) / 2;
            sprite.ctx.drawImage(image, _x, _y, _w, _h);
        }
        this.dispatchEvent("enterframe", this.current);
    },
    gotoAndStop: function (num) {
        if (num >= 0 && num < this.images.length) {
            this.current = num;
            this.renderFrame();
        }
    },
    gotAndPlay: function (num) {
        this.gotoAndStop(num);
        this.play();
    },
    play: function () {
        var ths = this;
        if (!this._interval) {
            this._interval = setInterval(function () {
                var a = ths.current + 1;
                if (a >= ths.images.length) {
                    a = 0;
                }
                ths.current = a;
                ths.renderFrame();
            }, this.option.time);
        }
    },
    stop: function () {
        clearInterval(this._interval);
        this._interval = false;
    },
    event_enterframe: function (e) {
        e.stopPropagation();
    }
});
