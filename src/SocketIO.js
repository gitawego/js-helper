//var io = require("socket.io-client/socket.io");
import helper from './helper';

class SocketClient {
  constructor(socket, parent) {
    this.socket = socket;
    this.parent = parent;
  }

  emit(evtName, msg, callback) {
    var fullData;
    var resolve = function (data) {
      callback && callback(data);
      callback = null;
    };
    if (callback) {
      //var uuid = helper.uuid(), rm;
      //msg._uuid = uuid;
      this.once('disconnect', function () {
        fullData = null;
        resolve({
          status: 1,
          error: new Error('disconnected')
        });
      });
      this.once('error', function (evt) {
        fullData = null;
        resolve({
          status: 1,
          error: evt
        });
      });
    }
    console.log('evt', evtName, msg);
    this.socket.emit(evtName, msg, function (resp) {
      if (resp.partial) {
        if (typeof(resp.data) === 'object') {
          fullData = fullData || [];
          fullData.push(resp.data);
        } else {
          fullData = fullData || '';
          fullData += resp.data;
        }
        if (resp.partial.total === resp.partial.range.end) {
          delete resp._uuid;
          delete resp.partial;
          resp.data = fullData;
          fullData = null;
          resolve(resp);
        }

      } else {
        delete resp._uuid;
        resolve(resp);
      }
    });
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

  disconnect() {
    this.manager.disconnect();
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
