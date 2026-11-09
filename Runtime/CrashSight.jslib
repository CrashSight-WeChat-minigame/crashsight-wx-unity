
mergeInto(LibraryManager.library, {
  CS_Load: function () {
    if (globalThis.hasLoadCrashSight) {
      return
    }
    globalThis.hasLoadCrashSight = true

    // Unity 转微信小游戏时全局 wx 常为裁剪版；COS SDK 初始化会调用 wx.canIUse，缺失则抛错。
    ;(function () {
      function patchWx(w) {
        if (!w) return
        if (typeof w.canIUse !== 'function') {
          w.canIUse = function () { return false }
        }
      }
      if (typeof globalThis !== 'undefined') {
        patchWx(globalThis.wx)
        patchWx(globalThis.qq)
      }
      if (typeof wx !== 'undefined') patchWx(wx)
      if (typeof qq !== 'undefined') patchWx(qq)
    })()

    // ===============================================WebNative Begin===================================================
    let webNative = {}

    webNative.env = {
      USER_DATA_PATH: "/user/someone"
    }

    webNative.previewOnErrorHandler = null
    webNative.onErrorUserHandler = null

    webNative.onErrorHandler = function (msg, url, lineno, colno, error) {
      if (webNative.onErrorUserHandler) {
        const errName = error && error.name ? error.name : 'Error'
        const errMsg = error && error.message ? error.message : String(msg)
        const errStack = error && error.stack ? error.stack : ''
        const summary = errName ? errName + ': ' + errMsg : errMsg
        webNative.onErrorUserHandler(summary, errStack)
      }
      if (webNative.previewOnErrorHandler) {
        webNative.previewOnErrorHandler(msg, url, lineno, colno, error);
      }
    }

    webNative.onError = function (listener) {
      if (window.onerror !== webNative.onErrorHandler) {
        console.log("")
        webNative.previewOnErrorHandler = window.onerror
        window.onerror = webNative.onErrorHandler;
      }
      webNative.onErrorUserHandler = listener
    }

    webNative.offError = function (listener) {
      webNative.onErrorUserHandler = null
    }

    webNative.hasAddOnUnhandledRejectionHandler = false
    webNative.onUnhandledRejectionUserHandler = null

    webNative.onUnhandledRejection = function (listener) {
      webNative.onUnhandledRejectionUserHandler = listener
      if (!webNative.hasAddOnUnhandledRejectionHandler) {
        webNative.hasAddOnUnhandledRejectionHandler = true
        window.addEventListener("unhandledrejection", function (e) {
          if (webNative.onUnhandledRejectionUserHandler) {
            webNative.onUnhandledRejectionUserHandler(e)
          }
        })
      }
    }

    webNative.offUnhandledRejection = function (listener) {
      webNative.onUnhandledRejectionUserHandler = null
    }

    webNative.getNetworkType = function () {
      let type = 'unknown'
      if (navigator.connection) {
        type = navigator.connection.type
      }
      return {
        networkType: type
      }
    }

    webNative.getDeviceInfo = function () {
      if (webNative.deviceInfo) {
        return webNative.deviceInfo
      }
      let system = 'unknown'
      let model = 'unknown'

      function formatVersion(match) {
        return `${match[1]}.${match[2]}.${match[3] || '0'}`
      }

      const VERSION_PATTERNS = {
        IOS: /CPU (?:iPhone )?OS (\d+)_(\d+)_?(\d+)?/,
        MACOS: /Mac OS X (\d+)[._](\d+)[._]?(\d+)?/,
        ANDROID: /Android (\d+)\.(\d+)\.?(\d+)?/,
        WINDOWS: /Windows NT (\d+)\.(\d+)/
      }
      const ua = navigator.userAgent
      try {
        if (/Android|Adr/i.test(ua)) {
          model = 'android'
          const match = ua.match(VERSION_PATTERNS.ANDROID)
          system = 'android ' + (match ? formatVersion(match) : null)
        } else if (/iPhone/i.test(ua)) {
          model = 'iphone'
          const match = ua.match(VERSION_PATTERNS.IOS)
          system = 'iOS ' + (match ? formatVersion(match) : null)
        } else if (/iPad/i.test(ua)) {
          model = 'ipad'
          const match = ua.match(VERSION_PATTERNS.IOS)
          system = 'iOS ' + (match ? formatVersion(match) : null)
        } else if (/Windows NT/i.test(ua)) {
          model = 'windows'
          const match = ua.match(VERSION_PATTERNS.WINDOWS)
          system = 'windows ' + (match ? `${match[1]}.${match[2]}.0` : null)
        } else if (/Macintosh/i.test(ua)) {
          model = 'mac'
          const match = ua.match(VERSION_PATTERNS.MACOS)
          system = 'MacOS ' + (match ? formatVersion(match) : null)
        }
      } catch (e) {
        console.log('[WebNative]] parse system error', e)
      }

      let deviceInfo = {
        system: system,
        model: model
      }
      webNative.deviceInfo = deviceInfo
      return deviceInfo
    }





    webNative.request = function ({
      url,
      method = 'GET',
      header = {},
      data = null,
      success,
      fail
    }) {
      const xhr = new XMLHttpRequest();
      try {
        new URL(url);
      } catch (e) {
        fail && fail({
          type: 'INVALID_URL',
          message: `无效的URL格式: ${url}`,
          detail: e.message
        });
        return;
      }

      xhr.open(method, url, true);
      for (const key in header) {
        xhr.setRequestHeader(key, header[key]);
      }
      xhr.withCredentials = false;
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
          const res = {
            data: xhr.responseText,
            status: xhr.status,
            headers: xhr.getAllResponseHeaders()
          };
          try {
            res.data = JSON.parse(res.data);
          } catch (e) {}
          success && success(res);
        } else {
          const errorMap = {
            400: '请求参数错误',
            401: '未授权，请登录',
            403: '拒绝访问',
            404: '请求资源不存在',
            500: '服务器内部错误',
            502: '网关错误',
            503: '服务不可用',
            504: '网关超时'
          };

          fail && fail({
            type: 'HTTP_ERROR',
            status: xhr.status,
            message: errorMap[xhr.status] || `HTTP请求失败: ${xhr.statusText}`,
            response: xhr.responseText
          });
        }
      };

      xhr.onerror = function () {
        // 区分不同网络错误类型
        let errorType = 'NETWORK_ERROR';
        let message = '网络连接失败';

        if (!navigator.onLine) {
          errorType = 'OFFLINE';
          message = '网络已断开';
        } else if (xhr.readyState === 4 && xhr.status === 0) {
          errorType = 'CORS_BLOCKED';
          message = '请求被CORS策略阻止';
        }

        fail && fail({
          type: errorType,
          message: message,
          detail: '请检查网络连接或服务器CORS配置'
        });
      };

      xhr.ontimeout = function () {
        fail && fail({
          type: 'TIMEOUT',
          message: `请求超时 (${xhr.timeout}ms)`,
          detail: '服务器响应时间过长'
        });
      };

      xhr.timeout = 10000; // 10秒超时
      xhr.send(data ? JSON.stringify(data) : null);
    }

    webNative.setStorageSync = function (key, value) {
      if (typeof key !== 'string') {
        return;
      }
      let typeKey = key + "_type"
      let valueType = typeof value
      localStorage.setItem(typeKey, valueType)
      if (valueType === 'object') {
        localStorage.setItem(key, JSON.stringify(value));
      } else if (valueType === 'string') {
        localStorage.setItem(key, value);
      } else if (valueType === 'undefined') {
        localStorage.setItem(key, 'undefined');
      } else {
        localStorage.setItem(key, value.toString());
      }
    }

    webNative.getStorageSync = function (key) {
      if (typeof key !== 'string') {
        return null;
      }
      let typeKey = key + "_type"
      let valueType = localStorage.getItem(typeKey)
      if (valueType == null) {
        console.log('[WebNative] not found type key: ', typeKey)
        return null;
      }
      let value = localStorage.getItem(key)
      if (value == null) {
        return null;
      }
      if (valueType === 'string') {
        return value
      } else if (valueType === 'number') {
        return Number(value)
      } else if (valueType === 'boolean') {
        return value === 'true'
      } else if (valueType === 'undefined') {
        return undefined
      } else {
        return JSON.parse(value)
      }
    }



    let FileSystemManager = {

      init(dbName) {
        this.dbName = dbName;
        this.db = null;
        this.initSuccess = false;
        return this
      },

      async initDB() {
        return new Promise((resolve, reject) => {
          const request = indexedDB.open(this.dbName, 1);
          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('files')) {
              const store = db.createObjectStore('files', {
                keyPath: 'path'
              });
              store.createIndex('directory', 'directory', {
                unique: false
              });
            }
          };

          request.onsuccess = (event) => {
            this.db = event.target.result;
            self.initSuccess = true;
            resolve();
          };

          request.onerror = (event) => {
            self.initSuccess = false;
            reject(event.target.error);
          };
        });
      },

      accessSync(path) {
        if (!self.initSuccess) {
          console.log('[WebNative] fileSystemManager not init successfully, accessSync is forbidden');
          return
        }
        const transaction = this.db.transaction(['files'], 'readonly');
        const store = transaction.objectStore('files');
        const request = store.get(path);

        return new Promise((resolve, reject) => {
          request.onsuccess = () => {
            if (request.result) resolve();
            else reject(new Error(`File not found: ${path}`));
          };
          request.onerror = () => reject(request.error);
        });
      },

      mkdirSync(dirPath) {

      },

      readdirSync(dirPath) {
        if (!self.initSuccess) {
          console.log('[WebNative] fileSystemManager not init successfully, readdirSync is forbidden');
          return
        }
        if (!dirPath.endsWith('/')) dirPath += '/';

        return new Promise((resolve, reject) => {
          const transaction = this.db.transaction(['files'], 'readonly');
          const store = transaction.objectStore('files');
          const index = store.index('directory');
          const request = index.getAll(dirPath);

          request.onsuccess = () => {
            const items = request.result.map(item =>
              item.path.substring(dirPath.length).split('/')[0]
            );
            resolve([...new Set(items)]);
          };
          request.onerror = () => reject(request.error);
        });
      },

      unlink({
        filePath,
        success,
        fail
      }) {
        if (!self.initSuccess) {
          console.log('[WebNative] fileSystemManager not init successfully, unlink is forbidden');
          return
        }
        const transaction = this.db.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        const request = store.delete(filePath);
        request.onsuccess = () => {
          if (success) success();
        };
        request.onerror = () => {
          if (fail) fail();
        };
      },

      writeFile({
        filePath,
        encoding,
        data,
        success,
        fail
      }) {
        if (!self.initSuccess) {
          console.log('[WebNative] fileSystemManager not init successfully, writeFile is forbidden');
          return
        }
        const transaction = this.db.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        const request = store.put({
          path: filePath,
          directory: filePath.substring(0, filePath.lastIndexOf('/') + 1),
          isDirectory: false,
          content: data
        });
        request.onsuccess = () => {
          if (success) success();
        };
        request.onerror = () => {
          if (fail) fail();
        };
      },

      readFile({
        filePath,
        encoding,
        success,
        fail
      }) {
        if (!self.initSuccess) {
          console.log('[WebNative] fileSystemManager not init successfully, readFile is forbidden');
          return
        }
        const transaction = this.db.transaction(['files'], 'readonly');
        const store = transaction.objectStore('files');
        const request = store.get(filePath);

        request.onsuccess = () => {
          if (request.result) {
            if (success) success({
              data: request.result.content
            });
          } else {
            if (fail) fail(new Error(`File not found: ${filePath}`));
          }
        };
        request.onerror = () => {
          if (fail) fail(request.error)
        };
      }

    }

    webNative.initFileSystemManager = (function () {
      let initPromise = null;
      return async function () {
        if (webNative.fileSystemManager) return webNative.fileSystemManager;
        if (!initPromise) {
          initPromise = (async () => {
            const instance = FileSystemManager.init("CrashsightFileDB");
            try {
              await instance.initDB();
              webNative.fileSystemManager = instance;
              console.log('[WebNative] fileSystemManager init finished!');
              return instance;
            } catch (err) {
              console.log('[WebNative] fileSystemManager init failed!');
              initPromise = null;
              throw err;
            }
          })();
        }
        return initPromise;
      };
    })();


    webNative.getFileSystemManager = function () {
      return webNative.fileSystemManager
    }

    globalThis.cs_webNative = webNative

// ===============================================WebNative End===================================================

    // ===============================================md5 Begin===================================================



    /**
     * Add integers, wrapping at 2^32.
     * This uses 16-bit operations internally to work around bugs in interpreters.
     *
     * @param {number} x First integer
     * @param {number} y Second integer
     * @returns {number} Sum
     */
    function safeAdd(x, y) {
      var lsw = (x & 0xffff) + (y & 0xffff)
      var msw = (x >> 16) + (y >> 16) + (lsw >> 16)
      return (msw << 16) | (lsw & 0xffff)
    }

    /**
     * Bitwise rotate a 32-bit number to the left.
     *
     * @param {number} num 32-bit number
     * @param {number} cnt Rotation count
     * @returns {number} Rotated number
     */
    function bitRotateLeft(num, cnt) {
      return (num << cnt) | (num >>> (32 - cnt))
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
      return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b)
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
      return md5cmn((b & c) | (~b & d), a, b, x, s, t)
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
      return md5cmn((b & d) | (c & ~d), a, b, x, s, t)
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
      return md5cmn(b ^ c ^ d, a, b, x, s, t)
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
      return md5cmn(c ^ (b | ~d), a, b, x, s, t)
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
      x[len >> 5] |= 0x80 << len % 32
      x[(((len + 64) >>> 9) << 4) + 14] = len

      var i
      var olda
      var oldb
      var oldc
      var oldd
      var a = 1732584193
      var b = -271733879
      var c = -1732584194
      var d = 271733878

      for (i = 0; i < x.length; i += 16) {
        olda = a
        oldb = b
        oldc = c
        oldd = d

        a = md5ff(a, b, c, d, x[i], 7, -680876936)
        d = md5ff(d, a, b, c, x[i + 1], 12, -389564586)
        c = md5ff(c, d, a, b, x[i + 2], 17, 606105819)
        b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330)
        a = md5ff(a, b, c, d, x[i + 4], 7, -176418897)
        d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426)
        c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341)
        b = md5ff(b, c, d, a, x[i + 7], 22, -45705983)
        a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416)
        d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417)
        c = md5ff(c, d, a, b, x[i + 10], 17, -42063)
        b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162)
        a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682)
        d = md5ff(d, a, b, c, x[i + 13], 12, -40341101)
        c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290)
        b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329)

        a = md5gg(a, b, c, d, x[i + 1], 5, -165796510)
        d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632)
        c = md5gg(c, d, a, b, x[i + 11], 14, 643717713)
        b = md5gg(b, c, d, a, x[i], 20, -373897302)
        a = md5gg(a, b, c, d, x[i + 5], 5, -701558691)
        d = md5gg(d, a, b, c, x[i + 10], 9, 38016083)
        c = md5gg(c, d, a, b, x[i + 15], 14, -660478335)
        b = md5gg(b, c, d, a, x[i + 4], 20, -405537848)
        a = md5gg(a, b, c, d, x[i + 9], 5, 568446438)
        d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690)
        c = md5gg(c, d, a, b, x[i + 3], 14, -187363961)
        b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501)
        a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467)
        d = md5gg(d, a, b, c, x[i + 2], 9, -51403784)
        c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473)
        b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734)

        a = md5hh(a, b, c, d, x[i + 5], 4, -378558)
        d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463)
        c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562)
        b = md5hh(b, c, d, a, x[i + 14], 23, -35309556)
        a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060)
        d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353)
        c = md5hh(c, d, a, b, x[i + 7], 16, -155497632)
        b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640)
        a = md5hh(a, b, c, d, x[i + 13], 4, 681279174)
        d = md5hh(d, a, b, c, x[i], 11, -358537222)
        c = md5hh(c, d, a, b, x[i + 3], 16, -722521979)
        b = md5hh(b, c, d, a, x[i + 6], 23, 76029189)
        a = md5hh(a, b, c, d, x[i + 9], 4, -640364487)
        d = md5hh(d, a, b, c, x[i + 12], 11, -421815835)
        c = md5hh(c, d, a, b, x[i + 15], 16, 530742520)
        b = md5hh(b, c, d, a, x[i + 2], 23, -995338651)

        a = md5ii(a, b, c, d, x[i], 6, -198630844)
        d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415)
        c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905)
        b = md5ii(b, c, d, a, x[i + 5], 21, -57434055)
        a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571)
        d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606)
        c = md5ii(c, d, a, b, x[i + 10], 15, -1051523)
        b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799)
        a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359)
        d = md5ii(d, a, b, c, x[i + 15], 10, -30611744)
        c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380)
        b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649)
        a = md5ii(a, b, c, d, x[i + 4], 6, -145523070)
        d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379)
        c = md5ii(c, d, a, b, x[i + 2], 15, 718787259)
        b = md5ii(b, c, d, a, x[i + 9], 21, -343485551)

        a = safeAdd(a, olda)
        b = safeAdd(b, oldb)
        c = safeAdd(c, oldc)
        d = safeAdd(d, oldd)
      }
      return [a, b, c, d]
    }

    /**
     * Convert an array of little-endian words to a string
     *
     * @param {Array<number>} input MD5 Array
     * @returns {string} MD5 string
     */
    function binl2rstr(input) {
      var i
      var output = ''
      var length32 = input.length * 32
      for (i = 0; i < length32; i += 8) {
        output += String.fromCharCode((input[i >> 5] >>> i % 32) & 0xff)
      }
      return output
    }

    /**
     * Convert a raw string to an array of little-endian words
     * Characters >255 have their high-byte silently ignored.
     *
     * @param {string} input Raw input string
     * @returns {Array<number>} Array of little-endian words
     */
    function rstr2binl(input) {
      var i
      var output = []
      output[(input.length >> 2) - 1] = undefined
      for (i = 0; i < output.length; i += 1) {
        output[i] = 0
      }
      var length8 = input.length * 8
      for (i = 0; i < length8; i += 8) {
        output[i >> 5] |= (input.charCodeAt(i / 8) & 0xff) << i % 32
      }
      return output
    }

    /**
     * Calculate the MD5 of a raw string
     *
     * @param {string} s Input string
     * @returns {string} Raw MD5 string
     */
    function rstrMD5(s) {
      return binl2rstr(binlMD5(rstr2binl(s), s.length * 8))
    }

    /**
     * Calculates the HMAC-MD5 of a key and some data (raw strings)
     *
     * @param {string} key HMAC key
     * @param {string} data Raw input string
     * @returns {string} Raw MD5 string
     */
    function rstrHMACMD5(key, data) {
      var i
      var bkey = rstr2binl(key)
      var ipad = []
      var opad = []
      var hash
      ipad[15] = opad[15] = undefined
      if (bkey.length > 16) {
        bkey = binlMD5(bkey, key.length * 8)
      }
      for (i = 0; i < 16; i += 1) {
        ipad[i] = bkey[i] ^ 0x36363636
        opad[i] = bkey[i] ^ 0x5c5c5c5c
      }
      hash = binlMD5(ipad.concat(rstr2binl(data)), 512 + data.length * 8)
      return binl2rstr(binlMD5(opad.concat(hash), 512 + 128))
    }

    /**
     * Convert a raw string to a hex string
     *
     * @param {string} input Raw input string
     * @returns {string} Hex encoded string
     */
    function rstr2hex(input) {
      var hexTab = '0123456789abcdef'
      var output = ''
      var x
      var i
      for (i = 0; i < input.length; i += 1) {
        x = input.charCodeAt(i)
        output += hexTab.charAt((x >>> 4) & 0x0f) + hexTab.charAt(x & 0x0f)
      }
      return output
    }

    /**
     * Encode a string as UTF-8
     *
     * @param {string} input Input string
     * @returns {string} UTF8 string
     */
    function str2rstrUTF8(input) {
      return unescape(encodeURIComponent(input))
    }

    /**
     * Encodes input string as raw MD5 string
     *
     * @param {string} s Input string
     * @returns {string} Raw MD5 string
     */
    function rawMD5(s) {
      return rstrMD5(str2rstrUTF8(s))
    }
    /**
     * Encodes input string as Hex encoded string
     *
     * @param {string} s Input string
     * @returns {string} Hex encoded string
     */
    function hexMD5(s) {
      return rstr2hex(rawMD5(s))
    }
    /**
     * Calculates the raw HMAC-MD5 for the given key and data
     *
     * @param {string} k HMAC key
     * @param {string} d Input string
     * @returns {string} Raw MD5 string
     */
    function rawHMACMD5(k, d) {
      return rstrHMACMD5(str2rstrUTF8(k), str2rstrUTF8(d))
    }
    /**
     * Calculates the Hex encoded HMAC-MD5 for the given key and data
     *
     * @param {string} k HMAC key
     * @param {string} d Input string
     * @returns {string} Raw MD5 string
     */
    function hexHMACMD5(k, d) {
      return rstr2hex(rawHMACMD5(k, d))
    }



    let cs_md5 = {
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
      md5(string, key, raw) {
        if (!key) {
          if (!raw) {
            return hexMD5(string)
          }
          return rawMD5(string)
        }
        if (!raw) {
          return hexHMACMD5(key, string)
        }
        return rawHMACMD5(key, string)
      }
    }


    // ===============================================md5 end===================================================



    // ========================== fflate Core Begin===============================

    var exports = {};

    var Worker;
    var workerAdd = ";var __w=require('worker_threads');__w.parentPort.on('message',function(m){onmessage({data:m})}),postMessage=function(m,t){__w.parentPort.postMessage(m,t)},close=process.exit;self=global";
    try {
      Worker = require('worker_threads').Worker;
    } catch (e) { }
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
      var NOP = function NOP() { };
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
    var fleb = new u8([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, /* unused */ 0, 0, /* impossible */ 0]);
    // fixed distance extra bits
    var fdeb = new u8([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, /* unused */ 0, 0]);
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
    var flm = /*#__PURE__*/ hMap(flt, 9, 0),
      flrm = /*#__PURE__*/ hMap(flt, 9, 1);
    // fixed distance map
    var fdm = /*#__PURE__*/ hMap(fdt, 5, 0),
      fdrm = /*#__PURE__*/ hMap(fdt, 5, 1);
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
    var ec = ['unexpected EOF', 'invalid block type', 'invalid length/literal', 'invalid distance', 'stream finished', 'no stream handler', , 'no callback', 'invalid UTF-8 data', 'extra field too long', 'date not in range 1980-2099', 'filename too long', 'stream finishing', 'invalid zip data'
      // determined by unknown compression method
    ];;
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
          } else if (type == 1) lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
          else if (type == 2) {
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
                if (s == 16) n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
                else if (s == 17) n = 3 + bits(dat, pos, 7), pos += 3;
                else if (s == 18) n = 11 + bits(dat, pos, 127), pos += 7;
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
        for (; ; lpos = pos) {
          // bits read, code
          var c = lm[bits16(dat, pos) & lms],
            sym = c >> 4;
          pos += c & 15;
          if (pos > tbts) {
            if (noSt) _err(0);
            break;
          }
          if (!c) _err(2);
          if (sym < 256) buf[bt++] = sym;
          else if (sym == 256) {
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
          if (tr[i2_2] < mb) dt -= 1 << mb - tr[i2_2]++ - 1;
          else ++i;
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
        if (c[i] == cln && i != s) ++cls;
        else {
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
    var deo = /*#__PURE__*/ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
    // empty
    var et = /*#__PURE__*/ new u8(0);
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
    var crct = /*#__PURE__*/ function () {
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
    };;
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
        if (err) w.terminate(), strm.ondata.call(strm, err);
        else if (!Array.isArray(dat)) ext(dat);
        else if (dat.length == 1) {
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
    var Deflate = /*#__PURE__*/ function () {
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
    var AsyncDeflate = /*#__PURE__*/ function () {
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
    var Inflate = /*#__PURE__*/ function () {
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
        if (!this.p.length) this.p = c;
        else if (c.length) {
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
    var AsyncInflate = /*#__PURE__*/ function () {
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
    var Gzip = /*#__PURE__*/ function () {
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
    var AsyncGzip = /*#__PURE__*/ function () {
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
    var Gunzip = /*#__PURE__*/ function () {
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
    var AsyncGunzip = /*#__PURE__*/ function () {
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
    var Zlib = /*#__PURE__*/ function () {
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
    var AsyncZlib = /*#__PURE__*/ function () {
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
    var Unzlib = /*#__PURE__*/ function () {
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
    var AsyncUnzlib = /*#__PURE__*/ function () {
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
    var Decompress = /*#__PURE__*/ function () {
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
    var AsyncDecompress = /*#__PURE__*/ function () {
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
        if (val instanceof u8) t[n] = [val, op];
        else {
          t[n += '/'] = [new u8(0), op];
          _fltn(val, n, t, o);
        }
      }
    };
    // text encoder
    var te = typeof TextEncoder != 'undefined' && /*#__PURE__*/ new TextEncoder();
    // text decoder
    var td = typeof TextDecoder != 'undefined' && /*#__PURE__*/ new TextDecoder();
    // text decoder stream
    var tds = 0;
    try {
      td.decode(et, {
        stream: true
      });
      tds = 1;
    } catch (e) { }
    // decode UTF8
    var dutf8 = function dutf8(d) {
      for (var r = '', i = 0; ;) {
        var c = d[i++];
        var eb = (c > 127) + (c > 223) + (c > 239);
        if (i + eb > d.length) return {
          s: r,
          r: slc(d, i - 1)
        };
        if (!eb) r += String.fromCharCode(c);
        else if (eb == 3) {
          c = ((c & 15) << 18 | (d[i++] & 63) << 12 | (d[i++] & 63) << 6 | d[i++] & 63) - 65536, r += String.fromCharCode(55296 | c >> 10, 56320 | c & 1023);
        } else if (eb & 1) r += String.fromCharCode((c & 31) << 6 | d[i++] & 63);
        else r += String.fromCharCode((c & 15) << 12 | (d[i++] & 63) << 6 | d[i++] & 63);
      }
    };
    /**
     * Streaming UTF-8 decoding
     */
    var DecodeUTF8 = /*#__PURE__*/ function () {
      /**
       * Creates a UTF-8 decoding stream
       * @param cb The callback to call whenever data is decoded
       */
      function DecodeUTF8(cb) {
        this.ondata = cb;
        if (tds) this.t = new TextDecoder();
        else this.p = et;
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
    var EncodeUTF8 = /*#__PURE__*/ function () {
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
        if (c < 128 || latin1) w(c);
        else if (c < 2048) w(192 | c >> 6), w(128 | c & 63);
        else if (c > 55295 && c < 57344) c = 65536 + (c & 1023 << 10) | str.charCodeAt(++i) & 1023, w(240 | c >> 18), w(128 | c >> 12 & 63), w(128 | c >> 6 & 63), w(128 | c & 63);
        else w(224 | c >> 12), w(128 | c >> 6 & 63), w(128 | c & 63);
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
    exports.strFromU8 = strFromU8;;
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
    var ZipPassThrough = /*#__PURE__*/ function () {
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
    var ZipDeflate = /*#__PURE__*/ function () {
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
    var AsyncZipDeflate = /*#__PURE__*/ function () {
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
    var Zip = /*#__PURE__*/ function () {
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
        if (this.d & 2) this.ondata(_err(4 + (this.d & 1) * 8, 0, 1), null, false);
        else {
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
                if (nxt) nxt.r();
                else _this.d = 1;
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
        if (this.d) this.e();
        else this.u.push({
          r: function r() {
            if (!(_this.d & 1)) return;
            _this.u.splice(-1, 1);
            _this.e();
          },
          t: function t() { }
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
            if (!--lft) cbf();
          }
        };
        if (s > 65535) cbl(_err(11, 0, 1), null);
        if (!compression) cbl(null, file);
        else if (size < 160000) {
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
    var UnzipPassThrough = /*#__PURE__*/ function () {
      function UnzipPassThrough() { }
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
    var UnzipInflate = /*#__PURE__*/ function () {
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
    var AsyncUnzipInflate = /*#__PURE__*/ function () {
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
    var Unzip = /*#__PURE__*/ function () {
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
          if (this.d) this.d.push(toAdd, !this.c);
          else this.k[0].push(toAdd);
          chunk = chunk.subarray(len);
          if (chunk.length) return this.push(chunk, _final30);
        } else {
          var f = 0,
            i = 0,
            is = void 0,
            buf = void 0;
          if (!this.p.length) buf = chunk;
          else if (!chunk.length) buf = this.p;
          else {
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
                    if (!sc_1) file_1.ondata(null, et, true);
                    else {
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
                      if (_this.k[0] == chks_3 && _this.c) _this.d = d_1;
                      else d_1.push(et, true);
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
            if (add) add.push(dat, !!f);
            else this.k[+(f == 2)].push(dat);
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
      };
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
              if (!--lft) cbd(null, files);
            }
          };
          if (!fltr || fltr({
            name: fn,
            size: sc,
            originalSize: su,
            compression: c_1
          })) {
            if (!c_1) cbl(null, slc(data, b, b + sc));
            else if (c_1 == 8) {
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
      };
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
          if (!c_2) files[fn] = slc(data, b, b + sc);
          else if (c_2 == 8) files[fn] = inflateSync(data.subarray(b, b + sc), {
            out: new u8(su)
          });
          else _err(14, 'unknown compression type ' + c_2);
        }
      }
      return files;
    }
    exports.unzipSync = unzipSync;

    // ========================== fflate Core End===============================




    let md5 = cs_md5

    
;
    if (typeof qq === "undefined" && typeof wx !== "undefined") {
    (function webpackUniversalModuleDefinition(root, factory) {
    	if(typeof exports === 'object' && typeof module === 'object')
    		module.exports = factory();
    	else if(typeof define === 'function' && define.amd)
    		define([], factory);
    	else if(typeof exports === 'object')
    		exports["COS"] = factory();
    	else
    		root["COS"] = factory();
    })(window, function() {
    return /******/ (function(modules) { // webpackBootstrap
    /******/ 	// The module cache
    /******/ 	var installedModules = {};
    /******/
    /******/ 	// The require function
    /******/ 	function __webpack_require__(moduleId) {
    /******/
    /******/ 		// Check if module is in cache
    /******/ 		if(installedModules[moduleId]) {
    /******/ 			return installedModules[moduleId].exports;
    /******/ 		}
    /******/ 		// Create a new module (and put it into the cache)
    /******/ 		var module = installedModules[moduleId] = {
    /******/ 			i: moduleId,
    /******/ 			l: false,
    /******/ 			exports: {}
    /******/ 		};
    /******/
    /******/ 		// Execute the module function
    /******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
    /******/
    /******/ 		// Flag the module as loaded
    /******/ 		module.l = true;
    /******/
    /******/ 		// Return the exports of the module
    /******/ 		return module.exports;
    /******/ 	}
    /******/
    /******/
    /******/ 	// expose the modules object (__webpack_modules__)
    /******/ 	__webpack_require__.m = modules;
    /******/
    /******/ 	// expose the module cache
    /******/ 	__webpack_require__.c = installedModules;
    /******/
    /******/ 	// define getter function for harmony exports
    /******/ 	__webpack_require__.d = function(exports, name, getter) {
    /******/ 		if(!__webpack_require__.o(exports, name)) {
    /******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
    /******/ 		}
    /******/ 	};
    /******/
    /******/ 	// define __esModule on exports
    /******/ 	__webpack_require__.r = function(exports) {
    /******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
    /******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    /******/ 		}
    /******/ 		Object.defineProperty(exports, '__esModule', { value: true });
    /******/ 	};
    /******/
    /******/ 	// create a fake namespace object
    /******/ 	// mode & 1: value is a module id, require it
    /******/ 	// mode & 2: merge all properties of value into the ns
    /******/ 	// mode & 4: return value when already ns object
    /******/ 	// mode & 8|1: behave like require
    /******/ 	__webpack_require__.t = function(value, mode) {
    /******/ 		if(mode & 1) value = __webpack_require__(value);
    /******/ 		if(mode & 8) return value;
    /******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
    /******/ 		var ns = Object.create(null);
    /******/ 		__webpack_require__.r(ns);
    /******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
    /******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
    /******/ 		return ns;
    /******/ 	};
    /******/
    /******/ 	// getDefaultExport function for compatibility with non-harmony modules
    /******/ 	__webpack_require__.n = function(module) {
    /******/ 		var getter = module && module.__esModule ?
    /******/ 			function getDefault() { return module['default']; } :
    /******/ 			function getModuleExports() { return module; };
    /******/ 		__webpack_require__.d(getter, 'a', getter);
    /******/ 		return getter;
    /******/ 	};
    /******/
    /******/ 	// Object.prototype.hasOwnProperty.call
    /******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
    /******/
    /******/ 	// __webpack_public_path__
    /******/ 	__webpack_require__.p = "/Users/chrisftian/Documents/projects/cos-sdk/cos-wx-sdk-v5/dist";
    /******/
    /******/
    /******/ 	// Load entry module and return exports
    /******/ 	return __webpack_require__(__webpack_require__.s = "./index.js");
    /******/ })
    /************************************************************************/
    /******/ ({

    /***/ "./index.js":
    /*!******************!*\
      !*** ./index.js ***!
      \******************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    var COS = __webpack_require__(/*! ./src/cos */ "./src/cos.js");
    module.exports = COS;

    /***/ }),

    /***/ "./lib/base64.js":
    /*!***********************!*\
      !*** ./lib/base64.js ***!
      \***********************/
    /*! no static exports found */
    /***/ (function(module, exports) {

    /*
     * $Id: base64.js,v 2.15 2014/04/05 12:58:57 dankogai Exp dankogai $
     *
     *  Licensed under the BSD 3-Clause License.
     *    http://opensource.org/licenses/BSD-3-Clause
     *
     *  References:
     *    http://en.wikipedia.org/wiki/Base64
     */

    var Base64 = function (global) {
      global = global || {};
      'use strict';
      // existing version for noConflict()
      var _Base64 = global.Base64;
      var version = "2.1.9";
      // if node.js, we use Buffer
      var buffer;
      // constants
      var b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      var b64tab = function (bin) {
        var t = {};
        for (var i = 0, l = bin.length; i < l; i++) t[bin.charAt(i)] = i;
        return t;
      }(b64chars);
      var fromCharCode = String.fromCharCode;
      // encoder stuff
      var cb_utob = function cb_utob(c) {
        if (c.length < 2) {
          var cc = c.charCodeAt(0);
          return cc < 0x80 ? c : cc < 0x800 ? fromCharCode(0xc0 | cc >>> 6) + fromCharCode(0x80 | cc & 0x3f) : fromCharCode(0xe0 | cc >>> 12 & 0x0f) + fromCharCode(0x80 | cc >>> 6 & 0x3f) + fromCharCode(0x80 | cc & 0x3f);
        } else {
          var cc = 0x10000 + (c.charCodeAt(0) - 0xD800) * 0x400 + (c.charCodeAt(1) - 0xDC00);
          return fromCharCode(0xf0 | cc >>> 18 & 0x07) + fromCharCode(0x80 | cc >>> 12 & 0x3f) + fromCharCode(0x80 | cc >>> 6 & 0x3f) + fromCharCode(0x80 | cc & 0x3f);
        }
      };
      var re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
      var utob = function utob(u) {
        return u.replace(re_utob, cb_utob);
      };
      var cb_encode = function cb_encode(ccc) {
        var padlen = [0, 2, 1][ccc.length % 3],
          ord = ccc.charCodeAt(0) << 16 | (ccc.length > 1 ? ccc.charCodeAt(1) : 0) << 8 | (ccc.length > 2 ? ccc.charCodeAt(2) : 0),
          chars = [b64chars.charAt(ord >>> 18), b64chars.charAt(ord >>> 12 & 63), padlen >= 2 ? '=' : b64chars.charAt(ord >>> 6 & 63), padlen >= 1 ? '=' : b64chars.charAt(ord & 63)];
        return chars.join('');
      };
      var btoa = global.btoa ? function (b) {
        return global.btoa(b);
      } : function (b) {
        return b.replace(/[\s\S]{1,3}/g, cb_encode);
      };
      var _encode = buffer ? function (u) {
        return (u.constructor === buffer.constructor ? u : new buffer(u)).toString('base64');
      } : function (u) {
        return btoa(utob(u));
      };
      var encode = function encode(u, urisafe) {
        return !urisafe ? _encode(String(u)) : _encode(String(u)).replace(/[+\/]/g, function (m0) {
          return m0 == '+' ? '-' : '_';
        }).replace(/=/g, '');
      };
      var encodeURI = function encodeURI(u) {
        return encode(u, true);
      };
      // decoder stuff
      var re_btou = new RegExp(['[\xC0-\xDF][\x80-\xBF]', '[\xE0-\xEF][\x80-\xBF]{2}', '[\xF0-\xF7][\x80-\xBF]{3}'].join('|'), 'g');
      var cb_btou = function cb_btou(cccc) {
        switch (cccc.length) {
          case 4:
            var cp = (0x07 & cccc.charCodeAt(0)) << 18 | (0x3f & cccc.charCodeAt(1)) << 12 | (0x3f & cccc.charCodeAt(2)) << 6 | 0x3f & cccc.charCodeAt(3),
              offset = cp - 0x10000;
            return fromCharCode((offset >>> 10) + 0xD800) + fromCharCode((offset & 0x3FF) + 0xDC00);
          case 3:
            return fromCharCode((0x0f & cccc.charCodeAt(0)) << 12 | (0x3f & cccc.charCodeAt(1)) << 6 | 0x3f & cccc.charCodeAt(2));
          default:
            return fromCharCode((0x1f & cccc.charCodeAt(0)) << 6 | 0x3f & cccc.charCodeAt(1));
        }
      };
      var btou = function btou(b) {
        return b.replace(re_btou, cb_btou);
      };
      var cb_decode = function cb_decode(cccc) {
        var len = cccc.length,
          padlen = len % 4,
          n = (len > 0 ? b64tab[cccc.charAt(0)] << 18 : 0) | (len > 1 ? b64tab[cccc.charAt(1)] << 12 : 0) | (len > 2 ? b64tab[cccc.charAt(2)] << 6 : 0) | (len > 3 ? b64tab[cccc.charAt(3)] : 0),
          chars = [fromCharCode(n >>> 16), fromCharCode(n >>> 8 & 0xff), fromCharCode(n & 0xff)];
        chars.length -= [0, 0, 2, 1][padlen];
        return chars.join('');
      };
      var atob = global.atob ? function (a) {
        return global.atob(a);
      } : function (a) {
        return a.replace(/[\s\S]{1,4}/g, cb_decode);
      };
      var _decode = buffer ? function (a) {
        return (a.constructor === buffer.constructor ? a : new buffer(a, 'base64')).toString();
      } : function (a) {
        return btou(atob(a));
      };
      var decode = function decode(a) {
        return _decode(String(a).replace(/[-_]/g, function (m0) {
          return m0 == '-' ? '+' : '/';
        }).replace(/[^A-Za-z0-9\+\/]/g, ''));
      };
      var noConflict = function noConflict() {
        var Base64 = global.Base64;
        global.Base64 = _Base64;
        return Base64;
      };
      // export Base64
      var Base64 = {
        VERSION: version,
        atob: atob,
        btoa: btoa,
        fromBase64: decode,
        toBase64: encode,
        utob: utob,
        encode: encode,
        encodeURI: encodeURI,
        btou: btou,
        decode: decode,
        noConflict: noConflict
      };
      return Base64;
    }();
    module.exports = Base64;

    /***/ }),

    /***/ "./lib/crypto.js":
    /*!***********************!*\
      !*** ./lib/crypto.js ***!
      \***********************/
    /*! no static exports found */
    /***/ (function(module, exports) {

    /*
     CryptoJS v3.1.2
     code.google.com/p/crypto-js
     (c) 2009-2013 by Jeff Mott. All rights reserved.
     code.google.com/p/crypto-js/wiki/License
     */
    var CryptoJS = CryptoJS || function (g, l) {
      var e = {},
        d = e.lib = {},
        m = function m() {},
        k = d.Base = {
          extend: function extend(a) {
            m.prototype = this;
            var c = new m();
            a && c.mixIn(a);
            c.hasOwnProperty("init") || (c.init = function () {
              c.$super.init.apply(this, arguments);
            });
            c.init.prototype = c;
            c.$super = this;
            return c;
          },
          create: function create() {
            var a = this.extend();
            a.init.apply(a, arguments);
            return a;
          },
          init: function init() {},
          mixIn: function mixIn(a) {
            for (var c in a) a.hasOwnProperty(c) && (this[c] = a[c]);
            a.hasOwnProperty("toString") && (this.toString = a.toString);
          },
          clone: function clone() {
            return this.init.prototype.extend(this);
          }
        },
        p = d.WordArray = k.extend({
          init: function init(a, c) {
            a = this.words = a || [];
            this.sigBytes = c != l ? c : 4 * a.length;
          },
          toString: function toString(a) {
            return (a || n).stringify(this);
          },
          concat: function concat(a) {
            var c = this.words,
              q = a.words,
              f = this.sigBytes;
            a = a.sigBytes;
            this.clamp();
            if (f % 4) for (var b = 0; b < a; b++) c[f + b >>> 2] |= (q[b >>> 2] >>> 24 - 8 * (b % 4) & 255) << 24 - 8 * ((f + b) % 4);else if (65535 < q.length) for (b = 0; b < a; b += 4) c[f + b >>> 2] = q[b >>> 2];else c.push.apply(c, q);
            this.sigBytes += a;
            return this;
          },
          clamp: function clamp() {
            var a = this.words,
              c = this.sigBytes;
            a[c >>> 2] &= 4294967295 << 32 - 8 * (c % 4);
            a.length = g.ceil(c / 4);
          },
          clone: function clone() {
            var a = k.clone.call(this);
            a.words = this.words.slice(0);
            return a;
          },
          random: function random(a) {
            for (var c = [], b = 0; b < a; b += 4) c.push(4294967296 * g.random() | 0);
            return new p.init(c, a);
          }
        }),
        b = e.enc = {},
        n = b.Hex = {
          stringify: function stringify(a) {
            var c = a.words;
            a = a.sigBytes;
            for (var b = [], f = 0; f < a; f++) {
              var d = c[f >>> 2] >>> 24 - 8 * (f % 4) & 255;
              b.push((d >>> 4).toString(16));
              b.push((d & 15).toString(16));
            }
            return b.join("");
          },
          parse: function parse(a) {
            for (var c = a.length, b = [], f = 0; f < c; f += 2) b[f >>> 3] |= parseInt(a.substr(f, 2), 16) << 24 - 4 * (f % 8);
            return new p.init(b, c / 2);
          }
        },
        j = b.Latin1 = {
          stringify: function stringify(a) {
            var c = a.words;
            a = a.sigBytes;
            for (var b = [], f = 0; f < a; f++) b.push(String.fromCharCode(c[f >>> 2] >>> 24 - 8 * (f % 4) & 255));
            return b.join("");
          },
          parse: function parse(a) {
            for (var c = a.length, b = [], f = 0; f < c; f++) b[f >>> 2] |= (a.charCodeAt(f) & 255) << 24 - 8 * (f % 4);
            return new p.init(b, c);
          }
        },
        h = b.Utf8 = {
          stringify: function stringify(a) {
            try {
              return decodeURIComponent(escape(j.stringify(a)));
            } catch (c) {
              throw Error("Malformed UTF-8 data");
            }
          },
          parse: function parse(a) {
            return j.parse(unescape(encodeURIComponent(a)));
          }
        },
        r = d.BufferedBlockAlgorithm = k.extend({
          reset: function reset() {
            this._data = new p.init();
            this._nDataBytes = 0;
          },
          _append: function _append(a) {
            "string" == typeof a && (a = h.parse(a));
            this._data.concat(a);
            this._nDataBytes += a.sigBytes;
          },
          _process: function _process(a) {
            var c = this._data,
              b = c.words,
              f = c.sigBytes,
              d = this.blockSize,
              e = f / (4 * d),
              e = a ? g.ceil(e) : g.max((e | 0) - this._minBufferSize, 0);
            a = e * d;
            f = g.min(4 * a, f);
            if (a) {
              for (var k = 0; k < a; k += d) this._doProcessBlock(b, k);
              k = b.splice(0, a);
              c.sigBytes -= f;
            }
            return new p.init(k, f);
          },
          clone: function clone() {
            var a = k.clone.call(this);
            a._data = this._data.clone();
            return a;
          },
          _minBufferSize: 0
        });
      d.Hasher = r.extend({
        cfg: k.extend(),
        init: function init(a) {
          this.cfg = this.cfg.extend(a);
          this.reset();
        },
        reset: function reset() {
          r.reset.call(this);
          this._doReset();
        },
        update: function update(a) {
          this._append(a);
          this._process();
          return this;
        },
        finalize: function finalize(a) {
          a && this._append(a);
          return this._doFinalize();
        },
        blockSize: 16,
        _createHelper: function _createHelper(a) {
          return function (b, d) {
            return new a.init(d).finalize(b);
          };
        },
        _createHmacHelper: function _createHmacHelper(a) {
          return function (b, d) {
            return new s.HMAC.init(a, d).finalize(b);
          };
        }
      });
      var s = e.algo = {};
      return e;
    }(Math);
    (function () {
      var g = CryptoJS,
        l = g.lib,
        e = l.WordArray,
        d = l.Hasher,
        m = [],
        l = g.algo.SHA1 = d.extend({
          _doReset: function _doReset() {
            this._hash = new e.init([1732584193, 4023233417, 2562383102, 271733878, 3285377520]);
          },
          _doProcessBlock: function _doProcessBlock(d, e) {
            for (var b = this._hash.words, n = b[0], j = b[1], h = b[2], g = b[3], l = b[4], a = 0; 80 > a; a++) {
              if (16 > a) m[a] = d[e + a] | 0;else {
                var c = m[a - 3] ^ m[a - 8] ^ m[a - 14] ^ m[a - 16];
                m[a] = c << 1 | c >>> 31;
              }
              c = (n << 5 | n >>> 27) + l + m[a];
              c = 20 > a ? c + ((j & h | ~j & g) + 1518500249) : 40 > a ? c + ((j ^ h ^ g) + 1859775393) : 60 > a ? c + ((j & h | j & g | h & g) - 1894007588) : c + ((j ^ h ^ g) - 899497514);
              l = g;
              g = h;
              h = j << 30 | j >>> 2;
              j = n;
              n = c;
            }
            b[0] = b[0] + n | 0;
            b[1] = b[1] + j | 0;
            b[2] = b[2] + h | 0;
            b[3] = b[3] + g | 0;
            b[4] = b[4] + l | 0;
          },
          _doFinalize: function _doFinalize() {
            var d = this._data,
              e = d.words,
              b = 8 * this._nDataBytes,
              g = 8 * d.sigBytes;
            e[g >>> 5] |= 128 << 24 - g % 32;
            e[(g + 64 >>> 9 << 4) + 14] = Math.floor(b / 4294967296);
            e[(g + 64 >>> 9 << 4) + 15] = b;
            d.sigBytes = 4 * e.length;
            this._process();
            return this._hash;
          },
          clone: function clone() {
            var e = d.clone.call(this);
            e._hash = this._hash.clone();
            return e;
          }
        });
      g.SHA1 = d._createHelper(l);
      g.HmacSHA1 = d._createHmacHelper(l);
    })();
    (function () {
      var g = CryptoJS,
        l = g.enc.Utf8;
      g.algo.HMAC = g.lib.Base.extend({
        init: function init(e, d) {
          e = this._hasher = new e.init();
          "string" == typeof d && (d = l.parse(d));
          var g = e.blockSize,
            k = 4 * g;
          d.sigBytes > k && (d = e.finalize(d));
          d.clamp();
          for (var p = this._oKey = d.clone(), b = this._iKey = d.clone(), n = p.words, j = b.words, h = 0; h < g; h++) n[h] ^= 1549556828, j[h] ^= 909522486;
          p.sigBytes = b.sigBytes = k;
          this.reset();
        },
        reset: function reset() {
          var e = this._hasher;
          e.reset();
          e.update(this._iKey);
        },
        update: function update(e) {
          this._hasher.update(e);
          return this;
        },
        finalize: function finalize(e) {
          var d = this._hasher;
          e = d.finalize(e);
          d.reset();
          return d.finalize(this._oKey.clone().concat(e));
        }
      });
    })();
    (function () {
      // Shortcuts
      var C = CryptoJS;
      var C_lib = C.lib;
      var WordArray = C_lib.WordArray;
      var C_enc = C.enc;

      /**
       * Base64 encoding strategy.
       */
      var Base64 = C_enc.Base64 = {
        /**
         * Converts a word array to a Base64 string.
         *
         * @param {WordArray} wordArray The word array.
         *
         * @return {string} The Base64 string.
         *
         * @static
         *
         * @example
         *
         *     var base64String = CryptoJS.enc.Base64.stringify(wordArray);
         */
        stringify: function stringify(wordArray) {
          // Shortcuts
          var words = wordArray.words;
          var sigBytes = wordArray.sigBytes;
          var map = this._map;

          // Clamp excess bits
          wordArray.clamp();

          // Convert
          var base64Chars = [];
          for (var i = 0; i < sigBytes; i += 3) {
            var byte1 = words[i >>> 2] >>> 24 - i % 4 * 8 & 0xff;
            var byte2 = words[i + 1 >>> 2] >>> 24 - (i + 1) % 4 * 8 & 0xff;
            var byte3 = words[i + 2 >>> 2] >>> 24 - (i + 2) % 4 * 8 & 0xff;
            var triplet = byte1 << 16 | byte2 << 8 | byte3;
            for (var j = 0; j < 4 && i + j * 0.75 < sigBytes; j++) {
              base64Chars.push(map.charAt(triplet >>> 6 * (3 - j) & 0x3f));
            }
          }

          // Add padding
          var paddingChar = map.charAt(64);
          if (paddingChar) {
            while (base64Chars.length % 4) {
              base64Chars.push(paddingChar);
            }
          }
          return base64Chars.join('');
        },
        /**
         * Converts a Base64 string to a word array.
         *
         * @param {string} base64Str The Base64 string.
         *
         * @return {WordArray} The word array.
         *
         * @static
         *
         * @example
         *
         *     var wordArray = CryptoJS.enc.Base64.parse(base64String);
         */
        parse: function parse(base64Str) {
          // Shortcuts
          var base64StrLength = base64Str.length;
          var map = this._map;

          // Ignore padding
          var paddingChar = map.charAt(64);
          if (paddingChar) {
            var paddingIndex = base64Str.indexOf(paddingChar);
            if (paddingIndex != -1) {
              base64StrLength = paddingIndex;
            }
          }

          // Convert
          var words = [];
          var nBytes = 0;
          for (var i = 0; i < base64StrLength; i++) {
            if (i % 4) {
              var bits1 = map.indexOf(base64Str.charAt(i - 1)) << i % 4 * 2;
              var bits2 = map.indexOf(base64Str.charAt(i)) >>> 6 - i % 4 * 2;
              words[nBytes >>> 2] |= (bits1 | bits2) << 24 - nBytes % 4 * 8;
              nBytes++;
            }
          }
          return WordArray.create(words, nBytes);
        },
        _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
      };
    })();
    module.exports = CryptoJS;

    /***/ }),

    /***/ "./lib/md5.js":
    /*!********************!*\
      !*** ./lib/md5.js ***!
      \********************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    /* WEBPACK VAR INJECTION */(function(module) {var __WEBPACK_AMD_DEFINE_RESULT__;function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
    /* https://github.com/emn178/js-md5 */
    (function () {
      'use strict';

      var ERROR = 'input is invalid type';
      var WINDOW = (typeof window === "undefined" ? "undefined" : _typeof(window)) === 'object';
      var root = WINDOW ? window : {};
      if (root.JS_MD5_NO_WINDOW) {
        WINDOW = false;
      }
      var WEB_WORKER = !WINDOW && (typeof self === "undefined" ? "undefined" : _typeof(self)) === 'object';
      if (WEB_WORKER) {
        root = self;
      }
      var COMMON_JS = !root.JS_MD5_NO_COMMON_JS && ( false ? undefined : _typeof(module)) === 'object' && module.exports;
      var AMD =  true && __webpack_require__(/*! !webpack amd options */ "./node_modules/webpack/buildin/amd-options.js");
      var ARRAY_BUFFER = !root.JS_MD5_NO_ARRAY_BUFFER && typeof ArrayBuffer !== 'undefined';
      var HEX_CHARS = '0123456789abcdef'.split('');
      var EXTRA = [128, 32768, 8388608, -2147483648];
      var SHIFT = [0, 8, 16, 24];
      var OUTPUT_TYPES = ['hex', 'array', 'digest', 'buffer', 'arrayBuffer', 'base64'];
      var BASE64_ENCODE_CHAR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');
      var blocks = [],
        buffer8;
      if (ARRAY_BUFFER) {
        var buffer = new ArrayBuffer(68);
        buffer8 = new Uint8Array(buffer);
        blocks = new Uint32Array(buffer);
      }
      if (root.JS_MD5_NO_NODE_JS || !Array.isArray) {
        Array.isArray = function (obj) {
          return Object.prototype.toString.call(obj) === '[object Array]';
        };
      }
      if (ARRAY_BUFFER && (root.JS_MD5_NO_ARRAY_BUFFER_IS_VIEW || !ArrayBuffer.isView)) {
        ArrayBuffer.isView = function (obj) {
          return _typeof(obj) === 'object' && obj.buffer && obj.buffer.constructor === ArrayBuffer;
        };
      }

      /**
       * @method hex
       * @memberof md5
       * @description Output hash as hex string
       * @param {String|Array|Uint8Array|ArrayBuffer} message message to hash
       * @returns {String} Hex string
       * @example
       * md5.hex('The quick brown fox jumps over the lazy dog');
       * // equal to
       * md5('The quick brown fox jumps over the lazy dog');
       */
      /**
       * @method digest
       * @memberof md5
       * @description Output hash as bytes array
       * @param {String|Array|Uint8Array|ArrayBuffer} message message to hash
       * @returns {Array} Bytes array
       * @example
       * md5.digest('The quick brown fox jumps over the lazy dog');
       */
      /**
       * @method array
       * @memberof md5
       * @description Output hash as bytes array
       * @param {String|Array|Uint8Array|ArrayBuffer} message message to hash
       * @returns {Array} Bytes array
       * @example
       * md5.array('The quick brown fox jumps over the lazy dog');
       */
      /**
       * @method arrayBuffer
       * @memberof md5
       * @description Output hash as ArrayBuffer
       * @param {String|Array|Uint8Array|ArrayBuffer} message message to hash
       * @returns {ArrayBuffer} ArrayBuffer
       * @example
       * md5.arrayBuffer('The quick brown fox jumps over the lazy dog');
       */
      /**
       * @method buffer
       * @deprecated This maybe confuse with Buffer in node.js. Please use arrayBuffer instead.
       * @memberof md5
       * @description Output hash as ArrayBuffer
       * @param {String|Array|Uint8Array|ArrayBuffer} message message to hash
       * @returns {ArrayBuffer} ArrayBuffer
       * @example
       * md5.buffer('The quick brown fox jumps over the lazy dog');
       */
      /**
       * @method base64
       * @memberof md5
       * @description Output hash as base64 string
       * @param {String|Array|Uint8Array|ArrayBuffer} message message to hash
       * @returns {String} base64 string
       * @example
       * md5.base64('The quick brown fox jumps over the lazy dog');
       */
      var createOutputMethod = function createOutputMethod(outputType) {
        return function (message) {
          return new Md5(true).update(message)[outputType]();
        };
      };

      /**
       * @method create
       * @memberof md5
       * @description Create Md5 object
       * @returns {Md5} Md5 object.
       * @example
       * var hash = md5.create();
       */
      /**
       * @method update
       * @memberof md5
       * @description Create and update Md5 object
       * @param {String|Array|Uint8Array|ArrayBuffer} message message to hash
       * @returns {Md5} Md5 object.
       * @example
       * var hash = md5.update('The quick brown fox jumps over the lazy dog');
       * // equal to
       * var hash = md5.create();
       * hash.update('The quick brown fox jumps over the lazy dog');
       */
      var createMethod = function createMethod() {
        var method = createOutputMethod('hex');
        method.getCtx = method.create = function () {
          return new Md5();
        };
        method.update = function (message) {
          return method.create().update(message);
        };
        for (var i = 0; i < OUTPUT_TYPES.length; ++i) {
          var type = OUTPUT_TYPES[i];
          method[type] = createOutputMethod(type);
        }
        return method;
      };

      /**
       * Md5 class
       * @class Md5
       * @description This is internal class.
       * @see {@link md5.create}
       */
      function Md5(sharedMemory) {
        if (sharedMemory) {
          blocks[0] = blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
          this.blocks = blocks;
          this.buffer8 = buffer8;
        } else {
          if (ARRAY_BUFFER) {
            var buffer = new ArrayBuffer(68);
            this.buffer8 = new Uint8Array(buffer);
            this.blocks = new Uint32Array(buffer);
          } else {
            this.blocks = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
          }
        }
        this.h0 = this.h1 = this.h2 = this.h3 = this.start = this.bytes = this.hBytes = 0;
        this.finalized = this.hashed = false;
        this.first = true;
      }

      /**
       * @method update
       * @memberof Md5
       * @instance
       * @description Update hash
       * @param {String|Array|Uint8Array|ArrayBuffer} message message to hash
       * @returns {Md5} Md5 object.
       * @see {@link md5.update}
       */
      Md5.prototype.update = function (message) {
        if (this.finalized) {
          return;
        }
        var notString,
          type = _typeof(message);
        if (type !== 'string') {
          if (type === 'object') {
            if (message === null) {
              throw ERROR;
            } else if (ARRAY_BUFFER && (message.constructor === ArrayBuffer || message.constructor.name === 'ArrayBuffer')) {
              message = new Uint8Array(message);
            } else if (!Array.isArray(message)) {
              if (!ARRAY_BUFFER || !ArrayBuffer.isView(message)) {
                throw ERROR;
              }
            }
          } else {
            throw ERROR;
          }
          notString = true;
        }
        var code,
          index = 0,
          i,
          length = message.length,
          blocks = this.blocks;
        var buffer8 = this.buffer8;
        while (index < length) {
          if (this.hashed) {
            this.hashed = false;
            blocks[0] = blocks[16];
            blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
          }
          if (notString) {
            if (ARRAY_BUFFER) {
              for (i = this.start; index < length && i < 64; ++index) {
                buffer8[i++] = message[index];
              }
            } else {
              for (i = this.start; index < length && i < 64; ++index) {
                blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
              }
            }
          } else {
            if (ARRAY_BUFFER) {
              for (i = this.start; index < length && i < 64; ++index) {
                code = message.charCodeAt(index);
                if (code < 0x80) {
                  buffer8[i++] = code;
                } else if (code < 0x800) {
                  buffer8[i++] = 0xc0 | code >> 6;
                  buffer8[i++] = 0x80 | code & 0x3f;
                } else if (code < 0xd800 || code >= 0xe000) {
                  buffer8[i++] = 0xe0 | code >> 12;
                  buffer8[i++] = 0x80 | code >> 6 & 0x3f;
                  buffer8[i++] = 0x80 | code & 0x3f;
                } else {
                  code = 0x10000 + ((code & 0x3ff) << 10 | message.charCodeAt(++index) & 0x3ff);
                  buffer8[i++] = 0xf0 | code >> 18;
                  buffer8[i++] = 0x80 | code >> 12 & 0x3f;
                  buffer8[i++] = 0x80 | code >> 6 & 0x3f;
                  buffer8[i++] = 0x80 | code & 0x3f;
                }
              }
            } else {
              for (i = this.start; index < length && i < 64; ++index) {
                code = message.charCodeAt(index);
                if (code < 0x80) {
                  blocks[i >> 2] |= code << SHIFT[i++ & 3];
                } else if (code < 0x800) {
                  blocks[i >> 2] |= (0xc0 | code >> 6) << SHIFT[i++ & 3];
                  blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[i++ & 3];
                } else if (code < 0xd800 || code >= 0xe000) {
                  blocks[i >> 2] |= (0xe0 | code >> 12) << SHIFT[i++ & 3];
                  blocks[i >> 2] |= (0x80 | code >> 6 & 0x3f) << SHIFT[i++ & 3];
                  blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[i++ & 3];
                } else {
                  code = 0x10000 + ((code & 0x3ff) << 10 | message.charCodeAt(++index) & 0x3ff);
                  blocks[i >> 2] |= (0xf0 | code >> 18) << SHIFT[i++ & 3];
                  blocks[i >> 2] |= (0x80 | code >> 12 & 0x3f) << SHIFT[i++ & 3];
                  blocks[i >> 2] |= (0x80 | code >> 6 & 0x3f) << SHIFT[i++ & 3];
                  blocks[i >> 2] |= (0x80 | code & 0x3f) << SHIFT[i++ & 3];
                }
              }
            }
          }
          this.lastByteIndex = i;
          this.bytes += i - this.start;
          if (i >= 64) {
            this.start = i - 64;
            this.hash();
            this.hashed = true;
          } else {
            this.start = i;
          }
        }
        if (this.bytes > 4294967295) {
          this.hBytes += this.bytes / 4294967296 << 0;
          this.bytes = this.bytes % 4294967296;
        }
        return this;
      };
      Md5.prototype.finalize = function () {
        if (this.finalized) {
          return;
        }
        this.finalized = true;
        var blocks = this.blocks,
          i = this.lastByteIndex;
        blocks[i >> 2] |= EXTRA[i & 3];
        if (i >= 56) {
          if (!this.hashed) {
            this.hash();
          }
          blocks[0] = blocks[16];
          blocks[16] = blocks[1] = blocks[2] = blocks[3] = blocks[4] = blocks[5] = blocks[6] = blocks[7] = blocks[8] = blocks[9] = blocks[10] = blocks[11] = blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
        }
        blocks[14] = this.bytes << 3;
        blocks[15] = this.hBytes << 3 | this.bytes >>> 29;
        this.hash();
      };
      Md5.prototype.hash = function () {
        var a,
          b,
          c,
          d,
          bc,
          da,
          blocks = this.blocks;
        if (this.first) {
          a = blocks[0] - 680876937;
          a = (a << 7 | a >>> 25) - 271733879 << 0;
          d = (-1732584194 ^ a & 2004318071) + blocks[1] - 117830708;
          d = (d << 12 | d >>> 20) + a << 0;
          c = (-271733879 ^ d & (a ^ -271733879)) + blocks[2] - 1126478375;
          c = (c << 17 | c >>> 15) + d << 0;
          b = (a ^ c & (d ^ a)) + blocks[3] - 1316259209;
          b = (b << 22 | b >>> 10) + c << 0;
        } else {
          a = this.h0;
          b = this.h1;
          c = this.h2;
          d = this.h3;
          a += (d ^ b & (c ^ d)) + blocks[0] - 680876936;
          a = (a << 7 | a >>> 25) + b << 0;
          d += (c ^ a & (b ^ c)) + blocks[1] - 389564586;
          d = (d << 12 | d >>> 20) + a << 0;
          c += (b ^ d & (a ^ b)) + blocks[2] + 606105819;
          c = (c << 17 | c >>> 15) + d << 0;
          b += (a ^ c & (d ^ a)) + blocks[3] - 1044525330;
          b = (b << 22 | b >>> 10) + c << 0;
        }
        a += (d ^ b & (c ^ d)) + blocks[4] - 176418897;
        a = (a << 7 | a >>> 25) + b << 0;
        d += (c ^ a & (b ^ c)) + blocks[5] + 1200080426;
        d = (d << 12 | d >>> 20) + a << 0;
        c += (b ^ d & (a ^ b)) + blocks[6] - 1473231341;
        c = (c << 17 | c >>> 15) + d << 0;
        b += (a ^ c & (d ^ a)) + blocks[7] - 45705983;
        b = (b << 22 | b >>> 10) + c << 0;
        a += (d ^ b & (c ^ d)) + blocks[8] + 1770035416;
        a = (a << 7 | a >>> 25) + b << 0;
        d += (c ^ a & (b ^ c)) + blocks[9] - 1958414417;
        d = (d << 12 | d >>> 20) + a << 0;
        c += (b ^ d & (a ^ b)) + blocks[10] - 42063;
        c = (c << 17 | c >>> 15) + d << 0;
        b += (a ^ c & (d ^ a)) + blocks[11] - 1990404162;
        b = (b << 22 | b >>> 10) + c << 0;
        a += (d ^ b & (c ^ d)) + blocks[12] + 1804603682;
        a = (a << 7 | a >>> 25) + b << 0;
        d += (c ^ a & (b ^ c)) + blocks[13] - 40341101;
        d = (d << 12 | d >>> 20) + a << 0;
        c += (b ^ d & (a ^ b)) + blocks[14] - 1502002290;
        c = (c << 17 | c >>> 15) + d << 0;
        b += (a ^ c & (d ^ a)) + blocks[15] + 1236535329;
        b = (b << 22 | b >>> 10) + c << 0;
        a += (c ^ d & (b ^ c)) + blocks[1] - 165796510;
        a = (a << 5 | a >>> 27) + b << 0;
        d += (b ^ c & (a ^ b)) + blocks[6] - 1069501632;
        d = (d << 9 | d >>> 23) + a << 0;
        c += (a ^ b & (d ^ a)) + blocks[11] + 643717713;
        c = (c << 14 | c >>> 18) + d << 0;
        b += (d ^ a & (c ^ d)) + blocks[0] - 373897302;
        b = (b << 20 | b >>> 12) + c << 0;
        a += (c ^ d & (b ^ c)) + blocks[5] - 701558691;
        a = (a << 5 | a >>> 27) + b << 0;
        d += (b ^ c & (a ^ b)) + blocks[10] + 38016083;
        d = (d << 9 | d >>> 23) + a << 0;
        c += (a ^ b & (d ^ a)) + blocks[15] - 660478335;
        c = (c << 14 | c >>> 18) + d << 0;
        b += (d ^ a & (c ^ d)) + blocks[4] - 405537848;
        b = (b << 20 | b >>> 12) + c << 0;
        a += (c ^ d & (b ^ c)) + blocks[9] + 568446438;
        a = (a << 5 | a >>> 27) + b << 0;
        d += (b ^ c & (a ^ b)) + blocks[14] - 1019803690;
        d = (d << 9 | d >>> 23) + a << 0;
        c += (a ^ b & (d ^ a)) + blocks[3] - 187363961;
        c = (c << 14 | c >>> 18) + d << 0;
        b += (d ^ a & (c ^ d)) + blocks[8] + 1163531501;
        b = (b << 20 | b >>> 12) + c << 0;
        a += (c ^ d & (b ^ c)) + blocks[13] - 1444681467;
        a = (a << 5 | a >>> 27) + b << 0;
        d += (b ^ c & (a ^ b)) + blocks[2] - 51403784;
        d = (d << 9 | d >>> 23) + a << 0;
        c += (a ^ b & (d ^ a)) + blocks[7] + 1735328473;
        c = (c << 14 | c >>> 18) + d << 0;
        b += (d ^ a & (c ^ d)) + blocks[12] - 1926607734;
        b = (b << 20 | b >>> 12) + c << 0;
        bc = b ^ c;
        a += (bc ^ d) + blocks[5] - 378558;
        a = (a << 4 | a >>> 28) + b << 0;
        d += (bc ^ a) + blocks[8] - 2022574463;
        d = (d << 11 | d >>> 21) + a << 0;
        da = d ^ a;
        c += (da ^ b) + blocks[11] + 1839030562;
        c = (c << 16 | c >>> 16) + d << 0;
        b += (da ^ c) + blocks[14] - 35309556;
        b = (b << 23 | b >>> 9) + c << 0;
        bc = b ^ c;
        a += (bc ^ d) + blocks[1] - 1530992060;
        a = (a << 4 | a >>> 28) + b << 0;
        d += (bc ^ a) + blocks[4] + 1272893353;
        d = (d << 11 | d >>> 21) + a << 0;
        da = d ^ a;
        c += (da ^ b) + blocks[7] - 155497632;
        c = (c << 16 | c >>> 16) + d << 0;
        b += (da ^ c) + blocks[10] - 1094730640;
        b = (b << 23 | b >>> 9) + c << 0;
        bc = b ^ c;
        a += (bc ^ d) + blocks[13] + 681279174;
        a = (a << 4 | a >>> 28) + b << 0;
        d += (bc ^ a) + blocks[0] - 358537222;
        d = (d << 11 | d >>> 21) + a << 0;
        da = d ^ a;
        c += (da ^ b) + blocks[3] - 722521979;
        c = (c << 16 | c >>> 16) + d << 0;
        b += (da ^ c) + blocks[6] + 76029189;
        b = (b << 23 | b >>> 9) + c << 0;
        bc = b ^ c;
        a += (bc ^ d) + blocks[9] - 640364487;
        a = (a << 4 | a >>> 28) + b << 0;
        d += (bc ^ a) + blocks[12] - 421815835;
        d = (d << 11 | d >>> 21) + a << 0;
        da = d ^ a;
        c += (da ^ b) + blocks[15] + 530742520;
        c = (c << 16 | c >>> 16) + d << 0;
        b += (da ^ c) + blocks[2] - 995338651;
        b = (b << 23 | b >>> 9) + c << 0;
        a += (c ^ (b | ~d)) + blocks[0] - 198630844;
        a = (a << 6 | a >>> 26) + b << 0;
        d += (b ^ (a | ~c)) + blocks[7] + 1126891415;
        d = (d << 10 | d >>> 22) + a << 0;
        c += (a ^ (d | ~b)) + blocks[14] - 1416354905;
        c = (c << 15 | c >>> 17) + d << 0;
        b += (d ^ (c | ~a)) + blocks[5] - 57434055;
        b = (b << 21 | b >>> 11) + c << 0;
        a += (c ^ (b | ~d)) + blocks[12] + 1700485571;
        a = (a << 6 | a >>> 26) + b << 0;
        d += (b ^ (a | ~c)) + blocks[3] - 1894986606;
        d = (d << 10 | d >>> 22) + a << 0;
        c += (a ^ (d | ~b)) + blocks[10] - 1051523;
        c = (c << 15 | c >>> 17) + d << 0;
        b += (d ^ (c | ~a)) + blocks[1] - 2054922799;
        b = (b << 21 | b >>> 11) + c << 0;
        a += (c ^ (b | ~d)) + blocks[8] + 1873313359;
        a = (a << 6 | a >>> 26) + b << 0;
        d += (b ^ (a | ~c)) + blocks[15] - 30611744;
        d = (d << 10 | d >>> 22) + a << 0;
        c += (a ^ (d | ~b)) + blocks[6] - 1560198380;
        c = (c << 15 | c >>> 17) + d << 0;
        b += (d ^ (c | ~a)) + blocks[13] + 1309151649;
        b = (b << 21 | b >>> 11) + c << 0;
        a += (c ^ (b | ~d)) + blocks[4] - 145523070;
        a = (a << 6 | a >>> 26) + b << 0;
        d += (b ^ (a | ~c)) + blocks[11] - 1120210379;
        d = (d << 10 | d >>> 22) + a << 0;
        c += (a ^ (d | ~b)) + blocks[2] + 718787259;
        c = (c << 15 | c >>> 17) + d << 0;
        b += (d ^ (c | ~a)) + blocks[9] - 343485551;
        b = (b << 21 | b >>> 11) + c << 0;
        if (this.first) {
          this.h0 = a + 1732584193 << 0;
          this.h1 = b - 271733879 << 0;
          this.h2 = c - 1732584194 << 0;
          this.h3 = d + 271733878 << 0;
          this.first = false;
        } else {
          this.h0 = this.h0 + a << 0;
          this.h1 = this.h1 + b << 0;
          this.h2 = this.h2 + c << 0;
          this.h3 = this.h3 + d << 0;
        }
      };

      /**
       * @method hex
       * @memberof Md5
       * @instance
       * @description Output hash as hex string
       * @returns {String} Hex string
       * @see {@link md5.hex}
       * @example
       * hash.hex();
       */
      Md5.prototype.hex = function () {
        this.finalize();
        var h0 = this.h0,
          h1 = this.h1,
          h2 = this.h2,
          h3 = this.h3;
        return HEX_CHARS[h0 >> 4 & 0x0F] + HEX_CHARS[h0 & 0x0F] + HEX_CHARS[h0 >> 12 & 0x0F] + HEX_CHARS[h0 >> 8 & 0x0F] + HEX_CHARS[h0 >> 20 & 0x0F] + HEX_CHARS[h0 >> 16 & 0x0F] + HEX_CHARS[h0 >> 28 & 0x0F] + HEX_CHARS[h0 >> 24 & 0x0F] + HEX_CHARS[h1 >> 4 & 0x0F] + HEX_CHARS[h1 & 0x0F] + HEX_CHARS[h1 >> 12 & 0x0F] + HEX_CHARS[h1 >> 8 & 0x0F] + HEX_CHARS[h1 >> 20 & 0x0F] + HEX_CHARS[h1 >> 16 & 0x0F] + HEX_CHARS[h1 >> 28 & 0x0F] + HEX_CHARS[h1 >> 24 & 0x0F] + HEX_CHARS[h2 >> 4 & 0x0F] + HEX_CHARS[h2 & 0x0F] + HEX_CHARS[h2 >> 12 & 0x0F] + HEX_CHARS[h2 >> 8 & 0x0F] + HEX_CHARS[h2 >> 20 & 0x0F] + HEX_CHARS[h2 >> 16 & 0x0F] + HEX_CHARS[h2 >> 28 & 0x0F] + HEX_CHARS[h2 >> 24 & 0x0F] + HEX_CHARS[h3 >> 4 & 0x0F] + HEX_CHARS[h3 & 0x0F] + HEX_CHARS[h3 >> 12 & 0x0F] + HEX_CHARS[h3 >> 8 & 0x0F] + HEX_CHARS[h3 >> 20 & 0x0F] + HEX_CHARS[h3 >> 16 & 0x0F] + HEX_CHARS[h3 >> 28 & 0x0F] + HEX_CHARS[h3 >> 24 & 0x0F];
      };

      /**
       * @method toString
       * @memberof Md5
       * @instance
       * @description Output hash as hex string
       * @returns {String} Hex string
       * @see {@link md5.hex}
       * @example
       * hash.toString();
       */
      Md5.prototype.toString = Md5.prototype.hex;

      /**
       * @method digest
       * @memberof Md5
       * @instance
       * @description Output hash as bytes array
       * @returns {Array} Bytes array
       * @see {@link md5.digest}
       * @example
       * hash.digest();
       */
      Md5.prototype.digest = function () {
        this.finalize();
        var h0 = this.h0,
          h1 = this.h1,
          h2 = this.h2,
          h3 = this.h3;
        return [h0 & 0xFF, h0 >> 8 & 0xFF, h0 >> 16 & 0xFF, h0 >> 24 & 0xFF, h1 & 0xFF, h1 >> 8 & 0xFF, h1 >> 16 & 0xFF, h1 >> 24 & 0xFF, h2 & 0xFF, h2 >> 8 & 0xFF, h2 >> 16 & 0xFF, h2 >> 24 & 0xFF, h3 & 0xFF, h3 >> 8 & 0xFF, h3 >> 16 & 0xFF, h3 >> 24 & 0xFF];
      };

      /**
       * @method array
       * @memberof Md5
       * @instance
       * @description Output hash as bytes array
       * @returns {Array} Bytes array
       * @see {@link md5.array}
       * @example
       * hash.array();
       */
      Md5.prototype.array = Md5.prototype.digest;

      /**
       * @method arrayBuffer
       * @memberof Md5
       * @instance
       * @description Output hash as ArrayBuffer
       * @returns {ArrayBuffer} ArrayBuffer
       * @see {@link md5.arrayBuffer}
       * @example
       * hash.arrayBuffer();
       */
      Md5.prototype.arrayBuffer = function () {
        this.finalize();
        var buffer = new ArrayBuffer(16);
        var blocks = new Uint32Array(buffer);
        blocks[0] = this.h0;
        blocks[1] = this.h1;
        blocks[2] = this.h2;
        blocks[3] = this.h3;
        return buffer;
      };

      /**
       * @method buffer
       * @deprecated This maybe confuse with Buffer in node.js. Please use arrayBuffer instead.
       * @memberof Md5
       * @instance
       * @description Output hash as ArrayBuffer
       * @returns {ArrayBuffer} ArrayBuffer
       * @see {@link md5.buffer}
       * @example
       * hash.buffer();
       */
      Md5.prototype.buffer = Md5.prototype.arrayBuffer;

      /**
       * @method base64
       * @memberof Md5
       * @instance
       * @description Output hash as base64 string
       * @returns {String} base64 string
       * @see {@link md5.base64}
       * @example
       * hash.base64();
       */
      Md5.prototype.base64 = function () {
        var v1,
          v2,
          v3,
          base64Str = '',
          bytes = this.array();
        for (var i = 0; i < 15;) {
          v1 = bytes[i++];
          v2 = bytes[i++];
          v3 = bytes[i++];
          base64Str += BASE64_ENCODE_CHAR[v1 >>> 2] + BASE64_ENCODE_CHAR[(v1 << 4 | v2 >>> 4) & 63] + BASE64_ENCODE_CHAR[(v2 << 2 | v3 >>> 6) & 63] + BASE64_ENCODE_CHAR[v3 & 63];
        }
        v1 = bytes[i];
        base64Str += BASE64_ENCODE_CHAR[v1 >>> 2] + BASE64_ENCODE_CHAR[v1 << 4 & 63] + '==';
        return base64Str;
      };
      var exports = createMethod();
      if (COMMON_JS) {
        module.exports = exports;
      } else {
        /**
         * @method md5
         * @description Md5 hash function, export to global in browsers.
         * @param {String|Array|Uint8Array|ArrayBuffer} message message to hash
         * @returns {String} md5 hashes
         * @example
         * md5(''); // d41d8cd98f00b204e9800998ecf8427e
         * md5('The quick brown fox jumps over the lazy dog'); // 9e107d9d372bb6826bd81d3542a419d6
         * md5('The quick brown fox jumps over the lazy dog.'); // e4d909c290d0fb1ca068ffaddf22cbd0
         *
         * // It also supports UTF-8 encoding
         * md5('中文'); // a7bac2239fcdcb3a067903d8077c4a07
         *
         * // It also supports byte `Array`, `Uint8Array`, `ArrayBuffer`
         * md5([]); // d41d8cd98f00b204e9800998ecf8427e
         * md5(new Uint8Array([])); // d41d8cd98f00b204e9800998ecf8427e
         */
        root.md5 = exports;
        if (AMD) {
          !(__WEBPACK_AMD_DEFINE_RESULT__ = (function () {
            return exports;
          }).call(exports, __webpack_require__, exports, module),
    				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
        }
      }
    })();
    /* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../node_modules/webpack/buildin/module.js */ "./node_modules/webpack/buildin/module.js")(module)))

    /***/ }),

    /***/ "./lib/request.js":
    /*!************************!*\
      !*** ./lib/request.js ***!
      \************************/
    /*! no static exports found */
    /***/ (function(module, exports) {

    function camSafeUrlEncode(str) {
      return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A');
    }
    function getObjectKeys(obj, forKey) {
      var list = [];
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          list.push(forKey ? camSafeUrlEncode(key).toLowerCase() : key);
        }
      }
      return list.sort(function (a, b) {
        a = a.toLowerCase();
        b = b.toLowerCase();
        return a === b ? 0 : a > b ? 1 : -1;
      });
    }
    ;
    var obj2str = function obj2str(obj, lowerCaseKey) {
      var i, key, val;
      var list = [];
      var keyList = getObjectKeys(obj);
      for (i = 0; i < keyList.length; i++) {
        key = keyList[i];
        val = obj[key] === undefined || obj[key] === null ? '' : '' + obj[key];
        key = lowerCaseKey ? camSafeUrlEncode(key).toLowerCase() : camSafeUrlEncode(key);
        val = camSafeUrlEncode(val) || '';
        list.push(key + '=' + val);
      }
      return list.join('&');
    };
    var request = function request(params, callback) {
      var filePath = params.filePath;
      var headers = params.headers || {};
      var url = params.url || params.Url;
      var method = params.method;
      var onProgress = params.onProgress;
      var httpDNSServiceId = params.httpDNSServiceId;
      var requestTask;
      var cb = function cb(err, response) {
        var H = response.header;
        var headers = {};
        if (H) for (var key in H) {
          if (H.hasOwnProperty(key)) headers[key.toLowerCase()] = H[key];
        }
        callback(err, {
          statusCode: response.statusCode,
          headers: headers
        }, response.data);
      };
      if (filePath) {
        var fileKey;
        var m = url.match(/^(https?:\/\/[^/]+\/)([^/]*\/?)(.*)$/);
        if (params.pathStyle) {
          fileKey = decodeURIComponent(m[3] || '');
          url = m[1] + m[2];
        } else {
          fileKey = decodeURIComponent(m[2] + m[3] || '');
          url = m[1];
        }

        // 整理 postObject 参数
        var formData = {
          'key': fileKey,
          'success_action_status': 200,
          'Signature': headers.Authorization
        };
        var headerKeys = ['Cache-Control', 'Content-Type', 'Content-Disposition', 'Content-Encoding', 'Expires', 'x-cos-storage-class', 'x-cos-security-token', 'x-ci-security-token'];
        for (var i in params.headers) {
          if (params.headers.hasOwnProperty(i) && (i.indexOf('x-cos-meta-') > -1 || headerKeys.indexOf(i) > -1)) {
            formData[i] = params.headers[i];
          }
        }
        headers['x-cos-acl'] && (formData.acl = headers['x-cos-acl']);
        !formData['Content-Type'] && (formData['Content-Type'] = '');
        requestTask = wx.uploadFile({
          url: url,
          method: method,
          name: 'file',
          header: headers,
          filePath: filePath,
          formData: formData,
          timeout: params.timeout,
          success: function success(response) {
            cb(null, response);
          },
          fail: function fail(response) {
            cb(response.errMsg, response);
          }
        });
        requestTask.onProgressUpdate(function (res) {
          onProgress && onProgress({
            loaded: res.totalBytesSent,
            total: res.totalBytesExpectedToSend,
            progress: res.progress / 100
          });
        });
      } else {
        var qsStr = params.qs && obj2str(params.qs) || '';
        if (qsStr) {
          url += (url.indexOf('?') > -1 ? '&' : '?') + qsStr;
        }
        headers['Content-Length'] && delete headers['Content-Length'];
        var requestParams = {
          url: url,
          method: method,
          header: headers,
          dataType: 'text',
          data: params.body,
          responseType: params.dataType || 'text',
          timeout: params.timeout,
          redirect: 'manual',
          success: function success(response) {
            cb(null, response);
          },
          fail: function fail(response) {
            cb(response.errMsg, response);
          }
        };
        if (httpDNSServiceId) {
          Object.assign(requestParams, {
            enableHttpDNS: true,
            httpDNSServiceId: httpDNSServiceId
          });
        }
        requestTask = wx.request(requestParams);
      }
      return requestTask;
    };
    module.exports = request;

    /***/ }),

    /***/ "./node_modules/fast-xml-parser/src/fxp.js":
    /*!*************************************************!*\
      !*** ./node_modules/fast-xml-parser/src/fxp.js ***!
      \*************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    "use strict";


    const validator = __webpack_require__(/*! ./validator */ "./node_modules/fast-xml-parser/src/validator.js");
    const XMLParser = __webpack_require__(/*! ./xmlparser/XMLParser */ "./node_modules/fast-xml-parser/src/xmlparser/XMLParser.js");
    const XMLBuilder = __webpack_require__(/*! ./xmlbuilder/json2xml */ "./node_modules/fast-xml-parser/src/xmlbuilder/json2xml.js");

    module.exports = {
      XMLParser: XMLParser,
      XMLValidator: validator,
      XMLBuilder: XMLBuilder
    }

    /***/ }),

    /***/ "./node_modules/fast-xml-parser/src/ignoreAttributes.js":
    /*!**************************************************************!*\
      !*** ./node_modules/fast-xml-parser/src/ignoreAttributes.js ***!
      \**************************************************************/
    /*! no static exports found */
    /***/ (function(module, exports) {

    function getIgnoreAttributesFn(ignoreAttributes) {
        if (typeof ignoreAttributes === 'function') {
            return ignoreAttributes
        }
        if (Array.isArray(ignoreAttributes)) {
            return (attrName) => {
                for (const pattern of ignoreAttributes) {
                    if (typeof pattern === 'string' && attrName === pattern) {
                        return true
                    }
                    if (pattern instanceof RegExp && pattern.test(attrName)) {
                        return true
                    }
                }
            }
        }
        return () => false
    }

    module.exports = getIgnoreAttributesFn

    /***/ }),

    /***/ "./node_modules/fast-xml-parser/src/util.js":
    /*!**************************************************!*\
      !*** ./node_modules/fast-xml-parser/src/util.js ***!
      \**************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    "use strict";


    const nameStartChar = ':A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD';
    const nameChar = nameStartChar + '\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040';
    const nameRegexp = '[' + nameStartChar + '][' + nameChar + ']*'
    const regexName = new RegExp('^' + nameRegexp + '$');

    const getAllMatches = function(string, regex) {
      const matches = [];
      let match = regex.exec(string);
      while (match) {
        const allmatches = [];
        allmatches.startIndex = regex.lastIndex - match[0].length;
        const len = match.length;
        for (let index = 0; index < len; index++) {
          allmatches.push(match[index]);
        }
        matches.push(allmatches);
        match = regex.exec(string);
      }
      return matches;
    };

    const isName = function(string) {
      const match = regexName.exec(string);
      return !(match === null || typeof match === 'undefined');
    };

    exports.isExist = function(v) {
      return typeof v !== 'undefined';
    };

    exports.isEmptyObject = function(obj) {
      return Object.keys(obj).length === 0;
    };

    /**
     * Copy all the properties of a into b.
     * @param {*} target
     * @param {*} a
     */
    exports.merge = function(target, a, arrayMode) {
      if (a) {
        const keys = Object.keys(a); // will return an array of own properties
        const len = keys.length; //don't make it inline
        for (let i = 0; i < len; i++) {
          if (arrayMode === 'strict') {
            target[keys[i]] = [ a[keys[i]] ];
          } else {
            target[keys[i]] = a[keys[i]];
          }
        }
      }
    };
    /* exports.merge =function (b,a){
      return Object.assign(b,a);
    } */

    exports.getValue = function(v) {
      if (exports.isExist(v)) {
        return v;
      } else {
        return '';
      }
    };

    // const fakeCall = function(a) {return a;};
    // const fakeCallNoReturn = function() {};

    exports.isName = isName;
    exports.getAllMatches = getAllMatches;
    exports.nameRegexp = nameRegexp;


    /***/ }),

    /***/ "./node_modules/fast-xml-parser/src/validator.js":
    /*!*******************************************************!*\
      !*** ./node_modules/fast-xml-parser/src/validator.js ***!
      \*******************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    "use strict";


    const util = __webpack_require__(/*! ./util */ "./node_modules/fast-xml-parser/src/util.js");

    const defaultOptions = {
      allowBooleanAttributes: false, //A tag can have attributes without any value
      unpairedTags: []
    };

    //const tagsPattern = new RegExp("<\\/?([\\w:\\-_\.]+)\\s*\/?>","g");
    exports.validate = function (xmlData, options) {
      options = Object.assign({}, defaultOptions, options);

      //xmlData = xmlData.replace(/(\r\n|\n|\r)/gm,"");//make it single line
      //xmlData = xmlData.replace(/(^\s*<\?xml.*?\?>)/g,"");//Remove XML starting tag
      //xmlData = xmlData.replace(/(<!DOCTYPE[\s\w\"\.\/\-\:]+(\[.*\])*\s*>)/g,"");//Remove DOCTYPE
      const tags = [];
      let tagFound = false;

      //indicates that the root tag has been closed (aka. depth 0 has been reached)
      let reachedRoot = false;

      if (xmlData[0] === '\ufeff') {
        // check for byte order mark (BOM)
        xmlData = xmlData.substr(1);
      }
      
      for (let i = 0; i < xmlData.length; i++) {

        if (xmlData[i] === '<' && xmlData[i+1] === '?') {
          i+=2;
          i = readPI(xmlData,i);
          if (i.err) return i;
        }else if (xmlData[i] === '<') {
          //starting of tag
          //read until you reach to '>' avoiding any '>' in attribute value
          let tagStartPos = i;
          i++;
          
          if (xmlData[i] === '!') {
            i = readCommentAndCDATA(xmlData, i);
            continue;
          } else {
            let closingTag = false;
            if (xmlData[i] === '/') {
              //closing tag
              closingTag = true;
              i++;
            }
            //read tagname
            let tagName = '';
            for (; i < xmlData.length &&
              xmlData[i] !== '>' &&
              xmlData[i] !== ' ' &&
              xmlData[i] !== '\t' &&
              xmlData[i] !== '\n' &&
              xmlData[i] !== '\r'; i++
            ) {
              tagName += xmlData[i];
            }
            tagName = tagName.trim();
            //console.log(tagName);

            if (tagName[tagName.length - 1] === '/') {
              //self closing tag without attributes
              tagName = tagName.substring(0, tagName.length - 1);
              //continue;
              i--;
            }
            if (!validateTagName(tagName)) {
              let msg;
              if (tagName.trim().length === 0) {
                msg = "Invalid space after '<'.";
              } else {
                msg = "Tag '"+tagName+"' is an invalid name.";
              }
              return getErrorObject('InvalidTag', msg, getLineNumberForPosition(xmlData, i));
            }

            const result = readAttributeStr(xmlData, i);
            if (result === false) {
              return getErrorObject('InvalidAttr', "Attributes for '"+tagName+"' have open quote.", getLineNumberForPosition(xmlData, i));
            }
            let attrStr = result.value;
            i = result.index;

            if (attrStr[attrStr.length - 1] === '/') {
              //self closing tag
              const attrStrStart = i - attrStr.length;
              attrStr = attrStr.substring(0, attrStr.length - 1);
              const isValid = validateAttributeString(attrStr, options);
              if (isValid === true) {
                tagFound = true;
                //continue; //text may presents after self closing tag
              } else {
                //the result from the nested function returns the position of the error within the attribute
                //in order to get the 'true' error line, we need to calculate the position where the attribute begins (i - attrStr.length) and then add the position within the attribute
                //this gives us the absolute index in the entire xml, which we can use to find the line at last
                return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, attrStrStart + isValid.err.line));
              }
            } else if (closingTag) {
              if (!result.tagClosed) {
                return getErrorObject('InvalidTag', "Closing tag '"+tagName+"' doesn't have proper closing.", getLineNumberForPosition(xmlData, i));
              } else if (attrStr.trim().length > 0) {
                return getErrorObject('InvalidTag', "Closing tag '"+tagName+"' can't have attributes or invalid starting.", getLineNumberForPosition(xmlData, tagStartPos));
              } else if (tags.length === 0) {
                return getErrorObject('InvalidTag', "Closing tag '"+tagName+"' has not been opened.", getLineNumberForPosition(xmlData, tagStartPos));
              } else {
                const otg = tags.pop();
                if (tagName !== otg.tagName) {
                  let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
                  return getErrorObject('InvalidTag',
                    "Expected closing tag '"+otg.tagName+"' (opened in line "+openPos.line+", col "+openPos.col+") instead of closing tag '"+tagName+"'.",
                    getLineNumberForPosition(xmlData, tagStartPos));
                }

                //when there are no more tags, we reached the root level.
                if (tags.length == 0) {
                  reachedRoot = true;
                }
              }
            } else {
              const isValid = validateAttributeString(attrStr, options);
              if (isValid !== true) {
                //the result from the nested function returns the position of the error within the attribute
                //in order to get the 'true' error line, we need to calculate the position where the attribute begins (i - attrStr.length) and then add the position within the attribute
                //this gives us the absolute index in the entire xml, which we can use to find the line at last
                return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, i - attrStr.length + isValid.err.line));
              }

              //if the root level has been reached before ...
              if (reachedRoot === true) {
                return getErrorObject('InvalidXml', 'Multiple possible root nodes found.', getLineNumberForPosition(xmlData, i));
              } else if(options.unpairedTags.indexOf(tagName) !== -1){
                //don't push into stack
              } else {
                tags.push({tagName, tagStartPos});
              }
              tagFound = true;
            }

            //skip tag text value
            //It may include comments and CDATA value
            for (i++; i < xmlData.length; i++) {
              if (xmlData[i] === '<') {
                if (xmlData[i + 1] === '!') {
                  //comment or CADATA
                  i++;
                  i = readCommentAndCDATA(xmlData, i);
                  continue;
                } else if (xmlData[i+1] === '?') {
                  i = readPI(xmlData, ++i);
                  if (i.err) return i;
                } else{
                  break;
                }
              } else if (xmlData[i] === '&') {
                const afterAmp = validateAmpersand(xmlData, i);
                if (afterAmp == -1)
                  return getErrorObject('InvalidChar', "char '&' is not expected.", getLineNumberForPosition(xmlData, i));
                i = afterAmp;
              }else{
                if (reachedRoot === true && !isWhiteSpace(xmlData[i])) {
                  return getErrorObject('InvalidXml', "Extra text at the end", getLineNumberForPosition(xmlData, i));
                }
              }
            } //end of reading tag text value
            if (xmlData[i] === '<') {
              i--;
            }
          }
        } else {
          if ( isWhiteSpace(xmlData[i])) {
            continue;
          }
          return getErrorObject('InvalidChar', "char '"+xmlData[i]+"' is not expected.", getLineNumberForPosition(xmlData, i));
        }
      }

      if (!tagFound) {
        return getErrorObject('InvalidXml', 'Start tag expected.', 1);
      }else if (tags.length == 1) {
          return getErrorObject('InvalidTag', "Unclosed tag '"+tags[0].tagName+"'.", getLineNumberForPosition(xmlData, tags[0].tagStartPos));
      }else if (tags.length > 0) {
          return getErrorObject('InvalidXml', "Invalid '"+
              JSON.stringify(tags.map(t => t.tagName), null, 4).replace(/\r?\n/g, '')+
              "' found.", {line: 1, col: 1});
      }

      return true;
    };

    function isWhiteSpace(char){
      return char === ' ' || char === '\t' || char === '\n'  || char === '\r';
    }
    /**
     * Read Processing insstructions and skip
     * @param {*} xmlData
     * @param {*} i
     */
    function readPI(xmlData, i) {
      const start = i;
      for (; i < xmlData.length; i++) {
        if (xmlData[i] == '?' || xmlData[i] == ' ') {
          //tagname
          const tagname = xmlData.substr(start, i - start);
          if (i > 5 && tagname === 'xml') {
            return getErrorObject('InvalidXml', 'XML declaration allowed only at the start of the document.', getLineNumberForPosition(xmlData, i));
          } else if (xmlData[i] == '?' && xmlData[i + 1] == '>') {
            //check if valid attribut string
            i++;
            break;
          } else {
            continue;
          }
        }
      }
      return i;
    }

    function readCommentAndCDATA(xmlData, i) {
      if (xmlData.length > i + 5 && xmlData[i + 1] === '-' && xmlData[i + 2] === '-') {
        //comment
        for (i += 3; i < xmlData.length; i++) {
          if (xmlData[i] === '-' && xmlData[i + 1] === '-' && xmlData[i + 2] === '>') {
            i += 2;
            break;
          }
        }
      } else if (
        xmlData.length > i + 8 &&
        xmlData[i + 1] === 'D' &&
        xmlData[i + 2] === 'O' &&
        xmlData[i + 3] === 'C' &&
        xmlData[i + 4] === 'T' &&
        xmlData[i + 5] === 'Y' &&
        xmlData[i + 6] === 'P' &&
        xmlData[i + 7] === 'E'
      ) {
        let angleBracketsCount = 1;
        for (i += 8; i < xmlData.length; i++) {
          if (xmlData[i] === '<') {
            angleBracketsCount++;
          } else if (xmlData[i] === '>') {
            angleBracketsCount--;
            if (angleBracketsCount === 0) {
              break;
            }
          }
        }
      } else if (
        xmlData.length > i + 9 &&
        xmlData[i + 1] === '[' &&
        xmlData[i + 2] === 'C' &&
        xmlData[i + 3] === 'D' &&
        xmlData[i + 4] === 'A' &&
        xmlData[i + 5] === 'T' &&
        xmlData[i + 6] === 'A' &&
        xmlData[i + 7] === '['
      ) {
        for (i += 8; i < xmlData.length; i++) {
          if (xmlData[i] === ']' && xmlData[i + 1] === ']' && xmlData[i + 2] === '>') {
            i += 2;
            break;
          }
        }
      }

      return i;
    }

    const doubleQuote = '"';
    const singleQuote = "'";

    /**
     * Keep reading xmlData until '<' is found outside the attribute value.
     * @param {string} xmlData
     * @param {number} i
     */
    function readAttributeStr(xmlData, i) {
      let attrStr = '';
      let startChar = '';
      let tagClosed = false;
      for (; i < xmlData.length; i++) {
        if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) {
          if (startChar === '') {
            startChar = xmlData[i];
          } else if (startChar !== xmlData[i]) {
            //if vaue is enclosed with double quote then single quotes are allowed inside the value and vice versa
          } else {
            startChar = '';
          }
        } else if (xmlData[i] === '>') {
          if (startChar === '') {
            tagClosed = true;
            break;
          }
        }
        attrStr += xmlData[i];
      }
      if (startChar !== '') {
        return false;
      }

      return {
        value: attrStr,
        index: i,
        tagClosed: tagClosed
      };
    }

    /**
     * Select all the attributes whether valid or invalid.
     */
    const validAttrStrRegxp = new RegExp('(\\s*)([^\\s=]+)(\\s*=)?(\\s*([\'"])(([\\s\\S])*?)\\5)?', 'g');

    //attr, ="sd", a="amit's", a="sd"b="saf", ab  cd=""

    function validateAttributeString(attrStr, options) {
      //console.log("start:"+attrStr+":end");

      //if(attrStr.trim().length === 0) return true; //empty string

      const matches = util.getAllMatches(attrStr, validAttrStrRegxp);
      const attrNames = {};

      for (let i = 0; i < matches.length; i++) {
        if (matches[i][1].length === 0) {
          //nospace before attribute name: a="sd"b="saf"
          return getErrorObject('InvalidAttr', "Attribute '"+matches[i][2]+"' has no space in starting.", getPositionFromMatch(matches[i]))
        } else if (matches[i][3] !== undefined && matches[i][4] === undefined) {
          return getErrorObject('InvalidAttr', "Attribute '"+matches[i][2]+"' is without value.", getPositionFromMatch(matches[i]));
        } else if (matches[i][3] === undefined && !options.allowBooleanAttributes) {
          //independent attribute: ab
          return getErrorObject('InvalidAttr', "boolean attribute '"+matches[i][2]+"' is not allowed.", getPositionFromMatch(matches[i]));
        }
        /* else if(matches[i][6] === undefined){//attribute without value: ab=
                        return { err: { code:"InvalidAttr",msg:"attribute " + matches[i][2] + " has no value assigned."}};
                    } */
        const attrName = matches[i][2];
        if (!validateAttrName(attrName)) {
          return getErrorObject('InvalidAttr', "Attribute '"+attrName+"' is an invalid name.", getPositionFromMatch(matches[i]));
        }
        if (!attrNames.hasOwnProperty(attrName)) {
          //check for duplicate attribute.
          attrNames[attrName] = 1;
        } else {
          return getErrorObject('InvalidAttr', "Attribute '"+attrName+"' is repeated.", getPositionFromMatch(matches[i]));
        }
      }

      return true;
    }

    function validateNumberAmpersand(xmlData, i) {
      let re = /\d/;
      if (xmlData[i] === 'x') {
        i++;
        re = /[\da-fA-F]/;
      }
      for (; i < xmlData.length; i++) {
        if (xmlData[i] === ';')
          return i;
        if (!xmlData[i].match(re))
          break;
      }
      return -1;
    }

    function validateAmpersand(xmlData, i) {
      // https://www.w3.org/TR/xml/#dt-charref
      i++;
      if (xmlData[i] === ';')
        return -1;
      if (xmlData[i] === '#') {
        i++;
        return validateNumberAmpersand(xmlData, i);
      }
      let count = 0;
      for (; i < xmlData.length; i++, count++) {
        if (xmlData[i].match(/\w/) && count < 20)
          continue;
        if (xmlData[i] === ';')
          break;
        return -1;
      }
      return i;
    }

    function getErrorObject(code, message, lineNumber) {
      return {
        err: {
          code: code,
          msg: message,
          line: lineNumber.line || lineNumber,
          col: lineNumber.col,
        },
      };
    }

    function validateAttrName(attrName) {
      return util.isName(attrName);
    }

    // const startsWithXML = /^xml/i;

    function validateTagName(tagname) {
      return util.isName(tagname) /* && !tagname.match(startsWithXML) */;
    }

    //this function returns the line number for the character at the given index
    function getLineNumberForPosition(xmlData, index) {
      const lines = xmlData.substring(0, index).split(/\r?\n/);
      return {
        line: lines.length,

        // column number is last line's length + 1, because column numbering starts at 1:
        col: lines[lines.length - 1].length + 1
      };
    }

    //this function returns the position of the first character of match within attrStr
    function getPositionFromMatch(match) {
      return match.startIndex + match[1].length;
    }


    /***/ }),

    /***/ "./node_modules/fast-xml-parser/src/xmlbuilder/json2xml.js":
    /*!*****************************************************************!*\
      !*** ./node_modules/fast-xml-parser/src/xmlbuilder/json2xml.js ***!
      \*****************************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    "use strict";

    //parse Empty Node as self closing node
    const buildFromOrderedJs = __webpack_require__(/*! ./orderedJs2Xml */ "./node_modules/fast-xml-parser/src/xmlbuilder/orderedJs2Xml.js");
    const getIgnoreAttributesFn = __webpack_require__(/*! ../ignoreAttributes */ "./node_modules/fast-xml-parser/src/ignoreAttributes.js")

    const defaultOptions = {
      attributeNamePrefix: '@_',
      attributesGroupName: false,
      textNodeName: '#text',
      ignoreAttributes: true,
      cdataPropName: false,
      format: false,
      indentBy: '  ',
      suppressEmptyNode: false,
      suppressUnpairedNode: true,
      suppressBooleanAttributes: true,
      tagValueProcessor: function(key, a) {
        return a;
      },
      attributeValueProcessor: function(attrName, a) {
        return a;
      },
      preserveOrder: false,
      commentPropName: false,
      unpairedTags: [],
      entities: [
        { regex: new RegExp("&", "g"), val: "&amp;" },//it must be on top
        { regex: new RegExp(">", "g"), val: "&gt;" },
        { regex: new RegExp("<", "g"), val: "&lt;" },
        { regex: new RegExp("\'", "g"), val: "&apos;" },
        { regex: new RegExp("\"", "g"), val: "&quot;" }
      ],
      processEntities: true,
      stopNodes: [],
      // transformTagName: false,
      // transformAttributeName: false,
      oneListGroup: false
    };

    function Builder(options) {
      this.options = Object.assign({}, defaultOptions, options);
      if (this.options.ignoreAttributes === true || this.options.attributesGroupName) {
        this.isAttribute = function(/*a*/) {
          return false;
        };
      } else {
        this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes)
        this.attrPrefixLen = this.options.attributeNamePrefix.length;
        this.isAttribute = isAttribute;
      }

      this.processTextOrObjNode = processTextOrObjNode

      if (this.options.format) {
        this.indentate = indentate;
        this.tagEndChar = '>\n';
        this.newLine = '\n';
      } else {
        this.indentate = function() {
          return '';
        };
        this.tagEndChar = '>';
        this.newLine = '';
      }
    }

    Builder.prototype.build = function(jObj) {
      if(this.options.preserveOrder){
        return buildFromOrderedJs(jObj, this.options);
      }else {
        if(Array.isArray(jObj) && this.options.arrayNodeName && this.options.arrayNodeName.length > 1){
          jObj = {
            [this.options.arrayNodeName] : jObj
          }
        }
        return this.j2x(jObj, 0, []).val;
      }
    };

    Builder.prototype.j2x = function(jObj, level, ajPath) {
      let attrStr = '';
      let val = '';
      const jPath = ajPath.join('.')
      for (let key in jObj) {
        if(!Object.prototype.hasOwnProperty.call(jObj, key)) continue;
        if (typeof jObj[key] === 'undefined') {
          // supress undefined node only if it is not an attribute
          if (this.isAttribute(key)) {
            val += '';
          }
        } else if (jObj[key] === null) {
          // null attribute should be ignored by the attribute list, but should not cause the tag closing
          if (this.isAttribute(key)) {
            val += '';
          } else if (key[0] === '?') {
            val += this.indentate(level) + '<' + key + '?' + this.tagEndChar;
          } else {
            val += this.indentate(level) + '<' + key + '/' + this.tagEndChar;
          }
          // val += this.indentate(level) + '<' + key + '/' + this.tagEndChar;
        } else if (jObj[key] instanceof Date) {
          val += this.buildTextValNode(jObj[key], key, '', level);
        } else if (typeof jObj[key] !== 'object') {
          //premitive type
          const attr = this.isAttribute(key);
          if (attr && !this.ignoreAttributesFn(attr, jPath)) {
            attrStr += this.buildAttrPairStr(attr, '' + jObj[key]);
          } else if (!attr) {
            //tag value
            if (key === this.options.textNodeName) {
              let newval = this.options.tagValueProcessor(key, '' + jObj[key]);
              val += this.replaceEntitiesValue(newval);
            } else {
              val += this.buildTextValNode(jObj[key], key, '', level);
            }
          }
        } else if (Array.isArray(jObj[key])) {
          //repeated nodes
          const arrLen = jObj[key].length;
          let listTagVal = "";
          let listTagAttr = "";
          for (let j = 0; j < arrLen; j++) {
            const item = jObj[key][j];
            if (typeof item === 'undefined') {
              // supress undefined node
            } else if (item === null) {
              if(key[0] === "?") val += this.indentate(level) + '<' + key + '?' + this.tagEndChar;
              else val += this.indentate(level) + '<' + key + '/' + this.tagEndChar;
              // val += this.indentate(level) + '<' + key + '/' + this.tagEndChar;
            } else if (typeof item === 'object') {
              if(this.options.oneListGroup){
                const result = this.j2x(item, level + 1, ajPath.concat(key));
                listTagVal += result.val;
                if (this.options.attributesGroupName && item.hasOwnProperty(this.options.attributesGroupName)) {
                  listTagAttr += result.attrStr
                }
              }else{
                listTagVal += this.processTextOrObjNode(item, key, level, ajPath)
              }
            } else {
              if (this.options.oneListGroup) {
                let textValue = this.options.tagValueProcessor(key, item);
                textValue = this.replaceEntitiesValue(textValue);
                listTagVal += textValue;
              } else {
                listTagVal += this.buildTextValNode(item, key, '', level);
              }
            }
          }
          if(this.options.oneListGroup){
            listTagVal = this.buildObjectNode(listTagVal, key, listTagAttr, level);
          }
          val += listTagVal;
        } else {
          //nested node
          if (this.options.attributesGroupName && key === this.options.attributesGroupName) {
            const Ks = Object.keys(jObj[key]);
            const L = Ks.length;
            for (let j = 0; j < L; j++) {
              attrStr += this.buildAttrPairStr(Ks[j], '' + jObj[key][Ks[j]]);
            }
          } else {
            val += this.processTextOrObjNode(jObj[key], key, level, ajPath)
          }
        }
      }
      return {attrStr: attrStr, val: val};
    };

    Builder.prototype.buildAttrPairStr = function(attrName, val){
      val = this.options.attributeValueProcessor(attrName, '' + val);
      val = this.replaceEntitiesValue(val);
      if (this.options.suppressBooleanAttributes && val === "true") {
        return ' ' + attrName;
      } else return ' ' + attrName + '="' + val + '"';
    }

    function processTextOrObjNode (object, key, level, ajPath) {
      const result = this.j2x(object, level + 1, ajPath.concat(key));
      if (object[this.options.textNodeName] !== undefined && Object.keys(object).length === 1) {
        return this.buildTextValNode(object[this.options.textNodeName], key, result.attrStr, level);
      } else {
        return this.buildObjectNode(result.val, key, result.attrStr, level);
      }
    }

    Builder.prototype.buildObjectNode = function(val, key, attrStr, level) {
      if(val === ""){
        if(key[0] === "?") return  this.indentate(level) + '<' + key + attrStr+ '?' + this.tagEndChar;
        else {
          return this.indentate(level) + '<' + key + attrStr + this.closeTag(key) + this.tagEndChar;
        }
      }else{

        let tagEndExp = '</' + key + this.tagEndChar;
        let piClosingChar = "";
        
        if(key[0] === "?") {
          piClosingChar = "?";
          tagEndExp = "";
        }
      
        // attrStr is an empty string in case the attribute came as undefined or null
        if ((attrStr || attrStr === '') && val.indexOf('<') === -1) {
          return ( this.indentate(level) + '<' +  key + attrStr + piClosingChar + '>' + val + tagEndExp );
        } else if (this.options.commentPropName !== false && key === this.options.commentPropName && piClosingChar.length === 0) {
          return this.indentate(level) + `<!--${val}-->` + this.newLine;
        }else {
          return (
            this.indentate(level) + '<' + key + attrStr + piClosingChar + this.tagEndChar +
            val +
            this.indentate(level) + tagEndExp    );
        }
      }
    }

    Builder.prototype.closeTag = function(key){
      let closeTag = "";
      if(this.options.unpairedTags.indexOf(key) !== -1){ //unpaired
        if(!this.options.suppressUnpairedNode) closeTag = "/"
      }else if(this.options.suppressEmptyNode){ //empty
        closeTag = "/";
      }else{
        closeTag = `></${key}`
      }
      return closeTag;
    }

    function buildEmptyObjNode(val, key, attrStr, level) {
      if (val !== '') {
        return this.buildObjectNode(val, key, attrStr, level);
      } else {
        if(key[0] === "?") return  this.indentate(level) + '<' + key + attrStr+ '?' + this.tagEndChar;
        else {
          return  this.indentate(level) + '<' + key + attrStr + '/' + this.tagEndChar;
          // return this.buildTagStr(level,key, attrStr);
        }
      }
    }

    Builder.prototype.buildTextValNode = function(val, key, attrStr, level) {
      if (this.options.cdataPropName !== false && key === this.options.cdataPropName) {
        return this.indentate(level) + `<![CDATA[${val}]]>` +  this.newLine;
      }else if (this.options.commentPropName !== false && key === this.options.commentPropName) {
        return this.indentate(level) + `<!--${val}-->` +  this.newLine;
      }else if(key[0] === "?") {//PI tag
        return  this.indentate(level) + '<' + key + attrStr+ '?' + this.tagEndChar; 
      }else{
        let textValue = this.options.tagValueProcessor(key, val);
        textValue = this.replaceEntitiesValue(textValue);
      
        if( textValue === ''){
          return this.indentate(level) + '<' + key + attrStr + this.closeTag(key) + this.tagEndChar;
        }else{
          return this.indentate(level) + '<' + key + attrStr + '>' +
             textValue +
            '</' + key + this.tagEndChar;
        }
      }
    }

    Builder.prototype.replaceEntitiesValue = function(textValue){
      if(textValue && textValue.length > 0 && this.options.processEntities){
        for (let i=0; i<this.options.entities.length; i++) {
          const entity = this.options.entities[i];
          textValue = textValue.replace(entity.regex, entity.val);
        }
      }
      return textValue;
    }

    function indentate(level) {
      return this.options.indentBy.repeat(level);
    }

    function isAttribute(name /*, options*/) {
      if (name.startsWith(this.options.attributeNamePrefix) && name !== this.options.textNodeName) {
        return name.substr(this.attrPrefixLen);
      } else {
        return false;
      }
    }

    module.exports = Builder;


    /***/ }),

    /***/ "./node_modules/fast-xml-parser/src/xmlbuilder/orderedJs2Xml.js":
    /*!**********************************************************************!*\
      !*** ./node_modules/fast-xml-parser/src/xmlbuilder/orderedJs2Xml.js ***!
      \**********************************************************************/
    /*! no static exports found */
    /***/ (function(module, exports) {

    const EOL = "\n";

    /**
     * 
     * @param {array} jArray 
     * @param {any} options 
     * @returns 
     */
    function toXml(jArray, options) {
        let indentation = "";
        if (options.format && options.indentBy.length > 0) {
            indentation = EOL;
        }
        return arrToStr(jArray, options, "", indentation);
    }

    function arrToStr(arr, options, jPath, indentation) {
        let xmlStr = "";
        let isPreviousElementTag = false;

        for (let i = 0; i < arr.length; i++) {
            const tagObj = arr[i];
            const tagName = propName(tagObj);
            if(tagName === undefined) continue;

            let newJPath = "";
            if (jPath.length === 0) newJPath = tagName
            else newJPath = `${jPath}.${tagName}`;

            if (tagName === options.textNodeName) {
                let tagText = tagObj[tagName];
                if (!isStopNode(newJPath, options)) {
                    tagText = options.tagValueProcessor(tagName, tagText);
                    tagText = replaceEntitiesValue(tagText, options);
                }
                if (isPreviousElementTag) {
                    xmlStr += indentation;
                }
                xmlStr += tagText;
                isPreviousElementTag = false;
                continue;
            } else if (tagName === options.cdataPropName) {
                if (isPreviousElementTag) {
                    xmlStr += indentation;
                }
                xmlStr += `<![CDATA[${tagObj[tagName][0][options.textNodeName]}]]>`;
                isPreviousElementTag = false;
                continue;
            } else if (tagName === options.commentPropName) {
                xmlStr += indentation + `<!--${tagObj[tagName][0][options.textNodeName]}-->`;
                isPreviousElementTag = true;
                continue;
            } else if (tagName[0] === "?") {
                const attStr = attr_to_str(tagObj[":@"], options);
                const tempInd = tagName === "?xml" ? "" : indentation;
                let piTextNodeName = tagObj[tagName][0][options.textNodeName];
                piTextNodeName = piTextNodeName.length !== 0 ? " " + piTextNodeName : ""; //remove extra spacing
                xmlStr += tempInd + `<${tagName}${piTextNodeName}${attStr}?>`;
                isPreviousElementTag = true;
                continue;
            }
            let newIdentation = indentation;
            if (newIdentation !== "") {
                newIdentation += options.indentBy;
            }
            const attStr = attr_to_str(tagObj[":@"], options);
            const tagStart = indentation + `<${tagName}${attStr}`;
            const tagValue = arrToStr(tagObj[tagName], options, newJPath, newIdentation);
            if (options.unpairedTags.indexOf(tagName) !== -1) {
                if (options.suppressUnpairedNode) xmlStr += tagStart + ">";
                else xmlStr += tagStart + "/>";
            } else if ((!tagValue || tagValue.length === 0) && options.suppressEmptyNode) {
                xmlStr += tagStart + "/>";
            } else if (tagValue && tagValue.endsWith(">")) {
                xmlStr += tagStart + `>${tagValue}${indentation}</${tagName}>`;
            } else {
                xmlStr += tagStart + ">";
                if (tagValue && indentation !== "" && (tagValue.includes("/>") || tagValue.includes("</"))) {
                    xmlStr += indentation + options.indentBy + tagValue + indentation;
                } else {
                    xmlStr += tagValue;
                }
                xmlStr += `</${tagName}>`;
            }
            isPreviousElementTag = true;
        }

        return xmlStr;
    }

    function propName(obj) {
        const keys = Object.keys(obj);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if(!obj.hasOwnProperty(key)) continue;
            if (key !== ":@") return key;
        }
    }

    function attr_to_str(attrMap, options) {
        let attrStr = "";
        if (attrMap && !options.ignoreAttributes) {
            for (let attr in attrMap) {
                if(!attrMap.hasOwnProperty(attr)) continue;
                let attrVal = options.attributeValueProcessor(attr, attrMap[attr]);
                attrVal = replaceEntitiesValue(attrVal, options);
                if (attrVal === true && options.suppressBooleanAttributes) {
                    attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}`;
                } else {
                    attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}="${attrVal}"`;
                }
            }
        }
        return attrStr;
    }

    function isStopNode(jPath, options) {
        jPath = jPath.substr(0, jPath.length - options.textNodeName.length - 1);
        let tagName = jPath.substr(jPath.lastIndexOf(".") + 1);
        for (let index in options.stopNodes) {
            if (options.stopNodes[index] === jPath || options.stopNodes[index] === "*." + tagName) return true;
        }
        return false;
    }

    function replaceEntitiesValue(textValue, options) {
        if (textValue && textValue.length > 0 && options.processEntities) {
            for (let i = 0; i < options.entities.length; i++) {
                const entity = options.entities[i];
                textValue = textValue.replace(entity.regex, entity.val);
            }
        }
        return textValue;
    }
    module.exports = toXml;


    /***/ }),

    /***/ "./node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js":
    /*!*********************************************************************!*\
      !*** ./node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js ***!
      \*********************************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    const util = __webpack_require__(/*! ../util */ "./node_modules/fast-xml-parser/src/util.js");

    //TODO: handle comments
    function readDocType(xmlData, i){
        
        const entities = {};
        if( xmlData[i + 3] === 'O' &&
             xmlData[i + 4] === 'C' &&
             xmlData[i + 5] === 'T' &&
             xmlData[i + 6] === 'Y' &&
             xmlData[i + 7] === 'P' &&
             xmlData[i + 8] === 'E')
        {    
            i = i+9;
            let angleBracketsCount = 1;
            let hasBody = false, comment = false;
            let exp = "";
            for(;i<xmlData.length;i++){
                if (xmlData[i] === '<' && !comment) { //Determine the tag type
                    if( hasBody && isEntity(xmlData, i)){
                        i += 7; 
                        [entityName, val,i] = readEntityExp(xmlData,i+1);
                        if(val.indexOf("&") === -1) //Parameter entities are not supported
                            entities[ validateEntityName(entityName) ] = {
                                regx : RegExp( `&${entityName};`,"g"),
                                val: val
                            };
                    }
                    else if( hasBody && isElement(xmlData, i))  i += 8;//Not supported
                    else if( hasBody && isAttlist(xmlData, i))  i += 8;//Not supported
                    else if( hasBody && isNotation(xmlData, i)) i += 9;//Not supported
                    else if( isComment)                         comment = true;
                    else                                        throw new Error("Invalid DOCTYPE");

                    angleBracketsCount++;
                    exp = "";
                } else if (xmlData[i] === '>') { //Read tag content
                    if(comment){
                        if( xmlData[i - 1] === "-" && xmlData[i - 2] === "-"){
                            comment = false;
                            angleBracketsCount--;
                        }
                    }else{
                        angleBracketsCount--;
                    }
                    if (angleBracketsCount === 0) {
                      break;
                    }
                }else if( xmlData[i] === '['){
                    hasBody = true;
                }else{
                    exp += xmlData[i];
                }
            }
            if(angleBracketsCount !== 0){
                throw new Error(`Unclosed DOCTYPE`);
            }
        }else{
            throw new Error(`Invalid Tag instead of DOCTYPE`);
        }
        return {entities, i};
    }

    function readEntityExp(xmlData,i){
        //External entities are not supported
        //    <!ENTITY ext SYSTEM "http://normal-website.com" >

        //Parameter entities are not supported
        //    <!ENTITY entityname "&anotherElement;">

        //Internal entities are supported
        //    <!ENTITY entityname "replacement text">
        
        //read EntityName
        let entityName = "";
        for (; i < xmlData.length && (xmlData[i] !== "'" && xmlData[i] !== '"' ); i++) {
            // if(xmlData[i] === " ") continue;
            // else 
            entityName += xmlData[i];
        }
        entityName = entityName.trim();
        if(entityName.indexOf(" ") !== -1) throw new Error("External entites are not supported");

        //read Entity Value
        const startChar = xmlData[i++];
        let val = ""
        for (; i < xmlData.length && xmlData[i] !== startChar ; i++) {
            val += xmlData[i];
        }
        return [entityName, val, i];
    }

    function isComment(xmlData, i){
        if(xmlData[i+1] === '!' &&
        xmlData[i+2] === '-' &&
        xmlData[i+3] === '-') return true
        return false
    }
    function isEntity(xmlData, i){
        if(xmlData[i+1] === '!' &&
        xmlData[i+2] === 'E' &&
        xmlData[i+3] === 'N' &&
        xmlData[i+4] === 'T' &&
        xmlData[i+5] === 'I' &&
        xmlData[i+6] === 'T' &&
        xmlData[i+7] === 'Y') return true
        return false
    }
    function isElement(xmlData, i){
        if(xmlData[i+1] === '!' &&
        xmlData[i+2] === 'E' &&
        xmlData[i+3] === 'L' &&
        xmlData[i+4] === 'E' &&
        xmlData[i+5] === 'M' &&
        xmlData[i+6] === 'E' &&
        xmlData[i+7] === 'N' &&
        xmlData[i+8] === 'T') return true
        return false
    }

    function isAttlist(xmlData, i){
        if(xmlData[i+1] === '!' &&
        xmlData[i+2] === 'A' &&
        xmlData[i+3] === 'T' &&
        xmlData[i+4] === 'T' &&
        xmlData[i+5] === 'L' &&
        xmlData[i+6] === 'I' &&
        xmlData[i+7] === 'S' &&
        xmlData[i+8] === 'T') return true
        return false
    }
    function isNotation(xmlData, i){
        if(xmlData[i+1] === '!' &&
        xmlData[i+2] === 'N' &&
        xmlData[i+3] === 'O' &&
        xmlData[i+4] === 'T' &&
        xmlData[i+5] === 'A' &&
        xmlData[i+6] === 'T' &&
        xmlData[i+7] === 'I' &&
        xmlData[i+8] === 'O' &&
        xmlData[i+9] === 'N') return true
        return false
    }

    function validateEntityName(name){
        if (util.isName(name))
    	return name;
        else
            throw new Error(`Invalid entity name ${name}`);
    }

    module.exports = readDocType;


    /***/ }),

    /***/ "./node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js":
    /*!**********************************************************************!*\
      !*** ./node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js ***!
      \**********************************************************************/
    /*! no static exports found */
    /***/ (function(module, exports) {


    const defaultOptions = {
        preserveOrder: false,
        attributeNamePrefix: '@_',
        attributesGroupName: false,
        textNodeName: '#text',
        ignoreAttributes: true,
        removeNSPrefix: false, // remove NS from tag name or attribute name if true
        allowBooleanAttributes: false, //a tag can have attributes without any value
        //ignoreRootElement : false,
        parseTagValue: true,
        parseAttributeValue: false,
        trimValues: true, //Trim string values of tag and attributes
        cdataPropName: false,
        numberParseOptions: {
          hex: true,
          leadingZeros: true,
          eNotation: true
        },
        tagValueProcessor: function(tagName, val) {
          return val;
        },
        attributeValueProcessor: function(attrName, val) {
          return val;
        },
        stopNodes: [], //nested tags will not be parsed even for errors
        alwaysCreateTextNode: false,
        isArray: () => false,
        commentPropName: false,
        unpairedTags: [],
        processEntities: true,
        htmlEntities: false,
        ignoreDeclaration: false,
        ignorePiTags: false,
        transformTagName: false,
        transformAttributeName: false,
        updateTag: function(tagName, jPath, attrs){
          return tagName
        },
        // skipEmptyListItem: false
    };
       
    const buildOptions = function(options) {
        return Object.assign({}, defaultOptions, options);
    };

    exports.buildOptions = buildOptions;
    exports.defaultOptions = defaultOptions;

    /***/ }),

    /***/ "./node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js":
    /*!************************************************************************!*\
      !*** ./node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js ***!
      \************************************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    "use strict";

    ///@ts-check

    const util = __webpack_require__(/*! ../util */ "./node_modules/fast-xml-parser/src/util.js");
    const xmlNode = __webpack_require__(/*! ./xmlNode */ "./node_modules/fast-xml-parser/src/xmlparser/xmlNode.js");
    const readDocType = __webpack_require__(/*! ./DocTypeReader */ "./node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js");
    const toNumber = __webpack_require__(/*! strnum */ "./node_modules/strnum/strnum.js");
    const getIgnoreAttributesFn = __webpack_require__(/*! ../ignoreAttributes */ "./node_modules/fast-xml-parser/src/ignoreAttributes.js")

    // const regx =
    //   '<((!\\[CDATA\\[([\\s\\S]*?)(]]>))|((NAME:)?(NAME))([^>]*)>|((\\/)(NAME)\\s*>))([^<]*)'
    //   .replace(/NAME/g, util.nameRegexp);

    //const tagsRegx = new RegExp("<(\\/?[\\w:\\-\._]+)([^>]*)>(\\s*"+cdataRegx+")*([^<]+)?","g");
    //const tagsRegx = new RegExp("<(\\/?)((\\w*:)?([\\w:\\-\._]+))([^>]*)>([^<]*)("+cdataRegx+"([^<]*))*([^<]+)?","g");

    class OrderedObjParser{
      constructor(options){
        this.options = options;
        this.currentNode = null;
        this.tagsNodeStack = [];
        this.docTypeEntities = {};
        this.lastEntities = {
          "apos" : { regex: /&(apos|#39|#x27);/g, val : "'"},
          "gt" : { regex: /&(gt|#62|#x3E);/g, val : ">"},
          "lt" : { regex: /&(lt|#60|#x3C);/g, val : "<"},
          "quot" : { regex: /&(quot|#34|#x22);/g, val : "\""},
        };
        this.ampEntity = { regex: /&(amp|#38|#x26);/g, val : "&"};
        this.htmlEntities = {
          "space": { regex: /&(nbsp|#160);/g, val: " " },
          // "lt" : { regex: /&(lt|#60);/g, val: "<" },
          // "gt" : { regex: /&(gt|#62);/g, val: ">" },
          // "amp" : { regex: /&(amp|#38);/g, val: "&" },
          // "quot" : { regex: /&(quot|#34);/g, val: "\"" },
          // "apos" : { regex: /&(apos|#39);/g, val: "'" },
          "cent" : { regex: /&(cent|#162);/g, val: "¢" },
          "pound" : { regex: /&(pound|#163);/g, val: "£" },
          "yen" : { regex: /&(yen|#165);/g, val: "¥" },
          "euro" : { regex: /&(euro|#8364);/g, val: "€" },
          "copyright" : { regex: /&(copy|#169);/g, val: "©" },
          "reg" : { regex: /&(reg|#174);/g, val: "®" },
          "inr" : { regex: /&(inr|#8377);/g, val: "₹" },
          "num_dec": { regex: /&#([0-9]{1,7});/g, val : (_, str) => String.fromCharCode(Number.parseInt(str, 10)) },
          "num_hex": { regex: /&#x([0-9a-fA-F]{1,6});/g, val : (_, str) => String.fromCharCode(Number.parseInt(str, 16)) },
        };
        this.addExternalEntities = addExternalEntities;
        this.parseXml = parseXml;
        this.parseTextData = parseTextData;
        this.resolveNameSpace = resolveNameSpace;
        this.buildAttributesMap = buildAttributesMap;
        this.isItStopNode = isItStopNode;
        this.replaceEntitiesValue = replaceEntitiesValue;
        this.readStopNodeData = readStopNodeData;
        this.saveTextToParentTag = saveTextToParentTag;
        this.addChild = addChild;
        this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes)
      }

    }

    function addExternalEntities(externalEntities){
      const entKeys = Object.keys(externalEntities);
      for (let i = 0; i < entKeys.length; i++) {
        const ent = entKeys[i];
        this.lastEntities[ent] = {
           regex: new RegExp("&"+ent+";","g"),
           val : externalEntities[ent]
        }
      }
    }

    /**
     * @param {string} val
     * @param {string} tagName
     * @param {string} jPath
     * @param {boolean} dontTrim
     * @param {boolean} hasAttributes
     * @param {boolean} isLeafNode
     * @param {boolean} escapeEntities
     */
    function parseTextData(val, tagName, jPath, dontTrim, hasAttributes, isLeafNode, escapeEntities) {
      if (val !== undefined) {
        if (this.options.trimValues && !dontTrim) {
          val = val.trim();
        }
        if(val.length > 0){
          if(!escapeEntities) val = this.replaceEntitiesValue(val);
          
          const newval = this.options.tagValueProcessor(tagName, val, jPath, hasAttributes, isLeafNode);
          if(newval === null || newval === undefined){
            //don't parse
            return val;
          }else if(typeof newval !== typeof val || newval !== val){
            //overwrite
            return newval;
          }else if(this.options.trimValues){
            return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
          }else{
            const trimmedVal = val.trim();
            if(trimmedVal === val){
              return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
            }else{
              return val;
            }
          }
        }
      }
    }

    function resolveNameSpace(tagname) {
      if (this.options.removeNSPrefix) {
        const tags = tagname.split(':');
        const prefix = tagname.charAt(0) === '/' ? '/' : '';
        if (tags[0] === 'xmlns') {
          return '';
        }
        if (tags.length === 2) {
          tagname = prefix + tags[1];
        }
      }
      return tagname;
    }

    //TODO: change regex to capture NS
    //const attrsRegx = new RegExp("([\\w\\-\\.\\:]+)\\s*=\\s*(['\"])((.|\n)*?)\\2","gm");
    const attrsRegx = new RegExp('([^\\s=]+)\\s*(=\\s*([\'"])([\\s\\S]*?)\\3)?', 'gm');

    function buildAttributesMap(attrStr, jPath, tagName) {
      if (this.options.ignoreAttributes !== true && typeof attrStr === 'string') {
        // attrStr = attrStr.replace(/\r?\n/g, ' ');
        //attrStr = attrStr || attrStr.trim();

        const matches = util.getAllMatches(attrStr, attrsRegx);
        const len = matches.length; //don't make it inline
        const attrs = {};
        for (let i = 0; i < len; i++) {
          const attrName = this.resolveNameSpace(matches[i][1]);
          if (this.ignoreAttributesFn(attrName, jPath)) {
            continue
          }
          let oldVal = matches[i][4];
          let aName = this.options.attributeNamePrefix + attrName;
          if (attrName.length) {
            if (this.options.transformAttributeName) {
              aName = this.options.transformAttributeName(aName);
            }
            if(aName === "__proto__") aName  = "#__proto__";
            if (oldVal !== undefined) {
              if (this.options.trimValues) {
                oldVal = oldVal.trim();
              }
              oldVal = this.replaceEntitiesValue(oldVal);
              const newVal = this.options.attributeValueProcessor(attrName, oldVal, jPath);
              if(newVal === null || newVal === undefined){
                //don't parse
                attrs[aName] = oldVal;
              }else if(typeof newVal !== typeof oldVal || newVal !== oldVal){
                //overwrite
                attrs[aName] = newVal;
              }else{
                //parse
                attrs[aName] = parseValue(
                  oldVal,
                  this.options.parseAttributeValue,
                  this.options.numberParseOptions
                );
              }
            } else if (this.options.allowBooleanAttributes) {
              attrs[aName] = true;
            }
          }
        }
        if (!Object.keys(attrs).length) {
          return;
        }
        if (this.options.attributesGroupName) {
          const attrCollection = {};
          attrCollection[this.options.attributesGroupName] = attrs;
          return attrCollection;
        }
        return attrs
      }
    }

    const parseXml = function(xmlData) {
      // xmlData = xmlData.replace(/\r\n?/g, "\n"); //TODO: remove this line
      const xmlObj = new xmlNode('!xml');
      let currentNode = xmlObj;
      let textData = "";
      let jPath = "";
      for(let i=0; i< xmlData.length; i++){//for each char in XML data
        const ch = xmlData[i];
        if(ch === '<'){
          // const nextIndex = i+1;
          // const _2ndChar = xmlData[nextIndex];
          if( xmlData[i+1] === '/') {//Closing Tag
            const closeIndex = findClosingIndex(xmlData, ">", i, "Closing Tag is not closed.")
            let tagName = xmlData.substring(i+2,closeIndex).trim();

            if(this.options.removeNSPrefix){
              const colonIndex = tagName.indexOf(":");
              if(colonIndex !== -1){
                tagName = tagName.substr(colonIndex+1);
              }
            }

            if(this.options.transformTagName) {
              tagName = this.options.transformTagName(tagName);
            }

            if(currentNode){
              textData = this.saveTextToParentTag(textData, currentNode, jPath);
            }

            //check if last tag of nested tag was unpaired tag
            const lastTagName = jPath.substring(jPath.lastIndexOf(".")+1);
            if(tagName && this.options.unpairedTags.indexOf(tagName) !== -1 ){
              throw new Error(`Unpaired tag can not be used as closing tag: </${tagName}>`);
            }
            let propIndex = 0
            if(lastTagName && this.options.unpairedTags.indexOf(lastTagName) !== -1 ){
              propIndex = jPath.lastIndexOf('.', jPath.lastIndexOf('.')-1)
              this.tagsNodeStack.pop();
            }else{
              propIndex = jPath.lastIndexOf(".");
            }
            jPath = jPath.substring(0, propIndex);

            currentNode = this.tagsNodeStack.pop();//avoid recursion, set the parent tag scope
            textData = "";
            i = closeIndex;
          } else if( xmlData[i+1] === '?') {

            let tagData = readTagExp(xmlData,i, false, "?>");
            if(!tagData) throw new Error("Pi Tag is not closed.");

            textData = this.saveTextToParentTag(textData, currentNode, jPath);
            if( (this.options.ignoreDeclaration && tagData.tagName === "?xml") || this.options.ignorePiTags){

            }else{
      
              const childNode = new xmlNode(tagData.tagName);
              childNode.add(this.options.textNodeName, "");
              
              if(tagData.tagName !== tagData.tagExp && tagData.attrExpPresent){
                childNode[":@"] = this.buildAttributesMap(tagData.tagExp, jPath, tagData.tagName);
              }
              this.addChild(currentNode, childNode, jPath)

            }


            i = tagData.closeIndex + 1;
          } else if(xmlData.substr(i + 1, 3) === '!--') {
            const endIndex = findClosingIndex(xmlData, "-->", i+4, "Comment is not closed.")
            if(this.options.commentPropName){
              const comment = xmlData.substring(i + 4, endIndex - 2);

              textData = this.saveTextToParentTag(textData, currentNode, jPath);

              currentNode.add(this.options.commentPropName, [ { [this.options.textNodeName] : comment } ]);
            }
            i = endIndex;
          } else if( xmlData.substr(i + 1, 2) === '!D') {
            const result = readDocType(xmlData, i);
            this.docTypeEntities = result.entities;
            i = result.i;
          }else if(xmlData.substr(i + 1, 2) === '![') {
            const closeIndex = findClosingIndex(xmlData, "]]>", i, "CDATA is not closed.") - 2;
            const tagExp = xmlData.substring(i + 9,closeIndex);

            textData = this.saveTextToParentTag(textData, currentNode, jPath);

            let val = this.parseTextData(tagExp, currentNode.tagname, jPath, true, false, true, true);
            if(val == undefined) val = "";

            //cdata should be set even if it is 0 length string
            if(this.options.cdataPropName){
              currentNode.add(this.options.cdataPropName, [ { [this.options.textNodeName] : tagExp } ]);
            }else{
              currentNode.add(this.options.textNodeName, val);
            }
            
            i = closeIndex + 2;
          }else {//Opening tag
            let result = readTagExp(xmlData,i, this.options.removeNSPrefix);
            let tagName= result.tagName;
            const rawTagName = result.rawTagName;
            let tagExp = result.tagExp;
            let attrExpPresent = result.attrExpPresent;
            let closeIndex = result.closeIndex;

            if (this.options.transformTagName) {
              tagName = this.options.transformTagName(tagName);
            }
            
            //save text as child node
            if (currentNode && textData) {
              if(currentNode.tagname !== '!xml'){
                //when nested tag is found
                textData = this.saveTextToParentTag(textData, currentNode, jPath, false);
              }
            }

            //check if last tag was unpaired tag
            const lastTag = currentNode;
            if(lastTag && this.options.unpairedTags.indexOf(lastTag.tagname) !== -1 ){
              currentNode = this.tagsNodeStack.pop();
              jPath = jPath.substring(0, jPath.lastIndexOf("."));
            }
            if(tagName !== xmlObj.tagname){
              jPath += jPath ? "." + tagName : tagName;
            }
            if (this.isItStopNode(this.options.stopNodes, jPath, tagName)) {
              let tagContent = "";
              //self-closing tag
              if(tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1){
                if(tagName[tagName.length - 1] === "/"){ //remove trailing '/'
                  tagName = tagName.substr(0, tagName.length - 1);
                  jPath = jPath.substr(0, jPath.length - 1);
                  tagExp = tagName;
                }else{
                  tagExp = tagExp.substr(0, tagExp.length - 1);
                }
                i = result.closeIndex;
              }
              //unpaired tag
              else if(this.options.unpairedTags.indexOf(tagName) !== -1){
                
                i = result.closeIndex;
              }
              //normal tag
              else{
                //read until closing tag is found
                const result = this.readStopNodeData(xmlData, rawTagName, closeIndex + 1);
                if(!result) throw new Error(`Unexpected end of ${rawTagName}`);
                i = result.i;
                tagContent = result.tagContent;
              }

              const childNode = new xmlNode(tagName);
              if(tagName !== tagExp && attrExpPresent){
                childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
              }
              if(tagContent) {
                tagContent = this.parseTextData(tagContent, tagName, jPath, true, attrExpPresent, true, true);
              }
              
              jPath = jPath.substr(0, jPath.lastIndexOf("."));
              childNode.add(this.options.textNodeName, tagContent);
              
              this.addChild(currentNode, childNode, jPath)
            }else{
      //selfClosing tag
              if(tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1){
                if(tagName[tagName.length - 1] === "/"){ //remove trailing '/'
                  tagName = tagName.substr(0, tagName.length - 1);
                  jPath = jPath.substr(0, jPath.length - 1);
                  tagExp = tagName;
                }else{
                  tagExp = tagExp.substr(0, tagExp.length - 1);
                }
                
                if(this.options.transformTagName) {
                  tagName = this.options.transformTagName(tagName);
                }

                const childNode = new xmlNode(tagName);
                if(tagName !== tagExp && attrExpPresent){
                  childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
                }
                this.addChild(currentNode, childNode, jPath)
                jPath = jPath.substr(0, jPath.lastIndexOf("."));
              }
        //opening tag
              else{
                const childNode = new xmlNode( tagName);
                this.tagsNodeStack.push(currentNode);
                
                if(tagName !== tagExp && attrExpPresent){
                  childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
                }
                this.addChild(currentNode, childNode, jPath)
                currentNode = childNode;
              }
              textData = "";
              i = closeIndex;
            }
          }
        }else{
          textData += xmlData[i];
        }
      }
      return xmlObj.child;
    }

    function addChild(currentNode, childNode, jPath){
      const result = this.options.updateTag(childNode.tagname, jPath, childNode[":@"])
      if(result === false){
      }else if(typeof result === "string"){
        childNode.tagname = result
        currentNode.addChild(childNode);
      }else{
        currentNode.addChild(childNode);
      }
    }

    const replaceEntitiesValue = function(val){

      if(this.options.processEntities){
        for(let entityName in this.docTypeEntities){
          const entity = this.docTypeEntities[entityName];
          val = val.replace( entity.regx, entity.val);
        }
        for(let entityName in this.lastEntities){
          const entity = this.lastEntities[entityName];
          val = val.replace( entity.regex, entity.val);
        }
        if(this.options.htmlEntities){
          for(let entityName in this.htmlEntities){
            const entity = this.htmlEntities[entityName];
            val = val.replace( entity.regex, entity.val);
          }
        }
        val = val.replace( this.ampEntity.regex, this.ampEntity.val);
      }
      return val;
    }
    function saveTextToParentTag(textData, currentNode, jPath, isLeafNode) {
      if (textData) { //store previously collected data as textNode
        if(isLeafNode === undefined) isLeafNode = Object.keys(currentNode.child).length === 0
        
        textData = this.parseTextData(textData,
          currentNode.tagname,
          jPath,
          false,
          currentNode[":@"] ? Object.keys(currentNode[":@"]).length !== 0 : false,
          isLeafNode);

        if (textData !== undefined && textData !== "")
          currentNode.add(this.options.textNodeName, textData);
        textData = "";
      }
      return textData;
    }

    //TODO: use jPath to simplify the logic
    /**
     * 
     * @param {string[]} stopNodes 
     * @param {string} jPath
     * @param {string} currentTagName 
     */
    function isItStopNode(stopNodes, jPath, currentTagName){
      const allNodesExp = "*." + currentTagName;
      for (const stopNodePath in stopNodes) {
        const stopNodeExp = stopNodes[stopNodePath];
        if( allNodesExp === stopNodeExp || jPath === stopNodeExp  ) return true;
      }
      return false;
    }

    /**
     * Returns the tag Expression and where it is ending handling single-double quotes situation
     * @param {string} xmlData 
     * @param {number} i starting index
     * @returns 
     */
    function tagExpWithClosingIndex(xmlData, i, closingChar = ">"){
      let attrBoundary;
      let tagExp = "";
      for (let index = i; index < xmlData.length; index++) {
        let ch = xmlData[index];
        if (attrBoundary) {
            if (ch === attrBoundary) attrBoundary = "";//reset
        } else if (ch === '"' || ch === "'") {
            attrBoundary = ch;
        } else if (ch === closingChar[0]) {
          if(closingChar[1]){
            if(xmlData[index + 1] === closingChar[1]){
              return {
                data: tagExp,
                index: index
              }
            }
          }else{
            return {
              data: tagExp,
              index: index
            }
          }
        } else if (ch === '\t') {
          ch = " "
        }
        tagExp += ch;
      }
    }

    function findClosingIndex(xmlData, str, i, errMsg){
      const closingIndex = xmlData.indexOf(str, i);
      if(closingIndex === -1){
        throw new Error(errMsg)
      }else{
        return closingIndex + str.length - 1;
      }
    }

    function readTagExp(xmlData,i, removeNSPrefix, closingChar = ">"){
      const result = tagExpWithClosingIndex(xmlData, i+1, closingChar);
      if(!result) return;
      let tagExp = result.data;
      const closeIndex = result.index;
      const separatorIndex = tagExp.search(/\s/);
      let tagName = tagExp;
      let attrExpPresent = true;
      if(separatorIndex !== -1){//separate tag name and attributes expression
        tagName = tagExp.substring(0, separatorIndex);
        tagExp = tagExp.substring(separatorIndex + 1).trimStart();
      }

      const rawTagName = tagName;
      if(removeNSPrefix){
        const colonIndex = tagName.indexOf(":");
        if(colonIndex !== -1){
          tagName = tagName.substr(colonIndex+1);
          attrExpPresent = tagName !== result.data.substr(colonIndex + 1);
        }
      }

      return {
        tagName: tagName,
        tagExp: tagExp,
        closeIndex: closeIndex,
        attrExpPresent: attrExpPresent,
        rawTagName: rawTagName,
      }
    }
    /**
     * find paired tag for a stop node
     * @param {string} xmlData 
     * @param {string} tagName 
     * @param {number} i 
     */
    function readStopNodeData(xmlData, tagName, i){
      const startIndex = i;
      // Starting at 1 since we already have an open tag
      let openTagCount = 1;

      for (; i < xmlData.length; i++) {
        if( xmlData[i] === "<"){ 
          if (xmlData[i+1] === "/") {//close tag
              const closeIndex = findClosingIndex(xmlData, ">", i, `${tagName} is not closed`);
              let closeTagName = xmlData.substring(i+2,closeIndex).trim();
              if(closeTagName === tagName){
                openTagCount--;
                if (openTagCount === 0) {
                  return {
                    tagContent: xmlData.substring(startIndex, i),
                    i : closeIndex
                  }
                }
              }
              i=closeIndex;
            } else if(xmlData[i+1] === '?') { 
              const closeIndex = findClosingIndex(xmlData, "?>", i+1, "StopNode is not closed.")
              i=closeIndex;
            } else if(xmlData.substr(i + 1, 3) === '!--') { 
              const closeIndex = findClosingIndex(xmlData, "-->", i+3, "StopNode is not closed.")
              i=closeIndex;
            } else if(xmlData.substr(i + 1, 2) === '![') { 
              const closeIndex = findClosingIndex(xmlData, "]]>", i, "StopNode is not closed.") - 2;
              i=closeIndex;
            } else {
              const tagData = readTagExp(xmlData, i, '>')

              if (tagData) {
                const openTagName = tagData && tagData.tagName;
                if (openTagName === tagName && tagData.tagExp[tagData.tagExp.length-1] !== "/") {
                  openTagCount++;
                }
                i=tagData.closeIndex;
              }
            }
          }
      }//end for loop
    }

    function parseValue(val, shouldParse, options) {
      if (shouldParse && typeof val === 'string') {
        //console.log(options)
        const newval = val.trim();
        if(newval === 'true' ) return true;
        else if(newval === 'false' ) return false;
        else return toNumber(val, options);
      } else {
        if (util.isExist(val)) {
          return val;
        } else {
          return '';
        }
      }
    }


    module.exports = OrderedObjParser;


    /***/ }),

    /***/ "./node_modules/fast-xml-parser/src/xmlparser/XMLParser.js":
    /*!*****************************************************************!*\
      !*** ./node_modules/fast-xml-parser/src/xmlparser/XMLParser.js ***!
      \*****************************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    const { buildOptions} = __webpack_require__(/*! ./OptionsBuilder */ "./node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js");
    const OrderedObjParser = __webpack_require__(/*! ./OrderedObjParser */ "./node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js");
    const { prettify} = __webpack_require__(/*! ./node2json */ "./node_modules/fast-xml-parser/src/xmlparser/node2json.js");
    const validator = __webpack_require__(/*! ../validator */ "./node_modules/fast-xml-parser/src/validator.js");

    class XMLParser{
        
        constructor(options){
            this.externalEntities = {};
            this.options = buildOptions(options);
            
        }
        /**
         * Parse XML dats to JS object 
         * @param {string|Buffer} xmlData 
         * @param {boolean|Object} validationOption 
         */
        parse(xmlData,validationOption){
            if(typeof xmlData === "string"){
            }else if( xmlData.toString){
                xmlData = xmlData.toString();
            }else{
                throw new Error("XML data is accepted in String or Bytes[] form.")
            }
            if( validationOption){
                if(validationOption === true) validationOption = {}; //validate with default options
                
                const result = validator.validate(xmlData, validationOption);
                if (result !== true) {
                  throw Error( `${result.err.msg}:${result.err.line}:${result.err.col}` )
                }
              }
            const orderedObjParser = new OrderedObjParser(this.options);
            orderedObjParser.addExternalEntities(this.externalEntities);
            const orderedResult = orderedObjParser.parseXml(xmlData);
            if(this.options.preserveOrder || orderedResult === undefined) return orderedResult;
            else return prettify(orderedResult, this.options);
        }

        /**
         * Add Entity which is not by default supported by this library
         * @param {string} key 
         * @param {string} value 
         */
        addEntity(key, value){
            if(value.indexOf("&") !== -1){
                throw new Error("Entity value can't have '&'")
            }else if(key.indexOf("&") !== -1 || key.indexOf(";") !== -1){
                throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'")
            }else if(value === "&"){
                throw new Error("An entity with value '&' is not permitted");
            }else{
                this.externalEntities[key] = value;
            }
        }
    }

    module.exports = XMLParser;

    /***/ }),

    /***/ "./node_modules/fast-xml-parser/src/xmlparser/node2json.js":
    /*!*****************************************************************!*\
      !*** ./node_modules/fast-xml-parser/src/xmlparser/node2json.js ***!
      \*****************************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    "use strict";


    /**
     * 
     * @param {array} node 
     * @param {any} options 
     * @returns 
     */
    function prettify(node, options){
      return compress( node, options);
    }

    /**
     * 
     * @param {array} arr 
     * @param {object} options 
     * @param {string} jPath 
     * @returns object
     */
    function compress(arr, options, jPath){
      let text;
      const compressedObj = {};
      for (let i = 0; i < arr.length; i++) {
        const tagObj = arr[i];
        const property = propName(tagObj);
        let newJpath = "";
        if(jPath === undefined) newJpath = property;
        else newJpath = jPath + "." + property;

        if(property === options.textNodeName){
          if(text === undefined) text = tagObj[property];
          else text += "" + tagObj[property];
        }else if(property === undefined){
          continue;
        }else if(tagObj[property]){
          
          let val = compress(tagObj[property], options, newJpath);
          const isLeaf = isLeafTag(val, options);

          if(tagObj[":@"]){
            assignAttributes( val, tagObj[":@"], newJpath, options);
          }else if(Object.keys(val).length === 1 && val[options.textNodeName] !== undefined && !options.alwaysCreateTextNode){
            val = val[options.textNodeName];
          }else if(Object.keys(val).length === 0){
            if(options.alwaysCreateTextNode) val[options.textNodeName] = "";
            else val = "";
          }

          if(compressedObj[property] !== undefined && compressedObj.hasOwnProperty(property)) {
            if(!Array.isArray(compressedObj[property])) {
                compressedObj[property] = [ compressedObj[property] ];
            }
            compressedObj[property].push(val);
          }else{
            //TODO: if a node is not an array, then check if it should be an array
            //also determine if it is a leaf node
            if (options.isArray(property, newJpath, isLeaf )) {
              compressedObj[property] = [val];
            }else{
              compressedObj[property] = val;
            }
          }
        }
        
      }
      // if(text && text.length > 0) compressedObj[options.textNodeName] = text;
      if(typeof text === "string"){
        if(text.length > 0) compressedObj[options.textNodeName] = text;
      }else if(text !== undefined) compressedObj[options.textNodeName] = text;
      return compressedObj;
    }

    function propName(obj){
      const keys = Object.keys(obj);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if(key !== ":@") return key;
      }
    }

    function assignAttributes(obj, attrMap, jpath, options){
      if (attrMap) {
        const keys = Object.keys(attrMap);
        const len = keys.length; //don't make it inline
        for (let i = 0; i < len; i++) {
          const atrrName = keys[i];
          if (options.isArray(atrrName, jpath + "." + atrrName, true, true)) {
            obj[atrrName] = [ attrMap[atrrName] ];
          } else {
            obj[atrrName] = attrMap[atrrName];
          }
        }
      }
    }

    function isLeafTag(obj, options){
      const { textNodeName } = options;
      const propCount = Object.keys(obj).length;
      
      if (propCount === 0) {
        return true;
      }

      if (
        propCount === 1 &&
        (obj[textNodeName] || typeof obj[textNodeName] === "boolean" || obj[textNodeName] === 0)
      ) {
        return true;
      }

      return false;
    }
    exports.prettify = prettify;


    /***/ }),

    /***/ "./node_modules/fast-xml-parser/src/xmlparser/xmlNode.js":
    /*!***************************************************************!*\
      !*** ./node_modules/fast-xml-parser/src/xmlparser/xmlNode.js ***!
      \***************************************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    "use strict";


    class XmlNode{
      constructor(tagname) {
        this.tagname = tagname;
        this.child = []; //nested tags, text, cdata, comments in order
        this[":@"] = {}; //attributes map
      }
      add(key,val){
        // this.child.push( {name : key, val: val, isCdata: isCdata });
        if(key === "__proto__") key = "#__proto__";
        this.child.push( {[key]: val });
      }
      addChild(node) {
        if(node.tagname === "__proto__") node.tagname = "#__proto__";
        if(node[":@"] && Object.keys(node[":@"]).length > 0){
          this.child.push( { [node.tagname]: node.child, [":@"]: node[":@"] });
        }else{
          this.child.push( { [node.tagname]: node.child });
        }
      };
    };


    module.exports = XmlNode;

    /***/ }),

    /***/ "./node_modules/mime/Mime.js":
    /*!***********************************!*\
      !*** ./node_modules/mime/Mime.js ***!
      \***********************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    "use strict";


    /**
     * @param typeMap [Object] Map of MIME type -> Array[extensions]
     * @param ...
     */
    function Mime() {
      this._types = Object.create(null);
      this._extensions = Object.create(null);

      for (let i = 0; i < arguments.length; i++) {
        this.define(arguments[i]);
      }

      this.define = this.define.bind(this);
      this.getType = this.getType.bind(this);
      this.getExtension = this.getExtension.bind(this);
    }

    /**
     * Define mimetype -> extension mappings.  Each key is a mime-type that maps
     * to an array of extensions associated with the type.  The first extension is
     * used as the default extension for the type.
     *
     * e.g. mime.define({'audio/ogg', ['oga', 'ogg', 'spx']});
     *
     * If a type declares an extension that has already been defined, an error will
     * be thrown.  To suppress this error and force the extension to be associated
     * with the new type, pass `force`=true.  Alternatively, you may prefix the
     * extension with "*" to map the type to extension, without mapping the
     * extension to the type.
     *
     * e.g. mime.define({'audio/wav', ['wav']}, {'audio/x-wav', ['*wav']});
     *
     *
     * @param map (Object) type definitions
     * @param force (Boolean) if true, force overriding of existing definitions
     */
    Mime.prototype.define = function(typeMap, force) {
      for (let type in typeMap) {
        let extensions = typeMap[type].map(function(t) {
          return t.toLowerCase();
        });
        type = type.toLowerCase();

        for (let i = 0; i < extensions.length; i++) {
          const ext = extensions[i];

          // '*' prefix = not the preferred type for this extension.  So fixup the
          // extension, and skip it.
          if (ext[0] === '*') {
            continue;
          }

          if (!force && (ext in this._types)) {
            throw new Error(
              'Attempt to change mapping for "' + ext +
              '" extension from "' + this._types[ext] + '" to "' + type +
              '". Pass `force=true` to allow this, otherwise remove "' + ext +
              '" from the list of extensions for "' + type + '".'
            );
          }

          this._types[ext] = type;
        }

        // Use first extension as default
        if (force || !this._extensions[type]) {
          const ext = extensions[0];
          this._extensions[type] = (ext[0] !== '*') ? ext : ext.substr(1);
        }
      }
    };

    /**
     * Lookup a mime type based on extension
     */
    Mime.prototype.getType = function(path) {
      path = String(path);
      let last = path.replace(/^.*[/\\]/, '').toLowerCase();
      let ext = last.replace(/^.*\./, '').toLowerCase();

      let hasPath = last.length < path.length;
      let hasDot = ext.length < last.length - 1;

      return (hasDot || !hasPath) && this._types[ext] || null;
    };

    /**
     * Return file extension associated with a mime type
     */
    Mime.prototype.getExtension = function(type) {
      type = /^\s*([^;\s]*)/.test(type) && RegExp.$1;
      return type && this._extensions[type.toLowerCase()] || null;
    };

    module.exports = Mime;


    /***/ }),

    /***/ "./node_modules/mime/index.js":
    /*!************************************!*\
      !*** ./node_modules/mime/index.js ***!
      \************************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    "use strict";


    let Mime = __webpack_require__(/*! ./Mime */ "./node_modules/mime/Mime.js");
    module.exports = new Mime(__webpack_require__(/*! ./types/standard */ "./node_modules/mime/types/standard.js"), __webpack_require__(/*! ./types/other */ "./node_modules/mime/types/other.js"));


    /***/ }),

    /***/ "./node_modules/mime/types/other.js":
    /*!******************************************!*\
      !*** ./node_modules/mime/types/other.js ***!
      \******************************************/
    /*! no static exports found */
    /***/ (function(module, exports) {

    module.exports = {"application/prs.cww":["cww"],"application/vnd.1000minds.decision-model+xml":["1km"],"application/vnd.3gpp.pic-bw-large":["plb"],"application/vnd.3gpp.pic-bw-small":["psb"],"application/vnd.3gpp.pic-bw-var":["pvb"],"application/vnd.3gpp2.tcap":["tcap"],"application/vnd.3m.post-it-notes":["pwn"],"application/vnd.accpac.simply.aso":["aso"],"application/vnd.accpac.simply.imp":["imp"],"application/vnd.acucobol":["acu"],"application/vnd.acucorp":["atc","acutc"],"application/vnd.adobe.air-application-installer-package+zip":["air"],"application/vnd.adobe.formscentral.fcdt":["fcdt"],"application/vnd.adobe.fxp":["fxp","fxpl"],"application/vnd.adobe.xdp+xml":["xdp"],"application/vnd.adobe.xfdf":["xfdf"],"application/vnd.ahead.space":["ahead"],"application/vnd.airzip.filesecure.azf":["azf"],"application/vnd.airzip.filesecure.azs":["azs"],"application/vnd.amazon.ebook":["azw"],"application/vnd.americandynamics.acc":["acc"],"application/vnd.amiga.ami":["ami"],"application/vnd.android.package-archive":["apk"],"application/vnd.anser-web-certificate-issue-initiation":["cii"],"application/vnd.anser-web-funds-transfer-initiation":["fti"],"application/vnd.antix.game-component":["atx"],"application/vnd.apple.installer+xml":["mpkg"],"application/vnd.apple.keynote":["key"],"application/vnd.apple.mpegurl":["m3u8"],"application/vnd.apple.numbers":["numbers"],"application/vnd.apple.pages":["pages"],"application/vnd.apple.pkpass":["pkpass"],"application/vnd.aristanetworks.swi":["swi"],"application/vnd.astraea-software.iota":["iota"],"application/vnd.audiograph":["aep"],"application/vnd.balsamiq.bmml+xml":["bmml"],"application/vnd.blueice.multipass":["mpm"],"application/vnd.bmi":["bmi"],"application/vnd.businessobjects":["rep"],"application/vnd.chemdraw+xml":["cdxml"],"application/vnd.chipnuts.karaoke-mmd":["mmd"],"application/vnd.cinderella":["cdy"],"application/vnd.citationstyles.style+xml":["csl"],"application/vnd.claymore":["cla"],"application/vnd.cloanto.rp9":["rp9"],"application/vnd.clonk.c4group":["c4g","c4d","c4f","c4p","c4u"],"application/vnd.cluetrust.cartomobile-config":["c11amc"],"application/vnd.cluetrust.cartomobile-config-pkg":["c11amz"],"application/vnd.commonspace":["csp"],"application/vnd.contact.cmsg":["cdbcmsg"],"application/vnd.cosmocaller":["cmc"],"application/vnd.crick.clicker":["clkx"],"application/vnd.crick.clicker.keyboard":["clkk"],"application/vnd.crick.clicker.palette":["clkp"],"application/vnd.crick.clicker.template":["clkt"],"application/vnd.crick.clicker.wordbank":["clkw"],"application/vnd.criticaltools.wbs+xml":["wbs"],"application/vnd.ctc-posml":["pml"],"application/vnd.cups-ppd":["ppd"],"application/vnd.curl.car":["car"],"application/vnd.curl.pcurl":["pcurl"],"application/vnd.dart":["dart"],"application/vnd.data-vision.rdz":["rdz"],"application/vnd.dbf":["dbf"],"application/vnd.dece.data":["uvf","uvvf","uvd","uvvd"],"application/vnd.dece.ttml+xml":["uvt","uvvt"],"application/vnd.dece.unspecified":["uvx","uvvx"],"application/vnd.dece.zip":["uvz","uvvz"],"application/vnd.denovo.fcselayout-link":["fe_launch"],"application/vnd.dna":["dna"],"application/vnd.dolby.mlp":["mlp"],"application/vnd.dpgraph":["dpg"],"application/vnd.dreamfactory":["dfac"],"application/vnd.ds-keypoint":["kpxx"],"application/vnd.dvb.ait":["ait"],"application/vnd.dvb.service":["svc"],"application/vnd.dynageo":["geo"],"application/vnd.ecowin.chart":["mag"],"application/vnd.enliven":["nml"],"application/vnd.epson.esf":["esf"],"application/vnd.epson.msf":["msf"],"application/vnd.epson.quickanime":["qam"],"application/vnd.epson.salt":["slt"],"application/vnd.epson.ssf":["ssf"],"application/vnd.eszigno3+xml":["es3","et3"],"application/vnd.ezpix-album":["ez2"],"application/vnd.ezpix-package":["ez3"],"application/vnd.fdf":["fdf"],"application/vnd.fdsn.mseed":["mseed"],"application/vnd.fdsn.seed":["seed","dataless"],"application/vnd.flographit":["gph"],"application/vnd.fluxtime.clip":["ftc"],"application/vnd.framemaker":["fm","frame","maker","book"],"application/vnd.frogans.fnc":["fnc"],"application/vnd.frogans.ltf":["ltf"],"application/vnd.fsc.weblaunch":["fsc"],"application/vnd.fujitsu.oasys":["oas"],"application/vnd.fujitsu.oasys2":["oa2"],"application/vnd.fujitsu.oasys3":["oa3"],"application/vnd.fujitsu.oasysgp":["fg5"],"application/vnd.fujitsu.oasysprs":["bh2"],"application/vnd.fujixerox.ddd":["ddd"],"application/vnd.fujixerox.docuworks":["xdw"],"application/vnd.fujixerox.docuworks.binder":["xbd"],"application/vnd.fuzzysheet":["fzs"],"application/vnd.genomatix.tuxedo":["txd"],"application/vnd.geogebra.file":["ggb"],"application/vnd.geogebra.tool":["ggt"],"application/vnd.geometry-explorer":["gex","gre"],"application/vnd.geonext":["gxt"],"application/vnd.geoplan":["g2w"],"application/vnd.geospace":["g3w"],"application/vnd.gmx":["gmx"],"application/vnd.google-apps.document":["gdoc"],"application/vnd.google-apps.presentation":["gslides"],"application/vnd.google-apps.spreadsheet":["gsheet"],"application/vnd.google-earth.kml+xml":["kml"],"application/vnd.google-earth.kmz":["kmz"],"application/vnd.grafeq":["gqf","gqs"],"application/vnd.groove-account":["gac"],"application/vnd.groove-help":["ghf"],"application/vnd.groove-identity-message":["gim"],"application/vnd.groove-injector":["grv"],"application/vnd.groove-tool-message":["gtm"],"application/vnd.groove-tool-template":["tpl"],"application/vnd.groove-vcard":["vcg"],"application/vnd.hal+xml":["hal"],"application/vnd.handheld-entertainment+xml":["zmm"],"application/vnd.hbci":["hbci"],"application/vnd.hhe.lesson-player":["les"],"application/vnd.hp-hpgl":["hpgl"],"application/vnd.hp-hpid":["hpid"],"application/vnd.hp-hps":["hps"],"application/vnd.hp-jlyt":["jlt"],"application/vnd.hp-pcl":["pcl"],"application/vnd.hp-pclxl":["pclxl"],"application/vnd.hydrostatix.sof-data":["sfd-hdstx"],"application/vnd.ibm.minipay":["mpy"],"application/vnd.ibm.modcap":["afp","listafp","list3820"],"application/vnd.ibm.rights-management":["irm"],"application/vnd.ibm.secure-container":["sc"],"application/vnd.iccprofile":["icc","icm"],"application/vnd.igloader":["igl"],"application/vnd.immervision-ivp":["ivp"],"application/vnd.immervision-ivu":["ivu"],"application/vnd.insors.igm":["igm"],"application/vnd.intercon.formnet":["xpw","xpx"],"application/vnd.intergeo":["i2g"],"application/vnd.intu.qbo":["qbo"],"application/vnd.intu.qfx":["qfx"],"application/vnd.ipunplugged.rcprofile":["rcprofile"],"application/vnd.irepository.package+xml":["irp"],"application/vnd.is-xpr":["xpr"],"application/vnd.isac.fcs":["fcs"],"application/vnd.jam":["jam"],"application/vnd.jcp.javame.midlet-rms":["rms"],"application/vnd.jisp":["jisp"],"application/vnd.joost.joda-archive":["joda"],"application/vnd.kahootz":["ktz","ktr"],"application/vnd.kde.karbon":["karbon"],"application/vnd.kde.kchart":["chrt"],"application/vnd.kde.kformula":["kfo"],"application/vnd.kde.kivio":["flw"],"application/vnd.kde.kontour":["kon"],"application/vnd.kde.kpresenter":["kpr","kpt"],"application/vnd.kde.kspread":["ksp"],"application/vnd.kde.kword":["kwd","kwt"],"application/vnd.kenameaapp":["htke"],"application/vnd.kidspiration":["kia"],"application/vnd.kinar":["kne","knp"],"application/vnd.koan":["skp","skd","skt","skm"],"application/vnd.kodak-descriptor":["sse"],"application/vnd.las.las+xml":["lasxml"],"application/vnd.llamagraphics.life-balance.desktop":["lbd"],"application/vnd.llamagraphics.life-balance.exchange+xml":["lbe"],"application/vnd.lotus-1-2-3":["123"],"application/vnd.lotus-approach":["apr"],"application/vnd.lotus-freelance":["pre"],"application/vnd.lotus-notes":["nsf"],"application/vnd.lotus-organizer":["org"],"application/vnd.lotus-screencam":["scm"],"application/vnd.lotus-wordpro":["lwp"],"application/vnd.macports.portpkg":["portpkg"],"application/vnd.mapbox-vector-tile":["mvt"],"application/vnd.mcd":["mcd"],"application/vnd.medcalcdata":["mc1"],"application/vnd.mediastation.cdkey":["cdkey"],"application/vnd.mfer":["mwf"],"application/vnd.mfmp":["mfm"],"application/vnd.micrografx.flo":["flo"],"application/vnd.micrografx.igx":["igx"],"application/vnd.mif":["mif"],"application/vnd.mobius.daf":["daf"],"application/vnd.mobius.dis":["dis"],"application/vnd.mobius.mbk":["mbk"],"application/vnd.mobius.mqy":["mqy"],"application/vnd.mobius.msl":["msl"],"application/vnd.mobius.plc":["plc"],"application/vnd.mobius.txf":["txf"],"application/vnd.mophun.application":["mpn"],"application/vnd.mophun.certificate":["mpc"],"application/vnd.mozilla.xul+xml":["xul"],"application/vnd.ms-artgalry":["cil"],"application/vnd.ms-cab-compressed":["cab"],"application/vnd.ms-excel":["xls","xlm","xla","xlc","xlt","xlw"],"application/vnd.ms-excel.addin.macroenabled.12":["xlam"],"application/vnd.ms-excel.sheet.binary.macroenabled.12":["xlsb"],"application/vnd.ms-excel.sheet.macroenabled.12":["xlsm"],"application/vnd.ms-excel.template.macroenabled.12":["xltm"],"application/vnd.ms-fontobject":["eot"],"application/vnd.ms-htmlhelp":["chm"],"application/vnd.ms-ims":["ims"],"application/vnd.ms-lrm":["lrm"],"application/vnd.ms-officetheme":["thmx"],"application/vnd.ms-outlook":["msg"],"application/vnd.ms-pki.seccat":["cat"],"application/vnd.ms-pki.stl":["*stl"],"application/vnd.ms-powerpoint":["ppt","pps","pot"],"application/vnd.ms-powerpoint.addin.macroenabled.12":["ppam"],"application/vnd.ms-powerpoint.presentation.macroenabled.12":["pptm"],"application/vnd.ms-powerpoint.slide.macroenabled.12":["sldm"],"application/vnd.ms-powerpoint.slideshow.macroenabled.12":["ppsm"],"application/vnd.ms-powerpoint.template.macroenabled.12":["potm"],"application/vnd.ms-project":["mpp","mpt"],"application/vnd.ms-word.document.macroenabled.12":["docm"],"application/vnd.ms-word.template.macroenabled.12":["dotm"],"application/vnd.ms-works":["wps","wks","wcm","wdb"],"application/vnd.ms-wpl":["wpl"],"application/vnd.ms-xpsdocument":["xps"],"application/vnd.mseq":["mseq"],"application/vnd.musician":["mus"],"application/vnd.muvee.style":["msty"],"application/vnd.mynfc":["taglet"],"application/vnd.neurolanguage.nlu":["nlu"],"application/vnd.nitf":["ntf","nitf"],"application/vnd.noblenet-directory":["nnd"],"application/vnd.noblenet-sealer":["nns"],"application/vnd.noblenet-web":["nnw"],"application/vnd.nokia.n-gage.ac+xml":["*ac"],"application/vnd.nokia.n-gage.data":["ngdat"],"application/vnd.nokia.n-gage.symbian.install":["n-gage"],"application/vnd.nokia.radio-preset":["rpst"],"application/vnd.nokia.radio-presets":["rpss"],"application/vnd.novadigm.edm":["edm"],"application/vnd.novadigm.edx":["edx"],"application/vnd.novadigm.ext":["ext"],"application/vnd.oasis.opendocument.chart":["odc"],"application/vnd.oasis.opendocument.chart-template":["otc"],"application/vnd.oasis.opendocument.database":["odb"],"application/vnd.oasis.opendocument.formula":["odf"],"application/vnd.oasis.opendocument.formula-template":["odft"],"application/vnd.oasis.opendocument.graphics":["odg"],"application/vnd.oasis.opendocument.graphics-template":["otg"],"application/vnd.oasis.opendocument.image":["odi"],"application/vnd.oasis.opendocument.image-template":["oti"],"application/vnd.oasis.opendocument.presentation":["odp"],"application/vnd.oasis.opendocument.presentation-template":["otp"],"application/vnd.oasis.opendocument.spreadsheet":["ods"],"application/vnd.oasis.opendocument.spreadsheet-template":["ots"],"application/vnd.oasis.opendocument.text":["odt"],"application/vnd.oasis.opendocument.text-master":["odm"],"application/vnd.oasis.opendocument.text-template":["ott"],"application/vnd.oasis.opendocument.text-web":["oth"],"application/vnd.olpc-sugar":["xo"],"application/vnd.oma.dd2+xml":["dd2"],"application/vnd.openblox.game+xml":["obgx"],"application/vnd.openofficeorg.extension":["oxt"],"application/vnd.openstreetmap.data+xml":["osm"],"application/vnd.openxmlformats-officedocument.presentationml.presentation":["pptx"],"application/vnd.openxmlformats-officedocument.presentationml.slide":["sldx"],"application/vnd.openxmlformats-officedocument.presentationml.slideshow":["ppsx"],"application/vnd.openxmlformats-officedocument.presentationml.template":["potx"],"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":["xlsx"],"application/vnd.openxmlformats-officedocument.spreadsheetml.template":["xltx"],"application/vnd.openxmlformats-officedocument.wordprocessingml.document":["docx"],"application/vnd.openxmlformats-officedocument.wordprocessingml.template":["dotx"],"application/vnd.osgeo.mapguide.package":["mgp"],"application/vnd.osgi.dp":["dp"],"application/vnd.osgi.subsystem":["esa"],"application/vnd.palm":["pdb","pqa","oprc"],"application/vnd.pawaafile":["paw"],"application/vnd.pg.format":["str"],"application/vnd.pg.osasli":["ei6"],"application/vnd.picsel":["efif"],"application/vnd.pmi.widget":["wg"],"application/vnd.pocketlearn":["plf"],"application/vnd.powerbuilder6":["pbd"],"application/vnd.previewsystems.box":["box"],"application/vnd.proteus.magazine":["mgz"],"application/vnd.publishare-delta-tree":["qps"],"application/vnd.pvi.ptid1":["ptid"],"application/vnd.quark.quarkxpress":["qxd","qxt","qwd","qwt","qxl","qxb"],"application/vnd.rar":["rar"],"application/vnd.realvnc.bed":["bed"],"application/vnd.recordare.musicxml":["mxl"],"application/vnd.recordare.musicxml+xml":["musicxml"],"application/vnd.rig.cryptonote":["cryptonote"],"application/vnd.rim.cod":["cod"],"application/vnd.rn-realmedia":["rm"],"application/vnd.rn-realmedia-vbr":["rmvb"],"application/vnd.route66.link66+xml":["link66"],"application/vnd.sailingtracker.track":["st"],"application/vnd.seemail":["see"],"application/vnd.sema":["sema"],"application/vnd.semd":["semd"],"application/vnd.semf":["semf"],"application/vnd.shana.informed.formdata":["ifm"],"application/vnd.shana.informed.formtemplate":["itp"],"application/vnd.shana.informed.interchange":["iif"],"application/vnd.shana.informed.package":["ipk"],"application/vnd.simtech-mindmapper":["twd","twds"],"application/vnd.smaf":["mmf"],"application/vnd.smart.teacher":["teacher"],"application/vnd.software602.filler.form+xml":["fo"],"application/vnd.solent.sdkm+xml":["sdkm","sdkd"],"application/vnd.spotfire.dxp":["dxp"],"application/vnd.spotfire.sfs":["sfs"],"application/vnd.stardivision.calc":["sdc"],"application/vnd.stardivision.draw":["sda"],"application/vnd.stardivision.impress":["sdd"],"application/vnd.stardivision.math":["smf"],"application/vnd.stardivision.writer":["sdw","vor"],"application/vnd.stardivision.writer-global":["sgl"],"application/vnd.stepmania.package":["smzip"],"application/vnd.stepmania.stepchart":["sm"],"application/vnd.sun.wadl+xml":["wadl"],"application/vnd.sun.xml.calc":["sxc"],"application/vnd.sun.xml.calc.template":["stc"],"application/vnd.sun.xml.draw":["sxd"],"application/vnd.sun.xml.draw.template":["std"],"application/vnd.sun.xml.impress":["sxi"],"application/vnd.sun.xml.impress.template":["sti"],"application/vnd.sun.xml.math":["sxm"],"application/vnd.sun.xml.writer":["sxw"],"application/vnd.sun.xml.writer.global":["sxg"],"application/vnd.sun.xml.writer.template":["stw"],"application/vnd.sus-calendar":["sus","susp"],"application/vnd.svd":["svd"],"application/vnd.symbian.install":["sis","sisx"],"application/vnd.syncml+xml":["xsm"],"application/vnd.syncml.dm+wbxml":["bdm"],"application/vnd.syncml.dm+xml":["xdm"],"application/vnd.syncml.dmddf+xml":["ddf"],"application/vnd.tao.intent-module-archive":["tao"],"application/vnd.tcpdump.pcap":["pcap","cap","dmp"],"application/vnd.tmobile-livetv":["tmo"],"application/vnd.trid.tpt":["tpt"],"application/vnd.triscape.mxs":["mxs"],"application/vnd.trueapp":["tra"],"application/vnd.ufdl":["ufd","ufdl"],"application/vnd.uiq.theme":["utz"],"application/vnd.umajin":["umj"],"application/vnd.unity":["unityweb"],"application/vnd.uoml+xml":["uoml"],"application/vnd.vcx":["vcx"],"application/vnd.visio":["vsd","vst","vss","vsw"],"application/vnd.visionary":["vis"],"application/vnd.vsf":["vsf"],"application/vnd.wap.wbxml":["wbxml"],"application/vnd.wap.wmlc":["wmlc"],"application/vnd.wap.wmlscriptc":["wmlsc"],"application/vnd.webturbo":["wtb"],"application/vnd.wolfram.player":["nbp"],"application/vnd.wordperfect":["wpd"],"application/vnd.wqd":["wqd"],"application/vnd.wt.stf":["stf"],"application/vnd.xara":["xar"],"application/vnd.xfdl":["xfdl"],"application/vnd.yamaha.hv-dic":["hvd"],"application/vnd.yamaha.hv-script":["hvs"],"application/vnd.yamaha.hv-voice":["hvp"],"application/vnd.yamaha.openscoreformat":["osf"],"application/vnd.yamaha.openscoreformat.osfpvg+xml":["osfpvg"],"application/vnd.yamaha.smaf-audio":["saf"],"application/vnd.yamaha.smaf-phrase":["spf"],"application/vnd.yellowriver-custom-menu":["cmp"],"application/vnd.zul":["zir","zirz"],"application/vnd.zzazz.deck+xml":["zaz"],"application/x-7z-compressed":["7z"],"application/x-abiword":["abw"],"application/x-ace-compressed":["ace"],"application/x-apple-diskimage":["*dmg"],"application/x-arj":["arj"],"application/x-authorware-bin":["aab","x32","u32","vox"],"application/x-authorware-map":["aam"],"application/x-authorware-seg":["aas"],"application/x-bcpio":["bcpio"],"application/x-bdoc":["*bdoc"],"application/x-bittorrent":["torrent"],"application/x-blorb":["blb","blorb"],"application/x-bzip":["bz"],"application/x-bzip2":["bz2","boz"],"application/x-cbr":["cbr","cba","cbt","cbz","cb7"],"application/x-cdlink":["vcd"],"application/x-cfs-compressed":["cfs"],"application/x-chat":["chat"],"application/x-chess-pgn":["pgn"],"application/x-chrome-extension":["crx"],"application/x-cocoa":["cco"],"application/x-conference":["nsc"],"application/x-cpio":["cpio"],"application/x-csh":["csh"],"application/x-debian-package":["*deb","udeb"],"application/x-dgc-compressed":["dgc"],"application/x-director":["dir","dcr","dxr","cst","cct","cxt","w3d","fgd","swa"],"application/x-doom":["wad"],"application/x-dtbncx+xml":["ncx"],"application/x-dtbook+xml":["dtb"],"application/x-dtbresource+xml":["res"],"application/x-dvi":["dvi"],"application/x-envoy":["evy"],"application/x-eva":["eva"],"application/x-font-bdf":["bdf"],"application/x-font-ghostscript":["gsf"],"application/x-font-linux-psf":["psf"],"application/x-font-pcf":["pcf"],"application/x-font-snf":["snf"],"application/x-font-type1":["pfa","pfb","pfm","afm"],"application/x-freearc":["arc"],"application/x-futuresplash":["spl"],"application/x-gca-compressed":["gca"],"application/x-glulx":["ulx"],"application/x-gnumeric":["gnumeric"],"application/x-gramps-xml":["gramps"],"application/x-gtar":["gtar"],"application/x-hdf":["hdf"],"application/x-httpd-php":["php"],"application/x-install-instructions":["install"],"application/x-iso9660-image":["*iso"],"application/x-iwork-keynote-sffkey":["*key"],"application/x-iwork-numbers-sffnumbers":["*numbers"],"application/x-iwork-pages-sffpages":["*pages"],"application/x-java-archive-diff":["jardiff"],"application/x-java-jnlp-file":["jnlp"],"application/x-keepass2":["kdbx"],"application/x-latex":["latex"],"application/x-lua-bytecode":["luac"],"application/x-lzh-compressed":["lzh","lha"],"application/x-makeself":["run"],"application/x-mie":["mie"],"application/x-mobipocket-ebook":["prc","mobi"],"application/x-ms-application":["application"],"application/x-ms-shortcut":["lnk"],"application/x-ms-wmd":["wmd"],"application/x-ms-wmz":["wmz"],"application/x-ms-xbap":["xbap"],"application/x-msaccess":["mdb"],"application/x-msbinder":["obd"],"application/x-mscardfile":["crd"],"application/x-msclip":["clp"],"application/x-msdos-program":["*exe"],"application/x-msdownload":["*exe","*dll","com","bat","*msi"],"application/x-msmediaview":["mvb","m13","m14"],"application/x-msmetafile":["*wmf","*wmz","*emf","emz"],"application/x-msmoney":["mny"],"application/x-mspublisher":["pub"],"application/x-msschedule":["scd"],"application/x-msterminal":["trm"],"application/x-mswrite":["wri"],"application/x-netcdf":["nc","cdf"],"application/x-ns-proxy-autoconfig":["pac"],"application/x-nzb":["nzb"],"application/x-perl":["pl","pm"],"application/x-pilot":["*prc","*pdb"],"application/x-pkcs12":["p12","pfx"],"application/x-pkcs7-certificates":["p7b","spc"],"application/x-pkcs7-certreqresp":["p7r"],"application/x-rar-compressed":["*rar"],"application/x-redhat-package-manager":["rpm"],"application/x-research-info-systems":["ris"],"application/x-sea":["sea"],"application/x-sh":["sh"],"application/x-shar":["shar"],"application/x-shockwave-flash":["swf"],"application/x-silverlight-app":["xap"],"application/x-sql":["sql"],"application/x-stuffit":["sit"],"application/x-stuffitx":["sitx"],"application/x-subrip":["srt"],"application/x-sv4cpio":["sv4cpio"],"application/x-sv4crc":["sv4crc"],"application/x-t3vm-image":["t3"],"application/x-tads":["gam"],"application/x-tar":["tar"],"application/x-tcl":["tcl","tk"],"application/x-tex":["tex"],"application/x-tex-tfm":["tfm"],"application/x-texinfo":["texinfo","texi"],"application/x-tgif":["*obj"],"application/x-ustar":["ustar"],"application/x-virtualbox-hdd":["hdd"],"application/x-virtualbox-ova":["ova"],"application/x-virtualbox-ovf":["ovf"],"application/x-virtualbox-vbox":["vbox"],"application/x-virtualbox-vbox-extpack":["vbox-extpack"],"application/x-virtualbox-vdi":["vdi"],"application/x-virtualbox-vhd":["vhd"],"application/x-virtualbox-vmdk":["vmdk"],"application/x-wais-source":["src"],"application/x-web-app-manifest+json":["webapp"],"application/x-x509-ca-cert":["der","crt","pem"],"application/x-xfig":["fig"],"application/x-xliff+xml":["*xlf"],"application/x-xpinstall":["xpi"],"application/x-xz":["xz"],"application/x-zmachine":["z1","z2","z3","z4","z5","z6","z7","z8"],"audio/vnd.dece.audio":["uva","uvva"],"audio/vnd.digital-winds":["eol"],"audio/vnd.dra":["dra"],"audio/vnd.dts":["dts"],"audio/vnd.dts.hd":["dtshd"],"audio/vnd.lucent.voice":["lvp"],"audio/vnd.ms-playready.media.pya":["pya"],"audio/vnd.nuera.ecelp4800":["ecelp4800"],"audio/vnd.nuera.ecelp7470":["ecelp7470"],"audio/vnd.nuera.ecelp9600":["ecelp9600"],"audio/vnd.rip":["rip"],"audio/x-aac":["aac"],"audio/x-aiff":["aif","aiff","aifc"],"audio/x-caf":["caf"],"audio/x-flac":["flac"],"audio/x-m4a":["*m4a"],"audio/x-matroska":["mka"],"audio/x-mpegurl":["m3u"],"audio/x-ms-wax":["wax"],"audio/x-ms-wma":["wma"],"audio/x-pn-realaudio":["ram","ra"],"audio/x-pn-realaudio-plugin":["rmp"],"audio/x-realaudio":["*ra"],"audio/x-wav":["*wav"],"chemical/x-cdx":["cdx"],"chemical/x-cif":["cif"],"chemical/x-cmdf":["cmdf"],"chemical/x-cml":["cml"],"chemical/x-csml":["csml"],"chemical/x-xyz":["xyz"],"image/prs.btif":["btif"],"image/prs.pti":["pti"],"image/vnd.adobe.photoshop":["psd"],"image/vnd.airzip.accelerator.azv":["azv"],"image/vnd.dece.graphic":["uvi","uvvi","uvg","uvvg"],"image/vnd.djvu":["djvu","djv"],"image/vnd.dvb.subtitle":["*sub"],"image/vnd.dwg":["dwg"],"image/vnd.dxf":["dxf"],"image/vnd.fastbidsheet":["fbs"],"image/vnd.fpx":["fpx"],"image/vnd.fst":["fst"],"image/vnd.fujixerox.edmics-mmr":["mmr"],"image/vnd.fujixerox.edmics-rlc":["rlc"],"image/vnd.microsoft.icon":["ico"],"image/vnd.ms-dds":["dds"],"image/vnd.ms-modi":["mdi"],"image/vnd.ms-photo":["wdp"],"image/vnd.net-fpx":["npx"],"image/vnd.pco.b16":["b16"],"image/vnd.tencent.tap":["tap"],"image/vnd.valve.source.texture":["vtf"],"image/vnd.wap.wbmp":["wbmp"],"image/vnd.xiff":["xif"],"image/vnd.zbrush.pcx":["pcx"],"image/x-3ds":["3ds"],"image/x-cmu-raster":["ras"],"image/x-cmx":["cmx"],"image/x-freehand":["fh","fhc","fh4","fh5","fh7"],"image/x-icon":["*ico"],"image/x-jng":["jng"],"image/x-mrsid-image":["sid"],"image/x-ms-bmp":["*bmp"],"image/x-pcx":["*pcx"],"image/x-pict":["pic","pct"],"image/x-portable-anymap":["pnm"],"image/x-portable-bitmap":["pbm"],"image/x-portable-graymap":["pgm"],"image/x-portable-pixmap":["ppm"],"image/x-rgb":["rgb"],"image/x-tga":["tga"],"image/x-xbitmap":["xbm"],"image/x-xpixmap":["xpm"],"image/x-xwindowdump":["xwd"],"message/vnd.wfa.wsc":["wsc"],"model/vnd.collada+xml":["dae"],"model/vnd.dwf":["dwf"],"model/vnd.gdl":["gdl"],"model/vnd.gtw":["gtw"],"model/vnd.mts":["mts"],"model/vnd.opengex":["ogex"],"model/vnd.parasolid.transmit.binary":["x_b"],"model/vnd.parasolid.transmit.text":["x_t"],"model/vnd.sap.vds":["vds"],"model/vnd.usdz+zip":["usdz"],"model/vnd.valve.source.compiled-map":["bsp"],"model/vnd.vtu":["vtu"],"text/prs.lines.tag":["dsc"],"text/vnd.curl":["curl"],"text/vnd.curl.dcurl":["dcurl"],"text/vnd.curl.mcurl":["mcurl"],"text/vnd.curl.scurl":["scurl"],"text/vnd.dvb.subtitle":["sub"],"text/vnd.fly":["fly"],"text/vnd.fmi.flexstor":["flx"],"text/vnd.graphviz":["gv"],"text/vnd.in3d.3dml":["3dml"],"text/vnd.in3d.spot":["spot"],"text/vnd.sun.j2me.app-descriptor":["jad"],"text/vnd.wap.wml":["wml"],"text/vnd.wap.wmlscript":["wmls"],"text/x-asm":["s","asm"],"text/x-c":["c","cc","cxx","cpp","h","hh","dic"],"text/x-component":["htc"],"text/x-fortran":["f","for","f77","f90"],"text/x-handlebars-template":["hbs"],"text/x-java-source":["java"],"text/x-lua":["lua"],"text/x-markdown":["mkd"],"text/x-nfo":["nfo"],"text/x-opml":["opml"],"text/x-org":["*org"],"text/x-pascal":["p","pas"],"text/x-processing":["pde"],"text/x-sass":["sass"],"text/x-scss":["scss"],"text/x-setext":["etx"],"text/x-sfv":["sfv"],"text/x-suse-ymp":["ymp"],"text/x-uuencode":["uu"],"text/x-vcalendar":["vcs"],"text/x-vcard":["vcf"],"video/vnd.dece.hd":["uvh","uvvh"],"video/vnd.dece.mobile":["uvm","uvvm"],"video/vnd.dece.pd":["uvp","uvvp"],"video/vnd.dece.sd":["uvs","uvvs"],"video/vnd.dece.video":["uvv","uvvv"],"video/vnd.dvb.file":["dvb"],"video/vnd.fvt":["fvt"],"video/vnd.mpegurl":["mxu","m4u"],"video/vnd.ms-playready.media.pyv":["pyv"],"video/vnd.uvvu.mp4":["uvu","uvvu"],"video/vnd.vivo":["viv"],"video/x-f4v":["f4v"],"video/x-fli":["fli"],"video/x-flv":["flv"],"video/x-m4v":["m4v"],"video/x-matroska":["mkv","mk3d","mks"],"video/x-mng":["mng"],"video/x-ms-asf":["asf","asx"],"video/x-ms-vob":["vob"],"video/x-ms-wm":["wm"],"video/x-ms-wmv":["wmv"],"video/x-ms-wmx":["wmx"],"video/x-ms-wvx":["wvx"],"video/x-msvideo":["avi"],"video/x-sgi-movie":["movie"],"video/x-smv":["smv"],"x-conference/x-cooltalk":["ice"]};

    /***/ }),

    /***/ "./node_modules/mime/types/standard.js":
    /*!*********************************************!*\
      !*** ./node_modules/mime/types/standard.js ***!
      \*********************************************/
    /*! no static exports found */
    /***/ (function(module, exports) {

    module.exports = {"application/andrew-inset":["ez"],"application/applixware":["aw"],"application/atom+xml":["atom"],"application/atomcat+xml":["atomcat"],"application/atomdeleted+xml":["atomdeleted"],"application/atomsvc+xml":["atomsvc"],"application/atsc-dwd+xml":["dwd"],"application/atsc-held+xml":["held"],"application/atsc-rsat+xml":["rsat"],"application/bdoc":["bdoc"],"application/calendar+xml":["xcs"],"application/ccxml+xml":["ccxml"],"application/cdfx+xml":["cdfx"],"application/cdmi-capability":["cdmia"],"application/cdmi-container":["cdmic"],"application/cdmi-domain":["cdmid"],"application/cdmi-object":["cdmio"],"application/cdmi-queue":["cdmiq"],"application/cu-seeme":["cu"],"application/dash+xml":["mpd"],"application/davmount+xml":["davmount"],"application/docbook+xml":["dbk"],"application/dssc+der":["dssc"],"application/dssc+xml":["xdssc"],"application/ecmascript":["es","ecma"],"application/emma+xml":["emma"],"application/emotionml+xml":["emotionml"],"application/epub+zip":["epub"],"application/exi":["exi"],"application/express":["exp"],"application/fdt+xml":["fdt"],"application/font-tdpfr":["pfr"],"application/geo+json":["geojson"],"application/gml+xml":["gml"],"application/gpx+xml":["gpx"],"application/gxf":["gxf"],"application/gzip":["gz"],"application/hjson":["hjson"],"application/hyperstudio":["stk"],"application/inkml+xml":["ink","inkml"],"application/ipfix":["ipfix"],"application/its+xml":["its"],"application/java-archive":["jar","war","ear"],"application/java-serialized-object":["ser"],"application/java-vm":["class"],"application/javascript":["js","mjs"],"application/json":["json","map"],"application/json5":["json5"],"application/jsonml+json":["jsonml"],"application/ld+json":["jsonld"],"application/lgr+xml":["lgr"],"application/lost+xml":["lostxml"],"application/mac-binhex40":["hqx"],"application/mac-compactpro":["cpt"],"application/mads+xml":["mads"],"application/manifest+json":["webmanifest"],"application/marc":["mrc"],"application/marcxml+xml":["mrcx"],"application/mathematica":["ma","nb","mb"],"application/mathml+xml":["mathml"],"application/mbox":["mbox"],"application/mediaservercontrol+xml":["mscml"],"application/metalink+xml":["metalink"],"application/metalink4+xml":["meta4"],"application/mets+xml":["mets"],"application/mmt-aei+xml":["maei"],"application/mmt-usd+xml":["musd"],"application/mods+xml":["mods"],"application/mp21":["m21","mp21"],"application/mp4":["mp4s","m4p"],"application/msword":["doc","dot"],"application/mxf":["mxf"],"application/n-quads":["nq"],"application/n-triples":["nt"],"application/node":["cjs"],"application/octet-stream":["bin","dms","lrf","mar","so","dist","distz","pkg","bpk","dump","elc","deploy","exe","dll","deb","dmg","iso","img","msi","msp","msm","buffer"],"application/oda":["oda"],"application/oebps-package+xml":["opf"],"application/ogg":["ogx"],"application/omdoc+xml":["omdoc"],"application/onenote":["onetoc","onetoc2","onetmp","onepkg"],"application/oxps":["oxps"],"application/p2p-overlay+xml":["relo"],"application/patch-ops-error+xml":["xer"],"application/pdf":["pdf"],"application/pgp-encrypted":["pgp"],"application/pgp-signature":["asc","sig"],"application/pics-rules":["prf"],"application/pkcs10":["p10"],"application/pkcs7-mime":["p7m","p7c"],"application/pkcs7-signature":["p7s"],"application/pkcs8":["p8"],"application/pkix-attr-cert":["ac"],"application/pkix-cert":["cer"],"application/pkix-crl":["crl"],"application/pkix-pkipath":["pkipath"],"application/pkixcmp":["pki"],"application/pls+xml":["pls"],"application/postscript":["ai","eps","ps"],"application/provenance+xml":["provx"],"application/pskc+xml":["pskcxml"],"application/raml+yaml":["raml"],"application/rdf+xml":["rdf","owl"],"application/reginfo+xml":["rif"],"application/relax-ng-compact-syntax":["rnc"],"application/resource-lists+xml":["rl"],"application/resource-lists-diff+xml":["rld"],"application/rls-services+xml":["rs"],"application/route-apd+xml":["rapd"],"application/route-s-tsid+xml":["sls"],"application/route-usd+xml":["rusd"],"application/rpki-ghostbusters":["gbr"],"application/rpki-manifest":["mft"],"application/rpki-roa":["roa"],"application/rsd+xml":["rsd"],"application/rss+xml":["rss"],"application/rtf":["rtf"],"application/sbml+xml":["sbml"],"application/scvp-cv-request":["scq"],"application/scvp-cv-response":["scs"],"application/scvp-vp-request":["spq"],"application/scvp-vp-response":["spp"],"application/sdp":["sdp"],"application/senml+xml":["senmlx"],"application/sensml+xml":["sensmlx"],"application/set-payment-initiation":["setpay"],"application/set-registration-initiation":["setreg"],"application/shf+xml":["shf"],"application/sieve":["siv","sieve"],"application/smil+xml":["smi","smil"],"application/sparql-query":["rq"],"application/sparql-results+xml":["srx"],"application/srgs":["gram"],"application/srgs+xml":["grxml"],"application/sru+xml":["sru"],"application/ssdl+xml":["ssdl"],"application/ssml+xml":["ssml"],"application/swid+xml":["swidtag"],"application/tei+xml":["tei","teicorpus"],"application/thraud+xml":["tfi"],"application/timestamped-data":["tsd"],"application/toml":["toml"],"application/trig":["trig"],"application/ttml+xml":["ttml"],"application/ubjson":["ubj"],"application/urc-ressheet+xml":["rsheet"],"application/urc-targetdesc+xml":["td"],"application/voicexml+xml":["vxml"],"application/wasm":["wasm"],"application/widget":["wgt"],"application/winhlp":["hlp"],"application/wsdl+xml":["wsdl"],"application/wspolicy+xml":["wspolicy"],"application/xaml+xml":["xaml"],"application/xcap-att+xml":["xav"],"application/xcap-caps+xml":["xca"],"application/xcap-diff+xml":["xdf"],"application/xcap-el+xml":["xel"],"application/xcap-ns+xml":["xns"],"application/xenc+xml":["xenc"],"application/xhtml+xml":["xhtml","xht"],"application/xliff+xml":["xlf"],"application/xml":["xml","xsl","xsd","rng"],"application/xml-dtd":["dtd"],"application/xop+xml":["xop"],"application/xproc+xml":["xpl"],"application/xslt+xml":["*xsl","xslt"],"application/xspf+xml":["xspf"],"application/xv+xml":["mxml","xhvml","xvml","xvm"],"application/yang":["yang"],"application/yin+xml":["yin"],"application/zip":["zip"],"audio/3gpp":["*3gpp"],"audio/adpcm":["adp"],"audio/amr":["amr"],"audio/basic":["au","snd"],"audio/midi":["mid","midi","kar","rmi"],"audio/mobile-xmf":["mxmf"],"audio/mp3":["*mp3"],"audio/mp4":["m4a","mp4a"],"audio/mpeg":["mpga","mp2","mp2a","mp3","m2a","m3a"],"audio/ogg":["oga","ogg","spx","opus"],"audio/s3m":["s3m"],"audio/silk":["sil"],"audio/wav":["wav"],"audio/wave":["*wav"],"audio/webm":["weba"],"audio/xm":["xm"],"font/collection":["ttc"],"font/otf":["otf"],"font/ttf":["ttf"],"font/woff":["woff"],"font/woff2":["woff2"],"image/aces":["exr"],"image/apng":["apng"],"image/avif":["avif"],"image/bmp":["bmp"],"image/cgm":["cgm"],"image/dicom-rle":["drle"],"image/emf":["emf"],"image/fits":["fits"],"image/g3fax":["g3"],"image/gif":["gif"],"image/heic":["heic"],"image/heic-sequence":["heics"],"image/heif":["heif"],"image/heif-sequence":["heifs"],"image/hej2k":["hej2"],"image/hsj2":["hsj2"],"image/ief":["ief"],"image/jls":["jls"],"image/jp2":["jp2","jpg2"],"image/jpeg":["jpeg","jpg","jpe"],"image/jph":["jph"],"image/jphc":["jhc"],"image/jpm":["jpm"],"image/jpx":["jpx","jpf"],"image/jxr":["jxr"],"image/jxra":["jxra"],"image/jxrs":["jxrs"],"image/jxs":["jxs"],"image/jxsc":["jxsc"],"image/jxsi":["jxsi"],"image/jxss":["jxss"],"image/ktx":["ktx"],"image/ktx2":["ktx2"],"image/png":["png"],"image/sgi":["sgi"],"image/svg+xml":["svg","svgz"],"image/t38":["t38"],"image/tiff":["tif","tiff"],"image/tiff-fx":["tfx"],"image/webp":["webp"],"image/wmf":["wmf"],"message/disposition-notification":["disposition-notification"],"message/global":["u8msg"],"message/global-delivery-status":["u8dsn"],"message/global-disposition-notification":["u8mdn"],"message/global-headers":["u8hdr"],"message/rfc822":["eml","mime"],"model/3mf":["3mf"],"model/gltf+json":["gltf"],"model/gltf-binary":["glb"],"model/iges":["igs","iges"],"model/mesh":["msh","mesh","silo"],"model/mtl":["mtl"],"model/obj":["obj"],"model/step+xml":["stpx"],"model/step+zip":["stpz"],"model/step-xml+zip":["stpxz"],"model/stl":["stl"],"model/vrml":["wrl","vrml"],"model/x3d+binary":["*x3db","x3dbz"],"model/x3d+fastinfoset":["x3db"],"model/x3d+vrml":["*x3dv","x3dvz"],"model/x3d+xml":["x3d","x3dz"],"model/x3d-vrml":["x3dv"],"text/cache-manifest":["appcache","manifest"],"text/calendar":["ics","ifb"],"text/coffeescript":["coffee","litcoffee"],"text/css":["css"],"text/csv":["csv"],"text/html":["html","htm","shtml"],"text/jade":["jade"],"text/jsx":["jsx"],"text/less":["less"],"text/markdown":["markdown","md"],"text/mathml":["mml"],"text/mdx":["mdx"],"text/n3":["n3"],"text/plain":["txt","text","conf","def","list","log","in","ini"],"text/richtext":["rtx"],"text/rtf":["*rtf"],"text/sgml":["sgml","sgm"],"text/shex":["shex"],"text/slim":["slim","slm"],"text/spdx":["spdx"],"text/stylus":["stylus","styl"],"text/tab-separated-values":["tsv"],"text/troff":["t","tr","roff","man","me","ms"],"text/turtle":["ttl"],"text/uri-list":["uri","uris","urls"],"text/vcard":["vcard"],"text/vtt":["vtt"],"text/xml":["*xml"],"text/yaml":["yaml","yml"],"video/3gpp":["3gp","3gpp"],"video/3gpp2":["3g2"],"video/h261":["h261"],"video/h263":["h263"],"video/h264":["h264"],"video/iso.segment":["m4s"],"video/jpeg":["jpgv"],"video/jpm":["*jpm","jpgm"],"video/mj2":["mj2","mjp2"],"video/mp2t":["ts"],"video/mp4":["mp4","mp4v","mpg4"],"video/mpeg":["mpeg","mpg","mpe","m1v","m2v"],"video/ogg":["ogv"],"video/quicktime":["qt","mov"],"video/webm":["webm"]};

    /***/ }),

    /***/ "./node_modules/strnum/strnum.js":
    /*!***************************************!*\
      !*** ./node_modules/strnum/strnum.js ***!
      \***************************************/
    /*! no static exports found */
    /***/ (function(module, exports) {

    const hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
    const numRegex = /^([\-\+])?(0*)(\.[0-9]+([eE]\-?[0-9]+)?|[0-9]+(\.[0-9]+([eE]\-?[0-9]+)?)?)$/;
    // const octRegex = /0x[a-z0-9]+/;
    // const binRegex = /0x[a-z0-9]+/;


    //polyfill
    if (!Number.parseInt && window.parseInt) {
        Number.parseInt = window.parseInt;
    }
    if (!Number.parseFloat && window.parseFloat) {
        Number.parseFloat = window.parseFloat;
    }

      
    const consider = {
        hex :  true,
        leadingZeros: true,
        decimalPoint: "\.",
        eNotation: true
        //skipLike: /regex/
    };

    function toNumber(str, options = {}){
        // const options = Object.assign({}, consider);
        // if(opt.leadingZeros === false){
        //     options.leadingZeros = false;
        // }else if(opt.hex === false){
        //     options.hex = false;
        // }

        options = Object.assign({}, consider, options );
        if(!str || typeof str !== "string" ) return str;
        
        let trimmedStr  = str.trim();
        // if(trimmedStr === "0.0") return 0;
        // else if(trimmedStr === "+0.0") return 0;
        // else if(trimmedStr === "-0.0") return -0;

        if(options.skipLike !== undefined && options.skipLike.test(trimmedStr)) return str;
        else if (options.hex && hexRegex.test(trimmedStr)) {
            return Number.parseInt(trimmedStr, 16);
        // } else if (options.parseOct && octRegex.test(str)) {
        //     return Number.parseInt(val, 8);
        // }else if (options.parseBin && binRegex.test(str)) {
        //     return Number.parseInt(val, 2);
        }else{
            //separate negative sign, leading zeros, and rest number
            const match = numRegex.exec(trimmedStr);
            if(match){
                const sign = match[1];
                const leadingZeros = match[2];
                let numTrimmedByZeros = trimZeros(match[3]); //complete num without leading zeros
                //trim ending zeros for floating number
                
                const eNotation = match[4] || match[6];
                if(!options.leadingZeros && leadingZeros.length > 0 && sign && trimmedStr[2] !== ".") return str; //-0123
                else if(!options.leadingZeros && leadingZeros.length > 0 && !sign && trimmedStr[1] !== ".") return str; //0123
                else{//no leading zeros or leading zeros are allowed
                    const num = Number(trimmedStr);
                    const numStr = "" + num;
                    if(numStr.search(/[eE]/) !== -1){ //given number is long and parsed to eNotation
                        if(options.eNotation) return num;
                        else return str;
                    }else if(eNotation){ //given number has enotation
                        if(options.eNotation) return num;
                        else return str;
                    }else if(trimmedStr.indexOf(".") !== -1){ //floating number
                        // const decimalPart = match[5].substr(1);
                        // const intPart = trimmedStr.substr(0,trimmedStr.indexOf("."));

                        
                        // const p = numStr.indexOf(".");
                        // const givenIntPart = numStr.substr(0,p);
                        // const givenDecPart = numStr.substr(p+1);
                        if(numStr === "0" && (numTrimmedByZeros === "") ) return num; //0.0
                        else if(numStr === numTrimmedByZeros) return num; //0.456. 0.79000
                        else if( sign && numStr === "-"+numTrimmedByZeros) return num;
                        else return str;
                    }
                    
                    if(leadingZeros){
                        // if(numTrimmedByZeros === numStr){
                        //     if(options.leadingZeros) return num;
                        //     else return str;
                        // }else return str;
                        if(numTrimmedByZeros === numStr) return num;
                        else if(sign+numTrimmedByZeros === numStr) return num;
                        else return str;
                    }

                    if(trimmedStr === numStr) return num;
                    else if(trimmedStr === sign+numStr) return num;
                    // else{
                    //     //number with +/- sign
                    //     trimmedStr.test(/[-+][0-9]);

                    // }
                    return str;
                }
                // else if(!eNotation && trimmedStr && trimmedStr !== Number(trimmedStr) ) return str;
                
            }else{ //non-numeric string
                return str;
            }
        }
    }

    /**
     * 
     * @param {string} numStr without leading zeros
     * @returns 
     */
    function trimZeros(numStr){
        if(numStr && numStr.indexOf(".") !== -1){//float
            numStr = numStr.replace(/0+$/, ""); //remove ending zeros
            if(numStr === ".")  numStr = "0";
            else if(numStr[0] === ".")  numStr = "0"+numStr;
            else if(numStr[numStr.length-1] === ".")  numStr = numStr.substr(0,numStr.length-1);
            return numStr;
        }
        return numStr;
    }
    module.exports = toNumber


    /***/ }),

    /***/ "./node_modules/webpack/buildin/amd-options.js":
    /*!****************************************!*\
      !*** (webpack)/buildin/amd-options.js ***!
      \****************************************/
    /*! no static exports found */
    /***/ (function(module, exports) {

    /* WEBPACK VAR INJECTION */(function(__webpack_amd_options__) {/* globals __webpack_amd_options__ */
    module.exports = __webpack_amd_options__;

    /* WEBPACK VAR INJECTION */}.call(this, {}))

    /***/ }),

    /***/ "./node_modules/webpack/buildin/module.js":
    /*!***********************************!*\
      !*** (webpack)/buildin/module.js ***!
      \***********************************/
    /*! no static exports found */
    /***/ (function(module, exports) {

    module.exports = function(module) {
    	if (!module.webpackPolyfill) {
    		module.deprecate = function() {};
    		module.paths = [];
    		// module.parent = undefined by default
    		if (!module.children) module.children = [];
    		Object.defineProperty(module, "loaded", {
    			enumerable: true,
    			get: function() {
    				return module.l;
    			}
    		});
    		Object.defineProperty(module, "id", {
    			enumerable: true,
    			get: function() {
    				return module.i;
    			}
    		});
    		module.webpackPolyfill = 1;
    	}
    	return module;
    };


    /***/ }),

    /***/ "./package.json":
    /*!**********************!*\
      !*** ./package.json ***!
      \**********************/
    /*! exports provided: name, version, description, main, scripts, repository, author, license, dependencies, devDependencies, default */
    /***/ (function(module) {

    module.exports = JSON.parse("{\"name\":\"cos-wx-sdk-v5\",\"version\":\"1.8.0\",\"description\":\"小程序 SDK for [腾讯云对象存储服务](https://cloud.tencent.com/product/cos)\",\"main\":\"dist/cos-wx-sdk-v5.min.js\",\"scripts\":{\"prettier\":\"prettier --write src demo/demo-sdk.js demo/test.js demo/ciDemo\",\"dev\":\"cross-env NODE_ENV=development node build.js --mode=development\",\"build\":\"cross-env NODE_ENV=production node build.js --mode=production\",\"sts.js\":\"node server/sts.js\",\"postinstall\":\"patch-package\"},\"repository\":{\"type\":\"git\",\"url\":\"http://github.com/tencentyun/cos-wx-sdk-v5.git\"},\"author\":\"carsonxu\",\"license\":\"ISC\",\"dependencies\":{\"fast-xml-parser\":\"4.5.0\",\"mime\":\"^2.4.6\"},\"devDependencies\":{\"@babel/core\":\"7.17.9\",\"@babel/preset-env\":\"7.16.11\",\"babel-loader\":\"8.2.5\",\"body-parser\":\"^1.18.3\",\"cross-env\":\"^7.0.3\",\"express\":\"^4.17.1\",\"patch-package\":\"^8.0.0\",\"prettier\":\"^3.0.1\",\"qcloud-cos-sts\":\"^3.0.2\",\"terser-webpack-plugin\":\"4.2.3\",\"webpack\":\"4.46.0\",\"webpack-cli\":\"4.10.0\"}}");

    /***/ }),

    /***/ "./src/advance.js":
    /*!************************!*\
      !*** ./src/advance.js ***!
      \************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
    function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
    function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
    function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
    var session = __webpack_require__(/*! ./session */ "./src/session.js");
    var Async = __webpack_require__(/*! ./async */ "./src/async.js");
    var EventProxy = __webpack_require__(/*! ./event */ "./src/event.js").EventProxy;
    var util = __webpack_require__(/*! ./util */ "./src/util.js");
    var Tracker = __webpack_require__(/*! ./tracker */ "./src/tracker.js");

    // 文件分块上传全过程，暴露的分块上传接口
    function sliceUploadFile(params, callback) {
      var self = this;

      // 如果小程序版本不支持获取文件分片内容，统一转到 简单上传 接口上传
      if (!util.canFileSlice()) {
        params.SkipTask = true;
        if (self.options.SimpleUploadMethod === 'postObject') {
          self.postObject(params, callback);
        } else {
          self.putObject(params, callback);
        }
        return;
      }
      var ep = new EventProxy();
      var TaskId = params.TaskId;
      var Bucket = params.Bucket;
      var Region = params.Region;
      var Key = params.Key;
      var FilePath = params.FilePath;
      var ChunkSize = params.ChunkSize || params.SliceSize || self.options.ChunkSize;
      var AsyncLimit = params.AsyncLimit;
      var StorageClass = params.StorageClass;
      var ServerSideEncryption = params.ServerSideEncryption;
      var FileSize;
      var onProgress;
      var onHashProgress = params.onHashProgress;
      var tracker = params.tracker;
      tracker && tracker.setParams({
        chunkSize: ChunkSize
      });

      // 上传过程中出现错误，返回错误
      ep.on('error', function (err) {
        if (!self._isRunningTask(TaskId)) return;
        var _err = {
          UploadId: params.UploadData.UploadId || '',
          err: err,
          error: err
        };
        return callback(_err);
      });

      // 上传分块完成，开始 uploadSliceComplete 操作
      ep.on('upload_complete', function (UploadCompleteData) {
        var _UploadCompleteData = util.extend({
          UploadId: params.UploadData.UploadId || ''
        }, UploadCompleteData);
        callback(null, _UploadCompleteData);
      });

      // 上传分块完成，开始 uploadSliceComplete 操作
      ep.on('upload_slice_complete', function (UploadData) {
        var metaHeaders = {};
        util.each(params.Headers, function (val, k) {
          var shortKey = k.toLowerCase();
          if (shortKey.indexOf('x-cos-meta-') === 0 || shortKey === 'pic-operations') {
            metaHeaders[k] = val;
          }
        });
        uploadSliceComplete.call(self, {
          Bucket: Bucket,
          Region: Region,
          Key: Key,
          UploadId: UploadData.UploadId,
          SliceList: UploadData.SliceList,
          Headers: metaHeaders,
          tracker: tracker
        }, function (err, data) {
          if (!self._isRunningTask(TaskId)) return;
          session.removeUsing(UploadData.UploadId);
          if (err) {
            onProgress(null, true);
            return ep.emit('error', err);
          }
          session.removeUploadId(UploadData.UploadId);
          onProgress({
            loaded: FileSize,
            total: FileSize
          }, true);
          ep.emit('upload_complete', data);
        });
      });

      // 获取 UploadId 完成，开始上传每个分片
      ep.on('get_upload_data_finish', function (UploadData) {
        // 处理 UploadId 缓存
        var uuid = session.getFileId(params.FileStat, params.ChunkSize, Bucket, Key);
        uuid && session.saveUploadId(uuid, UploadData.UploadId, self.options.UploadIdCacheLimit); // 缓存 UploadId
        session.setUsing(UploadData.UploadId); // 标记 UploadId 为正在使用

        // 获取 UploadId
        onProgress(null, true); // 任务状态开始 uploading
        uploadSliceList.call(self, {
          TaskId: TaskId,
          Bucket: Bucket,
          Region: Region,
          Key: Key,
          FilePath: FilePath,
          FileSize: FileSize,
          SliceSize: ChunkSize,
          AsyncLimit: AsyncLimit,
          ServerSideEncryption: ServerSideEncryption,
          UploadData: UploadData,
          onProgress: onProgress,
          tracker: tracker
        }, function (err, data) {
          if (!self._isRunningTask(TaskId)) return;
          if (err) {
            onProgress(null, true);
            return ep.emit('error', err);
          }
          ep.emit('upload_slice_complete', data);
        });
      });

      // 开始获取文件 UploadId，里面会视情况计算 ETag，并比对，保证文件一致性，也优化上传
      ep.on('get_file_size_finish', function () {
        onProgress = util.throttleOnProgress.call(self, FileSize, params.onProgress);
        if (params.UploadData.UploadId) {
          ep.emit('get_upload_data_finish', params.UploadData);
        } else {
          var _params = util.extend({
            TaskId: TaskId,
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            Headers: params.Headers,
            StorageClass: StorageClass,
            FilePath: FilePath,
            FileSize: FileSize,
            SliceSize: ChunkSize,
            onHashProgress: onHashProgress,
            tracker: tracker
          }, params);
          // 这里用户传入的params.FileSize可能单位不统一,必须使用sdk内获取的大小
          _params.FileSize = FileSize;
          getUploadIdAndPartList.call(self, _params, function (err, UploadData) {
            if (!self._isRunningTask(TaskId)) return;
            if (err) return ep.emit('error', err);
            params.UploadData.UploadId = UploadData.UploadId;
            params.UploadData.PartList = UploadData.PartList;
            ep.emit('get_upload_data_finish', params.UploadData);
          });
        }
      });

      // 获取上传文件大小
      FileSize = params.ContentLength;
      delete params.ContentLength;
      !params.Headers && (params.Headers = {});
      util.each(params.Headers, function (item, key) {
        if (key.toLowerCase() === 'content-length') {
          delete params.Headers[key];
        }
      });

      // 控制分片大小
      (function () {
        var SIZE = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 1024 * 2, 1024 * 4, 1024 * 5];
        var AutoChunkSize = 1024 * 1024;
        for (var i = 0; i < SIZE.length; i++) {
          AutoChunkSize = SIZE[i] * 1024 * 1024;
          if (FileSize / AutoChunkSize <= self.options.MaxPartNumber) break;
        }
        params.ChunkSize = params.SliceSize = ChunkSize = Math.max(ChunkSize, AutoChunkSize);
      })();

      // 开始上传
      if (FileSize === 0) {
        params.Body = '';
        params.ContentLength = 0;
        params.SkipTask = true;
        self.putObject(params, function (err, data) {
          if (err) {
            return callback(err);
          }
          callback(null, data);
        });
      } else {
        ep.emit('get_file_size_finish');
      }
    }

    // 获取上传任务的 UploadId
    function getUploadIdAndPartList(params, callback) {
      var TaskId = params.TaskId;
      var Bucket = params.Bucket;
      var Region = params.Region;
      var Key = params.Key;
      var StorageClass = params.StorageClass;
      var self = this;

      // 计算 ETag
      var ETagMap = {};
      var FileSize = params.FileSize;
      var SliceSize = params.SliceSize;
      var SliceCount = Math.ceil(FileSize / SliceSize);
      var FinishSliceCount = 0;
      var FinishSize = 0;
      var onHashProgress = util.throttleOnProgress.call(self, FileSize, params.onHashProgress);
      var getChunkETag = function getChunkETag(PartNumber, callback) {
        var start = SliceSize * (PartNumber - 1);
        var end = Math.min(start + SliceSize, FileSize);
        var ChunkSize = end - start;
        if (ETagMap[PartNumber]) {
          callback(null, {
            PartNumber: PartNumber,
            ETag: ETagMap[PartNumber],
            Size: ChunkSize
          });
        } else {
          util.fileSlice(params.FilePath, start, end, function (chunkItem) {
            try {
              var md5 = util.getFileMd5(chunkItem);
            } catch (err) {
              return callback(err);
            }
            var ETag = '"' + md5 + '"';
            ETagMap[PartNumber] = ETag;
            FinishSliceCount += 1;
            FinishSize += ChunkSize;
            callback(null, {
              PartNumber: PartNumber,
              ETag: ETag,
              Size: ChunkSize
            });
            onHashProgress({
              loaded: FinishSize,
              total: FileSize
            });
          });
        }
      };

      // 通过和文件的 md5 对比，判断 UploadId 是否可用
      var isAvailableUploadList = function isAvailableUploadList(PartList, callback) {
        var PartCount = PartList.length;
        // 如果没有分片，通过
        if (PartCount === 0) {
          return callback(null, true);
        }
        // 检查分片数量
        if (PartCount > SliceCount) {
          return callback(null, false);
        }
        // 检查分片大小
        if (PartCount > 1) {
          var PartSliceSize = Math.max(PartList[0].Size, PartList[1].Size);
          if (PartSliceSize !== SliceSize) {
            return callback(null, false);
          }
        }
        // 逐个分片计算并检查 ETag 是否一致
        var next = function next(index) {
          if (index < PartCount) {
            var Part = PartList[index];
            getChunkETag(Part.PartNumber, function (err, chunk) {
              if (chunk && chunk.ETag === Part.ETag && chunk.Size === Part.Size) {
                next(index + 1);
              } else {
                callback(null, false);
              }
            });
          } else {
            callback(null, true);
          }
        };
        next(0);
      };
      var ep = new EventProxy();
      ep.on('error', function (errData) {
        if (!self._isRunningTask(TaskId)) return;
        return callback(errData);
      });

      // 存在 UploadId
      ep.on('upload_id_available', function (UploadData) {
        // 转换成 map
        var map = {};
        var list = [];
        util.each(UploadData.PartList, function (item) {
          map[item.PartNumber] = item;
        });
        for (var PartNumber = 1; PartNumber <= SliceCount; PartNumber++) {
          var item = map[PartNumber];
          if (item) {
            item.PartNumber = PartNumber;
            item.Uploaded = true;
          } else {
            item = {
              PartNumber: PartNumber,
              ETag: null,
              Uploaded: false
            };
          }
          list.push(item);
        }
        UploadData.PartList = list;
        callback(null, UploadData);
      });

      // 不存在 UploadId, 初始化生成 UploadId
      ep.on('no_available_upload_id', function () {
        if (!self._isRunningTask(TaskId)) return;
        var _params = util.extend({
          Bucket: Bucket,
          Region: Region,
          Key: Key,
          Headers: util.clone(params.Headers),
          Query: util.clone(params.Query),
          StorageClass: StorageClass,
          calledBySdk: 'sliceUploadFile',
          tracker: params.tracker
        }, params);
        self.multipartInit(_params, function (err, data) {
          if (!self._isRunningTask(TaskId)) return;
          if (err) return ep.emit('error', err);
          var UploadId = data.UploadId;
          if (!UploadId) {
            return callback({
              Message: 'no upload id'
            });
          }
          ep.emit('upload_id_available', {
            UploadId: UploadId,
            PartList: []
          });
        });
      });

      // 如果已存在 UploadId，找一个可以用的 UploadId
      ep.on('has_and_check_upload_id', function (UploadIdList) {
        // 串行地，找一个内容一致的 UploadId
        UploadIdList = UploadIdList.reverse();
        Async.eachLimit(UploadIdList, 1, function (UploadId, asyncCallback) {
          if (!self._isRunningTask(TaskId)) return;
          // 如果正在上传，跳过
          if (session.using[UploadId]) {
            asyncCallback(); // 检查下一个 UploadId
            return;
          }
          // 判断 UploadId 是否可用
          wholeMultipartListPart.call(self, {
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            UploadId: UploadId,
            tracker: params.tracker
          }, function (err, PartListData) {
            if (!self._isRunningTask(TaskId)) return;
            if (err) {
              session.removeUsing(UploadId);
              return ep.emit('error', err);
            }
            var PartList = PartListData.PartList;
            PartList.forEach(function (item) {
              item.PartNumber *= 1;
              item.Size *= 1;
              item.ETag = item.ETag || '';
            });
            isAvailableUploadList(PartList, function (err, isAvailable) {
              if (!self._isRunningTask(TaskId)) return;
              if (err) return ep.emit('error', err);
              if (isAvailable) {
                asyncCallback({
                  UploadId: UploadId,
                  PartList: PartList
                }); // 马上结束
              } else {
                asyncCallback(); // 检查下一个 UploadId
              }
            });
          });
        }, function (AvailableUploadData) {
          if (!self._isRunningTask(TaskId)) return;
          onHashProgress(null, true);
          if (AvailableUploadData && AvailableUploadData.UploadId) {
            ep.emit('upload_id_available', AvailableUploadData);
          } else {
            ep.emit('no_available_upload_id');
          }
        });
      });

      // 在本地缓存找可用的 UploadId
      ep.on('seek_local_avail_upload_id', function (RemoteUploadIdList) {
        // 在本地找可用的 UploadId
        var uuid = session.getFileId(params.FileStat, params.ChunkSize, Bucket, Key);
        var LocalUploadIdList = session.getUploadIdList(uuid);
        if (!uuid || !LocalUploadIdList) {
          ep.emit('has_and_check_upload_id', RemoteUploadIdList);
          return;
        }
        var next = function next(index) {
          // 如果本地找不到可用 UploadId，再一个个遍历校验远端
          if (index >= LocalUploadIdList.length) {
            ep.emit('has_and_check_upload_id', RemoteUploadIdList);
            return;
          }
          var UploadId = LocalUploadIdList[index];
          // 如果不在远端 UploadId 列表里，跳过并删除
          if (!util.isInArray(RemoteUploadIdList, UploadId)) {
            session.removeUploadId(UploadId);
            next(index + 1);
            return;
          }
          // 如果正在上传，跳过
          if (session.using[UploadId]) {
            next(index + 1);
            return;
          }
          // 判断 UploadId 是否存在线上
          wholeMultipartListPart.call(self, {
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            UploadId: UploadId,
            tracker: params.tracker
          }, function (err, PartListData) {
            if (!self._isRunningTask(TaskId)) return;
            if (err) {
              // 如果 UploadId 获取会出错，跳过并删除
              session.removeUploadId(UploadId);
              next(index + 1);
            } else {
              // 找到可用 UploadId
              ep.emit('upload_id_available', {
                UploadId: UploadId,
                PartList: PartListData.PartList
              });
            }
          });
        };
        next(0);
      });

      // 获取线上 UploadId 列表
      ep.on('get_remote_upload_id_list', function () {
        // 获取符合条件的 UploadId 列表，因为同一个文件可以有多个上传任务。
        wholeMultipartList.call(self, {
          Bucket: Bucket,
          Region: Region,
          Key: Key,
          tracker: params.tracker
        }, function (err, data) {
          if (!self._isRunningTask(TaskId)) return;
          if (err) {
            return ep.emit('error', err);
          }
          // 整理远端 UploadId 列表
          var RemoteUploadIdList = util.filter(data.UploadList, function (item) {
            return item.Key === Key && (!StorageClass || item.StorageClass.toUpperCase() === StorageClass.toUpperCase());
          }).reverse().map(function (item) {
            return item.UploadId || item.UploadID;
          });
          if (RemoteUploadIdList.length) {
            ep.emit('seek_local_avail_upload_id', RemoteUploadIdList);
          } else {
            // 远端没有 UploadId，清理缓存的 UploadId
            var uuid = session.getFileId(params.FileStat, params.ChunkSize, Bucket, Key),
              LocalUploadIdList;
            if (uuid && (LocalUploadIdList = session.getUploadIdList(uuid))) {
              util.each(LocalUploadIdList, function (UploadId) {
                session.removeUploadId(UploadId);
              });
            }
            ep.emit('no_available_upload_id');
          }
        });
      });

      // 开始找可用 UploadId
      ep.emit('get_remote_upload_id_list');
    }

    // 获取符合条件的全部上传任务 (条件包括 Bucket, Region, Prefix)
    function wholeMultipartList(params, callback) {
      var self = this;
      var UploadList = [];
      var sendParams = {
        Bucket: params.Bucket,
        Region: params.Region,
        Prefix: params.Key,
        calledBySdk: params.calledBySdk || 'sliceUploadFile',
        tracker: params.tracker
      };
      var next = function next() {
        self.multipartList(sendParams, function (err, data) {
          if (err) return callback(err);
          UploadList.push.apply(UploadList, data.Upload || []);
          if (data.IsTruncated === 'true') {
            // 列表不完整
            sendParams.KeyMarker = data.NextKeyMarker;
            sendParams.UploadIdMarker = data.NextUploadIdMarker;
            next();
          } else {
            callback(null, {
              UploadList: UploadList
            });
          }
        });
      };
      next();
    }

    // 获取指定上传任务的分块列表
    function wholeMultipartListPart(params, callback) {
      var self = this;
      var PartList = [];
      var sendParams = {
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        UploadId: params.UploadId,
        calledBySdk: 'sliceUploadFile',
        tracker: params.tracker
      };
      var next = function next() {
        self.multipartListPart(sendParams, function (err, data) {
          if (err) return callback(err);
          PartList.push.apply(PartList, data.Part || []);
          if (data.IsTruncated === 'true') {
            // 列表不完整
            sendParams.PartNumberMarker = data.NextPartNumberMarker;
            next();
          } else {
            callback(null, {
              PartList: PartList
            });
          }
        });
      };
      next();
    }

    // 上传文件分块，包括
    /*
     UploadId (上传任务编号)
     AsyncLimit (并发量)，
     SliceList (上传的分块数组)，
     FilePath (本地文件的位置)，
     SliceSize (文件分块大小)
     FileSize (文件大小)
     onProgress (上传成功之后的回调函数)
     */
    function uploadSliceList(params, cb) {
      var self = this;
      var TaskId = params.TaskId;
      var Bucket = params.Bucket;
      var Region = params.Region;
      var Key = params.Key;
      var UploadData = params.UploadData;
      var FileSize = params.FileSize;
      var SliceSize = params.SliceSize;
      var ChunkParallel = Math.min(params.AsyncLimit || self.options.ChunkParallelLimit || 1, 256);
      var FilePath = params.FilePath;
      var SliceCount = Math.ceil(FileSize / SliceSize);
      var FinishSize = 0;
      var ServerSideEncryption = params.ServerSideEncryption;
      var needUploadSlices = util.filter(UploadData.PartList, function (SliceItem) {
        if (SliceItem['Uploaded']) {
          FinishSize += SliceItem['PartNumber'] >= SliceCount ? FileSize % SliceSize || SliceSize : SliceSize;
        }
        return !SliceItem['Uploaded'];
      });
      var _onProgress2 = params.onProgress;
      Async.eachLimit(needUploadSlices, ChunkParallel, function (SliceItem, asyncCallback) {
        if (!self._isRunningTask(TaskId)) return;
        var PartNumber = SliceItem['PartNumber'];
        var currentSize = Math.min(FileSize, SliceItem['PartNumber'] * SliceSize) - (SliceItem['PartNumber'] - 1) * SliceSize;
        var preAddSize = 0;
        uploadSliceItem.call(self, {
          TaskId: TaskId,
          Bucket: Bucket,
          Region: Region,
          Key: Key,
          SliceSize: SliceSize,
          FileSize: FileSize,
          PartNumber: PartNumber,
          ServerSideEncryption: ServerSideEncryption,
          FilePath: FilePath,
          UploadData: UploadData,
          onProgress: function onProgress(data) {
            FinishSize += data.loaded - preAddSize;
            preAddSize = data.loaded;
            _onProgress2({
              loaded: FinishSize,
              total: FileSize
            });
          },
          tracker: params.tracker
        }, function (err, data) {
          if (!self._isRunningTask(TaskId)) return;
          if (err) {
            FinishSize -= preAddSize;
          } else {
            FinishSize += currentSize - preAddSize;
            SliceItem.ETag = data.ETag;
          }
          _onProgress2({
            loaded: FinishSize,
            total: FileSize
          });
          asyncCallback(err || null, data);
        });
      }, function (err) {
        if (!self._isRunningTask(TaskId)) return;
        if (err) return cb(err);
        cb(null, {
          UploadId: UploadData.UploadId,
          SliceList: UploadData.PartList
        });
      });
    }

    // 上传指定分片
    function uploadSliceItem(params, callback) {
      var self = this;
      var TaskId = params.TaskId;
      var Bucket = params.Bucket;
      var Region = params.Region;
      var Key = params.Key;
      var FileSize = params.FileSize;
      var FilePath = params.FilePath;
      var PartNumber = params.PartNumber * 1;
      var SliceSize = params.SliceSize;
      var ServerSideEncryption = params.ServerSideEncryption;
      var UploadData = params.UploadData;
      var ChunkRetryTimes = self.options.ChunkRetryTimes + 1;
      var Headers = params.Headers || {};
      var start = SliceSize * (PartNumber - 1);
      var ContentLength = SliceSize;
      var end = start + SliceSize;
      if (end > FileSize) {
        end = FileSize;
        ContentLength = end - start;
      }
      var headersWhiteList = ['x-cos-traffic-limit', 'x-cos-mime-limit'];
      var headers = {};
      util.each(Headers, function (v, k) {
        if (headersWhiteList.indexOf(k) > -1) {
          headers[k] = v;
        }
      });
      util.fileSlice(FilePath, start, end, function (Body) {
        var md5 = util.getFileMd5(Body);
        var contentMd5 = md5 ? util.binaryBase64(md5) : null;
        var PartItem = UploadData.PartList[PartNumber - 1];
        Async.retry(ChunkRetryTimes, function (tryCallback) {
          if (!self._isRunningTask(TaskId)) return;
          self.multipartUpload({
            TaskId: TaskId,
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            ContentLength: ContentLength,
            PartNumber: PartNumber,
            UploadId: UploadData.UploadId,
            ServerSideEncryption: ServerSideEncryption,
            Body: Body,
            Headers: headers,
            onProgress: params.onProgress,
            ContentMD5: contentMd5,
            calledBySdk: 'sliceUploadFile',
            tracker: params.tracker
          }, function (err, data) {
            if (!self._isRunningTask(TaskId)) return;
            if (err) {
              return tryCallback(err);
            } else {
              PartItem.Uploaded = true;
              return tryCallback(null, data);
            }
          });
        }, function (err, data) {
          if (!self._isRunningTask(TaskId)) return;
          return callback(err, data);
        });
      });
    }

    // 完成分块上传
    function uploadSliceComplete(params, callback) {
      var Bucket = params.Bucket;
      var Region = params.Region;
      var Key = params.Key;
      var UploadId = params.UploadId;
      var SliceList = params.SliceList;
      var self = this;
      var ChunkRetryTimes = this.options.ChunkRetryTimes + 1;
      var Parts = SliceList.map(function (item) {
        return {
          PartNumber: item.PartNumber,
          ETag: item.ETag
        };
      });
      // 完成上传的请求也做重试
      Async.retry(ChunkRetryTimes, function (tryCallback) {
        self.multipartComplete({
          Bucket: Bucket,
          Region: Region,
          Key: Key,
          UploadId: UploadId,
          Parts: Parts,
          calledBySdk: 'sliceUploadFile',
          Headers: params.Headers || {},
          tracker: params.tracker
        }, tryCallback);
      }, function (err, data) {
        callback(err, data);
      });
    }

    // 抛弃分块上传任务
    /*
     AsyncLimit (抛弃上传任务的并发量)，
     UploadId (上传任务的编号，当 Level 为 task 时候需要)
     Level (抛弃分块上传任务的级别，task : 抛弃指定的上传任务，file ： 抛弃指定的文件对应的上传任务，其他值 ：抛弃指定Bucket 的全部上传任务)
     */
    function abortUploadTask(params, callback) {
      var Bucket = params.Bucket;
      var Region = params.Region;
      var Key = params.Key;
      var UploadId = params.UploadId;
      var Level = params.Level || 'task';
      var AsyncLimit = params.AsyncLimit;
      var self = this;
      var ep = new EventProxy();
      ep.on('error', function (errData) {
        return callback(errData);
      });

      // 已经获取到需要抛弃的任务列表
      ep.on('get_abort_array', function (AbortArray) {
        abortUploadTaskArray.call(self, {
          Bucket: Bucket,
          Region: Region,
          Key: Key,
          Headers: params.Headers,
          AsyncLimit: AsyncLimit,
          AbortArray: AbortArray
        }, function (err, data) {
          if (err) {
            return callback(err);
          }
          callback(null, data);
        });
      });
      if (Level === 'bucket') {
        // Bucket 级别的任务抛弃，抛弃该 Bucket 下的全部上传任务
        wholeMultipartList.call(self, {
          Bucket: Bucket,
          Region: Region,
          calledBySdk: 'abortUploadTask'
        }, function (err, data) {
          if (err) {
            return callback(err);
          }
          ep.emit('get_abort_array', data.UploadList || []);
        });
      } else if (Level === 'file') {
        // 文件级别的任务抛弃，抛弃该文件的全部上传任务
        if (!Key) return callback({
          error: 'abort_upload_task_no_key'
        });
        wholeMultipartList.call(self, {
          Bucket: Bucket,
          Region: Region,
          Key: Key,
          calledBySdk: 'abortUploadTask'
        }, function (err, data) {
          if (err) {
            return callback(err);
          }
          ep.emit('get_abort_array', data.UploadList || []);
        });
      } else if (Level === 'task') {
        // 单个任务级别的任务抛弃，抛弃指定 UploadId 的上传任务
        if (!UploadId) return callback({
          error: 'abort_upload_task_no_id'
        });
        if (!Key) return callback({
          error: 'abort_upload_task_no_key'
        });
        ep.emit('get_abort_array', [{
          Key: Key,
          UploadId: UploadId
        }]);
      } else {
        return callback({
          error: 'abort_unknown_level'
        });
      }
    }

    // 批量抛弃分块上传任务
    function abortUploadTaskArray(params, callback) {
      var Bucket = params.Bucket;
      var Region = params.Region;
      var Key = params.Key;
      var AbortArray = params.AbortArray;
      var AsyncLimit = params.AsyncLimit || 1;
      var self = this;
      var index = 0;
      var resultList = new Array(AbortArray.length);
      Async.eachLimit(AbortArray, AsyncLimit, function (AbortItem, callback) {
        var eachIndex = index;
        if (Key && Key !== AbortItem.Key) {
          resultList[eachIndex] = {
            error: {
              KeyNotMatch: true
            }
          };
          callback(null);
          return;
        }
        var UploadId = AbortItem.UploadId || AbortItem.UploadID;
        self.multipartAbort({
          Bucket: Bucket,
          Region: Region,
          Key: AbortItem.Key,
          Headers: params.Headers,
          UploadId: UploadId
        }, function (err) {
          var task = {
            Bucket: Bucket,
            Region: Region,
            Key: AbortItem.Key,
            UploadId: UploadId
          };
          resultList[eachIndex] = {
            error: err,
            task: task
          };
          callback(null);
        });
        index++;
      }, function (err) {
        if (err) {
          return callback(err);
        }
        var successList = [];
        var errorList = [];
        for (var i = 0, len = resultList.length; i < len; i++) {
          var item = resultList[i];
          if (item['task']) {
            if (item['error']) {
              errorList.push(item['task']);
            } else {
              successList.push(item['task']);
            }
          }
        }
        return callback(null, {
          successList: successList,
          errorList: errorList
        });
      });
    }

    // 高级上传
    function uploadFile(_x, _x2) {
      return _uploadFile.apply(this, arguments);
    } // 批量上传文件
    function _uploadFile() {
      _uploadFile = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(params, callback) {
        var self, SliceSize, taskList, FileSize, fileInfo, accelerate, realApi, _onTaskReady, _onFileFinish, onFileFinish, simpleUploadMethod, api;
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              self = this; // 判断多大的文件使用分片上传
              SliceSize = params.SliceSize === undefined ? self.options.SliceSize : params.SliceSize;
              taskList = []; // var FileSize = params.FileSize;
              _context.prev = 3;
              _context.next = 6;
              return util.getFileSizeByPath(params.FilePath);
            case 6:
              FileSize = _context.sent;
              _context.next = 13;
              break;
            case 9:
              _context.prev = 9;
              _context.t0 = _context["catch"](3);
              callback({
                error: _context.t0
              });
              return _context.abrupt("return");
            case 13:
              fileInfo = {
                TaskId: ''
              }; // 上传链路
              if (self.options.EnableReporter) {
                accelerate = self.options.UseAccelerate || typeof self.options.Domain === 'string' && self.options.Domain.includes('accelerate.');
                realApi = FileSize > SliceSize ? 'sliceUploadFile' : 'putObject';
                params.tracker = new Tracker({
                  Beacon: self.options.BeaconReporter,
                  clsReporter: self.options.ClsReporter,
                  bucket: params.Bucket,
                  region: params.Region,
                  apiName: 'uploadFile',
                  realApi: realApi,
                  fileKey: params.Key,
                  fileSize: FileSize,
                  accelerate: accelerate,
                  deepTracker: self.options.DeepTracker,
                  customId: self.options.CustomId,
                  delay: self.options.TrackerDelay
                });
              }

              // 整理 option，用于返回给回调
              util.each(params, function (v, k) {
                if (_typeof(v) !== 'object' && typeof v !== 'function') {
                  fileInfo[k] = v;
                }
              });

              // 处理文件 TaskReady
              _onTaskReady = params.onTaskReady;
              params.onTaskReady = function (tid) {
                fileInfo.TaskId = tid;
                _onTaskReady && _onTaskReady(tid);
              };

              // 处理文件完成
              _onFileFinish = params.onFileFinish;
              onFileFinish = function onFileFinish(err, data) {
                // 格式化上报参数并上报
                params.tracker && params.tracker.report(err, data);
                _onFileFinish && _onFileFinish(err, data, fileInfo);
                callback && callback(err, data);
              }; // 添加上传任务
              simpleUploadMethod = self.options.SimpleUploadMethod === 'postObject' ? 'postObject' : 'putObject';
              api = FileSize > SliceSize ? 'sliceUploadFile' : simpleUploadMethod;
              taskList.push({
                api: api,
                params: params,
                callback: onFileFinish
              });
              self._addTasks(taskList);
            case 24:
            case "end":
              return _context.stop();
          }
        }, _callee, this, [[3, 9]]);
      }));
      return _uploadFile.apply(this, arguments);
    }
    function uploadFiles(_x3, _x4) {
      return _uploadFiles.apply(this, arguments);
    } // 分片复制文件
    function _uploadFiles() {
      _uploadFiles = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee3(params, callback) {
        var self, SliceSize, TotalSize, TotalFinish, onTotalProgress, unFinishCount, _onTotalFileFinish, resultList, onTotalFileFinish, taskList, getTaskList;
        return _regeneratorRuntime().wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              self = this; // 判断多大的文件使用分片上传
              SliceSize = params.SliceSize === undefined ? self.options.SliceSize : params.SliceSize; // 汇总返回进度
              TotalSize = 0;
              TotalFinish = 0;
              onTotalProgress = util.throttleOnProgress.call(self, TotalFinish, params.onProgress); // 汇总返回回调
              unFinishCount = params.files.length;
              _onTotalFileFinish = params.onFileFinish;
              resultList = Array(unFinishCount);
              onTotalFileFinish = function onTotalFileFinish(err, data, options) {
                onTotalProgress(null, true);
                _onTotalFileFinish && _onTotalFileFinish(err, data, options);
                resultList[options.Index] = {
                  options: options,
                  error: err,
                  data: data
                };
                if (--unFinishCount <= 0 && callback) {
                  callback(null, {
                    files: resultList
                  });
                }
              }; // 开始处理每个文件
              taskList = [];
              getTaskList = function getTaskList() {
                return params.files.map(function (fileParams, index) {
                  return new Promise( /*#__PURE__*/function () {
                    var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(resolve) {
                      var FileSize, fileInfo, accelerate, realApi, _onTaskReady, PreAddSize, _onProgress, _onFileFinish, onFileFinish, simpleUploadMethod, api;
                      return _regeneratorRuntime().wrap(function _callee2$(_context2) {
                        while (1) switch (_context2.prev = _context2.next) {
                          case 0:
                            FileSize = 0;
                            _context2.prev = 1;
                            _context2.next = 4;
                            return util.getFileSizeByPath(fileParams.FilePath);
                          case 4:
                            FileSize = _context2.sent;
                            _context2.next = 9;
                            break;
                          case 7:
                            _context2.prev = 7;
                            _context2.t0 = _context2["catch"](1);
                          case 9:
                            fileInfo = {
                              Index: index,
                              TaskId: ''
                            }; // 更新文件总大小
                            TotalSize += FileSize;

                            // 单个文件上传链路
                            if (self.options.EnableReporter) {
                              accelerate = self.options.UseAccelerate || typeof self.options.Domain === 'string' && self.options.Domain.includes('accelerate.');
                              realApi = FileSize > SliceSize ? 'sliceUploadFile' : 'putObject';
                              fileParams.tracker = new Tracker({
                                Beacon: self.options.BeaconReporter,
                                clsReporter: self.options.ClsReporter,
                                bucket: fileParams.Bucket,
                                region: fileParams.Region,
                                apiName: 'uploadFiles',
                                realApi: realApi,
                                fileKey: fileParams.Key,
                                fileSize: FileSize,
                                accelerate: accelerate,
                                deepTracker: self.options.DeepTracker,
                                customId: self.options.CustomId,
                                delay: self.options.TrackerDelay
                              });
                            }

                            // 整理 option，用于返回给回调
                            util.each(fileParams, function (v, k) {
                              if (_typeof(v) !== 'object' && typeof v !== 'function') {
                                fileInfo[k] = v;
                              }
                            });

                            // 处理单个文件 TaskReady
                            _onTaskReady = fileParams.onTaskReady;
                            fileParams.onTaskReady = function (tid) {
                              fileInfo.TaskId = tid;
                              _onTaskReady && _onTaskReady(tid);
                            };

                            // 处理单个文件进度
                            PreAddSize = 0;
                            _onProgress = fileParams.onProgress;
                            fileParams.onProgress = function (info) {
                              TotalFinish = TotalFinish - PreAddSize + info.loaded;
                              PreAddSize = info.loaded;
                              _onProgress && _onProgress(info);
                              onTotalProgress({
                                loaded: TotalFinish,
                                total: TotalSize
                              });
                            };

                            // 处理单个文件完成
                            _onFileFinish = fileParams.onFileFinish;
                            onFileFinish = function onFileFinish(err, data) {
                              // 格式化上报参数并上报
                              fileParams.tracker && fileParams.tracker.report(err, data);
                              _onFileFinish && _onFileFinish(err, data);
                              onTotalFileFinish && onTotalFileFinish(err, data, fileInfo);
                            }; // 添加上传任务
                            simpleUploadMethod = self.options.SimpleUploadMethod === 'postObject' ? 'postObject' : 'putObject';
                            api = FileSize > SliceSize ? 'sliceUploadFile' : simpleUploadMethod;
                            taskList.push({
                              api: api,
                              params: fileParams,
                              callback: onFileFinish
                            });
                            resolve(true);
                          case 24:
                          case "end":
                            return _context2.stop();
                        }
                      }, _callee2, null, [[1, 7]]);
                    }));
                    return function (_x5) {
                      return _ref.apply(this, arguments);
                    };
                  }());
                });
              };
              _context3.next = 13;
              return Promise.all(getTaskList());
            case 13:
              self._addTasks(taskList);
            case 14:
            case "end":
              return _context3.stop();
          }
        }, _callee3, this);
      }));
      return _uploadFiles.apply(this, arguments);
    }
    function sliceCopyFile(params, callback) {
      var ep = new EventProxy();
      var self = this;
      var Bucket = params.Bucket;
      var Region = params.Region;
      var Key = params.Key;
      var CopySource = params.CopySource;
      var m = util.getSourceParams.call(this, CopySource);
      if (!m) {
        callback({
          error: 'CopySource format error'
        });
        return;
      }
      var SourceBucket = m.Bucket;
      var SourceRegion = m.Region;
      var SourceKey = decodeURIComponent(m.Key);
      var CopySliceSize = params.CopySliceSize === undefined ? self.options.CopySliceSize : params.CopySliceSize;
      CopySliceSize = Math.max(0, CopySliceSize);
      var ChunkSize = params.CopyChunkSize || this.options.CopyChunkSize;
      var ChunkParallel = this.options.CopyChunkParallelLimit;
      var ChunkRetryTimes = this.options.ChunkRetryTimes + 1;
      var ChunkCount = 0;
      var FinishSize = 0;
      var FileSize;
      var _onProgress3;
      var SourceResHeaders = {};
      var SourceHeaders = {};
      var TargetHeader = {};

      // 分片复制完成，开始 multipartComplete 操作
      ep.on('copy_slice_complete', function (UploadData) {
        var metaHeaders = {};
        util.each(params.Headers, function (val, k) {
          if (k.toLowerCase().indexOf('x-cos-meta-') === 0) metaHeaders[k] = val;
        });
        var Parts = util.map(UploadData.PartList, function (item) {
          return {
            PartNumber: item.PartNumber,
            ETag: item.ETag
          };
        });
        // 完成上传的请求也做重试
        Async.retry(ChunkRetryTimes, function (tryCallback) {
          self.multipartComplete({
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            UploadId: UploadData.UploadId,
            Parts: Parts,
            tracker: params.tracker,
            calledBySdk: 'sliceCopyFile'
          }, tryCallback);
        }, function (err, data) {
          session.removeUsing(UploadData.UploadId); // 标记 UploadId 没被使用了，因为复制没提供重试，所以只要出错，就是 UploadId 停用了。
          if (err) {
            _onProgress3(null, true);
            return callback(err);
          }
          session.removeUploadId(UploadData.UploadId);
          _onProgress3({
            loaded: FileSize,
            total: FileSize
          }, true);
          callback(null, data);
        });
      });
      ep.on('get_copy_data_finish', function (UploadData) {
        // 处理 UploadId 缓存
        var uuid = session.getCopyFileId(CopySource, SourceResHeaders, ChunkSize, Bucket, Key);
        uuid && session.saveUploadId(uuid, UploadData.UploadId, self.options.UploadIdCacheLimit); // 缓存 UploadId
        session.setUsing(UploadData.UploadId); // 标记 UploadId 为正在使用

        var needCopySlices = util.filter(UploadData.PartList, function (SliceItem) {
          if (SliceItem['Uploaded']) {
            FinishSize += SliceItem['PartNumber'] >= ChunkCount ? FileSize % ChunkSize || ChunkSize : ChunkSize;
          }
          return !SliceItem['Uploaded'];
        });
        Async.eachLimit(needCopySlices, ChunkParallel, function (SliceItem, asyncCallback) {
          var PartNumber = SliceItem.PartNumber;
          var CopySourceRange = SliceItem.CopySourceRange;
          var currentSize = SliceItem.end - SliceItem.start;
          var preAddSize = 0;
          Async.retry(ChunkRetryTimes, function (tryCallback) {
            copySliceItem.call(self, {
              Bucket: Bucket,
              Region: Region,
              Key: Key,
              CopySource: CopySource,
              UploadId: UploadData.UploadId,
              PartNumber: PartNumber,
              CopySourceRange: CopySourceRange,
              tracker: params.tracker,
              calledBySdk: 'sliceCopyFile',
              onProgress: function onProgress(data) {
                FinishSize += data.loaded - preAddSize;
                preAddSize = data.loaded;
                _onProgress3({
                  loaded: FinishSize,
                  total: FileSize
                });
              }
            }, tryCallback);
          }, function (err, data) {
            if (err) {
              return asyncCallback(err);
            }
            _onProgress3({
              loaded: FinishSize,
              total: FileSize
            });
            FinishSize += currentSize - preAddSize;
            SliceItem.ETag = data.ETag;
            asyncCallback(err || null, data);
          });
        }, function (err) {
          if (err) {
            session.removeUsing(UploadData.UploadId); // 标记 UploadId 没被使用了，因为复制没提供重试，所以只要出错，就是 UploadId 停用了。
            _onProgress3(null, true);
            return callback(err);
          }
          ep.emit('copy_slice_complete', UploadData);
        });
      });
      ep.on('get_chunk_size_finish', function () {
        var createNewUploadId = function createNewUploadId() {
          self.multipartInit({
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            Headers: TargetHeader,
            tracker: params.tracker,
            calledBySdk: 'sliceCopyFile'
          }, function (err, data) {
            if (err) return callback(err);
            params.UploadId = data.UploadId;
            ep.emit('get_copy_data_finish', {
              UploadId: params.UploadId,
              PartList: params.PartList
            });
          });
        };

        // 在本地找可用的 UploadId
        var uuid = session.getCopyFileId(CopySource, SourceResHeaders, ChunkSize, Bucket, Key);
        var LocalUploadIdList = session.getUploadIdList(uuid);
        if (!uuid || !LocalUploadIdList) return createNewUploadId();
        var next = function next(index) {
          // 如果本地找不到可用 UploadId，再一个个遍历校验远端
          if (index >= LocalUploadIdList.length) return createNewUploadId();
          var UploadId = LocalUploadIdList[index];
          // 如果正在被使用，跳过
          if (session.using[UploadId]) return next(index + 1);
          // 判断 UploadId 是否存在线上
          wholeMultipartListPart.call(self, {
            Bucket: Bucket,
            Region: Region,
            Key: Key,
            UploadId: UploadId,
            tracker: params.tracker,
            calledBySdk: 'sliceCopyFile'
          }, function (err, PartListData) {
            if (err) {
              // 如果 UploadId 获取会出错，跳过并删除
              session.removeUploadId(UploadId);
              next(index + 1);
            } else {
              // 如果异步回来 UploadId 已经被用了，也跳过
              if (session.using[UploadId]) return next(index + 1);
              // 找到可用 UploadId
              var finishETagMap = {};
              var offset = 0;
              util.each(PartListData.PartList, function (PartItem) {
                var size = parseInt(PartItem.Size);
                var end = offset + size - 1;
                finishETagMap[PartItem.PartNumber + '|' + offset + '|' + end] = PartItem.ETag;
                offset += size;
              });
              util.each(params.PartList, function (PartItem) {
                var ETag = finishETagMap[PartItem.PartNumber + '|' + PartItem.start + '|' + PartItem.end];
                if (ETag) {
                  PartItem.ETag = ETag;
                  PartItem.Uploaded = true;
                }
              });
              ep.emit('get_copy_data_finish', {
                UploadId: UploadId,
                PartList: params.PartList
              });
            }
          });
        };
        next(0);
      });
      ep.on('get_file_size_finish', function () {
        // 控制分片大小
        (function () {
          var SIZE = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 1024 * 2, 1024 * 4, 1024 * 5];
          var AutoChunkSize = 1024 * 1024;
          for (var i = 0; i < SIZE.length; i++) {
            AutoChunkSize = SIZE[i] * 1024 * 1024;
            if (FileSize / AutoChunkSize <= self.options.MaxPartNumber) break;
          }
          params.ChunkSize = ChunkSize = Math.max(ChunkSize, AutoChunkSize);
          ChunkCount = Math.ceil(FileSize / ChunkSize);
          var list = [];
          for (var partNumber = 1; partNumber <= ChunkCount; partNumber++) {
            var start = (partNumber - 1) * ChunkSize;
            var end = partNumber * ChunkSize < FileSize ? partNumber * ChunkSize - 1 : FileSize - 1;
            var item = {
              PartNumber: partNumber,
              start: start,
              end: end,
              CopySourceRange: 'bytes=' + start + '-' + end
            };
            list.push(item);
          }
          params.PartList = list;
        })();
        var TargetHeader;
        if (params.Headers['x-cos-metadata-directive'] === 'Replaced') {
          TargetHeader = params.Headers;
        } else {
          TargetHeader = SourceHeaders;
        }
        TargetHeader['x-cos-storage-class'] = params.Headers['x-cos-storage-class'] || SourceHeaders['x-cos-storage-class'];
        TargetHeader = util.clearKey(TargetHeader);
        /**
         * 对于归档存储的对象，如果未恢复副本，则不允许 Copy
         */
        if (SourceHeaders['x-cos-storage-class'] === 'ARCHIVE' || SourceHeaders['x-cos-storage-class'] === 'DEEP_ARCHIVE') {
          var restoreHeader = SourceHeaders['x-cos-restore'];
          if (!restoreHeader || restoreHeader === 'ongoing-request="true"') {
            callback({
              error: 'Unrestored archive object is not allowed to be copied'
            });
            return;
          }
        }
        /**
         * 去除一些无用的头部，规避 multipartInit 出错
         * 这些头部通常是在 putObjectCopy 时才使用
         */
        delete TargetHeader['x-cos-copy-source'];
        delete TargetHeader['x-cos-metadata-directive'];
        delete TargetHeader['x-cos-copy-source-If-Modified-Since'];
        delete TargetHeader['x-cos-copy-source-If-Unmodified-Since'];
        delete TargetHeader['x-cos-copy-source-If-Match'];
        delete TargetHeader['x-cos-copy-source-If-None-Match'];
        ep.emit('get_chunk_size_finish');
      });

      // 获取远端复制源文件的大小
      self.headObject({
        Bucket: SourceBucket,
        Region: SourceRegion,
        Key: SourceKey,
        tracker: params.tracker,
        calledBySdk: 'sliceCopyFile'
      }, function (err, data) {
        if (err) {
          if (err.statusCode && err.statusCode === 404) {
            callback({
              ErrorStatus: SourceKey + ' Not Exist'
            });
          } else {
            callback(err);
          }
          return;
        }
        FileSize = params.FileSize = data.headers['content-length'];
        if (FileSize === undefined || !FileSize) {
          callback({
            error: 'get Content-Length error, please add "Content-Length" to CORS ExposeHeader setting.'
          });
          return;
        }
        params.tracker && params.tracker.setParams({
          httpSize: FileSize
        });
        _onProgress3 = util.throttleOnProgress.call(self, FileSize, params.onProgress);

        // 开始上传
        if (FileSize <= CopySliceSize) {
          if (!params.Headers['x-cos-metadata-directive']) {
            params.Headers['x-cos-metadata-directive'] = 'Copy';
          }
          self.putObjectCopy(Object.assign(params, {
            calledBySdk: 'sliceCopyFile'
          }), function (err, data) {
            if (err) {
              _onProgress3(null, true);
              return callback(err);
            }
            _onProgress3({
              loaded: FileSize,
              total: FileSize
            }, true);
            callback(err, data);
          });
        } else {
          var resHeaders = data.headers;
          SourceResHeaders = resHeaders;
          SourceHeaders = {
            'Cache-Control': resHeaders['cache-control'],
            'Content-Disposition': resHeaders['content-disposition'],
            'Content-Encoding': resHeaders['content-encoding'],
            'Content-Type': resHeaders['content-type'],
            Expires: resHeaders['expires'],
            'x-cos-storage-class': resHeaders['x-cos-storage-class']
          };
          util.each(resHeaders, function (v, k) {
            var metaPrefix = 'x-cos-meta-';
            if (k.indexOf(metaPrefix) === 0 && k.length > metaPrefix.length) {
              SourceHeaders[k] = v;
            }
          });
          ep.emit('get_file_size_finish');
        }
      });
    }

    // 复制指定分片
    function copySliceItem(params, callback) {
      var TaskId = params.TaskId;
      var Bucket = params.Bucket;
      var Region = params.Region;
      var Key = params.Key;
      var CopySource = params.CopySource;
      var UploadId = params.UploadId;
      var PartNumber = params.PartNumber * 1;
      var CopySourceRange = params.CopySourceRange;
      var ChunkRetryTimes = this.options.ChunkRetryTimes + 1;
      var self = this;
      Async.retry(ChunkRetryTimes, function (tryCallback) {
        self.uploadPartCopy({
          TaskId: TaskId,
          Bucket: Bucket,
          Region: Region,
          Key: Key,
          CopySource: CopySource,
          UploadId: UploadId,
          PartNumber: PartNumber,
          CopySourceRange: CopySourceRange,
          onProgress: params.onProgress,
          tracker: params.tracker,
          calledBySdk: params.calledBySdk
        }, function (err, data) {
          tryCallback(err || null, data);
        });
      }, function (err, data) {
        return callback(err, data);
      });
    }
    var API_MAP = {
      sliceUploadFile: sliceUploadFile,
      abortUploadTask: abortUploadTask,
      uploadFile: uploadFile,
      uploadFiles: uploadFiles,
      sliceCopyFile: sliceCopyFile
    };
    module.exports.init = function (COS, task) {
      task.transferToTaskMethod(API_MAP, 'sliceUploadFile');
      util.each(API_MAP, function (fn, apiName) {
        COS.prototype[apiName] = util.apiWrapper(apiName, fn);
      });
    };

    /***/ }),

    /***/ "./src/async.js":
    /*!**********************!*\
      !*** ./src/async.js ***!
      \**********************/
    /*! no static exports found */
    /***/ (function(module, exports) {

    var eachLimit = function eachLimit(arr, limit, iterator, callback) {
      callback = callback || function () {};
      if (!arr.length || limit <= 0) {
        return callback();
      }
      var completed = 0;
      var started = 0;
      var running = 0;
      (function replenish() {
        if (completed >= arr.length) {
          return callback();
        }
        while (running < limit && started < arr.length) {
          started += 1;
          running += 1;
          iterator(arr[started - 1], function (err) {
            if (err) {
              callback(err);
              callback = function callback() {};
            } else {
              completed += 1;
              running -= 1;
              if (completed >= arr.length) {
                callback();
              } else {
                replenish();
              }
            }
          });
        }
      })();
    };
    var retry = function retry(times, iterator, callback) {
      var next = function next(index) {
        iterator(function (err, data) {
          if (err && index < times) {
            next(index + 1);
          } else {
            callback(err, data);
          }
        });
      };
      if (times < 1) {
        callback();
      } else {
        next(1);
      }
    };
    var async = {
      eachLimit: eachLimit,
      retry: retry
    };
    module.exports = async;

    /***/ }),

    /***/ "./src/base.js":
    /*!*********************!*\
      !*** ./src/base.js ***!
      \*********************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    "use strict";


    var REQUEST = __webpack_require__(/*! ../lib/request */ "./lib/request.js");
    var util = __webpack_require__(/*! ./util */ "./src/util.js");
    var mime = __webpack_require__(/*! mime */ "./node_modules/mime/index.js");

    // Bucket 相关

    /**
     * 获取用户的 bucket 列表
     * @param  {Object}  params         回调函数，必须，下面为参数列表
     * 无特殊参数
     * @param  {Function}  callback     回调函数，必须
     */
    function getService(params, callback) {
      if (typeof params === 'function') {
        callback = params;
        params = {};
      }
      var protocol = 'https:';
      var domain = this.options.ServiceDomain;
      var region = params.Region;
      if (domain) {
        domain = domain.replace(/\{\{Region\}\}/gi, region || '').replace(/\{\{.*?\}\}/gi, '');
        if (!/^[a-zA-Z]+:\/\//.test(domain)) {
          domain = protocol + '//' + domain;
        }
        if (domain.slice(-1) === '/') {
          domain = domain.slice(0, -1);
        }
      } else if (region) {
        domain = protocol + '//cos.' + region + '.myqcloud.com';
      } else {
        domain = protocol + '//service.cos.myqcloud.com';
      }
      var SignHost = '';
      var standardHost = region ? 'cos.' + region + '.myqcloud.com' : 'service.cos.myqcloud.com';
      var urlHost = domain.replace(/^https?:\/\/([^/]+)(\/.*)?$/, '$1');
      if (standardHost === urlHost) SignHost = standardHost;
      submitRequest.call(this, {
        Action: 'name/cos:GetService',
        url: domain,
        method: 'GET',
        headers: params.Headers,
        tracker: params.tracker
      }, function (err, data) {
        if (err) return callback(err);
        var buckets = data && data.ListAllMyBucketsResult && data.ListAllMyBucketsResult.Buckets && data.ListAllMyBucketsResult.Buckets.Bucket || [];
        buckets = util.isArray(buckets) ? buckets : [buckets];
        var owner = data && data.ListAllMyBucketsResult && data.ListAllMyBucketsResult.Owner || {};
        callback(null, {
          Buckets: buckets,
          Owner: owner,
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 创建 Bucket，并初始化访问权限
     * @param  {Object}  params                         参数对象，必须
     *     @param  {String}  params.Bucket              Bucket名称，必须
     *     @param  {String}  params.Region              地域名称，必须
     *     @param  {String}  params.ACL                 用户自定义文件权限，可以设置：private，public-read；默认值：private，非必须
     *     @param  {String}  params.GrantRead           赋予被授权者读的权限，格式x-cos-grant-read: uin=" ",uin=" "，非必须
     *     @param  {String}  params.GrantWrite          赋予被授权者写的权限，格式x-cos-grant-write: uin=" ",uin=" "，非必须
     *     @param  {String}  params.GrantFullControl    赋予被授权者读写权限，格式x-cos-grant-full-control: uin=" ",uin=" "，非必须
     * @param  {Function}  callback                     回调函数，必须
     * @return  {Object}  err                           请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data                          返回的数据
     *     @return  {String}  data.Location             操作地址
     */
    function putBucket(params, callback) {
      var self = this;
      var xml = '';
      if (params['BucketAZConfig']) {
        var CreateBucketConfiguration = {
          BucketAZConfig: params.BucketAZConfig
        };
        xml = util.json2xml({
          CreateBucketConfiguration: CreateBucketConfiguration
        });
      }
      submitRequest.call(this, {
        Action: 'name/cos:PutBucket',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        body: xml,
        tracker: params.tracker
      }, function (err, data) {
        if (err) return callback(err);
        var url = getUrl({
          protocol: self.options.Protocol,
          domain: self.options.Domain,
          bucket: params.Bucket,
          region: params.Region,
          isLocation: true
        });
        callback(null, {
          Location: url,
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 查看是否存在该Bucket，是否有权限访问
     * @param  {Object}  params                     参数对象，必须
     *     @param  {String}  params.Bucket          Bucket名称，必须
     *     @param  {String}  params.Region          地域名称，必须
     * @param  {Function}  callback                 回调函数，必须
     * @return  {Object}  err                       请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data                      返回的数据
     *     @return  {Boolean}  data.BucketExist     Bucket是否存在
     *     @return  {Boolean}  data.BucketAuth      是否有 Bucket 的访问权限
     */
    function headBucket(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:HeadBucket',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        method: 'HEAD',
        tracker: params.tracker
      }, function (err, data) {
        callback(err, data);
      });
    }

    /**
     * 获取 Bucket 下的 object 列表
     * @param  {Object}  params                         参数对象，必须
     *     @param  {String}  params.Bucket              Bucket名称，必须
     *     @param  {String}  params.Region              地域名称，必须
     *     @param  {String}  params.Prefix              前缀匹配，用来规定返回的文件前缀地址，非必须
     *     @param  {String}  params.Delimiter           定界符为一个符号，如果有Prefix，则将Prefix到delimiter之间的相同路径归为一类，非必须
     *     @param  {String}  params.Marker              默认以UTF-8二进制顺序列出条目，所有列出条目从marker开始，非必须
     *     @param  {String}  params.MaxKeys             单次返回最大的条目数量，默认1000，非必须
     *     @param  {String}  params.EncodingType        规定返回值的编码方式，非必须
     * @param  {Function}  callback                     回调函数，必须
     * @return  {Object}  err                           请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data                          返回的数据
     *     @return  {Object}  data.ListBucketResult     返回的 object 列表信息
     */
    function getBucket(params, callback) {
      var reqParams = {};
      reqParams['prefix'] = params['Prefix'] || '';
      reqParams['delimiter'] = params['Delimiter'];
      reqParams['marker'] = params['Marker'];
      reqParams['max-keys'] = params['MaxKeys'];
      reqParams['encoding-type'] = params['EncodingType'];
      submitRequest.call(this, {
        Action: 'name/cos:GetBucket',
        ResourceKey: reqParams['prefix'],
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        qs: reqParams,
        tracker: params.tracker
      }, function (err, data) {
        if (err) return callback(err);
        var ListBucketResult = data.ListBucketResult || {};
        var Contents = ListBucketResult.Contents || [];
        var CommonPrefixes = ListBucketResult.CommonPrefixes || [];
        Contents = util.isArray(Contents) ? Contents : [Contents];
        CommonPrefixes = util.isArray(CommonPrefixes) ? CommonPrefixes : [CommonPrefixes];
        var result = util.clone(ListBucketResult);
        util.extend(result, {
          Contents: Contents,
          CommonPrefixes: CommonPrefixes,
          statusCode: data.statusCode,
          headers: data.headers
        });
        callback(null, result);
      });
    }

    /**
     * 删除 Bucket
     * @param  {Object}  params                 参数对象，必须
     *     @param  {String}  params.Bucket      Bucket名称，必须
     *     @param  {String}  params.Region      地域名称，必须
     * @param  {Function}  callback             回调函数，必须
     * @return  {Object}  err                   请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data                  返回的数据
     *     @return  {String}  data.Location     操作地址
     */
    function deleteBucket(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:DeleteBucket',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        method: 'DELETE',
        tracker: params.tracker
      }, function (err, data) {
        if (err && err.statusCode === 204) {
          return callback(null, {
            statusCode: err.statusCode
          });
        } else if (err) {
          return callback(err);
        }
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 设置 Bucket 的 权限列表
     * @param  {Object}  params                         参数对象，必须
     *     @param  {String}  params.Bucket              Bucket名称，必须
     *     @param  {String}  params.Region              地域名称，必须
     *     @param  {String}  params.ACL                 用户自定义文件权限，可以设置：private，public-read；默认值：private，非必须
     *     @param  {String}  params.GrantRead           赋予被授权者读的权限，格式x-cos-grant-read: uin=" ",uin=" "，非必须
     *     @param  {String}  params.GrantWrite          赋予被授权者写的权限，格式x-cos-grant-write: uin=" ",uin=" "，非必须
     *     @param  {String}  params.GrantFullControl    赋予被授权者读写权限，格式x-cos-grant-full-control: uin=" ",uin=" "，非必须
     * @param  {Function}  callback                     回调函数，必须
     * @return  {Object}  err                           请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data                          返回的数据
     */
    function putBucketAcl(params, callback) {
      var headers = params.Headers;
      var xml = '';
      if (params['AccessControlPolicy']) {
        var AccessControlPolicy = util.clone(params['AccessControlPolicy'] || {});
        var Grants = AccessControlPolicy.Grants || AccessControlPolicy.Grant;
        Grants = util.isArray(Grants) ? Grants : [Grants];
        delete AccessControlPolicy.Grant;
        delete AccessControlPolicy.Grants;
        AccessControlPolicy.AccessControlList = {
          Grant: Grants
        };
        xml = util.json2xml({
          AccessControlPolicy: AccessControlPolicy
        });
        headers['Content-Type'] = 'application/xml';
        headers['Content-MD5'] = util.binaryBase64(util.md5(xml));
      }

      // Grant Header 去重
      util.each(headers, function (val, key) {
        if (key.indexOf('x-cos-grant-') === 0) {
          headers[key] = uniqGrant(headers[key]);
        }
      });
      submitRequest.call(this, {
        Action: 'name/cos:PutBucketACL',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: headers,
        action: 'acl',
        body: xml,
        tracker: params.tracker
      }, function (err, data) {
        if (err) return callback(err);
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 获取 Bucket 的 权限列表
     * @param  {Object}  params                         参数对象，必须
     *     @param  {String}  params.Bucket              Bucket名称，必须
     *     @param  {String}  params.Region              地域名称，必须
     * @param  {Function}  callback                     回调函数，必须
     * @return  {Object}  err                           请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data                          返回的数据
     *     @return  {Object}  data.AccessControlPolicy  访问权限信息
     */
    function getBucketAcl(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:GetBucketACL',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'acl',
        tracker: params.tracker
      }, function (err, data) {
        if (err) return callback(err);
        var AccessControlPolicy = data.AccessControlPolicy || {};
        var Owner = AccessControlPolicy.Owner || {};
        var Grant = AccessControlPolicy.AccessControlList.Grant || [];
        Grant = util.isArray(Grant) ? Grant : [Grant];
        var result = decodeAcl(AccessControlPolicy);
        if (data.headers && data.headers['x-cos-acl']) {
          result.ACL = data.headers['x-cos-acl'];
        }
        result = util.extend(result, {
          Owner: Owner,
          Grants: Grant,
          statusCode: data.statusCode,
          headers: data.headers
        });
        callback(null, result);
      });
    }

    /**
     * 设置 Bucket 的 跨域设置
     * @param  {Object}  params                             参数对象，必须
     *     @param  {String}  params.Bucket                  Bucket名称，必须
     *     @param  {String}  params.Region                  地域名称，必须
     *     @param  {Object}  params.CORSConfiguration       相关的跨域设置，必须
     * @param  {Array}  params.CORSConfiguration.CORSRules  对应的跨域规则
     * @param  {Function}  callback                         回调函数，必须
     * @return  {Object}  err                               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data                              返回的数据
     */
    function putBucketCors(params, callback) {
      var CORSConfiguration = params['CORSConfiguration'] || {};
      var CORSRules = CORSConfiguration['CORSRules'] || params['CORSRules'] || [];
      CORSRules = util.clone(util.isArray(CORSRules) ? CORSRules : [CORSRules]);
      util.each(CORSRules, function (rule) {
        util.each(['AllowedOrigin', 'AllowedHeader', 'AllowedMethod', 'ExposeHeader'], function (key) {
          var sKey = key + 's';
          var val = rule[sKey] || rule[key] || [];
          delete rule[sKey];
          rule[key] = util.isArray(val) ? val : [val];
        });
      });
      var Conf = {
        CORSRule: CORSRules
      };
      if (params.ResponseVary) Conf.ResponseVary = params.ResponseVary;
      var xml = util.json2xml({
        CORSConfiguration: Conf
      });
      var headers = params.Headers;
      headers['Content-Type'] = 'application/xml';
      headers['Content-MD5'] = util.binaryBase64(util.md5(xml));
      submitRequest.call(this, {
        Action: 'name/cos:PutBucketCORS',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        body: xml,
        action: 'cors',
        headers: headers,
        tracker: params.tracker
      }, function (err, data) {
        if (err) return callback(err);
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 获取 Bucket 的 跨域设置
     * @param  {Object}  params                         参数对象，必须
     *     @param  {String}  params.Bucket              Bucket名称，必须
     *     @param  {String}  params.Region              地域名称，必须
     * @param  {Function}  callback                     回调函数，必须
     * @return  {Object}  err                           请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data                          返回的数据
     *     @return  {Object}  data.CORSRules            Bucket的跨域设置
     */
    function getBucketCors(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:GetBucketCORS',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'cors',
        tracker: params.tracker
      }, function (err, data) {
        if (err) {
          if (err.statusCode === 404 && err.error && err.error.Code === 'NoSuchCORSConfiguration') {
            var result = {
              CORSRules: [],
              statusCode: err.statusCode
            };
            err.headers && (result.headers = err.headers);
            callback(null, result);
          } else {
            callback(err);
          }
          return;
        }
        var CORSConfiguration = data.CORSConfiguration || {};
        var CORSRules = CORSConfiguration.CORSRules || CORSConfiguration.CORSRule || [];
        CORSRules = util.clone(util.isArray(CORSRules) ? CORSRules : [CORSRules]);
        var ResponseVary = CORSConfiguration.ResponseVary;
        util.each(CORSRules, function (rule) {
          util.each(['AllowedOrigin', 'AllowedHeader', 'AllowedMethod', 'ExposeHeader'], function (key) {
            var sKey = key + 's';
            var val = rule[sKey] || rule[key] || [];
            delete rule[key];
            rule[sKey] = util.isArray(val) ? val : [val];
          });
        });
        callback(null, {
          CORSRules: CORSRules,
          ResponseVary: ResponseVary,
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 删除 Bucket 的 跨域设置
     * @param  {Object}  params                 参数对象，必须
     *     @param  {String}  params.Bucket      Bucket名称，必须
     *     @param  {String}  params.Region      地域名称，必须
     * @param  {Function}  callback             回调函数，必须
     * @return  {Object}  err                   请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data                  返回的数据
     */
    function deleteBucketCors(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:DeleteBucketCORS',
        method: 'DELETE',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'cors',
        tracker: params.tracker
      }, function (err, data) {
        if (err && err.statusCode === 204) {
          return callback(null, {
            statusCode: err.statusCode
          });
        } else if (err) {
          return callback(err);
        }
        callback(null, {
          statusCode: data.statusCode || err.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 获取 Bucket 的 地域信息
     * @param  {Object}  params             参数对象，必须
     *     @param  {String}  params.Bucket  Bucket名称，必须
     *     @param  {String}  params.Region  地域名称，必须
     * @param  {Function}  callback         回调函数，必须
     * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data              返回数据，包含地域信息 LocationConstraint
     */
    function getBucketLocation(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:GetBucketLocation',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'location',
        tracker: params.tracker
      }, function (err, data) {
        if (err) return callback(err);
        callback(null, data);
      });
    }
    function putBucketPolicy(params, callback) {
      var Policy = params['Policy'];
      var PolicyStr = Policy;
      try {
        if (typeof Policy === 'string') {
          Policy = JSON.parse(PolicyStr);
        } else {
          PolicyStr = JSON.stringify(Policy);
        }
      } catch (e) {
        callback({
          error: 'Policy format error'
        });
      }
      var headers = params.Headers;
      headers['Content-Type'] = 'application/json';
      headers['Content-MD5'] = util.binaryBase64(util.md5(PolicyStr));
      submitRequest.call(this, {
        Action: 'name/cos:PutBucketPolicy',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        action: 'policy',
        body: PolicyStr,
        headers: headers,
        json: true,
        tracker: params.tracker
      }, function (err, data) {
        if (err && err.statusCode === 204) {
          return callback(null, {
            statusCode: err.statusCode
          });
        } else if (err) {
          return callback(err);
        }
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 获取 Bucket 的读取权限策略
     * @param  {Object}  params             参数对象，必须
     *     @param  {String}  params.Bucket  Bucket名称，必须
     *     @param  {String}  params.Region  地域名称，必须
     * @param  {Function}  callback         回调函数，必须
     * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data              返回数据
     */
    function getBucketPolicy(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:GetBucketPolicy',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'policy',
        rawBody: true,
        tracker: params.tracker
      }, function (err, data) {
        if (err) {
          if (err.statusCode && err.statusCode === 403) {
            return callback({
              ErrorStatus: 'Access Denied'
            });
          }
          if (err.statusCode && err.statusCode === 405) {
            return callback({
              ErrorStatus: 'Method Not Allowed'
            });
          }
          if (err.statusCode && err.statusCode === 404) {
            return callback({
              ErrorStatus: 'Policy Not Found'
            });
          }
          return callback(err);
        }
        var Policy = {};
        try {
          Policy = JSON.parse(data.body);
        } catch (e) {}
        callback(null, {
          Policy: Policy,
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 删除 Bucket 的 跨域设置
     * @param  {Object}  params                 参数对象，必须
     *     @param  {String}  params.Bucket      Bucket名称，必须
     *     @param  {String}  params.Region      地域名称，必须
     * @param  {Function}  callback             回调函数，必须
     * @return  {Object}  err                   请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data                  返回的数据
     */
    function deleteBucketPolicy(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:DeleteBucketPolicy',
        method: 'DELETE',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'policy',
        tracker: params.tracker
      }, function (err, data) {
        if (err && err.statusCode === 204) {
          return callback(null, {
            statusCode: err.statusCode
          });
        } else if (err) {
          return callback(err);
        }
        callback(null, {
          statusCode: data.statusCode || err.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 设置 Bucket 的标签
     * @param  {Object}  params             参数对象，必须
     *     @param  {String}  params.Bucket  Bucket名称，必须
     *     @param  {String}  params.Region  地域名称，必须
     *     @param  {Array}   params.TagSet  标签设置，必须
     * @param  {Function}  callback         回调函数，必须
     * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data              返回数据
     */
    function putBucketTagging(params, callback) {
      var Tagging = params['Tagging'] || {};
      var Tags = Tagging.TagSet || Tagging.Tags || params['Tags'] || [];
      Tags = util.clone(util.isArray(Tags) ? Tags : [Tags]);
      var xml = util.json2xml({
        Tagging: {
          TagSet: {
            Tag: Tags
          }
        }
      });
      var headers = params.Headers;
      headers['Content-Type'] = 'application/xml';
      headers['Content-MD5'] = util.binaryBase64(util.md5(xml));
      submitRequest.call(this, {
        Action: 'name/cos:PutBucketTagging',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        body: xml,
        action: 'tagging',
        headers: headers,
        tracker: params.tracker
      }, function (err, data) {
        if (err && err.statusCode === 204) {
          return callback(null, {
            statusCode: err.statusCode
          });
        } else if (err) {
          return callback(err);
        }
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 获取 Bucket 的标签设置
     * @param  {Object}  params             参数对象，必须
     *     @param  {String}  params.Bucket  Bucket名称，必须
     *     @param  {String}  params.Region  地域名称，必须
     * @param  {Function}  callback         回调函数，必须
     * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data              返回数据
     */
    function getBucketTagging(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:GetBucketTagging',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'tagging',
        tracker: params.tracker
      }, function (err, data) {
        if (err) {
          if (err.statusCode === 404 && err.error && (err.error === 'Not Found' || err.error.Code === 'NoSuchTagSet')) {
            var result = {
              Tags: [],
              statusCode: err.statusCode
            };
            err.headers && (result.headers = err.headers);
            callback(null, result);
          } else {
            callback(err);
          }
          return;
        }
        var Tags = [];
        try {
          Tags = data.Tagging.TagSet.Tag || [];
        } catch (e) {}
        Tags = util.clone(util.isArray(Tags) ? Tags : [Tags]);
        callback(null, {
          Tags: Tags,
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 删除 Bucket 的 标签设置
     * @param  {Object}  params             参数对象，必须
     *     @param  {String}  params.Bucket  Bucket名称，必须
     *     @param  {String}  params.Region  地域名称，必须
     * @param  {Function}  callback         回调函数，必须
     * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data              返回的数据
     */
    function deleteBucketTagging(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:DeleteBucketTagging',
        method: 'DELETE',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'tagging',
        tracker: params.tracker
      }, function (err, data) {
        if (err && err.statusCode === 204) {
          return callback(null, {
            statusCode: err.statusCode
          });
        } else if (err) {
          return callback(err);
        }
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }
    function putBucketLifecycle(params, callback) {
      var LifecycleConfiguration = params['LifecycleConfiguration'] || {};
      var Rules = LifecycleConfiguration.Rules || params.Rules || [];
      Rules = util.clone(Rules);
      var xml = util.json2xml({
        LifecycleConfiguration: {
          Rule: Rules
        }
      });
      var headers = params.Headers;
      headers['Content-Type'] = 'application/xml';
      headers['Content-MD5'] = util.binaryBase64(util.md5(xml));
      submitRequest.call(this, {
        Action: 'name/cos:PutBucketLifecycle',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        body: xml,
        action: 'lifecycle',
        headers: headers,
        tracker: params.tracker
      }, function (err, data) {
        if (err && err.statusCode === 204) {
          return callback(null, {
            statusCode: err.statusCode
          });
        } else if (err) {
          return callback(err);
        }
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }
    function getBucketLifecycle(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:GetBucketLifecycle',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'lifecycle',
        tracker: params.tracker
      }, function (err, data) {
        if (err) {
          if (err.statusCode === 404 && err.error && err.error.Code === 'NoSuchLifecycleConfiguration') {
            var result = {
              Rules: [],
              statusCode: err.statusCode
            };
            err.headers && (result.headers = err.headers);
            callback(null, result);
          } else {
            callback(err);
          }
          return;
        }
        var Rules = [];
        try {
          Rules = data.LifecycleConfiguration.Rule || [];
        } catch (e) {}
        Rules = util.clone(util.isArray(Rules) ? Rules : [Rules]);
        callback(null, {
          Rules: Rules,
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }
    function deleteBucketLifecycle(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:DeleteBucketLifecycle',
        method: 'DELETE',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'lifecycle',
        tracker: params.tracker
      }, function (err, data) {
        if (err && err.statusCode === 204) {
          return callback(null, {
            statusCode: err.statusCode
          });
        } else if (err) {
          return callback(err);
        }
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }
    function putBucketVersioning(params, callback) {
      if (!params['VersioningConfiguration']) {
        callback({
          error: 'missing param VersioningConfiguration'
        });
        return;
      }
      var VersioningConfiguration = params['VersioningConfiguration'] || {};
      var xml = util.json2xml({
        VersioningConfiguration: VersioningConfiguration
      });
      var headers = params.Headers;
      headers['Content-Type'] = 'application/xml';
      headers['Content-MD5'] = util.binaryBase64(util.md5(xml));
      submitRequest.call(this, {
        Action: 'name/cos:PutBucketVersioning',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        body: xml,
        action: 'versioning',
        headers: headers,
        tracker: params.tracker
      }, function (err, data) {
        if (err && err.statusCode === 204) {
          return callback(null, {
            statusCode: err.statusCode
          });
        } else if (err) {
          return callback(err);
        }
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }
    function getBucketVersioning(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:GetBucketVersioning',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'versioning',
        tracker: params.tracker
      }, function (err, data) {
        if (!err) {
          !data.VersioningConfiguration && (data.VersioningConfiguration = {});
        }
        callback(err, data);
      });
    }
    function putBucketReplication(params, callback) {
      var ReplicationConfiguration = util.clone(params.ReplicationConfiguration);
      var xml = util.json2xml({
        ReplicationConfiguration: ReplicationConfiguration
      });
      xml = xml.replace(/<(\/?)Rules>/gi, '<$1Rule>');
      xml = xml.replace(/<(\/?)Tags>/gi, '<$1Tag>');
      var headers = params.Headers;
      headers['Content-Type'] = 'application/xml';
      headers['Content-MD5'] = util.binaryBase64(util.md5(xml));
      submitRequest.call(this, {
        Action: 'name/cos:PutBucketReplication',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        body: xml,
        action: 'replication',
        headers: headers,
        tracker: params.tracker
      }, function (err, data) {
        if (err && err.statusCode === 204) {
          return callback(null, {
            statusCode: err.statusCode
          });
        } else if (err) {
          return callback(err);
        }
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }
    function getBucketReplication(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:GetBucketReplication',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'replication',
        tracker: params.tracker
      }, function (err, data) {
        if (err) {
          if (err.statusCode === 404 && err.error && (err.error === 'Not Found' || err.error.Code === 'ReplicationConfigurationnotFoundError')) {
            var result = {
              ReplicationConfiguration: {
                Rules: []
              },
              statusCode: err.statusCode
            };
            err.headers && (result.headers = err.headers);
            callback(null, result);
          } else {
            callback(err);
          }
          return;
        }
        if (!err) {
          !data.ReplicationConfiguration && (data.ReplicationConfiguration = {});
        }
        if (data.ReplicationConfiguration.Rule) {
          data.ReplicationConfiguration.Rules = data.ReplicationConfiguration.Rule;
          delete data.ReplicationConfiguration.Rule;
        }
        callback(err, data);
      });
    }
    function deleteBucketReplication(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:DeleteBucketReplication',
        method: 'DELETE',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'replication',
        tracker: params.tracker
      }, function (err, data) {
        if (err && err.statusCode === 204) {
          return callback(null, {
            statusCode: err.statusCode
          });
        } else if (err) {
          return callback(err);
        }
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 设置 Bucket 静态网站配置信息
     * @param  {Object}  params                                                 参数对象，必须
     *     @param  {String}  params.Bucket                                      Bucket名称，必须
     *     @param  {String}  params.Region                                      地域名称，必须
     *     @param  {Object}  params.WebsiteConfiguration                        地域名称，必须
     *         @param  {Object}   WebsiteConfiguration.IndexDocument            索引文档，必须
     *         @param  {Object}   WebsiteConfiguration.ErrorDocument            错误文档，非必须
     *         @param  {Object}   WebsiteConfiguration.RedirectAllRequestsTo    重定向所有请求，非必须
     *         @param  {Array}   params.RoutingRules                            重定向规则，非必须
     * @param  {Function}  callback                                             回调函数，必须
     * @return  {Object}  err                                                   请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data                                                  返回数据
     */
    function putBucketWebsite(params, callback) {
      if (!params['WebsiteConfiguration']) {
        callback({
          error: 'missing param WebsiteConfiguration'
        });
        return;
      }
      var WebsiteConfiguration = util.clone(params['WebsiteConfiguration'] || {});
      var RoutingRules = WebsiteConfiguration['RoutingRules'] || WebsiteConfiguration['RoutingRule'] || [];
      RoutingRules = util.isArray(RoutingRules) ? RoutingRules : [RoutingRules];
      delete WebsiteConfiguration.RoutingRule;
      delete WebsiteConfiguration.RoutingRules;
      if (RoutingRules.length) WebsiteConfiguration.RoutingRules = {
        RoutingRule: RoutingRules
      };
      var xml = util.json2xml({
        WebsiteConfiguration: WebsiteConfiguration
      });
      var headers = params.Headers;
      headers['Content-Type'] = 'application/xml';
      headers['Content-MD5'] = util.binaryBase64(util.md5(xml));
      submitRequest.call(this, {
        Action: 'name/cos:PutBucketWebsite',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        body: xml,
        action: 'website',
        headers: headers,
        tracker: params.tracker
      }, function (err, data) {
        if (err && err.statusCode === 204) {
          return callback(null, {
            statusCode: err.statusCode
          });
        } else if (err) {
          return callback(err);
        }
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 获取 Bucket 的静态网站配置信息
     * @param  {Object}  params             参数对象，必须
     *     @param  {String}  params.Bucket  Bucket名称，必须
     *     @param  {String}  params.Region  地域名称，必须
     * @param  {Function}  callback         回调函数，必须
     * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data              返回数据
     */
    function getBucketWebsite(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:GetBucketWebsite',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        headers: params.Headers,
        action: 'website',
        tracker: params.tracker
      }, function (err, data) {
        if (err) {
          if (err.statusCode === 404 && err.error.Code === 'NoSuchWebsiteConfiguration') {
            var result = {
              WebsiteConfiguration: {},
              statusCode: err.statusCode
            };
            err.headers && (result.headers = err.headers);
            callback(null, result);
          } else {
            callback(err);
          }
          return;
        }
        var WebsiteConfiguration = data.WebsiteConfiguration || {};
        if (WebsiteConfiguration['RoutingRules']) {
          var RoutingRules = util.clone(WebsiteConfiguration['RoutingRules'].RoutingRule || []);
          RoutingRules = util.makeArray(RoutingRules);
          WebsiteConfiguration.RoutingRules = RoutingRules;
        }
        callback(null, {
          WebsiteConfiguration: WebsiteConfiguration,
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 删除 Bucket 的静态网站配置
     * @param  {Object}  params             参数对象，必须
     *     @param  {String}  params.Bucket  Bucket名称，必须
     *     @param  {String}  params.Region  地域名称，必须
     * @param  {Function}  callback         回调函数，必须
     * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data              返回数据
     */
    function deleteBucketWebsite(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:DeleteBucketWebsite',
        method: 'DELETE',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'website',
        tracker: params.tracker
      }, function (err, data) {
        if (err && err.statusCode === 204) {
          return callback(null, {
            statusCode: err.statusCode
          });
        } else if (err) {
          return callback(err);
        }
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 设置 Bucket 的防盗链白名单或者黑名单
     * @param  {Object}  params                                                 参数对象，必须
     *     @param  {String}  params.Bucket                                      Bucket名称，必须
     *     @param  {String}  params.Region                                      地域名称，必须
     *     @param  {Object}  params.RefererConfiguration                        地域名称，必须
     *         @param  {String}   RefererConfiguration.Status                   是否开启防盗链，枚举值：Enabled、Disabled
     *         @param  {String}   RefererConfiguration.RefererType              防盗链类型，枚举值：Black-List、White-List，必须
     *         @param  {Array}   RefererConfiguration.DomianList.Domain         生效域名，必须
     *         @param  {String}   RefererConfiguration.EmptyReferConfiguration  ，非必须
     * @param  {Function}  callback                                             回调函数，必须
     * @return  {Object}  err                                                   请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data                                                  返回数据
     */
    function putBucketReferer(params, callback) {
      if (!params['RefererConfiguration']) {
        callback({
          error: 'missing param RefererConfiguration'
        });
        return;
      }
      var RefererConfiguration = util.clone(params['RefererConfiguration'] || {});
      var DomainList = RefererConfiguration['DomainList'] || {};
      var Domains = DomainList['Domains'] || DomainList['Domain'] || [];
      Domains = util.isArray(Domains) ? Domains : [Domains];
      if (Domains.length) RefererConfiguration.DomainList = {
        Domain: Domains
      };
      var xml = util.json2xml({
        RefererConfiguration: RefererConfiguration
      });
      var headers = params.Headers;
      headers['Content-Type'] = 'application/xml';
      headers['Content-MD5'] = util.binaryBase64(util.md5(xml));
      submitRequest.call(this, {
        Action: 'name/cos:PutBucketReferer',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        body: xml,
        action: 'referer',
        headers: headers,
        tracker: params.tracker
      }, function (err, data) {
        if (err && err.statusCode === 204) {
          return callback(null, {
            statusCode: err.statusCode
          });
        } else if (err) {
          return callback(err);
        }
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 获取 Bucket 的防盗链白名单或者黑名单
     * @param  {Object}  params             参数对象，必须
     *     @param  {String}  params.Bucket  Bucket名称，必须
     *     @param  {String}  params.Region  地域名称，必须
     * @param  {Function}  callback         回调函数，必须
     * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data              返回数据
     */
    function getBucketReferer(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:GetBucketReferer',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        headers: params.Headers,
        action: 'referer',
        tracker: params.tracker
      }, function (err, data) {
        if (err) {
          if (err.statusCode === 404 && err.error.Code === 'NoSuchRefererConfiguration') {
            var result = {
              WebsiteConfiguration: {},
              statusCode: err.statusCode
            };
            err.headers && (result.headers = err.headers);
            callback(null, result);
          } else {
            callback(err);
          }
          return;
        }
        var RefererConfiguration = data.RefererConfiguration || {};
        if (RefererConfiguration['DomainList']) {
          var Domains = util.makeArray(RefererConfiguration['DomainList'].Domain || []);
          RefererConfiguration.DomainList = {
            Domains: Domains
          };
        }
        callback(null, {
          RefererConfiguration: RefererConfiguration,
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 设置 Bucket 自定义域名
     * @param  {Object}  params                                                 参数对象，必须
     *     @param  {String}  params.Bucket                                      Bucket名称，必须
     *     @param  {String}  params.Region                                      地域名称，必须
     * @param  {Function}  callback                                             回调函数，必须
     * @return  {Object}  err                                                   请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data                                                  返回数据
     */
    function putBucketDomain(params, callback) {
      var DomainConfiguration = params['DomainConfiguration'] || {};
      var DomainRule = DomainConfiguration.DomainRule || params.DomainRule || [];
      DomainRule = util.clone(DomainRule);
      var xml = util.json2xml({
        DomainConfiguration: {
          DomainRule: DomainRule
        }
      });
      var headers = params.Headers;
      headers['Content-Type'] = 'application/xml';
      headers['Content-MD5'] = util.binaryBase64(util.md5(xml));
      submitRequest.call(this, {
        Action: 'name/cos:PutBucketDomain',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        body: xml,
        action: 'domain',
        headers: headers,
        tracker: params.tracker
      }, function (err, data) {
        if (err && err.statusCode === 204) {
          return callback(null, {
            statusCode: err.statusCode
          });
        } else if (err) {
          return callback(err);
        }
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 获取 Bucket 的自定义域名
     * @param  {Object}  params             参数对象，必须
     *     @param  {String}  params.Bucket  Bucket名称，必须
     *     @param  {String}  params.Region  地域名称，必须
     * @param  {Function}  callback         回调函数，必须
     * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data              返回数据
     */
    function getBucketDomain(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:GetBucketDomain',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'domain',
        tracker: params.tracker
      }, function (err, data) {
        if (err) return callback(err);
        var DomainRule = [];
        try {
          DomainRule = data.DomainConfiguration.DomainRule || [];
        } catch (e) {}
        DomainRule = util.clone(util.isArray(DomainRule) ? DomainRule : [DomainRule]);
        callback(null, {
          DomainRule: DomainRule,
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 删除 Bucket 自定义域名
     * @param  {Object}  params             参数对象，必须
     *     @param  {String}  params.Bucket  Bucket名称，必须
     *     @param  {String}  params.Region  地域名称，必须
     * @param  {Function}  callback         回调函数，必须
     * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data              返回数据
     */
    function deleteBucketDomain(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:DeleteBucketDomain',
        method: 'DELETE',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'domain',
        tracker: params.tracker
      }, function (err, data) {
        if (err && err.statusCode === 204) {
          return callback(null, {
            statusCode: err.statusCode
          });
        } else if (err) {
          return callback(err);
        }
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 设置 Bucket 的回源
     * @param  {Object}  params                                                 参数对象，必须
     *     @param  {String}  params.Bucket                                      Bucket名称，必须
     *     @param  {String}  params.Region                                      地域名称，必须
     * @param  {Function}  callback                                             回调函数，必须
     * @return  {Object}  err                                                   请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data                                                  返回数据
     */
    function putBucketOrigin(params, callback) {
      var OriginConfiguration = params['OriginConfiguration'] || {};
      var OriginRule = OriginConfiguration.OriginRule || params.OriginRule || [];
      OriginRule = util.clone(OriginRule);
      var xml = util.json2xml({
        OriginConfiguration: {
          OriginRule: OriginRule
        }
      });
      var headers = params.Headers;
      headers['Content-Type'] = 'application/xml';
      headers['Content-MD5'] = util.binaryBase64(util.md5(xml));
      submitRequest.call(this, {
        Action: 'name/cos:PutBucketOrigin',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        body: xml,
        action: 'origin',
        headers: headers,
        tracker: params.tracker
      }, function (err, data) {
        if (err && err.statusCode === 204) {
          return callback(null, {
            statusCode: err.statusCode
          });
        } else if (err) {
          return callback(err);
        }
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 获取 Bucket 的回源
     * @param  {Object}  params             参数对象，必须
     *     @param  {String}  params.Bucket  Bucket名称，必须
     *     @param  {String}  params.Region  地域名称，必须
     * @param  {Function}  callback         回调函数，必须
     * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data              返回数据
     */
    function getBucketOrigin(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:GetBucketOrigin',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'origin',
        tracker: params.tracker
      }, function (err, data) {
        if (err) return callback(err);
        var OriginRule = [];
        try {
          OriginRule = data.OriginConfiguration.OriginRule || [];
        } catch (e) {}
        OriginRule = util.clone(util.isArray(OriginRule) ? OriginRule : [OriginRule]);
        callback(null, {
          OriginRule: OriginRule,
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 删除 Bucket 的回源
     * @param  {Object}  params             参数对象，必须
     *     @param  {String}  params.Bucket  Bucket名称，必须
     *     @param  {String}  params.Region  地域名称，必须
     * @param  {Function}  callback         回调函数，必须
     * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data              返回数据
     */
    function deleteBucketOrigin(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:DeleteBucketOrigin',
        method: 'DELETE',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'origin',
        tracker: params.tracker
      }, function (err, data) {
        if (err && err.statusCode === 204) {
          return callback(null, {
            statusCode: err.statusCode
          });
        } else if (err) {
          return callback(err);
        }
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 设置 Bucket 的日志记录
     * @param  {Object}  params                                                 参数对象，必须
     *     @param  {String}  params.Bucket                                      Bucket名称，必须
     *     @param  {String}  params.Region                                      地域名称，必须
     *     @param  {(Object|String)}  params.BucketLoggingStatus                         说明日志记录配置的状态，如果无子节点信息则意为关闭日志记录，必须
     * @param  {Function}  callback                                             回调函数，必须
     * @return  {Object}  err                                                   请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data                                                  返回数据
     */
    function putBucketLogging(params, callback) {
      var xml = util.json2xml({
        BucketLoggingStatus: params['BucketLoggingStatus'] || ''
      });
      var headers = params.Headers;
      headers['Content-Type'] = 'application/xml';
      headers['Content-MD5'] = util.binaryBase64(util.md5(xml));
      submitRequest.call(this, {
        Action: 'name/cos:PutBucketLogging',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        body: xml,
        action: 'logging',
        headers: headers,
        tracker: params.tracker
      }, function (err, data) {
        if (err && err.statusCode === 204) {
          return callback(null, {
            statusCode: err.statusCode
          });
        } else if (err) {
          return callback(err);
        }
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 获取 Bucket 的日志记录
     * @param  {Object}  params             参数对象，必须
     *     @param  {String}  params.Bucket  Bucket名称，必须
     *     @param  {String}  params.Region  地域名称，必须
     * @param  {Function}  callback         回调函数，必须
     * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data              返回数据
     */
    function getBucketLogging(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:GetBucketLogging',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'logging',
        tracker: params.tracker
      }, function (err, data) {
        if (err) return callback(err);
        delete data.BucketLoggingStatus._xmlns;
        callback(null, {
          BucketLoggingStatus: data.BucketLoggingStatus,
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 创建/编辑 Bucket 的清单任务
     * @param  {Object}  params                                                 参数对象，必须
     *     @param  {String}  params.Bucket                                      Bucket名称，必须
     *     @param  {String}  params.Region                                      地域名称，必须
     *     @param  {String}  params.Id                                          清单任务的名称，必须
     *     @param  {Object}  params.InventoryConfiguration                      包含清单的配置参数，必须
     * @param  {Function}  callback                                             回调函数，必须
     * @return  {Object}  err                                                   请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data                                                  返回数据
     */
    function putBucketInventory(params, callback) {
      var InventoryConfiguration = util.clone(params['InventoryConfiguration']);
      if (InventoryConfiguration.OptionalFields) {
        var Field = InventoryConfiguration.OptionalFields || [];
        InventoryConfiguration.OptionalFields = {
          Field: Field
        };
      }
      if (InventoryConfiguration.Destination && InventoryConfiguration.Destination.COSBucketDestination && InventoryConfiguration.Destination.COSBucketDestination.Encryption) {
        var Encryption = InventoryConfiguration.Destination.COSBucketDestination.Encryption;
        if (Object.keys(Encryption).indexOf('SSECOS') > -1) {
          Encryption['SSE-COS'] = Encryption['SSECOS'];
          delete Encryption['SSECOS'];
        }
      }
      var xml = util.json2xml({
        InventoryConfiguration: InventoryConfiguration
      });
      var headers = params.Headers;
      headers['Content-Type'] = 'application/xml';
      headers['Content-MD5'] = util.binaryBase64(util.md5(xml));
      submitRequest.call(this, {
        Action: 'name/cos:PutBucketInventory',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        body: xml,
        action: 'inventory',
        qs: {
          id: params['Id']
        },
        headers: headers,
        tracker: params.tracker
      }, function (err, data) {
        if (err && err.statusCode === 204) {
          return callback(null, {
            statusCode: err.statusCode
          });
        } else if (err) {
          return callback(err);
        }
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 获取 Bucket 的清单任务信息
     * @param  {Object}  params             参数对象，必须
     *     @param  {String}  params.Bucket  Bucket名称，必须
     *     @param  {String}  params.Region  地域名称，必须
     *     @param  {String}  params.Id      清单任务的名称，必须
     * @param  {Function}  callback         回调函数，必须
     * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data              返回数据
     */
    function getBucketInventory(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:GetBucketInventory',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'inventory',
        qs: {
          id: params['Id']
        },
        tracker: params.tracker
      }, function (err, data) {
        if (err) return callback(err);
        var InventoryConfiguration = data['InventoryConfiguration'];
        if (InventoryConfiguration && InventoryConfiguration.OptionalFields && InventoryConfiguration.OptionalFields.Field) {
          var Field = InventoryConfiguration.OptionalFields.Field;
          if (!util.isArray(Field)) {
            Field = [Field];
          }
          InventoryConfiguration.OptionalFields = Field;
        }
        if (InventoryConfiguration.Destination && InventoryConfiguration.Destination.COSBucketDestination && InventoryConfiguration.Destination.COSBucketDestination.Encryption) {
          var Encryption = InventoryConfiguration.Destination.COSBucketDestination.Encryption;
          if (Object.keys(Encryption).indexOf('SSE-COS') > -1) {
            Encryption['SSECOS'] = Encryption['SSE-COS'];
            delete Encryption['SSE-COS'];
          }
        }
        callback(null, {
          InventoryConfiguration: InventoryConfiguration,
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 获取 Bucket 的清单任务信息
     * @param  {Object}  params                             参数对象，必须
     *     @param  {String}  params.Bucket                  Bucket名称，必须
     *     @param  {String}  params.Region                  地域名称，必须
     *     @param  {String}  params.ContinuationToken       当 COS 响应体中 IsTruncated 为 true，且 NextContinuationToken 节点中存在参数值时，您可以将这个参数作为 continuation-token 参数值，以获取下一页的清单任务信息，非必须
     * @param  {Function}  callback                         回调函数，必须
     * @return  {Object}  err                               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data                              返回数据
     */
    function listBucketInventory(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:ListBucketInventory',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'inventory',
        qs: {
          'continuation-token': params['ContinuationToken']
        },
        tracker: params.tracker
      }, function (err, data) {
        if (err) return callback(err);
        var ListInventoryConfigurationResult = data['ListInventoryConfigurationResult'];
        var InventoryConfigurations = ListInventoryConfigurationResult.InventoryConfiguration || [];
        InventoryConfigurations = util.isArray(InventoryConfigurations) ? InventoryConfigurations : [InventoryConfigurations];
        delete ListInventoryConfigurationResult['InventoryConfiguration'];
        util.each(InventoryConfigurations, function (InventoryConfiguration) {
          if (InventoryConfiguration && InventoryConfiguration.OptionalFields && InventoryConfiguration.OptionalFields.Field) {
            var Field = InventoryConfiguration.OptionalFields.Field;
            if (!util.isArray(Field)) {
              Field = [Field];
            }
            InventoryConfiguration.OptionalFields = Field;
          }
          if (InventoryConfiguration.Destination && InventoryConfiguration.Destination.COSBucketDestination && InventoryConfiguration.Destination.COSBucketDestination.Encryption) {
            var Encryption = InventoryConfiguration.Destination.COSBucketDestination.Encryption;
            if (Object.keys(Encryption).indexOf('SSE-COS') > -1) {
              Encryption['SSECOS'] = Encryption['SSE-COS'];
              delete Encryption['SSE-COS'];
            }
          }
        });
        ListInventoryConfigurationResult.InventoryConfigurations = InventoryConfigurations;
        util.extend(ListInventoryConfigurationResult, {
          statusCode: data.statusCode,
          headers: data.headers
        });
        callback(null, ListInventoryConfigurationResult);
      });
    }

    /**
     * 删除 Bucket 的清单任务
     * @param  {Object}  params             参数对象，必须
     *     @param  {String}  params.Bucket  Bucket名称，必须
     *     @param  {String}  params.Region  地域名称，必须
     *     @param  {String}  params.Id      清单任务的名称，必须
     * @param  {Function}  callback         回调函数，必须
     * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data              返回数据
     */
    function deleteBucketInventory(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:DeleteBucketInventory',
        method: 'DELETE',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'inventory',
        qs: {
          id: params['Id']
        },
        tracker: params.tracker
      }, function (err, data) {
        if (err && err.statusCode === 204) {
          return callback(null, {
            statusCode: err.statusCode
          });
        } else if (err) {
          return callback(err);
        }
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /* 全球加速 */
    function putBucketAccelerate(params, callback) {
      if (!params['AccelerateConfiguration']) {
        callback({
          error: 'missing param AccelerateConfiguration'
        });
        return;
      }
      var configuration = {
        AccelerateConfiguration: params.AccelerateConfiguration || {}
      };
      var xml = util.json2xml(configuration);
      var headers = {};
      headers['Content-Type'] = 'application/xml';
      headers['Content-MD5'] = util.binaryBase64(util.md5(xml));
      submitRequest.call(this, {
        Interface: 'putBucketAccelerate',
        Action: 'name/cos:PutBucketAccelerate',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        body: xml,
        action: 'accelerate',
        headers: headers,
        tracker: params.tracker
      }, function (err, data) {
        if (err) return callback(err);
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }
    function getBucketAccelerate(params, callback) {
      submitRequest.call(this, {
        Interface: 'getBucketAccelerate',
        Action: 'name/cos:GetBucketAccelerate',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        action: 'accelerate',
        tracker: params.tracker
      }, function (err, data) {
        if (!err) {
          !data.AccelerateConfiguration && (data.AccelerateConfiguration = {});
        }
        callback(err, data);
      });
    }

    // Object 相关

    /**
     * 取回对应Object的元数据，Head的权限与Get的权限一致
     * @param  {Object}  params                         参数对象，必须
     *     @param  {String}  params.Bucket              Bucket名称，必须
     *     @param  {String}  params.Region              地域名称，必须
     *     @param  {String}  params.Key                 文件名称，必须
     *     @param  {String}  params.IfModifiedSince     当Object在指定时间后被修改，则返回对应Object元信息，否则返回304，非必须
     * @param  {Function}  callback                     回调函数，必须
     * @return  {Object}  err                           请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data                          为指定 object 的元数据，如果设置了 IfModifiedSince ，且文件未修改，则返回一个对象，NotModified 属性为 true
     *     @return  {Boolean}  data.NotModified         是否在 IfModifiedSince 时间点之后未修改该 object，则为 true
     */
    function headObject(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:HeadObject',
        method: 'HEAD',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        VersionId: params.VersionId,
        headers: params.Headers,
        tracker: params.tracker
      }, function (err, data) {
        if (err) {
          var statusCode = err.statusCode;
          if (params.Headers['If-Modified-Since'] && statusCode && statusCode === 304) {
            return callback(null, {
              NotModified: true,
              statusCode: statusCode
            });
          }
          return callback(err);
        }
        data.ETag = util.attr(data.headers, 'etag', '');
        callback(null, data);
      });
    }
    function listObjectVersions(params, callback) {
      var reqParams = {};
      reqParams['prefix'] = params['Prefix'] || '';
      reqParams['delimiter'] = params['Delimiter'];
      reqParams['key-marker'] = params['KeyMarker'];
      reqParams['version-id-marker'] = params['VersionIdMarker'];
      reqParams['max-keys'] = params['MaxKeys'];
      reqParams['encoding-type'] = params['EncodingType'];
      submitRequest.call(this, {
        Action: 'name/cos:GetBucketObjectVersions',
        ResourceKey: reqParams['prefix'],
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        qs: reqParams,
        action: 'versions',
        tracker: params.tracker
      }, function (err, data) {
        if (err) return callback(err);
        var ListVersionsResult = data.ListVersionsResult || {};
        var DeleteMarkers = ListVersionsResult.DeleteMarker || [];
        DeleteMarkers = util.isArray(DeleteMarkers) ? DeleteMarkers : [DeleteMarkers];
        var Versions = ListVersionsResult.Version || [];
        Versions = util.isArray(Versions) ? Versions : [Versions];
        var result = util.clone(ListVersionsResult);
        delete result.DeleteMarker;
        delete result.Version;
        util.extend(result, {
          DeleteMarkers: DeleteMarkers,
          Versions: Versions,
          statusCode: data.statusCode,
          headers: data.headers
        });
        callback(null, result);
      });
    }

    /**
     * 下载 object
     * @param  {Object}  params                                 参数对象，必须
     *     @param  {String}  params.Bucket                      Bucket名称，必须
     *     @param  {String}  params.Region                      地域名称，必须
     *     @param  {String}  params.Key                         文件名称，必须
     *     @param  {WriteStream}  params.Output                 文件写入流，非必须
     *     @param  {String}  params.IfModifiedSince             当Object在指定时间后被修改，则返回对应Object元信息，否则返回304，非必须
     *     @param  {String}  params.IfUnmodifiedSince           如果文件修改时间早于或等于指定时间，才返回文件内容。否则返回 412 (precondition failed)，非必须
     *     @param  {String}  params.IfMatch                     当 ETag 与指定的内容一致，才返回文件。否则返回 412 (precondition failed)，非必须
     *     @param  {String}  params.IfNoneMatch                 当 ETag 与指定的内容不一致，才返回文件。否则返回304 (not modified)，非必须
     *     @param  {String}  params.ResponseContentType         设置返回头部中的 Content-Type 参数，非必须
     *     @param  {String}  params.ResponseContentLanguage     设置返回头部中的 Content-Language 参数，非必须
     *     @param  {String}  params.ResponseExpires             设置返回头部中的 Content-Expires 参数，非必须
     *     @param  {String}  params.ResponseCacheControl        设置返回头部中的 Cache-Control 参数，非必须
     *     @param  {String}  params.ResponseContentDisposition  设置返回头部中的 Content-Disposition 参数，非必须
     *     @param  {String}  params.ResponseContentEncoding     设置返回头部中的 Content-Encoding 参数，非必须
     * @param  {Function}  callback                             回调函数，必须
     * @param  {Object}  err                                    请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @param  {Object}  data                                   为对应的 object 数据，包括 body 和 headers
     */
    function getObject(params, callback) {
      if (this.options.ObjectKeySimplifyCheck) {
        // getObject 的 Key 需要校验，避免调用成 getBucket
        var formatKey = util.simplifyPath(params.Key);
        if (formatKey === '/') {
          callback(util.error(new Error('The Getobject Key is illegal')));
          return;
        }
      }
      var reqParams = params.Query || {};
      var reqParamsStr = params.QueryString || '';
      var tracker = params.tracker;
      tracker && tracker.setParams({
        signStartTime: new Date().getTime()
      });
      reqParams['response-content-type'] = params['ResponseContentType'];
      reqParams['response-content-language'] = params['ResponseContentLanguage'];
      reqParams['response-expires'] = params['ResponseExpires'];
      reqParams['response-cache-control'] = params['ResponseCacheControl'];
      reqParams['response-content-disposition'] = params['ResponseContentDisposition'];
      reqParams['response-content-encoding'] = params['ResponseContentEncoding'];

      // 如果用户自己传入了 output
      submitRequest.call(this, {
        Action: 'name/cos:GetObject',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        VersionId: params.VersionId,
        headers: params.Headers,
        qs: reqParams,
        qsStr: reqParamsStr,
        rawBody: true,
        dataType: params.DataType,
        tracker: tracker
      }, function (err, data) {
        if (err) {
          var statusCode = err.statusCode;
          if (params.Headers['If-Modified-Since'] && statusCode && statusCode === 304) {
            return callback(null, {
              NotModified: true
            });
          }
          return callback(err);
        }
        callback(null, {
          Body: data.body,
          ETag: util.attr(data.headers, 'etag', ''),
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 上传 object
     * @param  {Object} params                                          参数对象，必须
     *     @param  {String}  params.Bucket                              Bucket名称，必须
     *     @param  {String}  params.Region                              地域名称，必须
     *     @param  {String}  params.Key                                 文件名称，必须
     *     @param  {String}  params.Body                                上传文件的内容，只支持字符串
     *     @param  {String}  params.CacheControl                        RFC 2616 中定义的缓存策略，将作为 Object 元数据保存，非必须
     *     @param  {String}  params.ContentDisposition                  RFC 2616 中定义的文件名称，将作为 Object 元数据保存，非必须
     *     @param  {String}  params.ContentEncoding                     RFC 2616 中定义的编码格式，将作为 Object 元数据保存，非必须
     *     @param  {String}  params.ContentLength                       RFC 2616 中定义的 HTTP 请求内容长度（字节），必须
     *     @param  {String}  params.ContentType                         RFC 2616 中定义的内容类型（MIME），将作为 Object 元数据保存，非必须
     *     @param  {String}  params.Expect                              当使用 Expect: 100-continue 时，在收到服务端确认后，才会发送请求内容，非必须
     *     @param  {String}  params.Expires                             RFC 2616 中定义的过期时间，将作为 Object 元数据保存，非必须
     *     @param  {String}  params.ContentSha1                         RFC 3174 中定义的 160-bit 内容 SHA-1 算法校验，非必须
     *     @param  {String}  params.ACL                                 允许用户自定义文件权限，有效值：private | public-read，非必须
     *     @param  {String}  params.GrantRead                           赋予被授权者读的权限，格式 x-cos-grant-read: uin=" ",uin=" "，非必须
     *     @param  {String}  params.GrantWrite                          赋予被授权者写的权限，格式 x-cos-grant-write: uin=" ",uin=" "，非必须
     *     @param  {String}  params.GrantFullControl                    赋予被授权者读写权限，格式 x-cos-grant-full-control: uin=" ",uin=" "，非必须
     *     @param  {String}  params.ServerSideEncryption               支持按照指定的加密算法进行服务端数据加密，格式 x-cos-server-side-encryption: "AES256"，非必须
     *     @param  {Function}  params.onProgress                        上传进度回调函数
     * @param  {Function}  callback                                     回调函数，必须
     * @return  {Object}  err                                           请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data                                          为对应的 object 数据
     *     @return  {String}  data.ETag                                 为对应上传文件的 ETag 值
     */
    function putObject(params, callback) {
      var self = this;
      var FileSize = params.ContentLength;
      var onProgress = util.throttleOnProgress.call(self, FileSize, params.onProgress);

      // 特殊处理 Cache-Control、Content-Type，避免代理更改这两个字段导致写入到 Object 属性里
      var headers = params.Headers;
      if (!headers['Cache-Control'] && !headers['cache-control']) headers['Cache-Control'] = '';
      if (!headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = mime.getType(params.Key) || 'application/octet-stream';
      }
      var needCalcMd5 = params.UploadAddMetaMd5 || self.options.UploadAddMetaMd5 || self.options.UploadCheckContentMd5;
      var tracker = params.tracker;
      needCalcMd5 && tracker && tracker.setParams({
        md5StartTime: new Date().getTime()
      });
      util.getBodyMd5(needCalcMd5, params.Body, function (md5) {
        if (md5) {
          tracker && tracker.setParams({
            md5EndTime: new Date().getTime()
          });
          if (self.options.UploadCheckContentMd5) headers['Content-MD5'] = util.binaryBase64(md5);
          if (params.UploadAddMetaMd5 || self.options.UploadAddMetaMd5) headers['x-cos-meta-md5'] = md5;
        }
        if (params.ContentLength !== undefined) headers['Content-Length'] = params.ContentLength;
        onProgress(null, true); // 任务状态开始 uploading
        submitRequest.call(self, {
          Action: 'name/cos:PutObject',
          TaskId: params.TaskId,
          method: 'PUT',
          Bucket: params.Bucket,
          Region: params.Region,
          Key: params.Key,
          headers: params.Headers,
          qs: params.Query,
          body: params.Body,
          onProgress: onProgress,
          tracker: tracker
        }, function (err, data) {
          if (err) {
            onProgress(null, true);
            return callback(err);
          }
          onProgress({
            loaded: FileSize,
            total: FileSize
          }, true);
          var url = getUrl({
            ForcePathStyle: self.options.ForcePathStyle,
            protocol: self.options.Protocol,
            domain: self.options.Domain,
            bucket: params.Bucket,
            region: !self.options.UseAccelerate ? params.Region : 'accelerate',
            object: params.Key
          });
          url = url.substr(url.indexOf('://') + 3);
          data.Location = url;
          data.ETag = util.attr(data.headers, 'etag', '');
          callback(null, data);
        });
      });
    }

    /**
     * 上传 object
     * @param  {Object} params                                          参数对象，必须
     *     @param  {String}  params.Bucket                              Bucket名称，必须
     *     @param  {String}  params.Region                              地域名称，必须
     *     @param  {String}  params.Key                                 文件名称，必须
     *     @param  {FilePath}  params.FilePath                          要上传的文件路径
     *     @param  {Function}  params.onProgress                        上传进度回调函数
     * @param  {Function}  callback                                     回调函数，必须
     * @return  {Object}  err                                           请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data                                          为对应的 object 数据
     *     @return  {String}  data.ETag                                 为对应上传文件的 ETag 值
     */
    function postObject(params, callback) {
      var self = this;
      var headers = {};
      var filePath = params.FilePath;
      if (!filePath) {
        callback({
          error: 'missing param FilePath'
        });
        return;
      }
      headers['Cache-Control'] = params['CacheControl'];
      headers['Content-Disposition'] = params['ContentDisposition'];
      headers['Content-Encoding'] = params['ContentEncoding'];
      headers['Content-MD5'] = params['ContentMD5'];
      headers['Content-Length'] = params['ContentLength'];
      headers['Content-Type'] = params['ContentType'];
      headers['Expect'] = params['Expect'];
      headers['Expires'] = params['Expires'];
      headers['x-cos-acl'] = params['ACL'];
      headers['x-cos-grant-read'] = params['GrantRead'];
      headers['x-cos-grant-write'] = params['GrantWrite'];
      headers['x-cos-grant-full-control'] = params['GrantFullControl'];
      headers['x-cos-storage-class'] = params['StorageClass'];
      headers['x-cos-mime-limit'] = params['MimeLimit'];
      headers['x-cos-traffic-limit'] = params['TrafficLimit'];
      headers['x-cos-forbid-overwrite'] = params['ForbidOverwrite'];
      // SSE-C
      headers['x-cos-server-side-encryption-customer-algorithm'] = params['SSECustomerAlgorithm'];
      headers['x-cos-server-side-encryption-customer-key'] = params['SSECustomerKey'];
      headers['x-cos-server-side-encryption-customer-key-MD5'] = params['SSECustomerKeyMD5'];
      // SSE-COS、SSE-KMS
      headers['x-cos-server-side-encryption'] = params['ServerSideEncryption'];
      headers['x-cos-server-side-encryption-cos-kms-key-id'] = params['SSEKMSKeyId'];
      headers['x-cos-server-side-encryption-context'] = params['SSEContext'];

      // 删除 Content-Length 避免签名错误
      delete headers['Content-Length'];
      delete headers['content-length'];
      for (var key in params) {
        if (key.indexOf('x-cos-meta-') > -1) {
          headers[key] = params[key];
        }
      }
      var onProgress = util.throttleOnProgress.call(self, headers['Content-Length'], params.onProgress);
      submitRequest.call(this, {
        Action: 'name/cos:PostObject',
        method: 'POST',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        headers: headers,
        qs: params.Query,
        filePath: filePath,
        TaskId: params.TaskId,
        onProgress: onProgress,
        tracker: params.tracker
      }, function (err, data) {
        onProgress(null, true);
        if (err) return callback(err);
        if (data && data.headers) {
          var headers = data.headers;
          var ETag = headers.etag || headers.Etag || headers.ETag || '';
          var filename = filePath.substr(filePath.lastIndexOf('/') + 1);
          var url = getUrl({
            ForcePathStyle: self.options.ForcePathStyle,
            protocol: self.options.Protocol,
            domain: self.options.Domain,
            bucket: params.Bucket,
            region: params.Region,
            object: params.Key.replace(/\$\{filename\}/g, filename),
            isLocation: true
          });
          return callback(null, {
            Location: url,
            statusCode: data.statusCode,
            headers: headers,
            ETag: ETag
          });
        }
        callback(null, data);
      });
    }

    /**
     * 删除 object
     * @param  {Object}  params                     参数对象，必须
     *     @param  {String}  params.Bucket          Bucket名称，必须
     *     @param  {String}  params.Region          地域名称，必须
     *     @param  {String}  params.Key             object名称，必须
     * @param  {Function}  callback                 回调函数，必须
     * @param  {Object}  err                        请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @param  {Object}  data                       删除操作成功之后返回的数据
     */
    function deleteObject(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:DeleteObject',
        method: 'DELETE',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        headers: params.Headers,
        VersionId: params.VersionId,
        tracker: params.tracker
      }, function (err, data) {
        if (err) {
          var statusCode = err.statusCode;
          if (statusCode && statusCode === 204) {
            return callback(null, {
              statusCode: statusCode
            });
          } else if (statusCode && statusCode === 404) {
            return callback(null, {
              BucketNotFound: true,
              statusCode: statusCode
            });
          } else {
            return callback(err);
          }
        }
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 获取 object 的 权限列表
     * @param  {Object}  params                         参数对象，必须
     *     @param  {String}  params.Bucket              Bucket名称，必须
     *     @param  {String}  params.Region              地域名称，必须
     *     @param  {String}  params.Key                 object名称，必须
     * @param  {Function}  callback                     回调函数，必须
     * @return  {Object}  err                           请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data                          返回的数据
     *     @return  {Object}  data.AccessControlPolicy  权限列表
     */
    function getObjectAcl(params, callback) {
      var reqParams = {};
      if (params.VersionId) {
        reqParams.versionId = params.VersionId;
      }
      submitRequest.call(this, {
        Action: 'name/cos:GetObjectACL',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        headers: params.Headers,
        qs: reqParams,
        action: 'acl',
        tracker: params.tracker
      }, function (err, data) {
        if (err) return callback(err);
        var AccessControlPolicy = data.AccessControlPolicy || {};
        var Owner = AccessControlPolicy.Owner || {};
        var Grant = AccessControlPolicy.AccessControlList && AccessControlPolicy.AccessControlList.Grant || [];
        Grant = util.isArray(Grant) ? Grant : [Grant];
        var result = decodeAcl(AccessControlPolicy);
        if (data.headers && data.headers['x-cos-acl']) {
          result.ACL = data.headers['x-cos-acl'];
        }
        result = util.extend(result, {
          Owner: Owner,
          Grants: Grant,
          statusCode: data.statusCode,
          headers: data.headers
        });
        callback(null, result);
      });
    }

    /**
     * 设置 object 的 权限列表
     * @param  {Object}  params             参数对象，必须
     *     @param  {String}  params.Bucket  Bucket名称，必须
     *     @param  {String}  params.Region  地域名称，必须
     *     @param  {String}  params.Key     object名称，必须
     * @param  {Function}  callback         回调函数，必须
     * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data              返回的数据
     */
    function putObjectAcl(params, callback) {
      var headers = params.Headers;
      var xml = '';
      if (params['AccessControlPolicy']) {
        var AccessControlPolicy = util.clone(params['AccessControlPolicy'] || {});
        var Grants = AccessControlPolicy.Grants || AccessControlPolicy.Grant;
        Grants = util.isArray(Grants) ? Grants : [Grants];
        delete AccessControlPolicy.Grant;
        delete AccessControlPolicy.Grants;
        AccessControlPolicy.AccessControlList = {
          Grant: Grants
        };
        xml = util.json2xml({
          AccessControlPolicy: AccessControlPolicy
        });
        headers['Content-Type'] = 'application/xml';
        headers['Content-MD5'] = util.binaryBase64(util.md5(xml));
      }

      // Grant Header 去重
      util.each(headers, function (val, key) {
        if (key.indexOf('x-cos-grant-') === 0) {
          headers[key] = uniqGrant(headers[key]);
        }
      });
      submitRequest.call(this, {
        Action: 'name/cos:PutObjectACL',
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        action: 'acl',
        headers: headers,
        body: xml,
        tracker: params.tracker
      }, function (err, data) {
        if (err) return callback(err);
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * Options Object请求实现跨域访问的预请求。即发出一个 OPTIONS 请求给服务器以确认是否可以进行跨域操作。
     * @param  {Object}  params             参数对象，必须
     *     @param  {String}  params.Bucket  Bucket名称，必须
     *     @param  {String}  params.Region  地域名称，必须
     *     @param  {String}  params.Key     object名称，必须
     * @param  {Function}  callback         回调函数，必须
     * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data              返回的数据
     */
    function optionsObject(params, callback) {
      var headers = params.Headers;
      headers['Origin'] = params['Origin'];
      headers['Access-Control-Request-Method'] = params['AccessControlRequestMethod'];
      headers['Access-Control-Request-Headers'] = params['AccessControlRequestHeaders'];
      submitRequest.call(this, {
        Action: 'name/cos:OptionsObject',
        method: 'OPTIONS',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        headers: headers,
        tracker: params.tracker
      }, function (err, data) {
        if (err) {
          if (err.statusCode && err.statusCode === 403) {
            return callback(null, {
              OptionsForbidden: true,
              statusCode: err.statusCode
            });
          }
          return callback(err);
        }
        var headers = data.headers || {};
        callback(null, {
          AccessControlAllowOrigin: headers['access-control-allow-origin'],
          AccessControlAllowMethods: headers['access-control-allow-methods'],
          AccessControlAllowHeaders: headers['access-control-allow-headers'],
          AccessControlExposeHeaders: headers['access-control-expose-headers'],
          AccessControlMaxAge: headers['access-control-max-age'],
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * @param  {Object}                                     参数列表
     *     @param  {String}  Bucket                         Bucket 名称
     *     @param  {String}  Region                         地域名称
     *     @param  {String}  Key                            文件名称
     *     @param  {String}  CopySource                     源文件URL绝对路径，可以通过versionid子资源指定历史版本
     *     @param  {String}  ACL                            允许用户自定义文件权限。有效值：private，public-read默认值：private。
     *     @param  {String}  GrantRead                      赋予被授权者读的权限，格式 x-cos-grant-read: uin=" ",uin=" "，当需要给子账户授权时，uin="RootAcountID/SubAccountID"，当需要给根账户授权时，uin="RootAcountID"。
     *     @param  {String}  GrantWrite                     赋予被授权者写的权限，格式 x-cos-grant-write: uin=" ",uin=" "，当需要给子账户授权时，uin="RootAcountID/SubAccountID"，当需要给根账户授权时，uin="RootAcountID"。
     *     @param  {String}  GrantFullControl               赋予被授权者读写权限，格式 x-cos-grant-full-control: uin=" ",uin=" "，当需要给子账户授权时，uin="RootAcountID/SubAccountID"，当需要给根账户授权时，uin="RootAcountID"。
     *     @param  {String}  MetadataDirective              是否拷贝元数据，枚举值：Copy, Replaced，默认值Copy。假如标记为Copy，忽略Header中的用户元数据信息直接复制；假如标记为Replaced，按Header信息修改元数据。当目标路径和原路径一致，即用户试图修改元数据时，必须为Replaced
     *     @param  {String}  CopySourceIfModifiedSince      当Object在指定时间后被修改，则执行操作，否则返回412。可与x-cos-copy-source-If-None-Match一起使用，与其他条件联合使用返回冲突。
     *     @param  {String}  CopySourceIfUnmodifiedSince    当Object在指定时间后未被修改，则执行操作，否则返回412。可与x-cos-copy-source-If-Match一起使用，与其他条件联合使用返回冲突。
     *     @param  {String}  CopySourceIfMatch              当Object的ETag和给定一致时，则执行操作，否则返回412。可与x-cos-copy-source-If-Unmodified-Since一起使用，与其他条件联合使用返回冲突。
     *     @param  {String}  CopySourceIfNoneMatch          当Object的ETag和给定不一致时，则执行操作，否则返回412。可与x-cos-copy-source-If-Modified-Since一起使用，与其他条件联合使用返回冲突。
     *     @param  {String}  StorageClass                   存储级别，枚举值：存储级别，枚举值：Standard, Standard_IA，Archive；默认值：Standard
     *     @param  {String}  CacheControl                   指定所有缓存机制在整个请求/响应链中必须服从的指令。
     *     @param  {String}  ContentDisposition             MIME 协议的扩展，MIME 协议指示 MIME 用户代理如何显示附加的文件
     *     @param  {String}  ContentEncoding                HTTP 中用来对「采用何种编码格式传输正文」进行协定的一对头部字段
     *     @param  {String}  ContentLength                  设置响应消息的实体内容的大小，单位为字节
     *     @param  {String}  ContentType                    RFC 2616 中定义的 HTTP 请求内容类型（MIME），例如text/plain
     *     @param  {String}  Expect                         请求的特定的服务器行为
     *     @param  {String}  Expires                        响应过期的日期和时间
     *     @param  {String}  params.ServerSideEncryption   支持按照指定的加密算法进行服务端数据加密，格式 x-cos-server-side-encryption: "AES256"，非必须
     *     @param  {String}  ContentLanguage                指定内容语言
     *     @param  {String}  x-cos-meta-*                   允许用户自定义的头部信息，将作为 Object 元数据返回。大小限制2K。
     */
    function putObjectCopy(params, callback) {
      // 特殊处理 Cache-Control
      var headers = params.Headers;
      if (!headers['Cache-Control'] && !!headers['cache-control']) headers['Cache-Control'] = '';
      var CopySource = params.CopySource || '';
      var m = util.getSourceParams.call(this, CopySource);
      if (!m) {
        callback({
          error: 'CopySource format error'
        });
        return;
      }
      var SourceBucket = m.Bucket;
      var SourceRegion = m.Region;
      var SourceKey = decodeURIComponent(m.Key);
      submitRequest.call(this, {
        Scope: [{
          action: 'name/cos:GetObject',
          bucket: SourceBucket,
          region: SourceRegion,
          prefix: SourceKey
        }, {
          action: 'name/cos:PutObject',
          bucket: params.Bucket,
          region: params.Region,
          prefix: params.Key
        }],
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        VersionId: params.VersionId,
        headers: params.Headers,
        tracker: params.tracker
      }, function (err, data) {
        if (err) return callback(err);
        var result = util.clone(data.CopyObjectResult || {});
        util.extend(result, {
          statusCode: data.statusCode,
          headers: data.headers
        });
        callback(null, result);
      });
    }
    function uploadPartCopy(params, callback) {
      var CopySource = params.CopySource || '';
      var m = util.getSourceParams.call(this, CopySource);
      if (!m) {
        callback({
          error: 'CopySource format error'
        });
        return;
      }
      var SourceBucket = m.Bucket;
      var SourceRegion = m.Region;
      var SourceKey = decodeURIComponent(m.Key);
      submitRequest.call(this, {
        Scope: [{
          action: 'name/cos:GetObject',
          bucket: SourceBucket,
          region: SourceRegion,
          prefix: SourceKey
        }, {
          action: 'name/cos:PutObject',
          bucket: params.Bucket,
          region: params.Region,
          prefix: params.Key
        }],
        method: 'PUT',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        VersionId: params.VersionId,
        qs: {
          partNumber: params['PartNumber'],
          uploadId: params['UploadId']
        },
        headers: params.Headers,
        tracker: params.tracker
      }, function (err, data) {
        if (err) return callback(err);
        var result = util.clone(data.CopyPartResult || {});
        util.extend(result, {
          statusCode: data.statusCode,
          headers: data.headers
        });
        callback(null, result);
      });
    }
    function deleteMultipleObject(params, callback) {
      var Objects = params.Objects || [];
      var Quiet = params.Quiet;
      Objects = util.isArray(Objects) ? Objects : [Objects];
      var xml = util.json2xml({
        Delete: {
          Object: Objects,
          Quiet: Quiet || false
        }
      });
      var headers = params.Headers;
      headers['Content-Type'] = 'application/xml';
      headers['Content-MD5'] = util.binaryBase64(util.md5(xml));
      var Scope = util.map(Objects, function (v) {
        return {
          action: 'name/cos:DeleteObject',
          bucket: params.Bucket,
          region: params.Region,
          prefix: v.Key
        };
      });
      submitRequest.call(this, {
        Scope: Scope,
        method: 'POST',
        Bucket: params.Bucket,
        Region: params.Region,
        body: xml,
        action: 'delete',
        headers: headers,
        tracker: params.tracker
      }, function (err, data) {
        if (err) return callback(err);
        var DeleteResult = data.DeleteResult || {};
        var Deleted = DeleteResult.Deleted || [];
        var Errors = DeleteResult.Error || [];
        Deleted = util.isArray(Deleted) ? Deleted : [Deleted];
        Errors = util.isArray(Errors) ? Errors : [Errors];
        var result = util.clone(DeleteResult);
        util.extend(result, {
          Error: Errors,
          Deleted: Deleted,
          statusCode: data.statusCode,
          headers: data.headers
        });
        callback(null, result);
      });
    }
    function restoreObject(params, callback) {
      var headers = params.Headers;
      if (!params['RestoreRequest']) {
        callback({
          error: 'missing param RestoreRequest'
        });
        return;
      }
      var RestoreRequest = params.RestoreRequest || {};
      var xml = util.json2xml({
        RestoreRequest: RestoreRequest
      });
      headers['Content-Type'] = 'application/xml';
      headers['Content-MD5'] = util.binaryBase64(util.md5(xml));
      submitRequest.call(this, {
        Action: 'name/cos:RestoreObject',
        method: 'POST',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        VersionId: params.VersionId,
        body: xml,
        action: 'restore',
        headers: headers,
        tracker: params.tracker
      }, function (err, data) {
        callback(err, data);
      });
    }

    /**
     * 设置 Object 的标签
     * @param  {Object}  params             参数对象，必须
     *     @param  {String}  params.Bucket  Object名称，必须
     *     @param  {String}  params.Region  地域名称，必须
     *     @param  {Array}   params.TagSet  标签设置，必须
     * @param  {Function}  callback         回调函数，必须
     * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/42998
     * @return  {Object}  data              返回数据
     */
    function putObjectTagging(params, callback) {
      var Tagging = params['Tagging'] || {};
      var Tags = Tagging.TagSet || Tagging.Tags || params['Tags'] || [];
      Tags = util.clone(util.isArray(Tags) ? Tags : [Tags]);
      var xml = util.json2xml({
        Tagging: {
          TagSet: {
            Tag: Tags
          }
        }
      });
      var headers = params.Headers;
      headers['Content-Type'] = 'application/xml';
      headers['Content-MD5'] = util.binaryBase64(util.md5(xml));
      submitRequest.call(this, {
        Interface: 'putObjectTagging',
        Action: 'name/cos:PutObjectTagging',
        method: 'PUT',
        Bucket: params.Bucket,
        Key: params.Key,
        Region: params.Region,
        body: xml,
        action: 'tagging',
        headers: headers,
        VersionId: params.VersionId,
        tracker: params.tracker
      }, function (err, data) {
        if (err && err.statusCode === 204) {
          return callback(null, {
            statusCode: err.statusCode
          });
        } else if (err) {
          return callback(err);
        }
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 获取 Object 的标签设置
     * @param  {Object}  params             参数对象，必须
     *     @param  {String}  params.Bucket  Bucket名称，必须
     *     @param  {String}  params.Region  地域名称，必须
     * @param  {Function}  callback         回调函数，必须
     * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/42998
     * @return  {Object}  data              返回数据
     */
    function getObjectTagging(params, callback) {
      submitRequest.call(this, {
        Interface: 'getObjectTagging',
        Action: 'name/cos:GetObjectTagging',
        method: 'GET',
        Key: params.Key,
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        action: 'tagging',
        VersionId: params.VersionId,
        tracker: params.tracker
      }, function (err, data) {
        if (err) {
          if (err.statusCode === 404 && err.error && (err.error === 'Not Found' || err.error.Code === 'NoSuchTagSet')) {
            var result = {
              Tags: [],
              statusCode: err.statusCode
            };
            err.headers && (result.headers = err.headers);
            callback(null, result);
          } else {
            callback(err);
          }
          return;
        }
        var Tags = [];
        try {
          Tags = data.Tagging.TagSet.Tag || [];
        } catch (e) {}
        Tags = util.clone(util.isArray(Tags) ? Tags : [Tags]);
        callback(null, {
          Tags: Tags,
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 删除 Object 的 标签设置
     * @param  {Object}  params             参数对象，必须
     *     @param  {String}  params.Bucket  Object名称，必须
     *     @param  {String}  params.Region  地域名称，必须
     * @param  {Function}  callback         回调函数，必须
     * @return  {Object}  err               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/42998
     * @return  {Object}  data              返回的数据
     */
    function deleteObjectTagging(params, callback) {
      submitRequest.call(this, {
        Interface: 'deleteObjectTagging',
        Action: 'name/cos:DeleteObjectTagging',
        method: 'DELETE',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        headers: params.Headers,
        action: 'tagging',
        VersionId: params.VersionId,
        tracker: params.tracker
      }, function (err, data) {
        if (err && err.statusCode === 204) {
          return callback(null, {
            statusCode: err.statusCode
          });
        } else if (err) {
          return callback(err);
        }
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    // 分块上传

    /**
     * 初始化分块上传
     * @param  {Object}  params                                     参数对象，必须
     *     @param  {String}  params.Bucket                          Bucket名称，必须
     *     @param  {String}  params.Region                          地域名称，必须
     *     @param  {String}  params.Key                             object名称，必须
     *     @param  {String}  params.UploadId                        object名称，必须
     *     @param  {String}  params.CacheControl                    RFC 2616 中定义的缓存策略，将作为 Object 元数据保存，非必须
     *     @param  {String}  params.ContentDisposition              RFC 2616 中定义的文件名称，将作为 Object 元数据保存    ，非必须
     *     @param  {String}  params.ContentEncoding                 RFC 2616 中定义的编码格式，将作为 Object 元数据保存，非必须
     *     @param  {String}  params.ContentType                     RFC 2616 中定义的内容类型（MIME），将作为 Object 元数据保存，非必须
     *     @param  {String}  params.Expires                         RFC 2616 中定义的过期时间，将作为 Object 元数据保存，非必须
     *     @param  {String}  params.ACL                             允许用户自定义文件权限，非必须
     *     @param  {String}  params.GrantRead                       赋予被授权者读的权限 ，非必须
     *     @param  {String}  params.GrantWrite                      赋予被授权者写的权限 ，非必须
     *     @param  {String}  params.GrantFullControl                赋予被授权者读写权限 ，非必须
     *     @param  {String}  params.StorageClass                    设置Object的存储级别，枚举值：Standard，Standard_IA，Archive，非必须
     *     @param  {String}  params.ServerSideEncryption           支持按照指定的加密算法进行服务端数据加密，格式 x-cos-server-side-encryption: "AES256"，非必须
     * @param  {Function}  callback                                 回调函数，必须
     * @return  {Object}  err                                       请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data                                      返回的数据
     */
    function multipartInit(params, callback) {
      var self = this;
      var headers = params.Headers;
      var tracker = params.tracker;

      // 特殊处理 Cache-Control、Content-Type
      if (!headers['Cache-Control'] && !headers['cache-control']) headers['Cache-Control'] = '';
      if (!headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = mime.getType(params.Key) || 'application/octet-stream';
      }
      submitRequest.call(self, {
        Action: 'name/cos:InitiateMultipartUpload',
        method: 'POST',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        action: 'uploads',
        headers: params.Headers,
        qs: params.Query,
        tracker: tracker
      }, function (err, data) {
        if (err) {
          tracker && tracker.parent && tracker.parent.setParams({
            errorNode: 'multipartInit'
          });
          return callback(err);
        }
        data = util.clone(data || {});
        if (data && data.InitiateMultipartUploadResult) {
          return callback(null, util.extend(data.InitiateMultipartUploadResult, {
            statusCode: data.statusCode,
            headers: data.headers
          }));
        }
        callback(null, data);
      });
    }

    /**
     * 分块上传
     * @param  {Object}  params                                 参数对象，必须
     *     @param  {String}  params.Bucket                      Bucket名称，必须
     *     @param  {String}  params.Region                      地域名称，必须
     *     @param  {String}  params.Key                         object名称，必须
     *     @param  {String}  params.Body                        上传文件对象或字符串
     *     @param  {String} params.ContentLength                RFC 2616 中定义的 HTTP 请求内容长度（字节），非必须
     *     @param  {String} params.Expect                       当使用 Expect: 100-continue 时，在收到服务端确认后，才会发送请求内容，非必须
     *     @param  {String} params.ServerSideEncryption         支持按照指定的加密算法进行服务端数据加密，格式 x-cos-server-side-encryption: "AES256"，非必须
     *     @param  {String} params.ContentSha1                  RFC 3174 中定义的 160-bit 内容 SHA-1 算法校验值，非必须
     * @param  {Function}  callback                             回调函数，必须
     *     @return  {Object}  err                               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     *     @return  {Object}  data                              返回的数据
     *     @return  {Object}  data.ETag                         返回的文件分块 sha1 值
     */
    function multipartUpload(params, callback) {
      var self = this;
      util.getFileSize('multipartUpload', params, function () {
        var tracker = params.tracker;
        var needCalcMd5 = self.options.UploadCheckContentMd5;
        needCalcMd5 && tracker && tracker.setParams({
          md5StartTime: new Date().getTime()
        });
        util.getBodyMd5(needCalcMd5, params.Body, function (md5) {
          if (md5) {
            params.Headers['Content-MD5'] = util.binaryBase64(md5);
            needCalcMd5 && tracker && tracker.setParams({
              md5EndTime: new Date().getTime()
            });
          }
          tracker && tracker.setParams({
            partNumber: params.PartNumber
          });
          submitRequest.call(self, {
            Action: 'name/cos:UploadPart',
            TaskId: params.TaskId,
            method: 'PUT',
            Bucket: params.Bucket,
            Region: params.Region,
            Key: params.Key,
            qs: {
              partNumber: params['PartNumber'],
              uploadId: params['UploadId']
            },
            headers: params.Headers,
            onProgress: params.onProgress,
            body: params.Body || null,
            tracker: tracker
          }, function (err, data) {
            if (err) {
              tracker && tracker.parent && tracker.parent.setParams({
                errorNode: 'multipartUpload'
              });
              return callback(err);
            }
            callback(null, {
              ETag: util.attr(data.headers, 'etag', {}),
              statusCode: data.statusCode,
              headers: data.headers
            });
          });
        });
      });
    }

    /**
     * 完成分块上传
     * @param  {Object}  params                             参数对象，必须
     *     @param  {String}  params.Bucket                  Bucket名称，必须
     *     @param  {String}  params.Region                  地域名称，必须
     *     @param  {String}  params.Key                     object名称，必须
     *     @param  {Array}   params.Parts                   分块信息列表，必须
     *     @param  {String}  params.Parts[i].PartNumber     块编号，必须
     *     @param  {String}  params.Parts[i].ETag           分块的 sha1 校验值
     * @param  {Function}  callback                         回调函数，必须
     * @return  {Object}  err                               请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data                              返回的数据
     *     @return  {Object}  data.CompleteMultipartUpload  完成分块上传后的文件信息，包括Location, Bucket, Key 和 ETag
     */
    function multipartComplete(params, callback) {
      var self = this;
      var UploadId = params.UploadId;
      var Parts = params['Parts'];
      var tracker = params.tracker;
      for (var i = 0, len = Parts.length; i < len; i++) {
        if (Parts[i]['ETag'].indexOf('"') === 0) {
          continue;
        }
        Parts[i]['ETag'] = '"' + Parts[i]['ETag'] + '"';
      }
      var xml = util.json2xml({
        CompleteMultipartUpload: {
          Part: Parts
        }
      });
      var headers = params.Headers;
      headers['Content-Type'] = 'application/xml';
      headers['Content-MD5'] = util.binaryBase64(util.md5(xml));
      submitRequest.call(this, {
        Action: 'name/cos:CompleteMultipartUpload',
        method: 'POST',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        qs: {
          uploadId: UploadId
        },
        body: xml,
        headers: headers,
        tracker: tracker
      }, function (err, data) {
        if (err) {
          tracker && tracker.parent && tracker.parent.setParams({
            errorNode: 'multipartComplete'
          });
          return callback(err);
        }
        var url = getUrl({
          ForcePathStyle: self.options.ForcePathStyle,
          protocol: self.options.Protocol,
          domain: self.options.Domain,
          bucket: params.Bucket,
          region: !self.options.UseAccelerate ? params.Region : 'accelerate',
          object: params.Key,
          isLocation: true
        });
        var CompleteMultipartUploadResult = data.CompleteMultipartUploadResult || {};
        var result = util.extend(CompleteMultipartUploadResult, {
          Location: url,
          statusCode: data.statusCode,
          headers: data.headers
        });
        callback(null, result);
      });
    }

    /**
     * 分块上传任务列表查询
     * @param  {Object}  params                                 参数对象，必须
     *     @param  {String}  params.Bucket                      Bucket名称，必须
     *     @param  {String}  params.Region                      地域名称，必须
     *     @param  {String}  params.Delimiter                   定界符为一个符号，如果有Prefix，则将Prefix到delimiter之间的相同路径归为一类，定义为Common Prefix，然后列出所有Common Prefix。如果没有Prefix，则从路径起点开始，非必须
     *     @param  {String}  params.EncodingType                规定返回值的编码方式，非必须
     *     @param  {String}  params.Prefix                      前缀匹配，用来规定返回的文件前缀地址，非必须
     *     @param  {String}  params.MaxUploads                  单次返回最大的条目数量，默认1000，非必须
     *     @param  {String}  params.KeyMarker                   与upload-id-marker一起使用 </Br>当upload-id-marker未被指定时，ObjectName字母顺序大于key-marker的条目将被列出 </Br>当upload-id-marker被指定时，ObjectName字母顺序大于key-marker的条目被列出，ObjectName字母顺序等于key-marker同时UploadId大于upload-id-marker的条目将被列出，非必须
     *     @param  {String}  params.UploadIdMarker              与key-marker一起使用 </Br>当key-marker未被指定时，upload-id-marker将被忽略 </Br>当key-marker被指定时，ObjectName字母顺序大于key-marker的条目被列出，ObjectName字母顺序等于key-marker同时UploadId大于upload-id-marker的条目将被列出，非必须
     * @param  {Function}  callback                             回调函数，必须
     * @return  {Object}  err                                   请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data                                  返回的数据
     *     @return  {Object}  data.ListMultipartUploadsResult   分块上传任务信息
     */
    function multipartList(params, callback) {
      var reqParams = {};
      reqParams['delimiter'] = params['Delimiter'];
      reqParams['encoding-type'] = params['EncodingType'];
      reqParams['prefix'] = params['Prefix'] || '';
      reqParams['max-uploads'] = params['MaxUploads'];
      reqParams['key-marker'] = params['KeyMarker'];
      reqParams['upload-id-marker'] = params['UploadIdMarker'];
      reqParams = util.clearKey(reqParams);
      var tracker = params.tracker;
      tracker && tracker.setParams({
        signStartTime: new Date().getTime()
      });
      submitRequest.call(this, {
        Action: 'name/cos:ListMultipartUploads',
        ResourceKey: reqParams['prefix'],
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        headers: params.Headers,
        qs: reqParams,
        action: 'uploads',
        tracker: tracker
      }, function (err, data) {
        if (err) {
          tracker && tracker.parent && tracker.parent.setParams({
            errorNode: 'multipartList'
          });
          return callback(err);
        }
        if (data && data.ListMultipartUploadsResult) {
          var Upload = data.ListMultipartUploadsResult.Upload || [];
          var CommonPrefixes = data.ListMultipartUploadsResult.CommonPrefixes || [];
          CommonPrefixes = util.isArray(CommonPrefixes) ? CommonPrefixes : [CommonPrefixes];
          Upload = util.isArray(Upload) ? Upload : [Upload];
          data.ListMultipartUploadsResult.Upload = Upload;
          data.ListMultipartUploadsResult.CommonPrefixes = CommonPrefixes;
        }
        var result = util.clone(data.ListMultipartUploadsResult || {});
        util.extend(result, {
          statusCode: data.statusCode,
          headers: data.headers
        });
        callback(null, result);
      });
    }

    /**
     * 上传的分块列表查询
     * @param  {Object}  params                                 参数对象，必须
     *     @param  {String}  params.Bucket                      Bucket名称，必须
     *     @param  {String}  params.Region                      地域名称，必须
     *     @param  {String}  params.Key                         object名称，必须
     *     @param  {String}  params.UploadId                    标示本次分块上传的ID，必须
     *     @param  {String}  params.EncodingType                规定返回值的编码方式，非必须
     *     @param  {String}  params.MaxParts                    单次返回最大的条目数量，默认1000，非必须
     *     @param  {String}  params.PartNumberMarker            默认以UTF-8二进制顺序列出条目，所有列出条目从marker开始，非必须
     * @param  {Function}  callback                             回调函数，必须
     * @return  {Object}  err                                   请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     * @return  {Object}  data                                  返回的数据
     *     @return  {Object}  data.ListMultipartUploadsResult   分块信息
     */
    function multipartListPart(params, callback) {
      var reqParams = {};
      var tracker = params.tracker;
      reqParams['uploadId'] = params['UploadId'];
      reqParams['encoding-type'] = params['EncodingType'];
      reqParams['max-parts'] = params['MaxParts'];
      reqParams['part-number-marker'] = params['PartNumberMarker'];
      submitRequest.call(this, {
        Action: 'name/cos:ListParts',
        method: 'GET',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        headers: params.Headers,
        qs: reqParams,
        tracker: tracker
      }, function (err, data) {
        if (err) {
          tracker && tracker.parent && tracker.parent.setParams({
            errorNode: 'multipartListPart'
          });
          return callback(err);
        }
        var ListPartsResult = data.ListPartsResult || {};
        var Part = ListPartsResult.Part || [];
        Part = util.isArray(Part) ? Part : [Part];
        ListPartsResult.Part = Part;
        var result = util.clone(ListPartsResult);
        util.extend(result, {
          statusCode: data.statusCode,
          headers: data.headers
        });
        callback(null, result);
      });
    }

    /**
     * 抛弃分块上传
     * @param  {Object}  params                 参数对象，必须
     *     @param  {String}  params.Bucket      Bucket名称，必须
     *     @param  {String}  params.Region      地域名称，必须
     *     @param  {String}  params.Key         object名称，必须
     *     @param  {String}  params.UploadId    标示本次分块上传的ID，必须
     * @param  {Function}  callback             回调函数，必须
     *     @return  {Object}    err             请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     *     @return  {Object}    data            返回的数据
     */
    function multipartAbort(params, callback) {
      var reqParams = {};
      reqParams['uploadId'] = params['UploadId'];
      submitRequest.call(this, {
        Action: 'name/cos:AbortMultipartUpload',
        method: 'DELETE',
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        headers: params.Headers,
        qs: reqParams,
        tracker: params.tracker
      }, function (err, data) {
        if (err) return callback(err);
        callback(null, {
          statusCode: data.statusCode,
          headers: data.headers
        });
      });
    }

    /**
     * 追加上传
     * @param  {Object}  params                                         参数对象，必须
     *     @param  {String}  params.Bucket                              Bucket名称，必须
     *     @param  {String}  params.Region                              地域名称，必须
     *     @param  {String}  params.Key                                 object名称，必须
     *     @param  {String}  params.Body                上传文件的内容，只支持字符串
     *     @param  {Number}  params.Position                            追加操作的起始点，单位为字节，必须
     *     @param  {String}  params.CacheControl                        RFC 2616 中定义的缓存策略，将作为 Object 元数据保存，非必须
     *     @param  {String}  params.ContentDisposition                  RFC 2616 中定义的文件名称，将作为 Object 元数据保存，非必须
     *     @param  {String}  params.ContentEncoding                     RFC 2616 中定义的编码格式，将作为 Object 元数据保存，非必须
     *     @param  {String}  params.ContentLength                       RFC 2616 中定义的 HTTP 请求内容长度（字节），必须
     *     @param  {String}  params.ContentType                         RFC 2616 中定义的内容类型（MIME），将作为 Object 元数据保存，非必须
     *     @param  {String}  params.Expect                              当使用 Expect: 100-continue 时，在收到服务端确认后，才会发送请求内容，非必须
     *     @param  {String}  params.Expires                             RFC 2616 中定义的过期时间，将作为 Object 元数据保存，非必须
     *     @param  {String}  params.ACL                                 允许用户自定义文件权限，有效值：private | public-read，非必须
     *     @param  {String}  params.GrantRead                           赋予被授权者读取对象的权限，格式：id="[OwnerUin]"，可使用半角逗号（,）分隔多组被授权者，非必须
     *     @param  {String}  params.GrantReadAcp                        赋予被授权者读取对象的访问控制列表（ACL）的权限，格式：id="[OwnerUin]"，可使用半角逗号（,）分隔多组被授权者，非必须
     *     @param  {String}  params.GrantWriteAcp                       赋予被授权者写入对象的访问控制列表（ACL）的权限，格式：id="[OwnerUin]"，可使用半角逗号（,）分隔多组被授权者，非必须
     *     @param  {String}  params.GrantFullControl                    赋予被授权者操作对象的所有权限，格式：id="[OwnerUin]"，可使用半角逗号（,）分隔多组被授权者，非必须
     *     @param  {String}  params.StorageClass                        设置对象的存储级别，枚举值：STANDARD、STANDARD_IA、ARCHIVE，默认值：STANDARD，非必须
     *     @param  {String}  params.x-cos-meta-*                        允许用户自定义的头部信息，将作为对象的元数据保存。大小限制2KB，非必须
     *     @param  {String}  params.ContentSha1                         RFC 3174 中定义的 160-bit 内容 SHA-1 算法校验，非必须
     *     @param  {String}  params.ServerSideEncryption                支持按照指定的加密算法进行服务端数据加密，格式 x-cos-server-side-encryption: "AES256"，非必须
     * @param  {Function}  callback                                     回调函数，必须
     *     @return  {Object}    err                                     请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     *     @return  {Object}    data                                    返回的数据
     */
    function appendObject(params, callback) {
      submitRequest.call(this, {
        Action: 'name/cos:AppendObject',
        method: 'POST',
        Bucket: params.Bucket,
        Region: params.Region,
        action: 'append',
        Key: params.Key,
        body: params.Body,
        qs: {
          position: params.Position
        },
        headers: params.Headers,
        tracker: params.tracker
      }, function (err, data) {
        if (err) return callback(err);
        callback(null, data);
      });
    }

    /**
     * cos 内置请求
     * @param  {Object}  params                 参数对象，必须
     *     @param  {String}  params.Bucket      Bucket名称，必须
     *     @param  {String}  params.Region      地域名称，必须
     *     @param  {String}  params.Key         object名称，必须
     * @param  {Function}  callback             回调函数，必须
     *     @return  {Object}    err             请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     *     @return  {Object}    data            返回的数据
     */
    function request(params, callback) {
      submitRequest.call(this, {
        method: params.Method,
        Bucket: params.Bucket,
        Region: params.Region,
        Key: params.Key,
        action: params.Action,
        headers: params.Headers,
        qs: params.Query,
        body: params.Body,
        Url: params.Url,
        rawBody: params.RawBody,
        dataType: params.DataType,
        tracker: params.tracker
      }, function (err, data) {
        if (err) return callback(err);
        if (data && data.body) {
          data.Body = data.body;
          delete data.body;
        }
        callback(err, data);
      });
    }

    /**
     * 获取签名
     * @param  {Object}  params             参数对象，必须
     *     @param  {String}  params.Method  请求方法，必须
     *     @param  {String}  params.Key     object名称，必须
     *     @param  {String}  params.Expires 名超时时间，单位秒，可选
     * @return  {String}  data              返回签名字符串
     */
    function getAuth(params) {
      var self = this;
      return util.getAuth({
        SecretId: params.SecretId || this.options.SecretId || '',
        SecretKey: params.SecretKey || this.options.SecretKey || '',
        Bucket: params.Bucket,
        Region: params.Region,
        Method: params.Method,
        Key: params.Key,
        Query: params.Query,
        Headers: params.Headers,
        Expires: params.Expires,
        SystemClockOffset: self.options.SystemClockOffset
      });
    }

    /**
     * 获取文件下载链接
     * @param  {Object}  params                 参数对象，必须
     *     @param  {String}  params.Bucket      Bucket名称，必须
     *     @param  {String}  params.Region      地域名称，必须
     *     @param  {String}  params.Key         object名称，必须
     *     @param  {String}  params.Method      请求的方法，可选
     *     @param  {String}  params.Expires     签名超时时间，单位秒，可选
     * @param  {Function}  callback             回调函数，必须
     *     @return  {Object}    err             请求失败的错误，如果请求成功，则为空。https://cloud.tencent.com/document/product/436/7730
     *     @return  {Object}    data            返回的数据
     */
    function getObjectUrl(params, callback) {
      var self = this;
      var useAccelerate = params.UseAccelerate === undefined ? self.options.UseAccelerate : params.UseAccelerate;
      var url = getUrl({
        ForcePathStyle: self.options.ForcePathStyle,
        protocol: params.Protocol || self.options.Protocol,
        domain: params.Domain || self.options.Domain,
        bucket: params.Bucket,
        region: useAccelerate ? 'accelerate' : params.Region,
        object: params.Key
      });
      var queryParamsStr = '';
      if (params.Query) {
        queryParamsStr += util.obj2str(params.Query);
      }
      if (params.QueryString) {
        queryParamsStr += (queryParamsStr ? '&' : '') + params.QueryString;
      }
      var syncUrl = url;
      if (params.Sign !== undefined && !params.Sign) {
        queryParamsStr && (syncUrl += '?' + queryParamsStr);
        callback(null, {
          Url: syncUrl
        });
        return syncUrl;
      }

      // 签名加上 Host，避免跨桶访问
      var SignHost = getSignHost.call(this, {
        Bucket: params.Bucket,
        Region: params.Region,
        UseAccelerate: params.UseAccelerate,
        Url: url
      });
      var AuthData = getAuthorizationAsync.call(this, {
        Action: (params.Method || '').toUpperCase() === 'PUT' ? 'name/cos:PutObject' : 'name/cos:GetObject',
        Bucket: params.Bucket || '',
        Region: params.Region || '',
        Method: params.Method || 'get',
        Key: params.Key,
        Expires: params.Expires,
        Headers: params.Headers,
        Query: params.Query,
        SignHost: SignHost,
        ForceSignHost: params.ForceSignHost === false ? false : self.options.ForceSignHost // getObjectUrl支持传参ForceSignHost
      }, function (err, AuthData) {
        if (!callback) return;
        if (err) {
          callback(err);
          return;
        }

        // 兼容万象url qUrlParamList需要再encode一次
        var replaceUrlParamList = function replaceUrlParamList(url) {
          var urlParams = url.match(/q-url-param-list.*?(?=&)/g)[0];
          var encodedParams = 'q-url-param-list=' + encodeURIComponent(urlParams.replace(/q-url-param-list=/, '')).toLowerCase();
          var reg = new RegExp(urlParams, 'g');
          var replacedUrl = url.replace(reg, encodedParams);
          return replacedUrl;
        };
        var signUrl = url;
        signUrl += '?' + (AuthData.Authorization.indexOf('q-signature') > -1 ? replaceUrlParamList(AuthData.Authorization) : 'sign=' + encodeURIComponent(AuthData.Authorization));
        AuthData.SecurityToken && (signUrl += '&x-cos-security-token=' + AuthData.SecurityToken);
        AuthData.ClientIP && (signUrl += '&clientIP=' + AuthData.ClientIP);
        AuthData.ClientUA && (signUrl += '&clientUA=' + AuthData.ClientUA);
        AuthData.Token && (signUrl += '&token=' + AuthData.Token);
        queryParamsStr && (signUrl += '&' + queryParamsStr);
        setTimeout(function () {
          callback(null, {
            Url: signUrl
          });
        });
      });
      if (AuthData) {
        syncUrl += '?' + AuthData.Authorization + (AuthData.SecurityToken ? '&x-cos-security-token=' + AuthData.SecurityToken : '');
        queryParamsStr && (syncUrl += '&' + queryParamsStr);
      } else {
        queryParamsStr && (syncUrl += '?' + queryParamsStr);
      }
      return syncUrl;
    }

    /**
     * 私有方法
     */
    function decodeAcl(AccessControlPolicy) {
      var result = {
        GrantFullControl: [],
        GrantWrite: [],
        GrantRead: [],
        GrantReadAcp: [],
        GrantWriteAcp: [],
        ACL: ''
      };
      var GrantMap = {
        FULL_CONTROL: 'GrantFullControl',
        WRITE: 'GrantWrite',
        READ: 'GrantRead',
        READ_ACP: 'GrantReadAcp',
        WRITE_ACP: 'GrantWriteAcp'
      };
      var AccessControlList = AccessControlPolicy && AccessControlPolicy.AccessControlList || {};
      var Grant = AccessControlList.Grant;
      if (Grant) {
        Grant = util.isArray(Grant) ? Grant : [Grant];
      }
      var PublicAcl = {
        READ: 0,
        WRITE: 0,
        FULL_CONTROL: 0
      };
      Grant && Grant.length && util.each(Grant, function (item) {
        if (item.Grantee.ID === 'qcs::cam::anyone:anyone' || item.Grantee.URI === 'http://cam.qcloud.com/groups/global/AllUsers') {
          PublicAcl[item.Permission] = 1;
        } else if (item.Grantee.ID !== AccessControlPolicy.Owner.ID) {
          result[GrantMap[item.Permission]].push('id="' + item.Grantee.ID + '"');
        }
      });
      if (PublicAcl.FULL_CONTROL || PublicAcl.WRITE && PublicAcl.READ) {
        result.ACL = 'public-read-write';
      } else if (PublicAcl.READ) {
        result.ACL = 'public-read';
      } else {
        result.ACL = 'private';
      }
      util.each(GrantMap, function (item) {
        result[item] = uniqGrant(result[item].join(','));
      });
      return result;
    }

    // Grant 去重
    function uniqGrant(str) {
      var arr = str.split(',');
      var exist = {};
      var i, item;
      for (i = 0; i < arr.length;) {
        item = arr[i].trim();
        if (exist[item]) {
          arr.splice(i, 1);
        } else {
          exist[item] = true;
          arr[i] = item;
          i++;
        }
      }
      return arr.join(',');
    }

    // 生成操作 url
    function getUrl(params) {
      var longBucket = params.bucket;
      var shortBucket = longBucket.substr(0, longBucket.lastIndexOf('-'));
      var appId = longBucket.substr(longBucket.lastIndexOf('-') + 1);
      var domain = params.domain;
      var region = params.region;
      var object = params.object;
      var protocol = 'https:';
      if (!domain) {
        if (['cn-south', 'cn-south-2', 'cn-north', 'cn-east', 'cn-southwest', 'sg'].indexOf(region) > -1) {
          domain = '{Region}.myqcloud.com';
        } else {
          domain = 'cos.{Region}.myqcloud.com';
        }
        if (!params.ForcePathStyle) {
          domain = '{Bucket}.' + domain;
        }
      }
      domain = domain.replace(/\{\{AppId\}\}/gi, appId).replace(/\{\{Bucket\}\}/gi, shortBucket).replace(/\{\{Region\}\}/gi, region).replace(/\{\{.*?\}\}/gi, '');
      domain = domain.replace(/\{AppId\}/gi, appId).replace(/\{BucketName\}/gi, shortBucket).replace(/\{Bucket\}/gi, longBucket).replace(/\{Region\}/gi, region).replace(/\{.*?\}/gi, '');
      if (!/^[a-zA-Z]+:\/\//.test(domain)) {
        domain = protocol + '//' + domain;
      }

      // 去掉域名最后的斜杆
      if (domain.slice(-1) === '/') {
        domain = domain.slice(0, -1);
      }
      var url = domain;
      if (params.ForcePathStyle) {
        url += '/' + longBucket;
      }
      url += '/';
      if (object) {
        url += util.camSafeUrlEncode(object).replace(/%2F/g, '/');
      }
      if (params.isLocation) {
        url = url.replace(/^https?:\/\//, '');
      }
      return url;
    }
    var getSignHost = function getSignHost(opt) {
      if (!opt.Bucket || !opt.Region) return '';
      var useAccelerate = opt.UseAccelerate === undefined ? this.options.UseAccelerate : opt.UseAccelerate;
      var url = opt.Url || getUrl({
        ForcePathStyle: this.options.ForcePathStyle,
        protocol: this.options.Protocol,
        domain: this.options.Domain,
        bucket: opt.Bucket,
        region: useAccelerate ? 'accelerate' : opt.Region
      });
      var urlHost = url.replace(/^https?:\/\/([^/]+)(\/.*)?$/, '$1');
      return urlHost;
    };

    // 异步获取签名
    function getAuthorizationAsync(params, callback) {
      var headers = util.clone(params.Headers);
      var headerHost = '';
      util.each(headers, function (v, k) {
        (v === '' || ['content-type', 'cache-control'].indexOf(k.toLowerCase()) > -1) && delete headers[k];
        if (k.toLowerCase() === 'host') headerHost = v;
      });

      // ForceSignHost明确传入false才不加入host签名
      var forceSignHost = params.ForceSignHost === false ? false : true;
      // Host 加入签名计算
      if (!headerHost && params.SignHost && forceSignHost) headers.Host = params.SignHost;

      // 获取凭证的回调，避免用户 callback 多次
      var cbDone = false;
      var cb = function cb(err, AuthData) {
        if (cbDone) return;
        cbDone = true;
        if (AuthData && AuthData.XCosSecurityToken && !AuthData.SecurityToken) {
          AuthData = util.clone(AuthData);
          AuthData.SecurityToken = AuthData.XCosSecurityToken;
          delete AuthData.XCosSecurityToken;
        }
        callback && callback(err, AuthData);
      };
      var self = this;
      var Bucket = params.Bucket || '';
      var Region = params.Region || '';

      // PathName
      var KeyName = params.Action === 'name/cos:PostObject' || !params.Key ? '' : params.Key;
      if (self.options.ForcePathStyle && Bucket) {
        KeyName = Bucket + '/' + KeyName;
      }
      var Pathname = '/' + KeyName;

      // Action、ResourceKey
      var StsData = {};
      var Scope = params.Scope;
      if (!Scope) {
        var Action = params.Action || '';
        var ResourceKey = params.ResourceKey || params.Key || '';
        Scope = params.Scope || [{
          action: Action,
          bucket: Bucket,
          region: Region,
          prefix: ResourceKey
        }];
      }
      var ScopeKey = util.md5(JSON.stringify(Scope));

      // STS
      self._StsCache = self._StsCache || [];
      (function () {
        var i, AuthData;
        for (i = self._StsCache.length - 1; i >= 0; i--) {
          AuthData = self._StsCache[i];
          var compareTime = Math.round(util.getSkewTime(self.options.SystemClockOffset) / 1000) + 30;
          if (AuthData.StartTime && compareTime < AuthData.StartTime || compareTime >= AuthData.ExpiredTime) {
            self._StsCache.splice(i, 1);
            continue;
          }
          if (!AuthData.ScopeLimit || AuthData.ScopeLimit && AuthData.ScopeKey === ScopeKey) {
            StsData = AuthData;
            break;
          }
        }
      })();
      var calcAuthByTmpKey = function calcAuthByTmpKey() {
        var KeyTime = '';
        if (StsData.StartTime && params.Expires) {
          KeyTime = StsData.StartTime + ';' + (StsData.StartTime + params.Expires * 1);
        } else if (StsData.StartTime && StsData.ExpiredTime) {
          KeyTime = StsData.StartTime + ';' + StsData.ExpiredTime;
        }
        var Authorization = util.getAuth({
          SecretId: StsData.TmpSecretId,
          SecretKey: StsData.TmpSecretKey,
          Method: params.Method,
          Pathname: Pathname,
          Query: params.Query,
          Headers: headers,
          Expires: params.Expires,
          SystemClockOffset: self.options.SystemClockOffset,
          KeyTime: KeyTime,
          ForceSignHost: forceSignHost
        });
        var AuthData = {
          Authorization: Authorization,
          SecurityToken: StsData.SecurityToken || StsData.XCosSecurityToken || '',
          Token: StsData.Token || '',
          ClientIP: StsData.ClientIP || '',
          ClientUA: StsData.ClientUA || '',
          SignFrom: 'client'
        };
        cb(null, AuthData);
      };
      var checkAuthError = function checkAuthError(AuthData) {
        if (AuthData.Authorization) {
          // 检查签名格式
          var formatAllow = false;
          var auth = AuthData.Authorization;
          if (auth) {
            if (auth.indexOf(' ') > -1) {
              formatAllow = false;
            } else if (auth.indexOf('q-sign-algorithm=') > -1 && auth.indexOf('q-ak=') > -1 && auth.indexOf('q-sign-time=') > -1 && auth.indexOf('q-key-time=') > -1 && auth.indexOf('q-url-param-list=') > -1) {
              formatAllow = true;
            } else {
              try {
                auth = atob(auth);
                if (auth.indexOf('a=') > -1 && auth.indexOf('k=') > -1 && auth.indexOf('t=') > -1 && auth.indexOf('r=') > -1 && auth.indexOf('b=') > -1) {
                  formatAllow = true;
                }
              } catch (e) {}
            }
          }
          if (!formatAllow) return util.error(new Error('getAuthorization callback params format error'));
        } else {
          if (!AuthData.TmpSecretId) return util.error(new Error('getAuthorization callback params missing "TmpSecretId"'));
          if (!AuthData.TmpSecretKey) return util.error(new Error('getAuthorization callback params missing "TmpSecretKey"'));
          if (!AuthData.SecurityToken && !AuthData.XCosSecurityToken) return util.error(new Error('getAuthorization callback params missing "SecurityToken"'));
          if (!AuthData.ExpiredTime) return util.error(new Error('getAuthorization callback params missing "ExpiredTime"'));
          if (AuthData.ExpiredTime && AuthData.ExpiredTime.toString().length !== 10) return util.error(new Error('getAuthorization callback params "ExpiredTime" should be 10 digits'));
          if (AuthData.StartTime && AuthData.StartTime.toString().length !== 10) return util.error(new Error('getAuthorization callback params "StartTime" should be 10 StartTime'));
        }
        return false;
      };

      // 先判断是否有临时密钥
      if (StsData.ExpiredTime && StsData.ExpiredTime - util.getSkewTime(self.options.SystemClockOffset) / 1000 > 60) {
        // 如果缓存的临时密钥有效，并还有超过60秒有效期就直接使用
        calcAuthByTmpKey();
      } else if (self.options.getAuthorization) {
        // 外部计算签名或获取临时密钥
        self.options.getAuthorization.call(self, {
          Bucket: Bucket,
          Region: Region,
          Method: params.Method,
          Key: KeyName,
          Pathname: Pathname,
          Query: params.Query,
          Headers: headers,
          Scope: Scope,
          SystemClockOffset: self.options.SystemClockOffset,
          ForceSignHost: forceSignHost
        }, function (AuthData) {
          if (typeof AuthData === 'string') {
            AuthData = {
              Authorization: AuthData
            };
          }
          var AuthError = checkAuthError(AuthData);
          if (AuthError) return cb(AuthError);
          if (AuthData.Authorization) {
            cb(null, AuthData);
          } else {
            StsData = AuthData || {};
            StsData.Scope = Scope;
            StsData.ScopeKey = ScopeKey;
            self._StsCache.push(StsData);
            calcAuthByTmpKey();
          }
        });
      } else if (self.options.getSTS) {
        // 外部获取临时密钥
        self.options.getSTS.call(self, {
          Bucket: Bucket,
          Region: Region
        }, function (data) {
          StsData = data || {};
          StsData.Scope = Scope;
          StsData.ScopeKey = ScopeKey;
          if (!StsData.TmpSecretId) StsData.TmpSecretId = StsData.SecretId;
          if (!StsData.TmpSecretKey) StsData.TmpSecretKey = StsData.SecretKey;
          var AuthError = checkAuthError(StsData);
          if (AuthError) return cb(AuthError);
          self._StsCache.push(StsData);
          calcAuthByTmpKey();
        });
      } else {
        // 内部计算获取签名
        return function () {
          var KeyTime = '';
          if (self.options.StartTime && params.Expires) {
            if (self.options.StartTime.toString().length !== 10) {
              return cb(util.error(new Error('params "StartTime" should be 10 digits')));
            }
            KeyTime = self.options.StartTime + ';' + (self.options.StartTime + params.Expires * 1);
          } else if (self.options.StartTime && self.options.ExpiredTime) {
            if (self.options.StartTime.toString().length !== 10) {
              return cb(util.error(new Error('params "StartTime" should be 10 digits')));
            }
            if (self.options.ExpiredTime.toString().length !== 10) {
              return cb(util.error(new Error('params "ExpiredTime" should be 10 digits')));
            }
            KeyTime = self.options.StartTime + ';' + self.options.ExpiredTime * 1;
          }
          var Authorization = util.getAuth({
            SecretId: params.SecretId || self.options.SecretId,
            SecretKey: params.SecretKey || self.options.SecretKey,
            Method: params.Method,
            Pathname: Pathname,
            Query: params.Query,
            Headers: headers,
            Expires: params.Expires,
            KeyTime: KeyTime,
            SystemClockOffset: self.options.SystemClockOffset,
            ForceSignHost: forceSignHost
          });
          var AuthData = {
            Authorization: Authorization,
            SecurityToken: self.options.SecurityToken || self.options.XCosSecurityToken,
            SignFrom: 'client'
          };
          cb(null, AuthData);
          return AuthData;
        }();
      }
      return '';
    }

    // 判断当前请求出错时能否重试
    function allowRetry(err) {
      var self = this;
      var canRetry = false;
      var networkError = false;
      var isTimeError = false;
      var serverDate = err.headers && (err.headers.date || err.headers.Date) || err.error && err.error.ServerTime;
      try {
        var errorCode = err.error.Code;
        var errorMessage = err.error.Message;
        if (errorCode === 'RequestTimeTooSkewed' || errorCode === 'AccessDenied' && errorMessage === 'Request has expired') {
          isTimeError = true;
        }
      } catch (e) {}
      if (err) {
        if (isTimeError && serverDate) {
          var serverTime = Date.parse(serverDate);
          if (this.options.CorrectClockSkew && Math.abs(util.getSkewTime(this.options.SystemClockOffset) - serverTime) >= 30000) {
            console.error('error: Local time is too skewed.');
            this.options.SystemClockOffset = serverTime - Date.now();
            canRetry = true;
          }
        } else if (Math.floor(err.statusCode / 100) === 5) {
          return {
            canRetry: true,
            networkError: false
          };
        } else if (err.message === 'timeout') {
          return {
            canRetry: true,
            networkError: self.options.AutoSwitchHost
          };
        }
        /**
         * 归为网络错误
         * 1、no statusCode
         * 2、statusCode === 3xx || 4xx || 5xx && no requestId
         */
        if (!err.statusCode) {
          canRetry = true;
          networkError = self.options.AutoSwitchHost;
        } else {
          var statusCode = Math.floor(err.statusCode / 100);
          var requestId = (err === null || err === void 0 ? void 0 : err.headers) && (err === null || err === void 0 ? void 0 : err.headers['x-cos-request-id']);
          if ([3, 4, 5].includes(statusCode) && !requestId) {
            canRetry = self.options.AutoSwitchHost;
            networkError = true;
          }
        }
      }
      return {
        canRetry: canRetry,
        networkError: networkError
      };
    }

    /**
     * requestUrl：请求的url，用于判断是否cos主域名，true才切
     * clientCalcSign：是否客户端计算签名，服务端返回的签名不能切，true才切
     * networkError：是否未知网络错误，true才切
     * */
    function canSwitchHost(_ref) {
      var requestUrl = _ref.requestUrl,
        clientCalcSign = _ref.clientCalcSign,
        networkError = _ref.networkError;
      if (!this.options.AutoSwitchHost) return false;
      if (!requestUrl) return false;
      if (!clientCalcSign) return false;
      if (!networkError) return false;
      var commonReg = /^https?:\/\/[^\/]*\.cos\.[^\/]*\.myqcloud\.com(\/.*)?$/;
      var accelerateReg = /^https?:\/\/[^\/]*\.cos\.accelerate\.myqcloud\.com(\/.*)?$/;
      // 当前域名是cos主域名才切换
      var isCommonCosHost = commonReg.test(requestUrl) && !accelerateReg.test(requestUrl);
      return isCommonCosHost;
    }

    // 获取签名并发起请求
    function submitRequest(params, callback) {
      var self = this;

      // 处理 headers
      !params.headers && (params.headers = {});

      // 处理 query
      !params.qs && (params.qs = {});
      params.VersionId && (params.qs.versionId = params.VersionId);
      params.qs = util.clearKey(params.qs);

      // 清理 undefined 和 null 字段
      params.headers && (params.headers = util.clearKey(params.headers));
      params.qs && (params.qs = util.clearKey(params.qs));
      var Query = util.clone(params.qs);
      params.action && (Query[params.action] = '');
      var paramsUrl = params.url || params.Url;
      var SignHost = params.SignHost || getSignHost.call(this, {
        Bucket: params.Bucket,
        Region: params.Region,
        Url: paramsUrl
      });
      var tracker = params.tracker;
      var next = function next(tryTimes) {
        var oldClockOffset = self.options.SystemClockOffset;
        if (params.SwitchHost) {
          // 更换要签的host
          SignHost = SignHost.replace(/myqcloud.com/, 'tencentcos.cn');
        }
        tracker && tracker.setParams({
          signStartTime: new Date().getTime(),
          httpRetryTimes: tryTimes - 1
        });
        getAuthorizationAsync.call(self, {
          Bucket: params.Bucket || '',
          Region: params.Region || '',
          Method: params.method,
          Key: params.Key,
          Query: Query,
          Headers: params.headers,
          SignHost: SignHost,
          Action: params.Action,
          ResourceKey: params.ResourceKey,
          Scope: params.Scope,
          ForceSignHost: self.options.ForceSignHost
        }, function (err, AuthData) {
          if (err) {
            callback(err);
            return;
          }
          tracker && tracker.setParams({
            signEndTime: new Date().getTime(),
            httpStartTime: new Date().getTime()
          });
          params.AuthData = AuthData;
          _submitRequest.call(self, params, function (err, data) {
            var canRetry = false;
            var networkError = false;
            if (err) {
              var info = allowRetry.call(self, err);
              canRetry = info.canRetry || oldClockOffset !== self.options.SystemClockOffset;
              networkError = info.networkError;
            }
            tracker && tracker.setParams({
              httpEndTime: new Date().getTime()
            });
            if (err && tryTimes < 4 && canRetry) {
              if (params.headers) {
                delete params.headers.Authorization;
                delete params.headers['token'];
                delete params.headers['clientIP'];
                delete params.headers['clientUA'];
                params.headers['x-cos-security-token'] && delete params.headers['x-cos-security-token'];
                params.headers['x-ci-security-token'] && delete params.headers['x-ci-security-token'];
              }
              // 进入重试逻辑时 需判断是否需要切换cos备用域名
              var switchHost = canSwitchHost.call(self, {
                requestUrl: (err === null || err === void 0 ? void 0 : err.url) || '',
                clientCalcSign: (AuthData === null || AuthData === void 0 ? void 0 : AuthData.SignFrom) === 'client',
                networkError: networkError
              });
              params.SwitchHost = switchHost;
              // 重试时增加请求头，小程序里传字符串类型
              params.headers['x-cos-sdk-retry'] = 'true';
              next(tryTimes + 1);
            } else {
              callback(err, data);
            }
          });
        });
      };
      next(1);
    }

    // 发起请求
    function _submitRequest(params, callback) {
      var self = this;
      var TaskId = params.TaskId;
      if (TaskId && !self._isRunningTask(TaskId)) return;
      var bucket = params.Bucket;
      var region = params.Region;
      var object = params.Key;
      var method = params.method || 'GET';
      var url = params.url || params.Url;
      var body = params.body;
      var json = params.json;
      var rawBody = params.rawBody;
      var dataType = params.dataType;
      var httpDNSServiceId = self.options.HttpDNSServiceId;

      // url
      if (self.options.UseAccelerate) {
        region = 'accelerate';
      }
      url = url || getUrl({
        ForcePathStyle: self.options.ForcePathStyle,
        protocol: self.options.Protocol,
        domain: self.options.Domain,
        bucket: bucket,
        region: region,
        object: object
      });
      if (params.SwitchHost) {
        // 更换请求的url
        url = url.replace(/myqcloud.com/, 'tencentcos.cn');
      }
      var repoterUrl = object ? url : '';
      if (params.action) {
        url = url + '?' + params.action;
      }
      if (params.qsStr) {
        if (url.indexOf('?') > -1) {
          url = url + '&' + params.qsStr;
        } else {
          url = url + '?' + params.qsStr;
        }
      }
      var opt = {
        method: method,
        url: url,
        headers: params.headers,
        qs: params.qs,
        filePath: params.filePath,
        body: body,
        json: json,
        httpDNSServiceId: httpDNSServiceId,
        dataType: dataType
      };

      // 兼容ci接口
      var token = 'x-cos-security-token';
      if (util.isCIHost(url)) {
        token = 'x-ci-security-token';
      }

      // 获取签名
      opt.headers.Authorization = params.AuthData.Authorization;
      params.AuthData.Token && (opt.headers['token'] = params.AuthData.Token);
      params.AuthData.ClientIP && (opt.headers['clientIP'] = params.AuthData.ClientIP);
      params.AuthData.ClientUA && (opt.headers['clientUA'] = params.AuthData.ClientUA);
      params.AuthData.SecurityToken && (opt.headers[token] = params.AuthData.SecurityToken);

      // 清理 undefined 和 null 字段
      opt.headers && (opt.headers = util.clearKey(opt.headers));
      opt = util.clearKey(opt);

      // progress
      if (params.onProgress && typeof params.onProgress === 'function') {
        opt.onProgress = function (e) {
          if (TaskId && !self._isRunningTask(TaskId)) return;
          var loaded = e ? e.loaded : 0;
          params.onProgress({
            loaded: loaded,
            total: e.total
          });
        };
      }
      if (this.options.Timeout) {
        opt.timeout = this.options.Timeout;
      }
      self.options.ForcePathStyle && (opt.pathStyle = self.options.ForcePathStyle);
      self.emit('before-send', opt);
      var useAccelerate = opt.url.includes('accelerate.');
      var queryString = opt.qs ? Object.keys(opt.qs).map(function (key) {
        return "".concat(key, "=").concat(opt.qs[key]);
      }).join('&') : '';
      var fullUrl = queryString ? opt.url + '?' + queryString : opt.url;
      if (params.tracker) {
        var _opt$body;
        params.tracker.setParams({
          url: fullUrl,
          httpMethod: opt.method,
          accelerate: useAccelerate,
          httpSize: ((_opt$body = opt.body) === null || _opt$body === void 0 ? void 0 : _opt$body.size) || 0
        });
        // 分块上传时给父级tracker设置url信息
        if (params.tracker.parent && !params.tracker.parent.params.url) {
          params.tracker.parent.setParams({
            url: repoterUrl,
            accelerate: useAccelerate
          });
        }
      }
      var sender = REQUEST(opt, function (err, response, body) {
        if (err === 'abort') return;

        // 返回内容添加 状态码 和 headers
        var hasReturned;
        var cb = function cb(err, data) {
          TaskId && self.off('inner-kill-task', killTask);
          if (hasReturned) return;
          hasReturned = true;
          var attrs = {};
          response && response.statusCode && (attrs.statusCode = response.statusCode);
          response && response.headers && (attrs.headers = response.headers);
          if (err) {
            opt.url && (attrs.url = opt.url);
            opt.method && (attrs.method = opt.method);
            err = util.extend(err || {}, attrs);
            callback(err, null);
          } else {
            data = util.extend(data || {}, attrs);
            callback(null, data);
          }
          sender = null;
        };
        // 请求错误，发生网络错误
        if (err) {
          cb({
            error: err
          });
          return;
        }

        // 请求返回码不为 200
        var statusCode = response.statusCode;
        var statusSuccess = Math.floor(statusCode / 100) === 2; // 200 202 204 206

        // 不对 body 进行转换，body 直接挂载返回
        if (rawBody) {
          if (statusSuccess) {
            return cb(null, {
              body: body
            });
          } else {
            // 报错但是返回了 ArrayBuffer，需要解析成 string
            if (body instanceof ArrayBuffer) {
              var errorStr = util.arrayBufferToString(body);
              var json = util.parseResBody(errorStr);
              var errorBody = json.Error || json;
              return cb({
                error: errorBody
              });
            }
          }
        }

        // 解析body，兼容 xml、json，解析失败时完整返回
        var jsonRes = util.parseResBody(body);
        if (!statusSuccess) {
          cb({
            error: jsonRes.Error || jsonRes
          });
          return;
        }
        if (jsonRes.Error) {
          cb({
            error: jsonRes.Error
          });
          return;
        }
        cb(null, jsonRes);
      });

      // kill task
      var killTask = function killTask(data) {
        if (data.TaskId === TaskId) {
          sender && sender.abort && sender.abort();
          self.off('inner-kill-task', killTask);
        }
      };
      TaskId && self.on('inner-kill-task', killTask);
    }
    var API_MAP = {
      // Bucket 相关方法
      getService: getService,
      // Bucket
      putBucket: putBucket,
      headBucket: headBucket,
      // Bucket
      getBucket: getBucket,
      deleteBucket: deleteBucket,
      putBucketAcl: putBucketAcl,
      // BucketACL
      getBucketAcl: getBucketAcl,
      putBucketCors: putBucketCors,
      // BucketCors
      getBucketCors: getBucketCors,
      deleteBucketCors: deleteBucketCors,
      getBucketLocation: getBucketLocation,
      // BucketLocation
      getBucketPolicy: getBucketPolicy,
      // BucketPolicy
      putBucketPolicy: putBucketPolicy,
      deleteBucketPolicy: deleteBucketPolicy,
      putBucketTagging: putBucketTagging,
      // BucketTagging
      getBucketTagging: getBucketTagging,
      deleteBucketTagging: deleteBucketTagging,
      putBucketLifecycle: putBucketLifecycle,
      // BucketLifecycle
      getBucketLifecycle: getBucketLifecycle,
      deleteBucketLifecycle: deleteBucketLifecycle,
      putBucketVersioning: putBucketVersioning,
      // BucketVersioning
      getBucketVersioning: getBucketVersioning,
      putBucketReplication: putBucketReplication,
      // BucketReplication
      getBucketReplication: getBucketReplication,
      deleteBucketReplication: deleteBucketReplication,
      putBucketWebsite: putBucketWebsite,
      // BucketWebsite
      getBucketWebsite: getBucketWebsite,
      deleteBucketWebsite: deleteBucketWebsite,
      putBucketReferer: putBucketReferer,
      // BucketReferer
      getBucketReferer: getBucketReferer,
      putBucketDomain: putBucketDomain,
      // BucketDomain
      getBucketDomain: getBucketDomain,
      deleteBucketDomain: deleteBucketDomain,
      putBucketOrigin: putBucketOrigin,
      // BucketOrigin
      getBucketOrigin: getBucketOrigin,
      deleteBucketOrigin: deleteBucketOrigin,
      putBucketLogging: putBucketLogging,
      // BucketLogging
      getBucketLogging: getBucketLogging,
      putBucketInventory: putBucketInventory,
      // BucketInventory
      getBucketInventory: getBucketInventory,
      listBucketInventory: listBucketInventory,
      deleteBucketInventory: deleteBucketInventory,
      putBucketAccelerate: putBucketAccelerate,
      getBucketAccelerate: getBucketAccelerate,
      // Object 相关方法
      getObject: getObject,
      headObject: headObject,
      listObjectVersions: listObjectVersions,
      putObject: putObject,
      postObject: postObject,
      deleteObject: deleteObject,
      getObjectAcl: getObjectAcl,
      putObjectAcl: putObjectAcl,
      optionsObject: optionsObject,
      putObjectCopy: putObjectCopy,
      deleteMultipleObject: deleteMultipleObject,
      restoreObject: restoreObject,
      putObjectTagging: putObjectTagging,
      getObjectTagging: getObjectTagging,
      deleteObjectTagging: deleteObjectTagging,
      appendObject: appendObject,
      // 分块上传相关方法
      uploadPartCopy: uploadPartCopy,
      multipartInit: multipartInit,
      multipartUpload: multipartUpload,
      multipartComplete: multipartComplete,
      multipartList: multipartList,
      multipartListPart: multipartListPart,
      multipartAbort: multipartAbort,
      // 工具方法
      request: request,
      getObjectUrl: getObjectUrl,
      getAuth: getAuth
    };
    module.exports.init = function (COS, task) {
      task.transferToTaskMethod(API_MAP, 'postObject');
      task.transferToTaskMethod(API_MAP, 'putObject');
      util.each(API_MAP, function (fn, apiName) {
        COS.prototype[apiName] = util.apiWrapper(apiName, fn);
      });
    };

    /***/ }),

    /***/ "./src/cos.js":
    /*!********************!*\
      !*** ./src/cos.js ***!
      \********************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    "use strict";


    var util = __webpack_require__(/*! ./util */ "./src/util.js");
    var event = __webpack_require__(/*! ./event */ "./src/event.js");
    var task = __webpack_require__(/*! ./task */ "./src/task.js");
    var base = __webpack_require__(/*! ./base */ "./src/base.js");
    var advance = __webpack_require__(/*! ./advance */ "./src/advance.js");
    var pkg = __webpack_require__(/*! ../package.json */ "./package.json");
    var defaultOptions = {
      SecretId: '',
      SecretKey: '',
      SecurityToken: '',
      // 使用临时密钥需要注意自行刷新 Token
      StartTime: 0,
      // 临时密钥返回起始时间
      ExpiredTime: 0,
      // 临时密钥过期时间
      ChunkRetryTimes: 2,
      FileParallelLimit: 3,
      ChunkParallelLimit: 3,
      ChunkSize: 1024 * 1024,
      SliceSize: 1024 * 1024,
      CopyChunkParallelLimit: 20,
      CopyChunkSize: 1024 * 1024 * 10,
      CopySliceSize: 1024 * 1024 * 10,
      MaxPartNumber: 10000,
      ProgressInterval: 1000,
      UploadQueueSize: 10000,
      Domain: '',
      ServiceDomain: '',
      Protocol: '',
      CompatibilityMode: false,
      ForcePathStyle: false,
      Timeout: 0,
      // 单位毫秒，0 代表不设置超时时间
      CorrectClockSkew: true,
      SystemClockOffset: 0,
      // 单位毫秒，ms
      UploadCheckContentMd5: false,
      UploadAddMetaMd5: false,
      UploadIdCacheLimit: 50,
      UseAccelerate: false,
      ForceSignHost: true,
      // 默认将host加入签名计算，关闭后可能导致越权风险，建议保持为true
      HttpDNSServiceId: '',
      // HttpDNS 服务商 Id,填写后代表开启 HttpDNS 服务。HttpDNS 用法详见https://developers.weixin.qq.com/miniprogram/dev/framework/ability/HTTPDNS.html
      SimpleUploadMethod: 'postObject',
      // 高级上传内部判断需要走简单上传时，指定的上传方法，可选postObject或putObject
      AutoSwitchHost: false,
      CopySourceParser: null,
      // 自定义拷贝源解析器
      ObjectKeySimplifyCheck: true,
      // 开启合并校验 getObject Key
      /** 上报相关配置 **/
      DeepTracker: false,
      // 上报时是否对每个分块上传做单独上报
      TrackerDelay: 5000,
      // 周期性上报，单位毫秒。0代表实时上报
      CustomId: '',
      // 自定义上报id
      BeaconReporter: null,
      // 灯塔上报组件，如有需要请自行传入，传入即代表开启上报
      ClsReporter: null // cls 上报组件，如有需要请自行传入，传入即代表开启上报
    };

    // 对外暴露的类
    var COS = function COS(options) {
      this.options = util.extend(util.clone(defaultOptions), options || {});
      this.options.FileParallelLimit = Math.max(1, this.options.FileParallelLimit);
      this.options.ChunkParallelLimit = Math.max(1, this.options.ChunkParallelLimit);
      this.options.ChunkRetryTimes = Math.max(0, this.options.ChunkRetryTimes);
      this.options.ChunkSize = Math.max(1024 * 1024, this.options.ChunkSize);
      this.options.CopyChunkParallelLimit = Math.max(1, this.options.CopyChunkParallelLimit);
      this.options.CopyChunkSize = Math.max(1024 * 1024, this.options.CopyChunkSize);
      this.options.CopySliceSize = Math.max(0, this.options.CopySliceSize);
      this.options.MaxPartNumber = Math.max(1024, Math.min(10000, this.options.MaxPartNumber));
      this.options.Timeout = Math.max(0, this.options.Timeout);
      this.options.EnableReporter = this.options.BeaconReporter || this.options.ClsReporter;
      if (this.options.AppId) {
        console.warn('warning: AppId has been deprecated, Please put it at the end of parameter Bucket(E.g: "test-1250000000").');
      }
      if (this.options.SecretId && this.options.SecretId.indexOf(' ') > -1) {
        console.error('error: SecretId格式错误，请检查');
        console.error('error: SecretId format is incorrect. Please check');
      }
      if (this.options.SecretKey && this.options.SecretKey.indexOf(' ') > -1) {
        console.error('error: SecretKey格式错误，请检查');
        console.error('error: SecretKey format is incorrect. Please check');
      }
      if (this.options.ForcePathStyle) {
        console.warn('cos-wx-sdk-v5不再支持使用path-style，仅支持使用virtual-hosted-style，参考文档：https://cloud.tencent.com/document/product/436/96243');
        throw new Error('ForcePathStyle is not supported');
      }
      event.init(this);
      task.init(this);
    };
    base.init(COS, task);
    advance.init(COS, task);
    COS.util = {
      md5: util.md5,
      xml2json: util.xml2json,
      json2xml: util.json2xml,
      encodeBase64: util.encodeBase64
    };
    COS.getAuthorization = util.getAuth;
    COS.version = pkg.version;
    module.exports = COS;

    /***/ }),

    /***/ "./src/event.js":
    /*!**********************!*\
      !*** ./src/event.js ***!
      \**********************/
    /*! no static exports found */
    /***/ (function(module, exports) {

    var initEvent = function initEvent(cos) {
      var listeners = {};
      var getList = function getList(action) {
        !listeners[action] && (listeners[action] = []);
        return listeners[action];
      };
      cos.on = function (action, callback) {
        getList(action).push(callback);
      };
      cos.off = function (action, callback) {
        var list = getList(action);
        for (var i = list.length - 1; i >= 0; i--) {
          callback === list[i] && list.splice(i, 1);
        }
      };
      cos.emit = function (action, data) {
        var list = getList(action).map(function (cb) {
          return cb;
        });
        for (var i = 0; i < list.length; i++) {
          list[i](data);
        }
      };
    };
    var EventProxy = function EventProxy() {
      initEvent(this);
    };
    module.exports.init = initEvent;
    module.exports.EventProxy = EventProxy;

    /***/ }),

    /***/ "./src/session.js":
    /*!************************!*\
      !*** ./src/session.js ***!
      \************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    var util = __webpack_require__(/*! ./util */ "./src/util.js");

    // 按照文件特征值，缓存 UploadId
    var cacheKey = 'cos_sdk_upload_cache';
    var expires = 30 * 24 * 3600;
    var cache;
    var timer;
    var getCache = function getCache() {
      try {
        var val = JSON.parse(wx.getStorageSync(cacheKey));
      } catch (e) {}
      if (!val) val = [];
      return val;
    };
    var setCache = function setCache() {
      try {
        if (cache.length) wx.setStorageSync(cacheKey, JSON.stringify(cache));else wx.removeStorageSync(cacheKey);
      } catch (e) {}
    };
    var init = function init() {
      if (cache) return;
      cache = getCache();
      // 清理太老旧的数据
      var changed = false;
      var now = Math.round(Date.now() / 1000);
      for (var i = cache.length - 1; i >= 0; i--) {
        var mtime = cache[i][2];
        if (!mtime || mtime + expires < now) {
          cache.splice(i, 1);
          changed = true;
        }
      }
      changed && setCache();
    };

    // 把缓存存到本地
    var save = function save() {
      if (timer) return;
      timer = setTimeout(function () {
        setCache();
        timer = null;
      }, 400);
    };
    var mod = {
      using: {},
      // 标记 UploadId 正在使用
      setUsing: function setUsing(uuid) {
        mod.using[uuid] = true;
      },
      // 标记 UploadId 已经没在使用
      removeUsing: function removeUsing(uuid) {
        delete mod.using[uuid];
      },
      // 用上传参数生成哈希值
      getFileId: function getFileId(FileStat, ChunkSize, Bucket, Key) {
        if (FileStat.FilePath && FileStat.size && FileStat.lastModifiedTime && ChunkSize) {
          return util.md5([FileStat.FilePath].join('::')) + '-' + util.md5([FileStat.size, FileStat.mode, FileStat.lastAccessedTime, FileStat.lastModifiedTime, ChunkSize, Bucket, Key].join('::'));
        } else {
          return null;
        }
      },
      // 用上传参数生成哈希值
      getCopyFileId: function getCopyFileId(copySource, sourceHeaders, ChunkSize, Bucket, Key) {
        var size = sourceHeaders['content-length'];
        var etag = sourceHeaders.etag || '';
        var lastModified = sourceHeaders['last-modified'];
        if (copySource && ChunkSize) {
          return util.md5([copySource, size, etag, lastModified, ChunkSize, Bucket, Key].join('::'));
        } else {
          return null;
        }
      },
      // 获取文件对应的 UploadId 列表
      getUploadIdList: function getUploadIdList(uuid) {
        if (!uuid) return null;
        init();
        var list = [];
        for (var i = 0; i < cache.length; i++) {
          if (cache[i][0] === uuid) list.push(cache[i][1]);
        }
        return list.length ? list : null;
      },
      // 缓存 UploadId
      saveUploadId: function saveUploadId(uuid, UploadId, limit) {
        init();
        if (!uuid) return;
        // 清理没用的 UploadId
        var part1 = uuid.substr(0, uuid.indexOf('-') + 1);
        for (var i = cache.length - 1; i >= 0; i--) {
          var item = cache[i];
          if (item[0] === uuid && item[1] === UploadId) {
            cache.splice(i, 1);
          } else if (uuid !== item[0] && item[0].indexOf(part1) === 0) {
            // 文件路径相同，但其他信息不同，说明文件改变了或上传参数（存储桶、路径、分片大小）变了，直接清理掉
            cache.splice(i, 1);
          }
        }
        cache.unshift([uuid, UploadId, Math.round(Date.now() / 1000)]);
        if (cache.length > limit) cache.splice(limit);
        save();
      },
      // UploadId 已用完，移除掉
      removeUploadId: function removeUploadId(UploadId) {
        init();
        delete mod.using[UploadId];
        for (var i = cache.length - 1; i >= 0; i--) {
          if (cache[i][1] === UploadId) cache.splice(i, 1);
        }
        save();
      }
    };
    module.exports = mod;

    /***/ }),

    /***/ "./src/task.js":
    /*!*********************!*\
      !*** ./src/task.js ***!
      \*********************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    var session = __webpack_require__(/*! ./session */ "./src/session.js");
    var util = __webpack_require__(/*! ./util */ "./src/util.js");
    var originApiMap = {};
    var transferToTaskMethod = function transferToTaskMethod(apiMap, apiName) {
      originApiMap[apiName] = apiMap[apiName];
      apiMap[apiName] = function (params, callback) {
        if (params.SkipTask) {
          originApiMap[apiName].call(this, params, callback);
        } else {
          this._addTask(apiName, params, callback);
        }
      };
    };
    var initTask = function initTask(cos) {
      var queue = [];
      var tasks = {};
      var uploadingFileCount = 0;
      var nextUploadIndex = 0;

      // 接口返回简略的任务信息
      var formatTask = function formatTask(task) {
        var t = {
          id: task.id,
          Bucket: task.Bucket,
          Region: task.Region,
          Key: task.Key,
          FilePath: task.FilePath,
          state: task.state,
          loaded: task.loaded,
          size: task.size,
          speed: task.speed,
          percent: task.percent,
          hashPercent: task.hashPercent,
          error: task.error
        };
        if (task.FilePath) t.FilePath = task.FilePath;
        return t;
      };
      var emitListUpdate = function () {
        var timer;
        var emit = function emit() {
          timer = 0;
          cos.emit('task-list-update', {
            list: util.map(queue, formatTask)
          });
          cos.emit('list-update', {
            list: util.map(queue, formatTask)
          });
        };
        return function () {
          if (!timer) timer = setTimeout(emit);
        };
      }();
      var clearQueue = function clearQueue() {
        if (queue.length <= cos.options.UploadQueueSize) return;
        for

          // 如果还太多，才继续清理
        (var i = 0; i < nextUploadIndex &&
        // 小于当前操作的 index 才清理
        i < queue.length &&
        // 大于队列才清理
        queue.length > cos.options.UploadQueueSize;) {
          var isActive = queue[i].state === 'waiting' || queue[i].state === 'checking' || queue[i].state === 'uploading';
          if (!queue[i] || !isActive) {
            tasks[queue[i].id] && delete tasks[queue[i].id];
            queue.splice(i, 1);
            nextUploadIndex--;
          } else {
            i++;
          }
        }
        emitListUpdate();
      };
      var startNextTask = function startNextTask() {
        // 检查是否允许增加执行进程
        if (uploadingFileCount >= cos.options.FileParallelLimit) return;
        // 跳过不可执行的任务
        while (queue[nextUploadIndex] && queue[nextUploadIndex].state !== 'waiting') nextUploadIndex++;
        // 检查是否已遍历结束
        if (nextUploadIndex >= queue.length) return;
        // 上传该遍历到的任务
        var task = queue[nextUploadIndex];
        nextUploadIndex++;
        uploadingFileCount++;
        task.state = 'checking';
        task.params.onTaskStart && task.params.onTaskStart(formatTask(task));
        !task.params.UploadData && (task.params.UploadData = {});
        var apiParams = util.formatParams(task.api, task.params);
        originApiMap[task.api].call(cos, apiParams, function (err, data) {
          if (!cos._isRunningTask(task.id)) return;
          if (task.state === 'checking' || task.state === 'uploading') {
            task.state = err ? 'error' : 'success';
            err && (task.error = err);
            uploadingFileCount--;
            emitListUpdate();
            startNextTask();
            task.callback && task.callback(err, data);
            if (task.state === 'success') {
              if (task.params) {
                delete task.params.UploadData;
                delete task.params.Body;
                delete task.params;
              }
              delete task.callback;
            }
          }
          clearQueue();
        });
        emitListUpdate();
        // 异步执行下一个任务
        setTimeout(startNextTask);
      };
      var killTask = function killTask(id, switchToState) {
        var task = tasks[id];
        if (!task) return;
        var waiting = task && task.state === 'waiting';
        var running = task && (task.state === 'checking' || task.state === 'uploading');
        if (switchToState === 'canceled' && task.state !== 'canceled' || switchToState === 'paused' && waiting || switchToState === 'paused' && running) {
          if (switchToState === 'paused' && task.params.Body && typeof task.params.Body.pipe === 'function') {
            console.error('stream not support pause');
            return;
          }
          task.state = switchToState;
          cos.emit('inner-kill-task', {
            TaskId: id,
            toState: switchToState
          });
          try {
            var UploadId = task && task.params && task.params.UploadData.UploadId;
          } catch (e) {}
          if (switchToState === 'canceled' && UploadId) session.removeUsing(UploadId);
          emitListUpdate();
          if (running) {
            uploadingFileCount--;
            startNextTask();
          }
          if (switchToState === 'canceled') {
            if (task.params) {
              delete task.params.UploadData;
              delete task.params.Body;
              delete task.params;
            }
            delete task.callback;
          }
        }
        clearQueue();
      };
      cos._addTasks = function (taskList) {
        util.each(taskList, function (task) {
          cos._addTask(task.api, task.params, task.callback, true);
        });
        emitListUpdate();
      };
      cos._addTask = function (api, params, callback, ignoreAddEvent) {
        // 如果小程序版本不支持获取文件分片内容，统一转到 简单上传 接口上传
        var simpleUploadMethod = cos.options.SimpleUploadMethod === 'postObject' ? 'postObject' : 'putObject';
        if (api === 'sliceUploadFile' && !util.canFileSlice()) api = simpleUploadMethod;

        // 复制参数对象
        params = util.formatParams(api, params);

        // 生成 id
        var id = util.uuid();
        params.TaskId = id;
        params.onTaskReady && params.onTaskReady(id);
        var task = {
          // env
          params: params,
          callback: callback,
          api: api,
          index: queue.length,
          // task
          id: id,
          Bucket: params.Bucket,
          Region: params.Region,
          Key: params.Key,
          FilePath: params.FilePath || '',
          state: 'waiting',
          loaded: 0,
          size: 0,
          speed: 0,
          percent: 0,
          hashPercent: 0,
          error: null
        };
        var onHashProgress = params.onHashProgress;
        params.onHashProgress = function (info) {
          if (!cos._isRunningTask(task.id)) return;
          task.hashPercent = info.percent;
          onHashProgress && onHashProgress(info);
          emitListUpdate();
        };
        var onProgress = params.onProgress;
        params.onProgress = function (info) {
          if (!cos._isRunningTask(task.id)) return;
          task.state === 'checking' && (task.state = 'uploading');
          task.loaded = info.loaded;
          task.size = info.total;
          task.speed = info.speed;
          task.percent = info.percent;
          onProgress && onProgress(info);
          emitListUpdate();
        };

        // 异步获取 filesize
        util.getFileSize(api, params, function (err, size) {
          // 开始处理上传
          if (err) {
            // 如果获取大小出错，不加入队列
            callback(err);
            return;
          }
          // 获取完文件大小再把任务加入队列
          tasks[id] = task;
          queue.push(task);
          task.size = size;
          !ignoreAddEvent && emitListUpdate();
          startNextTask();
          clearQueue();
        });
        return id;
      };
      cos._isRunningTask = function (id) {
        var task = tasks[id];
        return !!(task && (task.state === 'checking' || task.state === 'uploading'));
      };
      cos.getTaskList = function () {
        return util.map(queue, formatTask);
      };
      cos.cancelTask = function (id) {
        killTask(id, 'canceled');
      };
      cos.pauseTask = function (id) {
        killTask(id, 'paused');
      };
      cos.restartTask = function (id) {
        var task = tasks[id];
        if (task && (task.state === 'paused' || task.state === 'error')) {
          task.state = 'waiting';
          emitListUpdate();
          nextUploadIndex = Math.min(nextUploadIndex, task.index);
          startNextTask();
        }
      };
      cos.isUploadRunning = function () {
        return uploadingFileCount || nextUploadIndex < queue.length;
      };
    };
    module.exports.transferToTaskMethod = transferToTaskMethod;
    module.exports.init = initTask;

    /***/ }),

    /***/ "./src/tracker.js":
    /*!************************!*\
      !*** ./src/tracker.js ***!
      \************************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
    function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
    function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
    function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
    function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
    function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
    function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
    function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
    var pkg = __webpack_require__(/*! ../package.json */ "./package.json");
    var beacon = null;
    var getBeacon = function getBeacon(Beacon, delay) {
      if (!beacon) {
        // 生成 beacon
        if (typeof Beacon !== 'function') {
          throw new Error('Beacon not found');
        }
        beacon = new Beacon({
          appkey: '0WEB05PY6MHRGK0U',
          versionCode: pkg.version,
          channelID: 'mp_sdk',
          //渠道,选填
          openid: 'openid',
          // 用户id, 选填
          unionid: 'unid',
          //用户unionid , 类似idfv,选填
          strictMode: false,
          //严苛模式开关, 打开严苛模式会主动抛出异常, 上线请务必关闭!!!
          delay: delay,
          // 普通事件延迟上报时间(单位毫秒), 默认1000(1秒),选填
          sessionDuration: 60 * 1000 // session变更的时间间隔, 一个用户持续30分钟(默认值)没有任何上报则算另一次 session,每变更一次session上报一次启动事件(rqd_applaunched),使用毫秒(ms),最小值30秒,选填
        });
      }
      return beacon;
    };

    // 毫秒转秒
    var ms2s = function ms2s(ms) {
      if (!ms || ms < 0) return 0;
      return (ms / 1000).toFixed(3);
    };
    var utils = {
      // 生成uid 每个链路对应唯一一条uid
      getUid: function getUid() {
        var S4 = function S4() {
          return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
        };
        return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4();
      },
      // 获取网络类型 4g ｜ wifi
      getNetType: function getNetType() {
        return new Promise(function (resolve) {
          if (wx.canIUse('getNetworkType')) {
            try {
              wx.getNetworkType({
                success: function success(res) {
                  resolve(res.networkType);
                }
              });
            } catch (e) {
              resolve('can_not_get_network_type');
            }
          } else {
            resolve('can_not_get_network_type');
          }
        });
      },
      // 获取系统信息
      getSystemInfo: function getSystemInfo() {
        var baseInfo = {
          // ↓上报项
          devicePlatform: 'can_not_get_system_info',
          // ios/anroid/windows/mac/devtools
          wxVersion: 'can_not_get_system_info',
          wxSystem: 'can_not_get_system_info',
          wxSdkVersion: 'can_not_get_system_info'
        };
        var appBaseInfo = {};
        var deviceInfo = {};
        if (wx.canIUse('getAppBaseInfo')) {
          appBaseInfo = wx.getAppBaseInfo() || {};
        }
        if (wx.canIUse('getDeviceInfo')) {
          deviceInfo = wx.getDeviceInfo() || {};
        }
        var sdkVersion = appBaseInfo.SDKVersion || 'can_not_get_system_info';
        var version = appBaseInfo.version || 'can_not_get_system_info';
        var platform = deviceInfo.platform || 'can_not_get_system_info';
        var system = deviceInfo.system || 'can_not_get_system_info';
        Object.assign(baseInfo, {
          devicePlatform: platform,
          wxVersion: version,
          wxSystem: system,
          wxSdkVersion: sdkVersion
        });
        return baseInfo;
      }
    };

    // 设备信息，只取一次值
    var deviceInfo = utils.getSystemInfo();
    var transApiName = function transApiName(api) {
      if (['putObject', 'sliceUploadFile', 'uploadFile', 'uploadFiles'].includes(api)) {
        return 'UploadTask';
      } else if (api === 'getObject') {
        return 'DownloadTask';
      } else if (['putObjectCopy', 'sliceCopyFile'].includes(api)) {
        return 'CopyTask';
      }
      return api;
    };

    // 上报参数驼峰改下划线
    function camel2underline(key) {
      return key.replace(/([A-Z])/g, '_$1').toLowerCase();
    }
    function formatParams(params) {
      var formattedParams = {};
      var successKeys = ['sdkVersionName', 'sdkVersionCode', 'osName', 'networkType', 'requestName', 'requestResult', 'bucket', 'region', 'appid', 'accelerate', 'url', 'host', 'requestPath', 'userAgent', 'httpMethod', 'httpSize', 'httpSpeed', 'httpTookTime', 'httpMd5', 'httpSign', 'httpFullTime', 'httpDomain', 'partNumber', 'httpRetryTimes', 'customId', 'traceId', 'realApi'];
      var failureKeys = [].concat(successKeys, ['errorNode', 'errorCode', 'errorName', 'errorMessage', 'errorRequestId', 'errorHttpCode', 'errorServiceName', 'errorType', 'fullError']);
      // 需要上报的参数字段
      var reporterKeys = params.requestResult === 'Success' ? successKeys : failureKeys;
      for (var key in params) {
        if (!reporterKeys.includes(key)) continue;
        var formattedKey = camel2underline(key);
        formattedParams[formattedKey] = params[key];
      }
      formattedParams['request_name'] = params.realApi ? transApiName(params.realApi) : params.requestName;
      return formattedParams;
    }

    // 链路追踪器
    var Tracker = /*#__PURE__*/function () {
      function Tracker(opt) {
        var _this$params;
        _classCallCheck(this, Tracker);
        var parent = opt.parent,
          traceId = opt.traceId,
          bucket = opt.bucket,
          region = opt.region,
          apiName = opt.apiName,
          realApi = opt.realApi,
          httpMethod = opt.httpMethod,
          fileKey = opt.fileKey,
          fileSize = opt.fileSize,
          accelerate = opt.accelerate,
          customId = opt.customId,
          delay = opt.delay,
          deepTracker = opt.deepTracker,
          Beacon = opt.Beacon,
          clsReporter = opt.clsReporter;
        var appid = bucket && bucket.substr(bucket.lastIndexOf('-') + 1) || '';
        this.parent = parent;
        this.deepTracker = deepTracker;
        this.delay = delay;
        if (clsReporter && !this.clsReporter) {
          this.clsReporter = clsReporter;
        }
        // 上报用到的字段
        this.params = (_this$params = {
          // 通用字段
          sdkVersionName: 'cos-wx-sdk-v5',
          sdkVersionCode: pkg.version,
          osName: deviceInfo.devicePlatform,
          networkType: '',
          requestName: apiName || '',
          requestResult: '',
          // sdk api调用结果Success、Failure
          realApi: realApi,
          bucket: bucket,
          region: region,
          accelerate: accelerate,
          httpMethod: httpMethod,
          url: '',
          host: '',
          httpDomain: '',
          requestPath: fileKey || '',
          errorType: '',
          errorCode: '',
          errorName: '',
          errorMessage: '',
          errorRequestId: '',
          errorHttpCode: 0,
          errorServiceName: '',
          errorNode: '',
          httpTookTime: 0,
          // http整体耗时
          httpSize: fileSize || 0,
          // 主要是文件大小，大小 B
          httpMd5: 0,
          // MD5耗时
          httpSign: 0,
          // 计算签名耗时
          httpFullTime: 0,
          // 任务整体耗时(包括md5、签名等)
          httpSpeed: 0,
          // 主要关注上传速度，KB/s

          size: fileSize || 0
        }, _defineProperty(_this$params, "httpMd5", 0), _defineProperty(_this$params, "httpSign", 0), _defineProperty(_this$params, "httpFull", 0), _defineProperty(_this$params, "name", apiName || ''), _defineProperty(_this$params, "tookTime", 0), _defineProperty(_this$params, "md5StartTime", 0), _defineProperty(_this$params, "md5EndTime", 0), _defineProperty(_this$params, "signStartTime", 0), _defineProperty(_this$params, "signEndTime", 0), _defineProperty(_this$params, "httpStartTime", 0), _defineProperty(_this$params, "httpEndTime", 0), _defineProperty(_this$params, "startTime", new Date().getTime()), _defineProperty(_this$params, "endTime", 0), _defineProperty(_this$params, "traceId", traceId || utils.getUid()), _defineProperty(_this$params, "appid", appid), _defineProperty(_this$params, "partNumber", 0), _defineProperty(_this$params, "httpRetryTimes", 0), _defineProperty(_this$params, "customId", customId || ''), _defineProperty(_this$params, "partTime", 0), _this$params);
        if (Beacon) {
          this.beacon = getBeacon(Beacon, delay);
        }
      }

      // 格式化sdk回调
      _createClass(Tracker, [{
        key: "formatResult",
        value: function () {
          var _formatResult = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(err, data) {
            var _err$error, _err$error$error, _err$error2, _err$error2$error, _err$error3, _err$error4, _err$error5, _err$error5$error, _err$error6;
            var now, networkType, errorCode, errorMessage, errorName, errorHttpCode, errorServiceName, requestId, errorType, isSliceUploadFile, isSliceCopyFile, speed, httpFullTime, httpTookTime, _speed, httpMd5, httpSign, exec;
            return _regeneratorRuntime().wrap(function _callee$(_context) {
              while (1) switch (_context.prev = _context.next) {
                case 0:
                  /**
                   * 解析到err的格式为:
                   * 1.服务端有返回时
                   * {
                   *  err: 同下方error,
                   *  error: {
                   *    error: {
                   *      Code: '', Message: '', Resource: '', RequestId: '', TraceId: '',
                   *    },
                   *    statusCode: xxx,
                   *    headers: {},
                   *    RequestId: '',
                   *  },
                   * }
                   * 2.本地抛出或小程序直接报错
                   * {error: 'message'}或{error: {error: 'message' }}
                   */
                  now = new Date().getTime();
                  _context.next = 3;
                  return utils.getNetType();
                case 3:
                  networkType = _context.sent;
                  errorCode = err ? (err === null || err === void 0 ? void 0 : (_err$error = err.error) === null || _err$error === void 0 ? void 0 : (_err$error$error = _err$error.error) === null || _err$error$error === void 0 ? void 0 : _err$error$error.Code) || 'Error' : '';
                  errorMessage = err ? (err === null || err === void 0 ? void 0 : (_err$error2 = err.error) === null || _err$error2 === void 0 ? void 0 : (_err$error2$error = _err$error2.error) === null || _err$error2$error === void 0 ? void 0 : _err$error2$error.Message) || (err === null || err === void 0 ? void 0 : (_err$error3 = err.error) === null || _err$error3 === void 0 ? void 0 : _err$error3.error) || (err === null || err === void 0 ? void 0 : err.error) || '' : '';
                  errorName = errorMessage;
                  errorHttpCode = err ? err === null || err === void 0 ? void 0 : (_err$error4 = err.error) === null || _err$error4 === void 0 ? void 0 : _err$error4.statusCode : data.statusCode;
                  errorServiceName = err ? err === null || err === void 0 ? void 0 : (_err$error5 = err.error) === null || _err$error5 === void 0 ? void 0 : (_err$error5$error = _err$error5.error) === null || _err$error5$error === void 0 ? void 0 : _err$error5$error.Resource : '';
                  requestId = err ? (err === null || err === void 0 ? void 0 : (_err$error6 = err.error) === null || _err$error6 === void 0 ? void 0 : _err$error6.RequestId) || '' : (data === null || data === void 0 ? void 0 : data.RequestId) || '';
                  errorType = err ? requestId ? 'Server' : 'Client' : '';
                  if (this.params.requestName === 'getObject') {
                    this.params.httpSize = data ? data.headers && data.headers['content-length'] : 0;
                  }

                  // 上报 sliceUploadFile || uploadFile || uploadFiles 命中分块上传时
                  isSliceUploadFile = this.params.realApi === 'sliceUploadFile';
                  isSliceCopyFile = this.params.realApi === 'sliceCopyFile';
                  if (isSliceUploadFile || isSliceCopyFile) {
                    speed = this.params.httpSize / 1024 / this.params.partTime;
                    Object.assign(this.params, {
                      httpSpeed: speed < 0 ? 0 : speed.toFixed(3)
                    });
                  } else {
                    httpFullTime = now - this.params.startTime;
                    httpTookTime = this.params.httpEndTime - this.params.httpStartTime;
                    _speed = this.params.httpSize / 1024 / (httpTookTime / 1000);
                    httpMd5 = this.params.md5EndTime - this.params.md5StartTime;
                    httpSign = this.params.signEndTime - this.params.signStartTime;
                    if (this.parent) {
                      this.parent.addParamValue('httpTookTime', ms2s(httpTookTime));
                      this.parent.addParamValue('httpFullTime', ms2s(httpFullTime));
                      this.parent.addParamValue('httpMd5', ms2s(httpMd5));
                      this.parent.addParamValue('httpSign', ms2s(httpSign));
                      if (['multipartUpload', 'uploadPartCopy', 'putObjectCopy'].includes(this.params.requestName)) {
                        // 只有小分块上传|复制才累计纯请求耗时，计算速度时用到
                        this.parent.addParamValue('partTime', ms2s(httpTookTime));
                      }
                    }
                    Object.assign(this.params, {
                      httpFullTime: ms2s(httpFullTime),
                      httpMd5: ms2s(httpMd5),
                      httpSign: ms2s(httpSign),
                      httpTookTime: ms2s(httpTookTime),
                      httpSpeed: _speed < 0 ? 0 : _speed.toFixed(3)
                    });
                  }
                  Object.assign(this.params, {
                    networkType: networkType,
                    requestResult: err ? 'Failure' : 'Success',
                    errorType: errorType,
                    errorCode: errorCode,
                    errorHttpCode: errorHttpCode,
                    errorName: errorName,
                    errorMessage: errorMessage,
                    errorServiceName: errorServiceName,
                    errorRequestId: requestId
                  });
                  if (err && (!errorCode || !errorMessage)) {
                    // 暂存全量err一段时间 观察是否所有err格式都可被解析
                    this.params.fullError = err ? JSON.stringify(err) : '';
                  }
                  if (this.params.name === 'getObject') {
                    this.params.size = data ? data.headers && data.headers['content-length'] : -1;
                  }
                  if (this.params.url) {
                    try {
                      exec = /^http(s)?:\/\/(.*?)\//.exec(this.params.url);
                      this.params.host = exec[2];
                    } catch (e) {
                      this.params.host = this.params.url;
                    }
                    this.params.httpDomain = this.params.host;
                  }
                case 19:
                case "end":
                  return _context.stop();
              }
            }, _callee, this);
          }));
          function formatResult(_x, _x2) {
            return _formatResult.apply(this, arguments);
          }
          return formatResult;
        }() // 上报
      }, {
        key: "report",
        value: function () {
          var _report = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee2(err, data) {
            var formattedParams;
            return _regeneratorRuntime().wrap(function _callee2$(_context2) {
              while (1) switch (_context2.prev = _context2.next) {
                case 0:
                  if (!(!this.beacon && !this.clsReporter)) {
                    _context2.next = 2;
                    break;
                  }
                  return _context2.abrupt("return");
                case 2:
                  _context2.next = 4;
                  return this.formatResult(err, data);
                case 4:
                  formattedParams = formatParams(this.params);
                  if (this.beacon) {
                    this.sendEventsToBeacon(formattedParams);
                  }
                  if (this.clsReporter) {
                    this.sendEventsToCLS(formattedParams);
                  }
                case 7:
                case "end":
                  return _context2.stop();
              }
            }, _callee2, this);
          }));
          function report(_x3, _x4) {
            return _report.apply(this, arguments);
          }
          return report;
        }() // 设置当前链路的参数
      }, {
        key: "setParams",
        value: function setParams(params) {
          Object.assign(this.params, params);
        }
      }, {
        key: "addParamValue",
        value: function addParamValue(key, value) {
          this.params[key] = (+this.params[key] + +value).toFixed(3);
        }

        // 上报灯塔
      }, {
        key: "sendEventsToBeacon",
        value: function sendEventsToBeacon(formattedParams) {
          // DeepTracker模式下才会上报分块上传内部细节
          var isSliceUploadFile = this.params.requestName === 'sliceUploadFile' || this.params.realApi === 'sliceUploadFile';
          if (isSliceUploadFile && !this.deepTracker) {
            return;
          }
          var eventCode = 'qcloud_track_cos_sdk';
          if (this.delay === 0) {
            // 实时上报
            this.beacon && this.beacon.onDirectUserAction(eventCode, formattedParams);
          } else {
            // 周期性上报
            this.beacon && this.beacon.onUserAction(eventCode, formattedParams);
          }
        }

        // 上报 cls
      }, {
        key: "sendEventsToCLS",
        value: function sendEventsToCLS(formattedParams) {
          // 是否实时上报
          var immediate = !!(this.delay === 0);
          this.clsReporter.log(formattedParams, immediate);
        }

        // 生成子实例，与父所属一个链路，可用于分块上传内部流程上报单个分块操作
      }, {
        key: "generateSubTracker",
        value: function generateSubTracker(subParams) {
          Object.assign(subParams, {
            parent: this,
            deepTracker: this.deepTracker,
            traceId: this.params.traceId,
            bucket: this.params.bucket,
            region: this.params.region,
            accelerate: this.params.accelerate,
            fileKey: this.params.requestPath,
            customId: this.params.customId,
            delay: this.params.delay,
            clsReporter: this.clsReporter
          });
          return new Tracker(subParams);
        }
      }]);
      return Tracker;
    }();
    module.exports = Tracker;

    /***/ }),

    /***/ "./src/util.js":
    /*!*********************!*\
      !*** ./src/util.js ***!
      \*********************/
    /*! no static exports found */
    /***/ (function(module, exports, __webpack_require__) {

    "use strict";


    function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
    function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
    function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
    function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/facebook/regenerator/blob/main/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return e; }; var t, e = {}, r = Object.prototype, n = r.hasOwnProperty, o = Object.defineProperty || function (t, e, r) { t[e] = r.value; }, i = "function" == typeof Symbol ? Symbol : {}, a = i.iterator || "@@iterator", c = i.asyncIterator || "@@asyncIterator", u = i.toStringTag || "@@toStringTag"; function define(t, e, r) { return Object.defineProperty(t, e, { value: r, enumerable: !0, configurable: !0, writable: !0 }), t[e]; } try { define({}, ""); } catch (t) { define = function define(t, e, r) { return t[e] = r; }; } function wrap(t, e, r, n) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype), c = new Context(n || []); return o(a, "_invoke", { value: makeInvokeMethod(t, r, c) }), a; } function tryCatch(t, e, r) { try { return { type: "normal", arg: t.call(e, r) }; } catch (t) { return { type: "throw", arg: t }; } } e.wrap = wrap; var h = "suspendedStart", l = "suspendedYield", f = "executing", s = "completed", y = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var p = {}; define(p, a, function () { return this; }); var d = Object.getPrototypeOf, v = d && d(d(values([]))); v && v !== r && n.call(v, a) && (p = v); var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p); function defineIteratorMethods(t) { ["next", "throw", "return"].forEach(function (e) { define(t, e, function (t) { return this._invoke(e, t); }); }); } function AsyncIterator(t, e) { function invoke(r, o, i, a) { var c = tryCatch(t[r], t, o); if ("throw" !== c.type) { var u = c.arg, h = u.value; return h && "object" == _typeof(h) && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) { invoke("next", t, i, a); }, function (t) { invoke("throw", t, i, a); }) : e.resolve(h).then(function (t) { u.value = t, i(u); }, function (t) { return invoke("throw", t, i, a); }); } a(c.arg); } var r; o(this, "_invoke", { value: function value(t, n) { function callInvokeWithMethodAndArg() { return new e(function (e, r) { invoke(t, n, e, r); }); } return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg(); } }); } function makeInvokeMethod(e, r, n) { var o = h; return function (i, a) { if (o === f) throw Error("Generator is already running"); if (o === s) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var c = n.delegate; if (c) { var u = maybeInvokeDelegate(c, n); if (u) { if (u === y) continue; return u; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (o === h) throw o = s, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = f; var p = tryCatch(e, r, n); if ("normal" === p.type) { if (o = n.done ? s : l, p.arg === y) continue; return { value: p.arg, done: n.done }; } "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg); } }; } function maybeInvokeDelegate(e, r) { var n = r.method, o = e.iterator[n]; if (o === t) return r.delegate = null, "throw" === n && e.iterator["return"] && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y; var i = tryCatch(o, e.iterator, r.arg); if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y; var a = i.arg; return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y); } function pushTryEntry(t) { var e = { tryLoc: t[0] }; 1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e); } function resetTryEntry(t) { var e = t.completion || {}; e.type = "normal", delete e.arg, t.completion = e; } function Context(t) { this.tryEntries = [{ tryLoc: "root" }], t.forEach(pushTryEntry, this), this.reset(!0); } function values(e) { if (e || "" === e) { var r = e[a]; if (r) return r.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) { var o = -1, i = function next() { for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next; return next.value = t, next.done = !0, next; }; return i.next = i; } } throw new TypeError(_typeof(e) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", { value: GeneratorFunctionPrototype, configurable: !0 }), o(GeneratorFunctionPrototype, "constructor", { value: GeneratorFunction, configurable: !0 }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) { var e = "function" == typeof t && t.constructor; return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name)); }, e.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t; }, e.awrap = function (t) { return { __await: t }; }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () { return this; }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(wrap(t, r, n, o), i); return e.isGeneratorFunction(r) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () { return this; }), define(g, "toString", function () { return "[object Generator]"; }), e.keys = function (t) { var e = Object(t), r = []; for (var n in e) r.push(n); return r.reverse(), function next() { for (; r.length;) { var t = r.pop(); if (t in e) return next.value = t, next.done = !1, next; } return next.done = !0, next; }; }, e.values = values, Context.prototype = { constructor: Context, reset: function reset(e) { if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0].completion; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(e) { if (this.done) throw e; var r = this; function handle(n, o) { return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o; } for (var o = this.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i.completion; if ("root" === i.tryLoc) return handle("end"); if (i.tryLoc <= this.prev) { var c = n.call(i, "catchLoc"), u = n.call(i, "finallyLoc"); if (c && u) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } else if (c) { if (this.prev < i.catchLoc) return handle(i.catchLoc, !0); } else { if (!u) throw Error("try statement without catch or finally"); if (this.prev < i.finallyLoc) return handle(i.finallyLoc); } } } }, abrupt: function abrupt(t, e) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var o = this.tryEntries[r]; if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) { var i = o; break; } } i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null); var a = i ? i.completion : {}; return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a); }, complete: function complete(t, e) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y; }, finish: function finish(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y; } }, "catch": function _catch(t) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var r = this.tryEntries[e]; if (r.tryLoc === t) { var n = r.completion; if ("throw" === n.type) { var o = n.arg; resetTryEntry(r); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(e, r, n) { return this.delegate = { iterator: values(e), resultName: r, nextLoc: n }, "next" === this.method && (this.arg = t), y; } }, e; }
    function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
    function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
    function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
    var md5 = __webpack_require__(/*! ../lib/md5 */ "./lib/md5.js");
    var CryptoJS = __webpack_require__(/*! ../lib/crypto */ "./lib/crypto.js");
    var base64 = __webpack_require__(/*! ../lib/base64 */ "./lib/base64.js");
    var btoa = base64.btoa;
    var wxfs = wx.getFileSystemManager();
    var Tracker = __webpack_require__(/*! ./tracker */ "./src/tracker.js");
    var _require = __webpack_require__(/*! fast-xml-parser */ "./node_modules/fast-xml-parser/src/fxp.js"),
      XMLParser = _require.XMLParser,
      XMLBuilder = _require.XMLBuilder;
    var xmlParser = new XMLParser({
      ignoreDeclaration: true,
      // 忽略 XML 声明
      ignoreAttributes: true,
      // 忽略属性
      parseTagValue: false,
      // 关闭自动解析
      trimValues: false // 关闭默认 trim
    });
    var xmlBuilder = new XMLBuilder();

    // 删掉不需要的#text
    var textNodeName = '#text';
    var deleteTextNodes = function deleteTextNodes(obj) {
      if (!isObject(obj)) return;
      for (var i in obj) {
        var item = obj[i];
        if (typeof item === 'string') {
          if (i === textNodeName) {
            delete obj[i];
          }
        } else if (Array.isArray(item)) {
          item.forEach(function (i) {
            deleteTextNodes(i);
          });
        } else if (isObject(item)) {
          deleteTextNodes(item);
        }
      }
    };

    // XML 对象转 JSON 对象
    var xml2json = function xml2json(bodyStr) {
      var json = xmlParser.parse(bodyStr);
      deleteTextNodes(json);
      return json;
    };

    // JSON 对象转 XML 对象
    var json2xml = function json2xml(json) {
      var xml = xmlBuilder.build(json);
      return xml;
    };
    function camSafeUrlEncode(str) {
      return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A');
    }
    function getObjectKeys(obj, forKey) {
      var list = [];
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          list.push(forKey ? camSafeUrlEncode(key).toLowerCase() : key);
        }
      }
      return list.sort(function (a, b) {
        a = a.toLowerCase();
        b = b.toLowerCase();
        return a === b ? 0 : a > b ? 1 : -1;
      });
    }

    /**
     * obj转为string
     * @param  {Object}  obj                需要转的对象，必须
     * @param  {Boolean} lowerCaseKey       key是否转为小写，默认false，非必须
     * @return {String}  data               返回字符串
     */
    var obj2str = function obj2str(obj, lowerCaseKey) {
      var i, key, val;
      var list = [];
      var keyList = getObjectKeys(obj);
      for (i = 0; i < keyList.length; i++) {
        key = keyList[i];
        val = obj[key] === undefined || obj[key] === null ? '' : '' + obj[key];
        key = lowerCaseKey ? camSafeUrlEncode(key).toLowerCase() : camSafeUrlEncode(key);
        val = camSafeUrlEncode(val) || '';
        list.push(key + '=' + val);
      }
      return list.join('&');
    };

    // 可以签入签名的headers
    var signHeaders = ['cache-control', 'content-disposition', 'content-encoding', 'content-length', 'content-md5', 'content-type', 'expect', 'expires', 'host', 'if-match', 'if-modified-since', 'if-none-match', 'if-unmodified-since', 'origin', 'range', 'transfer-encoding', 'pic-operations'];
    var getSignHeaderObj = function getSignHeaderObj(headers) {
      var signHeaderObj = {};
      for (var i in headers) {
        var key = i.toLowerCase();
        if (key.indexOf('x-cos-') > -1 || key.indexOf('x-ci-') > -1 || signHeaders.indexOf(key) > -1) {
          signHeaderObj[i] = headers[i];
        }
      }
      return signHeaderObj;
    };

    //测试用的key后面可以去掉
    var getAuth = function getAuth(opt) {
      opt = opt || {};
      var SecretId = opt.SecretId;
      var SecretKey = opt.SecretKey;
      var KeyTime = opt.KeyTime;
      var method = (opt.method || opt.Method || 'get').toLowerCase();
      var queryParams = clone(opt.Query || opt.params || {});
      var headers = getSignHeaderObj(clone(opt.Headers || opt.headers || {}));
      var Key = opt.Key || '';
      var pathname;
      if (opt.UseRawKey) {
        pathname = opt.Pathname || opt.pathname || '/' + Key;
      } else {
        pathname = opt.Pathname || opt.pathname || Key;
        pathname.indexOf('/') !== 0 && (pathname = '/' + pathname);
      }

      // ForceSignHost明确传入false才不加入host签名
      var forceSignHost = opt.ForceSignHost === false ? false : true;

      // 如果有传入存储桶，那么签名默认加 Host 参与计算，避免跨桶访问
      if (!headers.Host && !headers.host && opt.Bucket && opt.Region && forceSignHost) headers.Host = opt.Bucket + '.cos.' + opt.Region + '.myqcloud.com';
      if (!SecretId) return console.error('missing param SecretId');
      if (!SecretKey) return console.error('missing param SecretKey');

      // 签名有效起止时间
      var now = Math.round(getSkewTime(opt.SystemClockOffset) / 1000) - 1;
      var exp = now;
      var Expires = opt.Expires || opt.expires;
      if (Expires === undefined) {
        exp += 900; // 签名过期时间为当前 + 900s
      } else {
        exp += Expires * 1 || 0;
      }

      // 要用到的 Authorization 参数列表
      var qSignAlgorithm = 'sha1';
      var qAk = SecretId;
      var qSignTime = KeyTime || now + ';' + exp;
      var qKeyTime = KeyTime || now + ';' + exp;
      var qHeaderList = getObjectKeys(headers, true).join(';').toLowerCase();
      var qUrlParamList = getObjectKeys(queryParams, true).join(';').toLowerCase();

      // 签名算法说明文档：https://www.qcloud.com/document/product/436/7778
      // 步骤一：计算 SignKey
      var signKey = CryptoJS.HmacSHA1(qKeyTime, SecretKey).toString();

      // 步骤二：构成 FormatString
      var formatString = [method, pathname, util.obj2str(queryParams, true), util.obj2str(headers, true), ''].join('\n');

      // 步骤三：计算 StringToSign
      var stringToSign = ['sha1', qSignTime, CryptoJS.SHA1(formatString).toString(), ''].join('\n');

      // 步骤四：计算 Signature
      var qSignature = CryptoJS.HmacSHA1(stringToSign, signKey).toString();

      // 步骤五：构造 Authorization
      var authorization = ['q-sign-algorithm=' + qSignAlgorithm, 'q-ak=' + qAk, 'q-sign-time=' + qSignTime, 'q-key-time=' + qKeyTime, 'q-header-list=' + qHeaderList, 'q-url-param-list=' + qUrlParamList, 'q-signature=' + qSignature].join('&');
      return authorization;
    };
    var getSourceParams = function getSourceParams(source) {
      var parser = this.options.CopySourceParser;
      if (parser) return parser(source);
      var m = source.match(/^([^.]+-\d+)\.cos(v6|-cdc|-internal)?\.([^.]+)\.((myqcloud\.com)|(tencentcos\.cn))\/(.+)$/);
      if (!m) return null;
      return {
        Bucket: m[1],
        Region: m[3],
        Key: m[7]
      };
    };
    var noop = function noop() {};

    // 清除对象里值为的 undefined 或 null 的属性
    var clearKey = function clearKey(obj) {
      var retObj = {};
      for (var key in obj) {
        if (obj.hasOwnProperty(key) && obj[key] !== undefined && obj[key] !== null) {
          retObj[key] = obj[key];
        }
      }
      return retObj;
    };

    // 获取文件分片
    var fileSlice = function fileSlice(FilePath, start, end, callback) {
      if (FilePath) {
        wxfs.readFile({
          filePath: FilePath,
          position: start,
          length: end - start,
          success: function success(res) {
            callback(res.data);
          },
          fail: function fail() {
            callback(null);
          }
        });
      } else {
        callback(null);
      }
    };

    // 获取文件内容的 MD5
    var getBodyMd5 = function getBodyMd5(UploadCheckContentMd5, Body, callback) {
      callback = callback || noop;
      if (UploadCheckContentMd5) {
        if (Body && Body instanceof ArrayBuffer) {
          util.getFileMd5(Body, function (err, md5) {
            callback(md5);
          });
        } else {
          callback();
        }
      } else {
        callback();
      }
    };

    // 获取文件 md5 值
    var getFileMd5 = function getFileMd5(body, callback) {
      var hash = md5(body);
      callback && callback(hash);
      return hash;
    };
    function clone(obj) {
      return map(obj, function (v) {
        return _typeof(v) === 'object' && v !== null ? clone(v) : v;
      });
    }
    function attr(obj, name, defaultValue) {
      return obj && name in obj ? obj[name] : defaultValue;
    }
    function extend(target, source) {
      each(source, function (val, key) {
        target[key] = source[key];
      });
      return target;
    }
    function isArray(arr) {
      return arr instanceof Array;
    }
    function isObject(obj) {
      return Object.prototype.toString.call(obj) === '[object Object]';
    }
    function isInArray(arr, item) {
      var flag = false;
      for (var i = 0; i < arr.length; i++) {
        if (item === arr[i]) {
          flag = true;
          break;
        }
      }
      return flag;
    }
    function makeArray(arr) {
      return isArray(arr) ? arr : [arr];
    }
    function each(obj, fn) {
      for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
          fn(obj[i], i);
        }
      }
    }
    function map(obj, fn) {
      var o = isArray(obj) ? [] : {};
      for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
          o[i] = fn(obj[i], i);
        }
      }
      return o;
    }
    function filter(obj, fn) {
      var iaArr = isArray(obj);
      var o = iaArr ? [] : {};
      for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
          if (fn(obj[i], i)) {
            if (iaArr) {
              o.push(obj[i]);
            } else {
              o[i] = obj[i];
            }
          }
        }
      }
      return o;
    }
    var binaryBase64 = function binaryBase64(str) {
      var i,
        len,
        _char,
        res = '';
      for (i = 0, len = str.length / 2; i < len; i++) {
        _char = parseInt(str[i * 2] + str[i * 2 + 1], 16);
        res += String.fromCharCode(_char);
      }
      return btoa(res);
    };
    var uuid = function uuid() {
      var S4 = function S4() {
        return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
      };
      return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4();
    };
    var hasMissingParams = function hasMissingParams(apiName, params) {
      var Bucket = params.Bucket;
      var Region = params.Region;
      var Key = params.Key;
      if (apiName.indexOf('Bucket') > -1 || apiName === 'deleteMultipleObject' || apiName === 'multipartList' || apiName === 'listObjectVersions') {
        if (!Bucket) return 'Bucket';
        if (!Region) return 'Region';
      } else if (apiName.indexOf('Object') > -1 || apiName.indexOf('multipart') > -1 || apiName === 'sliceUploadFile' || apiName === 'abortUploadTask' || apiName === 'uploadFile') {
        if (!Bucket) return 'Bucket';
        if (!Region) return 'Region';
        if (!Key) return 'Key';
      }
      return false;
    };
    var formatParams = function formatParams(apiName, params) {
      // 复制参数对象
      params = extend({}, params);

      // 统一处理 Headers
      if (apiName !== 'getAuth' && apiName !== 'getV4Auth' && apiName !== 'getObjectUrl') {
        var Headers = params.Headers || {};
        if (params && _typeof(params) === 'object') {
          (function () {
            for (var key in params) {
              if (params.hasOwnProperty(key) && key.indexOf('x-cos-') > -1) {
                Headers[key] = params[key];
              }
            }
          })();
          var headerMap = {
            // params headers
            'x-cos-mfa': 'MFA',
            'Content-MD5': 'ContentMD5',
            'Content-Length': 'ContentLength',
            'Content-Type': 'ContentType',
            Expect: 'Expect',
            Expires: 'Expires',
            'Cache-Control': 'CacheControl',
            'Content-Disposition': 'ContentDisposition',
            'Content-Encoding': 'ContentEncoding',
            Range: 'Range',
            'If-Modified-Since': 'IfModifiedSince',
            'If-Unmodified-Since': 'IfUnmodifiedSince',
            'If-Match': 'IfMatch',
            'If-None-Match': 'IfNoneMatch',
            'x-cos-copy-source': 'CopySource',
            'x-cos-copy-source-Range': 'CopySourceRange',
            'x-cos-metadata-directive': 'MetadataDirective',
            'x-cos-copy-source-If-Modified-Since': 'CopySourceIfModifiedSince',
            'x-cos-copy-source-If-Unmodified-Since': 'CopySourceIfUnmodifiedSince',
            'x-cos-copy-source-If-Match': 'CopySourceIfMatch',
            'x-cos-copy-source-If-None-Match': 'CopySourceIfNoneMatch',
            'x-cos-acl': 'ACL',
            'x-cos-grant-read': 'GrantRead',
            'x-cos-grant-write': 'GrantWrite',
            'x-cos-grant-full-control': 'GrantFullControl',
            'x-cos-grant-read-acp': 'GrantReadAcp',
            'x-cos-grant-write-acp': 'GrantWriteAcp',
            'x-cos-storage-class': 'StorageClass',
            'x-cos-traffic-limit': 'TrafficLimit',
            'x-cos-mime-limit': 'MimeLimit',
            'x-cos-forbid-overwrite': 'ForbidOverwrite',
            // SSE-C
            'x-cos-server-side-encryption-customer-algorithm': 'SSECustomerAlgorithm',
            'x-cos-server-side-encryption-customer-key': 'SSECustomerKey',
            'x-cos-server-side-encryption-customer-key-MD5': 'SSECustomerKeyMD5',
            // SSE-COS、SSE-KMS
            'x-cos-server-side-encryption': 'ServerSideEncryption',
            'x-cos-server-side-encryption-cos-kms-key-id': 'SSEKMSKeyId',
            'x-cos-server-side-encryption-context': 'SSEContext',
            // 上传时图片处理
            'Pic-Operations': 'PicOperations'
          };
          util.each(headerMap, function (paramKey, headerKey) {
            if (params[paramKey] !== undefined) {
              Headers[headerKey] = params[paramKey];
            }
          });
          params.Headers = clearKey(Headers);
        }
      }
      return params;
    };
    var apiWrapper = function apiWrapper(apiName, apiFn) {
      return function (params, callback) {
        var self = this;

        // 处理参数
        if (typeof params === 'function') {
          callback = params;
          params = {};
        }

        // 整理参数格式
        params = formatParams(apiName, params);

        // tracker传递
        var tracker;
        if (self.options.EnableReporter) {
          if (params.calledBySdk === 'sliceUploadFile' || params.calledBySdk === 'sliceCopyFile') {
            // 分块上传内部方法使用sliceUploadFile的子链路
            tracker = params.tracker && params.tracker.generateSubTracker({
              apiName: apiName
            });
          } else if (['uploadFile', 'uploadFiles'].includes(apiName)) {
            // uploadFile、uploadFiles方法在内部处理，此处不处理
            tracker = null;
          } else {
            var fileSize = 0;
            if (params.Body) {
              fileSize = typeof params.Body === 'string' ? params.Body.length : params.Body.size || params.Body.byteLength || 0;
            }
            var accelerate = self.options.UseAccelerate || typeof self.options.Domain === 'string' && self.options.Domain.includes('accelerate.');
            tracker = new Tracker({
              Beacon: self.options.BeaconReporter,
              clsReporter: self.options.ClsReporter,
              bucket: params.Bucket,
              region: params.Region,
              apiName: apiName,
              realApi: apiName,
              accelerate: accelerate,
              fileKey: params.Key,
              fileSize: fileSize,
              deepTracker: self.options.DeepTracker,
              customId: self.options.CustomId,
              delay: self.options.TrackerDelay
            });
          }
        }
        params.tracker = tracker;

        // 代理回调函数
        var formatResult = function formatResult(result) {
          if (result && result.headers) {
            result.headers['x-ci-request-id'] && (result.RequestId = result.headers['x-ci-request-id']);
            result.headers['x-cos-request-id'] && (result.RequestId = result.headers['x-cos-request-id']);
            result.headers['x-cos-version-id'] && (result.VersionId = result.headers['x-cos-version-id']);
            result.headers['x-cos-delete-marker'] && (result.DeleteMarker = result.headers['x-cos-delete-marker']);
          }
          return result;
        };
        var _callback = function _callback(err, data) {
          // 格式化上报参数并上报
          tracker && tracker.report(err, data);
          callback && callback(formatResult(err), formatResult(data));
        };
        var checkParams = function checkParams() {
          if (apiName !== 'getService' && apiName !== 'abortUploadTask') {
            // 判断参数是否完整
            var missingResult = hasMissingParams(apiName, params);
            if (missingResult) {
              return 'missing param ' + missingResult;
            }
            // 判断 region 格式
            if (params.Region) {
              if (params.Region.indexOf('cos.') > -1) {
                return 'param Region should not be start with "cos."';
              } else if (!/^([a-z\d-]+)$/.test(params.Region)) {
                return 'Region format error.';
              }
              // 判断 region 格式
              if (!self.options.CompatibilityMode && params.Region.indexOf('-') === -1 && params.Region !== 'yfb' && params.Region !== 'default' && params.Region !== 'accelerate') {
                console.warn('warning: param Region format error, find help here: https://cloud.tencent.com/document/product/436/6224');
              }
            }
            // 兼容不带 AppId 的 Bucket
            if (params.Bucket) {
              if (!/^([a-z\d-]+)-(\d+)$/.test(params.Bucket)) {
                if (params.AppId) {
                  params.Bucket = params.Bucket + '-' + params.AppId;
                } else if (self.options.AppId) {
                  params.Bucket = params.Bucket + '-' + self.options.AppId;
                } else {
                  return 'Bucket should format as "test-1250000000".';
                }
              }
              if (params.AppId) {
                console.warn('warning: AppId has been deprecated, Please put it at the end of parameter Bucket(E.g Bucket:"test-1250000000" ).');
                delete params.AppId;
              }
            }
            // 如果 Key 是 / 开头，强制去掉第一个 /
            if (params.Key && params.Key.substr(0, 1) === '/') {
              params.Key = params.Key.substr(1);
            }
          }
        };
        var errMsg = checkParams();
        var isSync = ['getAuth', 'getObjectUrl'].includes(apiName);
        if (!isSync && !callback) {
          return new Promise(function (resolve, reject) {
            callback = function callback(err, data) {
              err ? reject(err) : resolve(data);
            };
            if (errMsg) return _callback({
              error: errMsg
            });
            apiFn.call(self, params, _callback);
          });
        } else {
          if (errMsg) return _callback({
            error: errMsg
          });
          var res = apiFn.call(self, params, _callback);
          if (isSync) return res;
        }
      };
    };
    var throttleOnProgress = function throttleOnProgress(total, onProgress) {
      var self = this;
      var size0 = 0;
      var size1 = 0;
      var time0 = Date.now();
      var time1;
      var timer;
      function update() {
        timer = 0;
        if (onProgress && typeof onProgress === 'function') {
          time1 = Date.now();
          var speed = Math.max(0, Math.round((size1 - size0) / ((time1 - time0) / 1000) * 100) / 100) || 0;
          var percent;
          if (size1 === 0 && total === 0) {
            percent = 1;
          } else {
            percent = Math.floor(size1 / total * 100) / 100 || 0;
          }
          time0 = time1;
          size0 = size1;
          try {
            onProgress({
              loaded: size1,
              total: total,
              speed: speed,
              percent: percent
            });
          } catch (e) {}
        }
      }
      return function (info, immediately) {
        if (info) {
          size1 = info.loaded;
          total = info.total;
        }
        if (immediately) {
          clearTimeout(timer);
          update();
        } else {
          if (timer) return;
          timer = setTimeout(update, self.options.ProgressInterval);
        }
      };
    };

    // 通过FilePath获取上传文件的内容
    var getFileBody = function getFileBody(FilePath) {
      return new Promise(function (resolve, reject) {
        wxfs.readFile({
          filePath: FilePath,
          success: function success(res) {
            resolve(res.data);
          },
          fail: function fail(res) {
            reject((res === null || res === void 0 ? void 0 : res.errMsg) || '');
          }
        });
      });
    };
    var getFileSize = /*#__PURE__*/function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/_regeneratorRuntime().mark(function _callee(api, params, callback) {
        return _regeneratorRuntime().wrap(function _callee$(_context) {
          while (1) switch (_context.prev = _context.next) {
            case 0:
              if (!(api === 'postObject')) {
                _context.next = 4;
                break;
              }
              callback();
              _context.next = 21;
              break;
            case 4:
              if (!(api === 'putObject')) {
                _context.next = 20;
                break;
              }
              if (!(params.Body === undefined && params.FilePath)) {
                _context.next = 17;
                break;
              }
              _context.prev = 6;
              _context.next = 9;
              return getFileBody(params.FilePath);
            case 9:
              params.Body = _context.sent;
              _context.next = 17;
              break;
            case 12:
              _context.prev = 12;
              _context.t0 = _context["catch"](6);
              params.Body = undefined;
              callback({
                error: "readFile error, ".concat(_context.t0)
              });
              return _context.abrupt("return");
            case 17:
              if (params.Body !== undefined) {
                params.ContentLength = params.Body.byteLength;
                callback(null, params.ContentLength);
              } else {
                callback({
                  error: 'missing param Body'
                });
              }
              _context.next = 21;
              break;
            case 20:
              if (params.FilePath) {
                wxfs.stat({
                  path: params.FilePath,
                  success: function success(res) {
                    var stats = res.stats;
                    params.FileStat = stats;
                    params.FileStat.FilePath = params.FilePath;
                    var size = stats.isDirectory() ? 0 : stats.size;
                    params.ContentLength = size = size || 0;
                    callback(null, size);
                  },
                  fail: function fail(err) {
                    callback(err);
                  }
                });
              } else {
                callback({
                  error: 'missing param FilePath'
                });
              }
            case 21:
            case "end":
              return _context.stop();
          }
        }, _callee, null, [[6, 12]]);
      }));
      return function getFileSize(_x, _x2, _x3) {
        return _ref.apply(this, arguments);
      };
    }();

    // 通过FilePath获取上传文件的大小
    var getFileSizeByPath = function getFileSizeByPath(filePath) {
      return new Promise(function (resolve, reject) {
        wxfs.stat({
          path: filePath,
          success: function success(res) {
            var stats = res.stats;
            var size = stats.isDirectory() ? 0 : stats.size;
            resolve(size);
          },
          fail: function fail(res) {
            reject((res === null || res === void 0 ? void 0 : res.errMsg) || '');
          }
        });
      });
    };
    var getSkewTime = function getSkewTime(offset) {
      return Date.now() + (offset || 0);
    };
    var compareVersion = function compareVersion(v1, v2) {
      if (!v1 || !v2) return -1;
      v1 = v1.split('.');
      v2 = v2.split('.');
      var len = Math.max(v1.length, v2.length);
      while (v1.length < len) {
        v1.push('0');
      }
      while (v2.length < len) {
        v2.push('0');
      }
      for (var i = 0; i < len; i++) {
        var num1 = parseInt(v1[i]);
        var num2 = parseInt(v2[i]);
        if (num1 > num2) {
          return 1;
        } else if (num1 < num2) {
          return -1;
        }
      }
      return 0;
    };
    var canFileSlice = function () {
      var appBaseInfo = {};
      var deviceInfo = {};
      if (wx.canIUse('getAppBaseInfo')) {
        appBaseInfo = wx.getAppBaseInfo() || {};
      }
      if (wx.canIUse('getDeviceInfo')) {
        deviceInfo = wx.getDeviceInfo() || {};
      }
      var sdkVersion = appBaseInfo.SDKVersion;
      var platform = deviceInfo.platform;
      var support = compareVersion(sdkVersion, '2.10.0') >= 0;
      var needWarning = !support && platform === 'devtools';
      return function () {
        if (needWarning) console.warn('当前小程序版本小于 2.10.0，不支持分片上传，请更新软件。');
        needWarning = false;
        return support;
      };
    }();
    var isCIHost = function isCIHost(url) {
      return /^https?:\/\/([^/]+\.)?ci\.[^/]+/.test(url);
    };
    var error = function error(err, opt) {
      var sourceErr = err;
      err.message = err.message || null;
      if (typeof opt === 'string') {
        err.error = opt;
        err.message = opt;
      } else if (_typeof(opt) === 'object' && opt !== null) {
        extend(err, opt);
        if (opt.code || opt.name) err.code = opt.code || opt.name;
        if (opt.message) err.message = opt.message;
        if (opt.stack) err.stack = opt.stack;
      }
      if (typeof Object.defineProperty === 'function') {
        Object.defineProperty(err, 'name', {
          writable: true,
          enumerable: false
        });
        Object.defineProperty(err, 'message', {
          enumerable: true
        });
      }
      err.name = opt && opt.name || err.name || err.code || 'Error';
      if (!err.code) err.code = err.name;
      if (!err.error) err.error = clone(sourceErr); // 兼容老的错误格式

      return err;
    };
    var encodeBase64 = function encodeBase64(str, safe) {
      var base64Str = base64.encode(str);
      // 万象使用的安全base64格式需要特殊处理
      if (safe) {
        base64Str = base64Str.replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
      }
      return base64Str;
    };
    var simplifyPath = function simplifyPath(path) {
      var names = path.split('/');
      var stack = [];
      var _iterator = _createForOfIteratorHelper(names),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var name = _step.value;
          if (name === '..') {
            if (stack.length) {
              stack.pop();
            }
          } else if (name.length && name !== '.') {
            stack.push(name);
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      return '/' + stack.join('/');
    };

    // 将ArrayBuffer转换为字符串
    var arrayBufferToString = function arrayBufferToString(arrayBuffer) {
      var decoder = new TextDecoder('utf-8');
      return decoder.decode(arrayBuffer);
    };

    // 解析响应体，兼容 xml、json
    var parseResBody = function parseResBody(responseBody) {
      var json;
      if (responseBody && typeof responseBody === 'string') {
        var trimBody = responseBody.trim();
        var isXml = trimBody.indexOf('<') === 0;
        var isJson = trimBody.indexOf('{') === 0;
        if (isXml) {
          // xml 解析，解析失败返回{}
          json = util.xml2json(responseBody) || {};
        } else if (isJson) {
          // json解析，解析失败返回原始 Body
          try {
            // 替换 json 中的换行符为空格，否则解析会出错
            var formatBody = responseBody.replace(/\n/g, ' ');
            var parsedBody = JSON.parse(formatBody);
            // 确保解析出 json 对象
            if (Object.prototype.toString.call(parsedBody) === '[object Object]') {
              json = parsedBody;
            } else {
              json = responseBody;
            }
          } catch (e) {
            json = responseBody;
          }
        } else {
          json = responseBody;
        }
      } else {
        json = responseBody || {};
      }
      return json;
    };
    var util = {
      noop: noop,
      formatParams: formatParams,
      apiWrapper: apiWrapper,
      xml2json: xml2json,
      json2xml: json2xml,
      md5: md5,
      clearKey: clearKey,
      fileSlice: fileSlice,
      getBodyMd5: getBodyMd5,
      getFileMd5: getFileMd5,
      binaryBase64: binaryBase64,
      extend: extend,
      isArray: isArray,
      isInArray: isInArray,
      makeArray: makeArray,
      each: each,
      map: map,
      filter: filter,
      clone: clone,
      attr: attr,
      uuid: uuid,
      camSafeUrlEncode: camSafeUrlEncode,
      throttleOnProgress: throttleOnProgress,
      getFileSize: getFileSize,
      getFileSizeByPath: getFileSizeByPath,
      getSkewTime: getSkewTime,
      obj2str: obj2str,
      getAuth: getAuth,
      compareVersion: compareVersion,
      canFileSlice: canFileSlice,
      isCIHost: isCIHost,
      error: error,
      getSourceParams: getSourceParams,
      encodeBase64: encodeBase64,
      simplifyPath: simplifyPath,
      arrayBufferToString: arrayBufferToString,
      parseResBody: parseResBody
    };
    module.exports = util;

    /***/ })

    /******/ });
    });
;
    /**
     * COS 附件：主上报成功后读路径、zip、直传 COS。依赖 globalThis.__crashSightCosDeps。
     * cos-wx-sdk 顶层会调用 wx.getFileSystemManager()，QQ 小游戏和没有 wx 的环境不加载。
     */
    function tryRegisterCosFromRequire() {
      if (typeof qq !== 'undefined' || typeof wx === 'undefined' || typeof require !== 'function') {
        return
      }
      const pickCtor = function (m) {
        if (!m) return null
        if (typeof m === 'function') return m
        if (m.COS && typeof m.COS === 'function') return m.COS
        if (m.default && typeof m.default === 'function') return m.default
        if (m.default && m.default.COS && typeof m.default.COS === 'function') return m.default.COS
        return null
      }
      let C = null
      try {
        C = pickCtor(require('./cos-wx-sdk-v5.js'))
      } catch (e) {
        try {
          C = pickCtor(require('cos-wx-sdk-v5'))
        } catch (e2) {}
      }
      if (C && typeof globalThis !== 'undefined') {
        globalThis.COS = globalThis.COS || C
      }
    }
    tryRegisterCosFromRequire()

    function cosResolveCtor() {
      const gCtor =
        typeof globalThis !== 'undefined' && globalThis.__crashSightCosCtor
          ? globalThis.__crashSightCosCtor
          : null
      if (gCtor && typeof gCtor === 'function') return gCtor
      if (typeof window !== 'undefined' && window.COS && typeof window.COS === 'function') return window.COS
      if (typeof globalThis !== 'undefined' && globalThis.COS && typeof globalThis.COS === 'function') {
        return globalThis.COS
      }
      if (typeof wx !== 'undefined' && wx.COS && typeof wx.COS === 'function') {
        return wx.COS
      }
      return null
    }

    const g = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this

    function cosDbg(msg) {
      console.log('[CrashSight][CosAttach] ' + msg)
    }

    let cosToken = null
    const COS_BLOCK = 1048576
    const TRY_DELAY_MS = 500

    function deps() {
      return g.__crashSightCosDeps || {}
    }

    function pick(vm, k) {
      if (!vm || typeof vm !== 'object') return ''
      if (vm[k] != null && vm[k] !== '') return String(vm[k])
      const lk = k.toLowerCase()
      for (const p in vm) {
        if (Object.prototype.hasOwnProperty.call(vm, p) && p.toLowerCase() === lk) {
          return String(vm[p])
        }
      }
      return ''
    }

    function applyTokenFromValueMap(vm) {
      const bucket = pick(vm, 'bucket')
      const region = pick(vm, 'region')
      const domain = pick(vm, 'domain')
      const tmpSecretId = pick(vm, 'tmpSecretId')
      const tmpSecretKey = pick(vm, 'tmpSecretKey')
      const sessionToken = pick(vm, 'sessionToken')
      if (!bucket || !region || !domain || !tmpSecretId || !tmpSecretKey || !sessionToken) {
        const miss = []
        if (!bucket) miss.push('bucket')
        if (!region) miss.push('region')
        if (!domain) miss.push('domain')
        if (!tmpSecretId) miss.push('tmpSecretId')
        if (!tmpSecretKey) miss.push('tmpSecretKey')
        if (!sessionToken) miss.push('sessionToken')
        cosDbg('token: skip apply (valueMap incomplete), missing: ' + miss.join(', '))
        return
      }
      const vendor = parseInt(pick(vm, 'vendor') || '0', 10) || 0
      const startTime = parseInt(pick(vm, 'startTime') || '0', 10) || 0
      const expiredTime = parseInt(pick(vm, 'expiredTime') || '0', 10) || 0
      const serverTime = pick(vm, 'serverTime')
      let gap = 0
      if (serverTime) {
        try {
          gap = parseInt(serverTime, 10) * 1000 - Date.now()
        } catch (e) {
          gap = 0
        }
      }
      cosToken = {
        bucket,
        region,
        domain,
        tmpSecretId,
        tmpSecretKey,
        sessionToken,
        vendor,
        tokenStartTime: startTime,
        tokenExpiredTime: expiredTime,
        serverClientTimeGap: gap
      }
      cosDbg(
        'token: applied bucket=' +
          bucket +
          ' region=' +
          region +
          ' domain=' +
          domain +
          ' vendor=' +
          vendor +
          ' tmpSecretIdLen=' +
          String(tmpSecretId).length +
          ' sessionTokenLen=' +
          String(sessionToken).length
      )
    }

    function resetToken() {
      cosToken = null
      cosDbg('token: cleared (reset)')
    }

    function normalizeExpUid32(recordUid) {
      if (!recordUid) return ''
      const s = String(recordUid).replace(/-/g, '').toLowerCase()
      return s.length >= 32 ? s.substr(0, 32) : s
    }

    function shortVersionFromAppVer(appVersion) {
      const md5mod = deps().md5
      if (!md5mod || typeof md5mod.md5 !== 'function') return ''
      const raw = md5mod.md5(String(appVersion || '0.0.0'), undefined, true)
      if (!raw || raw.length < 4) return ''
      let hex = ''
      for (let i = 0; i < 4; i++) {
        hex += ('0' + (raw.charCodeAt(i) & 0xff).toString(16)).slice(-2)
      }
      return hex
    }

    function customerKeysForExpUid(expUidStr) {
      const s = String(expUidStr || '')
      if (!s) return { customerKey: '', customerKeyMd5: '' }
      const d = deps()
      let customerKey = ''
      if (d.strToU8 && d.toBase64) {
        customerKey = d.toBase64(d.strToU8(s))
      } else if (typeof btoa !== 'undefined') {
        customerKey = btoa(s)
      }
      const md5mod = d.md5
      if (!md5mod || typeof md5mod.md5 !== 'function' || !d.toBase64) {
        return { customerKey, customerKeyMd5: '' }
      }
      const rawDigest = md5mod.md5(s, undefined, true)
      if (!rawDigest || rawDigest.length !== 16) {
        return { customerKey, customerKeyMd5: '' }
      }
      const digestBytes = new Uint8Array(16)
      for (let i = 0; i < 16; i++) {
        digestBytes[i] = rawDigest.charCodeAt(i) & 0xff
      }
      return { customerKey, customerKeyMd5: d.toBase64(digestBytes) }
    }

    function buildZipFromEntries(entries) {
      const d = deps()
      if (!d.zipSync) {
        cosDbg('zip: skip (zipSync not in __crashSightCosDeps)')
        return null
      }
      const files = {}
      for (let i = 0; i < entries.length; i++) {
        const name = entries[i].fileName || 'file_' + i
        files[name] = entries[i].uint8
      }
      cosDbg('zip: packing ' + entries.length + ' file(s) into zip')
      try {
        const z = d.zipSync(files, { level: 6 })
        if (z && z.byteLength) cosDbg('zip: ok bytes=' + z.byteLength)
        else cosDbg('zip: result empty or zero length')
        return z
      } catch (e) {
        console.log('[CrashSight][CosAttach] zipSync error: ' + e)
        return null
      }
    }

    function sliceBodyBuffer(zipBytes) {
      if (zipBytes.buffer) {
        return zipBytes.buffer.slice(zipBytes.byteOffset, zipBytes.byteOffset + zipBytes.byteLength)
      }
      return zipBytes
    }

    function sleep(ms) {
      return new Promise(function (r) {
        setTimeout(r, ms)
      })
    }

    function createCosClient() {
      if (!cosToken) return null
      const Ctor = cosResolveCtor()
      if (!Ctor || typeof Ctor !== 'function') {
        cosDbg('COS client: ctor missing (__crashSightCosCtor / globalThis.COS / wx.COS)')
        return null
      }
      cosDbg('COS client: ctor ok')
      return new Ctor({
        SecretId: cosToken.tmpSecretId,
        SecretKey: cosToken.tmpSecretKey,
        SecurityToken: cosToken.sessionToken
      })
    }

    function putObjectAsync(cos, params) {
      return new Promise(function (resolve, reject) {
        cos.putObject(params, function (err, data) {
          if (err) reject(err)
          else resolve(data)
        })
      })
    }

    function sliceMultipartBody(zipBytes) {
      const buf = sliceBodyBuffer(zipBytes)
      const parts = []
      const u8 = zipBytes instanceof Uint8Array ? zipBytes : new Uint8Array(buf)
      for (let off = 0; off < u8.length; off += COS_BLOCK) {
        parts.push(u8.subarray(off, Math.min(off + COS_BLOCK, u8.length)))
      }
      return parts.length ? parts : [new Uint8Array(0)]
    }

    function uploadMultipart(cos, key, zipBytes, sseHeaders) {
      return new Promise(function (resolve, reject) {
        const parts = sliceMultipartBody(zipBytes)
        cosDbg('multipart: init key=' + key + ' parts=' + parts.length + ' totalBytes=' + zipBytes.byteLength)
        cos.multipartInit(
          { Bucket: cosToken.bucket, Region: cosToken.region, Key: key, Headers: sseHeaders },
          function (err, data) {
            if (err) {
              cosDbg('multipart: init failed')
              reject(err)
              return
            }
            const uploadId = data.UploadId
            cosDbg('multipart: init ok uploadId=' + String(uploadId || '').slice(0, 24) + '...')
            let etags = []
            function uploadPart(i) {
              if (i >= parts.length) {
                cosDbg('multipart: complete request parts=' + etags.length)
                cos.multipartComplete(
                  {
                    Bucket: cosToken.bucket,
                    Region: cosToken.region,
                    Key: key,
                    UploadId: uploadId,
                    Parts: etags
                  },
                  function (e2, d2) {
                    if (e2) {
                      cosDbg('multipart: complete failed')
                      reject(e2)
                    } else {
                      cosDbg('multipart: complete ok')
                      resolve(d2)
                    }
                  }
                )
                return
              }
              cosDbg('multipart: part ' + (i + 1) + '/' + parts.length + ' bytes=' + parts[i].byteLength)
              cos.multipartUpload(
                {
                  Bucket: cosToken.bucket,
                  Region: cosToken.region,
                  Key: key,
                  UploadId: uploadId,
                  PartNumber: i + 1,
                  Body: parts[i],
                  ContentLength: parts[i].byteLength,
                  Headers: sseHeaders
                },
                function (e1, d1) {
                  if (e1) {
                    cosDbg('multipart: part ' + (i + 1) + ' upload failed')
                    reject(e1)
                    return
                  }
                  cosDbg('multipart: part ' + (i + 1) + ' ok ETag=' + String(d1 && d1.ETag ? d1.ETag : ''))
                  etags.push({ PartNumber: i + 1, ETag: d1.ETag })
                  uploadPart(i + 1)
                }
              )
            }
            uploadPart(0)
          }
        )
      })
    }

    function tryRunPut(cos, key, zipBytes, sseHeaders) {
      const len = zipBytes && zipBytes.byteLength ? zipBytes.byteLength : 0
      if (len <= COS_BLOCK) {
        cosDbg('HTTP PUT: putObject key=' + key + ' bytes=' + len)
        return putObjectAsync(cos, {
          Bucket: cosToken.bucket,
          Region: cosToken.region,
          Key: key,
          Body: sliceBodyBuffer(zipBytes),
          ContentLength: len,
          Headers: sseHeaders
        })
      }
      cosDbg('HTTP PUT: multipart key=' + key + ' bytes=' + len + ' (block=' + COS_BLOCK + ')')
      return uploadMultipart(cos, key, zipBytes, sseHeaders)
    }

    function flushAndUpload(entries, opt) {
      if (!cosToken) {
        cosDbg('upload: abort — no cos token')
        return Promise.resolve(false)
      }
      cosDbg('upload: step 1/5 token ok bucket=' + cosToken.bucket + ' region=' + cosToken.region)
      const cos = createCosClient()
      if (!cos) {
        cosDbg('upload: abort — COS client ctor unavailable')
        return Promise.resolve(false)
      }
      cosDbg('upload: step 2/5 COS client created')
      const expUid = normalizeExpUid32(opt.expUid)
      if (!expUid) {
        cosDbg('upload: abort — bad expuid raw=' + String(opt && opt.expUid))
        return Promise.resolve(false)
      }
      cosDbg('upload: step 3/5 expUidNorm len=' + expUid.length + ' prefix16=' + expUid.substr(0, 16))
      const zipBytes = buildZipFromEntries(entries)
      if (!zipBytes || !zipBytes.byteLength) {
        cosDbg('upload: abort — empty zip')
        return Promise.resolve(false)
      }
      const shortVer = shortVersionFromAppVer(opt.appVersion)
      const appIdStr = String(opt.appId || '')
      const key = expUid.substr(0, 16) + '-' + appIdStr + '-' + shortVer + '.zip'
      cosDbg('upload: step 4/5 key=' + key + ' zipBytes=' + zipBytes.byteLength + ' appId=' + appIdStr + ' shortVer=' + shortVer)
      const ck = customerKeysForExpUid(expUid)
      if (!ck.customerKey || !ck.customerKeyMd5) {
        cosDbg('upload: warn — SSE-C keys empty (deps.md5 / strToU8 / toBase64?)')
      }
      const sseHeaders = {
        'x-cos-storage-class': 'STANDARD_IA',
        'x-cos-server-side-encryption-customer-algorithm': 'AES256',
        'x-cos-server-side-encryption-customer-key': ck.customerKey,
        'x-cos-server-side-encryption-customer-key-MD5': ck.customerKeyMd5
      }
      cosDbg('upload: step 5/5 SSE-C + STANDARD_IA headers ready')
      const tryRun = function (attemptLabel) {
        cosDbg('upload: ' + attemptLabel)
        return tryRunPut(cos, key, zipBytes, sseHeaders)
          .then(function () {
            cosDbg('upload: success key=' + key)
            console.log('[CrashSight][CosAttach] upload ok ' + key)
            return true
          })
          .catch(function (e) {
            const sc = e && typeof e.statusCode !== 'undefined' ? e.statusCode : ''
            const msg = e && (e.message || e.error || e.Message || '')
            cosDbg('upload: failed attempt=' + attemptLabel + ' statusCode=' + String(sc) + ' err=' + String(msg).slice(0, 200))
            console.log('[CrashSight][CosAttach] upload failed', e)
            return false
          })
      }
      return tryRun('attempt 1').then(function (ok) {
        if (ok) return true
        cosDbg('upload: will retry after ' + TRY_DELAY_MS + 'ms')
        return sleep(TRY_DELAY_MS).then(function () {
          return tryRun('attempt 2').then(function (ok2) {
            if (ok2) {
              cosDbg('upload: success on retry key=' + key)
              console.log('[CrashSight][CosAttach] upload ok (retry) ' + key)
            } else {
              cosDbg('upload: failed after 2 attempts key=' + key)
            }
            return ok2
          })
        })
      })
    }

    function normalizeLocalFsPath(p) {
      const s = String(p || '').trim().replace(/\\/g, '/')
      if (!s) return s
      return s.replace(/([^:]\/)\/+/g, '$1')
    }

    function fsDataToUint8(d, ddeps) {
      if (d == null) return null
      if (d instanceof Uint8Array) return d.byteLength ? d : null
      if (d instanceof ArrayBuffer) {
        const u = new Uint8Array(d)
        return u.byteLength ? u : null
      }
      if (typeof d === 'string') {
        if (!d.length) return null
        return ddeps.strToU8(d)
      }
      if (d.buffer && d.buffer instanceof ArrayBuffer && typeof d.BYTES_PER_ELEMENT === 'number') {
        const u8 = new Uint8Array(d.buffer, d.byteOffset, d.byteLength)
        return u8.byteLength ? u8 : null
      }
      return null
    }

    function readOnePath(filePath) {
      const pv = deps().platformVendor
      const ddeps = deps()
      return new Promise(function (resolve) {
        if (!filePath || !pv || typeof pv.getFileSystemManager !== 'function') {
          resolve(null)
          return
        }
        const fs = pv.getFileSystemManager()
        if (!fs) {
          resolve(null)
          return
        }
        const fp = normalizeLocalFsPath(filePath)
        if (!fp) {
          resolve(null)
          return
        }

        if (typeof fs.readFileSync === 'function') {
          try {
            const r0 = fs.readFileSync(fp)
            const u0 = fsDataToUint8(r0, ddeps)
            if (u0 && u0.byteLength) {
              resolve(u0)
              return
            }
          } catch (e0) {
            console.log('[CrashSight][CosAttach] readFileSync(binary) ' + e0 + ' path=' + fp)
          }
          try {
            const r1 = fs.readFileSync(fp, 'utf8')
            const u1 = fsDataToUint8(r1, ddeps)
            if (u1 && u1.byteLength) {
              resolve(u1)
              return
            }
          } catch (e1) {
            console.log('[CrashSight][CosAttach] readFileSync(utf8) ' + e1 + ' path=' + fp)
          }
        }

        if (typeof fs.readFile !== 'function') {
          resolve(null)
          return
        }

        fs.readFile({
          filePath: fp,
          encoding: 'utf8',
          success: function (res) {
            const u8 = fsDataToUint8(res.data, ddeps)
            if (u8 && u8.byteLength) {
              resolve(u8)
              return
            }
            fs.readFile({
              filePath: fp,
              success: function (res2) {
                const u2 = fsDataToUint8(res2.data, ddeps)
                resolve(u2 && u2.byteLength ? u2 : null)
              },
              fail: function (err2) {
                console.log(
                  '[CrashSight][CosAttach] readFile fail(binary): ' + JSON.stringify(err2) + ' path=' + fp
                )
                resolve(null)
              }
            })
          },
          fail: function (err) {
            console.log('[CrashSight][CosAttach] readFile fail(utf8): ' + JSON.stringify(err) + ' path=' + fp)
            fs.readFile({
              filePath: fp,
              success: function (res2) {
                const u2 = fsDataToUint8(res2.data, ddeps)
                resolve(u2 && u2.byteLength ? u2 : null)
              },
              fail: function (err2) {
                console.log(
                  '[CrashSight][CosAttach] readFile fail(binary): ' + JSON.stringify(err2) + ' path=' + fp
                )
                resolve(null)
              }
            })
          }
        })
      })
    }

    function fileNameFromPath(p) {
      const s = String(p).replace(/\\/g, '/')
      const i = s.lastIndexOf('/')
      const name = i >= 0 ? s.substr(i + 1) : s
      return name || 'attachment.bin'
    }

    /**
     * 主上报已成功：按路径列表从磁盘读取 → zip → COS；返回是否上传步骤整体成功（与路径缓存是否保留无关）。
     */
    function uploadPathsAfterReportSuccess(paths, opt) {
      opt = opt || {}
      if (!paths || !paths.length) {
        cosDbg('paths: skip (no paths)')
        return Promise.resolve(true)
      }
      const unique = []
      const seen = {}
      for (let i = 0; i < paths.length; i++) {
        const p = String(paths[i] || '').trim()
        if (!p || seen[p]) continue
        seen[p] = 1
        unique.push(p)
      }
      if (!unique.length) {
        cosDbg('paths: skip (all empty or duplicate)')
        return Promise.resolve(true)
      }
      cosDbg(
        'paths: read disk raw=' +
          paths.length +
          ' unique=' +
          unique.length +
          (opt.fromReplay ? ' [replay]' : '')
      )
      return Promise.all(unique.map(function (p) {
        return readOnePath(p).then(function (u8) {
          return { path: p, uint8: u8 }
        })
      })).then(function (results) {
        const entries = []
        for (let j = 0; j < results.length; j++) {
          const r = results[j]
          if (r.uint8 && r.uint8.byteLength) {
            entries.push({ fileName: fileNameFromPath(r.path), uint8: r.uint8 })
          } else {
            cosDbg('paths: zero bytes path=' + r.path)
          }
        }
        cosDbg('paths: readable entries=' + entries.length + '/' + results.length)
        if (!entries.length) {
          console.log('[CrashSight][CosAttach] no readable bytes from paths')
          return false
        }
        cosDbg('paths: -> flushAndUpload')
        return flushAndUpload(entries, opt)
      })
    }

    g.__crashSightCosAttach = {
      applyTokenFromValueMap: applyTokenFromValueMap,
      resetToken: resetToken,
      getBucket: function () {
        return cosToken && cosToken.bucket ? cosToken.bucket : ''
      },
      uploadPathsAfterReportSuccess: uploadPathsAfterReportSuccess
    }

    } else {
      console.log("[CrashSight][Info] COS attachment upload skipped: no wx")
    }


    // ========================== CrashSgiht Core Begin===============================
    // 宿主识别顺序：QQ 小游戏 -> 微信小游戏 -> WebGL/浏览器垫片。
    // 原生 / Cocos / Laya / Unity 共用这段逻辑；不要改成互斥包，否则微信/WebGL 会分叉。
    let platformVendor = null
    let sdkName = 'WXCrashSightSDK'
    if (typeof globalThis.qq !== 'undefined') {
      platformVendor = globalThis.qq
      sdkName = 'QQCrashSightSDK'
      console.log("[CrashSight][Info] platform is qq")
    } else if (typeof globalThis.wx !== "undefined") {
      platformVendor = globalThis.wx
      console.log("[CrashSight][Info] platform is wx")
    } else {
      platformVendor = webNative
      console.log("[CrashSight][Info] platform is webNative")
    }

    const StrategyEnableState = {
      Unknow: 0,
      Enable: 1,
      Disable: 2
    }
    let strategyEnableState = StrategyEnableState.Unknow


    const LogLevel = {
      LogSilent: 0,
      LogError: 1,
      LogWarning: 2,
      LogInfo: 3,
      LogDebug: 4,
      LogVerbose: 5
    }

    let hasInitCrashSight = false
    let hasRegisterErrorCallback = false
    let hasHookConsoleError = false
    let hasMergeExcepionFile = false
    let serverStrategy = {}

    const platformId = 32
    const sdkVersion = '1.7'
    const errorReportCMD = 930
    const connnetReportCDM = 940
    const coldStartup = 1
    const hotStartup = 2
    const localStrategyKey = 'crashsight_local_strategy'
    const logMaxLength = 30720


    let appId = ''
    let sessionId = ''
    let userId = ''
    let extKV = {}
    let userLogs = []
    let logLength = 0
    let logLevel = LogLevel.LogInfo

    let _deviceId = null
    let appVersion = "0.0.0"
    let wxAppIdentify = "none"
    let reportURL = 'https://minigame.crashsight.qq.com/rqd/pb/sync'
    let extraMessageCallback = null

    let cachedAttachmentPaths = []

    const parseAttachmentPipeString = function (pathString) {
      if (pathString == null || pathString === '') {
        return []
      }
      return String(pathString)
        .split('|')
        .map(function (s) {
          return s.trim()
        })
        .filter(Boolean)
    }

    const generateUUID = function () {
      let uuid = '';
      for (let i = 0; i < 32; i++) {
        const random = Math.random() * 16 | 0;
        if (i === 8 || i === 12 || i === 16 || i === 20) {
          uuid += '-';
        }
        uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
      }
      return uuid;
    }

    const readDeviceInfo = function () {
      try {
        if (platformVendor && typeof platformVendor.getDeviceInfo === 'function') {
          const info = platformVendor.getDeviceInfo()
          if (info) {
            return info
          }
        }
      } catch (error) {
      }
      try {
        if (platformVendor && typeof platformVendor.getSystemInfoSync === 'function') {
          const info = platformVendor.getSystemInfoSync()
          if (info) {
            return {
              model: info.model || 'unknow',
              system: info.system || 'unknow'
            }
          }
        }
      } catch (error) {
      }
      return {
        model: 'unknow',
        system: 'unknow'
      }
    }

    const getDeviceId = function () {
      if (_deviceId) {
        return _deviceId
      }
      _deviceId = platformVendor.getStorageSync('crashsight_device_id')
      if (_deviceId) {
        return _deviceId
      }
      _deviceId = generateUUID()
      platformVendor.setStorageSync('crashsight_device_id', _deviceId)
      return _deviceId
    }

    const buildRequestJson = async function (obj, cmd) {
      let ret = await platformVendor.getNetworkType()
      let deviceInfo = readDeviceInfo()
      let request = {}
      request.cmd = cmd
      request.platformId = platformId
      request.prodId = appId
      request.networkType = ret && ret.networkType ? ret.networkType : 'unknown'

      if (cmd === connnetReportCDM) {
        obj.list[0].startCostTime = typeof globalThis.__crashSight.startCostTime === 'undefined' ? -1 : globalThis.__crashSight.startCostTime
      }

      request.sBuffer = obj
      request.model = deviceInfo['model']
      request.osVer = deviceInfo['system']
      request.uploadTime = new Date().getTime()
      request.sessionId = sessionId
      request.deviceId = getDeviceId()
      request.sdkVer = sdkVersion
      request.version = appVersion
      request.bundleId = wxAppIdentify
      let uniPacket = {
        sServantName: 'RqdServer',
        sFuncName: 'sync',
        request: request
      }
      return uniPacket
    }


    const sendHttp = function (body, cmd, callback) {
      let header = {
        platformId: platformId.toString(),
        prodId: appId,
        cmd: cmd,
        sdkVer: sdkVersion,
        appVer: appVersion,
        model: readDeviceInfo()['model'],
        sdkName: sdkName,
        redisKeyUuid: getDeviceId(),
        bundleId: wxAppIdentify,
        tls: 1,
        "Content-Type": "application/json",
      }
      console.log("[CrashSight][Debug] request body json: " + JSON.stringify(body))
      platformVendor.request({
        url: reportURL,
        method: 'POST',
        header: header,
        data: body,
        success(res) {
          try {
            console.log("[CrashSight][Debug] response data: " + JSON.stringify(res.data))
          } catch (error) {
            console.log("[CrashSight][Error] " + error)
          }
          if (callback) {
            callback(null, res)
          }
        },
        fail(err) {
          try {
            console.log("[CrashSight][Error] network request faild: " + JSON.stringify(err))
          } catch (error) {
            console.log("[CrashSight][Error] " + error)
          }
          if (callback) {
            callback(err, null)
          }
        }
      })
    }

    const toBase64 = function (uint8Array) {
      const base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      let result = '';
      let i;

      for (i = 0; i < uint8Array.length - 2; i += 3) {
        const byte1 = uint8Array[i];
        const byte2 = uint8Array[i + 1];
        const byte3 = uint8Array[i + 2];

        const bits1 = byte1 >> 2;
        const bits2 = ((byte1 & 0x3) << 4) | (byte2 >> 4);
        const bits3 = ((byte2 & 0xf) << 2) | (byte3 >> 6);
        const bits4 = byte3 & 0x3f;

        result += base64Chars[bits1] + base64Chars[bits2] + base64Chars[bits3] + base64Chars[bits4];
      }

      const remaining = uint8Array.length % 3;
      if (remaining === 1) {
        const byte1 = uint8Array[i];
        const bits1 = byte1 >> 2;
        const bits2 = (byte1 & 0x3) << 4;
        result += base64Chars[bits1] + base64Chars[bits2] + '==';
      } else if (remaining === 2) {
        const byte1 = uint8Array[i];
        const byte2 = uint8Array[i + 1];
        const bits1 = byte1 >> 2;
        const bits2 = ((byte1 & 0x3) << 4) | (byte2 >> 4);
        const bits3 = (byte2 & 0xf) << 2;
        result += base64Chars[bits1] + base64Chars[bits2] + base64Chars[bits3] + '=';
      }

      return result;
    }

    const consumeExtraMessage = function () {
      if (typeof globalThis.__crashSightGetExtraMessageFromManaged === 'function') {
        try {
          const nativeExtra = globalThis.__crashSightGetExtraMessageFromManaged()
          if (nativeExtra !== null && typeof nativeExtra !== 'undefined') {
            return String(nativeExtra)
          }
        } catch (error) {
          console.log('[CrashSight][Error] managed extra message getter error: ' + error)
        }
      }
      if (typeof extraMessageCallback !== 'function') {
        return ''
      }
      try {
        const ret = extraMessageCallback()
        if (ret === null || typeof ret === 'undefined') {
          return ''
        }
        return String(ret)
      } catch (error) {
        console.log('[CrashSight][Error] extraMessageCallback error: ' + error)
        return ''
      }
    }

    let mergeInfo = {}
    const sendErrorMessage = async function (expName, msg, stack, attachmentSpec) {
      try {
        let exceptionUpload = {}
        exceptionUpload.type = "107"
        exceptionUpload.expName = expName
        exceptionUpload.expMessage = typeof msg === 'object' ? JSON.stringify(msg) : msg
        exceptionUpload.callStack = typeof stack === 'object' ? JSON.stringify(stack) : stack
        const extraMsg = consumeExtraMessage()
        if (typeof exceptionUpload.expMessage === 'undefined') {
          exceptionUpload.expMessage = 'null'
        }

        if (typeof exceptionUpload.callStack === 'undefined') {
          exceptionUpload.callStack = 'null'
        }

        let deleteAfterUpload = false
        let saveFileName = null
        let hash = undefined
        if (Number(serverStrategy['MG_KEY_MERGE_IMPROVE'])) {
          hash = md5.md5(msg + stack)
          if (mergeInfo[hash]) {
            mergeInfo[hash].count++
            platformVendor.setStorageSync('cs_merge_info', mergeInfo)
            console.log('[CrashSight] [Debug] merge not first hash: ' + hash + ', count: ' + mergeInfo[hash].count)
            return
          } else {
            saveFileName = 'cs_exception_' + new Date().getTime() + '_' + hash
            mergeInfo[hash] = {
              count: 1
            }
            platformVendor.setStorageSync('cs_merge_info', mergeInfo)
            console.log('[CrashSight] [Debug] merge fisrt hash: ' + hash + ', count: ' + mergeInfo[hash].count)
          }
        } else {
          saveFileName = 'cs_none_merge_exception_' + new Date().getTime()
          deleteAfterUpload = true
          console.log('[CrashSight] [Debug] not merge ')
        }

        exceptionUpload.userId = userId
        exceptionUpload.crashTime = new Date().getTime()
        exceptionUpload.expuid = generateUUID()
        exceptionUpload.deviceId = getDeviceId()
        exceptionUpload.valueMap = extKV || {}
        exceptionUpload.sessionId = sessionId

        let logAttach = {}
        logAttach.fileName = 'crashsightlog.gz'
        logAttach.type = 2
        let logData = '';
        for (let i = 0; i < userLogs.length; i++) {
          logData += userLogs[i].str + '\n';
        }
        console.log('[CrashSight] [Debug] log is: ' + logData)
        logAttach.data = toBase64(gzipSync(strToU8(logData)))
        exceptionUpload.attaches = [logAttach]
        if (extraMsg) {
          let extraAttach = {}
          extraAttach.fileName = 'extraMsg.gz'
          extraAttach.type = 2
          extraAttach.data = toBase64(gzipSync(strToU8(extraMsg)))
          exceptionUpload.attaches.push(extraAttach)
        }

        let exceptionUploadPackage = {
          type: 107,
          deviceId: getDeviceId(),
          list: [exceptionUpload]
        }
        let body = await buildRequestJson(exceptionUploadPackage, errorReportCMD)

        if (saveFileName) {
          console.log('[CrashSight] [Debug] save file: ', saveFileName)
          await fileManager.saveFile(saveFileName, JSON.stringify(body))
        }
        const cosReportExpUid = exceptionUpload.expuid
        const snapPaths =
          attachmentSpec && attachmentSpec.mode === 'manual'
            ? parseAttachmentPipeString(attachmentSpec.pathString)
            : cachedAttachmentPaths.slice()
        sendHttp(body, errorReportCMD.toString(), async (httpError) => {
          if (!httpError && deleteAfterUpload && saveFileName) {
            await fileManager.removeFile(saveFileName)
            console.log('[CrashSight] [Event] upload not merger error message succeess, delete file:' + saveFileName)
          }
          if (
            !httpError &&
            snapPaths.length &&
            globalThis.__crashSightCosAttach &&
            typeof globalThis.__crashSightCosAttach.uploadPathsAfterReportSuccess === 'function'
          ) {
            try {
              await globalThis.__crashSightCosAttach.uploadPathsAfterReportSuccess(snapPaths, {
                expUid: cosReportExpUid,
                appId: appId,
                appVersion: appVersion
              })
            } catch (e) {
              console.log('[CrashSight][Error] user attachment cos upload: ' + e)
            }
          }
        })
      } catch (error) {
        console.log("[CrashSight][Error] " + error)
      }
    }


    const sendHistoryFile = async function (files) {
      console.log('[CrashSight] [Debug] history files:', files)
      if (!files) {
        return
      }
      for (let i = 0; i < files.length; i++) {
        const fileName = files[i]
        let isExceptionFile = fileName.startsWith('cs_none_merge_exception_')
        let isConnectionFile = fileName.startsWith('cs_connection_')
        if (isExceptionFile || isConnectionFile) {
          let content = await fileManager.readFile(fileName)
          if (content !== undefined) {
            try {
              let uniPacket = JSON.parse(content)
              if (isExceptionFile) {
                uniPacket.request.sBuffer.list[0].valueMap['A29'] = 1
              }
              sendHttp(uniPacket, uniPacket.request.cmd.toString(), async (httpError, res) => {
                if (!httpError) {
                  await fileManager.removeFile(fileName)
                }
              })
            } catch (e) {
              console.log('[CrashSight][Error] sendHistoryErrorMessage JSON parse and merge file:', fileName, ', content: ', content, ', error: ', e)
              await fileManager.removeFile(fileName)
            }
          } else {
            await fileManager.removeFile(fileName)
          }
        }
      }
    }

    const sendConnectInfo = async function (startType) {
      try {
        sessionId = generateUUID()
        let summaryInfo = {}
        summaryInfo.startTime = new Date().getTime()
        summaryInfo.startType = startType
        summaryInfo.userId = userId
        summaryInfo.sessionId = sessionId
        summaryInfo.coldStartup = startType == coldStartup

        let userInfoPackage = {
          type: startType,
          deviceId: getDeviceId(),
          list: [summaryInfo]
        }
        let body = await buildRequestJson(userInfoPackage, connnetReportCDM)
        let connectionFileName = 'cs_connection_' + +new Date().getTime()
        await fileManager.saveFile(connectionFileName, JSON.stringify(body))
        sendHttp(body, connnetReportCDM.toString(), async (httpError, res) => {
          if (httpError) {
            return
          }
          await fileManager.removeFile(connectionFileName)
          try {
            if (res.data) {
              if (res.data.cmd == 510) {
                let buffer = res.data.sBuffer
                if (globalThis.__crashSightCosAttach && typeof globalThis.__crashSightCosAttach.applyTokenFromValueMap === 'function') {
                  globalThis.__crashSightCosAttach.applyTokenFromValueMap(buffer.valueMap)
                }
                try {
                  platformVendor.setStorageSync(localStrategyKey, buffer.enable ? StrategyEnableState.Enable : StrategyEnableState.Disable)
                } catch (error) {
                  console.log("[CrashSight][Error] platformVendor.setStorageSync set local strategy error:" + error)
                }
                if (buffer.enable) {
                  if (hasInitCrashSight) {
                    if (!hasMergeExcepionFile) {
                      if (buffer.valueMap && typeof buffer.valueMap === 'object') {
                        serverStrategy = buffer.valueMap
                      }
                      console.log('[CrashSight][Info] serverStrategy: ', serverStrategy)
                      mergeExcepionFile()
                      hasMergeExcepionFile = true
                    }
                    if (strategyEnableState != StrategyEnableState.Enable) {
                      strategyEnableState = StrategyEnableState.Enable
                      registerErrorCallback()
                      console.log("[CrashSight][Info] CrashSight receve enable from server")
                    }
                  }
                } else {
                  if (strategyEnableState != StrategyEnableState.Disable) {
                    strategyEnableState = StrategyEnableState.Disable
                    unregisterErrorCallback()
                    console.log("[CrashSight][Error] CrashSight receve disable from server")
                  }
                  if (globalThis.__crashSightCosAttach && typeof globalThis.__crashSightCosAttach.resetToken === 'function') {
                    globalThis.__crashSightCosAttach.resetToken()
                  }
                }
              }
            }
          } catch (error) {
            console.log("[CrashSight][Error] " + error)
          }
        })
      } catch (error) {
        console.log("[CrashSight][Error] " + error)
      }
    }

    /** 统一 platformVendor.onError / webNative 传入的 message、stack（wx 常只有 message 且含堆栈） */
    const normalizeJsError = function (message, stack) {
      let msg = message
      let stk = stack
      if (msg && typeof msg === 'object') {
        if (typeof msg.stack === 'string' && msg.stack) {
          stk = msg.stack
        }
        if (typeof msg.message !== 'undefined') {
          msg = msg.message
        } else {
          try {
            msg = JSON.stringify(msg)
          } catch (e) {
            msg = String(msg)
          }
        }
      }
      if (typeof msg !== 'string') {
        msg = msg == null ? '' : String(msg)
      }
      if (stk == null || stk === undefined) {
        stk = ''
      } else if (typeof stk !== 'string') {
        try {
          stk = JSON.stringify(stk)
        } catch (e) {
          stk = String(stk)
        }
      }
      if (!stk && msg.indexOf('\n') !== -1) {
        const lines = msg.split('\n')
        const head = lines[0].trim()
        const tail = lines.slice(1).join('\n').trim()
        if (tail && (/\n\s*at\s/m.test('\n' + tail) || tail.includes('wasm://') || tail.includes('blob:'))) {
          msg = head
          stk = tail
        }
      }
      return { message: msg, stack: stk }
    }

    const jsErrorHandler = function (message, stack) {
      if (strategyEnableState == StrategyEnableState.Enable) {
        const n = normalizeJsError(message, stack)
        sendErrorMessage('JavaScript Error (platformVendor.onError)', n.message, n.stack)
      }
    }

    const pageNotFoundHandler = function (result) {
      if (strategyEnableState == StrategyEnableState.Enable) {
        sendErrorMessage('WX Page Not Found Error', JSON.stringify(result), null)
      }
    }
    const unhandledRejectionHandler = function (result) {
      if (strategyEnableState == StrategyEnableState.Enable) {
        let message = 'unkonw'
        let stack = ''
        const reason = result ? result.reason : undefined
        if (reason && typeof reason === 'object' && (typeof reason.message !== 'undefined' || typeof reason.stack !== 'undefined')) {
          if (typeof reason.message !== 'undefined') {
            message = reason.message
          }
          if (typeof reason.stack !== 'undefined') {
            stack = reason.stack
          }
        } else {
          try {
            message = typeof result === 'object' ? JSON.stringify(result) : String(result)
          } catch (error) {
            message = String(result)
          }
          try {
            throw new Error('Unhandled Rejection Promise Error')
          } catch (error) {
            stack = error && error.stack ? error.stack : ''
          }
        }
        sendErrorMessage('Unhandle Rejection Promise Error', message, stack)

      }
    }

    const registerConsoleErrorHanler = function () {
      if (hasHookConsoleError) {
        return
      }

      console.log('[CrashSight][Info] register console.error')
      let oldConsoleError = console.error
      Object.defineProperty(console, 'error', {
        value: function () {
          if (strategyEnableState == StrategyEnableState.Enable) {
            if (arguments[0] && arguments[0].stack) {
              let message = arguments[0].message
              let stack = arguments[0].stack
              sendErrorMessage('JavaScript Error(console.error)', message, stack)
            }
          }
          oldConsoleError.apply(console, arguments);
        },
        writable: true,
        configurable: true
      });
      hasHookConsoleError = true
    }

    let fileManager = {

      init: function () {
        if (this.inited === true) {
          return true
        }
        if (platformVendor != webNative) {
          let fs = platformVendor.getFileSystemManager()
          try {
            fs.accessSync(`${platformVendor.env.USER_DATA_PATH}/CrashSight`)
          } catch (e) {
            try {
              fs.mkdirSync(`${platformVendor.env.USER_DATA_PATH}/CrashSight`)
            } catch (e) {
              console.log('[CrashSight][Error] mkdir faild: ' + e)
              return false
            }
          }
        }
        this.inited = true
        return true
      },

      files: function () {
        if (!this.inited) {
          if (!this.init()) {
            console.log('[CrashSight][Error] get files init fileManager error')
            return []
          }
        }
        let files = []
        try {
          let fs = platformVendor.getFileSystemManager()
          files = fs.readdirSync(`${platformVendor.env.USER_DATA_PATH}/CrashSight`)
        } catch (e) {
          console.log('[CrashSight][Error] readdirSync faild: ' + e)
        }
        return files
      },

      removeFile: function (fileName) {
        if (!this.inited) {
          if (!this.init()) {
            console.log('[CrashSight][Error] removeFile init fileManager error')
            return []
          }
        }
        return new Promise((resolve, reject) => {
          let fs = platformVendor.getFileSystemManager()
          fs.unlink({
            filePath: `${platformVendor.env.USER_DATA_PATH}/CrashSight/${fileName}`,
            success(res) {
              resolve(true)
            },
            fail(err) {
              console.log('[Perfsight] [Error] remove file error: ', err)
              resolve(false)
            }
          })
        })
      },

      saveFile: function (fileName, data) {
        if (!this.inited) {
          if (!this.init()) {
            console.log('[CrashSight][Error] saveFile init fileManager error')
            return []
          }
        }
        return new Promise((resolve, reject) => {
          let fs = platformVendor.getFileSystemManager()
          fs.writeFile({
            filePath: `${platformVendor.env.USER_DATA_PATH}/CrashSight/${fileName}`,
            encoding: 'utf8',
            data: data,
            success() {
              resolve(true)
            },
            fail(err) {
              console.log('[Perfsight] [Error] saveFile init fileManager error: ', err)
              resolve(false)
            }
          })
        })
      },

      readFile: function (fileName) {
        if (!this.inited) {
          if (!this.init()) {
            console.log('[CrashSight][Error] readFile init fileManager error')
            return []
          }
        }
        return new Promise((resolve, reject) => {
          let fs = platformVendor.getFileSystemManager()
          fs.readFile({
            filePath: `${platformVendor.env.USER_DATA_PATH}/CrashSight/${fileName}`,
            encoding: 'utf8',
            success(res) {
              resolve(res.data)
            },
            fail(err) {
              console.log('[Perfsight] [Error] readFile error: ', err)
              resolve(undefined)
            }
          })
        })
      }


    }

    const mergeExcepionFile = async function () {
      let mergeInfo = platformVendor.getStorageSync('cs_merge_info')
      platformVendor.setStorageSync('cs_merge_info', {})
      if (!mergeInfo) {
        mergeInfo = {}
      }
      let files = fileManager.files()
      console.log('[CrashSight] [Debug] mergeInfo:', mergeInfo)
      console.log('[CrashSight] [Debug] merge files:', files)

      if (!files) {
        return
      }
      for (let i = 0; i < files.length; i++) {
        const fileName = files[i]
        if (fileName.startsWith('cs_exception_')) {
          let matchResult = fileName.match(/([a-zA-Z0-9-]+)$/)
          let hash = undefined
          if (matchResult && matchResult.length > 0) {
            hash = matchResult[0]
          } else {
            await fileManager.removeFile(fileName)
            continue
          }

          let info = mergeInfo[hash]
          if (info && info.count > 1) {
            let content = await fileManager.readFile(fileName)
            if (content !== undefined) {
              try {
                let uniPacket = JSON.parse(content)
                uniPacket.request.sBuffer.list[0].crashCount = info.count - 2
                sendHttp(uniPacket, uniPacket.request.cmd.toString(), async (httpError, res) => {
                  if (!httpError) {
                    await fileManager.removeFile(fileName)
                  }
                })
              } catch (e) {
                console.log('[CrashSight][Error] JSON parse and merge file:', fileName, ', content: ', content, ', error: ', e)
                await fileManager.removeFile(fileName)
                continue
              }
            } else {
              continue
            }
          } else {
            await fileManager.removeFile(fileName)
            continue
          }
        }

      }

    }

    const registerErrorCallback = function () {
      if (hasRegisterErrorCallback) {
        console.log('[CrashSight][Warning] repeated call hasRegisterErrorCallback')
        return
      }
      if (platformVendor.onError) {
        console.log('[CrashSight][Info] register platformVendor.onError')
        platformVendor.onError(jsErrorHandler)
      } else {
        console.log('[CrashSight][Warning] no platformVendor.onError function')
      }
      registerConsoleErrorHanler()
      if (platformVendor.onPageNotFound) {
        console.log('[CrashSight][Info] register platformVendor.onPageNotFound')
        platformVendor.onPageNotFound(pageNotFoundHandler)
      } else {
        console.log('[CrashSight][Warning] no platformVendor.onPageNotFound function')
      }
      if (platformVendor.onUnhandledRejection) {
        console.log('[CrashSight][Info] register platformVendor.onUnhandledRejection')
        platformVendor.onUnhandledRejection(unhandledRejectionHandler)
      } else {
        console.log('[CrashSight][Warning] no platformVendor.onUnhandledRejection function')
      }
      hasRegisterErrorCallback = true
    }

    const unregisterErrorCallback = function () {
      if (!hasRegisterErrorCallback) {
        console.log('[CrashSight][Warning] repeated call unregisterErrorCallback')
        return
      }
      if (platformVendor.offError) {
        console.log('[CrashSight][Info] unregister platformVendor.onError')
        platformVendor.offError(jsErrorHandler)
      }
      if (platformVendor.offPageNotFound) {
        console.log('[CrashSight][Info] unregister platformVendor.onPageNotFound')
        platformVendor.offPageNotFound(pageNotFoundHandler)
      }
      if (platformVendor.offUnhandledRejection) {
        console.log('[CrashSight][Info] unregister platformVendor.onUnhandledRejection')
        platformVendor.offUnhandledRejection(unhandledRejectionHandler)
      }
      hasRegisterErrorCallback = false
    }


    let crashSight = {
      initBeforeStart: async function() {
        if (platformVendor.initFileSystemManager) {
          await platformVendor.initFileSystemManager()
        }
      },

      start: function (_appId, _reportURL) {
        if (hasInitCrashSight) {
          console.log('[CrashSight][Warning] CrashSight has started')
          return
        }
        if (!_appId) {
          console.log("[CrashSight][Error] appid is null")
          return
        }
        let startBeginTime = new Date().getTime()
        appId = _appId
        if (_reportURL) {
          reportURL = _reportURL
        }
        try {
          strategyEnableState = platformVendor.getStorageSync(localStrategyKey)
          console.log('[CrashSight][Debug] local strategy enable: ' + (strategyEnableState === StrategyEnableState.Enable))
          if (strategyEnableState === undefined || strategyEnableState === null || strategyEnableState === '') {
            strategyEnableState = StrategyEnableState.Enable
          }
        } catch (error) {
          console.log('[CrashSight][Error] platformVendor.getStorageSync get local strategy error:' + error)
          strategyEnableState = StrategyEnableState.Enable
        }

        let historyFiles = []
        if (strategyEnableState != StrategyEnableState.Disable) {
          historyFiles = fileManager.files()
        }
        sendConnectInfo(coldStartup)
        if (strategyEnableState != StrategyEnableState.Disable) {
          registerErrorCallback()
          sendHistoryFile(historyFiles)
        }
        hasInitCrashSight = true
        globalThis.__crashSightCosDeps = {
          md5: md5,
          zipSync: zipSync,
          strToU8: strToU8,
          gzipSync: gzipSync,
          toBase64: toBase64,
          platformVendor: platformVendor
        }
        globalThis.__crashSight.startCostTime = new Date().getTime() - startBeginTime
        console.log('[CrashSight][INFO] CrashSight start success in ', globalThis.__crashSight.startCostTime, 'ms, waiting for enable form server...')
      },

      stop: function () {
        if (!hasInitCrashSight) {
          console.log('[CrashSight][Error] CrashSight has not started')
          return
        }
        unregisterErrorCallback()
        hasInitCrashSight = false
        strategyEnableState = StrategyEnableState.Unknow
        console.log('[CrashSight][INFO] CrashSight stop success')
      },

      setUserId: function (_userId) {
        userId = _userId
      },

      setExtKV: function (key, value) {
        if (key) {
          extKV['C03_' + key] = value
        }
      },

      clearExtKV: function () {
        extKV = {}
      },

      printLog: function (level, log) {
        if (!log || level == 0 || level > logLevel) {
          return
        }
        const timestamp = new Date().toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).replace(/(\d+)\/(\d+)/, '$1-$2').replace(/\//g, ':');
        const levelStr = {
          1: "E",
          2: "W",
          3: "I",
          4: "D",
          5: "V"
        } [level] || "";
        const fullLog = `${timestamp} ${levelStr} ${log}`;
        const byteSize = encodeURIComponent(fullLog).replace(/%[A-F0-9]{2}/g, 'X').length;

        if (byteSize > logMaxLength) {
          return;
        }
        console.log('[CrashSight][Debug] print log: ' + fullLog)
        userLogs.push({
          str: fullLog,
          size: byteSize
        });
        logLength += byteSize;

        while (logLength > logMaxLength) {
          const removed = userLogs.shift();
          logLength -= removed.size;
        }
      },

      configLogLevel: function (level) {
        if (level >= 0 && level <= LogLevel.LogVerbose) {
          console.log('[CrashSight][Debug] configLogLevel', level)
          logLevel = level
        }
      },

      setAppVersion: function (_appVersion) {
        appVersion = _appVersion
      },

      setWXAppIdentify: function (_wxAppIdentify) {
        wxAppIdentify = _wxAppIdentify
      },

      // QQ / 通用别名；保留 setWXAppIdentify 以兼容现有微信接入代码。
      setAppIdentify: function (_appIdentify) {
        wxAppIdentify = _appIdentify
      },

      setExtraMessageCallback: function (callback) {
        if (typeof callback === 'function') {
          extraMessageCallback = callback
        } else {
          extraMessageCallback = null
        }
      },

      setAttachmentPaths: function (pathString) {
        cachedAttachmentPaths = parseAttachmentPipeString(pathString)
      },

      reportException: async function (exceptionName, message, stack, attachmentPaths) {
        if (!hasInitCrashSight) {
          console.log('[CrashSight][Error] CrashSight has not started')
          return
        }

        if (strategyEnableState == StrategyEnableState.Disable) {
          console.log('[CrashSight][Error] CrashSight has disable by server')
          return
        }
        sendErrorMessage(exceptionName, message, stack, { mode: 'manual', pathString: attachmentPaths })
      },

      reportCapturedException: async function (exceptionName, message, stack) {
        if (!hasInitCrashSight) {
          console.log('[CrashSight][Error] CrashSight has not started')
          return
        }

        if (strategyEnableState == StrategyEnableState.Disable) {
          console.log('[CrashSight][Error] CrashSight has disable by server')
          return
        }
        sendErrorMessage(exceptionName, message, stack)
      }
    }

    globalThis.__crashSight = crashSight

    // ========================== CrashSgiht Core End===============================

;
  },

  CS_Start: function (appId, reportURL) {
    if (globalThis.__crashSight && appId) {
      appId = UTF8ToString(appId)
      reportURL = reportURL ? UTF8ToString(reportURL) : undefined
      if (globalThis.cs_webNative) {
        globalThis.__crashSight.initBeforeStart()
          .catch((e) => {
            console.log("[[CrashSight] initFileSystemManager failed: ", e)
          })
          .finally(() => {
            globalThis.__crashSight.start(appId, reportURL)
          })
        return
      }
      globalThis.__crashSight.start(appId, reportURL)
    }
  },


  CS_Stop: function () {
    if (globalThis.__crashSight) {
      globalThis.__crashSight.stop()
    }
  },

  CS_SetUserId: function (userId) {
    if (globalThis.__crashSight && userId) {
      userId = UTF8ToString(userId)
      globalThis.__crashSight.setUserId(userId)
    }
  },

  CS_SetExtKV: function (key, value) {
    if (globalThis.__crashSight && key) {
      key = UTF8ToString(key)
      if (value) {
        value = UTF8ToString(value)
      } else {
        value = undefined
      }
      globalThis.__crashSight.setExtKV(key, value)
    }
  },

  CS_ClearExtKV: function () {
    if (globalThis.__crashSight) {
      globalThis.__crashSight.clearExtKV()
    }
  },

  CS_SetAppVersion: function (appVersion) {
    if (globalThis.__crashSight && appVersion) {
      appVersion = UTF8ToString(appVersion)
      globalThis.__crashSight.setAppVersion(appVersion)
    }
  },

  CS_SetWXAppIdentify: function (wxAppIdentify) {
    if (globalThis.__crashSight && wxAppIdentify) {

      wxAppIdentify = UTF8ToString(wxAppIdentify)
      globalThis.__crashSight.setWXAppIdentify(wxAppIdentify)
    }
  },

  CS_SetAppIdentify: function (appIdentify) {
    if (globalThis.__crashSight && appIdentify) {
      appIdentify = UTF8ToString(appIdentify)
      if (typeof globalThis.__crashSight.setAppIdentify === 'function') {
        globalThis.__crashSight.setAppIdentify(appIdentify)
      } else {
        globalThis.__crashSight.setWXAppIdentify(appIdentify)
      }
    }
  },

  CS_RegisterManagedExtraMessageCallback: function (fp) {
    globalThis.__crashSightManagedExtraMessageFp = fp
    globalThis.__crashSightGetExtraMessageFromManaged = function () {
      var _fp = globalThis.__crashSightManagedExtraMessageFp
      if (!_fp) {
        return null
      }
      var ptr = 0
      try {
        if (typeof Module !== 'undefined' && Module['dynCall_i']) {
          ptr = Module['dynCall_i'](_fp)
        } else if (typeof Runtime !== 'undefined' && Runtime['dynCall']) {
          ptr = Runtime['dynCall']('i', _fp)
        } else if (typeof wasmTable !== 'undefined' && wasmTable.get) {
          ptr = wasmTable.get(_fp)()
        }
      } catch (e) {
        console.log('[CrashSight][Warning] managed extra message getter failed: ' + e)
        return null
      }
      if (!ptr) {
        return null
      }
      var str = UTF8ToString(ptr)
      if (typeof _free === 'function') {
        _free(ptr)
      }
      return str
    }
  },

  CS_ReportException: function (exceptionName, message, stack, attachmentPaths) {
    console.log("crashSight CS_ReportException")
    if (globalThis.__crashSight) {
      exceptionName = exceptionName ? UTF8ToString(exceptionName) : 'null';
      message = message ? UTF8ToString(message) : 'null'
      stack = stack ? UTF8ToString(stack) : 'null'

      if (typeof message === 'undefined') {
        message = 'null'
      }
      if (typeof stack === 'undefined') {
        stack = 'null'
      }
      var attachStr = attachmentPaths ? UTF8ToString(attachmentPaths) : undefined
      globalThis.__crashSight.reportException(exceptionName, message, stack, attachStr)
    }
  },

  CS_ReportCapturedException: function (exceptionName, message, stack) {
    if (globalThis.__crashSight) {
      exceptionName = exceptionName ? UTF8ToString(exceptionName) : 'null'
      message = message ? UTF8ToString(message) : 'null'
      stack = stack ? UTF8ToString(stack) : 'null'
      if (typeof message === 'undefined') {
        message = 'null'
      }
      if (typeof stack === 'undefined') {
        stack = 'null'
      }
      globalThis.__crashSight.reportCapturedException(exceptionName, message, stack)
    }
  },

  CS_SetAttachmentPaths: function (pathString) {
    if (!globalThis.__crashSight) {
      return
    }
    var s = pathString ? UTF8ToString(pathString) : ''
    globalThis.__crashSight.setAttachmentPaths(s)
  },

  CS_JSBacktrace: function CS_JSBacktrace(skipCount, excludeFilter, limitCount) {
    let errObjForBacktrace = new Error()
    let backtrace = errObjForBacktrace.stack;
    if (typeof backtrace == 'string') {
      let lines = backtrace.split('\n');
      let resultLines = lines.length > skipCount ? lines.slice(skipCount) : lines;
      excludeFilter = excludeFilter ? UTF8ToString(excludeFilter) : null
      if (excludeFilter && resultLines && resultLines.length > 0) {
        let tmep = []
        let filters = excludeFilter.split('|')
        for (let i = 0; i < resultLines.length; i++) {
          let line = resultLines[i]
          let except = false
          for (let j = 0; j < filters.length; j++) {
            let filter = filters[j]
            if (line.indexOf(filter) != -1) {
              except = true
              break
            }
          }
          if (!except) {
            tmep.push(line)
          }
        }
        resultLines = tmep
      }

      if (limitCount > 0 && resultLines && resultLines.length > limitCount) {
        resultLines = resultLines.splice(0, limitCount)
      }
      let resultStr = resultLines.join('\n');
      if (resultStr.endsWith('\n')) {
        resultStr = resultStr.slice(0, -1);
      }
      let bufferSize = lengthBytesUTF8(resultStr) + 1;
      let buffer = _malloc(bufferSize);
      stringToUTF8(resultStr, buffer, bufferSize);
      return buffer;
    } else {
      return null
    }
  },

  CS_JSTestJSException: function () {
    console.log("[test] onTestJSExceptionClick");
    xxx()
  },

  CS_JSTestReject: function () {
    console.log("[test] onTestPromiseReject");
    function doSomething() {
      return new Promise((resolve, reject) => {
        setTimeout(function () {
          reject(new Error("doSomething func reject"))
        }, 1000)
      })
    }
    doSomething()
  },

  CS_PrintLog: function CS_PrintLog(level, message) {
    if (globalThis.__crashSight && message) {
      message = UTF8ToString(message);
      globalThis.__crashSight.printLog(level, message);
    }
  },
  CS_ConfigLogLevel: function CS_ConfigLogLevel(level) {
    if (globalThis.__crashSight) {
      globalThis.__crashSight.configLogLevel(level);
    }
  }


});

