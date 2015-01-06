    "use strict";
    /**
     * @class com.sesamtv.core.util.Touch
     * @singleton
     */
    let hasTouch = (window.DocumentTouch && document instanceof DocumentTouch) || navigator.userAgent.match(/(iPhone|iPod|iPad|BlackBerry|Android)/),
        list = ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'mousedown', 'mousemove', 'mouseup', 'mouseleave'],
        touch = hasTouch ? {
            "$evtList": list,
            /**
             * @property {String} press
             */
            "press": "touchstart",
            /**
             * @property {String} move
             */
            "move": "touchmove",
            /**
             * @property {String} release
             */
            "release": "touchend",
            /**
             * @property {String} cancel
             */
            "cancel": "touchcancel",
            "mousedown": "touchstart",
            "mousemove": "touchmove",
            "mouseup": "touchend",
            "mouseleave": "touchcancel"
        } : {
            "$evtList": list,
            "press": "mousedown",
            "move": "mousemove",
            "release": "mouseup",
            "cancel": "mouseleave",
            "touchstart": "mousedown",
            "touchmove": "mousemove",
            "touchend": "mouseup",
            "touchcancel": "mouseleave"
        };
    touch.hasTouch = hasTouch;
    export default touch;


