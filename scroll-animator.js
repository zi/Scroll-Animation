var ScrollAnimation = (function () {

    // ANIMATION

    var Animation = function(anim) {
        var defaults = {
            tween: function(k) {return k;},
            iefix: true
        };
        $.extend(defaults, anim);
        this.init(defaults);
    };

    Animation.prototype.init = function(defaults) {
        this.startAt = defaults.startAt;
        this.endAt = defaults.endAt;
        this.property = defaults.property;
        this.elem = $('' + defaults.elem);
        this.tween = defaults.tween;
        this.moving = false;
        this.iefix = defaults.iefix;

        if (typeof(defaults.from) == 'undefined') {
            if (this.elem.length > 0) {
                this.from = this.elem.css(this.property);
                if (this.from == 'auto') {
                    this.from = 0;
                }
                else {
                    this.from = parseInt(this.from.replace('px', ''), 10);
                }
                this.to = this.from + parseInt(defaults.to, 10);
            }
        }
        else {
            this.from = defaults.from;
            this.to = defaults.to;
        }
    };

    Animation.prototype.getValue = function(scroll, from, to) {
        if ((typeof from) == 'number' && (typeof to) == 'number') {
            var delta = to - from;
            return this.tween(scroll) * delta + from;
        }
        else {
            return from;
        }
    };

    Animation.prototype.getProgress = function(scroll) {
        var progress = (scroll - this.startAt) / (this.endAt - this.startAt);
        return Math.max(0, Math.min(1, progress));
    };

    Animation.prototype.move = function(scroll, virtualScroll) {

        var newValue;
        var css = {};
        var newX;
        var newY;

        if (this.property === 'opacity' && $.browser.msie) {

            if (this.iefix) return false;

            css[this.property] = 1;
            this.elem.css(css);
            return this;
        }


        if (Math.ceil(virtualScroll) >= this.startAt &&
                Math.floor(virtualScroll) <= this.endAt) {

            this.moving = true;
            var progress = this.getProgress(virtualScroll);
            if ((typeof this.from) == 'number') {
                newValue = this.getValue(progress, this.from, this.to);
            }
            else if ((typeof this.from == 'object')) {
                newX = this.getValue(progress, this.from.x, this.to.x);
                newY = this.getValue(progress, this.from.y, this.to.y);
                if ((typeof newX) == 'number') {
                    newX += 'px';
                }
                if ((typeof newY) == 'number') {
                    newY += 'px';
                }
                newValue = newX + ' ' + newY;
            }
            css[this.property] = newValue;
            this.elem.css(css);
        }
        else if (this.moving) {
            this.moving = false;
            if ((typeof this.from) == 'number') {
                newValue = virtualScroll < this.startAt ? this.from : this.to;
            }
            else if ((typeof this.from == 'object')) {
                newX = virtualScroll < this.startAt ? this.from.x : this.to.x;
                newY = virtualScroll < this.startAt ? this.from.y : this.to.y;
                if ((typeof newX) == 'number') {
                    newX += 'px';
                }
                if ((typeof newY) == 'number') {
                    newY += 'px';
                }
                newValue = newX + ' ' + newY;
            }
            css[this.property] = newValue;
            this.elem.css(css);
        }
        return this;
    };


    var BackgroundAnimation = function(anim) {
        var defaults = {
            tween: function(k) {return k;},
            property: 'background-position'
        };
        $.extend(defaults, anim);
        this.init(defaults);
    };
    BackgroundAnimation.prototype = new Animation();
    BackgroundAnimation.prototype.constructor = Animation;



    // ANIMATOR

    var idAnimator = 0;
    var scroll = 0;
    var virtualScroll = -1;
    var isTouchDevice = "ontouchstart" in window;
    var useJoystick = false;
    var joystick;
    var joystickHandled = false;
    var joystickPosition = {
        top: $(window).height() / 2 - 50,
        right: 10
    };
    var joystickDelta = {x: 0, y: 0};
    var joystickLength = 200;
    var scrolling = false;

    var handleJoystick = function() {
        var startX;
        var startY;
        joystick = $('<div id="joystick"></div>');
        joystick.css({
            position: 'fixed',
            right: '10px',
            top: joystickPosition.top + 'px',
            height: '120px',
            width: '100px',
            'z-index': '1000',
            'background-image': 'url(images/touch.png)'
        });
        $('body').append(joystick);

        var dragging = false;
        var handleObject = joystick[0];

        var startHandler = function(e) {
            startY = e.touches[0].pageY;
            startX = e.touches[0].pageX;
        };

        var moveHandler = function(e) {
            joystickDelta.y = e.touches[0].pageY - startY;
            joystickDelta.x = e.touches[0].pageX - startX;
            $(handleObject).css({
                top: joystickPosition.top + joystickDelta.y,
                right: joystickPosition.right - joystickDelta.x
            });
        };

        var endHandler = function(e) {
            dragging = false;
            joystickDelta = {x: 0, y: 0};
            $(handleObject).animate({
                top: joystickPosition.top, 
                right: joystickPosition.right
            }, 'slow');
        };

        handleObject.addEventListener('touchstart', startHandler, true);
        handleObject.addEventListener('touchmove', moveHandler, true);
        window.addEventListener('touchend', endHandler, true);
    };

    if (isTouchDevice && useJoystick) {
        handleJoystick();
    }
    
    var Animator = function(animations, options) {

        if (!(this instanceof Animator)) {
            return new Animator(animations, options);
        }

        this.id = idAnimator;
        idAnimator++;

        var defaults = {
            scrollDelay: 0.2,
            framerate: 50,
            paused: false
        };

        this.settings = $.extend(defaults, options);

        this.paused = this.settings.paused;
        this.animations = animations;
        this.handleTouch();
        return this;
    };

    Animator.prototype.handleTouch = function() {

        if (isTouchDevice && !useJoystick) {

            var startY;
            var handleObject;
            var startHandler;
            var moveHandler;
            var container = $('#contenitore');
            var dragging = false;

            handleObject = document.getElementById("contenitore");

            startHandler = function(e) {
                startY = e.touches[0].pageY;
                if (!$(e.touches[0].target).is('.clickable')) {
                    e.preventDefault();
                }
            };

            moveHandler = function(e) {
                var temp_scroll = scroll;
                temp_scroll += parseInt((- e.touches[0].pageY + startY) / 20, 10);
                temp_scroll = Math.max(0, temp_scroll);
                temp_scroll = Math.min($(container).height(), temp_scroll);
                scroll = temp_scroll;
            };
            handleObject.addEventListener('touchstart', startHandler, true);
            handleObject.addEventListener('touchmove', moveHandler, true);
        }
    };

    Animator.prototype.add = function(anims) {
        this.animations = $.merge(this.animations, anims);
    };

    Animator.prototype.stop = function() {
        this.paused = true;
    };

    Animator.prototype.start = function(scrollValue, delay) {
        if ((typeof scrollValue) == 'number') {

            this.goTo(scrollValue, {
                delay: delay,
                animated: false
            });
        }
        if (this.paused) {
            var anim = this;
            setTimeout(function() {
                anim.paused = false;
                anim.smoothAnimate();
            }, Math.max(this.settings.framerate, delay));
        }
    };

    Animator.prototype.goTo = function(scrollValue, options) {

        var defaults = {
            delay: 0,
            animated: true
        };
        var settings = $.extend(defaults, options);

        var anim = this;
        if (settings.endScroll) {
            var endScroll = function(e, data) {
                if (data.animator === anim) {
                    settings.endScroll.call(anim, e);
                    $(window).off('endscrolling', endScroll);
                }
            };
            $(window).on('endscrolling', endScroll);
        }
        if (settings.pauseScroll) {
            var pauseScroll = function(e, data) {
                if (data.animator === anim) {
                    settings.pauseScroll.call(anim, e);
                    $(window).off('pausescrolling', pauseScroll);
                }
            };
            $(window).on('pausescrolling', pauseScroll);
        }

        if (!settings.animated) virtualScroll = scrollValue;

        setTimeout(function() {
            if (isTouchDevice) {
                scroll = scrollValue;
            }
            else {
                $(window).stop().scrollTop(scrollValue);
            }
            scrolling = true;
        }, settings.delay);
    };

    Animator.prototype.getScroll = function() {
        return virtualScroll;
    };

    Animator.prototype.smoothAnimate = function() {

        if (!this.paused) {

            var _this = this;
            window.setTimeout(function() {
                _this.smoothAnimate();
            }, this.settings.framerate);

            if (!isTouchDevice) {
                scroll = $(window).scrollTop();
            }
            else {
                if (useJoystick) {
                    scroll = Math.max(0, scroll + joystickDelta.y * 0.5);
                }
                if (this.settings.maxScroll) {
                    scroll = Math.min(this.settings.maxScroll, scroll);
                }
            }

            if (Math.abs(virtualScroll - scroll) > 1) {

                scrolling = true;
                virtualScroll += this.settings.scrollDelay * 
                    (scroll - virtualScroll);

                var length = this.animations.length;
                for (var i = 0; i < length; i++) {
                    if (this.animations[i]) {
                        this.animations[i].move(scroll, virtualScroll);
                    }
                }

            }
            else if (scrolling) {
                scrolling = false;
                $(window).trigger('endscrolling', {
                    animator: this
                });
            }
        }
    };

    return {
        Animation: Animation,
        BackgroundAnimation: BackgroundAnimation,
        Animator: Animator
    };
}) ();

var Animation = ScrollAnimation.Animation;
var BackgroundAnimation = ScrollAnimation.BackgroundAnimation;
var Animator = ScrollAnimation.Animator;
if (window.addEventListener) {
    window.addEventListener('touchstart', function(e) {
        if (!$(e.touches[0].target).is('.clickable')) {
            e.preventDefault();
        }
    });
}
