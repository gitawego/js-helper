var encodeHelper = {
    /**
     * it better works with base64 encoded string
     *
     * copyright FinanceTime
     * @method compressStr
     * @param {String} s
     * @returns {String}
     */
    compressStr: function (s) {
        var i, l, out = '';
        if (s.length % 2 !== 0) {
            s += ' ';
        }
        for (i = 0, l = s.length; i < l; i += 2) {
            out += String.fromCharCode((s.charCodeAt(i) * 256) + s.charCodeAt(i + 1));
        }
        // Add a snowman prefix to mark the resulting string as encoded.
        return String.fromCharCode(9731) + out;
    },
    /**
     * copyright FinanceTime
     *
     * works with compressStr
     * @method decompressStr
     * @param {String} s
     * @returns {String}
     */
    decompressStr: function (s) {
        var i, l, n, m, out = '';
        // If not prefixed with a snowman, just return the (already uncompressed) string.
        if (s.charCodeAt(0) !== 9731) {
            return s;
        }
        for (i = 1, l = s.length; i < l; i++) {
            n = s.charCodeAt(i);
            m = Math.floor(n / 256);
            out += String.fromCharCode(m, n % 256);
        }
        //if string is utf8 encoded, trim it
        return out.trim();
    },
    uuid: (typeof(window) !== 'undefined' && typeof(window.crypto) !== 'undefined' &&
    typeof(window.crypto.getRandomValues) !== 'undefined') ?
        function () {
            // If we have a cryptographically secure PRNG, use that
            // http://stackoverflow.com/questions/6906916/collisions-when-generating-uuids-in-javascript
            var buf = new Uint16Array(8);
            window.crypto.getRandomValues(buf);
            var S4 = function (num) {
                var ret = num.toString(16);
                while (ret.length < 4) {
                    ret = "0" + ret;
                }
                return ret;
            };
            return (S4(buf[0]) + S4(buf[1]) + "-" + S4(buf[2]) + "-" + S4(buf[3]) + "-" + S4(buf[4]) + "-" + S4(buf[5]) + S4(buf[6]) + S4(buf[7]));
        } : function (tpl) {
        tpl = tpl || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
        var d = (new Date()).getTime();
        return tpl.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
        });
    }
};
export default encodeHelper;