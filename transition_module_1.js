!(function ($) {
    const Trans = $._area88.transition;
    const Config = $._area88.transition.config;
    //--------------------------------------------------------------------------
    // 對 jquery 的功能擴增

    $.fn.redraw = $.fn.redraw || function () {
        // $(window).trigger('resize');

        return this.each(function (i, dom) {
            $.redraw(dom);
        });
    };
    //----------------------------
    $.redraw = $.redraw || function (dom) {
        let style = dom.style;

        let display = style.getPropertyValue('display');
        style.setProperty('display', 'none');

        if (display) {
            style.setProperty('display', display);
        } else {
            style.removeProperty('display');
        }
        //------------------
        dom.offsetWidth;
        dom.clientLeft;
    };
    //----------------------------
    // 會返回 css, style
    $.fn.getTransformData = $.fn.getTransformData || function (enforce) {
        let res;
        this.each(function (i, dom) {
            res = $.getTransformData(dom, enforce);
        });
        return res;
    };
    //----------------------------
    // 設定或取得 matrix
    // 假如 data = boolean： 若 matrix 未設定，是否要強迫設定後取值
    $.getTransformData = function (dom, enforce) {
        // debugger;
        let res = {
            css: null,
            style: null
        };

        let default_data = {
            translateX: null,
            translateY: null,
            rotate: null,
            scaleX: null,
            scaleY: null,
            matrix: null
        };

        enforce = enforce ? true : false;
        //----------------------------
        // 取得 css.transform
        res["css"] = getCssTransformData(dom, enforce);

        // 取得 style.transform
        res["style"] = getStyleTransformData(dom);
        //----------------------------

        if (res["css"] != null) {
            res["css"] = $.extend({}, default_data, res["css"]);
        }

        if (res["style"] != null) {
            res["style"] = $.extend({}, default_data, res["style"]);
        }
        return res;
    };
    //----------------------------
    function getStyleTransformData(dom) {
        // debugger;
        let style = {};
        let cssText = dom.style.cssText;

        if (!/(^|;)\s*transform:/.test(cssText)) {
            // style 沒設定 transform
            return null;
        } else if (/(^|;)\s*transform:\s*matrix/.test(cssText)) {
            // 若 style 的設定是 matrix
            // 則取 css 的值
            return style;
        }
        //----------------------------
        let reg_res = /(?:^|;)\s*transform:(.*?)(?:;|$)/i.exec(cssText);

        if (reg_res == null || reg_res[1] == null) {
            return null;
        }
        //----------------------------
        // 把 transform 的命令獨立出來

        let transformText = reg_res[1].trim();
        let transformList = transformText.split(")");

        transformList = transformList.filter(function (v) {
            if (/\S+/.test(v)) {
                return true;
            }
        });

        transformList = transformList.map(function (v) {
            let res = v.replace(/\s/, "");
            return (res + ")");
        });
        //----------------------------
        // 把 transform 的命令原子化
        // 如 translate => (translateX|translateY)
        for (let i = 0; i < transformList.length; i++) {
            let setting = transformList[i];

            let reg_res = /^([a-z]+)\((.*?)\)/i.exec(setting);
            let key = reg_res[1];
            let value = reg_res[2];

            //----------------------------
            let hookList = [];

            // 拜訪所有 hook
            Config.multiTransformKey.forEach(function (fn) {
                if (fn(key, value)) {
                    hookList.push(fn);
                }
            });
            //------------------
            if (!hookList.length) {
                style[key] = value;
            } else if (hookList.length > 1) {
                throw new Error("Config.multiTransformKey have multy in (" + key + "=>" + value + ")");
            } else {
                let hook = hookList[0];
                let keyList = hook(key, value, true);
                let valueList = value.split(",");
                //------------------
                keyList.forEach(function (k, i) {
                    // trnasform.scale 會需要，scale(1) => scaleX(1),scaleY(1);
                    let v = (valueList[i] == null) ? valueList[0] : valueList[i];
                    style[k] = v;
                });
            }
        } // for end
        //----------------------------
        return style;
    }
    //----------------------------
    function getCssTransformData(dom, enforce) {
        // debugger;

        let css = {};

        _matrix = $.css(dom, 'transform');
        _matrix = _matrix.replace(/\s/, "");

        if (/^none/i.test(_matrix)) {

            // 若沒有設定 matrix
            if (enforce) {
                $(dom).css({
                    transform: 'scaleX(1)'
                });

                _matrix = $.css(dom, 'transform');
            } else {
                return null;
            }
        }
        //----------------------------
        let reg = /^matrix\((.*?)\)/;

        let _res = reg.exec(_matrix);
        _matrix = _res[1];

        let matrix = [
            [],
            []
        ];
        let translate = [];

        _matrix = _matrix.split(',');

        for (let i = 0; i < _matrix.length; i++) {
            // debugger;

            let value = Number(_matrix[i]);
            _matrix[i] = value;
            if (i < 4) {
                let m = i % 2;
                let n = Math.floor(i / 2);
                matrix[m][n] = value;
            } else {
                translate.push(value);
            }
        }
        //----------------------------

        let radians = Math.atan2(matrix[1][0], matrix[0][0]);
        let rotate = radians;
        rotate = (rotate < 0 ? (2 * Math.PI + rotate) : rotate);

        let scaleX = Math.sqrt(Math.pow(matrix[0][0], 2) + Math.pow(matrix[1][0], 2));
        let scaleY = Math.sqrt(Math.pow(matrix[0][1], 2) + Math.pow(matrix[1][1], 2));
        //----------------------------
        css['translateX'] = translate[0]; // px
        css['translateY'] = translate[1]; // px
        css['rotate'] = rotate; // rad(弧度)
        css['scaleX'] = scaleX;
        css['scaleY'] = scaleY;
        css['matrix'] = _matrix;

        return css;
    }
})($ || jQuery || {});
////////////////////////////////////////////////////////////////////////////////
!(function ($) {

    // 異步函式
    $._area88.transition.async = (function () {
        let async;

        if (typeof setImmediate !== 'undefined') {
            async = function (fn) {
                setImmediate(fn);
            };
        } else {
            async = function (fn) {
                setTimeout(fn, 0);
            };
        }
        return async;
    })();
    //==========================================================================
    // 计时器
    // transition.setInterval
    //
    // 用法
    // let timeHandle = $._area88.transition.setInterval(callback)
    // 每隔 16ms調用 callback
    //
    // $._area88.transition.setInterval(timeHandle)
    // 取消 setInterval 的功能

    // callback => function|timeHandle
    $._area88.transition.setInterval = (function () {

        function AnimatLoop(callback) {
            if (typeof callback === 'function') {
                let core = AnimatLoop.setInterval(callback);
                let handle = {};

                Object.defineProperty(handle, 'handle', {
                    value: core,
                    enumerable: false,
                    writable: false,
                    configurable: true
                });

                return handle;
            } else {
                AnimatLoop.clearInterval(callback);
            }
        }
        //----------------------------
        !(function (_self) {

            // 决定计时器的方法是哪一种
            _self.coreMethod = (typeof window.requestAnimationFrame !== 'undefined') ? AnimatLoop_request : AnimatLoop_interval;

            //----------------------------
            // API
            _self.clearInterval = function (timeHandle) {
                let handle;

                if (typeof (handle = timeHandle.handle) === 'undefined' || !(handle instanceof this.coreMethod)) {
                    throw new Error('timeHandle type error');
                }
                handle.clearInterval();
            };
            //----------------------------
            // API
            _self.setInterval = function (callback) {
                let core = new this.coreMethod();
                core.setInterval(callback);
                return core;
            };

        })(AnimatLoop);

        //----------------------------------------------------------
        // 计时器方法1
        // setTimeout
        function AnimatLoop_interval() {
            this.timeInterval = 16;
            this.timeHandle;
        }
        !(function () {
            this.clearInterval = function () {
                clearInterval(this.timeHandle);
                this.timeHandle = undefined;
            };
            //----------------------------
            this.setInterval = function (callback) {
                this.timeHandle = setInterval(callback, this.timeInterval);
            };
        }).call(AnimatLoop_interval.prototype);
        //----------------------------------------------------------
        // 计时器方法2
        // requestAnimationFrame
        function AnimatLoop_request() {
            this.timeHandle = false;
        }
        !(function () {
            this.clearInterval = function () {
                this.timeHandle = true;
            };
            //----------------------------
            this.setInterval = function (callback) {

                if (this.timeHandle) {
                    this.timeHandle = false;
                    return;
                }
                callback();

                let job = (function (callback) {
                    this.setInterval(callback)
                }).bind(this, callback);

                requestAnimationFrame(job);
            };
        }).call(AnimatLoop_request.prototype);
        return AnimatLoop;
    })();
    //==========================================================================

})($ || jQuery || {});
////////////////////////////////////////////////////////////////////////////////
!(function ($) {
    const Trans = $._area88.transition

    // timer 模組
    // 計時器模組
    $._area88.transition.Timer = {};
    //----------------------------
    !(function (_self) {
        _self.running = undefined;

        // 用 dom 做 key
        // 確保一個 dom 同一時間只有一個任務在跑
        _self.timers = new Map();
        //----------------------------------------------------------------------
        _self.add = function (dom, x) {
            // console.log('add');
            if (this.timers.has(dom)) {
                // 屬於該 dom 的工作正在執行中
                return;
            }

            if (typeof x !== 'function') {
                throw new TypeError("no set callback");
            }

            this.timers.set(dom, x);
            this._$start();
        };
        //----------------------------------------------------------------------
        // 移除要監控的程序
        _self.removeJob = function (dom) {
            // console.log('remove job');
            this.timers.delete(dom);
        };
        //----------------------------------------------------------------------
        _self._$start = function () {

            let job = (function () {
                // 每個間隔做一次任務檢查
                this._$tickCheck();
            }).bind(_self);
            //----------------------------
            if (!this.running) {
                // 啟動一個計時器
                this.running = Trans.setInterval(job);
            }
        };
        //----------------------------------------------------------------------
        _self._$stop = function () {
            Trans.setInterval(this.running);
            this.running = undefined;
        };

        //----------------------------------------------------------------------
        _self._$tickCheck = function () {

            if (!this.timers.size) {
                // 沒有任務了，停止計時器
                this._$stop();
            }
            var currentTime = (new Date()).getTime();

            // 回圈所有要執行的任務
            this.timers.forEach(function (job, k, i) {
                let res = job(currentTime);
                // console.log('tick:', res);
                if (res === false) {
                    // console.log('call remove job');
                    this.removeJob(k);
                }
            }, this);
        };
        //----------------------------------------------------------------------
    })($._area88.transition.Timer);

}($ || jQuery || {}));
////////////////////////////////////////////////////////////////////////////////
(function () {
    const Trans = $._area88.transition;

    // 把css時間格式轉成 ms
    Trans.time2Microsecond = function (t) {
        let res = null;
        let reg_res = /([0-9.]*)(m?)(s)$/.exec(t);
        if (reg_res) {
            if (reg_res[2] != null && reg_res[2].length > 0) {
                // ms
                res = Number(reg_res[1]);
            } else {
                // s
                res = Number(reg_res[1]) * 1000;
            }
        }
        return res;
    };

}($ || jQuery || {}));
