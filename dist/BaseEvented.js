(function (factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports", "module", "./CustomEvent", "./helper"], factory);
    } else if (typeof exports !== "undefined" && typeof module !== "undefined") {
        factory(exports, module, require("./CustomEvent"), require("./helper"));
    }
})(function (exports, module, _CustomEvent, _helper) {
    "use strict";

    var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

    var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

    var CustomEvent = _interopRequire(_CustomEvent);

    var helper = _interopRequire(_helper);

    var slice = Array.prototype.slice;

    /**
     * evented base component, use CustomEvent as compositor
     * @class com.sesamtv.core.util.BaseEvented
     * @requires com.sesamtv.core.util.CustomEvent
     */
    var BaseEvented = (function () {
        function BaseEvented() {
            /**
             * @property event
             * @type {com.sesamtv.core.util.CustomEvent}
             */
            this.event = new CustomEvent();

            helper.applyIf(this, {
                /**
                 * named listener handlers
                 * @property evts
                 * @type {Object}
                 */
                evts: {},
                /**
                 * anonymous listener handlers
                 * @property connect
                 * @type {Array}
                 */
                connect: [],
                config: {}
            });
        }

        _prototypeProperties(BaseEvented, null, {
            on: {

                /**
                 * @method on
                 * @param {String} evt
                 * @param {Function} fnc
                 * @param {Boolean} [once]
                 * @returns {{id: Number, remove: Function}}
                 */
                value: function on(evt, fnc, once) {
                    return this.event[once ? "once" : "on"](evt, fnc.bind(this));
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            once: {

                /**
                 * @method once
                 * @param {String} evt
                 * @param {Function} fnc
                 * @returns {{id: Number, remove: Function}}
                 */
                value: function once(evt, fnc) {
                    return this.on(evt, fnc.bind(this), true);
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            emit: {

                /**
                 * @method emit
                 * @returns {Array}
                 */
                value: function emit() {
                    return this.event.emit.apply(this.event, arguments);
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            broadcast: {

                /**
                 * @method broadcast
                 * @param {String} wildcard
                 */
                value: function broadcast(wildcard) {
                    return this.event.broadcast.apply(this.event, arguments);
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            set: {

                /**
                 * set a property
                 * @method set
                 * @param k
                 * @param v
                 */
                value: function set(k, v) {
                    if (k === "config") {
                        return this.setConfigs(v);
                    }
                    if (k in this && this[k] === v) {
                        return;
                    }
                    var res = {
                        newValue: v
                    };
                    if (k in this) {
                        res.oldValue = isObject(this[k]) ? helper.deepClone(this[k]) : this[k];
                    }
                    this[k] = v;
                    this.emit(k, res);
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            setConfigs: {

                /**
                 * @method setConfigs
                 * @param {Object} v
                 */
                value: function setConfigs(v) {
                    Object.keys(v).forEach(function (k) {
                        this.setConfig(k, v[k]);
                    }, this);
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            setConfig: {

                /**
                 * set a config property
                 * @method setConfig
                 * @param {String} k
                 * @param {*} v
                 */
                value: function setConfig(k, v) {
                    if (arguments.length === 1) {
                        return this.setConfigs(k);
                    }
                    if (k in this.config && this.config[k] === v) {
                        return;
                    }
                    var res = {
                        key: k,
                        newValue: v
                    };
                    if (k in this.config) {
                        res.oldValue = isObject(this.config[k]) ? helper.deepClone(this.config[k]) : this.config[k];
                    }
                    this.config[k] = v;
                    this.emit("config", res);
                    this.emit("config/" + k, res);
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            getConfig: {

                /**
                 * @method getConfig
                 * @param {String} k
                 * @returns {*}
                 */
                value: function getConfig(k) {
                    var res = this.config[k],
                        getter = k + "Getter";
                    if (this.config[getter]) {
                        return this.config[getter](res, this);
                    }
                    return res;
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            removeEvts: {
                value: function removeEvts(evts) {
                    evts.forEach(function (evt) {
                        if (this.evts[evt]) {
                            this.evts[evt].remove();
                            delete this.evts[evt];
                        }
                    }, this);
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            destroy: {

                /**
                 * @method destroy
                 */
                value: function destroy() {
                    this.connect.forEach(function (c) {
                        c.remove();
                    });
                    this.connect.length = 0;
                    Object.keys(this.evts).forEach(function (e) {
                        this.evts[e].remove();
                    }, this);
                    this.evts = {};
                    this.event.purgeListeners();
                    this.$purgeSuper && this.$purgeSuper();
                },
                writable: true,
                enumerable: true,
                configurable: true
            }
        });

        return BaseEvented;
    })();

    module.exports = BaseEvented;
    /**
     * eventize an object by composition
     * @method eventize
     * @static
     * @param {Object} self
     * @returns {Object}
     */
    BaseEvented.eventize = function (self) {
        self.event = new CustomEvent();
        helper.applyIf(self, {
            evts: {},
            connect: [],
            config: {}
        });
        var proto = BaseEvented.prototype,
            supers = {};
        Object.keys(proto).forEach(function (k) {
            if (k in self && typeof self[k] === "function") {
                supers[k] = proto[k];
            } else {
                self[k] = proto[k];
            }
        });
        self.$super = function (k) {
            return supers[k] && supers[k].apply(this, slice.call(arguments, 1));
        };
        self.$purgeSuper = function () {
            supers = null;
        };
        return self;
    };
});