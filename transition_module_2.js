!(function ($) {
    const Transition = $._area88.transition;
    const Config = Transition.config;
    Transition.Action = Action;
    const Timer = Transition.Timer;

    function Action(dom, userSetting) {
        this.fn = Action;
        this.dom;
        this.userSetting;
        this.queue;
        //----------------------------
        // 合作的模組
        this.timer;
        this.cssDataObj;
        //----------------------------
        this.def;
        //----------------------------
        // 0: 初始化
        // 1: delay
        // 2: animate
        // 3: end
        this.status = 0;
        //----------------------------
        // 動畫開始時間
        this.startTime;
        // 預估動畫結束時間
        this.endTime;

        // 是否有設置 delay
        this.delay_timeHandle;
        //----------------------------
        this.__construct(dom, userSetting);
    }
    //==========================================================================

    (function (_self) {
        // 對外命令
        _self.stop = function () {

        };
        //----------------------------------------------------------------------
        _self.animate = function (dom, userSetting) {
            // debugger;

            if ($(dom).data('area88TransObj')) {
                throw new Error("still have action");
            }
            let action = new Action(dom, userSetting);

            return action.def;
        };
        //----------------------------------------------------------------------
        _self.triggerEvent = function (dom, evenName) {
            let event;

            try {
                event = new CustomEvent(evenName);
            } catch (error) { }

            if (event) {
                dom.dispatchEvent(event);
            } else {
                $(dom).trigger(evenName);
            }
        };

    })(Action);
    //==========================================================================
    (function () {
        this.__construct = function (dom, userSetting) {
            this.dom = dom;

            // 旗標
            $(dom).data('area88TransformData', this);

            this.userSetting = userSetting;

            this._checkSetting();

            this.def = $.Deferred();

            //----------------------------
            debugger;
            // 處理 css 設定
            this.cssDataObj = new Transition.CssData(dom, userSetting);
            this.cssDataObj.aboutStyleSetting();
            //----------------------------
            debugger;
            console.dir(this.cssDataObj);
            this._aboutAnimate();
        };
        //------------------------------------------------------------------
        this._checkSetting = function () {
            // debugger;

            this.queue = this.userSetting.queue;

            // 關於 easing 的設定
            let easing = this.userSetting.easing;

            if (easing && typeof (Config.cssEase[easing]) !== 'undefined') {
                this.userSetting.easing = Config.cssEase[easing];
            }
            //----------------------------
            // duration
            if (typeof this.userSetting.duration !== 'number') {
                this.userSetting.duration = Config.defaultDuration;
            }
            //----------------------------
        };
        //------------------------------------------------------------------
        this._aboutAnimate = function () {
            // debugger;
            // console.dir(this);
            // return;
            //----------------------------

            let userSetting = this.userSetting;

            // start, step
            let start;
            if (typeof (start = userSetting.start) === 'function') {
                start.call(userSetting.dom);
            }
            //----------------------------
            if (typeof userSetting.delay === 'number' && userSetting.delay > 0) {
                // 若有設定 delay
                this._animate_delay();
            } else {
                // start here
                this._animate_move();
            }
        };
        //------------------------------------------------------------------
        // 若有設置 delay
        this._animate_delay = function () {
            this.status = 1;

            let self = this;
            let userSetting = this.userSetting;

            let delayTime = userSetting.delay;

            // redraw
            $(this.dom).redraw();

            this._bindEndEvent();

            this.delay_timeHandle = setTimeout(function () {
                // start here
                self.delay_timeHandle = undefined;
                self._animate_move();
            }, delayTime);
        }
        //------------------------------------------------------------------
        // 檢查 duration
        this._animate_move = function () {
            // debugger;
            let userSetting = this.userSetting;
            let cssDataObj = this.cssDataObj;
            let cssSetting = cssDataObj.cssSetting;

            if (userSetting.duration <= 0) {
                // 不需要運動時間的運動
                this.status = 2;

                if (typeof cssSetting == "function") {
                    cssSetting.call(this.dom);
                } else {
                    $(this.dom).css(cssSetting);
                }

                // 結尾要做的事
                this._transEnd();
            } else {

                if (this.status == 1) {
                    // 之前有 delay
                    this.status = 2;

                    getJob(this)();
                } else {
                    // 之前沒設置 delay
                    this.status = 2;
                    // redraw
                    $(this.dom).redraw();

                    this._bindEndEvent();

                    // 這步不能放 redraw() 前面
                    // 會發生怪事
                    // this._setAnimationProperty();

                    Transition.async(getJob(this));
                }
                //----------------------------
                function getJob(obj) {
                    return (function (userSetting, cssSetting) {
                        // debugger;
                        // 開始動畫步驟

                        let transform = $.style(this.dom, "transform");
                        console.log("before animate transform(%s)", transform);

                        this._setAnimationProperty();

                        this.startTime = (new Date()).getTime();
                        this.endTime = this.startTime + userSetting.duration + Config.timerEndInterval;
                        //-----------------------
                        if (typeof cssSetting == "function") {
                            cssSetting.call(this.dom);
                        } else {
                            $(this.dom).css(cssSetting);
                        }
                        //-----------------------
                        this._addJob2Timer();

                    }).bind(obj, userSetting, cssSetting);
                }
            }
        };
        //------------------------------------------------------------------
        // 綁定 transEnd 事件
        this._bindEndEvent = function () {
            let transEnd = this._transEnd.bind(this);

            $(this.dom).off('transitionend' + '.area88.complete');
            // 綁定(transitionend.area88.complete)事件
            $(this.dom).one('transitionend' + '.area88.complete', transEnd);
        };
        //------------------------------------------------------------------
        // 動畫結束要做的事
        this._transEnd = function () {
            // debugger;

            console.log('animation end');

            // 旗標
            this.status = 3;

            // 移除計時器的計時
            Timer.removeJob(this.dom);

            //----------------------------
            // 恢復動畫前的 trans 設定
            // 因為覆寫過他
            let prev_transData = this.cssDataObj.prev_transSetting;
            let userSetting = this.userSetting;

            $(this.dom).css({
                "transition-property": prev_transData["property"],
                "transition-duration": prev_transData["duration"],
                "transition-delay": prev_transData["delay"],
                "transition-timing-function": prev_transData["easing"]
            });

            this._fixTransform();

            // 應該沒有用
            $(this.dom).redraw();
            //----------------------------
            // 給予瀏覽器準備時間
            // 確定 redraw() 效果
            setTimeout((function () {
                // 打開旗標
                $(this.dom).removeData('area88TransformData');
                this.def.resolve();
            }).bind(this), Config.lockDuration);
            //----------------------------
            let step;
            if (typeof (step = userSetting.step) === 'function') {
                step.call(this.dom, 1);
            }

            let complete;
            if (typeof (complete = userSetting.complete) === 'function') {
                complete.call(this.dom);
            }
        };
        //----------------------------------------------------------------------
        // 為了 transform.rotate(+-=)而設的
        this._fixTransform = function () {
            // debugger;
            // 若 transform 有 rotate
            // 就要執行

            // return;

            let cssText = this.dom.style.cssText;
            if (!/(^|;)transform/.test(cssText)) {
                // 若沒有設置 transform
                return;
            }

            let reg_res = /transform:(.*?)(?:$|;)/g.exec(cssText);

            if (reg_res == null || reg_res[1] == null || !/rotate\(/.test(reg_res[1])) {
                // 若 transform 沒有設置 rotate
                return;
            }
            //----------------------------
            // 取得 style.transform 設定值
            let transformSetting = reg_res[1].trim();

            // 轉換 rotate
            let rotate = $(this.dom).getTransformData()["css"]["rotate"];

            transformSetting = transformSetting.replace(/rotate\(.+?\)/, function (m) {
                return ("rotate(" + (rotate + "rad") + ")");
            });

            $.style(this.dom, "transform", transformSetting);
        };
        //----------------------------------------------------------------------
        // 加入計時器，防止 transitionEnd 未觸發
        this._addJob2Timer = function () {
            // debugger;

            Transition.Timer.add(this.dom, job.bind(this));
            /* ------------------------ */
            function job(currentTime) {
                // 每個 tick 要執行的
                var res = this._tickCheck(currentTime);
                return res;
            }
        };
        //----------------------------------------------------------------------
        // timer 每個 tick 要做的事
        this._tickCheck = function (currentTime) {
            // debugger;

            let startTime = this.startTime;
            let endTime = this.endTime;
            let duration = this.userSetting.duration;
            let step_callback = this.userSetting.step;

            // console.log(this.startTime);
            let diff = currentTime - startTime;

            let percent = diff / duration;
            percent = (percent > 1 ? 1 : percent);
            //----------------------------

            if (currentTime > endTime) {
                // 過時，停止計時器
                // 觸發 transitionEnd
                this.fn.triggerEvent(this.dom, 'transitionend');
                return false;
            }
            //----------------------------
            if (percent <= 1 && this.status < 3) {
                console.log('percent: ', percent);

                if (typeof (step_callback) === "function") {
                    step_callback.call(this.dom, percent);
                }
            }
            return true;
        };
        //----------------------------------------------------------------------
        // 設定 transition.property
        this._setAnimationProperty = function () {
            debugger;
            
            let userSetting = this.userSetting;
            let cssSetting = this.cssDataObj.cssSetting;

            // property
            let property;
            property = Object.keys(cssSetting);
            property = property.join(',');

            // duration
            duration = userSetting.duration + 'ms';

            let setting = {
                "transition-property": property,
                "transition-duration": duration
            }

            // easing
            if (userSetting.easing) {
                setting["transition-timing-function"] = userSetting.easing;
            }
            //----------------------------

            $(this.dom).css(setting);

        };
    }).call(Action.prototype);

})($ || jQuery || {});
