var Readable = require('stream').Readable;
var node = {
  getLocalIp: function () {
    var ips = {};
    var os = require('os');
    var ifaces = os.networkInterfaces();

    Object.keys(ifaces).forEach(function (ifname) {
      var alias = 0;

      ifaces[ifname].forEach(function (iface) {
        if ('IPv4' !== iface.family || iface.internal !== false) {
          // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
          return;
        }

        if (alias >= 1) {
          // this single interface has multiple ipv4 addresses
          ips[ifname + ':' + alias] = iface.address;
        } else {
          // this interface has only one ipv4 adress
          ips[ifname] = iface.address;
        }
      });
    });
    return ips;
  },
  streamize(str){
    var s = new Readable;
    s.push(str);    // the string you want
    s.push(null);      // indicates end-of-file basically - the end of the stream
    return s;
  }
};
export default node;
