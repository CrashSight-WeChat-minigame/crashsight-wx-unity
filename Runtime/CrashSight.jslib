
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



    function webNativeDirOf(filePath) {
      const path = String(filePath || '')
      const slash = path.lastIndexOf('/')
      return slash >= 0 ? path.substring(0, slash + 1) : ''
    }

    function webNativeNormalizeDir(dirPath) {
      let path = String(dirPath || '')
      if (!path.endsWith('/')) path += '/'
      return path
    }

    let FileSystemManager = {

      init(dbName) {
        this.dbName = dbName;
        this.db = null;
        this.initSuccess = false;
        this._files = {};
        this._dirs = {};
        return this
      },

      _rememberFile(filePath, content) {
        const path = String(filePath)
        this._files[path] = {
          path: path,
          directory: webNativeDirOf(path),
          isDirectory: false,
          content: content
        }
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
            const tx = this.db.transaction(['files'], 'readonly');
            const getAll = tx.objectStore('files').getAll();
            getAll.onsuccess = () => {
              const rows = getAll.result || [];
              this._files = {};
              for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (row && row.path) this._files[row.path] = row;
              }
              this.initSuccess = true;
              resolve();
            };
            getAll.onerror = () => {
              this.initSuccess = false;
              reject(getAll.error);
            };
          };

          request.onerror = (event) => {
            this.initSuccess = false;
            reject(event.target.error);
          };
        });
      },

      accessSync(path) {
        if (!this.initSuccess) {
          console.log('[WebNative] fileSystemManager not init successfully, accessSync is forbidden');
          return
        }
        if (this._files[path] || this._dirs[webNativeNormalizeDir(path)]) return
        throw new Error('File not found: ' + path)
      },

      mkdirSync(dirPath) {
        if (!this.initSuccess) return
        this._dirs[webNativeNormalizeDir(dirPath)] = true
      },

      readdirSync(dirPath) {
        if (!this.initSuccess) {
          console.log('[WebNative] fileSystemManager not init successfully, readdirSync is forbidden');
          return
        }
        const dir = webNativeNormalizeDir(dirPath)
        const seen = {}
        const names = []
        for (const path in this._files) {
          const row = this._files[path]
          if (!row || row.directory !== dir) continue
          const name = path.substring(dir.length).split('/')[0]
          if (!name || seen[name]) continue
          seen[name] = true
          names.push(name)
        }
        return names
      },

      readFileSync(path) {
        if (!this.initSuccess) {
          throw new Error('fileSystemManager not init')
        }
        const row = this._files[path]
        if (!row) throw new Error('File not found: ' + path)
        return row.content
      },

      unlink({
        filePath,
        success,
        fail
      }) {
        if (!this.initSuccess) {
          console.log('[WebNative] fileSystemManager not init successfully, unlink is forbidden');
          return
        }
        delete this._files[filePath]
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
        if (!this.initSuccess) {
          console.log('[WebNative] fileSystemManager not init successfully, writeFile is forbidden');
          return
        }
        this._rememberFile(filePath, data)
        const transaction = this.db.transaction(['files'], 'readwrite');
        const store = transaction.objectStore('files');
        const request = store.put(this._files[filePath]);
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
        if (!this.initSuccess) {
          console.log('[WebNative] fileSystemManager not init successfully, readFile is forbidden');
          return
        }
        const row = this._files[filePath]
        if (row) {
          if (success) success({ data: row.content })
          return
        }
        if (fail) fail(new Error('File not found: ' + filePath))
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
    /**
     * COS 附件：主上报成功后读路径、zip，按安卓端方式签名并 PUT 到 COS。
     * 不超过分块大小时一次 PUT；更大则走同一套分块上传。微信、QQ、WebGL 共用这次请求。
     */
    const g = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this

    function cosDbg(msg) {
      console.log('[CrashSight][CosAttach] ' + msg)
    }

    let cosToken = null
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

    const COS_BLOCK = 1024 * 1024
    const COS_ZIP_MAX = 20 * 1024 * 1024

    function rotl32(n, s) {
      return (n << s) | (n >>> (32 - s))
    }

    function sha1Hex(str) {
      const bytes = []
      for (let i = 0; i < str.length; i++) bytes.push(str.charCodeAt(i) & 255)
      const bitLen = bytes.length * 8
      bytes.push(0x80)
      while (bytes.length % 64 !== 56) bytes.push(0)
      const hi = Math.floor(bitLen / 0x100000000)
      const lo = bitLen >>> 0
      for (let i = 24; i >= 0; i -= 8) bytes.push((hi >>> i) & 255)
      for (let i = 24; i >= 0; i -= 8) bytes.push((lo >>> i) & 255)
      let h0 = 0x67452301
      let h1 = 0xefcdab89
      let h2 = 0x98badcfe
      let h3 = 0x10325476
      let h4 = 0xc3d2e1f0
      const w = new Array(80)
      for (let i = 0; i < bytes.length; i += 64) {
        for (let t = 0; t < 16; t++) {
          w[t] =
            (bytes[i + t * 4] << 24) |
            (bytes[i + t * 4 + 1] << 16) |
            (bytes[i + t * 4 + 2] << 8) |
            bytes[i + t * 4 + 3]
        }
        for (let t = 16; t < 80; t++) w[t] = rotl32(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1)
        let a = h0
        let b = h1
        let c = h2
        let d = h3
        let e = h4
        for (let t = 0; t < 80; t++) {
          let f
          let k
          if (t < 20) {
            f = (b & c) | (~b & d)
            k = 0x5a827999
          } else if (t < 40) {
            f = b ^ c ^ d
            k = 0x6ed9eba1
          } else if (t < 60) {
            f = (b & c) | (b & d) | (c & d)
            k = 0x8f1bbcdc
          } else {
            f = b ^ c ^ d
            k = 0xca62c1d6
          }
          const temp = (rotl32(a, 5) + f + e + k + w[t]) | 0
          e = d
          d = c
          c = rotl32(b, 30)
          b = a
          a = temp
        }
        h0 = (h0 + a) | 0
        h1 = (h1 + b) | 0
        h2 = (h2 + c) | 0
        h3 = (h3 + d) | 0
        h4 = (h4 + e) | 0
      }
      function hex32(n) {
        return ('00000000' + (n >>> 0).toString(16)).slice(-8)
      }
      return hex32(h0) + hex32(h1) + hex32(h2) + hex32(h3) + hex32(h4)
    }

    function bytesToBinary(arr) {
      let s = ''
      for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i] & 255)
      return s
    }

    function hmacSha1Hex(key, msg) {
      const k = []
      for (let i = 0; i < key.length; i++) k.push(key.charCodeAt(i) & 255)
      let keyBytes = k
      if (keyBytes.length > 64) {
        const hashed = sha1Hex(bytesToBinary(keyBytes))
        keyBytes = []
        for (let i = 0; i < hashed.length; i += 2) keyBytes.push(parseInt(hashed.substr(i, 2), 16))
      }
      while (keyBytes.length < 64) keyBytes.push(0)
      const ipad = []
      const opad = []
      for (let i = 0; i < 64; i++) {
        ipad.push(keyBytes[i] ^ 0x36)
        opad.push(keyBytes[i] ^ 0x5c)
      }
      const inner = sha1Hex(bytesToBinary(ipad) + msg)
      const innerBytes = []
      for (let i = 0; i < inner.length; i += 2) innerBytes.push(parseInt(inner.substr(i, 2), 16))
      return sha1Hex(bytesToBinary(opad) + bytesToBinary(innerBytes))
    }

    const COS_SIGN_EXPIRES = 900

    function cosUrlEncode(s) {
      return encodeURIComponent(String(s))
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/~/g, '%7E')
    }

    function encodedPairs(src) {
      const out = {}
      Object.keys(src || {}).forEach(function (name) {
        out[cosUrlEncode(name).toLowerCase()] = cosUrlEncode(src[name] == null ? '' : src[name])
      })
      return out
    }

    function cosSignature(secretKey, secretId, parameters, headers, method, start, end, uriPath) {
      const keyTime = String(start) + ';' + String(end)
      const signKey = hmacSha1Hex(secretKey, keyTime)
      const params = encodedPairs(parameters)
      const hdrs = encodedPairs(headers)
      const paramKeys = Object.keys(params).sort()
      const headerKeys = Object.keys(hdrs).sort()
      const paramStr = paramKeys.map(function (k) { return k + '=' + params[k] }).join('&')
      const headerStr = headerKeys.map(function (k) { return k + '=' + hdrs[k] }).join('&')
      const httpString = String(method).toLowerCase() + '\n' + uriPath + '\n' + paramStr + '\n' + headerStr + '\n'
      const stringToSign = 'sha1\n' + keyTime + '\n' + sha1Hex(httpString) + '\n'
      const signature = hmacSha1Hex(signKey, stringToSign)
      return 'q-sign-algorithm=sha1'
        + '&q-ak=' + secretId
        + '&q-sign-time=' + keyTime
        + '&q-key-time=' + keyTime
        + '&q-header-list=' + headerKeys.join(';')
        + '&q-url-param-list=' + paramKeys.join(';')
        + '&q-signature=' + signature
    }

    function md5RawBase64(bytes) {
      function rot(x, n) { return (x << n) | (x >>> (32 - n)) }
      function add(a, b) { return (a + b) | 0 }
      const shifts = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21]
      const K = []
      for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000)
      const len = bytes.length
      const bitLen = len * 8
      const withOne = len + 1
      const pad = (56 - (withOne % 64) + 64) % 64
      const total = withOne + pad + 8
      const buf = new Uint8Array(total)
      buf.set(bytes)
      buf[len] = 0x80
      const view = new DataView(buf.buffer)
      view.setUint32(total - 8, bitLen >>> 0, true)
      view.setUint32(total - 4, Math.floor(bitLen / 0x100000000), true)
      let a0 = 0x67452301
      let b0 = 0xefcdab89
      let c0 = 0x98badcfe
      let d0 = 0x10325476
      for (let i = 0; i < total; i += 64) {
        const words = []
        for (let j = 0; j < 16; j++) words[j] = view.getUint32(i + j * 4, true)
        let A = a0
        let B = b0
        let C = c0
        let D = d0
        for (let j = 0; j < 64; j++) {
          let F
          let g
          if (j < 16) {
            F = (B & C) | (~B & D)
            g = j
          } else if (j < 32) {
            F = (D & B) | (~D & C)
            g = (5 * j + 1) % 16
          } else if (j < 48) {
            F = B ^ C ^ D
            g = (3 * j + 5) % 16
          } else {
            F = C ^ (B | ~D)
            g = (7 * j) % 16
          }
          F = add(add(add(F, A), K[j]), words[g])
          A = D
          D = C
          C = B
          B = add(B, rot(F, shifts[j]))
        }
        a0 = add(a0, A)
        b0 = add(b0, B)
        c0 = add(c0, C)
        d0 = add(d0, D)
      }
      const out = new Uint8Array(16)
      const outView = new DataView(out.buffer)
      outView.setUint32(0, a0, true)
      outView.setUint32(4, b0, true)
      outView.setUint32(8, c0, true)
      outView.setUint32(12, d0, true)
      if (typeof btoa === 'function') return btoa(bytesToBinary(out))
      const d = deps()
      return d.toBase64 ? d.toBase64(out) : ''
    }

    function md5Base64Bytes(u8) {
      return md5RawBase64(u8 instanceof Uint8Array ? u8 : new Uint8Array(u8))
    }

    function signWindowNow() {
      const start = Math.floor((Date.now() + (cosToken.serverClientTimeGap || 0)) / 1000)
      return { start: start, end: start + COS_SIGN_EXPIRES }
    }

    function signWindowToken() {
      const start = Number(cosToken.tokenStartTime) || 0
      const end = Number(cosToken.tokenExpiredTime) || 0
      if (start > 0 && end > start) return { start: start, end: end }
      return signWindowNow()
    }

    function requestHost() {
      if (typeof qq !== 'undefined' && qq && typeof qq.request === 'function') return qq
      if (typeof tt !== 'undefined' && tt && typeof tt.request === 'function') return tt
      if (typeof wx !== 'undefined' && wx && typeof wx.request === 'function') return wx
      return null
    }

    function headerValue(headers, name) {
      if (!headers) return ''
      const want = name.toLowerCase()
      const keys = Object.keys(headers)
      for (let i = 0; i < keys.length; i++) {
        if (String(keys[i]).toLowerCase() === want) return headers[keys[i]]
      }
      return ''
    }

    function requestWithData(host, method, url, sent, data) {
      return new Promise(function (resolve, reject) {
        host.request({
          url: url,
          method: method,
          header: sent,
          data: data,
          dataType: 'text',
          responseType: 'text',
          success: function (res) {
            resolve({
              statusCode: Number(res && res.statusCode),
              data: res && res.data,
              header: (res && (res.header || res.headers)) || {}
            })
          },
          fail: function (err) {
            reject({ statusCode: 0, message: err && err.errMsg ? err.errMsg : 'request fail', errMsg: err && err.errMsg })
          }
        })
      })
    }

    function sendMiniProgramBody(host, method, url, sent, payload) {
      if (!payload || !host.getFileSystemManager || !host.env || !host.env.USER_DATA_PATH) {
        return requestWithData(host, method, url, sent, payload)
      }
      const filePath = host.env.USER_DATA_PATH + '/cs-cos-body.bin'
      const fs = host.getFileSystemManager()
      return new Promise(function (resolve, reject) {
        fs.writeFile({
          filePath: filePath,
          data: payload,
          success: function () { resolve() },
          fail: function (err) { reject({ statusCode: 0, message: err && err.errMsg ? err.errMsg : 'write body failed' }) }
        })
      }).then(function () {
        return new Promise(function (resolve, reject) {
          fs.readFile({
            filePath: filePath,
            success: function (res) { resolve(res.data) },
            fail: function (err) { reject({ statusCode: 0, message: err && err.errMsg ? err.errMsg : 'read body failed' }) }
          })
        })
      }).then(function (data) {
        return requestWithData(host, method, url, sent, data)
      })
    }

    function cosHttp(method, url, headers, body) {
      const host = requestHost()
      const payload = body ? body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) : null
      if (host) {
        const sent = {}
        Object.keys(headers).forEach(function (name) { sent[name] = headers[name] })
        if (payload && !headerValue(sent, 'content-type')) sent['content-type'] = 'application/octet-stream'
        return sendMiniProgramBody(host, method, url, sent, payload)
      }
      return new Promise(function (resolve, reject) {
        if (typeof XMLHttpRequest === 'undefined') {
          reject(new Error('no upload transport'))
          return
        }
        const xhr = new XMLHttpRequest()
        xhr.open(method, url, true)
        Object.keys(headers).forEach(function (name) {
          if (name.toLowerCase() === 'host' || name.toLowerCase() === 'content-length') return
          xhr.setRequestHeader(name, headers[name])
        })
        xhr.onload = function () {
          const hdr = {}
          const raw = xhr.getAllResponseHeaders() || ''
          raw.split(/\r?\n/).forEach(function (line) {
            const i = line.indexOf(':')
            if (i > 0) hdr[line.slice(0, i).trim()] = line.slice(i + 1).trim()
          })
          resolve({ statusCode: xhr.status, data: xhr.responseText, header: hdr })
        }
        xhr.onerror = function () {
          reject({ statusCode: xhr.status || 0, message: 'network error' })
        }
        xhr.send(payload)
      })
    }

    function applyUnsignedCosHeaders(headers, sse) {
      headers['x-cos-security-token'] = cosToken.sessionToken
      headers['x-cos-storage-class'] = 'STANDARD_IA'
      headers['x-cos-server-side-encryption-customer-algorithm'] = 'AES256'
      headers['x-cos-server-side-encryption-customer-key'] = sse.customerKey
      headers['x-cos-server-side-encryption-customer-key-MD5'] = sse.customerKeyMd5
    }

    function rejectUnless2xx(res) {
      if (res.statusCode >= 200 && res.statusCode < 300) return res
      throw { statusCode: res.statusCode, message: String(res.data || '').slice(0, 180) }
    }

    function uploadOnce(url, uriPath, body, sse) {
      const contentMd5 = md5Base64Bytes(body)
      if (!contentMd5) return Promise.reject(new Error('content md5 missing'))
      const win = signWindowNow()
      const signed = { Host: cosToken.domain, 'Content-MD5': contentMd5 }
      const authorization = cosSignature(
        cosToken.tmpSecretKey, cosToken.tmpSecretId, {}, signed, 'PUT', win.start, win.end, uriPath
      )
      const headers = {
        Host: cosToken.domain,
        'Content-MD5': contentMd5,
        'Content-Length': String(body.length),
        Authorization: authorization
      }
      applyUnsignedCosHeaders(headers, sse)
      cosDbg('HTTP PUT: ' + uriPath + ' bytes=' + body.length)
      return cosHttp('PUT', url, headers, body).then(rejectUnless2xx)
    }

    function uploadMultipart(url, uriPath, body, sse) {
      const win = signWindowToken()
      const initAuth = cosSignature(
        cosToken.tmpSecretKey, cosToken.tmpSecretId, {}, { Host: cosToken.domain }, 'POST', win.start, win.end, uriPath
      )
      const initHeaders = { Host: cosToken.domain, Authorization: initAuth }
      applyUnsignedCosHeaders(initHeaders, sse)
      cosDbg('HTTP POST: multipart init ' + uriPath + ' bytes=' + body.length)
      return cosHttp('POST', url + '?uploads', initHeaders, null).then(function (res) {
        rejectUnless2xx(res)
        const uploadId = (String(res.data || '').match(/<UploadId>([^<]*)<\/UploadId>/) || [])[1]
        if (!uploadId) throw { statusCode: res.statusCode, message: 'upload id missing' }
        const parts = []
        let offset = 0
        let partNumber = 1
        function nextPart() {
          if (offset >= body.length) return completeParts(uploadId, parts, win, url, uriPath, sse)
          const end = Math.min(offset + COS_BLOCK, body.length)
          const chunk = body.subarray(offset, end)
          const contentMd5 = md5Base64Bytes(chunk)
          const number = String(partNumber)
          const authorization = cosSignature(
            cosToken.tmpSecretKey,
            cosToken.tmpSecretId,
            { partNumber: number, uploadId: uploadId },
            { Host: cosToken.domain, 'Content-MD5': contentMd5 },
            'PUT',
            win.start,
            win.end,
            uriPath
          )
          const headers = {
            Host: cosToken.domain,
            'Content-MD5': contentMd5,
            'Content-Length': String(chunk.length),
            Authorization: authorization
          }
          applyUnsignedCosHeaders(headers, sse)
          const partUrl = url + '?partNumber=' + number + '&uploadId=' + encodeURIComponent(uploadId)
          return cosHttp('PUT', partUrl, headers, chunk).then(function (partRes) {
            rejectUnless2xx(partRes)
            const etag = headerValue(partRes.header, 'etag')
            if (!etag) throw { statusCode: partRes.statusCode, message: 'etag missing' }
            parts.push({ number: partNumber, etag: etag })
            offset = end
            partNumber += 1
            return nextPart()
          })
        }
        return nextPart()
      })
    }

    function completeParts(uploadId, parts, win, url, uriPath, sse) {
      let xml = '<CompleteMultipartUpload>\n'
      for (let i = 0; i < parts.length; i++) {
        xml += '<Part>\n<PartNumber>' + parts[i].number + '</PartNumber>\n<ETag>' + parts[i].etag + '</ETag>\n</Part>\n'
      }
      xml += '</CompleteMultipartUpload>'
      const xmlBytes = new Uint8Array(xml.length)
      for (let i = 0; i < xml.length; i++) xmlBytes[i] = xml.charCodeAt(i) & 255
      const contentMd5 = md5Base64Bytes(xmlBytes)
      const authorization = cosSignature(
        cosToken.tmpSecretKey,
        cosToken.tmpSecretId,
        { uploadId: uploadId },
        { Host: cosToken.domain, 'Content-MD5': contentMd5 },
        'POST',
        win.start,
        win.end,
        uriPath
      )
      const headers = {
        Host: cosToken.domain,
        'Content-MD5': contentMd5,
        'Content-Length': String(xmlBytes.length),
        'Content-Type': 'application/xml',
        Authorization: authorization
      }
      applyUnsignedCosHeaders(headers, sse)
      return cosHttp('POST', url + '?uploadId=' + encodeURIComponent(uploadId), headers, xmlBytes).then(rejectUnless2xx)
    }

    function postCosAttachment(uriPath, zipBytes, sse) {
      const u8 = zipBytes instanceof Uint8Array ? zipBytes : new Uint8Array(sliceBodyBuffer(zipBytes))
      if (u8.length > COS_ZIP_MAX) return Promise.reject(new Error('zip exceeds size limit'))
      if (Number(cosToken.vendor) === 1) return Promise.reject(new Error('s3 vendor is not used'))
      const url = 'https://' + cosToken.domain + uriPath
      if (u8.length <= COS_BLOCK) return uploadOnce(url, uriPath, u8, sse)
      return uploadMultipart(url, uriPath, u8, sse)
    }

    function flushAndUpload(entries, opt) {
      if (!cosToken) {
        cosDbg('upload: abort — no cos token')
        return Promise.resolve(false)
      }
      cosDbg('upload: step 1/5 token ok bucket=' + cosToken.bucket + ' region=' + cosToken.region)
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
      const uriPath = '/' + expUid.substr(0, 16) + '/' + appIdStr + '/' + shortVer + '.zip'
      cosDbg('upload: step 4/5 uriPath=' + uriPath + ' zipBytes=' + zipBytes.byteLength + ' appId=' + appIdStr + ' shortVer=' + shortVer)
      const sse = customerKeysForExpUid(expUid)
      if (!sse.customerKey || !sse.customerKeyMd5) {
        cosDbg('upload: warn — SSE-C keys empty (deps.md5 / strToU8 / toBase64?)')
      }
      cosDbg('upload: step 5/5 SSE-C + STANDARD_IA headers ready')
      const tryRun = function (attemptLabel) {
        cosDbg('upload: ' + attemptLabel)
        return postCosAttachment(uriPath, zipBytes, sse)
          .then(function () {
            cosDbg('upload: success key=' + uriPath)
            console.log('[CrashSight][CosAttach] upload ok ' + uriPath)
            return true
          })
          .catch(function (e) {
            const sc = e && typeof e.statusCode !== 'undefined' ? e.statusCode : ''
            const msg = e && (e.errMsg || e.message || e.error || e.Message || '')
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
              cosDbg('upload: success on retry key=' + uriPath)
              console.log('[CrashSight][CosAttach] upload ok (retry) ' + uriPath)
            } else {
              cosDbg('upload: failed after 2 attempts key=' + uriPath)
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
      // 抖音 readFile 返回的 ArrayBuffer / TypedArray 可能跨 realm，instanceof 会失败。
      const tag = Object.prototype.toString.call(d)
      if (tag === '[object Uint8Array]' || d instanceof Uint8Array) return d.byteLength ? d : null
      if (tag === '[object ArrayBuffer]' || d instanceof ArrayBuffer) {
        const u = new Uint8Array(d)
        return u.byteLength ? u : null
      }
      if (typeof d === 'string') {
        if (!d.length) return null
        return ddeps.strToU8(d)
      }
      if (d.buffer && typeof d.BYTES_PER_ELEMENT === 'number' && d.byteLength > 0) {
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

;


    // ========================== CrashSgiht Core Begin===============================
    // 宿主识别顺序：QQ -> 抖音 -> 微信 -> WebGL/浏览器垫片。
    // 抖音要排在微信前：部分基础库同时有 tt 和 wx，先认 wx 会把抖音标成微信。
    // 原生 / Cocos / Laya / Unity 共用这段逻辑；不要改成互斥包，否则微信/WebGL 会分叉。
    let platformVendor = null
    let sdkName = 'WXCrashSightSDK'
    if (typeof globalThis.qq !== 'undefined') {
      platformVendor = globalThis.qq
      sdkName = 'QQCrashSightSDK'
      console.log("[CrashSight][Info] platform is qq")
    } else if (typeof globalThis.tt !== 'undefined') {
      platformVendor = globalThis.tt
      sdkName = 'DYCrashSightSDK'
      console.log("[CrashSight][Info] platform is tt")
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
    const sdkVersion = '1.8'
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

    // 抖音只通过 success 回调给网络类型，不返回 Promise。微信/QQ 在不传回调时返回 Promise，WebGL 垫片同步返回对象。
    const readNetworkType = function () {
      return new Promise(function (resolve) {
        let settled = false
        const finish = function (res) {
          if (settled) return
          settled = true
          resolve(res || null)
        }
        if (!platformVendor || typeof platformVendor.getNetworkType !== 'function') {
          finish(null)
          return
        }
        try {
          const ret = platformVendor.getNetworkType({
            success: function (res) { finish(res) },
            fail: function () { finish(null) }
          })
          // 空 Promise 先 resolve 时不能盖住随后到达的 success。
          if (ret && typeof ret.then === 'function') {
            ret.then(function (res) {
              if (res && res.networkType) finish(res)
            }, function () {})
          } else if (ret && typeof ret === 'object' && ret.networkType) {
            finish(ret)
          }
        } catch (error) {
          finish(null)
        }
        setTimeout(function () { finish(null) }, 3000)
      })
    }

    const buildRequestJson = async function (obj, cmd) {
      let ret = await readNetworkType()
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

