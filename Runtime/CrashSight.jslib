"use strict";

mergeInto(LibraryManager.library, {
  CS_Load: function CS_Load() {
    if (globalThis.hasLoadCrashSight) {
      return;
    }
    globalThis.hasLoadCrashSight = true;
    if (typeof globalThis.wx === 'undefined') {
      return;
    }
    function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
    function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
    function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
    function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }

    // ========================== MD5 Core Begin===============================

    /**
     * Add integers, wrapping at 2^32.
     * This uses 16-bit operations internally to work around bugs in interpreters.
     *
     * @param {number} x First integer
     * @param {number} y Second integer
     * @returns {number} Sum
     */
    function safeAdd(x, y) {
      var lsw = (x & 0xffff) + (y & 0xffff);
      var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
      return msw << 16 | lsw & 0xffff;
    }

    /**
     * Bitwise rotate a 32-bit number to the left.
     *
     * @param {number} num 32-bit number
     * @param {number} cnt Rotation count
     * @returns {number} Rotated number
     */
    function bitRotateLeft(num, cnt) {
      return num << cnt | num >>> 32 - cnt;
    }

    /**
     * Basic operation the algorithm uses.
     *
     * @param {number} q q
     * @param {number} a a
     * @param {number} b b
     * @param {number} x x
     * @param {number} s s
     * @param {number} t t
     * @returns {number} Result
     */
    function md5cmn(q, a, b, x, s, t) {
      return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
    }
    /**
     * Basic operation the algorithm uses.
     *
     * @param {number} a a
     * @param {number} b b
     * @param {number} c c
     * @param {number} d d
     * @param {number} x x
     * @param {number} s s
     * @param {number} t t
     * @returns {number} Result
     */
    function md5ff(a, b, c, d, x, s, t) {
      return md5cmn(b & c | ~b & d, a, b, x, s, t);
    }
    /**
     * Basic operation the algorithm uses.
     *
     * @param {number} a a
     * @param {number} b b
     * @param {number} c c
     * @param {number} d d
     * @param {number} x x
     * @param {number} s s
     * @param {number} t t
     * @returns {number} Result
     */
    function md5gg(a, b, c, d, x, s, t) {
      return md5cmn(b & d | c & ~d, a, b, x, s, t);
    }
    /**
     * Basic operation the algorithm uses.
     *
     * @param {number} a a
     * @param {number} b b
     * @param {number} c c
     * @param {number} d d
     * @param {number} x x
     * @param {number} s s
     * @param {number} t t
     * @returns {number} Result
     */
    function md5hh(a, b, c, d, x, s, t) {
      return md5cmn(b ^ c ^ d, a, b, x, s, t);
    }
    /**
     * Basic operation the algorithm uses.
     *
     * @param {number} a a
     * @param {number} b b
     * @param {number} c c
     * @param {number} d d
     * @param {number} x x
     * @param {number} s s
     * @param {number} t t
     * @returns {number} Result
     */
    function md5ii(a, b, c, d, x, s, t) {
      return md5cmn(c ^ (b | ~d), a, b, x, s, t);
    }

    /**
     * Calculate the MD5 of an array of little-endian words, and a bit length.
     *
     * @param {Array} x Array of little-endian words
     * @param {number} len Bit length
     * @returns {Array<number>} MD5 Array
     */
    function binlMD5(x, len) {
      /* append padding */
      x[len >> 5] |= 0x80 << len % 32;
      x[(len + 64 >>> 9 << 4) + 14] = len;
      var i;
      var olda;
      var oldb;
      var oldc;
      var oldd;
      var a = 1732584193;
      var b = -271733879;
      var c = -1732584194;
      var d = 271733878;
      for (i = 0; i < x.length; i += 16) {
        olda = a;
        oldb = b;
        oldc = c;
        oldd = d;
        a = md5ff(a, b, c, d, x[i], 7, -680876936);
        d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
        c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
        b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
        a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
        d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
        c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
        b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
        a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
        d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
        c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
        b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
        a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
        d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
        c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
        b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
        a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
        d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
        c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
        b = md5gg(b, c, d, a, x[i], 20, -373897302);
        a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
        d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
        c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
        b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
        a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
        d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
        c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
        b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
        a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
        d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
        c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
        b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
        a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
        d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
        c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
        b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
        a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
        d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
        c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
        b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
        a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
        d = md5hh(d, a, b, c, x[i], 11, -358537222);
        c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
        b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
        a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
        d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
        c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
        b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
        a = md5ii(a, b, c, d, x[i], 6, -198630844);
        d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
        c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
        b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
        a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
        d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
        c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
        b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
        a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
        d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
        c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
        b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
        a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
        d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
        c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
        b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
        a = safeAdd(a, olda);
        b = safeAdd(b, oldb);
        c = safeAdd(c, oldc);
        d = safeAdd(d, oldd);
      }
      return [a, b, c, d];
    }

    /**
     * Convert an array of little-endian words to a string
     *
     * @param {Array<number>} input MD5 Array
     * @returns {string} MD5 string
     */
    function binl2rstr(input) {
      var i;
      var output = '';
      var length32 = input.length * 32;
      for (i = 0; i < length32; i += 8) {
        output += String.fromCharCode(input[i >> 5] >>> i % 32 & 0xff);
      }
      return output;
    }

    /**
     * Convert a raw string to an array of little-endian words
     * Characters >255 have their high-byte silently ignored.
     *
     * @param {string} input Raw input string
     * @returns {Array<number>} Array of little-endian words
     */
    function rstr2binl(input) {
      var i;
      var output = [];
      output[(input.length >> 2) - 1] = undefined;
      for (i = 0; i < output.length; i += 1) {
        output[i] = 0;
      }
      var length8 = input.length * 8;
      for (i = 0; i < length8; i += 8) {
        output[i >> 5] |= (input.charCodeAt(i / 8) & 0xff) << i % 32;
      }
      return output;
    }

    /**
     * Calculate the MD5 of a raw string
     *
     * @param {string} s Input string
     * @returns {string} Raw MD5 string
     */
    function rstrMD5(s) {
      return binl2rstr(binlMD5(rstr2binl(s), s.length * 8));
    }

    /**
     * Calculates the HMAC-MD5 of a key and some data (raw strings)
     *
     * @param {string} key HMAC key
     * @param {string} data Raw input string
     * @returns {string} Raw MD5 string
     */
    function rstrHMACMD5(key, data) {
      var i;
      var bkey = rstr2binl(key);
      var ipad = [];
      var opad = [];
      var hash;
      ipad[15] = opad[15] = undefined;
      if (bkey.length > 16) {
        bkey = binlMD5(bkey, key.length * 8);
      }
      for (i = 0; i < 16; i += 1) {
        ipad[i] = bkey[i] ^ 0x36363636;
        opad[i] = bkey[i] ^ 0x5c5c5c5c;
      }
      hash = binlMD5(ipad.concat(rstr2binl(data)), 512 + data.length * 8);
      return binl2rstr(binlMD5(opad.concat(hash), 512 + 128));
    }

    /**
     * Convert a raw string to a hex string
     *
     * @param {string} input Raw input string
     * @returns {string} Hex encoded string
     */
    function rstr2hex(input) {
      var hexTab = '0123456789abcdef';
      var output = '';
      var x;
      var i;
      for (i = 0; i < input.length; i += 1) {
        x = input.charCodeAt(i);
        output += hexTab.charAt(x >>> 4 & 0x0f) + hexTab.charAt(x & 0x0f);
      }
      return output;
    }

    /**
     * Encode a string as UTF-8
     *
     * @param {string} input Input string
     * @returns {string} UTF8 string
     */
    function str2rstrUTF8(input) {
      return unescape(encodeURIComponent(input));
    }

    /**
     * Encodes input string as raw MD5 string
     *
     * @param {string} s Input string
     * @returns {string} Raw MD5 string
     */
    function rawMD5(s) {
      return rstrMD5(str2rstrUTF8(s));
    }
    /**
     * Encodes input string as Hex encoded string
     *
     * @param {string} s Input string
     * @returns {string} Hex encoded string
     */
    function hexMD5(s) {
      return rstr2hex(rawMD5(s));
    }
    /**
     * Calculates the raw HMAC-MD5 for the given key and data
     *
     * @param {string} k HMAC key
     * @param {string} d Input string
     * @returns {string} Raw MD5 string
     */
    function rawHMACMD5(k, d) {
      return rstrHMACMD5(str2rstrUTF8(k), str2rstrUTF8(d));
    }
    /**
     * Calculates the Hex encoded HMAC-MD5 for the given key and data
     *
     * @param {string} k HMAC key
     * @param {string} d Input string
     * @returns {string} Raw MD5 string
     */
    function hexHMACMD5(k, d) {
      return rstr2hex(rawHMACMD5(k, d));
    }
    var md5 = {
      /**
      * Calculates MD5 value for a given string.
      * If a key is provided, calculates the HMAC-MD5 value.
      * Returns a Hex encoded string unless the raw argument is given.
      *
      * @param {string} string Input string
      * @param {string} [key] HMAC key
      * @param {boolean} [raw] Raw output switch
      * @returns {string} MD5 output
      */
      md5: function md5(string, key, raw) {
        if (!key) {
          if (!raw) {
            return hexMD5(string);
          }
          return rawMD5(string);
        }
        if (!raw) {
          return hexHMACMD5(key, string);
        }
        return rawHMACMD5(key, string);
      }
    };
    function md5Func(arg) {
      return md5.md5(arg);
    }

    // ========================== fflate Core Begin===============================

    var Worker;
    var workerAdd = ";var __w=require('worker_threads');__w.parentPort.on('message',function(m){onmessage({data:m})}),postMessage=function(m,t){__w.parentPort.postMessage(m,t)},close=process.exit;self=global";
    try {
      Worker = require('worker_threads').Worker;
    } catch (e) {}
    var node_worker_1 = {};
    node_worker_1["default"] = Worker ? function (c, _, msg, transfer, cb) {
      var done = false;
      var w = new Worker(c + workerAdd, {
        eval: true
      }).on('error', function (e) {
        return cb(e, null);
      }).on('message', function (m) {
        return cb(null, m);
      }).on('exit', function (c) {
        if (c && !done) cb(new Error('exited with code ' + c), null);
      });
      w.postMessage(msg, transfer);
      w.terminate = function () {
        done = true;
        return Worker.prototype.terminate.call(w);
      };
      return w;
    } : function (_, __, ___, ____, cb) {
      setImmediate(function () {
        return cb(new Error('async operations unsupported - update to Node 12+ (or Node 10-11 with the --experimental-worker CLI flag)'), null);
      });
      var NOP = function NOP() {};
      return {
        terminate: NOP,
        postMessage: NOP
      };
    };

    // aliases for shorter compressed code (most minifers don't do this)
    var u8 = Uint8Array,
      u16 = Uint16Array,
      i32 = Int32Array;
    // fixed length extra bits
    var fleb = new u8([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, /* unused */0, 0, /* impossible */0]);
    // fixed distance extra bits
    var fdeb = new u8([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, /* unused */0, 0]);
    // code length index map
    var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
    // get base, reverse index map from extra bits
    var freb = function freb(eb, start) {
      var b = new u16(31);
      for (var i = 0; i < 31; ++i) {
        b[i] = start += 1 << eb[i - 1];
      }
      // numbers here are at max 18 bits
      var r = new i32(b[30]);
      for (var i = 1; i < 30; ++i) {
        for (var j = b[i]; j < b[i + 1]; ++j) {
          r[j] = j - b[i] << 5 | i;
        }
      }
      return {
        b: b,
        r: r
      };
    };
    var _a = freb(fleb, 2),
      fl = _a.b,
      revfl = _a.r;
    // we can ignore the fact that the other numbers are wrong; they never happen anyway
    fl[28] = 258, revfl[258] = 28;
    var _b = freb(fdeb, 0),
      fd = _b.b,
      revfd = _b.r;
    // map of value to reverse (assuming 16 bits)
    var rev = new u16(32768);
    for (var i = 0; i < 32768; ++i) {
      // reverse table algorithm from SO
      var x = (i & 0xAAAA) >> 1 | (i & 0x5555) << 1;
      x = (x & 0xCCCC) >> 2 | (x & 0x3333) << 2;
      x = (x & 0xF0F0) >> 4 | (x & 0x0F0F) << 4;
      rev[i] = ((x & 0xFF00) >> 8 | (x & 0x00FF) << 8) >> 1;
    }
    // create huffman tree from u8 "map": index -> code length for code index
    // mb (max bits) must be at most 15
    // TODO: optimize/split up?
    var hMap = function hMap(cd, mb, r) {
      var s = cd.length;
      // index
      var i = 0;
      // u16 "map": index -> # of codes with bit length = index
      var l = new u16(mb);
      // length of cd must be 288 (total # of codes)
      for (; i < s; ++i) {
        if (cd[i]) ++l[cd[i] - 1];
      }
      // u16 "map": index -> minimum code for bit length = index
      var le = new u16(mb);
      for (i = 1; i < mb; ++i) {
        le[i] = le[i - 1] + l[i - 1] << 1;
      }
      var co;
      if (r) {
        // u16 "map": index -> number of actual bits, symbol for code
        co = new u16(1 << mb);
        // bits to remove for reverser
        var rvb = 15 - mb;
        for (i = 0; i < s; ++i) {
          // ignore 0 lengths
          if (cd[i]) {
            // num encoding both symbol and bits read
            var sv = i << 4 | cd[i];
            // free bits
            var r_1 = mb - cd[i];
            // start value
            var v = le[cd[i] - 1]++ << r_1;
            // m is end value
            for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
              // every 16 bit value starting with the code yields the same result
              co[rev[v] >> rvb] = sv;
            }
          }
        }
      } else {
        co = new u16(s);
        for (i = 0; i < s; ++i) {
          if (cd[i]) {
            co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
          }
        }
      }
      return co;
    };
    // fixed length tree
    var flt = new u8(288);
    for (var i = 0; i < 144; ++i) flt[i] = 8;
    for (var i = 144; i < 256; ++i) flt[i] = 9;
    for (var i = 256; i < 280; ++i) flt[i] = 7;
    for (var i = 280; i < 288; ++i) flt[i] = 8;
    // fixed distance tree
    var fdt = new u8(32);
    for (var i = 0; i < 32; ++i) fdt[i] = 5;
    // fixed length map
    var flm = /*#__PURE__*/hMap(flt, 9, 0),
      flrm = /*#__PURE__*/hMap(flt, 9, 1);
    // fixed distance map
    var fdm = /*#__PURE__*/hMap(fdt, 5, 0),
      fdrm = /*#__PURE__*/hMap(fdt, 5, 1);
    // find max of array
    var max = function max(a) {
      var m = a[0];
      for (var i = 1; i < a.length; ++i) {
        if (a[i] > m) m = a[i];
      }
      return m;
    };
    // read d, starting at bit p and mask with m
    var bits = function bits(d, p, m) {
      var o = p / 8 | 0;
      return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
    };
    // read d, starting at bit p continuing for at least 16 bits
    var bits16 = function bits16(d, p) {
      var o = p / 8 | 0;
      return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
    };
    // get end of byte
    var shft = function shft(p) {
      return (p + 7) / 8 | 0;
    };
    // typed array slice - allows garbage collector to free original reference,
    // while being more compatible than .slice
    var slc = function slc(v, s, e) {
      if (s == null || s < 0) s = 0;
      if (e == null || e > v.length) e = v.length;
      // can't use .constructor in case user-supplied
      return new u8(v.subarray(s, e));
    };
    /**
    * Codes for errors generated within this library
    */
    exports.FlateErrorCode = {
      UnexpectedEOF: 0,
      InvalidBlockType: 1,
      InvalidLengthLiteral: 2,
      InvalidDistance: 3,
      StreamFinished: 4,
      NoStreamHandler: 5,
      InvalidHeader: 6,
      NoCallback: 7,
      InvalidUTF8: 8,
      ExtraFieldTooLong: 9,
      InvalidDate: 10,
      FilenameTooLong: 11,
      StreamFinishing: 12,
      InvalidZipData: 13,
      UnknownCompressionMethod: 14
    };
    // error codes
    var ec = ['unexpected EOF', 'invalid block type', 'invalid length/literal', 'invalid distance', 'stream finished', 'no stream handler',, 'no callback', 'invalid UTF-8 data', 'extra field too long', 'date not in range 1980-2099', 'filename too long', 'stream finishing', 'invalid zip data'
    // determined by unknown compression method
    ];
    ;
    var _err = function err(ind, msg, nt) {
      var e = new Error(msg || ec[ind]);
      e.code = ind;
      if (Error.captureStackTrace) Error.captureStackTrace(e, _err);
      if (!nt) throw e;
      return e;
    };
    // expands raw DEFLATE data
    var inflt = function inflt(dat, st, buf, dict) {
      // source length       dict length
      var sl = dat.length,
        dl = dict ? dict.length : 0;
      if (!sl || st.f && !st.l) return buf || new u8(0);
      var noBuf = !buf;
      // have to estimate size
      var resize = noBuf || st.i != 2;
      // no state
      var noSt = st.i;
      // Assumes roughly 33% compression ratio average
      if (noBuf) buf = new u8(sl * 3);
      // ensure buffer can fit at least l elements
      var cbuf = function cbuf(l) {
        var bl = buf.length;
        // need to increase size to fit
        if (l > bl) {
          // Double or set to necessary, whichever is greater
          var nbuf = new u8(Math.max(bl * 2, l));
          nbuf.set(buf);
          buf = nbuf;
        }
      };
      //  last chunk         bitpos           bytes
      var _final = st.f || 0,
        pos = st.p || 0,
        bt = st.b || 0,
        lm = st.l,
        dm = st.d,
        lbt = st.m,
        dbt = st.n;
      // total bits
      var tbts = sl * 8;
      do {
        if (!lm) {
          // BFINAL - this is only 1 when last chunk is next
          _final = bits(dat, pos, 1);
          // type: 0 = no compression, 1 = fixed huffman, 2 = dynamic huffman
          var type = bits(dat, pos + 1, 3);
          pos += 3;
          if (!type) {
            // go to end of byte boundary
            var s = shft(pos) + 4,
              l = dat[s - 4] | dat[s - 3] << 8,
              t = s + l;
            if (t > sl) {
              if (noSt) _err(0);
              break;
            }
            // ensure size
            if (resize) cbuf(bt + l);
            // Copy over uncompressed data
            buf.set(dat.subarray(s, t), bt);
            // Get new bitpos, update byte count
            st.b = bt += l, st.p = pos = t * 8, st.f = _final;
            continue;
          } else if (type == 1) lm = flrm, dm = fdrm, lbt = 9, dbt = 5;else if (type == 2) {
            //  literal                            lengths
            var hLit = bits(dat, pos, 31) + 257,
              hcLen = bits(dat, pos + 10, 15) + 4;
            var tl = hLit + bits(dat, pos + 5, 31) + 1;
            pos += 14;
            // length+distance tree
            var ldt = new u8(tl);
            // code length tree
            var clt = new u8(19);
            for (var i = 0; i < hcLen; ++i) {
              // use index map to get real code
              clt[clim[i]] = bits(dat, pos + i * 3, 7);
            }
            pos += hcLen * 3;
            // code lengths bits
            var clb = max(clt),
              clbmsk = (1 << clb) - 1;
            // code lengths map
            var clm = hMap(clt, clb, 1);
            for (var i = 0; i < tl;) {
              var r = clm[bits(dat, pos, clbmsk)];
              // bits read
              pos += r & 15;
              // symbol
              var s = r >> 4;
              // code length to copy
              if (s < 16) {
                ldt[i++] = s;
              } else {
                //  copy   count
                var c = 0,
                  n = 0;
                if (s == 16) n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];else if (s == 17) n = 3 + bits(dat, pos, 7), pos += 3;else if (s == 18) n = 11 + bits(dat, pos, 127), pos += 7;
                while (n--) ldt[i++] = c;
              }
            }
            //    length tree                 distance tree
            var lt = ldt.subarray(0, hLit),
              dt = ldt.subarray(hLit);
            // max length bits
            lbt = max(lt);
            // max dist bits
            dbt = max(dt);
            lm = hMap(lt, lbt, 1);
            dm = hMap(dt, dbt, 1);
          } else _err(1);
          if (pos > tbts) {
            if (noSt) _err(0);
            break;
          }
        }
        // Make sure the buffer can hold this + the largest possible addition
        // Maximum chunk size (practically, theoretically infinite) is 2^17
        if (resize) cbuf(bt + 131072);
        var lms = (1 << lbt) - 1,
          dms = (1 << dbt) - 1;
        var lpos = pos;
        for (;; lpos = pos) {
          // bits read, code
          var c = lm[bits16(dat, pos) & lms],
            sym = c >> 4;
          pos += c & 15;
          if (pos > tbts) {
            if (noSt) _err(0);
            break;
          }
          if (!c) _err(2);
          if (sym < 256) buf[bt++] = sym;else if (sym == 256) {
            lpos = pos, lm = null;
            break;
          } else {
            var add = sym - 254;
            // no extra bits needed if less
            if (sym > 264) {
              // index
              var i = sym - 257,
                b = fleb[i];
              add = bits(dat, pos, (1 << b) - 1) + fl[i];
              pos += b;
            }
            // dist
            var d = dm[bits16(dat, pos) & dms],
              dsym = d >> 4;
            if (!d) _err(3);
            pos += d & 15;
            var dt = fd[dsym];
            if (dsym > 3) {
              var b = fdeb[dsym];
              dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
            }
            if (pos > tbts) {
              if (noSt) _err(0);
              break;
            }
            if (resize) cbuf(bt + 131072);
            var end = bt + add;
            if (bt < dt) {
              var shift = dl - dt,
                dend = Math.min(dt, end);
              if (shift + bt < 0) _err(3);
              for (; bt < dend; ++bt) buf[bt] = dict[shift + bt];
            }
            for (; bt < end; ++bt) buf[bt] = buf[bt - dt];
          }
        }
        st.l = lm, st.p = lpos, st.b = bt, st.f = _final;
        if (lm) _final = 1, st.m = lbt, st.d = dm, st.n = dbt;
      } while (!_final);
      // don't reallocate for streams or user buffers
      return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
    };
    // starting at p, write the minimum number of bits that can hold v to d
    var wbits = function wbits(d, p, v) {
      v <<= p & 7;
      var o = p / 8 | 0;
      d[o] |= v;
      d[o + 1] |= v >> 8;
    };
    // starting at p, write the minimum number of bits (>8) that can hold v to d
    var wbits16 = function wbits16(d, p, v) {
      v <<= p & 7;
      var o = p / 8 | 0;
      d[o] |= v;
      d[o + 1] |= v >> 8;
      d[o + 2] |= v >> 16;
    };
    // creates code lengths from a frequency table
    var hTree = function hTree(d, mb) {
      // Need extra info to make a tree
      var t = [];
      for (var i = 0; i < d.length; ++i) {
        if (d[i]) t.push({
          s: i,
          f: d[i]
        });
      }
      var s = t.length;
      var t2 = t.slice();
      if (!s) return {
        t: et,
        l: 0
      };
      if (s == 1) {
        var v = new u8(t[0].s + 1);
        v[t[0].s] = 1;
        return {
          t: v,
          l: 1
        };
      }
      t.sort(function (a, b) {
        return a.f - b.f;
      });
      // after i2 reaches last ind, will be stopped
      // freq must be greater than largest possible number of symbols
      t.push({
        s: -1,
        f: 25001
      });
      var l = t[0],
        r = t[1],
        i0 = 0,
        i1 = 1,
        i2 = 2;
      t[0] = {
        s: -1,
        f: l.f + r.f,
        l: l,
        r: r
      };
      // efficient algorithm from UZIP.js
      // i0 is lookbehind, i2 is lookahead - after processing two low-freq
      // symbols that combined have high freq, will start processing i2 (high-freq,
      // non-composite) symbols instead
      // see https://reddit.com/r/photopea/comments/ikekht/uzipjs_questions/
      while (i1 != s - 1) {
        l = t[t[i0].f < t[i2].f ? i0++ : i2++];
        r = t[i0 != i1 && t[i0].f < t[i2].f ? i0++ : i2++];
        t[i1++] = {
          s: -1,
          f: l.f + r.f,
          l: l,
          r: r
        };
      }
      var maxSym = t2[0].s;
      for (var i = 1; i < s; ++i) {
        if (t2[i].s > maxSym) maxSym = t2[i].s;
      }
      // code lengths
      var tr = new u16(maxSym + 1);
      // max bits in tree
      var mbt = _ln(t[i1 - 1], tr, 0);
      if (mbt > mb) {
        // more algorithms from UZIP.js
        // TODO: find out how this code works (debt)
        //  ind    debt
        var i = 0,
          dt = 0;
        //    left            cost
        var lft = mbt - mb,
          cst = 1 << lft;
        t2.sort(function (a, b) {
          return tr[b.s] - tr[a.s] || a.f - b.f;
        });
        for (; i < s; ++i) {
          var i2_1 = t2[i].s;
          if (tr[i2_1] > mb) {
            dt += cst - (1 << mbt - tr[i2_1]);
            tr[i2_1] = mb;
          } else break;
        }
        dt >>= lft;
        while (dt > 0) {
          var i2_2 = t2[i].s;
          if (tr[i2_2] < mb) dt -= 1 << mb - tr[i2_2]++ - 1;else ++i;
        }
        for (; i >= 0 && dt; --i) {
          var i2_3 = t2[i].s;
          if (tr[i2_3] == mb) {
            --tr[i2_3];
            ++dt;
          }
        }
        mbt = mb;
      }
      return {
        t: new u8(tr),
        l: mbt
      };
    };
    // get the max length and assign length codes
    var _ln = function ln(n, l, d) {
      return n.s == -1 ? Math.max(_ln(n.l, l, d + 1), _ln(n.r, l, d + 1)) : l[n.s] = d;
    };
    // length codes generation
    var lc = function lc(c) {
      var s = c.length;
      // Note that the semicolon was intentional
      while (s && !c[--s]);
      var cl = new u16(++s);
      //  ind      num         streak
      var cli = 0,
        cln = c[0],
        cls = 1;
      var w = function w(v) {
        cl[cli++] = v;
      };
      for (var i = 1; i <= s; ++i) {
        if (c[i] == cln && i != s) ++cls;else {
          if (!cln && cls > 2) {
            for (; cls > 138; cls -= 138) w(32754);
            if (cls > 2) {
              w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
              cls = 0;
            }
          } else if (cls > 3) {
            w(cln), --cls;
            for (; cls > 6; cls -= 6) w(8304);
            if (cls > 2) w(cls - 3 << 5 | 8208), cls = 0;
          }
          while (cls--) w(cln);
          cls = 1;
          cln = c[i];
        }
      }
      return {
        c: cl.subarray(0, cli),
        n: s
      };
    };
    // calculate the length of output from tree, code lengths
    var clen = function clen(cf, cl) {
      var l = 0;
      for (var i = 0; i < cl.length; ++i) l += cf[i] * cl[i];
      return l;
    };
    // writes a fixed block
    // returns the new bit pos
    var wfblk = function wfblk(out, pos, dat) {
      // no need to write 00 as type: TypedArray defaults to 0
      var s = dat.length;
      var o = shft(pos + 2);
      out[o] = s & 255;
      out[o + 1] = s >> 8;
      out[o + 2] = out[o] ^ 255;
      out[o + 3] = out[o + 1] ^ 255;
      for (var i = 0; i < s; ++i) out[o + i + 4] = dat[i];
      return (o + 4 + s) * 8;
    };
    // writes a block
    var wblk = function wblk(dat, out, _final2, syms, lf, df, eb, li, bs, bl, p) {
      wbits(out, p++, _final2);
      ++lf[256];
      var _a = hTree(lf, 15),
        dlt = _a.t,
        mlb = _a.l;
      var _b = hTree(df, 15),
        ddt = _b.t,
        mdb = _b.l;
      var _c = lc(dlt),
        lclt = _c.c,
        nlc = _c.n;
      var _d = lc(ddt),
        lcdt = _d.c,
        ndc = _d.n;
      var lcfreq = new u16(19);
      for (var i = 0; i < lclt.length; ++i) ++lcfreq[lclt[i] & 31];
      for (var i = 0; i < lcdt.length; ++i) ++lcfreq[lcdt[i] & 31];
      var _e = hTree(lcfreq, 7),
        lct = _e.t,
        mlcb = _e.l;
      var nlcc = 19;
      for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc);
      var flen = bl + 5 << 3;
      var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
      var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
      if (bs >= 0 && flen <= ftlen && flen <= dtlen) return wfblk(out, p, dat.subarray(bs, bs + bl));
      var lm, ll, dm, dl;
      wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
      if (dtlen < ftlen) {
        lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
        var llm = hMap(lct, mlcb, 0);
        wbits(out, p, nlc - 257);
        wbits(out, p + 5, ndc - 1);
        wbits(out, p + 10, nlcc - 4);
        p += 14;
        for (var i = 0; i < nlcc; ++i) wbits(out, p + 3 * i, lct[clim[i]]);
        p += 3 * nlcc;
        var lcts = [lclt, lcdt];
        for (var it = 0; it < 2; ++it) {
          var clct = lcts[it];
          for (var i = 0; i < clct.length; ++i) {
            var len = clct[i] & 31;
            wbits(out, p, llm[len]), p += lct[len];
            if (len > 15) wbits(out, p, clct[i] >> 5 & 127), p += clct[i] >> 12;
          }
        }
      } else {
        lm = flm, ll = flt, dm = fdm, dl = fdt;
      }
      for (var i = 0; i < li; ++i) {
        var sym = syms[i];
        if (sym > 255) {
          var len = sym >> 18 & 31;
          wbits16(out, p, lm[len + 257]), p += ll[len + 257];
          if (len > 7) wbits(out, p, sym >> 23 & 31), p += fleb[len];
          var dst = sym & 31;
          wbits16(out, p, dm[dst]), p += dl[dst];
          if (dst > 3) wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
        } else {
          wbits16(out, p, lm[sym]), p += ll[sym];
        }
      }
      wbits16(out, p, lm[256]);
      return p + ll[256];
    };
    // deflate options (nice << 13) | chain
    var deo = /*#__PURE__*/new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
    // empty
    var et = /*#__PURE__*/new u8(0);
    // compresses data into a raw DEFLATE buffer
    var dflt = function dflt(dat, lvl, plvl, pre, post, st) {
      var s = st.z || dat.length;
      var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7000)) + post);
      // writing to this writes to the output buffer
      var w = o.subarray(pre, o.length - post);
      var lst = st.l;
      var pos = (st.r || 0) & 7;
      if (lvl) {
        if (pos) w[0] = st.r >> 3;
        var opt = deo[lvl - 1];
        var n = opt >> 13,
          c = opt & 8191;
        var msk_1 = (1 << plvl) - 1;
        //    prev 2-byte val map    curr 2-byte val map
        var prev = st.p || new u16(32768),
          head = st.h || new u16(msk_1 + 1);
        var bs1_1 = Math.ceil(plvl / 3),
          bs2_1 = 2 * bs1_1;
        var hsh = function hsh(i) {
          return (dat[i] ^ dat[i + 1] << bs1_1 ^ dat[i + 2] << bs2_1) & msk_1;
        };
        // 24576 is an arbitrary number of maximum symbols per block
        // 424 buffer for last block
        var syms = new i32(25000);
        // length/literal freq   distance freq
        var lf = new u16(288),
          df = new u16(32);
        //  l/lcnt  exbits  index          l/lind  waitdx          blkpos
        var lc_1 = 0,
          eb = 0,
          i = st.i || 0,
          li = 0,
          wi = st.w || 0,
          bs = 0;
        for (; i + 2 < s; ++i) {
          // hash value
          var hv = hsh(i);
          // index mod 32768    previous index mod
          var imod = i & 32767,
            pimod = head[hv];
          prev[imod] = pimod;
          head[hv] = imod;
          // We always should modify head and prev, but only add symbols if
          // this data is not yet processed ("wait" for wait index)
          if (wi <= i) {
            // bytes remaining
            var rem = s - i;
            if ((lc_1 > 7000 || li > 24576) && (rem > 423 || !lst)) {
              pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i - bs, pos);
              li = lc_1 = eb = 0, bs = i;
              for (var j = 0; j < 286; ++j) lf[j] = 0;
              for (var j = 0; j < 30; ++j) df[j] = 0;
            }
            //  len    dist   chain
            var l = 2,
              d = 0,
              ch_1 = c,
              dif = imod - pimod & 32767;
            if (rem > 2 && hv == hsh(i - dif)) {
              var maxn = Math.min(n, rem) - 1;
              var maxd = Math.min(32767, i);
              // max possible length
              // not capped at dif because decompressors implement "rolling" index population
              var ml = Math.min(258, rem);
              while (dif <= maxd && --ch_1 && imod != pimod) {
                if (dat[i + l] == dat[i + l - dif]) {
                  var nl = 0;
                  for (; nl < ml && dat[i + nl] == dat[i + nl - dif]; ++nl);
                  if (nl > l) {
                    l = nl, d = dif;
                    // break out early when we reach "nice" (we are satisfied enough)
                    if (nl > maxn) break;
                    // now, find the rarest 2-byte sequence within this
                    // length of literals and search for that instead.
                    // Much faster than just using the start
                    var mmd = Math.min(dif, nl - 2);
                    var md = 0;
                    for (var j = 0; j < mmd; ++j) {
                      var ti = i - dif + j & 32767;
                      var pti = prev[ti];
                      var cd = ti - pti & 32767;
                      if (cd > md) md = cd, pimod = ti;
                    }
                  }
                }
                // check the previous match
                imod = pimod, pimod = prev[imod];
                dif += imod - pimod & 32767;
              }
            }
            // d will be nonzero only when a match was found
            if (d) {
              // store both dist and len data in one int32
              // Make sure this is recognized as a len/dist with 28th bit (2^28)
              syms[li++] = 268435456 | revfl[l] << 18 | revfd[d];
              var lin = revfl[l] & 31,
                din = revfd[d] & 31;
              eb += fleb[lin] + fdeb[din];
              ++lf[257 + lin];
              ++df[din];
              wi = i + l;
              ++lc_1;
            } else {
              syms[li++] = dat[i];
              ++lf[dat[i]];
            }
          }
        }
        for (i = Math.max(i, wi); i < s; ++i) {
          syms[li++] = dat[i];
          ++lf[dat[i]];
        }
        pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i - bs, pos);
        if (!lst) {
          st.r = pos & 7 | w[pos / 8 | 0] << 3;
          // shft(pos) now 1 less if pos & 7 != 0
          pos -= 7;
          st.h = head, st.p = prev, st.i = i, st.w = wi;
        }
      } else {
        for (var i = st.w || 0; i < s + lst; i += 65535) {
          // end
          var e = i + 65535;
          if (e >= s) {
            // write final block
            w[pos / 8 | 0] = lst;
            e = s;
          }
          pos = wfblk(w, pos + 1, dat.subarray(i, e));
        }
        st.i = s;
      }
      return slc(o, 0, pre + shft(pos) + post);
    };
    // CRC32 table
    var crct = /*#__PURE__*/function () {
      var t = new Int32Array(256);
      for (var i = 0; i < 256; ++i) {
        var c = i,
          k = 9;
        while (--k) c = (c & 1 && -306674912) ^ c >>> 1;
        t[i] = c;
      }
      return t;
    }();
    // CRC32
    var crc = function crc() {
      var c = -1;
      return {
        p: function p(d) {
          // closures have awful performance
          var cr = c;
          for (var i = 0; i < d.length; ++i) cr = crct[cr & 255 ^ d[i]] ^ cr >>> 8;
          c = cr;
        },
        d: function d() {
          return ~c;
        }
      };
    };
    // Adler32
    var adler = function adler() {
      var a = 1,
        b = 0;
      return {
        p: function p(d) {
          // closures have awful performance
          var n = a,
            m = b;
          var l = d.length | 0;
          for (var i = 0; i != l;) {
            var e = Math.min(i + 2655, l);
            for (; i < e; ++i) m += n += d[i];
            n = (n & 65535) + 15 * (n >> 16), m = (m & 65535) + 15 * (m >> 16);
          }
          a = n, b = m;
        },
        d: function d() {
          a %= 65521, b %= 65521;
          return (a & 255) << 24 | (a & 0xFF00) << 8 | (b & 255) << 8 | b >> 8;
        }
      };
    };
    ;
    // deflate with opts
    var dopt = function dopt(dat, opt, pre, post, st) {
      if (!st) {
        st = {
          l: 1
        };
        if (opt.dictionary) {
          var dict = opt.dictionary.subarray(-32768);
          var newDat = new u8(dict.length + dat.length);
          newDat.set(dict);
          newDat.set(dat, dict.length);
          dat = newDat;
          st.w = dict.length;
        }
      }
      return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st);
    };
    // Walmart object spread
    var mrg = function mrg(a, b) {
      var o = {};
      for (var k in a) o[k] = a[k];
      for (var k in b) o[k] = b[k];
      return o;
    };
    // worker clone
    // This is possibly the craziest part of the entire codebase, despite how simple it may seem.
    // The only parameter to this function is a closure that returns an array of variables outside of the function scope.
    // We're going to try to figure out the variable names used in the closure as strings because that is crucial for workerization.
    // We will return an object mapping of true variable name to value (basically, the current scope as a JS object).
    // The reason we can't just use the original variable names is minifiers mangling the toplevel scope.
    // This took me three weeks to figure out how to do.
    var wcln = function wcln(fn, fnStr, td) {
      var dt = fn();
      var st = fn.toString();
      var ks = st.slice(st.indexOf('[') + 1, st.lastIndexOf(']')).replace(/\s+/g, '').split(',');
      for (var i = 0; i < dt.length; ++i) {
        var v = dt[i],
          k = ks[i];
        if (typeof v == 'function') {
          fnStr += ';' + k + '=';
          var st_1 = v.toString();
          if (v.prototype) {
            // for global objects
            if (st_1.indexOf('[native code]') != -1) {
              var spInd = st_1.indexOf(' ', 8) + 1;
              fnStr += st_1.slice(spInd, st_1.indexOf('(', spInd));
            } else {
              fnStr += st_1;
              for (var t in v.prototype) fnStr += ';' + k + '.prototype.' + t + '=' + v.prototype[t].toString();
            }
          } else fnStr += st_1;
        } else td[k] = v;
      }
      return fnStr;
    };
    var ch = [];
    // clone bufs
    var cbfs = function cbfs(v) {
      var tl = [];
      for (var k in v) {
        if (v[k].buffer) {
          tl.push((v[k] = new v[k].constructor(v[k])).buffer);
        }
      }
      return tl;
    };
    // use a worker to execute code
    var wrkr = function wrkr(fns, init, id, cb) {
      if (!ch[id]) {
        var fnStr = '',
          td_1 = {},
          m = fns.length - 1;
        for (var i = 0; i < m; ++i) fnStr = wcln(fns[i], fnStr, td_1);
        ch[id] = {
          c: wcln(fns[m], fnStr, td_1),
          e: td_1
        };
      }
      var td = mrg({}, ch[id].e);
      return (0, node_worker_1["default"])(ch[id].c + ';onmessage=function(e){for(var k in e.data)self[k]=e.data[k];onmessage=' + init.toString() + '}', id, td, cbfs(td), cb);
    };
    // base async inflate fn
    var bInflt = function bInflt() {
      return [u8, u16, i32, fleb, fdeb, clim, fl, fd, flrm, fdrm, rev, ec, hMap, max, bits, bits16, shft, slc, _err, inflt, inflateSync, pbf, gopt];
    };
    var bDflt = function bDflt() {
      return [u8, u16, i32, fleb, fdeb, clim, revfl, revfd, flm, flt, fdm, fdt, rev, deo, et, hMap, wbits, wbits16, hTree, _ln, lc, clen, wfblk, wblk, shft, slc, dflt, dopt, deflateSync, pbf];
    };
    // gzip extra
    var gze = function gze() {
      return [gzh, gzhl, wbytes, crc, crct];
    };
    // gunzip extra
    var guze = function guze() {
      return [gzs, gzl];
    };
    // zlib extra
    var zle = function zle() {
      return [zlh, wbytes, adler];
    };
    // unzlib extra
    var zule = function zule() {
      return [zls];
    };
    // post buf
    var pbf = function pbf(msg) {
      return postMessage(msg, [msg.buffer]);
    };
    // get opts
    var gopt = function gopt(o) {
      return o && {
        out: o.size && new u8(o.size),
        dictionary: o.dictionary
      };
    };
    // async helper
    var cbify = function cbify(dat, opts, fns, init, id, cb) {
      var w = wrkr(fns, init, id, function (err, dat) {
        w.terminate();
        cb(err, dat);
      });
      w.postMessage([dat, opts], opts.consume ? [dat.buffer] : []);
      return function () {
        w.terminate();
      };
    };
    // auto stream
    var astrm = function astrm(strm) {
      strm.ondata = function (dat, _final3) {
        return postMessage([dat, _final3], [dat.buffer]);
      };
      return function (ev) {
        if (ev.data.length) {
          strm.push(ev.data[0], ev.data[1]);
          postMessage([ev.data[0].length]);
        } else strm.flush();
      };
    };
    // async stream attach
    var astrmify = function astrmify(fns, strm, opts, init, id, flush, ext) {
      var t;
      var w = wrkr(fns, init, id, function (err, dat) {
        if (err) w.terminate(), strm.ondata.call(strm, err);else if (!Array.isArray(dat)) ext(dat);else if (dat.length == 1) {
          strm.queuedSize -= dat[0];
          if (strm.ondrain) strm.ondrain(dat[0]);
        } else {
          if (dat[1]) w.terminate();
          strm.ondata.call(strm, err, dat[0], dat[1]);
        }
      });
      w.postMessage(opts);
      strm.queuedSize = 0;
      strm.push = function (d, f) {
        if (!strm.ondata) _err(5);
        if (t) strm.ondata(_err(4, 0, 1), null, !!f);
        strm.queuedSize += d.length;
        w.postMessage([d, t = f], [d.buffer]);
      };
      strm.terminate = function () {
        w.terminate();
      };
      if (flush) {
        strm.flush = function () {
          w.postMessage([]);
        };
      }
    };
    // read 2 bytes
    var b2 = function b2(d, b) {
      return d[b] | d[b + 1] << 8;
    };
    // read 4 bytes
    var b4 = function b4(d, b) {
      return (d[b] | d[b + 1] << 8 | d[b + 2] << 16 | d[b + 3] << 24) >>> 0;
    };
    var b8 = function b8(d, b) {
      return b4(d, b) + b4(d, b + 4) * 4294967296;
    };
    // write bytes
    var wbytes = function wbytes(d, b, v) {
      for (; v; ++b) d[b] = v, v >>>= 8;
    };
    // gzip header
    var gzh = function gzh(c, o) {
      var fn = o.filename;
      c[0] = 31, c[1] = 139, c[2] = 8, c[8] = o.level < 2 ? 4 : o.level == 9 ? 2 : 0, c[9] = 3; // assume Unix
      if (o.mtime != 0) wbytes(c, 4, Math.floor(new Date(o.mtime || Date.now()) / 1000));
      if (fn) {
        c[3] = 8;
        for (var i = 0; i <= fn.length; ++i) c[i + 10] = fn.charCodeAt(i);
      }
    };
    // gzip footer: -8 to -4 = CRC, -4 to -0 is length
    // gzip start
    var gzs = function gzs(d) {
      if (d[0] != 31 || d[1] != 139 || d[2] != 8) _err(6, 'invalid gzip data');
      var flg = d[3];
      var st = 10;
      if (flg & 4) st += (d[10] | d[11] << 8) + 2;
      for (var zs = (flg >> 3 & 1) + (flg >> 4 & 1); zs > 0; zs -= !d[st++]);
      return st + (flg & 2);
    };
    // gzip length
    var gzl = function gzl(d) {
      var l = d.length;
      return (d[l - 4] | d[l - 3] << 8 | d[l - 2] << 16 | d[l - 1] << 24) >>> 0;
    };
    // gzip header length
    var gzhl = function gzhl(o) {
      return 10 + (o.filename ? o.filename.length + 1 : 0);
    };
    // zlib header
    var zlh = function zlh(c, o) {
      var lv = o.level,
        fl = lv == 0 ? 0 : lv < 6 ? 1 : lv == 9 ? 3 : 2;
      c[0] = 120, c[1] = fl << 6 | (o.dictionary && 32);
      c[1] |= 31 - (c[0] << 8 | c[1]) % 31;
      if (o.dictionary) {
        var h = adler();
        h.p(o.dictionary);
        wbytes(c, 2, h.d());
      }
    };
    // zlib start
    var zls = function zls(d, dict) {
      if ((d[0] & 15) != 8 || d[0] >> 4 > 7 || (d[0] << 8 | d[1]) % 31) _err(6, 'invalid zlib data');
      if ((d[1] >> 5 & 1) == +!dict) _err(6, 'invalid zlib data: ' + (d[1] & 32 ? 'need' : 'unexpected') + ' dictionary');
      return (d[1] >> 3 & 4) + 2;
    };
    function StrmOpt(opts, cb) {
      if (typeof opts == 'function') cb = opts, opts = {};
      this.ondata = cb;
      return opts;
    }
    /**
    * Streaming DEFLATE compression
    */
    var Deflate = /*#__PURE__*/function () {
      function Deflate(opts, cb) {
        if (typeof opts == 'function') cb = opts, opts = {};
        this.ondata = cb;
        this.o = opts || {};
        this.s = {
          l: 0,
          i: 32768,
          w: 32768,
          z: 32768
        };
        // Buffer length must always be 0 mod 32768 for index calculations to be correct when modifying head and prev
        // 98304 = 32768 (lookback) + 65536 (common chunk size)
        this.b = new u8(98304);
        if (this.o.dictionary) {
          var dict = this.o.dictionary.subarray(-32768);
          this.b.set(dict, 32768 - dict.length);
          this.s.i = 32768 - dict.length;
        }
      }
      Deflate.prototype.p = function (c, f) {
        this.ondata(dopt(c, this.o, 0, 0, this.s), f);
      };
      /**
      * Pushes a chunk to be deflated
      * @param chunk The chunk to push
      * @param final Whether this is the last chunk
      */
      Deflate.prototype.push = function (chunk, _final4) {
        if (!this.ondata) _err(5);
        if (this.s.l) _err(4);
        var endLen = chunk.length + this.s.z;
        if (endLen > this.b.length) {
          if (endLen > 2 * this.b.length - 32768) {
            var newBuf = new u8(endLen & -32768);
            newBuf.set(this.b.subarray(0, this.s.z));
            this.b = newBuf;
          }
          var split = this.b.length - this.s.z;
          this.b.set(chunk.subarray(0, split), this.s.z);
          this.s.z = this.b.length;
          this.p(this.b, false);
          this.b.set(this.b.subarray(-32768));
          this.b.set(chunk.subarray(split), 32768);
          this.s.z = chunk.length - split + 32768;
          this.s.i = 32766, this.s.w = 32768;
        } else {
          this.b.set(chunk, this.s.z);
          this.s.z += chunk.length;
        }
        this.s.l = _final4 & 1;
        if (this.s.z > this.s.w + 8191 || _final4) {
          this.p(this.b, _final4 || false);
          this.s.w = this.s.i, this.s.i -= 2;
        }
      };
      /**
      * Flushes buffered uncompressed data. Useful to immediately retrieve the
      * deflated output for small inputs.
      */
      Deflate.prototype.flush = function () {
        if (!this.ondata) _err(5);
        if (this.s.l) _err(4);
        this.p(this.b, false);
        this.s.w = this.s.i, this.s.i -= 2;
      };
      return Deflate;
    }();
    exports.Deflate = Deflate;
    /**
    * Asynchronous streaming DEFLATE compression
    */
    var AsyncDeflate = /*#__PURE__*/function () {
      function AsyncDeflate(opts, cb) {
        astrmify([bDflt, function () {
          return [astrm, Deflate];
        }], this, StrmOpt.call(this, opts, cb), function (ev) {
          var strm = new Deflate(ev.data);
          onmessage = astrm(strm);
        }, 6, 1);
      }
      return AsyncDeflate;
    }();
    exports.AsyncDeflate = AsyncDeflate;
    function deflate(data, opts, cb) {
      if (!cb) cb = opts, opts = {};
      if (typeof cb != 'function') _err(7);
      return cbify(data, opts, [bDflt], function (ev) {
        return pbf(deflateSync(ev.data[0], ev.data[1]));
      }, 0, cb);
    }
    exports.deflate = deflate;
    /**
    * Compresses data with DEFLATE without any wrapper
    * @param data The data to compress
    * @param opts The compression options
    * @returns The deflated version of the data
    */
    function deflateSync(data, opts) {
      return dopt(data, opts || {}, 0, 0);
    }
    exports.deflateSync = deflateSync;
    /**
    * Streaming DEFLATE decompression
    */
    var Inflate = /*#__PURE__*/function () {
      function Inflate(opts, cb) {
        // no StrmOpt here to avoid adding to workerizer
        if (typeof opts == 'function') cb = opts, opts = {};
        this.ondata = cb;
        var dict = opts && opts.dictionary && opts.dictionary.subarray(-32768);
        this.s = {
          i: 0,
          b: dict ? dict.length : 0
        };
        this.o = new u8(32768);
        this.p = new u8(0);
        if (dict) this.o.set(dict);
      }
      Inflate.prototype.e = function (c) {
        if (!this.ondata) _err(5);
        if (this.d) _err(4);
        if (!this.p.length) this.p = c;else if (c.length) {
          var n = new u8(this.p.length + c.length);
          n.set(this.p), n.set(c, this.p.length), this.p = n;
        }
      };
      Inflate.prototype.c = function (_final5) {
        this.s.i = +(this.d = _final5 || false);
        var bts = this.s.b;
        var dt = inflt(this.p, this.s, this.o);
        this.ondata(slc(dt, bts, this.s.b), this.d);
        this.o = slc(dt, this.s.b - 32768), this.s.b = this.o.length;
        this.p = slc(this.p, this.s.p / 8 | 0), this.s.p &= 7;
      };
      /**
      * Pushes a chunk to be inflated
      * @param chunk The chunk to push
      * @param final Whether this is the final chunk
      */
      Inflate.prototype.push = function (chunk, _final6) {
        this.e(chunk), this.c(_final6);
      };
      return Inflate;
    }();
    exports.Inflate = Inflate;
    /**
    * Asynchronous streaming DEFLATE decompression
    */
    var AsyncInflate = /*#__PURE__*/function () {
      function AsyncInflate(opts, cb) {
        astrmify([bInflt, function () {
          return [astrm, Inflate];
        }], this, StrmOpt.call(this, opts, cb), function (ev) {
          var strm = new Inflate(ev.data);
          onmessage = astrm(strm);
        }, 7, 0);
      }
      return AsyncInflate;
    }();
    exports.AsyncInflate = AsyncInflate;
    function inflate(data, opts, cb) {
      if (!cb) cb = opts, opts = {};
      if (typeof cb != 'function') _err(7);
      return cbify(data, opts, [bInflt], function (ev) {
        return pbf(inflateSync(ev.data[0], gopt(ev.data[1])));
      }, 1, cb);
    }
    exports.inflate = inflate;
    /**
    * Expands DEFLATE data with no wrapper
    * @param data The data to decompress
    * @param opts The decompression options
    * @returns The decompressed version of the data
    */
    function inflateSync(data, opts) {
      return inflt(data, {
        i: 2
      }, opts && opts.out, opts && opts.dictionary);
    }
    exports.inflateSync = inflateSync;
    // before you yell at me for not just using extends, my reason is that TS inheritance is hard to workerize.
    /**
    * Streaming GZIP compression
    */
    var Gzip = /*#__PURE__*/function () {
      function Gzip(opts, cb) {
        this.c = crc();
        this.l = 0;
        this.v = 1;
        Deflate.call(this, opts, cb);
      }
      /**
      * Pushes a chunk to be GZIPped
      * @param chunk The chunk to push
      * @param final Whether this is the last chunk
      */
      Gzip.prototype.push = function (chunk, _final7) {
        this.c.p(chunk);
        this.l += chunk.length;
        Deflate.prototype.push.call(this, chunk, _final7);
      };
      Gzip.prototype.p = function (c, f) {
        var raw = dopt(c, this.o, this.v && gzhl(this.o), f && 8, this.s);
        if (this.v) gzh(raw, this.o), this.v = 0;
        if (f) wbytes(raw, raw.length - 8, this.c.d()), wbytes(raw, raw.length - 4, this.l);
        this.ondata(raw, f);
      };
      /**
      * Flushes buffered uncompressed data. Useful to immediately retrieve the
      * GZIPped output for small inputs.
      */
      Gzip.prototype.flush = function () {
        Deflate.prototype.flush.call(this);
      };
      return Gzip;
    }();
    exports.Gzip = Gzip;
    exports.Compress = Gzip;
    /**
    * Asynchronous streaming GZIP compression
    */
    var AsyncGzip = /*#__PURE__*/function () {
      function AsyncGzip(opts, cb) {
        astrmify([bDflt, gze, function () {
          return [astrm, Deflate, Gzip];
        }], this, StrmOpt.call(this, opts, cb), function (ev) {
          var strm = new Gzip(ev.data);
          onmessage = astrm(strm);
        }, 8, 1);
      }
      return AsyncGzip;
    }();
    exports.AsyncGzip = AsyncGzip;
    exports.AsyncCompress = AsyncGzip;
    function gzip(data, opts, cb) {
      if (!cb) cb = opts, opts = {};
      if (typeof cb != 'function') _err(7);
      return cbify(data, opts, [bDflt, gze, function () {
        return [gzipSync];
      }], function (ev) {
        return pbf(gzipSync(ev.data[0], ev.data[1]));
      }, 2, cb);
    }
    exports.gzip = gzip;
    exports.compress = gzip;
    /**
    * Compresses data with GZIP
    * @param data The data to compress
    * @param opts The compression options
    * @returns The gzipped version of the data
    */
    function gzipSync(data, opts) {
      if (!opts) opts = {};
      var c = crc(),
        l = data.length;
      c.p(data);
      var d = dopt(data, opts, gzhl(opts), 8),
        s = d.length;
      return gzh(d, opts), wbytes(d, s - 8, c.d()), wbytes(d, s - 4, l), d;
    }
    exports.gzipSync = gzipSync;
    exports.compressSync = gzipSync;
    /**
    * Streaming single or multi-member GZIP decompression
    */
    var Gunzip = /*#__PURE__*/function () {
      function Gunzip(opts, cb) {
        this.v = 1;
        this.r = 0;
        Inflate.call(this, opts, cb);
      }
      /**
      * Pushes a chunk to be GUNZIPped
      * @param chunk The chunk to push
      * @param final Whether this is the last chunk
      */
      Gunzip.prototype.push = function (chunk, _final8) {
        Inflate.prototype.e.call(this, chunk);
        this.r += chunk.length;
        if (this.v) {
          var p = this.p.subarray(this.v - 1);
          var s = p.length > 3 ? gzs(p) : 4;
          if (s > p.length) {
            if (!_final8) return;
          } else if (this.v > 1 && this.onmember) {
            this.onmember(this.r - p.length);
          }
          this.p = p.subarray(s), this.v = 0;
        }
        // necessary to prevent TS from using the closure value
        // This allows for workerization to function correctly
        Inflate.prototype.c.call(this, _final8);
        // process concatenated GZIP
        if (this.s.f && !this.s.l && !_final8) {
          this.v = shft(this.s.p) + 9;
          this.s = {
            i: 0
          };
          this.o = new u8(0);
          this.push(new u8(0), _final8);
        }
      };
      return Gunzip;
    }();
    exports.Gunzip = Gunzip;
    /**
    * Asynchronous streaming single or multi-member GZIP decompression
    */
    var AsyncGunzip = /*#__PURE__*/function () {
      function AsyncGunzip(opts, cb) {
        var _this = this;
        astrmify([bInflt, guze, function () {
          return [astrm, Inflate, Gunzip];
        }], this, StrmOpt.call(this, opts, cb), function (ev) {
          var strm = new Gunzip(ev.data);
          strm.onmember = function (offset) {
            return postMessage(offset);
          };
          onmessage = astrm(strm);
        }, 9, 0, function (offset) {
          return _this.onmember && _this.onmember(offset);
        });
      }
      return AsyncGunzip;
    }();
    exports.AsyncGunzip = AsyncGunzip;
    function gunzip(data, opts, cb) {
      if (!cb) cb = opts, opts = {};
      if (typeof cb != 'function') _err(7);
      return cbify(data, opts, [bInflt, guze, function () {
        return [gunzipSync];
      }], function (ev) {
        return pbf(gunzipSync(ev.data[0], ev.data[1]));
      }, 3, cb);
    }
    exports.gunzip = gunzip;
    /**
    * Expands GZIP data
    * @param data The data to decompress
    * @param opts The decompression options
    * @returns The decompressed version of the data
    */
    function gunzipSync(data, opts) {
      var st = gzs(data);
      if (st + 8 > data.length) _err(6, 'invalid gzip data');
      return inflt(data.subarray(st, -8), {
        i: 2
      }, opts && opts.out || new u8(gzl(data)), opts && opts.dictionary);
    }
    exports.gunzipSync = gunzipSync;
    /**
    * Streaming Zlib compression
    */
    var Zlib = /*#__PURE__*/function () {
      function Zlib(opts, cb) {
        this.c = adler();
        this.v = 1;
        Deflate.call(this, opts, cb);
      }
      /**
      * Pushes a chunk to be zlibbed
      * @param chunk The chunk to push
      * @param final Whether this is the last chunk
      */
      Zlib.prototype.push = function (chunk, _final9) {
        this.c.p(chunk);
        Deflate.prototype.push.call(this, chunk, _final9);
      };
      Zlib.prototype.p = function (c, f) {
        var raw = dopt(c, this.o, this.v && (this.o.dictionary ? 6 : 2), f && 4, this.s);
        if (this.v) zlh(raw, this.o), this.v = 0;
        if (f) wbytes(raw, raw.length - 4, this.c.d());
        this.ondata(raw, f);
      };
      /**
      * Flushes buffered uncompressed data. Useful to immediately retrieve the
      * zlibbed output for small inputs.
      */
      Zlib.prototype.flush = function () {
        Deflate.prototype.flush.call(this);
      };
      return Zlib;
    }();
    exports.Zlib = Zlib;
    /**
    * Asynchronous streaming Zlib compression
    */
    var AsyncZlib = /*#__PURE__*/function () {
      function AsyncZlib(opts, cb) {
        astrmify([bDflt, zle, function () {
          return [astrm, Deflate, Zlib];
        }], this, StrmOpt.call(this, opts, cb), function (ev) {
          var strm = new Zlib(ev.data);
          onmessage = astrm(strm);
        }, 10, 1);
      }
      return AsyncZlib;
    }();
    exports.AsyncZlib = AsyncZlib;
    function zlib(data, opts, cb) {
      if (!cb) cb = opts, opts = {};
      if (typeof cb != 'function') _err(7);
      return cbify(data, opts, [bDflt, zle, function () {
        return [zlibSync];
      }], function (ev) {
        return pbf(zlibSync(ev.data[0], ev.data[1]));
      }, 4, cb);
    }
    exports.zlib = zlib;
    /**
    * Compress data with Zlib
    * @param data The data to compress
    * @param opts The compression options
    * @returns The zlib-compressed version of the data
    */
    function zlibSync(data, opts) {
      if (!opts) opts = {};
      var a = adler();
      a.p(data);
      var d = dopt(data, opts, opts.dictionary ? 6 : 2, 4);
      return zlh(d, opts), wbytes(d, d.length - 4, a.d()), d;
    }
    exports.zlibSync = zlibSync;
    /**
    * Streaming Zlib decompression
    */
    var Unzlib = /*#__PURE__*/function () {
      function Unzlib(opts, cb) {
        Inflate.call(this, opts, cb);
        this.v = opts && opts.dictionary ? 2 : 1;
      }
      /**
      * Pushes a chunk to be unzlibbed
      * @param chunk The chunk to push
      * @param final Whether this is the last chunk
      */
      Unzlib.prototype.push = function (chunk, _final0) {
        Inflate.prototype.e.call(this, chunk);
        if (this.v) {
          if (this.p.length < 6 && !_final0) return;
          this.p = this.p.subarray(zls(this.p, this.v - 1)), this.v = 0;
        }
        if (_final0) {
          if (this.p.length < 4) _err(6, 'invalid zlib data');
          this.p = this.p.subarray(0, -4);
        }
        // necessary to prevent TS from using the closure value
        // This allows for workerization to function correctly
        Inflate.prototype.c.call(this, _final0);
      };
      return Unzlib;
    }();
    exports.Unzlib = Unzlib;
    /**
    * Asynchronous streaming Zlib decompression
    */
    var AsyncUnzlib = /*#__PURE__*/function () {
      function AsyncUnzlib(opts, cb) {
        astrmify([bInflt, zule, function () {
          return [astrm, Inflate, Unzlib];
        }], this, StrmOpt.call(this, opts, cb), function (ev) {
          var strm = new Unzlib(ev.data);
          onmessage = astrm(strm);
        }, 11, 0);
      }
      return AsyncUnzlib;
    }();
    exports.AsyncUnzlib = AsyncUnzlib;
    function unzlib(data, opts, cb) {
      if (!cb) cb = opts, opts = {};
      if (typeof cb != 'function') _err(7);
      return cbify(data, opts, [bInflt, zule, function () {
        return [unzlibSync];
      }], function (ev) {
        return pbf(unzlibSync(ev.data[0], gopt(ev.data[1])));
      }, 5, cb);
    }
    exports.unzlib = unzlib;
    /**
    * Expands Zlib data
    * @param data The data to decompress
    * @param opts The decompression options
    * @returns The decompressed version of the data
    */
    function unzlibSync(data, opts) {
      return inflt(data.subarray(zls(data, opts && opts.dictionary), -4), {
        i: 2
      }, opts && opts.out, opts && opts.dictionary);
    }
    exports.unzlibSync = unzlibSync;
    /**
    * Streaming GZIP, Zlib, or raw DEFLATE decompression
    */
    var Decompress = /*#__PURE__*/function () {
      function Decompress(opts, cb) {
        this.o = StrmOpt.call(this, opts, cb) || {};
        this.G = Gunzip;
        this.I = Inflate;
        this.Z = Unzlib;
      }
      // init substream
      // overriden by AsyncDecompress
      Decompress.prototype.i = function () {
        var _this = this;
        this.s.ondata = function (dat, _final1) {
          _this.ondata(dat, _final1);
        };
      };
      /**
      * Pushes a chunk to be decompressed
      * @param chunk The chunk to push
      * @param final Whether this is the last chunk
      */
      Decompress.prototype.push = function (chunk, _final10) {
        if (!this.ondata) _err(5);
        if (!this.s) {
          if (this.p && this.p.length) {
            var n = new u8(this.p.length + chunk.length);
            n.set(this.p), n.set(chunk, this.p.length);
          } else this.p = chunk;
          if (this.p.length > 2) {
            this.s = this.p[0] == 31 && this.p[1] == 139 && this.p[2] == 8 ? new this.G(this.o) : (this.p[0] & 15) != 8 || this.p[0] >> 4 > 7 || (this.p[0] << 8 | this.p[1]) % 31 ? new this.I(this.o) : new this.Z(this.o);
            this.i();
            this.s.push(this.p, _final10);
            this.p = null;
          }
        } else this.s.push(chunk, _final10);
      };
      return Decompress;
    }();
    exports.Decompress = Decompress;
    /**
    * Asynchronous streaming GZIP, Zlib, or raw DEFLATE decompression
    */
    var AsyncDecompress = /*#__PURE__*/function () {
      function AsyncDecompress(opts, cb) {
        Decompress.call(this, opts, cb);
        this.queuedSize = 0;
        this.G = AsyncGunzip;
        this.I = AsyncInflate;
        this.Z = AsyncUnzlib;
      }
      AsyncDecompress.prototype.i = function () {
        var _this = this;
        this.s.ondata = function (err, dat, _final11) {
          _this.ondata(err, dat, _final11);
        };
        this.s.ondrain = function (size) {
          _this.queuedSize -= size;
          if (_this.ondrain) _this.ondrain(size);
        };
      };
      /**
      * Pushes a chunk to be decompressed
      * @param chunk The chunk to push
      * @param final Whether this is the last chunk
      */
      AsyncDecompress.prototype.push = function (chunk, _final12) {
        this.queuedSize += chunk.length;
        Decompress.prototype.push.call(this, chunk, _final12);
      };
      return AsyncDecompress;
    }();
    exports.AsyncDecompress = AsyncDecompress;
    function decompress(data, opts, cb) {
      if (!cb) cb = opts, opts = {};
      if (typeof cb != 'function') _err(7);
      return data[0] == 31 && data[1] == 139 && data[2] == 8 ? gunzip(data, opts, cb) : (data[0] & 15) != 8 || data[0] >> 4 > 7 || (data[0] << 8 | data[1]) % 31 ? inflate(data, opts, cb) : unzlib(data, opts, cb);
    }
    exports.decompress = decompress;
    /**
    * Expands compressed GZIP, Zlib, or raw DEFLATE data, automatically detecting the format
    * @param data The data to decompress
    * @param opts The decompression options
    * @returns The decompressed version of the data
    */
    function decompressSync(data, opts) {
      return data[0] == 31 && data[1] == 139 && data[2] == 8 ? gunzipSync(data, opts) : (data[0] & 15) != 8 || data[0] >> 4 > 7 || (data[0] << 8 | data[1]) % 31 ? inflateSync(data, opts) : unzlibSync(data, opts);
    }
    exports.decompressSync = decompressSync;
    // flatten a directory structure
    var _fltn = function fltn(d, p, t, o) {
      for (var k in d) {
        var val = d[k],
          n = p + k,
          op = o;
        if (Array.isArray(val)) op = mrg(o, val[1]), val = val[0];
        if (val instanceof u8) t[n] = [val, op];else {
          t[n += '/'] = [new u8(0), op];
          _fltn(val, n, t, o);
        }
      }
    };
    // text encoder
    var te = typeof TextEncoder != 'undefined' && /*#__PURE__*/new TextEncoder();
    // text decoder
    var td = typeof TextDecoder != 'undefined' && /*#__PURE__*/new TextDecoder();
    // text decoder stream
    var tds = 0;
    try {
      td.decode(et, {
        stream: true
      });
      tds = 1;
    } catch (e) {}
    // decode UTF8
    var dutf8 = function dutf8(d) {
      for (var r = '', i = 0;;) {
        var c = d[i++];
        var eb = (c > 127) + (c > 223) + (c > 239);
        if (i + eb > d.length) return {
          s: r,
          r: slc(d, i - 1)
        };
        if (!eb) r += String.fromCharCode(c);else if (eb == 3) {
          c = ((c & 15) << 18 | (d[i++] & 63) << 12 | (d[i++] & 63) << 6 | d[i++] & 63) - 65536, r += String.fromCharCode(55296 | c >> 10, 56320 | c & 1023);
        } else if (eb & 1) r += String.fromCharCode((c & 31) << 6 | d[i++] & 63);else r += String.fromCharCode((c & 15) << 12 | (d[i++] & 63) << 6 | d[i++] & 63);
      }
    };
    /**
    * Streaming UTF-8 decoding
    */
    var DecodeUTF8 = /*#__PURE__*/function () {
      /**
      * Creates a UTF-8 decoding stream
      * @param cb The callback to call whenever data is decoded
      */
      function DecodeUTF8(cb) {
        this.ondata = cb;
        if (tds) this.t = new TextDecoder();else this.p = et;
      }
      /**
      * Pushes a chunk to be decoded from UTF-8 binary
      * @param chunk The chunk to push
      * @param final Whether this is the last chunk
      */
      DecodeUTF8.prototype.push = function (chunk, _final13) {
        if (!this.ondata) _err(5);
        _final13 = !!_final13;
        if (this.t) {
          this.ondata(this.t.decode(chunk, {
            stream: true
          }), _final13);
          if (_final13) {
            if (this.t.decode().length) _err(8);
            this.t = null;
          }
          return;
        }
        if (!this.p) _err(4);
        var dat = new u8(this.p.length + chunk.length);
        dat.set(this.p);
        dat.set(chunk, this.p.length);
        var _a = dutf8(dat),
          s = _a.s,
          r = _a.r;
        if (_final13) {
          if (r.length) _err(8);
          this.p = null;
        } else this.p = r;
        this.ondata(s, _final13);
      };
      return DecodeUTF8;
    }();
    exports.DecodeUTF8 = DecodeUTF8;
    /**
    * Streaming UTF-8 encoding
    */
    var EncodeUTF8 = /*#__PURE__*/function () {
      /**
      * Creates a UTF-8 decoding stream
      * @param cb The callback to call whenever data is encoded
      */
      function EncodeUTF8(cb) {
        this.ondata = cb;
      }
      /**
      * Pushes a chunk to be encoded to UTF-8
      * @param chunk The string data to push
      * @param final Whether this is the last chunk
      */
      EncodeUTF8.prototype.push = function (chunk, _final14) {
        if (!this.ondata) _err(5);
        if (this.d) _err(4);
        this.ondata(strToU8(chunk), this.d = _final14 || false);
      };
      return EncodeUTF8;
    }();
    exports.EncodeUTF8 = EncodeUTF8;
    /**
    * Converts a string into a Uint8Array for use with compression/decompression methods
    * @param str The string to encode
    * @param latin1 Whether or not to interpret the data as Latin-1. This should
    *               not need to be true unless decoding a binary string.
    * @returns The string encoded in UTF-8/Latin-1 binary
    */
    function strToU8(str, latin1) {
      if (latin1) {
        var ar_1 = new u8(str.length);
        for (var i = 0; i < str.length; ++i) ar_1[i] = str.charCodeAt(i);
        return ar_1;
      }
      if (te) return te.encode(str);
      var l = str.length;
      var ar = new u8(str.length + (str.length >> 1));
      var ai = 0;
      var w = function w(v) {
        ar[ai++] = v;
      };
      for (var i = 0; i < l; ++i) {
        if (ai + 5 > ar.length) {
          var n = new u8(ai + 8 + (l - i << 1));
          n.set(ar);
          ar = n;
        }
        var c = str.charCodeAt(i);
        if (c < 128 || latin1) w(c);else if (c < 2048) w(192 | c >> 6), w(128 | c & 63);else if (c > 55295 && c < 57344) c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i) & 1023, w(240 | c >> 18), w(128 | c >> 12 & 63), w(128 | c >> 6 & 63), w(128 | c & 63);else w(224 | c >> 12), w(128 | c >> 6 & 63), w(128 | c & 63);
      }
      return slc(ar, 0, ai);
    }
    exports.strToU8 = strToU8;
    /**
    * Converts a Uint8Array to a string
    * @param dat The data to decode to string
    * @param latin1 Whether or not to interpret the data as Latin-1. This should
    *               not need to be true unless encoding to binary string.
    * @returns The original UTF-8/Latin-1 string
    */
    function strFromU8(dat, latin1) {
      if (latin1) {
        var r = '';
        for (var i = 0; i < dat.length; i += 16384) r += String.fromCharCode.apply(null, dat.subarray(i, i + 16384));
        return r;
      } else if (td) {
        return td.decode(dat);
      } else {
        var _a = dutf8(dat),
          s = _a.s,
          r = _a.r;
        if (r.length) _err(8);
        return s;
      }
    }
    exports.strFromU8 = strFromU8;
    ;
    // deflate bit flag
    var dbf = function dbf(l) {
      return l == 1 ? 3 : l < 6 ? 2 : l == 9 ? 1 : 0;
    };
    // skip local zip header
    var slzh = function slzh(d, b) {
      return b + 30 + b2(d, b + 26) + b2(d, b + 28);
    };
    // read zip header
    var zh = function zh(d, b, z) {
      var fnl = b2(d, b + 28),
        fn = strFromU8(d.subarray(b + 46, b + 46 + fnl), !(b2(d, b + 8) & 2048)),
        es = b + 46 + fnl,
        bs = b4(d, b + 20);
      var _a = z && bs == 4294967295 ? z64e(d, es) : [bs, b4(d, b + 24), b4(d, b + 42)],
        sc = _a[0],
        su = _a[1],
        off = _a[2];
      return [b2(d, b + 10), sc, su, fn, es + b2(d, b + 30) + b2(d, b + 32), off];
    };
    // read zip64 extra field
    var z64e = function z64e(d, b) {
      for (; b2(d, b) != 1; b += 4 + b2(d, b + 2));
      return [b8(d, b + 12), b8(d, b + 4), b8(d, b + 20)];
    };
    // extra field length
    var exfl = function exfl(ex) {
      var le = 0;
      if (ex) {
        for (var k in ex) {
          var l = ex[k].length;
          if (l > 65535) _err(9);
          le += l + 4;
        }
      }
      return le;
    };
    // write zip header
    var wzh = function wzh(d, b, f, fn, u, c, ce, co) {
      var fl = fn.length,
        ex = f.extra,
        col = co && co.length;
      var exl = exfl(ex);
      wbytes(d, b, ce != null ? 0x2014B50 : 0x4034B50), b += 4;
      if (ce != null) d[b++] = 20, d[b++] = f.os;
      d[b] = 20, b += 2; // spec compliance? what's that?
      d[b++] = f.flag << 1 | (c < 0 && 8), d[b++] = u && 8;
      d[b++] = f.compression & 255, d[b++] = f.compression >> 8;
      var dt = new Date(f.mtime == null ? Date.now() : f.mtime),
        y = dt.getFullYear() - 1980;
      if (y < 0 || y > 119) _err(10);
      wbytes(d, b, y << 25 | dt.getMonth() + 1 << 21 | dt.getDate() << 16 | dt.getHours() << 11 | dt.getMinutes() << 5 | dt.getSeconds() >> 1), b += 4;
      if (c != -1) {
        wbytes(d, b, f.crc);
        wbytes(d, b + 4, c < 0 ? -c - 2 : c);
        wbytes(d, b + 8, f.size);
      }
      wbytes(d, b + 12, fl);
      wbytes(d, b + 14, exl), b += 16;
      if (ce != null) {
        wbytes(d, b, col);
        wbytes(d, b + 6, f.attrs);
        wbytes(d, b + 10, ce), b += 14;
      }
      d.set(fn, b);
      b += fl;
      if (exl) {
        for (var k in ex) {
          var exf = ex[k],
            l = exf.length;
          wbytes(d, b, +k);
          wbytes(d, b + 2, l);
          d.set(exf, b + 4), b += 4 + l;
        }
      }
      if (col) d.set(co, b), b += col;
      return b;
    };
    // write zip footer (end of central directory)
    var wzf = function wzf(o, b, c, d, e) {
      wbytes(o, b, 0x6054B50); // skip disk
      wbytes(o, b + 8, c);
      wbytes(o, b + 10, c);
      wbytes(o, b + 12, d);
      wbytes(o, b + 16, e);
    };
    /**
    * A pass-through stream to keep data uncompressed in a ZIP archive.
    */
    var ZipPassThrough = /*#__PURE__*/function () {
      /**
      * Creates a pass-through stream that can be added to ZIP archives
      * @param filename The filename to associate with this data stream
      */
      function ZipPassThrough(filename) {
        this.filename = filename;
        this.c = crc();
        this.size = 0;
        this.compression = 0;
      }
      /**
      * Processes a chunk and pushes to the output stream. You can override this
      * method in a subclass for custom behavior, but by default this passes
      * the data through. You must call this.ondata(err, chunk, final) at some
      * point in this method.
      * @param chunk The chunk to process
      * @param final Whether this is the last chunk
      */
      ZipPassThrough.prototype.process = function (chunk, _final15) {
        this.ondata(null, chunk, _final15);
      };
      /**
      * Pushes a chunk to be added. If you are subclassing this with a custom
      * compression algorithm, note that you must push data from the source
      * file only, pre-compression.
      * @param chunk The chunk to push
      * @param final Whether this is the last chunk
      */
      ZipPassThrough.prototype.push = function (chunk, _final16) {
        if (!this.ondata) _err(5);
        this.c.p(chunk);
        this.size += chunk.length;
        if (_final16) this.crc = this.c.d();
        this.process(chunk, _final16 || false);
      };
      return ZipPassThrough;
    }();
    exports.ZipPassThrough = ZipPassThrough;
    // I don't extend because TypeScript extension adds 1kB of runtime bloat
    /**
    * Streaming DEFLATE compression for ZIP archives. Prefer using AsyncZipDeflate
    * for better performance
    */
    var ZipDeflate = /*#__PURE__*/function () {
      /**
      * Creates a DEFLATE stream that can be added to ZIP archives
      * @param filename The filename to associate with this data stream
      * @param opts The compression options
      */
      function ZipDeflate(filename, opts) {
        var _this = this;
        if (!opts) opts = {};
        ZipPassThrough.call(this, filename);
        this.d = new Deflate(opts, function (dat, _final17) {
          _this.ondata(null, dat, _final17);
        });
        this.compression = 8;
        this.flag = dbf(opts.level);
      }
      ZipDeflate.prototype.process = function (chunk, _final18) {
        try {
          this.d.push(chunk, _final18);
        } catch (e) {
          this.ondata(e, null, _final18);
        }
      };
      /**
      * Pushes a chunk to be deflated
      * @param chunk The chunk to push
      * @param final Whether this is the last chunk
      */
      ZipDeflate.prototype.push = function (chunk, _final19) {
        ZipPassThrough.prototype.push.call(this, chunk, _final19);
      };
      return ZipDeflate;
    }();
    exports.ZipDeflate = ZipDeflate;
    /**
    * Asynchronous streaming DEFLATE compression for ZIP archives
    */
    var AsyncZipDeflate = /*#__PURE__*/function () {
      /**
      * Creates an asynchronous DEFLATE stream that can be added to ZIP archives
      * @param filename The filename to associate with this data stream
      * @param opts The compression options
      */
      function AsyncZipDeflate(filename, opts) {
        var _this = this;
        if (!opts) opts = {};
        ZipPassThrough.call(this, filename);
        this.d = new AsyncDeflate(opts, function (err, dat, _final20) {
          _this.ondata(err, dat, _final20);
        });
        this.compression = 8;
        this.flag = dbf(opts.level);
        this.terminate = this.d.terminate;
      }
      AsyncZipDeflate.prototype.process = function (chunk, _final21) {
        this.d.push(chunk, _final21);
      };
      /**
      * Pushes a chunk to be deflated
      * @param chunk The chunk to push
      * @param final Whether this is the last chunk
      */
      AsyncZipDeflate.prototype.push = function (chunk, _final22) {
        ZipPassThrough.prototype.push.call(this, chunk, _final22);
      };
      return AsyncZipDeflate;
    }();
    exports.AsyncZipDeflate = AsyncZipDeflate;
    // TODO: Better tree shaking
    /**
    * A zippable archive to which files can incrementally be added
    */
    var Zip = /*#__PURE__*/function () {
      /**
      * Creates an empty ZIP archive to which files can be added
      * @param cb The callback to call whenever data for the generated ZIP archive
      *           is available
      */
      function Zip(cb) {
        this.ondata = cb;
        this.u = [];
        this.d = 1;
      }
      /**
      * Adds a file to the ZIP archive
      * @param file The file stream to add
      */
      Zip.prototype.add = function (file) {
        var _this = this;
        if (!this.ondata) _err(5);
        // finishing or finished
        if (this.d & 2) this.ondata(_err(4 + (this.d & 1) * 8, 0, 1), null, false);else {
          var f = strToU8(file.filename),
            fl_1 = f.length;
          var com = file.comment,
            o = com && strToU8(com);
          var u = fl_1 != file.filename.length || o && com.length != o.length;
          var hl_1 = fl_1 + exfl(file.extra) + 30;
          if (fl_1 > 65535) this.ondata(_err(11, 0, 1), null, false);
          var header = new u8(hl_1);
          wzh(header, 0, file, f, u, -1);
          var chks_1 = [header];
          var pAll_1 = function pAll_1() {
            for (var _i = 0, chks_2 = chks_1; _i < chks_2.length; _i++) {
              var chk = chks_2[_i];
              _this.ondata(null, chk, false);
            }
            chks_1 = [];
          };
          var tr_1 = this.d;
          this.d = 0;
          var ind_1 = this.u.length;
          var uf_1 = mrg(file, {
            f: f,
            u: u,
            o: o,
            t: function t() {
              if (file.terminate) file.terminate();
            },
            r: function r() {
              pAll_1();
              if (tr_1) {
                var nxt = _this.u[ind_1 + 1];
                if (nxt) nxt.r();else _this.d = 1;
              }
              tr_1 = 1;
            }
          });
          var cl_1 = 0;
          file.ondata = function (err, dat, _final23) {
            if (err) {
              _this.ondata(err, dat, _final23);
              _this.terminate();
            } else {
              cl_1 += dat.length;
              chks_1.push(dat);
              if (_final23) {
                var dd = new u8(16);
                wbytes(dd, 0, 0x8074B50);
                wbytes(dd, 4, file.crc);
                wbytes(dd, 8, cl_1);
                wbytes(dd, 12, file.size);
                chks_1.push(dd);
                uf_1.c = cl_1, uf_1.b = hl_1 + cl_1 + 16, uf_1.crc = file.crc, uf_1.size = file.size;
                if (tr_1) uf_1.r();
                tr_1 = 1;
              } else if (tr_1) pAll_1();
            }
          };
          this.u.push(uf_1);
        }
      };
      /**
      * Ends the process of adding files and prepares to emit the final chunks.
      * This *must* be called after adding all desired files for the resulting
      * ZIP file to work properly.
      */
      Zip.prototype.end = function () {
        var _this = this;
        if (this.d & 2) {
          this.ondata(_err(4 + (this.d & 1) * 8, 0, 1), null, true);
          return;
        }
        if (this.d) this.e();else this.u.push({
          r: function r() {
            if (!(_this.d & 1)) return;
            _this.u.splice(-1, 1);
            _this.e();
          },
          t: function t() {}
        });
        this.d = 3;
      };
      Zip.prototype.e = function () {
        var bt = 0,
          l = 0,
          tl = 0;
        for (var _i = 0, _a = this.u; _i < _a.length; _i++) {
          var f = _a[_i];
          tl += 46 + f.f.length + exfl(f.extra) + (f.o ? f.o.length : 0);
        }
        var out = new u8(tl + 22);
        for (var _b = 0, _c = this.u; _b < _c.length; _b++) {
          var f = _c[_b];
          wzh(out, bt, f, f.f, f.u, -f.c - 2, l, f.o);
          bt += 46 + f.f.length + exfl(f.extra) + (f.o ? f.o.length : 0), l += f.b;
        }
        wzf(out, bt, this.u.length, tl, l);
        this.ondata(null, out, true);
        this.d = 2;
      };
      /**
      * A method to terminate any internal workers used by the stream. Subsequent
      * calls to add() will fail.
      */
      Zip.prototype.terminate = function () {
        for (var _i = 0, _a = this.u; _i < _a.length; _i++) {
          var f = _a[_i];
          f.t();
        }
        this.d = 2;
      };
      return Zip;
    }();
    exports.Zip = Zip;
    function zip(data, opts, cb) {
      if (!cb) cb = opts, opts = {};
      if (typeof cb != 'function') _err(7);
      var r = {};
      _fltn(data, '', r, opts);
      var k = Object.keys(r);
      var lft = k.length,
        o = 0,
        tot = 0;
      var slft = lft,
        files = new Array(lft);
      var term = [];
      var tAll = function tAll() {
        for (var i = 0; i < term.length; ++i) term[i]();
      };
      var cbd = function cbd(a, b) {
        mt(function () {
          cb(a, b);
        });
      };
      mt(function () {
        cbd = cb;
      });
      var cbf = function cbf() {
        var out = new u8(tot + 22),
          oe = o,
          cdl = tot - o;
        tot = 0;
        for (var i = 0; i < slft; ++i) {
          var f = files[i];
          try {
            var l = f.c.length;
            wzh(out, tot, f, f.f, f.u, l);
            var badd = 30 + f.f.length + exfl(f.extra);
            var loc = tot + badd;
            out.set(f.c, loc);
            wzh(out, o, f, f.f, f.u, l, tot, f.m), o += 16 + badd + (f.m ? f.m.length : 0), tot = loc + l;
          } catch (e) {
            return cbd(e, null);
          }
        }
        wzf(out, o, files.length, cdl, oe);
        cbd(null, out);
      };
      if (!lft) cbf();
      var _loop_1 = function _loop_1(i) {
        var fn = k[i];
        var _a = r[fn],
          file = _a[0],
          p = _a[1];
        var c = crc(),
          size = file.length;
        c.p(file);
        var f = strToU8(fn),
          s = f.length;
        var com = p.comment,
          m = com && strToU8(com),
          ms = m && m.length;
        var exl = exfl(p.extra);
        var compression = p.level == 0 ? 0 : 8;
        var cbl = function cbl(e, d) {
          if (e) {
            tAll();
            cbd(e, null);
          } else {
            var l = d.length;
            files[i] = mrg(p, {
              size: size,
              crc: c.d(),
              c: d,
              f: f,
              m: m,
              u: s != fn.length || m && com.length != ms,
              compression: compression
            });
            o += 30 + s + exl + l;
            tot += 76 + 2 * (s + exl) + (ms || 0) + l;
            if (! --lft) cbf();
          }
        };
        if (s > 65535) cbl(_err(11, 0, 1), null);
        if (!compression) cbl(null, file);else if (size < 160000) {
          try {
            cbl(null, deflateSync(file, p));
          } catch (e) {
            cbl(e, null);
          }
        } else term.push(deflate(file, p, cbl));
      };
      // Cannot use lft because it can decrease
      for (var i = 0; i < slft; ++i) {
        _loop_1(i);
      }
      return tAll;
    }
    exports.zip = zip;
    /**
    * Synchronously creates a ZIP file. Prefer using `zip` for better performance
    * with more than one file.
    * @param data The directory structure for the ZIP archive
    * @param opts The main options, merged with per-file options
    * @returns The generated ZIP archive
    */
    function zipSync(data, opts) {
      if (!opts) opts = {};
      var r = {};
      var files = [];
      _fltn(data, '', r, opts);
      var o = 0;
      var tot = 0;
      for (var fn in r) {
        var _a = r[fn],
          file = _a[0],
          p = _a[1];
        var compression = p.level == 0 ? 0 : 8;
        var f = strToU8(fn),
          s = f.length;
        var com = p.comment,
          m = com && strToU8(com),
          ms = m && m.length;
        var exl = exfl(p.extra);
        if (s > 65535) _err(11);
        var d = compression ? deflateSync(file, p) : file,
          l = d.length;
        var c = crc();
        c.p(file);
        files.push(mrg(p, {
          size: file.length,
          crc: c.d(),
          c: d,
          f: f,
          m: m,
          u: s != fn.length || m && com.length != ms,
          o: o,
          compression: compression
        }));
        o += 30 + s + exl + l;
        tot += 76 + 2 * (s + exl) + (ms || 0) + l;
      }
      var out = new u8(tot + 22),
        oe = o,
        cdl = tot - o;
      for (var i = 0; i < files.length; ++i) {
        var f = files[i];
        wzh(out, f.o, f, f.f, f.u, f.c.length);
        var badd = 30 + f.f.length + exfl(f.extra);
        out.set(f.c, f.o + badd);
        wzh(out, o, f, f.f, f.u, f.c.length, f.o, f.m), o += 16 + badd + (f.m ? f.m.length : 0);
      }
      wzf(out, o, files.length, cdl, oe);
      return out;
    }
    exports.zipSync = zipSync;
    /**
    * Streaming pass-through decompression for ZIP archives
    */
    var UnzipPassThrough = /*#__PURE__*/function () {
      function UnzipPassThrough() {}
      UnzipPassThrough.prototype.push = function (data, _final24) {
        this.ondata(null, data, _final24);
      };
      UnzipPassThrough.compression = 0;
      return UnzipPassThrough;
    }();
    exports.UnzipPassThrough = UnzipPassThrough;
    /**
    * Streaming DEFLATE decompression for ZIP archives. Prefer AsyncZipInflate for
    * better performance.
    */
    var UnzipInflate = /*#__PURE__*/function () {
      /**
      * Creates a DEFLATE decompression that can be used in ZIP archives
      */
      function UnzipInflate() {
        var _this = this;
        this.i = new Inflate(function (dat, _final25) {
          _this.ondata(null, dat, _final25);
        });
      }
      UnzipInflate.prototype.push = function (data, _final26) {
        try {
          this.i.push(data, _final26);
        } catch (e) {
          this.ondata(e, null, _final26);
        }
      };
      UnzipInflate.compression = 8;
      return UnzipInflate;
    }();
    exports.UnzipInflate = UnzipInflate;
    /**
    * Asynchronous streaming DEFLATE decompression for ZIP archives
    */
    var AsyncUnzipInflate = /*#__PURE__*/function () {
      /**
      * Creates a DEFLATE decompression that can be used in ZIP archives
      */
      function AsyncUnzipInflate(_, sz) {
        var _this = this;
        if (sz < 320000) {
          this.i = new Inflate(function (dat, _final27) {
            _this.ondata(null, dat, _final27);
          });
        } else {
          this.i = new AsyncInflate(function (err, dat, _final28) {
            _this.ondata(err, dat, _final28);
          });
          this.terminate = this.i.terminate;
        }
      }
      AsyncUnzipInflate.prototype.push = function (data, _final29) {
        if (this.i.terminate) data = slc(data, 0);
        this.i.push(data, _final29);
      };
      AsyncUnzipInflate.compression = 8;
      return AsyncUnzipInflate;
    }();
    exports.AsyncUnzipInflate = AsyncUnzipInflate;
    /**
    * A ZIP archive decompression stream that emits files as they are discovered
    */
    var Unzip = /*#__PURE__*/function () {
      /**
      * Creates a ZIP decompression stream
      * @param cb The callback to call whenever a file in the ZIP archive is found
      */
      function Unzip(cb) {
        this.onfile = cb;
        this.k = [];
        this.o = {
          0: UnzipPassThrough
        };
        this.p = et;
      }
      /**
      * Pushes a chunk to be unzipped
      * @param chunk The chunk to push
      * @param final Whether this is the last chunk
      */
      Unzip.prototype.push = function (chunk, _final30) {
        var _this = this;
        if (!this.onfile) _err(5);
        if (!this.p) _err(4);
        if (this.c > 0) {
          var len = Math.min(this.c, chunk.length);
          var toAdd = chunk.subarray(0, len);
          this.c -= len;
          if (this.d) this.d.push(toAdd, !this.c);else this.k[0].push(toAdd);
          chunk = chunk.subarray(len);
          if (chunk.length) return this.push(chunk, _final30);
        } else {
          var f = 0,
            i = 0,
            is = void 0,
            buf = void 0;
          if (!this.p.length) buf = chunk;else if (!chunk.length) buf = this.p;else {
            buf = new u8(this.p.length + chunk.length);
            buf.set(this.p), buf.set(chunk, this.p.length);
          }
          var l = buf.length,
            oc = this.c,
            add = oc && this.d;
          var _loop_2 = function _loop_2() {
            var _a;
            var sig = b4(buf, i);
            if (sig == 0x4034B50) {
              f = 1, is = i;
              this_1.d = null;
              this_1.c = 0;
              var bf = b2(buf, i + 6),
                cmp_1 = b2(buf, i + 8),
                u = bf & 2048,
                dd = bf & 8,
                fnl = b2(buf, i + 26),
                es = b2(buf, i + 28);
              if (l > i + 30 + fnl + es) {
                var chks_3 = [];
                this_1.k.unshift(chks_3);
                f = 2;
                var sc_1 = b4(buf, i + 18),
                  su_1 = b4(buf, i + 22);
                var fn_1 = strFromU8(buf.subarray(i + 30, i += 30 + fnl), !u);
                if (sc_1 == 4294967295) {
                  _a = dd ? [-2] : z64e(buf, i), sc_1 = _a[0], su_1 = _a[1];
                } else if (dd) sc_1 = -1;
                i += es;
                this_1.c = sc_1;
                var d_1;
                var file_1 = {
                  name: fn_1,
                  compression: cmp_1,
                  start: function start() {
                    if (!file_1.ondata) _err(5);
                    if (!sc_1) file_1.ondata(null, et, true);else {
                      var ctr = _this.o[cmp_1];
                      if (!ctr) file_1.ondata(_err(14, 'unknown compression type ' + cmp_1, 1), null, false);
                      d_1 = sc_1 < 0 ? new ctr(fn_1) : new ctr(fn_1, sc_1, su_1);
                      d_1.ondata = function (err, dat, _final31) {
                        file_1.ondata(err, dat, _final31);
                      };
                      for (var _i = 0, chks_4 = chks_3; _i < chks_4.length; _i++) {
                        var dat = chks_4[_i];
                        d_1.push(dat, false);
                      }
                      if (_this.k[0] == chks_3 && _this.c) _this.d = d_1;else d_1.push(et, true);
                    }
                  },
                  terminate: function terminate() {
                    if (d_1 && d_1.terminate) d_1.terminate();
                  }
                };
                if (sc_1 >= 0) file_1.size = sc_1, file_1.originalSize = su_1;
                this_1.onfile(file_1);
              }
              return "break";
            } else if (oc) {
              if (sig == 0x8074B50) {
                is = i += 12 + (oc == -2 && 8), f = 3, this_1.c = 0;
                return "break";
              } else if (sig == 0x2014B50) {
                is = i -= 4, f = 3, this_1.c = 0;
                return "break";
              }
            }
          };
          var this_1 = this;
          for (; i < l - 4; ++i) {
            var state_1 = _loop_2();
            if (state_1 === "break") break;
          }
          this.p = et;
          if (oc < 0) {
            var dat = f ? buf.subarray(0, is - 12 - (oc == -2 && 8) - (b4(buf, is - 16) == 0x8074B50 && 4)) : buf.subarray(0, i);
            if (add) add.push(dat, !!f);else this.k[+(f == 2)].push(dat);
          }
          if (f & 2) return this.push(buf.subarray(i), _final30);
          this.p = buf.subarray(i);
        }
        if (_final30) {
          if (this.c) _err(13);
          this.p = null;
        }
      };
      /**
      * Registers a decoder with the stream, allowing for files compressed with
      * the compression type provided to be expanded correctly
      * @param decoder The decoder constructor
      */
      Unzip.prototype.register = function (decoder) {
        this.o[decoder.compression] = decoder;
      };
      return Unzip;
    }();
    exports.Unzip = Unzip;
    var mt = typeof queueMicrotask == 'function' ? queueMicrotask : typeof setTimeout == 'function' ? setTimeout : function (fn) {
      fn();
    };
    function unzip(data, opts, cb) {
      if (!cb) cb = opts, opts = {};
      if (typeof cb != 'function') _err(7);
      var term = [];
      var tAll = function tAll() {
        for (var i = 0; i < term.length; ++i) term[i]();
      };
      var files = {};
      var cbd = function cbd(a, b) {
        mt(function () {
          cb(a, b);
        });
      };
      mt(function () {
        cbd = cb;
      });
      var e = data.length - 22;
      for (; b4(data, e) != 0x6054B50; --e) {
        if (!e || data.length - e > 65558) {
          cbd(_err(13, 0, 1), null);
          return tAll;
        }
      }
      ;
      var lft = b2(data, e + 8);
      if (lft) {
        var c = lft;
        var o = b4(data, e + 16);
        var z = o == 4294967295 || c == 65535;
        if (z) {
          var ze = b4(data, e - 12);
          z = b4(data, ze) == 0x6064B50;
          if (z) {
            c = lft = b4(data, ze + 32);
            o = b4(data, ze + 48);
          }
        }
        var fltr = opts && opts.filter;
        var _loop_3 = function _loop_3(i) {
          var _a = zh(data, o, z),
            c_1 = _a[0],
            sc = _a[1],
            su = _a[2],
            fn = _a[3],
            no = _a[4],
            off = _a[5],
            b = slzh(data, off);
          o = no;
          var cbl = function cbl(e, d) {
            if (e) {
              tAll();
              cbd(e, null);
            } else {
              if (d) files[fn] = d;
              if (! --lft) cbd(null, files);
            }
          };
          if (!fltr || fltr({
            name: fn,
            size: sc,
            originalSize: su,
            compression: c_1
          })) {
            if (!c_1) cbl(null, slc(data, b, b + sc));else if (c_1 == 8) {
              var infl = data.subarray(b, b + sc);
              // Synchronously decompress under 512KB, or barely-compressed data
              if (su < 524288 || sc > 0.8 * su) {
                try {
                  cbl(null, inflateSync(infl, {
                    out: new u8(su)
                  }));
                } catch (e) {
                  cbl(e, null);
                }
              } else term.push(inflate(infl, {
                size: su
              }, cbl));
            } else cbl(_err(14, 'unknown compression type ' + c_1, 1), null);
          } else cbl(null, null);
        };
        for (var i = 0; i < c; ++i) {
          _loop_3(i);
        }
      } else cbd(null, {});
      return tAll;
    }
    exports.unzip = unzip;
    /**
    * Synchronously decompresses a ZIP archive. Prefer using `unzip` for better
    * performance with more than one file.
    * @param data The raw compressed ZIP file
    * @param opts The ZIP extraction options
    * @returns The decompressed files
    */
    function unzipSync(data, opts) {
      var files = {};
      var e = data.length - 22;
      for (; b4(data, e) != 0x6054B50; --e) {
        if (!e || data.length - e > 65558) _err(13);
      }
      ;
      var c = b2(data, e + 8);
      if (!c) return {};
      var o = b4(data, e + 16);
      var z = o == 4294967295 || c == 65535;
      if (z) {
        var ze = b4(data, e - 12);
        z = b4(data, ze) == 0x6064B50;
        if (z) {
          c = b4(data, ze + 32);
          o = b4(data, ze + 48);
        }
      }
      var fltr = opts && opts.filter;
      for (var i = 0; i < c; ++i) {
        var _a = zh(data, o, z),
          c_2 = _a[0],
          sc = _a[1],
          su = _a[2],
          fn = _a[3],
          no = _a[4],
          off = _a[5],
          b = slzh(data, off);
        o = no;
        if (!fltr || fltr({
          name: fn,
          size: sc,
          originalSize: su,
          compression: c_2
        })) {
          if (!c_2) files[fn] = slc(data, b, b + sc);else if (c_2 == 8) files[fn] = inflateSync(data.subarray(b, b + sc), {
            out: new u8(su)
          });else _err(14, 'unknown compression type ' + c_2);
        }
      }
      return files;
    }
    exports.unzipSync = unzipSync;

    // ========================== CrashSgiht Core Begin===============================
    var StrategyEnableState = {
      Unknow: 0,
      Enable: 1,
      Disable: 2
    };
    var strategyEnableState = StrategyEnableState.Unknow;
    var hasInitCrashSight = false;
    var hasRegisterErrorCallback = false;
    var hasHookConsoleError = false;
    var hasMergeExcepionFile = false;
    var serverStrategy = {};
    var platformId = 32;
    var sdkVersion = '1.3';
    var errorReportCMD = 930;
    var connnetReportCDM = 940;
    var coldStartup = 1;
    var hotStartup = 2;
    var localStrategyKey = 'crashsight_local_strategy';
    var logMaxLength = 30720;
    var appId = '';
    var sessionId = '';
    var userId = '';
    var extKV = {};
    var userLogs = [];
    var logLength = 0;
    var logLevel = 3;
    var _deviceId = null;
    var appVersion = "0.0.0";
    var wxAppIdentify = "none";
    var reportURL = 'https://minigame.crashsight.qq.com/rqd/pb/sync';
    var generateUUID = function generateUUID() {
      var uuid = '';
      for (var _i2 = 0; _i2 < 32; _i2++) {
        var random = Math.random() * 16 | 0;
        if (_i2 === 8 || _i2 === 12 || _i2 === 16 || _i2 === 20) {
          uuid += '-';
        }
        uuid += (_i2 === 12 ? 4 : _i2 === 16 ? random & 3 | 8 : random).toString(16);
      }
      return uuid;
    };
    var getDeviceId = function getDeviceId() {
      if (_deviceId) {
        return _deviceId;
      }
      _deviceId = wx.getStorageSync('crashsight_device_id');
      if (_deviceId) {
        return _deviceId;
      }
      _deviceId = generateUUID();
      wx.setStorageSync('crashsight_device_id', _deviceId);
      return _deviceId;
    };
    var buildRequestJson = /*#__PURE__*/function () {
      var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(obj, cmd) {
        var ret, deviceInfo, request, uniPacket;
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return wx.getNetworkType();
            case 2:
              ret = _context.sent;
              deviceInfo = {};
              try {
                deviceInfo = wx.getDeviceInfo();
              } catch (error) {
                deviceInfo['system'] = 'unknow';
                deviceInfo['model'] = 'unknow';
              }
              request = {};
              request.cmd = cmd;
              request.platformId = platformId;
              request.prodId = appId;
              request.networkType = ret && ret.networkType ? ret.networkType : 'unknown';
              if (cmd === connnetReportCDM) {
                obj.list[0].startCostTime = typeof globalThis.__crashSight.startCostTime === 'undefined' ? -1 : globalThis.__crashSight.startCostTime;
              }
              request.sBuffer = obj;
              request.model = deviceInfo['model'];
              request.osVer = deviceInfo['system'];
              request.uploadTime = new Date().getTime();
              request.sessionId = sessionId;
              request.deviceId = getDeviceId();
              request.sdkVer = sdkVersion;
              request.version = appVersion;
              request.bundleId = wxAppIdentify;
              uniPacket = {
                sServantName: 'RqdServer',
                sFuncName: 'sync',
                request: request
              };
              return _context.abrupt("return", uniPacket);
            case 22:
            case "end":
              return _context.stop();
          }
        }, _callee);
      }));
      return function buildRequestJson(_x, _x2) {
        return _ref.apply(this, arguments);
      };
    }();
    var sendHttp = function sendHttp(body, cmd, callback) {
      var header = {
        platformId: platformId.toString(),
        prodId: appId,
        cmd: cmd,
        sdkVer: sdkVersion,
        appVer: appVersion,
        model: wx.getDeviceInfo()['model'],
        sdkName: "WXCrashSightSDK",
        redisKeyUuid: getDeviceId(),
        bundleId: wxAppIdentify,
        tls: 1,
        "Content-Type": "application/json"
      };
      console.log("[CrashSight][Debug] request body json: " + JSON.stringify(body));
      wx.request({
        url: reportURL,
        method: 'POST',
        header: header,
        data: body,
        success: function success(res) {
          try {
            console.log("[CrashSight][Debug] response data: " + JSON.stringify(res.data));
          } catch (error) {
            console.log("[CrashSight][Error] " + error);
          }
          if (callback) {
            callback(null, res);
          }
        },
        fail: function fail(err) {
          try {
            console.log("[CrashSight][Error] network request faild: " + JSON.stringify(err));
          } catch (error) {
            console.log("[CrashSight][Error] " + error);
          }
          if (callback) {
            callback(err, null);
          }
        }
      });
    };
    var toBase64 = function toBase64(uint8Array) {
      var base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      var result = '';
      var i;
      for (i = 0; i < uint8Array.length - 2; i += 3) {
        var byte1 = uint8Array[i];
        var byte2 = uint8Array[i + 1];
        var byte3 = uint8Array[i + 2];
        var bits1 = byte1 >> 2;
        var bits2 = (byte1 & 0x3) << 4 | byte2 >> 4;
        var bits3 = (byte2 & 0xf) << 2 | byte3 >> 6;
        var bits4 = byte3 & 0x3f;
        result += base64Chars[bits1] + base64Chars[bits2] + base64Chars[bits3] + base64Chars[bits4];
      }
      var remaining = uint8Array.length % 3;
      if (remaining === 1) {
        var _byte = uint8Array[i];
        var _bits = _byte >> 2;
        var _bits2 = (_byte & 0x3) << 4;
        result += base64Chars[_bits] + base64Chars[_bits2] + '==';
      } else if (remaining === 2) {
        var _byte2 = uint8Array[i];
        var _byte3 = uint8Array[i + 1];
        var _bits3 = _byte2 >> 2;
        var _bits4 = (_byte2 & 0x3) << 4 | _byte3 >> 4;
        var _bits5 = (_byte3 & 0xf) << 2;
        result += base64Chars[_bits3] + base64Chars[_bits4] + base64Chars[_bits5] + '=';
      }
      return result;
    };
    var mergeInfo = {};
    var sendErrorMessage = /*#__PURE__*/function () {
      var _ref2 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(expName, msg, stack) {
        var exceptionUpload, deleteAfterUpload, saveFileName, hash, logAttach, logData, _i3, exceptionUploadPackage, body;
        return _regeneratorRuntime().wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              _context3.prev = 0;
              exceptionUpload = {};
              exceptionUpload.type = "107";
              exceptionUpload.expName = expName;
              exceptionUpload.expMessage = _typeof(msg) === 'object' ? JSON.stringify(msg) : msg;
              exceptionUpload.callStack = _typeof(stack) === 'object' ? JSON.stringify(stack) : stack;
              if (typeof exceptionUpload.expMessage === 'undefined') {
                exceptionUpload.expMessage = 'null';
              }
              if (typeof exceptionUpload.callStack === 'undefined') {
                exceptionUpload.callStack = 'null';
              }
              deleteAfterUpload = false;
              saveFileName = null;
              hash = undefined;
              if (!Number(serverStrategy['MG_KEY_MERGE_IMPROVE'])) {
                _context3.next = 26;
                break;
              }
              hash = md5Func(msg + stack);
              if (!mergeInfo[hash]) {
                _context3.next = 20;
                break;
              }
              mergeInfo[hash].count++;
              wx.setStorageSync('cs_merge_info', mergeInfo);
              console.log('[CrashSight] [Debug] merge not first hash: ' + hash + ', count: ' + mergeInfo[hash].count);
              return _context3.abrupt("return");
            case 20:
              saveFileName = 'cs_exception_' + new Date().getTime() + '_' + hash;
              mergeInfo[hash] = {
                count: 1
              };
              wx.setStorageSync('cs_merge_info', mergeInfo);
              console.log('[CrashSight] [Debug] merge fisrt hash: ' + hash + ', count: ' + mergeInfo[hash].count);
            case 24:
              _context3.next = 29;
              break;
            case 26:
              saveFileName = 'cs_none_merge_exception_' + new Date().getTime();
              deleteAfterUpload = true;
              console.log('[CrashSight] [Debug] not merge ');
            case 29:
              exceptionUpload.userId = userId;
              exceptionUpload.crashTime = new Date().getTime();
              exceptionUpload.expuid = generateUUID();
              exceptionUpload.deviceId = getDeviceId();
              exceptionUpload.valueMap = extKV || {};
              exceptionUpload.sessionId = sessionId;
              logAttach = {};
              logAttach.fileName = 'crashsightlog.gz';
              logAttach.type = 2;
              logData = '';
              for (_i3 = 0; _i3 < userLogs.length; _i3++) {
                logData += userLogs[_i3].str + '\n';
              }
              console.log('[CrashSight] [Debug] log is: ' + logData);
              logAttach.data = toBase64(gzipSync(strToU8(logData)));
              exceptionUpload.attaches = [logAttach];
              exceptionUploadPackage = {
                type: 107,
                deviceId: getDeviceId(),
                list: [exceptionUpload]
              };
              _context3.next = 46;
              return buildRequestJson(exceptionUploadPackage, errorReportCMD);
            case 46:
              body = _context3.sent;
              if (!saveFileName) {
                _context3.next = 51;
                break;
              }
              console.log('[CrashSight] [Debug] save file: ', saveFileName);
              _context3.next = 51;
              return fileManager.saveFile(saveFileName, JSON.stringify(body));
            case 51:
              sendHttp(body, errorReportCMD.toString(), /*#__PURE__*/function () {
                var _ref3 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(httpError) {
                  return _regeneratorRuntime().wrap(function _callee2$(_context2) {
                    while (1) switch (_context2.prev = _context2.next) {
                      case 0:
                        if (!(!httpError && deleteAfterUpload && saveFileName)) {
                          _context2.next = 4;
                          break;
                        }
                        _context2.next = 3;
                        return fileManager.removeFile(saveFileName);
                      case 3:
                        console.log('[CrashSight] [Event] upload not merger error message succeess, delete file:' + saveFileName);
                      case 4:
                      case "end":
                        return _context2.stop();
                    }
                  }, _callee2);
                }));
                return function (_x6) {
                  return _ref3.apply(this, arguments);
                };
              }());
              _context3.next = 57;
              break;
            case 54:
              _context3.prev = 54;
              _context3.t0 = _context3["catch"](0);
              console.log("[CrashSight][Error] " + _context3.t0);
            case 57:
            case "end":
              return _context3.stop();
          }
        }, _callee3, null, [[0, 54]]);
      }));
      return function sendErrorMessage(_x3, _x4, _x5) {
        return _ref2.apply(this, arguments);
      };
    }();
    var sendHistoryFile = /*#__PURE__*/function () {
      var _ref4 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee5(files) {
        var _loop, _i4;
        return _regeneratorRuntime().wrap(function _callee5$(_context6) {
          while (1) switch (_context6.prev = _context6.next) {
            case 0:
              console.log('[CrashSight] [Debug] history files:', files);
              if (files) {
                _context6.next = 3;
                break;
              }
              return _context6.abrupt("return");
            case 3:
              _loop = /*#__PURE__*/_regeneratorRuntime().mark(function _loop() {
                var fileName, isExceptionFile, isConnectionFile, content, uniPacket;
                return _regeneratorRuntime().wrap(function _loop$(_context5) {
                  while (1) switch (_context5.prev = _context5.next) {
                    case 0:
                      fileName = files[_i4];
                      isExceptionFile = fileName.startsWith('cs_none_merge_exception_');
                      isConnectionFile = fileName.startsWith('cs_connection_');
                      if (!(isExceptionFile || isConnectionFile)) {
                        _context5.next = 23;
                        break;
                      }
                      _context5.next = 6;
                      return fileManager.readFile(fileName);
                    case 6:
                      content = _context5.sent;
                      if (!(content !== undefined)) {
                        _context5.next = 21;
                        break;
                      }
                      _context5.prev = 8;
                      uniPacket = JSON.parse(content);
                      if (isExceptionFile) {
                        uniPacket.request.sBuffer.list[0].valueMap['A29'] = 1;
                      }
                      sendHttp(uniPacket, uniPacket.request.cmd.toString(), /*#__PURE__*/function () {
                        var _ref5 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee4(httpError, res) {
                          return _regeneratorRuntime().wrap(function _callee4$(_context4) {
                            while (1) switch (_context4.prev = _context4.next) {
                              case 0:
                                if (httpError) {
                                  _context4.next = 3;
                                  break;
                                }
                                _context4.next = 3;
                                return fileManager.removeFile(fileName);
                              case 3:
                              case "end":
                                return _context4.stop();
                            }
                          }, _callee4);
                        }));
                        return function (_x8, _x9) {
                          return _ref5.apply(this, arguments);
                        };
                      }());
                      _context5.next = 19;
                      break;
                    case 14:
                      _context5.prev = 14;
                      _context5.t0 = _context5["catch"](8);
                      console.log('[CrashSight][Error] sendHistoryErrorMessage JSON parse and merge file:', fileName, ', content: ', content, ', error: ', _context5.t0);
                      _context5.next = 19;
                      return fileManager.removeFile(fileName);
                    case 19:
                      _context5.next = 23;
                      break;
                    case 21:
                      _context5.next = 23;
                      return fileManager.removeFile(fileName);
                    case 23:
                    case "end":
                      return _context5.stop();
                  }
                }, _loop, null, [[8, 14]]);
              });
              _i4 = 0;
            case 5:
              if (!(_i4 < files.length)) {
                _context6.next = 10;
                break;
              }
              return _context6.delegateYield(_loop(), "t0", 7);
            case 7:
              _i4++;
              _context6.next = 5;
              break;
            case 10:
            case "end":
              return _context6.stop();
          }
        }, _callee5);
      }));
      return function sendHistoryFile(_x7) {
        return _ref4.apply(this, arguments);
      };
    }();
    var sendConnectInfo = /*#__PURE__*/function () {
      var _ref6 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee7(startType) {
        var summaryInfo, userInfoPackage, body, connectionFileName;
        return _regeneratorRuntime().wrap(function _callee7$(_context8) {
          while (1) switch (_context8.prev = _context8.next) {
            case 0:
              _context8.prev = 0;
              sessionId = generateUUID();
              summaryInfo = {};
              summaryInfo.startTime = new Date().getTime();
              summaryInfo.startType = startType;
              summaryInfo.userId = userId;
              summaryInfo.sessionId = sessionId;
              summaryInfo.coldStartup = startType == coldStartup;
              userInfoPackage = {
                type: startType,
                deviceId: getDeviceId(),
                list: [summaryInfo]
              };
              _context8.next = 11;
              return buildRequestJson(userInfoPackage, connnetReportCDM);
            case 11:
              body = _context8.sent;
              connectionFileName = 'cs_connection_' + +new Date().getTime();
              _context8.next = 15;
              return fileManager.saveFile(connectionFileName, JSON.stringify(body));
            case 15:
              sendHttp(body, connnetReportCDM.toString(), /*#__PURE__*/function () {
                var _ref7 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee6(httpError, res) {
                  var buffer;
                  return _regeneratorRuntime().wrap(function _callee6$(_context7) {
                    while (1) switch (_context7.prev = _context7.next) {
                      case 0:
                        if (!httpError) {
                          _context7.next = 2;
                          break;
                        }
                        return _context7.abrupt("return");
                      case 2:
                        _context7.next = 4;
                        return fileManager.removeFile(connectionFileName);
                      case 4:
                        try {
                          if (res.data) {
                            if (res.data.cmd == 510) {
                              buffer = res.data.sBuffer;
                              try {
                                wx.setStorageSync(localStrategyKey, buffer.enable ? StrategyEnableState.Enable : StrategyEnableState.Disable);
                              } catch (error) {
                                console.log("[CrashSight][Error] wx.setStorageSync set local strategy error:" + error);
                              }
                              if (buffer.enable) {
                                if (hasInitCrashSight) {
                                  if (!hasMergeExcepionFile) {
                                    if (buffer.valueMap && _typeof(buffer.valueMap) === 'object') {
                                      serverStrategy = buffer.valueMap;
                                    }
                                    console.log('[CrashSight][Info] serverStrategy: ', serverStrategy);
                                    mergeExcepionFile();
                                    hasMergeExcepionFile = true;
                                  }
                                  if (strategyEnableState != StrategyEnableState.Enable) {
                                    strategyEnableState = StrategyEnableState.Enable;
                                    registerErrorCallback();
                                    console.log("[CrashSight][Info] CrashSight receve enable from server");
                                  }
                                }
                              } else {
                                if (strategyEnableState != StrategyEnableState.Disable) {
                                  strategyEnableState = StrategyEnableState.Disable;
                                  unregisterErrorCallback();
                                  console.log("[CrashSight][Error] CrashSight receve disable from server");
                                }
                              }
                            }
                          }
                        } catch (error) {
                          console.log("[CrashSight][Error] " + error);
                        }
                      case 5:
                      case "end":
                        return _context7.stop();
                    }
                  }, _callee6);
                }));
                return function (_x1, _x10) {
                  return _ref7.apply(this, arguments);
                };
              }());
              _context8.next = 21;
              break;
            case 18:
              _context8.prev = 18;
              _context8.t0 = _context8["catch"](0);
              console.log("[CrashSight][Error] " + _context8.t0);
            case 21:
            case "end":
              return _context8.stop();
          }
        }, _callee7, null, [[0, 18]]);
      }));
      return function sendConnectInfo(_x0) {
        return _ref6.apply(this, arguments);
      };
    }();
    var jsErrorHandler = function jsErrorHandler(message, stack) {
      if (strategyEnableState == StrategyEnableState.Enable) {
        if (_typeof(message) === 'object') {
          sendErrorMessage('JavaScript Error (wx.onError)', message.message, message.stack);
        } else {
          sendErrorMessage('JavaScript Error (wx.onError)', message, stack);
        }
      }
    };
    var pageNotFoundHandler = function pageNotFoundHandler(result) {
      if (strategyEnableState == StrategyEnableState.Enable) {
        sendErrorMessage('WX Page Not Found Error', JSON.stringify(result), null);
      }
    };
    var unhandledRejectionHandler = function unhandledRejectionHandler(result) {
      if (strategyEnableState == StrategyEnableState.Enable) {
        var message = 'unkonw';
        var stack = '';
        if (result) {
          if (typeof result.reason === 'string') {
            message = result.reason;
          } else if (_typeof(result.reason) === 'object') {
            message = result.reason.message;
            stack = result.reason.stack;
          }
        }
        sendErrorMessage('Unhandle Rejection Promise Error', message, stack);
      }
    };
    var registerConsoleErrorHanler = function registerConsoleErrorHanler() {
      if (hasHookConsoleError) {
        return;
      }
      console.log('[CrashSight][Info] register console.error');
      var oldConsoleError = console.error;
      Object.defineProperty(console, 'error', {
        value: function value() {
          if (strategyEnableState == StrategyEnableState.Enable) {
            if (arguments[0] && arguments[0].stack) {
              var message = arguments[0].message;
              var stack = arguments[0].stack;
              sendErrorMessage('JavaScript Error(console.error)', message, stack);
            }
          }
          oldConsoleError.apply(console, arguments);
        },
        writable: true,
        configurable: true
      });
      hasHookConsoleError = true;
    };
    var fileManager = {
      init: function init() {
        if (this.inited === true) {
          return true;
        }
        var fs = wx.getFileSystemManager();
        try {
          fs.accessSync("".concat(wx.env.USER_DATA_PATH, "/CrashSight"));
        } catch (e) {
          try {
            fs.mkdirSync("".concat(wx.env.USER_DATA_PATH, "/CrashSight"));
          } catch (e) {
            console.log('[CrashSight][Error] mkdir faild: ' + e);
            return false;
          }
        }
        this.inited == true;
        return true;
      },
      files: function files() {
        if (!this.inited) {
          if (!this.init()) {
            console.log('[CrashSight][Error] get files init fileManager error');
            return [];
          }
        }
        var files = [];
        try {
          var fs = wx.getFileSystemManager();
          files = fs.readdirSync("".concat(wx.env.USER_DATA_PATH, "/CrashSight"));
        } catch (e) {
          console.log('[CrashSight][Error] readdirSync faild: ' + e);
        }
        return files;
      },
      removeFile: function removeFile(fileName) {
        if (!this.inited) {
          if (!this.init()) {
            console.log('[CrashSight][Error] removeFile init fileManager error');
            return [];
          }
        }
        return new Promise(function (resolve, reject) {
          var fs = wx.getFileSystemManager();
          fs.unlink({
            filePath: "".concat(wx.env.USER_DATA_PATH, "/CrashSight/").concat(fileName),
            success: function success(res) {
              resolve(true);
            },
            fail: function fail(err) {
              console.log('[Perfsight] [Error] remove file error: ', err);
              resolve(false);
            }
          });
        });
      },
      saveFile: function saveFile(fileName, data) {
        if (!this.inited) {
          if (!this.init()) {
            console.log('[CrashSight][Error] saveFile init fileManager error');
            return [];
          }
        }
        return new Promise(function (resolve, reject) {
          var fs = wx.getFileSystemManager();
          fs.writeFile({
            filePath: "".concat(wx.env.USER_DATA_PATH, "/CrashSight/").concat(fileName),
            encoding: 'utf8',
            data: data,
            success: function success() {
              resolve(true);
            },
            fail: function fail(err) {
              console.log('[Perfsight] [Error] saveFile init fileManager error: ', err);
              resolve(false);
            }
          });
        });
      },
      readFile: function readFile(fileName) {
        if (!this.inited) {
          if (!this.init()) {
            console.log('[CrashSight][Error] readFile init fileManager error');
            return [];
          }
        }
        return new Promise(function (resolve, reject) {
          var fs = wx.getFileSystemManager();
          fs.readFile({
            filePath: "".concat(wx.env.USER_DATA_PATH, "/CrashSight/").concat(fileName),
            encoding: 'utf8',
            success: function success(res) {
              resolve(res.data);
            },
            fail: function fail(err) {
              console.log('[Perfsight] [Error] readFile error: ', err);
              resolve(undefined);
            }
          });
        });
      }
    };
    var mergeExcepionFile = /*#__PURE__*/function () {
      var _ref8 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee9() {
        var mergeInfo, files, _loop2, _ret, _i5;
        return _regeneratorRuntime().wrap(function _callee9$(_context1) {
          while (1) switch (_context1.prev = _context1.next) {
            case 0:
              mergeInfo = wx.getStorageSync('cs_merge_info');
              wx.setStorageSync('cs_merge_info', {});
              if (!mergeInfo) {
                mergeInfo = {};
              }
              files = fileManager.files();
              console.log('[CrashSight] [Debug] mergeInfo:', mergeInfo);
              console.log('[CrashSight] [Debug] merge files:', files);
              if (files) {
                _context1.next = 8;
                break;
              }
              return _context1.abrupt("return");
            case 8:
              _loop2 = /*#__PURE__*/_regeneratorRuntime().mark(function _loop2() {
                var fileName, matchResult, hash, info, content, uniPacket;
                return _regeneratorRuntime().wrap(function _loop2$(_context0) {
                  while (1) switch (_context0.prev = _context0.next) {
                    case 0:
                      fileName = files[_i5];
                      if (!fileName.startsWith('cs_exception_')) {
                        _context0.next = 37;
                        break;
                      }
                      matchResult = fileName.match(/([a-zA-Z0-9-]+)$/);
                      hash = undefined;
                      if (!(matchResult && matchResult.length > 0)) {
                        _context0.next = 8;
                        break;
                      }
                      hash = matchResult[0];
                      _context0.next = 11;
                      break;
                    case 8:
                      _context0.next = 10;
                      return fileManager.removeFile(fileName);
                    case 10:
                      return _context0.abrupt("return", 0);
                    case 11:
                      info = mergeInfo[hash];
                      if (!(info && info.count > 1)) {
                        _context0.next = 34;
                        break;
                      }
                      _context0.next = 15;
                      return fileManager.readFile(fileName);
                    case 15:
                      content = _context0.sent;
                      if (!(content !== undefined)) {
                        _context0.next = 31;
                        break;
                      }
                      _context0.prev = 17;
                      uniPacket = JSON.parse(content);
                      uniPacket.request.sBuffer.list[0].crashCount = info.count - 2;
                      sendHttp(uniPacket, uniPacket.request.cmd.toString(), /*#__PURE__*/function () {
                        var _ref9 = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee8(httpError, res) {
                          return _regeneratorRuntime().wrap(function _callee8$(_context9) {
                            while (1) switch (_context9.prev = _context9.next) {
                              case 0:
                                if (httpError) {
                                  _context9.next = 3;
                                  break;
                                }
                                _context9.next = 3;
                                return fileManager.removeFile(fileName);
                              case 3:
                              case "end":
                                return _context9.stop();
                            }
                          }, _callee8);
                        }));
                        return function (_x11, _x12) {
                          return _ref9.apply(this, arguments);
                        };
                      }());
                      _context0.next = 29;
                      break;
                    case 23:
                      _context0.prev = 23;
                      _context0.t0 = _context0["catch"](17);
                      console.log('[CrashSight][Error] JSON parse and merge file:', fileName, ', content: ', content, ', error: ', _context0.t0);
                      _context0.next = 28;
                      return fileManager.removeFile(fileName);
                    case 28:
                      return _context0.abrupt("return", 0);
                    case 29:
                      _context0.next = 32;
                      break;
                    case 31:
                      return _context0.abrupt("return", 0);
                    case 32:
                      _context0.next = 37;
                      break;
                    case 34:
                      _context0.next = 36;
                      return fileManager.removeFile(fileName);
                    case 36:
                      return _context0.abrupt("return", 0);
                    case 37:
                    case "end":
                      return _context0.stop();
                  }
                }, _loop2, null, [[17, 23]]);
              });
              _i5 = 0;
            case 10:
              if (!(_i5 < files.length)) {
                _context1.next = 18;
                break;
              }
              return _context1.delegateYield(_loop2(), "t0", 12);
            case 12:
              _ret = _context1.t0;
              if (!(_ret === 0)) {
                _context1.next = 15;
                break;
              }
              return _context1.abrupt("continue", 15);
            case 15:
              _i5++;
              _context1.next = 10;
              break;
            case 18:
            case "end":
              return _context1.stop();
          }
        }, _callee9);
      }));
      return function mergeExcepionFile() {
        return _ref8.apply(this, arguments);
      };
    }();
    var registerErrorCallback = function registerErrorCallback() {
      if (hasRegisterErrorCallback) {
        console.log('[CrashSight][Warning] repeated call hasRegisterErrorCallback');
        return;
      }
      if (wx.onError) {
        console.log('[CrashSight][Info] register wx.onError');
        wx.onError(jsErrorHandler);
      } else {
        console.log('[CrashSight][Warning] no wx.onError function');
      }
      registerConsoleErrorHanler();
      if (wx.onPageNotFound) {
        console.log('[CrashSight][Info] register wx.onPageNotFound');
        wx.onPageNotFound(pageNotFoundHandler);
      } else {
        console.log('[CrashSight][Warning] no wx.onPageNotFound function');
      }
      if (wx.onUnhandledRejection) {
        console.log('[CrashSight][Info] register wx.onUnhandledRejection');
        wx.onUnhandledRejection(unhandledRejectionHandler);
      } else {
        console.log('[CrashSight][Warning] no wx.onUnhandledRejection function');
      }
      hasRegisterErrorCallback = true;
    };
    var unregisterErrorCallback = function unregisterErrorCallback() {
      if (!hasRegisterErrorCallback) {
        console.log('[CrashSight][Warning] repeated call unregisterErrorCallback');
        return;
      }
      if (wx.offError) {
        console.log('[CrashSight][Info] unregister wx.onError');
        wx.offError(jsErrorHandler);
      }
      if (wx.offPageNotFound) {
        console.log('[CrashSight][Info] unregister wx.onPageNotFound');
        wx.offPageNotFound(pageNotFoundHandler);
      }
      if (wx.offUnhandledRejection) {
        console.log('[CrashSight][Info] unregister wx.onUnhandledRejection');
        wx.offUnhandledRejection(unhandledRejectionHandler);
      }
      hasRegisterErrorCallback = false;
    };
    var crashSight = {
      start: function start(_appId, _reportURL) {
        if (hasInitCrashSight) {
          console.log('[CrashSight][Warning] CrashSight has started');
          return;
        }
        if (!_appId) {
          console.log("[CrashSight][Error] appid is null");
          return;
        }
        var startBeginTime = new Date().getTime();
        appId = _appId;
        if (_reportURL) {
          reportURL = _reportURL;
        }
        try {
          strategyEnableState = wx.getStorageSync(localStrategyKey);
          console.log('[CrashSight][Debug] local strategy enable: ' + (strategyEnableState === StrategyEnableState.Enable));
          if (strategyEnableState === undefined || strategyEnableState === null || strategyEnableState === '') {
            strategyEnableState = StrategyEnableState.Enable;
          }
        } catch (error) {
          console.log('[CrashSight][Error] wx.getStorageSync get local strategy error:' + error);
          strategyEnableState = StrategyEnableState.Enable;
        }
        var historyFiles = [];
        if (strategyEnableState != StrategyEnableState.Disable) {
          historyFiles = fileManager.files();
        }
        sendConnectInfo(coldStartup);
        if (strategyEnableState != StrategyEnableState.Disable) {
          registerErrorCallback();
          sendHistoryFile(historyFiles);
        }
        hasInitCrashSight = true;
        globalThis.__crashSight.startCostTime = new Date().getTime() - startBeginTime;
        console.log('[CrashSight][INFO] CrashSight start success in ', globalThis.__crashSight.startCostTime, 'ms, waiting for enable form server...');
      },
      stop: function stop() {
        if (!hasInitCrashSight) {
          console.log('[CrashSight][Error] CrashSight has not started');
          return;
        }
        unregisterErrorCallback();
        hasInitCrashSight = false;
        strategyEnableState = StrategyEnableState.Unknow;
        console.log('[CrashSight][INFO] CrashSight stop success');
      },
      setUserId: function setUserId(_userId) {
        userId = _userId;
      },
      setExtKV: function setExtKV(key, value) {
        if (key) {
          extKV['C03_' + key] = value;
        }
      },
      clearExtKV: function clearExtKV() {
        extKV = {};
      },
      printLog: function printLog(level, log) {
        if (!log || level == 0 || level > logLevel) {
          return;
        }
        var timestamp = new Date().toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).replace(/(\d+)\/(\d+)/, '$1-$2').replace(/\//g, ':');
        var levelStr = {
          1: "E",
          2: "W",
          3: "I",
          4: "D",
          5: "V"
        }[level] || "";
        var fullLog = "".concat(timestamp, " ").concat(levelStr, " ").concat(log);
        var encoder = new TextEncoder();
        var byteSize = encoder.encode(fullLog).byteLength;
        if (byteSize > logMaxLength) {
          return;
        }
        console.log('[CrashSight][Debug] print log: ' + fullLog);
        userLogs.push({
          str: fullLog,
          size: byteSize
        });
        logLength += byteSize;
        while (logLength > logMaxLength) {
          var removed = userLogs.shift();
          logLength -= removed.size;
        }
      },
      configLogLevel: function configLogLevel(level) {
        if (level >= 0 && level < 6) {
          logLevel = level;
        }
      },
      setAppVersion: function setAppVersion(_appVersion) {
        appVersion = _appVersion;
      },
      setWXAppIdentify: function setWXAppIdentify(_wxAppIdentify) {
        wxAppIdentify = _wxAppIdentify;
      },
      reportException: function () {
        var _reportException = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee0(exceptionName, message, stack) {
          return _regeneratorRuntime().wrap(function _callee0$(_context10) {
            while (1) switch (_context10.prev = _context10.next) {
              case 0:
                if (hasInitCrashSight) {
                  _context10.next = 3;
                  break;
                }
                console.log('[CrashSight][Error] CrashSight has not started');
                return _context10.abrupt("return");
              case 3:
                if (!(strategyEnableState == StrategyEnableState.Disable)) {
                  _context10.next = 6;
                  break;
                }
                console.log('[CrashSight][Error] CrashSight has disable by server');
                return _context10.abrupt("return");
              case 6:
                sendErrorMessage(exceptionName, message, stack);
              case 7:
              case "end":
                return _context10.stop();
            }
          }, _callee0);
        }));
        function reportException(_x13, _x14, _x15) {
          return _reportException.apply(this, arguments);
        }
        return reportException;
      }()
    };
    globalThis.__crashSight = crashSight;

    // ========================== CrashSgiht Core End===============================
  },
  CS_Start: function CS_Start(appId, reportURL) {
    if (globalThis.__crashSight && appId) {
      if (typeof globalThis.unityVersion !== 'undefined') {
        appId = UTF8ToString(appId);
        reportURL = reportURL ? UTF8ToString(reportURL) : undefined;
      }
      globalThis.__crashSight.start(appId, reportURL);
    }
  },
  CS_Stop: function CS_Stop() {
    if (globalThis.__crashSight) {
      globalThis.__crashSight.stop();
    }
  },
  CS_SetUserId: function CS_SetUserId(userId) {
    if (globalThis.__crashSight && userId) {
      if (typeof globalThis.unityVersion !== 'undefined') {
        userId = UTF8ToString(userId);
      }
      globalThis.__crashSight.setUserId(userId);
    }
  },
  CS_SetExtKV: function CS_SetExtKV(key, value) {
    if (globalThis.__crashSight && key) {
      if (typeof globalThis.unityVersion !== 'undefined') {
        key = UTF8ToString(key);
        if (value) {
          value = UTF8ToString(value);
        } else {
          value = undefined;
        }
      }
      globalThis.__crashSight.setExtKV(key, value);
    }
  },
  CS_ClearExtKV: function CS_ClearExtKV() {
    if (globalThis.__crashSight) {
      globalThis.__crashSight.clearExtKV();
    }
  },
  CS_SetAppVersion: function CS_SetAppVersion(appVersion) {
    if (globalThis.__crashSight && appVersion) {
      if (typeof globalThis.unityVersion !== 'undefined') {
        appVersion = UTF8ToString(appVersion);
      }
      globalThis.__crashSight.setAppVersion(appVersion);
    }
  },
  CS_SetWXAppIdentify: function CS_SetWXAppIdentify(wxAppIdentify) {
    if (globalThis.__crashSight && wxAppIdentify) {
      if (typeof globalThis.unityVersion !== 'undefined') {
        wxAppIdentify = UTF8ToString(wxAppIdentify);
      }
      globalThis.__crashSight.setWXAppIdentify(wxAppIdentify);
    }
  },
  CS_ReportException: function CS_ReportException(exceptionName, message, stack) {
    console.log("crashSight CS_ReportException");
    if (globalThis.__crashSight) {
      if (typeof globalThis.unityVersion !== 'undefined') {
        exceptionName = exceptionName ? UTF8ToString(exceptionName) : 'null';
        message = message ? UTF8ToString(message) : 'null';
        stack = stack ? UTF8ToString(stack) : 'null';
      }
      if (typeof message === 'undefined') {
        message = 'null';
      }
      if (typeof stack === 'undefined') {
        stack = 'null';
      }
      globalThis.__crashSight.reportException(exceptionName, message, stack);
    }
  },
  CS_JSBacktrace: function CS_JSBacktrace(skipCount, excludeFilter, limitCount) {
    var errObjForBacktrace = new Error();
    var backtrace = errObjForBacktrace.stack;
    if (typeof backtrace == 'string') {
      var lines = backtrace.split('\n');
      var resultLines = lines.length > skipCount ? lines.slice(skipCount) : lines;
      excludeFilter = excludeFilter ? UTF8ToString(excludeFilter) : null;
      if (excludeFilter && resultLines && resultLines.length > 0) {
        var tmep = [];
        var filters = excludeFilter.split('|');
        for (var i = 0; i < resultLines.length; i++) {
          var line = resultLines[i];
          var except = false;
          for (var j = 0; j < filters.length; j++) {
            var filter = filters[j];
            if (line.indexOf(filter) != -1) {
              except = true;
              break;
            }
          }
          if (!except) {
            tmep.push(line);
          }
        }
        resultLines = tmep;
      }
      if (limitCount > 0 && resultLines && resultLines.length > limitCount) {
        resultLines = resultLines.splice(0, limitCount);
      }
      var resultStr = resultLines.join('\n');
      if (resultStr.endsWith('\n')) {
        resultStr = resultStr.slice(0, -1);
      }
      var bufferSize = lengthBytesUTF8(resultStr) + 1;
      var buffer = _malloc(bufferSize);
      stringToUTF8(resultStr, buffer, bufferSize);
      return buffer;
    } else {
      return null;
    }
  },
  CS_PrintLog: function CS_PrintLog(level, message) {
    if (globalThis.__crashSight && message) {
      if (typeof globalThis.unityVersion !== 'undefined') {
        message = UTF8ToString(message);
      }
      globalThis.__crashSight.printLog(level, message);
    }
  },
  CS_ConfigLogLevel: function CS_ConfigLogLevel(level) {
    if (globalThis.__crashSight) {
      globalThis.__crashSight.configLogLevel(level);
    }
  }
});
