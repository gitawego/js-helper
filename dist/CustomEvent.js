(function (factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports", "module"], factory);
    } else if (typeof exports !== "undefined" && typeof module !== "undefined") {
        factory(exports, module);
    }
})(function (exports, module) {
    "use strict";
    var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

    var slice = Array.prototype.slice,
        glb = typeof window !== "undefined" ? window : global;

    var uuid = typeof glb.crypto != "undefined" && typeof glb.crypto.getRandomValues != "undefined" ? function () {
        // If we have a cryptographically secure PRNG, use that
        // http://stackoverflow.com/questions/6906916/collisions-when-generating-uuids-in-javascript
        var buf = new Uint16Array(8);
        glb.crypto.getRandomValues(buf);
        var S4 = function (num) {
            var ret = num.toString(16);
            while (ret.length < 4) {
                ret = "0" + ret;
            }
            return ret;
        };
        return S4(buf[0]) + S4(buf[1]) + "-" + S4(buf[2]) + "-" + S4(buf[3]) + "-" + S4(buf[4]) + "-" + S4(buf[5]) + S4(buf[6]) + S4(buf[7]);
    } : function uuid(tpl) {
        tpl = tpl || "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
        var d = new Date().getTime();
        return tpl.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == "x" ? r : r & 7 | 8).toString(16);
        });
    };
    var mixin = function mixin(dest, source) {
        var name,
            s,
            empty = {};
        for (name in source) {
            s = source[name];
            if (!(name in dest) || dest[name] !== s && (!(name in empty) || empty[name] !== s)) {
                dest[name] = s;
            }
        }
        return dest;
    };
    /**
     * @class com.sesamtv.core.util.CustomEvent
     * @cfg {Object} [args]
     * @cfg {String} [args.channelSeparator]
     */
    var CustomEvent = (function () {
        function CustomEvent(args) {
            /**
             * @property _listeners
             * @type {Object.<String,Array>}
             * @private
             */
            this._listeners = {};
            this.channelSeparator = "/";
            args && mixin(this, args);
        }

        _prototypeProperties(CustomEvent, null, {
            buildListener: {

                /**
                 * @method buildListener
                 * @private
                 * @param {Function|Object} listener
                 * @return {{id:String,content:Function}}
                 */
                value: function buildListener(listener) {
                    var _id = "#Listener:" + uuid();
                    if (typeof listener === "function") {
                        listener = {
                            id: _id,
                            content: listener
                        };
                    } else {
                        if (!listener.id) {
                            listener.id = _id;
                        }
                    }
                    return listener;
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            on: {

                /**
                 * @method on
                 * @param {String} eventName
                 * @param {Function|Object} listener
                 * @param {String} listener.id if listener is an object, define listener id
                 * @param {Function} listener.content if listener is an object, define function
                 * @return {{id:Number,remove:Function}}
                 */
                value: function on(eventName, listener) {
                    var self = this;
                    if (typeof this._listeners[eventName] === "undefined") {
                        this._listeners[eventName] = [];
                    }
                    listener = this.buildListener(listener);
                    if (this.hasListener(eventName, listener.id)) {
                        throw new Error("listener id " + listener.id + " duplicated");
                    }
                    this._listeners[eventName].push(listener);
                    return {
                        remove: function () {
                            return self.off(eventName, listener.id);
                        },
                        id: listener.id
                    };
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            once: {

                /**
                 * listener is triggered only once
                 * @method once
                 * @param {String} eventName
                 * @param {Function|Object} listener
                 * @param {Function} listener.content
                 * @param {String} listener.id
                 * @return {{id:Number,remove:Function}}
                 */
                value: function once(eventName, listener) {
                    var self = this;
                    listener = this.buildListener(listener);
                    var origContent = listener.content;
                    listener.content = function () {
                        self.off(eventName, listener.id);
                        origContent.apply(self, arguments);
                    };
                    return this.on(eventName, listener);
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            when: {

                /**
                 * listener is removed when the callback return true
                 *
                 *      this.when('click',function(node){
                         *          return node.id === 'container';
                         *      });
                 *
                 * @method when
                 * @param {String} event
                 * @param {Function} callback
                 * @returns {*}
                 */
                value: function when(event, callback) {
                    var self = this;

                    function check() {
                        if (callback.apply(this, arguments)) {
                            self.off(event, check);
                        }
                    }

                    check.listener = callback;
                    self.on(event, check);
                    return this;
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            broadcast: {

                /**
                 * broadcast message to events, support wildcard (* or ?)
                 *
                 *      this.broadcast('channel1/*',message);
                 *      this.broadcast('channel1/????/event1',message);
                 *      this.broadcast('channel1/event1',msg1,msg2);
                 *
                 * @method broadcast
                 * @param {String} wildcard
                 */
                value: function broadcast(wildcard) {
                    var params = slice.call(arguments, 1),
                        evtNames = this.getEventNamesByWildcard(wildcard),
                        i = 0,
                        l = evtNames.length,
                        res = [];
                    for (; i < l; i++) {
                        res.push(this.emit.apply(this, [evtNames[i]].concat(params)));
                    }
                    return res;
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            getEventNamesByWildcard: {

                /**
                 * @method getEventNamesByWildcard
                 * @param {String} wildcard
                 * @return {Array.<String>}
                 */
                value: function getEventNamesByWildcard(wildcard) {
                    var evts = [],
                        self = this,
                        reg = wildcard.replace(/(\?)/g, function (str, m) {
                        return "[\\w'-]{1}";
                    }).replace(/\*/g, function (key, idx, str) {
                        return str.charAt(idx + 1) !== "" ? "([\\S\\s][^" + self.channelSeparator + "]*)" : ".*?";
                    });
                    JSON.stringify(Object.keys(this._listeners)).replace(new RegExp("\"(" + reg + ")\"", "g"), function (ignore, eventName) {
                        evts.push(eventName);
                    });
                    return evts;
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            emit: {

                /**
                 * example:
                 *
                 *      this.emit('evtName');
                 *      this.emit('evtName',params);
                 *      this.emit('evtName',param1,param2);
                 *
                 * @method emit
                 * @param {String} eventType
                 * @return {Array}
                 */
                value: function emit(eventType) {
                    var params,
                        res = [],
                        listeners,
                        len;
                    if (!eventType) {
                        //falsy
                        throw new Error("Event object missing 'eventName' property.");
                    }
                    params = slice.call(arguments, 1);
                    if (this._listeners[eventType] instanceof Array) {
                        listeners = this._listeners[eventType];
                        len = listeners.length;
                        //decrease the length (instead of increasing from 0)
                        // in case listener is removed while emit method is running
                        while (len--) {
                            if (listeners[len]) {
                                res.push({
                                    id: listeners[len].id,
                                    result: listeners[len].content.apply(this, params)
                                });
                            }
                        }
                    }
                    return res;
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            emitTo: {

                /**
                 * emit to a particular listener
                 *
                 *      this.emitTo('eventName','listenerId',param1,param2);
                 *
                 * @method emitTo
                 * @param eventType
                 * @param listenerId
                 * @returns {Array}
                 */
                value: function emitTo(eventType, listenerId) {
                    if (!eventType) {
                        //falsy
                        throw new Error("Event object missing 'eventName' property.");
                    }
                    var params = slice.call(arguments, 2),
                        res = [],
                        listeners,
                        l;
                    if (this._listeners[eventType] instanceof Array) {
                        listeners = this._listeners[eventType];
                        l = listeners.length;
                        while (l--) {
                            if (listeners[l] && listeners[l].id === listenerId) {
                                res.push({
                                    id: listenerId,
                                    result: listeners[l].content.apply(this, params)
                                });
                                break;
                            }
                        }
                        if (listenerId && !res.length) {
                            throw new Error("listener " + listenerId + " is not found in event " + eventType);
                        }
                    }
                    return res;
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            off: {

                /**
                 * remove a listener
                 * @method off
                 * @param {String} eventName
                 * @param {String|Function} listener a listener id or listener handler
                 */
                value: function off(eventName, listener) {
                    var res;
                    if (res = this.hasListener(eventName, listener)) {
                        this._listeners[eventName].splice(res.index, 1);
                    }
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            hasEvent: {
                value: function hasEvent(eventName) {
                    if (!eventName) {
                        return Object.keys(this._listeners).length > 0;
                    }
                    return eventName in this._listeners;
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            eventList: {
                value: function eventList() {
                    return Object.keys(this._listeners);
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            hasListener: {

                /**
                 * @method hasListener
                 * @param {String} eventName
                 * @param {String|Function} listener
                 * @return {Object}
                 */
                value: function hasListener(eventName, listener) {
                    var listenerType = typeof listener === "string" ? "id" : "content",
                        listeners,
                        i = 0,
                        len;
                    if ((listeners = this._listeners[eventName]) && (len = listeners.length) > 0) {
                        for (; i < len; i++) {
                            if (listeners[i][listenerType] === listener) {
                                return {
                                    index: i
                                };
                            }
                        }
                    }
                    return null;
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            hasListeners: {

                /**
                 * @method hasListeners
                 * @param {String} eventName event name
                 * @return {Boolean}
                 */
                value: function hasListeners(eventName) {
                    if (this._listeners[eventName] instanceof Array) {
                        return this._listeners[eventName].length > 0;
                    }
                    return false;
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            getListeners: {

                /**
                 * @method getListeners
                 * @param {string} eventName event name
                 * @return {Array.<Object>}
                 */
                value: function getListeners(eventName) {
                    if (this._listeners[eventName] instanceof Array) {
                        return this._listeners[eventName];
                    }
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            purgeListeners: {

                /**
                 * @method purgeListeners
                 * @param {String} [evtName] if evtName is undefined, remove all the events
                 */
                value: function purgeListeners(evtName) {
                    if (evtName) {
                        delete this._listeners[evtName];
                    } else {
                        delete this._listeners;
                        this._listeners = {};
                    }
                },
                writable: true,
                enumerable: true,
                configurable: true
            }
        });

        return CustomEvent;
    })();

    module.exports = CustomEvent;
});