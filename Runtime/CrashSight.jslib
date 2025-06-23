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

    // ========================== MD5 Core Begin===============================
    function safeAdd(x, y) {
      var lsw = (x & 0xffff) + (y & 0xffff);
      var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
      return msw << 16 | lsw & 0xffff;
    }
    function bitRotateLeft(num, cnt) {
      return num << cnt | num >>> 32 - cnt;
    }
    function md5cmn(q, a, b, x, s, t) {
      return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
    }
    function md5ff(a, b, c, d, x, s, t) {
      return md5cmn(b & c | ~b & d, a, b, x, s, t);
    }
    function md5gg(a, b, c, d, x, s, t) {
      return md5cmn(b & d | c & ~d, a, b, x, s, t);
    }
    function md5hh(a, b, c, d, x, s, t) {
      return md5cmn(b ^ c ^ d, a, b, x, s, t);
    }
    function md5ii(a, b, c, d, x, s, t) {
      return md5cmn(c ^ (b | ~d), a, b, x, s, t);
    }
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
    function binl2rstr(input) {
      var i;
      var output = '';
      var length32 = input.length * 32;
      for (i = 0; i < length32; i += 8) {
        output += String.fromCharCode(input[i >> 5] >>> i % 32 & 0xff);
      }
      return output;
    }
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
    function rstrMD5(s) {
      return binl2rstr(binlMD5(rstr2binl(s), s.length * 8));
    }
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
    function str2rstrUTF8(input) {
      return unescape(encodeURIComponent(input));
    }
    function rawMD5(s) {
      return rstrMD5(str2rstrUTF8(s));
    }
    function hexMD5(s) {
      return rstr2hex(rawMD5(s));
    }
    function md5Func(string) {
      return hexMD5(string);
    }

    // ========================== fflate Core Begin===============================
    var u8 = Uint8Array,
      u16 = Uint16Array,
      i32 = Int32Array;
    var fleb = new u8([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, /* unused */0, 0, /* impossible */0]);
    var fdeb = new u8([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, /* unused */0, 0]);
    var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
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
    fl[28] = 258, revfl[258] = 28;
    var _b = freb(fdeb, 0),
      fd = _b.b,
      revfd = _b.r;
    var rev = new u16(32768);
    for (var i = 0; i < 32768; ++i) {
      // reverse table algorithm from SO
      var x = (i & 0xAAAA) >> 1 | (i & 0x5555) << 1;
      x = (x & 0xCCCC) >> 2 | (x & 0x3333) << 2;
      x = (x & 0xF0F0) >> 4 | (x & 0x0F0F) << 4;
      rev[i] = ((x & 0xFF00) >> 8 | (x & 0x00FF) << 8) >> 1;
    }
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
    var flt = new u8(288);
    for (var i = 0; i < 144; ++i) flt[i] = 8;
    for (var i = 144; i < 256; ++i) flt[i] = 9;
    for (var i = 256; i < 280; ++i) flt[i] = 7;
    for (var i = 280; i < 288; ++i) flt[i] = 8;
    var fdt = new u8(32);
    for (var i = 0; i < 32; ++i) fdt[i] = 5;
    var flm = /*#__PURE__*/hMap(flt, 9, 0),
      flrm = /*#__PURE__*/hMap(flt, 9, 1);
    var fdm = /*#__PURE__*/hMap(fdt, 5, 0),
      fdrm = /*#__PURE__*/hMap(fdt, 5, 1);
    var shft = function shft(p) {
      return (p + 7) / 8 | 0;
    };
    var slc = function slc(v, s, e) {
      if (s == null || s < 0) s = 0;
      if (e == null || e > v.length) e = v.length;
      // can't use .constructor in case user-supplied
      return new u8(v.subarray(s, e));
    };
    var _err = function err(ind, msg, nt) {
      var e = new Error(msg || ec[ind]);
      e.code = ind;
      if (Error.captureStackTrace) Error.captureStackTrace(e, _err);
      if (!nt) throw e;
      return e;
    };
    var wbits = function wbits(d, p, v) {
      v <<= p & 7;
      var o = p / 8 | 0;
      d[o] |= v;
      d[o + 1] |= v >> 8;
    };
    var wbits16 = function wbits16(d, p, v) {
      v <<= p & 7;
      var o = p / 8 | 0;
      d[o] |= v;
      d[o + 1] |= v >> 8;
      d[o + 2] |= v >> 16;
    };
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
    var _ln = function ln(n, l, d) {
      return n.s == -1 ? Math.max(_ln(n.l, l, d + 1), _ln(n.r, l, d + 1)) : l[n.s] = d;
    };
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
    var clen = function clen(cf, cl) {
      var l = 0;
      for (var i = 0; i < cl.length; ++i) l += cf[i] * cl[i];
      return l;
    };
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
    var wblk = function wblk(dat, out, _final, syms, lf, df, eb, li, bs, bl, p) {
      wbits(out, p++, _final);
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
    var deo = /*#__PURE__*/new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
    var et = /*#__PURE__*/new u8(0);
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
    var wbytes = function wbytes(d, b, v) {
      for (; v; ++b) d[b] = v, v >>>= 8;
    };
    var gzh = function gzh(c, o) {
      var fn = o.filename;
      c[0] = 31, c[1] = 139, c[2] = 8, c[8] = o.level < 2 ? 4 : o.level == 9 ? 2 : 0, c[9] = 3; // assume Unix
      if (o.mtime != 0) wbytes(c, 4, Math.floor(new Date(o.mtime || Date.now()) / 1000));
      if (fn) {
        c[3] = 8;
        for (var i = 0; i <= fn.length; ++i) c[i + 10] = fn.charCodeAt(i);
      }
    };
    var gzhl = function gzhl(o) {
      return 10 + (o.filename ? o.filename.length + 1 : 0);
    };
    function gzipSync(data, opts) {
      if (!opts) opts = {};
      var c = crc(),
        l = data.length;
      c.p(data);
      var d = dopt(data, opts, gzhl(opts), 8),
        s = d.length;
      return gzh(d, opts), wbytes(d, s - 8, c.d()), wbytes(d, s - 4, l), d;
    }
    var te = typeof TextEncoder != 'undefined' && /*#__PURE__*/new TextEncoder();
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
    var sdkVersion = '1.4';
    var errorReportCMD = 930;
    var connnetReportCDM = 940;
    var coldStartup = 1;
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
      for (var _i = 0; _i < 32; _i++) {
        var random = Math.random() * 16 | 0;
        if (_i === 8 || _i === 12 || _i === 16 || _i === 20) {
          uuid += '-';
        }
        uuid += (_i === 12 ? 4 : _i === 16 ? random & 3 | 8 : random).toString(16);
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
    var buildRequestJson = function buildRequestJson(obj, cmd) {
      return new Promise(function (resolve) {
        wx.getNetworkType().then(function (ret) {
          var deviceInfo = {};
          try {
            deviceInfo = wx.getDeviceInfo();
          } catch (error) {
            deviceInfo['system'] = 'unknow';
            deviceInfo['model'] = 'unknow';
          }
          var request = {};
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
          var uniPacket = {
            sServantName: 'RqdServer',
            sFuncName: 'sync',
            request: request
          };
          resolve(uniPacket);
        })["catch"](function () {
          var deviceInfo = {
            system: 'unknow',
            model: 'unknow'
          };
          var request = {
            cmd: cmd,
            platformId: platformId,
            prodId: appId,
            networkType: 'unknown',
            sBuffer: obj,
            model: deviceInfo.model,
            osVer: deviceInfo.system,
            uploadTime: new Date().getTime(),
            sessionId: sessionId,
            deviceId: getDeviceId(),
            sdkVer: sdkVersion,
            version: appVersion,
            bundleId: wxAppIdentify
          };
          if (cmd === connnetReportCDM) {
            request.sBuffer.list[0].startCostTime = typeof globalThis.__crashSight.startCostTime === 'undefined' ? -1 : globalThis.__crashSight.startCostTime;
          }
          resolve({
            sServantName: 'RqdServer',
            sFuncName: 'sync',
            request: request
          });
        });
      });
    };
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
    var sendErrorMessage = function sendErrorMessage(expName, msg, stack) {
      try {
        var exceptionUpload = {};
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
        var deleteAfterUpload = false;
        var saveFileName = null;
        var hash = undefined;
        if (Number(serverStrategy['MG_KEY_MERGE_IMPROVE'])) {
          hash = md5Func(msg + stack);
          if (mergeInfo[hash]) {
            mergeInfo[hash].count++;
            wx.setStorageSync('cs_merge_info', mergeInfo);
            console.log('[CrashSight] [Debug] merge not first hash: ' + hash + ', count: ' + mergeInfo[hash].count);
            return;
          } else {
            saveFileName = 'cs_exception_' + new Date().getTime() + '_' + hash;
            mergeInfo[hash] = {
              count: 1
            };
            wx.setStorageSync('cs_merge_info', mergeInfo);
            console.log('[CrashSight] [Debug] merge fisrt hash: ' + hash + ', count: ' + mergeInfo[hash].count);
          }
        } else {
          saveFileName = 'cs_none_merge_exception_' + new Date().getTime();
          deleteAfterUpload = true;
          console.log('[CrashSight] [Debug] not merge ');
        }
        exceptionUpload.userId = userId;
        exceptionUpload.crashTime = new Date().getTime();
        exceptionUpload.expuid = generateUUID();
        exceptionUpload.deviceId = getDeviceId();
        exceptionUpload.valueMap = extKV || {};
        exceptionUpload.sessionId = sessionId;
        var logAttach = {};
        logAttach.fileName = 'crashsightlog.gz';
        logAttach.type = 2;
        var logData = '';
        for (var _i2 = 0; _i2 < userLogs.length; _i2++) {
          logData += userLogs[_i2].str + '\n';
        }
        console.log('[CrashSight] [Debug] log is: ' + logData);
        logAttach.data = toBase64(gzipSync(strToU8(logData)));
        exceptionUpload.attaches = [logAttach];
        var exceptionUploadPackage = {
          type: 107,
          deviceId: getDeviceId(),
          list: [exceptionUpload]
        };
        buildRequestJson(exceptionUploadPackage, errorReportCMD).then(function (body) {
          if (saveFileName) {
            console.log('[CrashSight] [Debug] save file: ', saveFileName);
            return fileManager.saveFile(saveFileName, JSON.stringify(body)).then(function () {
              return body;
            });
          }
          return body;
        }).then(function (body) {
          sendHttp(body, errorReportCMD.toString(), function (httpError) {
            if (!httpError && deleteAfterUpload && saveFileName) {
              fileManager.removeFile(saveFileName).then(function () {
                console.log('[CrashSight] [Event] upload not merger error message succeess, delete file:' + saveFileName);
              });
            }
          });
        })["catch"](function (error) {
          console.log("[CrashSight][Error] " + error);
        });
      } catch (error) {
        console.log("[CrashSight][Error] " + error);
      }
    };
    var sendHistoryFile = function sendHistoryFile(files) {
      return new Promise(function (resolve) {
        console.log('[CrashSight] [Debug] history files:', files);
        if (!files) {
          resolve();
          return;
        }
        var _processFile = function processFile(index) {
          if (index >= files.length) {
            resolve();
            return;
          }
          var fileName = files[index];
          var isExceptionFile = fileName.startsWith('cs_none_merge_exception_');
          var isConnectionFile = fileName.startsWith('cs_connection_');
          if (!isExceptionFile && !isConnectionFile) {
            _processFile(index + 1);
            return;
          }
          fileManager.readFile(fileName).then(function (content) {
            if (content !== undefined) {
              try {
                var uniPacket = JSON.parse(content);
                if (isExceptionFile) {
                  uniPacket.request.sBuffer.list[0].valueMap['A29'] = 1;
                }
                sendHttp(uniPacket, uniPacket.request.cmd.toString(), function (httpError) {
                  if (!httpError) {
                    fileManager.removeFile(fileName).then(function () {
                      _processFile(index + 1);
                    });
                  } else {
                    _processFile(index + 1);
                  }
                });
              } catch (e) {
                console.log('[CrashSight][Error] sendHistoryErrorMessage JSON parse and merge file:', fileName, ', content: ', content, ', error: ', e);
                fileManager.removeFile(fileName).then(function () {
                  _processFile(index + 1);
                });
              }
            } else {
              fileManager.removeFile(fileName).then(function () {
                _processFile(index + 1);
              });
            }
          });
        };
        _processFile(0);
      });
    };
    var sendConnectInfo = function sendConnectInfo(startType) {
      return new Promise(function (resolve) {
        try {
          sessionId = generateUUID();
          var summaryInfo = {};
          summaryInfo.startTime = new Date().getTime();
          summaryInfo.startType = startType;
          summaryInfo.userId = userId;
          summaryInfo.sessionId = sessionId;
          summaryInfo.coldStartup = startType == coldStartup;
          var userInfoPackage = {
            type: startType,
            deviceId: getDeviceId(),
            list: [summaryInfo]
          };
          buildRequestJson(userInfoPackage, connnetReportCDM).then(function (body) {
            var connectionFileName = 'cs_connection_' + new Date().getTime();
            return fileManager.saveFile(connectionFileName, JSON.stringify(body)).then(function () {
              return {
                body: body,
                connectionFileName: connectionFileName
              };
            });
          }).then(function (_ref) {
            var body = _ref.body,
              connectionFileName = _ref.connectionFileName;
            sendHttp(body, connnetReportCDM.toString(), function (httpError, res) {
              if (httpError) {
                resolve();
                return;
              }
              fileManager.removeFile(connectionFileName).then(function () {
                try {
                  if (res.data) {
                    if (res.data.cmd == 510) {
                      var buffer = res.data.sBuffer;
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
                            mergeExcepionFile().then(function () {
                              hasMergeExcepionFile = true;
                            });
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
                resolve();
              });
            });
          })["catch"](function (error) {
            console.log("[CrashSight][Error] sendConnectInfo error: " + error);
            resolve();
          });
        } catch (error) {
          console.log("[CrashSight][Error] " + error);
          resolve();
        }
      });
    };
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
        return new Promise(function (resolve) {
          var fs = wx.getFileSystemManager();
          fs.unlink({
            filePath: "".concat(wx.env.USER_DATA_PATH, "/CrashSight/").concat(fileName),
            success: function success() {
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
        return new Promise(function (resolve) {
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
        return new Promise(function (resolve) {
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
    var mergeExcepionFile = function mergeExcepionFile() {
      return new Promise(function (resolve) {
        var mergeInfo = wx.getStorageSync('cs_merge_info');
        wx.setStorageSync('cs_merge_info', {});
        if (!mergeInfo) {
          mergeInfo = {};
        }
        var files = fileManager.files();
        console.log('[CrashSight] [Debug] mergeInfo:', mergeInfo);
        console.log('[CrashSight] [Debug] merge files:', files);
        if (!files) {
          resolve();
          return;
        }
        var _processFile2 = function processFile(index) {
          if (index >= files.length) {
            resolve();
            return;
          }
          var fileName = files[index];
          if (!fileName.startsWith('cs_exception_')) {
            _processFile2(index + 1);
            return;
          }
          var matchResult = fileName.match(/([a-zA-Z0-9-]+)$/);
          var hash = undefined;
          if (matchResult && matchResult.length > 0) {
            hash = matchResult[0];
          } else {
            fileManager.removeFile(fileName).then(function () {
              _processFile2(index + 1);
            });
            return;
          }
          var info = mergeInfo[hash];
          if (info && info.count > 1) {
            fileManager.readFile(fileName).then(function (content) {
              if (content !== undefined) {
                try {
                  var uniPacket = JSON.parse(content);
                  uniPacket.request.sBuffer.list[0].crashCount = info.count - 2;
                  sendHttp(uniPacket, uniPacket.request.cmd.toString(), function (httpError) {
                    if (!httpError) {
                      fileManager.removeFile(fileName).then(function () {
                        _processFile2(index + 1);
                      });
                    } else {
                      _processFile2(index + 1);
                    }
                  });
                } catch (e) {
                  console.log('[CrashSight][Error] JSON parse and merge file:', fileName, ', content: ', content, ', error: ', e);
                  fileManager.removeFile(fileName).then(function () {
                    _processFile2(index + 1);
                  });
                }
              } else {
                _processFile2(index + 1);
              }
            });
          } else {
            fileManager.removeFile(fileName).then(function () {
              _processFile2(index + 1);
            });
          }
        };
        _processFile2(0);
      });
    };
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
        hasInitCrashSight = true;
        sendConnectInfo(coldStartup).then(function () {
          if (strategyEnableState != StrategyEnableState.Disable) {
            registerErrorCallback();
            sendHistoryFile(historyFiles).then(function () {
              globalThis.__crashSight.startCostTime = new Date().getTime() - startBeginTime;
              console.log('[CrashSight][INFO] CrashSight start success in ', globalThis.__crashSight.startCostTime, 'ms, waiting for enable form server...');
            });
          } else {
            globalThis.__crashSight.startCostTime = new Date().getTime() - startBeginTime;
          }
        });
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
        var byteSize = encodeURIComponent(fullLog).replace(/%[A-F0-9]{2}/g, 'X').length;
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
      reportException: function reportException(exceptionName, message, stack) {
        if (!hasInitCrashSight) {
          console.log('[CrashSight][Error] CrashSight has not started');
          return;
        }
        if (strategyEnableState == StrategyEnableState.Disable) {
          console.log('[CrashSight][Error] CrashSight has disable by server');
          return;
        }
        sendErrorMessage(exceptionName, message, stack);
      }
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
