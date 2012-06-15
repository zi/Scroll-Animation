// ANIMATION

var Animation = function(anim) {
    var defaults = {
        tween: TWEEN.Easing.Linear.EaseNone
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
        return parseInt(this.tween(scroll) * delta + from, 10);
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
        /*if (this.elem[0].id == 'S1_img2') {*/
        /*console.log(newValue);*/
        /*}*/
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
};


var BackgroundAnimation = function(anim) {
    var defaults = {
        tween: TWEEN.Easing.Linear.EaseNone,
        property: 'background-position'
    };
    $.extend(defaults, anim);
    this.init(defaults);
};
BackgroundAnimation.prototype = new Animation();
BackgroundAnimation.prototype.constructor = Animation;


// ANIMATOR

var Animator = function(animations, options) {


    if (!(this instanceof Animator)) 
        return new Animator(animations, options);

    var defaults = {
        scrollDelay: .1,
        framerate: 50,
        paused: false
    };

    this.settings = $.extend(defaults, options);

    this.virtualScroll = -1;
    this.scroll = 0;
    this.frame = 0;
    this.paused = this.settings.paused;

    this.animations = animations;

    this.handleTouch();
};

Animator.prototype.handleTouch = function() {

    this.isTouchDevice = "ontouchstart" in window;

    if (this.isTouchDevice) {
        var _this = this;
        var startY;

        var container = document.getElementById("contenitore");

        container.addEventListener('touchstart', function(e) {
            startY = e.touches[0].pageY;
            /*$("#debug").html(e.touches[0].target.id);*/
            if (!$(e.touches[0].target).is('.clickable')) {
                e.preventDefault();
            }
        }, true);

        container.addEventListener('touchmove', function(e) {
            _this.scroll += parseInt((e.touches[0].pageY - startY) / 5, 10);
            _this.scroll = Math.max(0, _this.scroll);
            _this.scroll = Math.min($(container).height(), _this.scroll);
        }, true);
    }

};

Animator.prototype.add = function(anims) {
    this.animations = $.merge(this.animations, anims);
};

Animator.prototype.stop = function() {
    this.paused = true;
};

Animator.prototype.start = function(scroll, delay) {
    if ((typeof scroll) == 'number') {

        if ((typeof delay) != 'number') delay = 0;

        if (this.isTouchDevice) {
            this.scroll = scroll;
        }
        else {
            $(window).stop().delay(delay).scrollTop(scroll);
        }
    }
    this.paused = false;
    this.smoothAnimate();
};

Animator.prototype.goTo = function(scroll) {
    if (this.isTouchDevice) {
        this.scroll = scroll;
    }
    else {
        $(window).scrollTop(scroll);
    }
};

Animator.prototype.smoothAnimate = function() {

    if (!this.paused) {

        var _this = this;
        window.setTimeout(function() {
            _this.smoothAnimate();
        }, this.settings.framerate);

        if (!this.isTouchDevice) {
            this.scroll = $(window).scrollTop();
        }
        $("#debug").html(this.scroll);
        /*if (console)*/
        /*console.log(this.scroll);*/

        if (Math.ceil(this.virtualScroll) !== Math.floor(scroll)) {

            this.virtualScroll += this.settings.scrollDelay * 
                (this.scroll - this.virtualScroll);

            var length = this.animations.length;
            for (var i = 0; i < length; i++) {
                if (this.animations[i]) {
                    this.animations[i].move(this.scroll, this.virtualScroll);
                }
            }

        }
    }
};

/*Animator.prototype.animate = function() {*/

/*var animator = this;*/
/*$(window).scroll(function() {*/
/*if (!this.paused) {*/
/*animator.scroll = $(window).scrollTop();*/
/**//*console.log(animator.scroll);*/

/*if (Math.ceil(animator.virtualScroll) !== Math.floor(scroll)) {*/

/*animator.virtualScroll += animator.settings.scrollDelay * */
/*(animator.scroll - animator.virtualScroll);*/

/*var length = animator.animations.length;*/
/*for (var i = 0; i < length; i++) {*/
/*animator.animations[i].move(animator.scroll, animator.scroll);*/
/*}*/

/*}*/
/*}*/
/*});*/
/*};*/
$(function() {
    var output = $("<div id=\"debug\"></div>");
    output.css({
        position: 'fixed',
        top: '0',
        left: '0',
        'z-index': '10000',
        height: '100px',
        width: '100px',
        background: 'white'
    });
    $('body').append(output);
});
