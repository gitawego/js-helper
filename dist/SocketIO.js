(function (factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports", "module", "./helper"], factory);
    } else if (typeof exports !== "undefined" && typeof module !== "undefined") {
        factory(exports, module, require("./helper"));
    }
})(function (exports, module, _helper) {
    "use strict";

    var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

    var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

    //var io = require("socket.io-client/socket.io");
    var helper = _interopRequire(_helper);

    var LZString = require("lz-string");

    "use strict";
    var SocketClient = (function () {
        function SocketClient(socket, parent) {
            this.socket = socket;
            this.parent = parent;
        }

        _prototypeProperties(SocketClient, null, {
            emit: {
                value: function emit(evtName, msg, callback) {
                    if (callback) {
                        var uuid = helper.uuid(),
                            rm;
                        msg._uuid = uuid;
                        this.once("disconnect", function () {
                            rm && rm();
                            callback({
                                status: 1,
                                error: new Error("disconnected")
                            });
                        });
                        this.once("error", function (evt) {
                            rm && rm();
                            callback({
                                status: 1,
                                error: evt
                            });
                        });
                        rm = this.on(evtName, function (resp) {
                            if (resp._uuid === uuid) {
                                console.log("socket resp", resp, uuid);
                                rm();
                                delete resp._uuid;
                                if (resp.data && resp.compressData === "lz-string") {
                                    resp.data = JSON.parse(LZString.decompressFromUTF16(resp.data));
                                }
                                callback(resp);
                            }
                        });
                    }
                    console.log("evt", evtName, msg);
                    this.socket.emit(evtName, msg);
                    return this;
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            once: {
                value: function once(evtName, callback) {
                    var handler = this.on(evtName, function (data) {
                        handler();
                        callback(data);
                    });
                    return handler;
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            on: {
                value: function on(evtName, callback) {
                    var _this = this;
                    this.socket.on(evtName, callback);
                    return function () {
                        _this.socket.off(evtName, callback);
                    };
                },
                writable: true,
                enumerable: true,
                configurable: true
            }
        });

        return SocketClient;
    })();

    var SocketIO = (function () {
        function SocketIO(server, io, config) {
            this.io = io;
            this.namespaces = {};
            if (server) {
                this.connect(server, config);
            }
        }

        _prototypeProperties(SocketIO, null, {
            connect: {

                /**
                 *
                 * @param server
                 * @param config
                 */
                value: function connect(server, config) {
                    var _this = this;


                    this.manager = this.io.Manager(server, config);
                    var socket = this.nsp("/");
                    ["on", "emit", "once", "socket"].forEach(function (mtd) {
                        this[mtd] = socket[mtd];
                    }, this);
                    //this.socket = this.manager.socket('/');
                    //this.socket = socket.socket;

                    this.socket.on("connect", function () {
                        _this.connected = true;
                    });
                    this.socket.on("disconnect", function () {
                        console.log("disconnected");
                        _this.connected = false;
                    });
                    this.socket.on("error", function (evt) {
                        console.log("onerror", evt);
                    });
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            nsp: {
                value: function nsp(namespace) {
                    var nsp = this.namespaces[namespace];
                    if (nsp) {
                        return nsp;
                    }
                    return this.namespaces[namespace] = new SocketClient(this.manager.socket(namespace), this);
                },
                writable: true,
                enumerable: true,
                configurable: true
            }
        });

        return SocketIO;
    })();

    module.exports = SocketIO;
});