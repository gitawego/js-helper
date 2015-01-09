import CustomEvent from './CustomEvent';

'use strict';
var evt = new CustomEvent();
/**
 * topic system (publish/subscribe)
 * @singleton
 * @requires CustomEvent
 *
 */
 class Topic{
    pub(topic){
        //>>excludeStart("production", pragmas.production);
        if (!this.hasTopic(topic)) {
            console.warn('%c topic ' + topic + ' doesn\'t have subscriber yet','background:yellow');
        }
        //>>excludeEnd("production");
        return evt.broadcast.apply(evt, arguments);
    }
    /**
     * subscribe to a topic
     * @method sub
     * @param {String} topic
     * @param {Function} fnc
     * @param {Boolean} [once]
     * @returns {{id:String,remove:Function}}
     */
    sub (topic, fnc, once) {
        return evt[once ? 'once' : 'on'](topic, fnc);
    }
    /**
     * unsubscribe a topic
     * @method unsub
     * @param {String} topic
     * @param {Function|String} id
     * @returns {*}
     */
    unsub (topic, id) {
        return evt.off(topic, id);
    }
    hasTopic (topic) {
        return evt.hasListeners(topic);
    }
    getTopics () {
        return Object.keys(evt._listeners);
    }
 }

export default new Topic();