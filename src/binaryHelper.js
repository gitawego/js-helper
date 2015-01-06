    "use strict";
    var binaryHelper = {
        blobToArrayBuffer: function blobToArrayBuffer(blob) {
            var reader = new FileReader(), deferred = Promise.defer();
            reader.addEventListener("loadend", function () {
                // reader.result contains the contents of blob as a typed array
                deferred.resolve(this.result);
            });
            reader.addEventListener("error", function (err) {
                // reader.result contains the contents of blob as a typed array
                deferred.reject(err);
            });
            reader.readAsArrayBuffer(blob);
            return deferred.promise;
        },
        arrayBufferToBinary: function ArrayBufferToString(buffer) {
            var arr = new Uint8Array(buffer);
            return binaryHelper.fromCharCodes(arr, buffer.byteLength);
        },
        arrayBufferToString: function (buffer) {
            return binaryHelper.binaryToString(binaryHelper.arrayBufferToBinary(buffer));
        },
        /**
         * for nodejs
         * @param {ArrayBuffer} buffer
         * @returns {Buffer}
         */
        arrayToBuffer: function (buffer) {
            return new Buffer(new Uint8Array(buffer));
        },
        fromCharCodes: function (arr, len) {
            if (typeof(len) !== 'number') {
                len = arr.length;
            }
            var i = 0, str = "", fromCharCode = String.fromCharCode;
            for (; i < len; i++) {
                str += fromCharCode(arr[i]);
            }
            return str;
        },
        stringToArrayBuffer: function stringToArrayBuffer(string) {
            return binaryHelper.stringToUint8Array(string).buffer;
        },

        binaryToString: function binaryToString(binary) {
            var error;
            try {
                return decodeURIComponent(escape(binary));
            } catch (_error) {
                error = _error;
                if (error instanceof URIError) {
                    return binary;
                } else {
                    throw error;
                }
            }
        },

        stringToBinary: function stringToBinary(string) {
            var chars, code, i, isUCS2, len, _i;

            len = string.length;
            chars = [];
            isUCS2 = false;
            for (i = _i = 0; 0 <= len ? _i < len : _i > len; i = 0 <= len ? ++_i : --_i) {
                //code = String.prototype.charCodeAt.call(string, i);
                code = string.charCodeAt(i);
                if (code > 255) {
                    isUCS2 = true;
                    chars = null;
                    break;
                } else {
                    chars.push(code);
                }
            }
            if (isUCS2 === true) {
                return unescape(encodeURIComponent(string));
            } else {
                return chars && binaryHelper.fromCharCodes(chars);
            }
        },

        stringToUint8Array: function stringToUint8Array(string) {
            var binary, binLen, buffer, chars, i, _i;
            binary = binaryHelper.stringToBinary(string);
            binLen = binary.length;
            buffer = new ArrayBuffer(binLen);
            chars = new Uint8Array(buffer);
            for (i = _i = 0; 0 <= binLen ? _i < binLen : _i > binLen; i = 0 <= binLen ? ++_i : --_i) {
                //chars[i] = String.prototype.charCodeAt.call(binary, i);
                chars[i] = binary.charCodeAt(i);
            }
            return chars;
        }
    };
    export default binaryHelper;
