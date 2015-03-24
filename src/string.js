import baseHelper from './helper';
var stringHelper = {
	/**
             * @property regxps
             * @type Object
             */
            regxps:{
                "cssUrl":/url\(['"](.*?)['"]\)|url\((.*?)\)/gi,
                "cssPaths":/(?:(?:@import\s*(['"])(?![a-z]+:|\/)([^\r\n;{]+?)\1)|url\(\s*(['"]?)(?![a-z]+:|\/)([^\r\n;]+?)\3\s*\))([a-z, \s]*[;}]?)/g,
                "styleTag":/(?:<style([^>]*)>([\s\S]*?)<\/style>)/gi,
                "linkTag":/(?:<link\b[^<>]*?)(href\s*=\s*(['"])(?:(?!\2).)+\2)+[^>]*>/gi,
                "scriptTag":/<script\s*(?![^>]*type=['"]?(?:dojo\/|text\/html\b))(?:[^>]*?(?:src=(['"]?)([^>]*?)\1[^>]*)?)*>([\s\S]*?)<\/script>/gi,
                "bodyTag":/<body\s*[^>]*>([\S\s]*?)<\/body>/i,
                "htmlLink":/(<[a-z][a-z0-9]*\s[^>]*)(?:(href|src)=(['"]?)([^>]*?)\3)([^>]*>)/gi,
                "htmlComment":/<!--(.*?)-->/gi,
                "blockComment":/\/\*([\S\s]*?)\*\//gi,
                "inlineComment":/\/\/.*/g,
                "removeAmdefine":/(if[\s\S]\(([\S\s]*)require\(['"]amdefine['"]([\s\S]*?)(\}))|(if\(([\S\s]*)require\(['"]amdefine['"]([\s\S]*?);)/i,
                "removePlusNodeDefine":/if([\s\S]*?)PlusNode.define\(module\)(;$|;[\s]\})/i,
                "fullUrl":/^http(s:|:)\/\//gi,
                //this regxp matches a datauri in html tags like img,link
                "dataUri":/(data:([a-z]*)\/([a-z]*)[;,])/gi,
                //this. regxp matches special url "about:", "opera:"
                "aboutPage":/(^about|^opera):[^\s]([a-z]*)/i,
                "cssImport":/@import\s+url\(['"](.*?)['"]\);/gi,
                "normalChars":/([^\x00-\xff]|[A-Za-z0-9_.-])/gi,
                "ip":/((2[0-4]\d|25[0-5]|[01]?\d\d?)\.){3}(2[0-4]\d|25[0-5]|[01]?\d\d?)(:\d{1,6}|)$/
            },
            /**
             * exclude code by tag
             * @example
             * code ex1: code = '/ / > >for:server \n code block here \n / / < < for:server'
             * code ex2: code = '/ / > >for:server \n code block here without ending'
             * excludeCode(code,'server');
             * @method excludeCode
             * @param str
             * @param tagName
             * @return {String}
             */
            excludeCode:function (str, tagName) {
                var tag = "\\/\\/>>for:${tagName}?[^\\s]([\\s\\S]*?)\\/\\/<<for:${tagName}|\\/\\/>>for:${tagName}?[^\\s]([\\s\\S]*)";
                tag = this.substitute(tag, {
                    tagName:tagName
                });
                var pattern = new RegExp(tag, "gi");
                return str.replace(pattern, "").trim();
            },
            ucFirst:function (str) {
                str += '';
                var f = str.charAt(0).toUpperCase();
                return f + str.substr(1);
            },
            toCamel:function (str) {
                return str.replace(/(\-[a-z])/g, function ($1) {
                    return $1.toUpperCase().replace('-', '');
                });
            },
            toUnderscore:function (str) {
                return str.replace(/([A-Z])/g, function ($1) {
                    return "_" + $1.toLowerCase();
                });
            },
            toDash:function () {
                return this.replace(/([A-Z])/g, function ($1) {
                    return "-" + $1.toLowerCase();
                });
            },
            /**
             * @method replaceAt
             * @param {String} str string to be parsed
             * @param {Number} index index of character in the string
             * @param {String} char character to replace
             * @return {String}
             */
            replaceAt:function (str,index, char) {
                return str.substr(0, index) + char + str.substr(index + char.length);
            },
            /**
             * Performs parameterized substitutions on a string. ignore it if any parameter is unmatched.
             * @method substitute
             * @param {String} template a string with expressions in the form `${key}` to be replaced or
             * `${key:format}` which specifies a format function. keys are case-sensitive.
             * @param {Object|Array} map hash to search for substitutions
             * @param {Function} [transform] a function to process all parameters before substitution takes
             * place, e.g. mylib.encodeXML
             * @param {Object} [thisObject] where to look for optional format function; default to the global
             * namespace
             * @param {Array} [tags] default tag is ['$','{','}']
             * @return String
             */
            substitute:function (template, map, transform, thisObject, tags) {
                var scope = "undefined" == typeof(global) ? window : global;
                thisObject = thisObject || scope;
                transform = transform ?
                    transform.bind(thisObject) : function (v) {
                    return v;
                };
                var reg = '\\$\\{([^\\s\\:\\}]+)(?:\\:([^\\s\\:\}]+))?\\}';
                if (Array.isArray(tags) && tags.length > 1 && tags.length < 3) {
                    reg = "\\" + tags[0] + "([^\"'\\" + tags[1] + "\\s]+)([a-zA-Z_\.]*)?\\" + tags[1];
                }
                reg = new RegExp(reg, 'g');
                return template.replace(reg,
                    function (match, key, format, pos) {
                        var value = baseHelper.getObject(key, false, map);
                        if (format) {
                            value = baseHelper.getObject(format, false, thisObject) ?
                                baseHelper.getObject(format, false, thisObject).call(thisObject, value, key) : null;
                        }
                        return value ? transform(value, key).toString() : match;
                    }); // String
            },
            htmlspecialchars_decode:function (string, quote_style) {
                var optTemp = 0,
                    i = 0,
                    noquotes = false;
                if (typeof quote_style === 'undefined') {
                    quote_style = 2;
                }
                string = string.toString().replace(/&lt;/g, '<').replace(/&gt;/g, '>');
                var OPTS = {
                    'ENT_NOQUOTES':0,
                    'ENT_HTML_QUOTE_SINGLE':1,
                    'ENT_HTML_QUOTE_DOUBLE':2,
                    'ENT_COMPAT':2,
                    'ENT_QUOTES':3,
                    'ENT_IGNORE':4
                };
                if (quote_style === 0) {
                    noquotes = true;
                }
                if (typeof quote_style !== 'number') { // Allow for a single string or an array of string flags
                    quote_style = [].concat(quote_style);
                    for (i = 0; i < quote_style.length; i++) {
                        // Resolve string input to bitwise e.g. 'PATHINFO_EXTENSION' becomes 4
                        if (OPTS[quote_style[i]] === 0) {
                            noquotes = true;
                        } else if (OPTS[quote_style[i]]) {
                            optTemp = optTemp | OPTS[quote_style[i]];
                        }
                    }
                    quote_style = optTemp;
                }
                if (quote_style & OPTS.ENT_HTML_QUOTE_SINGLE) {
                    string = string.replace(/&#0*39;/g, "'"); // PHP doesn't currently escape if more than one 0, but it should
                    // string = string.replace(/&apos;|&#x0*27;/g, "'"); // This would also be useful here, but not a part of PHP
                }
                if (!noquotes) {
                    string = string.replace(/&quot;/g, '"');
                }
                // Put this in last place to avoid escape being double-decoded
                string = string.replace(/&amp;/g, '&');

                return string;
            },
            htmlspecialchars:function (string, quote_style, charset, double_encode) {
                var optTemp = 0,
                    i = 0,
                    noquotes = false;
                if (typeof quote_style === 'undefined' || quote_style === null) {
                    quote_style = 2;
                }
                string = string.toString();
                if (double_encode !== false) { // Put this first to avoid double-encoding
                    string = string.replace(/&/g, '&amp;');
                }
                string = string.replace(/</g, '&lt;').replace(/>/g, '&gt;');

                var OPTS = {
                    'ENT_NOQUOTES':0,
                    'ENT_HTML_QUOTE_SINGLE':1,
                    'ENT_HTML_QUOTE_DOUBLE':2,
                    'ENT_COMPAT':2,
                    'ENT_QUOTES':3,
                    'ENT_IGNORE':4
                };
                if (quote_style === 0) {
                    noquotes = true;
                }
                if (typeof quote_style !== 'number') { // Allow for a single string or an array of string flags
                    quote_style = [].concat(quote_style);
                    for (i = 0; i < quote_style.length; i++) {
                        // Resolve string input to bitwise e.g. 'PATHINFO_EXTENSION' becomes 4
                        if (OPTS[quote_style[i]] === 0) {
                            noquotes = true;
                        } else if (OPTS[quote_style[i]]) {
                            optTemp = optTemp | OPTS[quote_style[i]];
                        }
                    }
                    quote_style = optTemp;
                }
                if (quote_style & OPTS.ENT_HTML_QUOTE_SINGLE) {
                    string = string.replace(/'/g, '&#039;');
                }
                if (!noquotes) {
                    string = string.replace(/"/g, '&quot;');
                }

                return string;
            },
            /**
             * @method adjustCSSPaths
             * @param content
             * @param {Function|String} callback a callback function or basic url (string)
             * @param action
             */
            adjustCSSPaths:function (content, callback, action) {
                var self = this;
                action = action || "replace";
                callback = typeof callback != "string" ? callback : (function (baseUrl) {
                    return function (url, end, tag) {
                        var mapping = {
                            "import":"@import '{content}'" + end,
                            "url":"url({content})" + end
                        };
                        return mapping[tag.toLowerCase()].replace(/\{content\}/g, self.absPath(url, baseUrl));
                    }
                })(callback);
                var cssPaths = /(?:(?:@import\s*(['"])(?![a-z]+:|\/)([^\r\n;{]+?)\1)|url\(\s*(['"]?)(?![a-z]+:|\/)([^\r\n;]+?)\3\s*\))([a-z, \s]*[;}]?)/g;
                return content.replace(cssPaths,
                    function (ignore, delimStr, strUrl, delimUrl, urlUrl, end) {
                        if (strUrl) {
                            return action === "replace" ? callback(strUrl, end, "import") : "";
                        } else {
                            return action === "replace" ? callback(urlUrl, end, "url") : "";
                        }
                    });
            },
            /**
             * @method adjustHTMLPaths
             * @param {String} content html string
             * @param {String} url base url
             */
            adjustHTMLPaths:function (content,url) {
                url = url || "";
                var htmlAttrPaths = stringHelper.regxps.htmlLink,
                    fullUrl = stringHelper.regxps.fullUrl;
                content = content.replace(htmlAttrPaths,
                    function (ignore, start, name, delim, relUrl, end) {
                        if (relUrl) {
                            return (relUrl != "#" && !relUrl.match(fullUrl)) ?
                                start + name + '=' + delim + stringHelper.absPath(relUrl, url) + delim + end :
                                ignore;
                        }
                        return ignore;
                    });
                return content;
            },
            /**
             * get absolute path based on basicUrl
             * @method absPath
             * @param {String} url
             * @param {String} base
             */
            absPath:function (url, base) {
                if (url.match(stringHelper.regxps.aboutPage) || url.match(stringHelper.regxps.dataUri) ||
                    url.match(stringHelper.regxps.fullUrl) || url.match(/^\//)) {
                    return url;
                }
                var Loc = base || location.href;
                Loc = Loc.substring(0, Loc.lastIndexOf('/'));
                while (/^\.\./.test(url)) {
                    Loc = Loc.substring(0, Loc.lastIndexOf('/'));
                    url = url.substring(3);
                }
                return Loc + '/' + url;
            },
            addSlashes:function (str) {
                return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
            },
            addCSlashes:function (str, charlist) {
                // http://kevin.vanzonneveld.net
                // +   original by: Brett Zamir (http://brett-zamir.me)
                // %  note 1: We show double backslashes in the return value example code below because a JavaScript string will not
                // %  note 1: render them as backslashes otherwise
                // *     example 1: addcslashes('foo[ ]', 'A..z'); // Escape all ASCII within capital A to lower z range, including square brackets
                // *     returns 1: "\\f\\o\\o\\[ \\]"
                // *     example 2: addcslashes("zoo['.']", 'z..A'); // Only escape z, period, and A here since not a lower-to-higher range
                // *     returns 2: "\\zoo['\\.']"
                // *     example 3: addcslashes("@a\u0000\u0010\u00A9", "\0..\37!@\177..\377") == '\\@a\\000\\020\\302\\251'); // Escape as octals those specified and less than 32 (0x20) or greater than 126 (0x7E), but not otherwise
                // *     returns 3: true
                // *     example 4: addcslashes("\u0020\u007E", "\40..\175") == '\\ ~'); // Those between 32 (0x20 or 040) and 126 (0x7E or 0176) decimal value will be backslashed if specified (not octalized)
                // *     returns 4: true
                // *     example 5: addcslashes("\r\u0007\n", '\0..\37'); // Recognize C escape sequences if specified
                // *     returns 5: "\\r\\a\\n"
                // *     example 6: addcslashes("\r\u0007\n", '\0'); // Do not recognize C escape sequences if not specified
                // *     returns 7: "\r\u0007\n"
                var target = '',
                    chrs = [],
                    i = 0,
                    j = 0,
                    c = '',
                    next = '',
                    rangeBegin = '',
                    rangeEnd = '',
                    chr = '',
                    begin = 0,
                    end = 0,
                    octalLength = 0,
                    postOctalPos = 0,
                    cca = 0,
                    escHexGrp = [],
                    encoded = '',
                    percentHex = /%([\dA-Fa-f]+)/g;
                var _pad = function (n, c) {
                    if ((n = n + '').length < c) {
                        return new Array(++c - n.length).join('0') + n;
                    }
                    return n;
                };

                for (i = 0; i < charlist.length; i++) {
                    c = charlist.charAt(i);
                    next = charlist.charAt(i + 1);
                    if (c === '\\' && next && (/\d/).test(next)) { // Octal
                        rangeBegin = charlist.slice(i + 1).match(/^\d+/)[0];
                        octalLength = rangeBegin.length;
                        postOctalPos = i + octalLength + 1;
                        if (charlist.charAt(postOctalPos) + charlist.charAt(postOctalPos + 1) === '..') { // Octal begins range
                            begin = rangeBegin.charCodeAt(0);
                            if ((/\\\d/).test(charlist.charAt(postOctalPos + 2) + charlist.charAt(postOctalPos + 3))) { // Range ends with octal
                                rangeEnd = charlist.slice(postOctalPos + 3).match(/^\d+/)[0];
                                i += 1; // Skip range end backslash
                            } else if (charlist.charAt(postOctalPos + 2)) { // Range ends with character
                                rangeEnd = charlist.charAt(postOctalPos + 2);
                            } else {
                                throw 'Range with no end point';
                            }
                            end = rangeEnd.charCodeAt(0);
                            if (end > begin) { // Treat as a range
                                for (j = begin; j <= end; j++) {
                                    chrs.push(String.fromCharCode(j));
                                }
                            } else { // Supposed to treat period, begin and end as individual characters only, not a range
                                chrs.push('.', rangeBegin, rangeEnd);
                            }
                            i += rangeEnd.length + 2; // Skip dots and range end (already skipped range end backslash if present)
                        } else { // Octal is by itself
                            chr = String.fromCharCode(parseInt(rangeBegin, 8));
                            chrs.push(chr);
                        }
                        i += octalLength; // Skip range begin
                    } else if (next + charlist.charAt(i + 2) === '..') { // Character begins range
                        rangeBegin = c;
                        begin = rangeBegin.charCodeAt(0);
                        if ((/\\\d/).test(charlist.charAt(i + 3) + charlist.charAt(i + 4))) { // Range ends with octal
                            rangeEnd = charlist.slice(i + 4).match(/^\d+/)[0];
                            i += 1; // Skip range end backslash
                        } else if (charlist.charAt(i + 3)) { // Range ends with character
                            rangeEnd = charlist.charAt(i + 3);
                        } else {
                            throw 'Range with no end point';
                        }
                        end = rangeEnd.charCodeAt(0);
                        if (end > begin) { // Treat as a range
                            for (j = begin; j <= end; j++) {
                                chrs.push(String.fromCharCode(j));
                            }
                        } else { // Supposed to treat period, begin and end as individual characters only, not a range
                            chrs.push('.', rangeBegin, rangeEnd);
                        }
                        i += rangeEnd.length + 2; // Skip dots and range end (already skipped range end backslash if present)
                    } else { // Character is by itself
                        chrs.push(c);
                    }
                }

                for (i = 0; i < str.length; i++) {
                    c = str.charAt(i);
                    if (chrs.indexOf(c) !== -1) {
                        target += '\\';
                        cca = c.charCodeAt(0);
                        if (cca < 32 || cca > 126) { // Needs special escaping
                            switch (c) {
                                case '\n':
                                    target += 'n';
                                    break;
                                case '\t':
                                    target += 't';
                                    break;
                                case '\u000D':
                                    target += 'r';
                                    break;
                                case '\u0007':
                                    target += 'a';
                                    break;
                                case '\v':
                                    target += 'v';
                                    break;
                                case '\b':
                                    target += 'b';
                                    break;
                                case '\f':
                                    target += 'f';
                                    break;
                                default:
                                    //target += _pad(cca.toString(8), 3);break; // Sufficient for UTF-16
                                    encoded = encodeURIComponent(c);

                                    // 3-length-padded UTF-8 octets
                                    if ((escHexGrp = percentHex.exec(encoded)) !== null) {
                                        target += _pad(parseInt(escHexGrp[1], 16).toString(8), 3); // already added a slash above
                                    }
                                    while ((escHexGrp = percentHex.exec(encoded)) !== null) {
                                        target += '\\' + _pad(parseInt(escHexGrp[1], 16).toString(8), 3);
                                    }
                                    break;
                            }
                        } else { // Perform regular backslashed escaping
                            target += c;
                        }
                    } else { // Just add the character unescaped
                        target += c;
                    }
                }
                return target;
            },
            /**
             * compare 2 different version string
             * ex: compareVersion('1.2.0','1.2.1') >> 1
             * compareVersion('1.1.2','1.1.1.54') >> -1
             * compareVersion('1.3','1.3') >> 0
             * @method compareVersion
             * @param {String} v1
             * @param {String} v2
             * @param {String} [separator] default is "."
             * @return {Number} -1: v1 is bigger; 0: v1==v2; 1: v2 is bigger
             */
            compareVersion:function (v1, v2, separator) {
                if (v1 === v2) {
                    return 0;
                }
                separator = separator || ".";
                var splitV1 = v1.split(separator),
                    splitV2 = v2.split(separator),
                    rV1, rV2,
                    i = 0;
                if (splitV1.length == 2 && splitV2.length == 2) {
                    rV1 = Number(v1);
                    rV2 = Number(v2);
                    if (rV1 == rV2) {
                        return 0;
                    }
                    return rV1 > rV2 ? -1 : 1;
                }
                for (var l = splitV1.length; i < l; i++) {
                    rV1 = Number(splitV1[i]);
                    rV2 = Number(splitV2[i]);
                    if (rV1 == rV2) {
                        continue;
                    }
                    return rV1 > rV2 ? -1 : 1;
                }
                splitV2 = splitV2.splice(i);
                if (splitV2.length === 0) {
                    return 0;
                }
                while (splitV2.length > 0) {
                    if (Number(splitV2.shift()) > 0) {
                        return 1;
                    }
                }
                return 0;
            },
            /**
             * convert version number string/object to number
             * @method toNumberVersion
             * @param {String|Object} ver
             * @return {Number}
             */
            toNumberVersion:function (ver) {
                if ("string" == typeof(ver)) {
                    ver = ver.split(".");
                } else {
                    ver = [ver.major,ver.minor,ver.patch];
                }
                return +(ver[0] + "." + ver[1] + this.leftPad(""+ver[2],2,"0"));
            },
            /**
             * @method removeAccents
             * @param {String} str
             * @return {String}
             */
            removeAccents:function (str) {
                var patternStr = "ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž";
                var rep = ['A', 'A', 'A', 'A', 'A', 'A', 'a', 'a', 'a', 'a', 'a', 'a', 'O', 'O', 'O', 'O', 'O', 'O', 'O',
                    'o', 'o', 'o', 'o', 'o', 'o', 'E', 'E', 'E', 'E', 'e', 'e', 'e', 'e', 'e', 'C', 'c', 'D',
                    'I', 'I', 'I', 'I', 'i', 'i', 'i', 'i', 'U', 'U', 'U', 'U', 'u', 'u', 'u', 'u', 'N', 'n', 'S', 's', 'Y', 'y', 'y', 'Z', 'z'];
                return str.replace(new RegExp("[" + patternStr + "]", "g"), function (m) {
                    return rep[patternStr.indexOf(m)];
                });
            },
            /**
             * two bytes character and a-z,0-9,.,- are permitted.
             * @method removeSpecialCharacters
             * @param {String} str
             * @return {String}
             */
            removeSpecialCharacters:function (str) {
                var m = this.removeAccents(str).match(stringHelper.regxps.normalChars);
                return m && m.join("");
            },
            leftPad:function (result, size, ch) {
                if (!ch) {
                    ch = " ";
                }
                while (result.length < size) {
                    result = ch + result;
                }
                return result;
            },
            rightPad:function (result, size, ch) {
                if (!ch) {
                    ch = " ";
                }
                while (result.length < size) {
                    result = result + ch;
                }
                return result;
            },
            htmlentities:function (string, quote_style, charset, double_encode) {
                var hash_map = this.get_html_translation_table('HTML_ENTITIES', quote_style), symbol = '';
                string = string == null ? '' : string + '';

                if (!hash_map) {
                    return false;
                }

                if (quote_style && quote_style === 'ENT_QUOTES') {
                    hash_map["'"] = '&#039;';
                }

                if (!!double_encode || double_encode == null) {
                    for (symbol in hash_map) {
                        string = string.split(symbol).join(hash_map[symbol]);
                    }
                } else {
                    string = string.replace(/([\s\S]*?)(&(?:#\d+|#x[\da-f]+|[a-zA-Z][\da-z]*);|$)/g, function (ignore, text, entity) {
                        for (symbol in hash_map) {
                            text = text.split(symbol).join(hash_map[symbol]);
                        }

                        return text + entity;
                    });
                }

                return string;
            },
            html_entity_decode:function (string, quote_style) {
                var hash_map = {}, symbol = '', tmp_str = '', entity = '';
                tmp_str = string.toString();

                if (false === (hash_map = this.get_html_translation_table('HTML_ENTITIES', quote_style))) {
                    return false;
                }

                // fix &amp; problem
                // http://phpjs.org/functions/get_html_translation_table:416#comment_97660
                delete(hash_map['&']);
                hash_map['&'] = '&amp;';

                for (symbol in hash_map) {
                    entity = hash_map[symbol];
                    tmp_str = tmp_str.split(entity).join(symbol);
                }
                tmp_str = tmp_str.split('&#039;').join("'");

                return tmp_str;
            },
            get_html_translation_table:function (table, quote_style) {
                var entities = {}, hash_map = {}, decimal = 0, symbol = '';
                var constMappingTable = {}, constMappingQuoteStyle = {};
                var useTable = {}, useQuoteStyle = {};

                // Translate arguments
                constMappingTable[0] = 'HTML_SPECIALCHARS';
                constMappingTable[1] = 'HTML_ENTITIES';
                constMappingQuoteStyle[0] = 'ENT_NOQUOTES';
                constMappingQuoteStyle[2] = 'ENT_COMPAT';
                constMappingQuoteStyle[3] = 'ENT_QUOTES';

                useTable = !isNaN(table) ? constMappingTable[table] : table ? table.toUpperCase() : 'HTML_SPECIALCHARS';
                useQuoteStyle = !isNaN(quote_style) ? constMappingQuoteStyle[quote_style] : quote_style ? quote_style.toUpperCase() : 'ENT_COMPAT';

                if (useTable !== 'HTML_SPECIALCHARS' && useTable !== 'HTML_ENTITIES') {
                    throw new Error("Table: " + useTable + ' not supported');
                    // return false;
                }

                entities['38'] = '&amp;';
                if (useTable === 'HTML_ENTITIES') {
                    entities['160'] = '&nbsp;';
                    entities['161'] = '&iexcl;';
                    entities['162'] = '&cent;';
                    entities['163'] = '&pound;';
                    entities['164'] = '&curren;';
                    entities['165'] = '&yen;';
                    entities['166'] = '&brvbar;';
                    entities['167'] = '&sect;';
                    entities['168'] = '&uml;';
                    entities['169'] = '&copy;';
                    entities['170'] = '&ordf;';
                    entities['171'] = '&laquo;';
                    entities['172'] = '&not;';
                    entities['173'] = '&shy;';
                    entities['174'] = '&reg;';
                    entities['175'] = '&macr;';
                    entities['176'] = '&deg;';
                    entities['177'] = '&plusmn;';
                    entities['178'] = '&sup2;';
                    entities['179'] = '&sup3;';
                    entities['180'] = '&acute;';
                    entities['181'] = '&micro;';
                    entities['182'] = '&para;';
                    entities['183'] = '&middot;';
                    entities['184'] = '&cedil;';
                    entities['185'] = '&sup1;';
                    entities['186'] = '&ordm;';
                    entities['187'] = '&raquo;';
                    entities['188'] = '&frac14;';
                    entities['189'] = '&frac12;';
                    entities['190'] = '&frac34;';
                    entities['191'] = '&iquest;';
                    entities['192'] = '&Agrave;';
                    entities['193'] = '&Aacute;';
                    entities['194'] = '&Acirc;';
                    entities['195'] = '&Atilde;';
                    entities['196'] = '&Auml;';
                    entities['197'] = '&Aring;';
                    entities['198'] = '&AElig;';
                    entities['199'] = '&Ccedil;';
                    entities['200'] = '&Egrave;';
                    entities['201'] = '&Eacute;';
                    entities['202'] = '&Ecirc;';
                    entities['203'] = '&Euml;';
                    entities['204'] = '&Igrave;';
                    entities['205'] = '&Iacute;';
                    entities['206'] = '&Icirc;';
                    entities['207'] = '&Iuml;';
                    entities['208'] = '&ETH;';
                    entities['209'] = '&Ntilde;';
                    entities['210'] = '&Ograve;';
                    entities['211'] = '&Oacute;';
                    entities['212'] = '&Ocirc;';
                    entities['213'] = '&Otilde;';
                    entities['214'] = '&Ouml;';
                    entities['215'] = '&times;';
                    entities['216'] = '&Oslash;';
                    entities['217'] = '&Ugrave;';
                    entities['218'] = '&Uacute;';
                    entities['219'] = '&Ucirc;';
                    entities['220'] = '&Uuml;';
                    entities['221'] = '&Yacute;';
                    entities['222'] = '&THORN;';
                    entities['223'] = '&szlig;';
                    entities['224'] = '&agrave;';
                    entities['225'] = '&aacute;';
                    entities['226'] = '&acirc;';
                    entities['227'] = '&atilde;';
                    entities['228'] = '&auml;';
                    entities['229'] = '&aring;';
                    entities['230'] = '&aelig;';
                    entities['231'] = '&ccedil;';
                    entities['232'] = '&egrave;';
                    entities['233'] = '&eacute;';
                    entities['234'] = '&ecirc;';
                    entities['235'] = '&euml;';
                    entities['236'] = '&igrave;';
                    entities['237'] = '&iacute;';
                    entities['238'] = '&icirc;';
                    entities['239'] = '&iuml;';
                    entities['240'] = '&eth;';
                    entities['241'] = '&ntilde;';
                    entities['242'] = '&ograve;';
                    entities['243'] = '&oacute;';
                    entities['244'] = '&ocirc;';
                    entities['245'] = '&otilde;';
                    entities['246'] = '&ouml;';
                    entities['247'] = '&divide;';
                    entities['248'] = '&oslash;';
                    entities['249'] = '&ugrave;';
                    entities['250'] = '&uacute;';
                    entities['251'] = '&ucirc;';
                    entities['252'] = '&uuml;';
                    entities['253'] = '&yacute;';
                    entities['254'] = '&thorn;';
                    entities['255'] = '&yuml;';
                }

                if (useQuoteStyle !== 'ENT_NOQUOTES') {
                    entities['34'] = '&quot;';
                }
                if (useQuoteStyle === 'ENT_QUOTES') {
                    entities['39'] = '&#39;';
                }
                entities['60'] = '&lt;';
                entities['62'] = '&gt;';


                // ascii decimals to real symbols
                for (decimal in entities) {
                    symbol = String.fromCharCode(decimal);
                    hash_map[symbol] = entities[decimal];
                }

                return hash_map;
            }

};
export default stringHelper;