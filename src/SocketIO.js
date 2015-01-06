//var io = require("socket.io-client/socket.io");
import helper from './helper';

    "use strict";
    class SocketIO {
        constructor(server,io) {
            this.io = io;
            if (server) {
                this.connect(server,io);
            }
        }
        connect(server,io) {
            io = io || this.io;
            if(!io){
                return;
            }
            this.io = io;
            this.socket = io(server);
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
    export default SocketIO;
