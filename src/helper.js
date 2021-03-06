if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    configurable: true,
    writable: true,
    value(...args) {
      const [target] = args;
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert first argument to object');
      }
      const to = Object(target);
      for (let i = 1; i < args.length; i++) {
        const nextSource = args[i];
        if (nextSource === undefined || nextSource === null) continue;
        const keysArray = Object.keys(Object(nextSource));
        for (let nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
          const nextKey = keysArray[nextIndex];
          const desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) to[nextKey] = nextSource[nextKey];
        }
      }
      return to;
    }
  });
}
const helper = {
  toJSON(str, parser) {
    const re = /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;
    return JSON.parse(str, (key, value) => {
      if (typeof (value) === 'string' && value.match(re)) {
        value = new Date(value);
      }
      if (parser) {
        value = parser(value);
      }
      return value;
    });
  },
  imgSize(src) {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.onload = function () {
        resolve({
          width: img.width,
          height: img.height
        });
      };
      img.onerror = reject;
      img.src = src;
    });
  },
  imgResize(src, size = {}, mimeType = 'image/jpeg') {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      img.onload = function () {
        const { maxWidth: MAX_WIDTH = 400, maxHeight: MAX_HEIGHT = 300 } = size;
        let { width, height } = img;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        width = +width.toFixed(1);
        height = +height.toFixed(1);
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        resolve({
          data: canvas.toDataURL(mimeType),
          size: {
            width,
            height
          }
        });
      };
      img.onerror = reject;
      img.src = src;
    });
  },
  /**
   * @method taskBuffer
   * @param {Array.<function(next:function)>} tasks
   * @param {Object} [scope]
   * @returns {{on: Function}}
   */
  taskBuffer: function taskBuffer(...args) {
    const [tasks, scope] = args;
    const slice = Array.prototype.slice;
    let task;
    const on = {};
    let error;

    function next(...nArgs) {
      task = tasks.shift();
      if (task) {
        task.apply(scope, [next].concat(slice.call(nArgs, 0)));
      } else if (on.done) {
        on.done();
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
  queue: function queue(tasks, callback) {
    var task;
    if (task = tasks.shift()) {
      task(function (err) {
        if (err) {
          if (typeof err !== 'object') {
            err = new Error(err);
          }
          err.currentTask = task;
          return callback && callback(err);
        }
        queue(tasks, callback);
      });
    } else {
      callback && callback();
    }
  },
  /**
   *
   * @param {Array.<function>} tasks
   * @param {Object} opt
   * @param {Number} opt.stackNumber
   * @param {Number} [opt.delay]
   * @param {Function} callback
   */
  stackedQueue: function stackedTaskQueue(tasks, opt, callback) {
    opt = opt || {};
    var queue, stackedTasks = [];
    while ((queue = tasks.splice(0, opt.stackNumber)).length) {
      stackedTasks.push((function (q) {
        return function (cb) {
          helper.taskBufferAsync(q, function () {
            console.log('stackedQueue task', arguments);
            if (opt.delay) {
              setTimeout(cb, opt.delay);
            } else {
              cb();
            }
          });
        }
      })(queue.slice(0)));
    }
    this.queue(stackedTasks, callback);
  },
  taskBufferAsync: function (tasks, finished, options) {
    options = options || {};
    var total = tasks.length, task, terminated = false;
    var done = function (err) {
      if (terminated) {
        return;
      }
      total--;
      if (!total || err) {
        finished && finished(err);
        terminated = true;
      }
    };
    var run = function () {
      if (!tasks.length) {
        return console.warn('taskBufferAsync - no task appending');
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
  uuid: (typeof (window) !== 'undefined' && typeof (window.crypto) != 'undefined' &&
    typeof (window.crypto.getRandomValues) != 'undefined') ?
    function () {
      // If we have a cryptographically secure PRNG, use that
      // http://stackoverflow.com/questions/6906916/collisions-when-generating-uuids-in-javascript
      var buf = new Uint16Array(8);
      window.crypto.getRandomValues(buf);
      var S4 = function (num) {
        var ret = num.toString(16);
        while (ret.length < 4) {
          ret = '0' + ret;
        }
        return ret;
      };
      return (S4(buf[0]) + S4(buf[1]) + '-' + S4(buf[2]) + '-' + S4(buf[3]) + '-' + S4(buf[4]) + '-' + S4(buf[5]) + S4(buf[6]) + S4(buf[7]));
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
  'async': function (makeGenerator) {
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
              handle(generator.throw(err));
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
    canvas.getContext('2d').scale(ratio, ratio);
    tmp = null;
  },
  /**
   *
   * @param {String} src datauri or image url
   * @param {Number} [deg] rotation degree or callback
   */
  rotateImage: function (src, deg) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');
    var degrees = 0;
    var img = new Image();

    function rotate(deg, destroy) {
      degrees = (degrees + deg) % 360;
      var absDeg = Math.abs(degrees);
      if (absDeg == 90 || absDeg == 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (absDeg == 90 || absDeg == 270) {
        ctx.translate(img.height / 2, img.width / 2);
      } else {
        ctx.translate(img.width / 2, img.height / 2);
      }
      ctx.rotate(degrees * Math.PI / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      var dataUri = canvas.toDataURL(), size = {
        width: canvas.width,
        height: canvas.height
      };
      if (destroy) {
        canvas = ctx = img = null;
      }
      return {
        src: dataUri,
        size: size,
        degrees: degrees
      };
    }

    return new Promise((resolve, reject) => {
      img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, canvas.width / 2 - img.width / 2, canvas.height / 2 - img.width / 2);
        resolve(typeof (deg) === 'number' ? rotate(deg, true) : rotate);
      };
      img.onerror = reject;
      img.src = src;
    });
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
  /**
   * @method getProp
   * @param {Array} parts
   * @param {Boolean} create
   * @param {Object} context
   * @return Object
   */
  getProp: function (parts, create, context) {
    var obj = context || window;
    for (var i = 0, p; obj && (p = parts[i]); i++) {
      obj = (p in obj ? obj[p] : (create ? obj[p] = {} : undefined));
    }
    return obj; // mixed
  },
  /**
   * @method getObject
   * @param {String} name
   * @param {Boolean} create
   * @param {Object} context
   * @return Object
   */
  getObject: function (name, create, context) {
    return helper.getProp(name.split('.'), create, context); // Object
  },
  substitute: function (template, map, transform, scope) {
    var run = function (data) {
      return template.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g,
        function (match, key, format) {
          var value = helper.getObject(key, false, data);
          if (format) {
            value = helper.getObject(format, false, scope).call(scope, value, key);
          }
          return transform(value, key).toString();
        });
    };
    transform = transform ? transform.bind(scope) : function (v) {
      return v;
    };
    return map ? run(map) : function (map) {
      return run(map);
    };
  },
  findItemByKey: function (key, value, items) {
    var item;
    items.some(function (itm) {
      if (itm && itm[key] === value) {
        item = itm;
        return true;
      }
    });
    return item;
  },
  /**
   * according to [The structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/Guide/DOM/The_structured_clone_algorithm)
   * @method deepClone
   * @param {Object} oToBeCloned
   * @returns {Object}
   */
  deepClone: function deepClone(oToBeCloned) {
    if (!oToBeCloned || typeof oToBeCloned !== 'object' || typeof (oToBeCloned) === 'function') {
      // null, undefined, any non-object, or function
      return oToBeCloned; // anything
    }
    var oClone, FConstr = oToBeCloned.constructor;

    if (typeof (HTMLElement) !== 'undefined' && oToBeCloned instanceof HTMLElement) {
      oClone = oToBeCloned.cloneNode(true);
    } else if (oToBeCloned instanceof RegExp) {
      oClone = new RegExp(oToBeCloned.source,
        'g'.substr(0, Number(oToBeCloned.global)) +
        'i'.substr(0, Number(oToBeCloned.ignoreCase)) +
        'm'.substr(0, Number(oToBeCloned.multiline)));
    } else if (oToBeCloned instanceof Date) {
      oClone = new Date(oToBeCloned.getTime());
    } else {
      oClone = FConstr ? new FConstr() : {};
      for (var sProp in oToBeCloned) {
        if (!oToBeCloned.hasOwnProperty(sProp)) {
          continue;
        }
        oClone[sProp] = deepClone(oToBeCloned[sProp]);
      }
    }
    return oClone;
  },
  /**
   * example:
   *
   *      isType('Object')({toto:1});
   *
   * @method isType
   * @param {String} compare Object,String,Array,Function, etc.
   * @returns {Function}
   */
  isType: function isType(compare) {
    if (typeof compare === 'string' && /^\w+$/.test(compare)) {
      compare = '[object ' + compare + ']';
    } else {
      compare = Object.prototype.toString.call(compare);
    }
    return isType[compare] || (isType[compare] = function (o) {
      return Object.prototype.toString.call(o) === compare;
    });
  },
  /**
   * guess real type
   * @method realType
   * @param str
   * @returns {*}
   */
  realType: function (str) {
    var xml;
    if (typeof (str) !== 'string') {
      return str;
    }
    str = str.trim();
    if (str.trim() === '') {
      return str;
    }
    var mapping = ['true', 'false', 'null', 'undefined'];
    if (+str === 0 || +str) {
      return +str;
    }
    if (!!~mapping.indexOf(str.toLowerCase())) {
      return eval(str.toLowerCase());
    }
    try {
      return JSON.parse(str);
    } catch (e) {
    }
    xml = new DOMParser().parseFromString(str, 'text/xml');
    if (!xml.getElementsByTagName('parsererror').length) {
      return xml;
    }
    return str;
  },
  /**
   * @method castType
   * @param {*} value
   * @param {String} type
   * @returns {*}
   */
  castType: function (value, type) {
    var typeMapping = {
      'string': function (s) {
        return s + '';
      },
      'number': function (n) {
        return +n;
      },
      'array': function (arr) {
        if (Array.isArray(arr)) {
          return arr;
        }
        try {
          var tmp = JSON.parse(arr);
          if (Array.isArray(tmp)) {
            return tmp;
          }
        } catch (e) {

        }
        return arr.split(',');
      },
      'boolean': function (value) {
        if (!value) {
          value = false;
        } else {
          value = ('' + value).toLowerCase();
          value = value !== 'false';
        }
        return value;
      },
      'object': function (o) {
        try {
          return JSON.parse(o);
        } catch (e) {
          return null;
        }
      },
      'xml': function (str) {
        return new DOMParser().parseFromString(str, 'text/xml');
      }
    };
    if (arguments.length === 0) {
      return typeMapping;
    }
    return typeMapping[type] && typeMapping[type](value);
  },
  queryToObject: function (query, separator) {
    separator = separator || '&';
    query = query.trim();
    if (!query) {
      return;
    }
    var params = {};
    query.split(separator).forEach(function (part) {
      part = part.trim();
      if (!part) {
        return;
      }
      var p = part.split('=');
      params[p[0].trim()] = p[1].trim();
    });
    return params;
  },
  objectToQuery: function (obj, separator, fromJson) {
    separator = separator || '&';
    var query = [];
    Object.keys(obj).forEach(function (k) {
      var o = obj[k], tmp;
      if (typeof (o) === 'object' && fromJson) {
        try {
          tmp = JSON.stringify(o);
        } catch (e) {
          //
        }
        if (tmp !== undefined) {
          o = encodeURIComponent(tmp);
        }
      }
      query.push(k + '=' + o);
    });
    return query.join(separator);
  },
  applyIf: function applyIf(dest, obj, override) {
    var key;
    for (key in obj) {
      if (obj.hasOwnProperty(key) && (!(key in dest) || override)) {
        dest[key] = obj[key];
      }
    }
  },
  /**
   * @method merge
   * @param {Object} target
   * @param {Object} source
   * @param {Boolean} [nonStrict]
   * @returns {*}
   */
  merge: function merge(target, source, nonStrict) {
    var tval, sval, name;
    for (name in source) {
      if (!nonStrict && !source.hasOwnProperty(name)) {
        continue;
      }
      tval = target[name];
      sval = source[name];
      if (tval !== sval) {
        if (tval && typeof tval === 'object' && sval && typeof sval === 'object') {
          merge(tval, sval, nonStrict);
        } else {
          target[name] = sval;
        }
      }
    }
    return target;
  },
  leftPad: function leftPad(pad, mystr) {
    mystr += '';
    pad += '';
    return (pad + mystr).slice(-Math.max(pad.length, mystr.length));
  },
  rightPad: function rightPad(pad, mystr) {
    mystr += '';
    pad += '';
    return (mystr + pad).slice(0, Math.max(pad.length, mystr.length));
  }
};
helper.isNodeWebkit = (function () {
  return !!(typeof (process) === 'object' && process && process.__node_webkit);
})();
export default helper;
