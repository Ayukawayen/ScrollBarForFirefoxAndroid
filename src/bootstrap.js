const { classes: Cc, interfaces: Ci, utils: Cu } = Components;

Cu.import('resource://gre/modules/Services.jsm');

var menuId = null;

function loadIntoWindow(window) {
	if (!window)
		return;
	// Add any persistent UI elements
	// Perform any other initialization

	menuId = window.NativeWindow.menu.add({
		name:'Show scrollbar',
		callback: function() {
			onMenuItemClick(window);
		},
	});
}

function unloadFromWindow(window) {
	if (!window)
		return;
	// Remove any persistent UI elements
	// Perform any other cleanup
	
	if(menuId) {
		window.NativeWindow.menu.remove(menuId);
	}
}

var windowListener = {
	onOpenWindow: function(aWindow) {
		// Wait for the window to finish loading
		let domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowInternal || Ci.nsIDOMWindow);
		domWindow.addEventListener("UIReady", function onLoad() {
			domWindow.removeEventListener("UIReady", onLoad, false);
			loadIntoWindow(domWindow);
		}, false);
	},
 
	onCloseWindow: function(aWindow) {},
	onWindowTitleChange: function(aWindow, aTitle) {}
};

function startup(aData, aReason) {
	// Load into any existing windows
	let windows = Services.wm.getEnumerator("navigator:browser");
	while (windows.hasMoreElements()) {
		let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
		loadIntoWindow(domWindow);
	}

	// Load into any new windows
	Services.wm.addListener(windowListener);
}

function shutdown(aData, aReason) {
	// When the application is shutting down we normally don't have to clean
	// up any UI changes made
	if (aReason == APP_SHUTDOWN)
		return;

	// Stop listening for new windows
	Services.wm.removeListener(windowListener);

	// Unload from any existing windows
	let windows = Services.wm.getEnumerator("navigator:browser");
	while (windows.hasMoreElements()) {
		let domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow);
		unloadFromWindow(domWindow);
	}
}

function install(aData, aReason) {}
function uninstall(aData, aReason) {}

/*  --------------------------------------------  */

function onMenuItemClick(window) {
	let contentWindow = window.content;

	contentWindow.netAyukawatenMobileScrollBar = contentWindow.netAyukawatenMobileScrollBar || buildMobileScrollBar(contentWindow);
	
	contentWindow.netAyukawatenMobileScrollBar.enable();
}

function buildMobileScrollBar(window) {
	let document = window.document;
	
	return new (function(){
		this.node = null;
		this.nodeClose = null;
		this.nodeTrack = null;
		this.nodeThumb = null;
		
		this.isEnabled = false;
		
		this.scrollMaxY = -1;
		
		this.dragData = {};
		
		this.init = ()=>{
			this.insertCss();
			this.buildNode();
			
			window.addEventListener('scroll', ()=>{
				if(!this.isEnabled) return;
				this.refreshThumbPosition();
			});
		};
		
		this.enable = ()=>{
			this.node.classList.remove('disabled');
			this.refreshScrollBarSize();
			
			this.isEnabled = true;
		};
		this.disable = ()=>{
			this.node.classList.add('disabled');
			
			this.isEnabled = false;
		};
		
		this.insertCss = ()=>{
			let node = document.querySelector('#netAyukawayenScrollBarCss');
			if(node) return;
			
			node = document.createElement('style');
			node.setAttribute('id', 'netAyukawayenScrollBarCss');
			
			node.textContent = ''
				+'\r\n'+ '#netAyukawayenScrollBar, #netAyukawayenScrollBar * {'
				+'\r\n'+ '	font-size:5vmin;'
				+'\r\n'+ '	'
				+'\r\n'+ '	margin:0;'
				+'\r\n'+ '	padding:0;'
				+'\r\n'+ '	border-width:0;'
				+'\r\n'+ '	'
				+'\r\n'+ '	box-sizing:border-box;'
				+'\r\n'+ '}'
				+'\r\n'+ ''
				+'\r\n'+ '#netAyukawayenScrollBar.disabled {'
				+'\r\n'+ '	display:none;'
				+'\r\n'+ '}'
				+'\r\n'+ ''
				+'\r\n'+ '#netAyukawayenScrollBar {'
				+'\r\n'+ '	position:fixed;'
				+'\r\n'+ '	z-index:10;'
				+'\r\n'+ '	top:0;'
				+'\r\n'+ '	bottom:0;'
				+'\r\n'+ '	right:0;'
				+'\r\n'+ '	width:13.5%;'
				+'\r\n'+ '	padding:13.5% 0 0;'
				+'\r\n'+ '	box-shadow:#000 0 0 0.25em;'
				+'\r\n'+ '	'
				+'\r\n'+ '	background-color:rgba(240,240,240,0.5);'
				+'\r\n'+ '}'
				+'\r\n'+ ''
				+'\r\n'+ '#netAyukawayenScrollBar #netAyukawayenScrollBarClose {'
				+'\r\n'+ '	position:absolute;'
				+'\r\n'+ '	top:0;'
				+'\r\n'+ '	right:0;'
				+'\r\n'+ '	width:0;'
				+'\r\n'+ '	height:0;'
				+'\r\n'+ '	padding:50%;'
				+'\r\n'+ '	background-image:url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuOWwzfk4AAAD/SURBVFhHzc5BDsUgCITh3qn3P5svLEwU/+JAm/gW36JTGLxaa38Fw5MwPAnDkzC877sZn38l6l+CPhwtvbHrnz6MX6ClKqV7+uiUxSy1cwk6tUCR6cKwyxQ9yXZgOMoWjiq7GHqV4sqOwZBkDmRmPQyfKIeUmQiGkehg9E+F4Q4dJn5PgaGCHjDy8yoMVfQQ4+cyMFTRY4yfy8BQQQ8Z+XkVhjv0AOL3FBhGosPRPxWGT5SDykwEQ5I5lJn1MPQqByo7BsNRtdhUdjHsKoVetgNDky2KZLowzBSo1M4lUBcrlO7pw+wW3tr1Tx/d0/BXov4lOA3DkzA8CcNz2vUD5OzCKMCmQj8AAAAASUVORK5CYII=");'
				+'\r\n'+ '	background-size:100%;'
				+'\r\n'+ '	background-color:#ccc;'
				+'\r\n'+ '}'
				+'\r\n'+ ''
				+'\r\n'+ '#netAyukawayenScrollBar #netAyukawayenScrollBarTrack {'
				+'\r\n'+ '	position:relative;'
				+'\r\n'+ '	height:100%;'
				+'\r\n'+ '}'
				+'\r\n'+ ''
				+'\r\n'+ '#netAyukawayenScrollBar #netAyukawayenScrollBarThumb {'
				+'\r\n'+ '	position:absolute;'
				+'\r\n'+ '	top:0;'
				+'\r\n'+ '	right:4%;'
				+'\r\n'+ '	left:4%;'
				+'\r\n'+ '	height:6%;'
				+'\r\n'+ '	min-height:6%;'
				+'\r\n'+ '	border-radius:1.5em;'
				+'\r\n'+ '	background-color:rgba(0,0,0,0.25);'
				+'\r\n'+ '}'
				+'\r\n'+ ''
				+'\r\n'+ '#netAyukawayenScrollBar #netAyukawayenScrollBarThumb.dragging {'
				+'\r\n'+ '	background-color:rgba(0,0,0,0.5);'
				+'\r\n'+ '}'
				+'\r\n'+ ''
				+'\r\n'+ '@media screen and (min-aspect-ratio: 1/1) {'
				+'\r\n'+ '#netAyukawayenScrollBar {'
				+'\r\n'+ '	width:7.5%;'
				+'\r\n'+ '	padding:7.5% 0 0;'
				+'\r\n'+ '}'
				+'\r\n'+ '#netAyukawayenScrollBar #netAyukawayenScrollBarThumb {'
				+'\r\n'+ '	height:12%;'
				+'\r\n'+ '	min-height:12%;'
				+'\r\n'+ '}'
				+'\r\n'+ '}'
			;
			
			document.head.appendChild(node);
		};
		
		this.buildNode = ()=>{
			if(this.node) return this.node;

			let nodes = document.querySelectorAll('#netAyukawayenScrollBar');
			for(let i=0;i<nodes.length;++i) {
				nodes[i].parentNode.removeChild(nodes[i]);
			}

			this.node = document.createElement('div');
			this.node.setAttribute('id', 'netAyukawayenScrollBar');
			
			this.nodeClose = document.createElement('div');
			this.nodeClose.setAttribute('id', 'netAyukawayenScrollBarClose');
			this.node.appendChild(this.nodeClose);
			
			this.nodeTrack = document.createElement('div');
			this.nodeTrack.setAttribute('id', 'netAyukawayenScrollBarTrack');
			this.node.appendChild(this.nodeTrack);
			
			this.nodeThumb = document.createElement('div');
			this.nodeThumb.setAttribute('id', 'netAyukawayenScrollBarThumb');
			this.nodeThumb.setAttribute('draggable', 'true');
			this.nodeTrack.appendChild(this.nodeThumb);
			
			let zIndex = 1;
			nodes = document.querySelectorAll('*');
			for(let i=0;i<nodes.length;++i) {
				let z = parseInt(window.getComputedStyle(nodes[i]).getPropertyValue('z-index')) || 0;
				if(zIndex < z) {
					zIndex = z+1;
				}
			}
			this.node.style.zIndex = zIndex;

			this.nodeClose.addEventListener('click', this.disable);
			
			this.nodeTrack.addEventListener('touchstart', this.preventDefault);
			this.nodeTrack.addEventListener('touchmove', this.preventDefault);
			this.nodeTrack.addEventListener('touchend', this.preventDefault);
			
			this.nodeThumb.addEventListener('touchstart', this.onThumbTouchStart);
			this.nodeThumb.addEventListener('touchmove', this.onThumbTouchMove);
			this.nodeThumb.addEventListener('touchend', this.onThumbTouchEnd);
			
			document.body.appendChild(this.node);
			
			return this.node;
		};
		
		this.refreshScrollBarSize = ()=>{
			let originScrollY = window.scrollY;
			let scrollMaxY = originScrollY;
			while(true) {
				window.scrollBy(0, 100000);
				if(scrollMaxY == window.scrollY) break;
				scrollMaxY = window.scrollY;
			}
			window.scrollTo(window.scrollX, originScrollY);
			
			this.scrollMaxY = scrollMaxY;
			
			let htmlHeight = document.querySelector('html').clientHeight;
			let thumbHeight = Math.floor(this.nodeTrack.offsetHeight * htmlHeight/(htmlHeight+this.scrollMaxY));
			this.nodeThumb.style.height = thumbHeight + 'px';
			
			let thumbRadiu = Math.ceil(Math.min(this.nodeThumb.offsetWidth, this.nodeThumb.offsetHeight)*0.5);
			this.nodeThumb.style.borderRadius = thumbRadiu + 'px';
			
			this.refreshThumbPosition();
		};
		
		this.refreshThumbPosition = ()=>{
			let rate = this.scrollMaxY<=0 ? 0 : window.scrollY/this.scrollMaxY;
			rate = Math.min(1, rate);
			rate = Math.max(0, rate);
			
			let pre = (rate * (this.nodeTrack.offsetHeight-this.nodeThumb.offsetHeight)/this.nodeTrack.offsetHeight) * 100;
			
			this.nodeThumb.style.top = pre + '%';
		};
		
		this.preventDefault = (ev)=>{
			ev.preventDefault();
			ev.stopPropagation();
			return false;
		};
		
		this.onThumbTouchStart = (ev)=>{
			if(ev.targetTouches.length <= 0) return;
			ev.preventDefault();
			ev.stopPropagation();
			
			this.refreshScrollBarSize();
			
			let touch = ev.targetTouches[0];
			
			this.dragData = {
				thumbTop: this.nodeThumb.offsetTop,
				mouseY: touch.clientY,
			};
			this.nodeThumb.classList.add('dragging');
			
			return false;
		};
		
		this.onThumbTouchMove = (ev)=>{
			if(ev.targetTouches.length <= 0) return;
			ev.preventDefault();
			ev.stopPropagation();
			
			let touch = ev.targetTouches[0];
			
			let y = touch.clientY - (this.dragData.mouseY||0) + (this.dragData.thumbTop||0);
			let rate = y/(this.nodeTrack.offsetHeight-this.nodeThumb.offsetHeight);
			rate = Math.min(1, rate);
			rate = Math.max(0, rate);
			
			window.scrollTo(window.scrollX, this.scrollMaxY*rate);
			
			return false;
		};
		this.onThumbTouchEnd = (ev)=>{
			ev.preventDefault();
			ev.stopPropagation();
			
			this.nodeThumb.classList.remove('dragging');
			
			return false;
		};
		
		this.init();
	});
}
