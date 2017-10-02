// ----------------------------------------------------------------------------
// Scroll Tips

(function(window) { "use strict";

var scrollTips = [];
var isMobile = /iPhone|iPad|android|Windows Phone/i.test(navigator.userAgent);

Number.prototype.limit = function(min, max) {
	return Math.min(Math.max(this, min), max);
};

var getStyleValue = function(elem, style) {
	var $elem = $(elem).hide().appendTo($('body'));
	var val = $elem.css(style);
    $elem.remove();
    return val;
};


var initMenu = function() {

	// Hamburger Menu for mobile
	if( isMobile ) {

		var menu = $('#menu');
		var menuItems = $('#menu-items');
		$('.section').each(function(){
			var title = $(this).find('h1').text();
			var item = $('<a class="menu-item"/>')
				.attr('href', '#'+this.id)
				.text(title)
				.click(scrollTo)
				.appendTo(menuItems);
		});

		menu.show();
		$('#menu-button').click(function(){
			menuItems.slideToggle('fast');
			return false;
		});
	}

	// Scroll tips for Desktop
	else {
		$('.section').each(function(){
			var sectionDiv = $(this);
			var title = sectionDiv.find('h1').text();

			var scrollTip = $('<a class="scroll-tip"/>')
				.attr('href', '#'+this.id)
				.text(title)
				.click(scrollTo)
				.appendTo('body');

			scrollTips.push({
				name: this.id,
				tip: scrollTip,
				target: $('#'+this.id),
				targetPos: 0,
			});
		});

		$(window).scroll(onscroll);
	}
};


var onresize = function() {
	// Set the first section margin so that the intro is on the screen alone
	var section = $('.section:first');
	var intro = $('#intro');
	var sectionWidth = section.width();
	var windowHeight = $(window).height();

	// Set column count
	var i;
	for( i = 0; i < columnWidths.length; i++ ) {
		var w = columnWidths[i];
		if( sectionWidth < w ) { break; }
	}
	var columnsClass = 'columns-' + Math.max(i,1);

	$('div.columns')
		.removeClass('columns-1')
		.removeClass('columns-2')
		.removeClass('columns-3')
		.addClass(columnsClass);


	// Set scroll tip targets
	for( i = 0; i < scrollTips.length; i++ ) {
		var t = scrollTips[i];
		t.targetPos = t.target.offset().top;
	}

	if( !isMobile ) {
		onscroll();
	}
};


var onscroll = function() {
	var windowHeight = $(window).height();
	var bodyHeight = $('#content').height();
	var scrollPos = $(window).scrollTop();

	for( var i = 0; i < scrollTips.length; i++ ) {
		var t = scrollTips[i];
		var targetHeight = t.target.height();

		if( scrollPos+20 > t.targetPos && scrollPos < t.targetPos + targetHeight ) {
			if( !t.tip.hasClass('active') ) {
				if( typeof window.history.replaceState == 'function' ) {
					history.replaceState({}, '', window.location.href.replace(/#.*$/,'') + '#' + t.name);
				}
				t.tip.addClass('active');
			}
		}
		else {
			t.tip.removeClass('active');
		}

		var tipPos = ( (windowHeight - ((scrollPos-t.targetPos)/targetHeight) * windowHeight)/1.8 )
			.limit((i+0.3)*30, windowHeight - (scrollTips.length-i+0.3)*30);
		t.tip.css('top', tipPos);
	}

	if( scrollPos+20 < scrollTips[0].targetPos && document.location.href.match(/#.+$/) ) {
		if( typeof window.history.replaceState == 'function' ) {
			history.replaceState({}, '', window.location.href.replace(/#.*$/,''));
		}
	}
};


var scrollTo = function() {
	$('#menu-items').hide(); // Always hide hamburger menu on mobile

	var pos = $($(this).attr('href')).offset().top;
	$('html, body').stop().animate({scrollTop: pos}, 500);
	return false;
};



// ----------------------------------------------------------------------------
// Background

// rAF polyfill based on https://gist.github.com/1579671 ----------------------

var w = window;

// Find vendor prefix, if any
var vendors = ['ms', 'moz', 'webkit', 'o'];
for( var i = 0; i < vendors.length && !w.requestAnimationFrame; i++ ) {
	w.requestAnimationFrame = w[vendors[i]+'RequestAnimationFrame'];
}

// Use requestAnimationFrame if available
if( w.requestAnimationFrame ) {
	var next = 1,
		anims = {};

	w.setAnimation = function( callback, element ) {
		var current = next++;
		anims[current] = true;

		var animate = function() {
			if( !anims[current] ) { return; } // deleted?
			w.requestAnimationFrame( animate, element );
			callback();
		};
		w.requestAnimationFrame( animate, element );
		return current;
	};

	w.clearAnimation = function( id ) {
		delete anims[id];
	};
}

// [set/clear]Interval fallback
else {
	w.setAnimation = function( callback, element ) {
		return w.setInterval( callback, 1000/60 );
	}
	w.clearAnimation = w.clearInterval;
}


// Perlin Noise function for tumbling and dust movement -----------------------

var PerlinNoise = function( size ) {
	this.gx = [];
	this.gy = [];
	this.p = [];
	this.size = size || 256;
	size: 256,


	this.size = size || 256;

	for( var i = 0; i < this.size; i++ ) {
		this.gx.push( Math.random()*2-1 );
		this.gy.push( Math.random()*2-1 );
	}

	for( var j = 0; j < this.size; j++ ) {
		this.p.push( j );
	}
	this.p.sort(function() {return 0.5 - Math.random()});

	this.noise2 = function( x, y ) {
		// Compute what gradients to use
		var qx0 = x | 0;
		var qx1 = qx0 + 1;
		var tx0 = x - qx0;
		var tx1 = tx0 - 1;

		var qy0 = y | 0;
		var qy1 = qy0 + 1;
		var ty0 = y - qy0;
		var ty1 = ty0 - 1;

		// Make sure we don't come outside the lookup table
		qx0 = qx0 % this.size;
		qx1 = qx1 % this.size;

		qy0 = qy0 % this.size;
		qy1 = qy1 % this.size;

		// Permutate values to get pseudo randomly chosen gradients
		var q00 = this.p[(qy0 + this.p[qx0]) % this.size];
		var q01 = this.p[(qy0 + this.p[qx1]) % this.size];

		var q10 = this.p[(qy1 + this.p[qx0]) % this.size];
		var q11 = this.p[(qy1 + this.p[qx1]) % this.size];

		// Compute the dotproduct between the vectors and the gradients
		var v00 = this.gx[q00]*tx0 + this.gy[q00]*ty0;
		var v01 = this.gx[q01]*tx1 + this.gy[q01]*ty0;

		var v10 = this.gx[q10]*tx0 + this.gy[q10]*ty1;
		var v11 = this.gx[q11]*tx1 + this.gy[q11]*ty1;

		// Modulate with the weight function
		var wx = (3 - 2*tx0)*tx0*tx0;
		var v0 = v00 - wx*(v00 - v01);
		var v1 = v10 - wx*(v10 - v11);

		var wy = (3 - 2*ty0)*ty0*ty0;
		var v = v0 - wy*(v0 - v1);

		return v;
	}
};


// Image preloader ------------------------------------------------------------

var preload = function( images, callback ) {
	var remaining = 0;
	var loaded = {};

	var onloadCallback = function( ev ) {
		remaining--;
		if( !remaining ) {
			callback( loaded );
		}
	};

	for( var i in images ) {
		remaining++;
		var img = new Image();
		img.onload = onloadCallback;
		img.src = images[i];
		loaded[i] = img;
	}

	return loaded;
};


// Set up ---------------------------------------------------------------------

// Get Canvas, create Noise function, register 'resize' and 'mousemove'
// handlers and preload images

var canvas = document.getElementById('bg');
var ctx = null;
var mouse = {x: 0, y: 0, cx: 0, cy: 0};
var blackOverlay = 1;
var currentIndexTrans = 0;
var startTime = 0;

var i = 1563;
var noise = new PerlinNoise();

var backgroundAnimation = 0;


var canvasResize = function() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	draw();
};

document.addEventListener('mousemove', function( ev ) {
	mouse.x = ev.clientX;
	mouse.y = ev.clientY;
}, false);

var images = [];
var loadBackground = function() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	$('#codered-logo').addClass('hide');

	$(canvas).show();
	ctx = canvas.getContext('2d');
	ctx.fillStyle = '#111111';
	ctx.fillRect(0,0,canvas.width,canvas.height);

	images = preload({
			bg: 'files/background/milky-way.jpg',
			bg_blur: 'files/background/milky-way-blur.png',
			vignette: 'files/background/vignette.png',
			dustNear: 'files/background/dust-near.jpg',
			dustFar: 'files/background/dust-far.jpg',
			graphy: 'files/background/graphy-dark2.png',
			logo: 'files/codered-logo.png'
		}, function() {
			startTime = Date.now();
			backgroundAnimation = setAnimation( draw, canvas );
			window.addEventListener('resize', canvasResize, false);
		}
	);
};



// Draw -----------------------------------------------------------------------

var fillImage = function( ctx, img, x, y ) {
	// This seems to be faster than fillRect with a pattern
	var cw = ctx.canvas.width,
		ch = ctx.canvas.height,
		iw = img.width,
		ih = img.height;

	x = (x%iw - iw) % iw;
	y = (y%ih - ih) % ih;
	for( var nx = x; nx < cw; nx += iw ) {
		for( var ny = y; ny < ch; ny += ih ) {
			ctx.drawImage( img, nx, ny );
		}
	}
};

function lerp(a, b, t) {
	return (b - a) * t + a;
}

var frameCount = 0;
var testForSlowBrowsers = true;
var draw = function() {

	// Test slow systems
	frameCount++;
	var seconds = (Date.now() - startTime)/1000;
	if( seconds > 1 && testForSlowBrowsers ) {
		// Fewer than 20 frames in the last second? Disable background :/
		if( frameCount < 20 ) {
			clearAnimation( backgroundAnimation );
			blackOverlay = 0;
		}
		testForSlowBrowsers = false;
	}


	i += 0.78;
	var tumble = 32;

	var cw = canvas.width + tumble * 4;
	var ch = canvas.height + tumble * 2;

	// Aspect zoom
	var width = cw;
	var height = Math.ceil(images.bg.height / (images.bg.width / cw ));
	if( height < canvas.height ) {
		width = Math.ceil(images.bg.width / (images.bg.height / ch ));
		height = ch;
	}

	// Mouse damping
	mouse.cx = mouse.x * 0.05 + mouse.cx * 0.95;
	mouse.cy = mouse.y * 0.05 + mouse.cy * 0.95;

	var mx = -(mouse.cx / canvas.width) * tumble;
	var my = -(mouse.cy / canvas.height) * tumble;
	var x = noise.noise2( i/193, i/233)*tumble + mx;
	// var y = 0 +  + noise.noise2( i/241, i/211)*tumble + my + tumble;
	var y = noise.noise2( i/241, i/211)*tumble + my;

	var scale = images.bg.width / width;
	var scroll = $(document).scrollTop();
	var scroll_param = Math.min(1, scroll / (0.8*window.innerHeight));

	ctx.globalAlpha = 1;
	ctx.fillStyle = '#111';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Blurred BG
	if (scroll_param > 0) {
		// ctx.globalCompositeOperation = 'lighter';
		// ctx.globalAlpha = lerp(0, 0.5, scroll_param);
		ctx.globalAlpha = 0.6;
		ctx.drawImage( images.bg_blur, (canvas.width - width) / 2, (canvas.height - height)/2, width, height );
	}

	// BG
	// ctx.globalAlpha = 1;
	ctx.globalAlpha = lerp(1, 0, scroll_param);
	// ctx.drawImage( images.bg, x + (canvas.width - width) / 2, y, width, height );
	ctx.drawImage( images.bg, (canvas.width - width) / 2, (canvas.height - height)/2, width, height );


	// Dust Layers
	var dx = x + i/5,
		dy = y + i/15 - scroll/8; // extra vert scroll for dust layers
	// var dx = x/10,
	// 	dy = y/10 - $(document).scrollTop()/8; // extra vert scroll for dust layers

	// Scanlines
	ctx.globalAlpha = 0.5;
	fillImage( ctx, images.graphy, 0, -0.1 * scroll );

	// Logo
	ctx.globalAlpha = lerp(0.75, 0.0, scroll_param);
	var aspect = images.logo.width / images.logo.height;
	var logo_w = lerp(480, 400, scroll_param);
	// ctx.drawImage( images.logo, (canvas.width - logo_w)/2, 280 - 0.25*scroll, logo_w, logo_w / aspect);
	ctx.drawImage( images.logo, x + (canvas.width - logo_w)/2, y + 160 - 0.1*scroll, logo_w, logo_w / aspect);

	ctx.globalAlpha = 0.4;
	ctx.globalCompositeOperation = 'lighter';
	fillImage( ctx, images.dustFar, dx, dy );
	ctx.globalAlpha = 0.3;
	fillImage( ctx, images.dustNear, dx * 2.5, dy * 2.5 );
	ctx.globalAlpha = 0.1;
	fillImage( ctx, images.dustNear, dx * 15, dy * 15 );

	// Vignette
	ctx.globalAlpha = 0.7;
	ctx.globalCompositeOperation = 'source-over';
	ctx.drawImage( images.vignette, 0, 0, canvas.width, canvas.height );

	// Fade from black overlay after loading
	if( blackOverlay > 0 ) {
		ctx.globalAlpha = blackOverlay;
		ctx.fillStyle = '#111111';
		ctx.fillRect(0, 0, canvas.width, canvas.height );
		blackOverlay -= 0.01;
	}
};

var MS_PER_SECOND = 1000;
var MS_PER_MINUTE = 60 * MS_PER_SECOND;
var MS_PER_HOUR = 60 * MS_PER_MINUTE;
var MS_PER_DAY = 24 * MS_PER_HOUR;
var TARGET_DATE = "2017-11-04T18:00:00.000Z";
// var TARGET_DATE = "2017-09-04T18:00:00.000Z";

function initCountdown() {
	$('#countdown').show();

	var canvas = document.getElementById('countdown-progress');
	var ctx = canvas.getContext('2d');
	canvas.width = 480;
	canvas.height = 32;
	// ctx.fillStyle = "#000000";
	// ctx.fillRect(0, 0, canvas.width, canvas.height);

	var target = new Date(TARGET_DATE);
	var now = Date.now();
	var delta = target.getTime() - now;
	var days = Math.floor(delta / MS_PER_DAY);

	var n_days = 40;
	var h = canvas.height;
	var w = h * Math.tan(30 * Math.PI / 180);
	var t = 3;
	var x;

	ctx.fillStyle = "#CCCCCC";
	for (var i = 0; i < n_days; i++) {
		ctx.globalAlpha = i < days ? 1 : 0.25;
		ctx.beginPath();
		x = i / (n_days+1) * canvas.width;
		ctx.moveTo(x, 0);
		ctx.lineTo(x+t, 0);
		ctx.lineTo(x+w+t, h);
		ctx.lineTo(x+w, h);
		ctx.lineTo(x, 0);
		ctx.fill();

	}
	// ctx.endPath();

	updateCountdown();
	setInterval(updateCountdown, 1000);
}

function pad0(num) {
	num = Math.abs(num);
	return num < 10 ? '0' + num : '' + num;
}

function updateCountdown() {
	var target = new Date(TARGET_DATE);
	var now = Date.now();
	var delta = target.getTime() - now;
	var passed_target = delta <= 0;
	delta = Math.abs(delta);
	var sign = passed_target ? '+' : '-';
	var days = Math.floor(delta / MS_PER_DAY);
	delta -= MS_PER_DAY * days;
	var hours = Math.floor(delta / MS_PER_HOUR);
	delta -= MS_PER_HOUR * hours;
	var minutes = Math.floor(delta / MS_PER_MINUTE);
	delta -= MS_PER_MINUTE * minutes;
	var seconds = Math.floor(delta / MS_PER_SECOND);
	delta -= MS_PER_SECOND * seconds;
	$('#countdown .sign').text(sign);
	$('#countdown .days').text(pad0(days));
	$('#countdown .hours').text(pad0(hours));
	$('#countdown .minutes').text(pad0(minutes));
	$('#countdown .seconds').text(pad0(seconds));

	if (passed_target) {
		$('#countdown').addClass('zero');
	}
}

function saveText() {
	var d1 = 60;
	var d2 = 30;
	var pause = -6*d1;

	var symbols = "~?/_[])#|!%^@+*(>;<&$=12345678901234567890";

	function encode(txt, offset, limit) {
		return Array.prototype.map.call(txt, function (l, i) {
			var o = i < limit ? offset : 0;
			return symbols[(l.charCodeAt(0) + o) % symbols.length];
		}).join('');
	}

	$('.section .section-head h1, .section .section-head h2').each(function (i, el) {
		$(el).data('original', $(el).text());
		$(el).text(encode($(el).text(), 0, 0));
	});

	function typeText(el, current, d) {
		var original = $(el).data('original');
		var first = original.substr(0, current.length + 1);
		var rest = original.substring(current.length + 1, original.length);
		var offset = Math.floor(Math.random()*symbols.length);
		rest = encode(rest, offset, 6);
		$(el).text(first + rest);

		if (current.length < original.length) {
			setTimeout(typeText.bind(null, el, first, d), d);
		}
	}

	$('.section').waypoint({
		handler: function (direction) {
			var el = this.element;
			var $h1 = $(el).children('.section-head').children('h1');
			var $h2 = $(el).children('.section-head').children('h2');
			var len = $h1.data('original').length;
			if (!$h1.data('triggered')) {
				$h1.data('triggered', true);
				setTimeout(typeText.bind(null, $h1, '', d1), 0);
				setTimeout(typeText.bind(null, $h2, '', d2), pause+len*d1);
			}
		},
		offset: '80%'
	});
}


// ----------------------------------------------------------------------------
// Init


initMenu();
loadBackground();
initCountdown();
saveText();

// Resize everything and listen to resize events
// Load columnWidth once
var columnWidths = [
	parseInt(getStyleValue('<div class="columns-1"/>', 'width')),
	parseInt(getStyleValue('<div class="columns-2"/>', 'width')),
	parseInt(getStyleValue('<div class="columns-3"/>', 'width'))
];

onresize();
$(window).resize(onresize);

}(window));

