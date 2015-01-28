(function (factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports", "module", "./CustomEvent"], factory);
    } else if (typeof exports !== "undefined" && typeof module !== "undefined") {
        factory(exports, module, require("./CustomEvent"));
    }
})(function (exports, module, _CustomEvent) {
    "use strict";

    var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

    var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

    var CustomEvent = _interopRequire(_CustomEvent);

    "use strict";
    var evt = new CustomEvent();
    /**
     * topic system (publish/subscribe)
     * @singleton
     * @requires CustomEvent
     *
     */
    var Topic = (function () {
        function Topic() {}

        _prototypeProperties(Topic, null, {
            pub: {
                value: function pub(topic) {
                    //>>excludeStart("production", pragmas.production);
                    if (!this.hasTopic(topic)) {
                        console.warn("%c topic " + topic + " doesn't have subscriber yet", "background:yellow");
                    }
                    //>>excludeEnd("production");
                    return evt.broadcast.apply(evt, arguments);
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            sub: {
                /**
                 * subscribe to a topic
                 * @method sub
                 * @param {String} topic
                 * @param {Function} fnc
                 * @param {Boolean} [once]
                 * @returns {{id:String,remove:Function}}
                 */
                value: function sub(topic, fnc, once) {
                    return evt[once ? "once" : "on"](topic, fnc);
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            unsub: {
                /**
                 * unsubscribe a topic
                 * @method unsub
                 * @param {String} topic
                 * @param {Function|String} id
                 * @returns {*}
                 */
                value: function unsub(topic, id) {
                    return evt.off(topic, id);
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            hasTopic: {
                value: function hasTopic(topic) {
                    return evt.hasListeners(topic);
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            getTopics: {
                value: function getTopics() {
                    return Object.keys(evt._listeners);
                },
                writable: true,
                enumerable: true,
                configurable: true
            }
        });

        return Topic;
    })();

    module.exports = new Topic();
});