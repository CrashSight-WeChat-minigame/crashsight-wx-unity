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
    function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() { } function GeneratorFunction() { } function GeneratorFunctionPrototype() { } var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a; ;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg; else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
    function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
    function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }


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

    // ========================== MD5 Core Begin===============================

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
    var sdkVersion = '1.3.0';
    var errorReportCMD = 930;
    var connnetReportCDM = 940;
    var coldStartup = 1;
    var hotStartup = 2;
    var localStrategyKey = 'crashsight_local_strategy';
    var appId = '';
    var sessionId = '';
    var userId = '';
    var extKV = {};
    var _deviceId = null;
    var appVersion = "0.0.0";
    var wxAppIdentify = "none";
    var reportURL = 'https://minigame.crashsight.qq.com/rqd/pb/sync';
    var generateUUID = function generateUUID() {
      var uuid = '';
      for (var i = 0; i < 32; i++) {
        var random = Math.random() * 16 | 0;
        if (i === 8 || i === 12 || i === 16 || i === 20) {
          uuid += '-';
        }
        uuid += (i === 12 ? 4 : i === 16 ? random & 3 | 8 : random).toString(16);
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
      var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(obj, cmd) {
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
    var mergeInfo = {};
    var sendErrorMessage = /*#__PURE__*/function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(expName, msg, stack) {
        var exceptionUpload, deleteAfterUpload, saveFileName, hash, exceptionUploadPackage, body;
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
              exceptionUploadPackage = {
                type: 107,
                deviceId: getDeviceId(),
                list: [exceptionUpload]
              };
              _context3.next = 38;
              return buildRequestJson(exceptionUploadPackage, errorReportCMD);
            case 38:
              body = _context3.sent;
              if (!saveFileName) {
                _context3.next = 43;
                break;
              }
              console.log('[CrashSight] [Debug] save file: ', saveFileName);
              _context3.next = 43;
              return fileManager.saveFile(saveFileName, JSON.stringify(body));
            case 43:
              sendHttp(body, errorReportCMD.toString(), /*#__PURE__*/function () {
                var _ref3 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(httpError) {
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
              _context3.next = 49;
              break;
            case 46:
              _context3.prev = 46;
              _context3.t0 = _context3["catch"](0);
              console.log("[CrashSight][Error] " + _context3.t0);
            case 49:
            case "end":
              return _context3.stop();
          }
        }, _callee3, null, [[0, 46]]);
      }));
      return function sendErrorMessage(_x3, _x4, _x5) {
        return _ref2.apply(this, arguments);
      };
    }();
    var sendHistoryFile = /*#__PURE__*/function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee5(files) {
        var _loop, i;
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
                      fileName = files[i];
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
                        var _ref5 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee4(httpError, res) {
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
              i = 0;
            case 5:
              if (!(i < files.length)) {
                _context6.next = 10;
                break;
              }
              return _context6.delegateYield(_loop(), "t0", 7);
            case 7:
              i++;
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
      var _ref6 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee7(startType) {
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
                var _ref7 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee6(httpError, res) {
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
                return function (_x11, _x12) {
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
      return function sendConnectInfo(_x10) {
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
      var _ref8 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee9() {
        var mergeInfo, files, _loop2, _ret, i;
        return _regeneratorRuntime().wrap(function _callee9$(_context11) {
          while (1) switch (_context11.prev = _context11.next) {
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
                _context11.next = 8;
                break;
              }
              return _context11.abrupt("return");
            case 8:
              _loop2 = /*#__PURE__*/_regeneratorRuntime().mark(function _loop2() {
                var fileName, matchResult, hash, info, content, uniPacket;
                return _regeneratorRuntime().wrap(function _loop2$(_context10) {
                  while (1) switch (_context10.prev = _context10.next) {
                    case 0:
                      fileName = files[i];
                      if (!fileName.startsWith('cs_exception_')) {
                        _context10.next = 37;
                        break;
                      }
                      matchResult = fileName.match(/([a-zA-Z0-9-]+)$/);
                      hash = undefined;
                      if (!(matchResult && matchResult.length > 0)) {
                        _context10.next = 8;
                        break;
                      }
                      hash = matchResult[0];
                      _context10.next = 11;
                      break;
                    case 8:
                      _context10.next = 10;
                      return fileManager.removeFile(fileName);
                    case 10:
                      return _context10.abrupt("return", 0);
                    case 11:
                      info = mergeInfo[hash];
                      if (!(info && info.count > 1)) {
                        _context10.next = 34;
                        break;
                      }
                      _context10.next = 15;
                      return fileManager.readFile(fileName);
                    case 15:
                      content = _context10.sent;
                      if (!(content !== undefined)) {
                        _context10.next = 31;
                        break;
                      }
                      _context10.prev = 17;
                      uniPacket = JSON.parse(content);
                      uniPacket.request.sBuffer.list[0].crashCount = info.count - 2;
                      sendHttp(uniPacket, uniPacket.request.cmd.toString(), /*#__PURE__*/function () {
                        var _ref9 = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee8(httpError, res) {
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
                        return function (_x13, _x14) {
                          return _ref9.apply(this, arguments);
                        };
                      }());
                      _context10.next = 29;
                      break;
                    case 23:
                      _context10.prev = 23;
                      _context10.t0 = _context10["catch"](17);
                      console.log('[CrashSight][Error] JSON parse and merge file:', fileName, ', content: ', content, ', error: ', _context10.t0);
                      _context10.next = 28;
                      return fileManager.removeFile(fileName);
                    case 28:
                      return _context10.abrupt("return", 0);
                    case 29:
                      _context10.next = 32;
                      break;
                    case 31:
                      return _context10.abrupt("return", 0);
                    case 32:
                      _context10.next = 37;
                      break;
                    case 34:
                      _context10.next = 36;
                      return fileManager.removeFile(fileName);
                    case 36:
                      return _context10.abrupt("return", 0);
                    case 37:
                    case "end":
                      return _context10.stop();
                  }
                }, _loop2, null, [[17, 23]]);
              });
              i = 0;
            case 10:
              if (!(i < files.length)) {
                _context11.next = 18;
                break;
              }
              return _context11.delegateYield(_loop2(), "t0", 12);
            case 12:
              _ret = _context11.t0;
              if (!(_ret === 0)) {
                _context11.next = 15;
                break;
              }
              return _context11.abrupt("continue", 15);
            case 15:
              i++;
              _context11.next = 10;
              break;
            case 18:
            case "end":
              return _context11.stop();
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
          extKV[key] = value;
        }
      },
      clearExtKV: function clearExtKV() {
        extKV = {};
      },
      setAppVersion: function setAppVersion(_appVersion) {
        appVersion = _appVersion;
      },
      setWXAppIdentify: function setWXAppIdentify(_wxAppIdentify) {
        wxAppIdentify = _wxAppIdentify;
      },
      reportException: function () {
        var _reportException = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee10(exceptionName, message, stack) {
          return _regeneratorRuntime().wrap(function _callee10$(_context12) {
            while (1) switch (_context12.prev = _context12.next) {
              case 0:
                if (hasInitCrashSight) {
                  _context12.next = 3;
                  break;
                }
                console.log('[CrashSight][Error] CrashSight has not started');
                return _context12.abrupt("return");
              case 3:
                if (!(strategyEnableState == StrategyEnableState.Disable)) {
                  _context12.next = 6;
                  break;
                }
                console.log('[CrashSight][Error] CrashSight has disable by server');
                return _context12.abrupt("return");
              case 6:
                sendErrorMessage(exceptionName, message, stack);
              case 7:
              case "end":
                return _context12.stop();
            }
          }, _callee10);
        }));
        function reportException(_x15, _x16, _x17) {
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
  }
});
