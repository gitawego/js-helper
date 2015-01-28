(function (factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports", "module"], factory);
    } else if (typeof exports !== "undefined" && typeof module !== "undefined") {
        factory(exports, module);
    }
})(function (exports, module) {
    "use strict";
    var binaryHelper = {
        blobToArrayBuffer: function blobToArrayBuffer(blob) {
            return new Promise(function (resolve, reject) {
                var reader = new FileReader();
                reader.addEventListener("loadend", function () {
                    // reader.result contains the contents of blob as a typed array
                    resolve(this.result);
                });
                reader.addEventListener("error", reject);
                reader.readAsArrayBuffer(blob);
            });
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
            if (typeof len !== "number") {
                len = arr.length;
            }
            var i = 0,
                str = "",
                fromCharCode = String.fromCharCode;
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
        },
        dataURLToBlob: function (dataURL) {
            var BASE64_MARKER = ";base64,",
                parts,
                contentType,
                raw,
                rawLength,
                uInt8Array;
            if (dataURL.indexOf(BASE64_MARKER) == -1) {
                parts = dataURL.split(",");
                contentType = parts[0].split(":")[1];
                raw = decodeURIComponent(parts[1]);

                return new Blob([raw], { type: contentType });
            }

            parts = dataURL.split(BASE64_MARKER);
            contentType = parts[0].split(":")[1];
            raw = window.atob(parts[1]);
            rawLength = raw.length;

            uInt8Array = new Uint8Array(rawLength);

            for (var i = 0; i < rawLength; ++i) {
                uInt8Array[i] = raw.charCodeAt(i);
            }

            return new Blob([uInt8Array], { type: contentType });
        }
    };
    module.exports = binaryHelper;
});