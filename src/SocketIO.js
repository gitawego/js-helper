//var io = require("socket.io-client/socket.io");
import helper from './helper';
let LZString = require('lz-string');

"use strict";
class SocketClient {
    constructor(socket, parent) {
        this.socket = socket;
        this.parent = parent;
    }

    emit(evtName, msg, callback) {
        if (callback) {
            var uuid = helper.uuid(), rm;
            msg._uuid = uuid;
            this.once('disconnect', function () {
                rm && rm();
                callback({
                    status: 1,
                    error: new Error('disconnected')
                });
            });
            this.once('error', function (evt) {
                rm && rm();
                callback({
                    status: 1,
                    error: evt
                });
            });
            rm = this.on(evtName, function (resp) {
                if (resp._uuid === uuid) {
                    console.log('socket resp', resp, uuid);
                    rm();
                    delete resp._uuid;
                    if(resp.data && resp.compressData === "lz-string"){
                        resp.data = JSON.parse(LZString.decompressFromUTF16(resp.data));
                    }
                    callback(resp);
                }
            });
        }
        console.log('evt', evtName, msg);
        this.socket.emit(evtName, msg);
        return this;
    }

    once(evtName, callback) {
        var handler = this.on(evtName, function (data) {
            handler();
            callback(data);
        });
        return handler;
    }

    on(evtName, callback) {
        this.socket.on(evtName, callback);
        return ()=> {
            this.socket.off(evtName, callback);
        }
    }
}

class SocketIO {
    constructor(server, io, config) {
        this.io = io;
        this.namespaces = {};
        if (server) {
            this.connect(server, config);
        }
    }

    /**
     *
     * @param server
     * @param config
     */
    connect(server, config) {

        this.manager = this.io.Manager(server, config);
        var socket = this.nsp('/');
        ['on', 'emit', 'once', 'socket'].forEach(function (mtd) {
            this[mtd] = socket[mtd];
        }, this);
        //this.socket = this.manager.socket('/');
        //this.socket = socket.socket;

        this.socket.on('connect', () => {
            this.connected = true;
        });
        this.socket.on('disconnect', () => {
            console.log('disconnected');
            this.connected = false;
        });
        this.socket.on('error', (evt)=> {
            console.log('onerror', evt);
        });
    }

    nsp(namespace) {
        var nsp = this.namespaces[namespace];
        if (nsp) {
            return nsp;
        }
        return this.namespaces[namespace] = new SocketClient(this.manager.socket(namespace), this);
    }


}
export default SocketIO;
