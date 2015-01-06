    if (!Object.assign) {
        Object.defineProperty(Object, "assign", {
            enumerable: false,
            configurable: true,
            writable: true,
            value: function (target, firstSource) {
                "use strict";
                if (target === undefined || target === null)
                    throw new TypeError("Cannot convert first argument to object");
                var to = Object(target);
                for (var i = 1; i < arguments.length; i++) {
                    var nextSource = arguments[i];
                    if (nextSource === undefined || nextSource === null) continue;
                    var keysArray = Object.keys(Object(nextSource));
                    for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
                        var nextKey = keysArray[nextIndex];
                        var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
                        if (desc !== undefined && desc.enumerable) to[nextKey] = nextSource[nextKey];
                    }
                }
                return to;
            }
        });
    }
    var helper = {
        /**
         * @method taskBuffer
         * @param {Array.<function(next:function)>} tasks
         * @param {Object} [scope]
         * @returns {{on: Function}}
         */
        taskBuffer: function taskBuffer(tasks, scope) {
            var slice = Array.prototype.slice, args = arguments, task, on = {}, error;

            function next() {
                if (task = tasks.shift()) {
                    task.apply(scope, [next].concat(slice.call(arguments, 0)));
                } else {
                    on.done && on.done();
                }
            }

            next.error = function (err) {
                error = err || 'unknown error';
                on.error && on.error(err, tasks);
            };
            setTimeout(function () {
                next.apply(scope, slice.call(args, 2));
            }, 0);
            return {
                on: function (evtName, fnc) {
                    on[evtName] = fnc;
                    if (error) {
                        on.error && on.error(error, tasks);
                    } else if (tasks.length === 0) {
                        on.done && on.done();
                    }
                }
            }
        },
        taskBufferAsync: function (tasks, finished, options) {
            options = options || {};
            var total = tasks.length, task;
            var done = function (err) {
                total--;
                if (!total || err) {
                    finished && finished(err);
                }
            };
            var run = function () {
                if (!tasks.length) {
                    return console.warn("taskBufferAsync - no task appending");
                }
                while (task = tasks.shift()) {
                    if ('then' in task) {
                        task.then(done);
                    } else {
                        task(done);
                    }
                }
            };
            if (options.standby) {
                return {
                    run: function () {
                        return run();
                    }
                };
            }
            return run();
        },
        uuid: (typeof(window.crypto) != 'undefined' &&
        typeof(window.crypto.getRandomValues) != 'undefined') ?
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
        },
        findParentNode: function (target, className, limitNode) {
            "use strict";
            while (target) {
                if (!target.classList) {
                    return;
                }
                if (target.classList.contains(className)) {
                    return target;
                }
                target = target.parentNode;
                if (target === limitNode) {
                    return;
                }
            }
        },
        /**
         * support commonjs and promise
         * @method async
         * @param {Function} makeGenerator a generator function which returns promise
         * @returns {Function}
         */
        "async": function(makeGenerator) {
            return function () {
                var generator = makeGenerator.apply(this, arguments);
                // { done: [Boolean], value: [Object] }
                function handle(result) {
                    if (result.done) {
                        return result.value;
                    }
                    if (result.value.then) {
                        return result.value.then(function (res) {
                            return handle(generator.next(res));
                        }, function (err) {
                            return handle(generator.throw(err));
                        });
                    } else {
                        return result.value(function (err, res) {
                            if (err) {
                                handler(generator.throw(err));
                            } else {
                                handle(generator.next(res));
                            }
                        });
                    }
                }

                return handle(generator.next());
            }
        },
        resizeCanvas: function resizeCanvas(canvas, size) {
            var ratio = window.devicePixelRatio || 1;
            var tmp = document.createElement('canvas');
            size = size || {
                width: canvas.offsetWidth,
                height: canvas.offsetHeight
            };
            tmp.width = size.width * ratio;
            tmp.height = size.height * ratio;
            tmp.getContext('2d').drawImage(canvas, 0, 0);
            canvas.width = size.width * ratio;
            canvas.height = size.height * ratio;
            canvas.getContext('2d').drawImage(tmp, 0, 0);
            canvas.getContext("2d").scale(ratio, ratio);
            tmp = null;
        },
        /**
         *
         * @param {Number} value
         * @param {String} unit target size to get, width or height
         * @param {Object} size reference size
         * @param {Number} size.width
         * @param {Number} size.height
         * @returns {number}
         */
        getRelativeSize: function getRelativeSize(value, unit, size) {
            if (unit === 'height') {
                return size.height / size.width * value;
            } else {
                return size.width / size.height * value;
            }
        },
        takeImageFromVideo: function takeImageFromVideo(video, size) {
            var canvas = document.createElement('canvas'), dataUri;
            if (!size) {
                size = {
                    width: video.videoWidth,
                    height: video.videoHeight
                }
            }
            canvas.setAttribute('width', size.width);
            canvas.setAttribute('height', size.height);
            canvas.getContext('2d').drawImage(video, 0, 0, size.width, size.height);
            dataUri = canvas.toDataURL('image/jpeg');
            canvas = null;
            return dataUri;
        },
        copyCanvas: function (src, canvasWidth) {
            "use strict";
            var height = helper.getRelativeSize(canvasWidth, 'height', {
                width: src.width,
                height: src.height
            });
            var canvas = document.createElement('canvas'), context;
            canvas.width = canvasWidth;
            canvas.height = height;
            context = canvas.getContext('2d');
            context.drawImage(src, 0, 0, canvasWidth, height);
            return canvas;
        },
        dataURLToBlob: function (dataURL) {
            var BASE64_MARKER = ';base64,', parts, contentType, raw, rawLength, uInt8Array;
            if (dataURL.indexOf(BASE64_MARKER) == -1) {
                parts = dataURL.split(',');
                contentType = parts[0].split(':')[1];
                raw = decodeURIComponent(parts[1]);

                return new Blob([raw], {type: contentType});
            }

            parts = dataURL.split(BASE64_MARKER);
            contentType = parts[0].split(':')[1];
            raw = window.atob(parts[1]);
            rawLength = raw.length;

            uInt8Array = new Uint8Array(rawLength);

            for (var i = 0; i < rawLength; ++i) {
                uInt8Array[i] = raw.charCodeAt(i);
            }

            return new Blob([uInt8Array], {type: contentType});
        }
    };
    helper.isNodeWebkit = (function () {
        "use strict";
        var isNode = (typeof process !== "undefined" && typeof require !== "undefined");
        var isNodeWebkit = false;
        //Is this Node.js?
        if (isNode) {
            //If so, test for Node-Webkit
            try {
                isNodeWebkit = (typeof require('nw.gui') !== "undefined");
            } catch (e) {
                isNodeWebkit = false;
            }
        }
        return isNodeWebkit;
    })();
    export default helper;
