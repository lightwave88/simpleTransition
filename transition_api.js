(function ($) {
    const Transition = $._area88.transition;
    const Config = Transition.config;
    ////////////////////////////////////////////////////////////////////////////
    //
    // transition API
    //
    ////////////////////////////////////////////////////////////////////////////
    // cssKeys，告訴要用哪些 css.key 執行 stop
    $.fn.transStop = function (jumpToEnd, cssKeys) {
        this.each(function (i, dom) {
            $.transStop(dom, jumpToEnd, cssKeys);
        });
        return this;
    };
    //==========================================================================
    // cssSetting: 通常是 cssSetting，但也可以是 function 執行 jq 命令
    // options: queue(是否使用對列),easing(動畫曲線),delay(動畫延遲)
    // start(), step(), complete()
    $.fn.transition = function (cssSetting, duration, options) {

        this.each(function (i, dom) {
            $.transition(dom, cssSetting, duration, options);
        });

        return this;
    };

    // 短版命令
    $.fn.trans = $.fn.trans || $.fn.transition;
    //==========================================================================
    // 會返回 promise
    $.fn.pTransition = function (cssSetting, duration, options) {
        var promiseList = [];

        this.each(function (i, dom) {
            var promise = $.pTransition(dom, cssSetting, duration, options);
            promiseList.push(promise);
        });

        return Promise.all(promiseList);
    };

    // 短命令
    $.fn.pTrans = $.fn.pTrans || $.fn.pTransition
    //==========================================================================
    // 藉由切換 className 來動畫
    $.fn.toggleTrans = function (className, options) {
        // 未
        // step 不能加入 %
        // 等同 $().transEnd().toggleClass()
    };
    //==========================================================================
    // 在傳統操作前先加入一個計時器與綁定 transEnd 事件
    // 例如 $(dom).transEnd().toggleClass();
    $.fn.transEnd = function (options) {
        // 未
        // step 不能加入 %
    };

    ////////////////////////////////////////////////////////////////////////////
    $.transStop = function (dom, jumpToEnd, cssKeys) {
        // debugger;
        // 未
        // stop 應該參照 transition-property
        // 來設置 style

        return;


        if (/^queue/i.test(dom.dataset.area88Trans) || /^queue/i.test(dom.dataset.area88Delay)) {
            // 運動方式是用 delay
            $(dom).clearQueue();
        }

        transObj = $(dom).data('area88TransObj');
        if (transObj) {
            // console.log('call stop');
            transObj.stop(jumpToEnd);

        } else if (Array.isArray(cssKeys)) {
            // 不是用 transObj 啟動的動畫
            // 必須手動輸入要處理的 cssKey

            // redraw
            dom.offsetWidth;
            dom.clientLeft;

            var _cssSetting = {};

            cssKeys.forEach(function (key) {
                _cssSetting[key] = $(dom).css(key);
            });

            $(dom).css(_cssSetting);
        }
        return dom;
    };
    //==========================================================================
    $.transition = function (dom, cssSetting, duration, options) {
        let p = $.pTransition(dom, cssSetting, duration, options);
        p.then(function () {
            // 避免瀏覽器出現警告
        }, function (e) {
            // 避免瀏覽器出現警告
            throw e;
        });
    };
    //==========================================================================
    // 主要由此進來
    // 主要 action=animate 會返回 promise
    $.pTransition = function (dom, cssSetting, duration, options) {
        debugger;

        let Trans = $._area88.transition;
        let Action = Trans.Action;
        //----------------------------
        if (!options) {
            options = duration;
            duration = null;
        }
        //----------------------------
        let promise = Promise.resolve();
        let def = $.Deferred();
        promise = promise.then(function () {
            return def.promise();
        }, null);
        //----------------------------
        let setting;

        if ($.isPlainObject(cssSetting) || typeof cssSetting == 'function') {
            // $.pTransition(dom, .......)
            setting = organizeArgs(dom, cssSetting, duration, options);
        } else {
            let error = new Error('cssSetting typeError');
            def.reject(error);
            return promise;
        }
        /*------------------------------------*/
        let transObj = $(dom).data('area88TransformData');

        // 有關 queue 的設置
        if (setting.queue) {
            // 若要設置 queue

            if (transObj && !transObj.queue) {
                // 還有命令在身上
                // 且不是 queue
                let error = new Error('noqueue after queue');
                def.reject(error);
                return promise;
            }

            $(dom).queue(function (next) {
                // debugger;

                // animate
                console.dir(Action);

                let p = Action.animate(dom, setting);

                p.done(function () {
                    def.resolve(dom);
                })
                    .catch(function (e) {
                        def.reject(e);
                    })
                    .always(function () {
                        // 對列繼續

                        console.log('queue next');
                        next();
                    });
            });
        } else {
            // 若不用 queue
            if (transObj) {
                // 有運動命令在身上
                // 改成 stop 然後接續運動
                let error = new Error("dom still moving can't assign new command");
                def.reject(error);
                return promise;
            }

            // animate
            Action.animate(dom, setting)
                .done(function () {
                    def.resolve(dom);
                })
                .catch(function (e) {
                    def.reject(e);
                });
        }
        return promise;
    };
    ////////////////////////////////////////////////////////////////////////////
    // 整理 args
    function organizeArgs(dom, cssSetting, duration, options) {
        debugger;

        const Trans = $._area88.transition;
        options = options || {};

        if (!$.isPlainObject(cssSetting) && typeof cssSetting != 'function') {
            throw new TypeError('arguments[0] must be plainObject or function');
        }

        let defautAnimSetting = {
            dom: dom,
            css: cssSetting,
            queue: true,
            duration: (typeof duration == "number" ? duration : null),
            easing: null,
            delay: null,
            start: null,
            step: null,
            complete: null
        };

        defautAnimSetting = $.extend({}, defautAnimSetting, options);
        //----------------------------
        if (defautAnimSetting.duration == null) {
            let duration = Trans.time2Microsecond($.css(dom, "transition-duration"));

            if (duration) {
                defautAnimSetting.duration = duration;
            }
        }

        if (defautAnimSetting.easing == null) {
            let easing = $.css(dom, "transition-timing-function");
            if (easing != null) {
                defautAnimSetting.easing = easing;
            }
        }

        if (defautAnimSetting.delay == null) {
            let delay = Trans.time2Microsecond($.css(dom, "transition-delay"));

            if (delay) {
                defautAnimSetting.delay = delay;
            }
        }
        //----------------------------
        return defautAnimSetting;
    }
})($ || jQuery || {});
