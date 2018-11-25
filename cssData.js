(function ($) {
    // debugger;


    $.fn.xyz = function (userSetting, duration) {
        return this.each(function (i, dom) {
            $.xyz(dom, userSetting, duration);
        });
    };

    $.xyz = function (dom, userSetting, duration) {
        userSetting.duration = duration;
        let o = new CssData(dom, userSetting);
        o.aboutStyleSetting();

        console.dir(o);
    }
    ////////////////////////////////////////////////////////////////////////////
    const Trans = $._area88.transition;
    const Config = $._area88.transition.config;
    const Tools = $._area88.transition.tools;

    //----------------------------

    Trans.CssData = CssData;
    //----------------------------
    // 紀錄每次動畫設定的所有相關
    // 包括最重要的 cssSetting
    function CssData(dom, setting) {

        this.fn = CssData;

        this.dom = dom;

        this.userSetting;
        //----------------------------
        // 動畫之前(style)已經存在的設定
        this.prevStyleSetting = {};

        // 對 transitionCss 的設定
        // 最主要的東西
        this.cssSetting = {};
        //----------------------------

        // tranform 是特殊的設定
        // 若使用者做了設定需獨立出來
        // this._transformSettingMap = {};
        //----------------------------
        this.prev_transSetting = {
            property: '',
            easing: '',
            delay: '',
            duration: ''
        };
        //----------------------------
        // 紀錄 matrixData
        // 暫時不用
        this.init_matrixData;

        // 是否有設定 transform.rotate
        // 每次動畫完需要校正 transform.rotate
        this.fix_rotate = false;

        //----------------------------
        this.__construct(setting);
    }
    //==========================================================================
    (function (_self) {
        // 工具集


        // 分離(+-=,數字,單位)
        // 很重要
        _self.reg_settingIsNumberProperty = (function () {
            return /^(?:([+-])=)?([-]{0,1}(?:\d+\.|)\d+)(\D*)$/ig;
        });

        // 分離(數字,單位)
        // 很重要
        _self.reg_isNumberProperty = (function () {
            return /^([-]{0,1}(?:\d+\.|)\d+)(\D*)$/ig;
        });

        // 要 css 轉用的
        _self.hook_1 = [];

        // += 換算用的
        _self.hook_2 = [];
        //======================================================================
        _self.style2Obj = function (dom) {
            let styleText;
            let res = {};

            if (typeof dom === 'string') {
                styleText = dom;
            } else {
                styleText = $(dom).attr("style");
                if (!styleText) {
                    return res;
                }
            }
            //----------------------------
            styleList = styleText.split(";");

            styleList.forEach(function (str) {

                if (!/[:]/.test(str)) {
                    return;
                }
                // style => (key):(value)
                let _res = /^([^:]+)[:]([^:]+)/.exec(str);

                if (!_res || typeof (_res[1]) === "undefined" || typeof (_res[2]) === "undefined") {
                    return;
                }

                res[_res[1].trim()] = _res[2].trim();
            }, this);

            return res;
        };
        //======================================================================
        // 取得 dom.cssKey 的值與單位
        // 很重要的部分
        _self.getDomCssKeyValueUnit = function (dom, key) {

            let res = {
                value: null,
                unit: null
            };
            let cssValue = $(dom).css(key);
            let cssData = CssData.reg_isNumberProperty().exec(cssValue);

            if (!cssData) {
                res.value = cssValue;
            } else {

                if (typeof (cssData[1]) !== 'undefined') {
                    res.value = Number(cssData[1]);
                }
                if (cssData[2]) {

                    if (/\d/.test(cssData[2])) {
                        throw new Error("get css(" + key + ") have trouble (" + cssValue + ")");
                    }
                    res.unit = cssData[2];
                }
            }
            return res;
        };
        //======================================================================
        // 從使用者的 cssSetting 分離 value.unit
        _self.getCssSettingKeyValueUnit = function (settingValue) {

            let res = {
                operator: "+",
                value: null,
                unit: null
            };

            let cssData = CssData.reg_settingIsNumberProperty().exec(settingValue);

            if (!cssData) {
                res.value = settingValue;
            } else {

                if (typeof (cssData[1]) !== 'undefined') {
                    res.operator = cssData[1];
                }

                if (typeof (cssData[2]) !== 'undefined') {
                    res.value = Number(cssData[2]);
                }
                if (typeof (cssData[3]) !== 'undefined') {
                    res.unit = cssData[3];
                }
            }

            return res;
        };
        //======================================================================
        // 取出 style.transform
        // 盡量不是 matrix 格式
        _self.getStyleTransform = function (dom) {

            let res = $.style(dom, "transform");

            if (res == null || res === "") {
                res = $.css(dom, "transform");
            }
            return res;
        };
        //======================================================================
        // 旋轉的轉換，去掉旋轉超過整圈的因素
        _self.rotateConversion = {
            deg: function (v) {
                return v % 360;
            },
            turn: function (v) {
                return v % 1;
            },
            grad: function (v) {
                return v % 400;
            },
            rad: function (v) {
                return (v % (2 * Math.PI));
            }
        };
    })(CssData);

    //==========================================================================
    (function () {
        this.__construct = function (setting) {
            debugger;
            // 把 style 化為 {}
            this.prevStyleSetting = this.fn.style2Obj(this.dom);

            this.userSetting = ($.isPlainObject(setting) ? setting : {});
            //----------------------------
            // cssSetting
            if ($.isPlainObject(this.userSetting.css)) {
                // 複製 cssSetting
                this.cssSetting = $.extend({}, this.userSetting.css);

                if (!(Object.keys(this.cssSetting)).length) {
                    throw new TypeError('no set cssSetting');
                }
            }else if(typeof this.userSetting.css == "function"){
                this.cssSetting = this.userSetting.css;
            }

            //----------------------------
            // 取得 style 關於 transition 的動畫設定
            // 並暫時取消動畫
            this._getPrevTransProp();

            // 檢查使用者的 css 設定
            this._ckeckUserSetting();
        };

        //======================================================================
        // 會實際動到 style 設定
        // 避免影響動畫，必須分開
        this.aboutStyleSetting = function () {
            debugger;

            this._fixTransform();

            // 檢查 style 是否有違規的設定
            this._style_filter_1();

            // 若使用者設定的 css，style沒設定
            // 動畫容易出問題
            this._style_filter_2();

            // 若有些值一開始沒有設定對，會無法動畫
            this._checkStyleInitValue();
            //----------------------------
            debugger;

            // 處理 +-=
            // 會遇到單位轉換
            this._checkOperation();

            debugger;

            // 處理複雜 css.property
            this._mergeMultiProperty();
        };
        //======================================================================
        // 檢查使用者對 css 的設定
        this._ckeckUserSetting = function () {

            if(typeof this.cssSetting == "function"){
                return;
            }

            // 剔除不能在css裡置動畫屬性
            this._userSetting_filter_1();

            // 把css名稱規格統一
            this._userSetting_filter_2();

            // 單獨處理 transform.setting
            // 他的設定與其他 cssProperty 不同
            // 將 transform.setting 原子化
            this._checkTransformSetting();
        };

        //======================================================================

        // 取得 style 關於 transition 的動畫設定
        // 並暫時取消動畫
        this._getPrevTransProp = function () {
            // debugger;

            this.prev_transSetting['property'] = $.style(this.dom, 'transition-property');
            this.prev_transSetting['duration'] = $.style(this.dom, 'transition-duration');
            this.prev_transSetting['easing'] = $.style(this.dom, 'transition-timing-function');
            this.prev_transSetting['delay'] = $.style(this.dom, 'transition-delay');
            //----------------------------
            // 暫停所有動畫設定
            $(this.dom).css({
                'transition-property': 'none',
                'transition-duration': (this.userSetting.duration + "ms"),
                'transition-delay': '',
                'transition-timing-function': ''
            });
        };
        //======================================================================
        // 檢查 style 是否有違規的設定
        this._style_filter_1 = function () {
            let notAllowStyleList = Config.notAllowStyleList;
            let style = this.dom.style;

            for (let k in this.prevStyleSetting) {
                let value = this.prevStyleSetting[k];
                notAllowStyleList.some(function (fn) {
                    // here
                    if (fn(k, value) === true) {
                        style.removeProperty(k);
                        delete this.prevStyleSetting[k];
                        return true;
                    }
                });
            }
        };
        //======================================================================
        // 若使用者設定的 css，style沒設定容易出問題
        this._style_filter_2 = function () {

            if(typeof this.cssSetting == "function"){
                return;
            }

            // debugger;
            for (let k in this.cssSetting) {
                let res = $.style(this.dom, k);

                if (res == null || res.length === 0) {
                    // style 沒設定
                    res = $(this.dom).css(k);

                    // 設定 style
                    $.style(this.dom, k, res);
                }
            }
        };
        //======================================================================
        // 剔除不能在css裡置動畫屬性
        // 或不支持的屬性
        this._userSetting_filter_1 = function () {

            let notAllowCssSettingList = Config.notAllowCssSettingList;
            //----------------------------
            for (let k in this.cssSetting) {
                let value = this.cssSetting[k];
                notAllowCssSettingList.some(function (fn) {
                    // here
                    if (fn(k, value) === true) {
                        delete this.cssSetting[k];
                        return true;
                    }
                });
            }
        };
        //======================================================================
        // 把名稱統一轉成 x-x
        this._userSetting_filter_2 = function (settingMap) {
            // debugger;
            for (let k in this.cssSetting) {

                let key = k.replace(/([a-z])([A-Z])/, function (m, g1, g2) {
                    return (g1 + "-" + g2.toLowerCase());
                });
                if (k == key) {
                    continue;
                }
                this.cssSetting[key] = this.cssSetting[k];
                delete this.cssSetting[k];
            }
        };
        //======================================================================
        // 處理 transform.setting
        // 將 transform.setting 原子化
        this._checkTransformSetting = function () {
            // debugger;

            if (!("transform" in this.cssSetting)) {
                return;
            }
            //----------------------------

            let value = this.cssSetting["transform"];
            let transformSettingMap = {};
            let tranformList = value.split(')');

            for (let i = 0; i < tranformList.length; i++) {

                let v = tranformList[i];
                v = v.trim();

                if (!v.length) {
                    continue;
                }
                //----------------------------
                v += ')';

                let res = /([^()]+)\(([^()]+)\)/i.exec(v);

                let error = new TypeError("transform setting error(" + v + ")");
                if (!res) {
                    throw error;
                }

                if (res[1] == null || res[2] == null) {
                    throw error;
                }

                let _key = res[1].trim();
                let value = res[2];
                //----------------------------
                // 找尋 hook
                let judgeList = [];
                for (let i = 0; i < Config.multiTransformKey.length; i++) {
                    let judge = Config.multiTransformKey[i];
                    if (judge(_key, value)) {
                        judgeList.push(judge);
                    }
                }
                //------------------
                if (!judgeList.length) {
                    // 沒有 hook 的話
                    transformSettingMap[_key] = value;
                } else if (judgeList.length > 1) {
                    throw new TypeError("key(" + _key + ") has multy hook");
                } else {
                    // 如果是 translate|scale，必須繼續原子化
                    let judge = judgeList[0];
                    let keyList = judge(_key, value, true);

                    let valueList = value.split(",");

                    keyList.forEach(function (k, i) {
                        // scale(1) => scaleX(1),scaleY(1)
                        let v = (valueList[i] == null) ? valueList[0] : valueList[i];
                        transformSettingMap[k] = v.trim();
                    });
                }
            }
            //----------------------------
            // debugger;
            let res = [];
            for (let k in transformSettingMap) {
                res.push((k + "(" + transformSettingMap[k] + ")"));
            }
            this.cssSetting["transform"] = res;

        };
        //======================================================================
        // 若有些值一開始沒有設定
        // 會無法動畫
        this._checkStyleInitValue = function () {

            if(typeof this.cssSetting == "function"){
                return;
            }

            // debugger;
            let fix_setting = {};


            let cssKeyList = Object.keys(this.cssSetting);

            //----------------------------
            for (let k in this.cssSetting) {

                let settingValue = this.cssSetting[k];
                let cssValue = $(this.dom).css(k);
                //----------------------------
                let init_isNumber_reg = this.fn.reg_isNumberProperty();
                let setting_isNumber_reg = this.fn.reg_settingIsNumberProperty();

                let init_isNumber = init_isNumber_reg.test(cssValue);
                let setting_isNumber = setting_isNumber_reg.test(settingValue);
                //----------------------------

                // 若初始值是(Empty strings, null, undefined and "auto")非數值單位
                // 都化為 0
                if (!init_isNumber && setting_isNumber) {

                    // 若 css 本來不是 Number但使用者設定成 number
                    if (!cssValue || /auto/i.test(cssValue)) {
                        cssValue = parseFloat(cssValue, 10);
                        if (isNaN(cssValue)) {
                            cssValue = 0;
                        }
                        fix_setting[k] = cssValue;
                    }
                }
            }

            //----------------------------
            // 設定 style
            if (Object.keys(fix_setting).length > 0) {
                $(this.dom).css(fix_setting);
            }
            //----------------------------
            // 再次檢查，有些瀏覽器會出問題
            for (let k in fix_setting) {
                let v = $(this.dom).css(k);

                if (!this.fn.reg_isNumberProperty().test(v)) {
                    throw new Error("browser error at style(" + k + ")");
                }
            }

        };
        //======================================================================
        // 處理 +-=
        // 會遇到單位轉換
        this._checkOperation = function () {
            // debugger;

            if(typeof this.cssSetting == "function"){
                return;
            }

            for (let k in this.cssSetting) {

                let value = this.cssSetting[k];
                if (!Array.isArray(this.cssSetting[k])) {
                    this.cssSetting[k] = this._$checkOperation(k, value);
                } else {
                    for (let i = 0; i < value.length; i++) {
                        let subValue = value[i];
                        value[i] = this._$checkOperation(k, subValue);
                        // console.log(value[i]);
                    }
                }
            }

            console.dir(this.cssSetting);
        };

        //======================================================================
        // 找尋 hook_2
        this._$checkOperation = function (key, value) {
            if (!/[+-]?=/.test(value)) {
                return value;
            } else {
                // debugger;
                let callbackList = [];

                // 從 hook_2 找可以用的 hook
                this.fn.hook_2.forEach(function (fn) {
                    let res = fn(this, this.dom, key, value);

                    if (res === true) {
                        callbackList.push(fn);
                    }
                }, this);
                //----------------------------
                debugger;
                let callback;
                if (callbackList.length > 1) {
                    // 若同一個 key 出現複數 hook 來處理
                    throw new TypeError("(" + key + ":" + JSON.stringify(value) + ") have double in hook_2");
                } else if (callbackList.length === 1) {
                    callback = callbackList[0];
                } else {
                    callback = this.fn.hook_2[0];
                }
                value = callback(this, this.dom, key, value, true);
            }
            return value;
        };
        //======================================================================
        // 修正 style
        // 設成標準格式(translateX, translateY, rotate, scaleX, scaleY)
        this._fixTransform = function () {
            debugger;

            if (!("transform" in this.cssSetting)) {
                // 若使用者沒有設定 tranform
                return;
            }
            let trasformSetting = this.cssSetting["transform"];

            if (/matrix\s*\(/i.test(trasformSetting)) {
                // 使用者不能設定 matrix
                throw new TypeError("can't assign transform: matrix()");
            }

            // 只有使用者設定(=|+-=)才需進一步處理
            if (!(/(\(=\)|\([+-]=.+?\))/.test(trasformSetting))) {
                return;
            }
            //----------------------------
            // style 是否有 transform 選項
            let cssText = this.dom.style.cssText;
            let setting;
            if (!/transform:/.test(cssText)) {
                // 若 style 沒有設置 transform
                // 不管 css.transform 的設置
                setting = "translate(0px, 0px) scale(1) rotate(0rad)";
            } else if (/transform\s*:\s*matrix\s*\(/.test(cssText)) {
                // 若 style.transform 是設定成 matrix
                // 校正
                let transformData = $(this.dom).getTransformData(true);

                let settingList = [];
                let command;

                let tx = transformData["css"]["translateX"] + "px";
                command = "translateX(" + tx + ")";
                settingList.push(command);

                let ty = transformData["css"]["translateY"] + "px";
                command = "translateY(" + ty + ")";
                settingList.push(command);

                let r = transformData["css"]["rotate"] + "rad";
                command = "rotate(" + r + ")";
                settingList.push(command);

                let sx = transformData["css"]["scaleX"];
                command = "scaleX(" + sx + ")";
                settingList.push(command);

                let sy = transformData["css"]["scaleY"];
                command = "scaleY(" + sy + ")";
                settingList.push(command);

                setting = settingList.join(" ");
            }
            //----------------------------
            if (setting != null) {
                $.style(this.dom, "transform", setting);
            }

        };

        //======================================================================
        // 處理比較怪異的 css
        this._mergeMultiProperty = function () {
            // debugger;

            if(typeof this.cssSetting == "function"){
                return;
            }
            //-----------------------
            for (let k in this.cssSetting) {
                let value = this.cssSetting[k];

                let callbackList = [];

                Config.mergeMultiProperty.forEach(function (fn) {
                    let res = fn(k, value);
                    if (res) {
                        callbackList.push(fn);
                    }
                }, this);
                //----------------------------
                if (callbackList.length === 0) {
                    continue;
                } else if (callbackList.length > 1) {
                    throw new TypeError("(" + k + ") have multy hook");
                } else {
                    let callback = callbackList[0];
                    this.cssSetting[k] = callback(k, value, true);
                }
            }
        };
    }).call(CssData.prototype);

    //==========================================================================

})($ || jQuery || {});
////////////////////////////////////////////////////////////////////////////////
!(function ($) {
    // hook
    const Trans = $._area88.transition;
    const Config = $._area88.transition.config;
    const Tools = $._area88.transition.tools;

    const CssData = Trans.CssData;
    //==========================================================================

    // hook_2 的設定
    !(function (_self) {
        // 若沒 pass 則只是判斷可 callback 是否可用
        // 給 pass 就要取得計算結果
        _self.push(function (cssData, dom, key, targetValue, pass) {

            // 一般預設
            pass = pass || false;

            if (!pass) {
                return false;
            }
            //----------------------------
            debugger;

            let currentValue = $(dom).css(key);

            let initData = CssData.getDomCssKeyValueUnit(dom, key);
            let targetData = CssData.getCssSettingKeyValueUnit(targetValue);

            let operator = (targetData.operator === '+') ? 1 : -1;

            let init_sysUnit = initData.unit;
            let targetUnit = targetData.unit;

            let initialValue = initData.value;
            let _targetValue = targetData.value;

            let reg_isNumberProperty = CssData.reg_isNumberProperty();
            if (!reg_isNumberProperty.test(initialValue)) {
                // css值，必須是 number 才能執行(+-=)
                console.dir(initialValue);
                throw new TypeError("key(" + key + ") value is not number");
            }
            //----------------------------
            let res;
            if (!jQuery.cssNumber[key] && targetUnit && targetUnit !== init_sysUnit) {

                // 單位換算
                // 初始單位轉為目標單位值

                let settingValue = Math.abs(_targetValue);
                //----------------------------

                // $(dom).css("visibility", "hidden");


                $(dom).css(key, (settingValue + targetUnit));
                //----------------------------
                let c_cssData = CssData.getDomCssKeyValueUnit(dom, key);
                target_sysValue = c_cssData.value;

                // 回正
                $(dom).css(key, currentValue);
                $(dom).css("visibility", "");
                //----------------------------
                let initValue_trans;

                if (target_sysValue == initialValue) {
                    initValue_trans = _targetValue;
                } else {
                    // 把一開始的座標質轉變為目標單位的數值
                    initValue_trans = (_targetValue * initialValue) / target_sysValue;
                }

                res = (initValue_trans + (operator * _targetValue)) + targetUnit;
            } else {
                // 不須單位轉換
                res = initialValue + (operator * _targetValue);

                if (jQuery.cssNumber[key] && targetUnit) {
                    res += targetUnit;
                }
            }
            //----------------------------
            return res;
        });
        //----------------------------------------------------------------------
        _self.push(function (cssData, dom, _key, targetValue, pass) {
            //
            // 處理 transform(translateX(=)|translateY(+-=)])
            // translate 有兩種不同格式單位，一個是一般單位，一個是(%)
            //
            pass = pass || false;
            if (!pass) {
                if ((function () {
                    let judge_1 = /^translate[XY]\([+-]\=/.test(targetValue);
                    let judge_2 = /^translate[XY]\(\=\)/.test(targetValue);

                    let judge_3 = /^transform$/.test(_key);

                    return (judge_3 && (judge_1 || judge_2))
                })()) {
                    return true;
                } else {
                    return false;
                }
            }
            //----------------------------
            debugger;
            // 取得設定前的 transform 原始值
            let backup = cssData.fn.getStyleTransform(dom);
            //----------------------------
            // 使用者設定相關
            let reg_res = /([^()]+)\(([^()]+)\)/i.exec(targetValue);
            let t_key = reg_res[1];
            targetValue = reg_res[2];
            //----------------------------
            // 取得正確的初始值
            // 去掉 rotate, scale 的影響
            // 取得純粹 (translateX|translateY) 的正確值
            // 單位換算才會正確
            let matrixData = $(dom).getTransformData(true);
            let init_value;

            if (matrixData["style"] == null || matrixData["style"][t_key] == null) {
                // 這步很重要
                init_value = 0;
            } else {
                init_value = matrixData["style"][t_key];
                let setting = t_key + "(" + init_value + ")";

                $.style(dom, "transform", setting);

                matrixData = $(dom).getTransformData(true);
                init_value = matrixData['css'][t_key];
            }
            //----------------------------

            let res;
            let init_sysUnit = "px";

            if (/^\=$/.test(targetValue)) {
                // =
                // 這個 transform.key 將保持原狀
                res = t_key + "(" + init_value + init_sysUnit + ")";
            } else {
                // +-=
                let targetData = CssData.getCssSettingKeyValueUnit(targetValue);
                let targetUnit = targetData.unit.toLowerCase();
                let _targetValue = targetData.value;
                // 使用者操作符
                let operator = (targetData.operator === '+') ? 1 : -1;

                if (targetUnit == init_sysUnit) {
                    // 若設定單位與原始相同
                    res = init_value + (operator * _targetValue);
                    res = t_key + "(" + res + init_sysUnit + ")";

                } else {
                    debugger;

                    let settingValue = Math.abs(_targetValue);
                    let cssSetting = t_key + "(" + settingValue + targetUnit + ")";
                    //----------------------------

                    // 移動
                    // $(dom).css("visibility", "hidden");

                    $(dom).css('transform', cssSetting);
                    //----------------------------
                    let target_matrix = $(dom).getTransformData(true)["css"];
                    let target_sysValue = target_matrix[t_key];
                    //----------------------------
                    let init_trans;
                    if (target_sysValue == init_value) {
                        init_trans = _targetValue;
                    } else {
                        // 將初始轉為另一個單位值
                        init_trans = (init_value * _targetValue) / target_sysValue;
                    }

                    res = t_key + "(" + (init_trans + (operator * _targetValue)) + targetUnit + ")";
                }
            }
            //----------------------------
            // 回正
            $(dom).css('transform', backup);
            $(dom).css("visibility", "");

            return res;
        });
        //----------------------------------------------------------------------
        _self.push(function (cssData, dom, _key, targetValue, pass) {
            //
            //
            //
            if (!pass) {
                if (/^scale[XY]$/.test(targetValue)) {
                    return true;
                } else {
                    return false;
                }
            }
            //----------------------------
            let res = /([^()]+)\(([^()]+)\)/i.exec(v);
            let key = res[1];
            let value = res[2];

            if (/^\=$/) {
                // 這個 transform.key 將保持原狀
            } else {

            }
        });
        //----------------------------------------------------------------------
        _self.push(function (cssData, dom, _key, targetValue, pass) {
            //
            // 處理 transform(rotate(=)|rotate(+-=))
            //
            pass = pass || false;
            if (!pass) {
                if ((function () {

                    let judge_1 = /^transform$/.test(_key);
                    let judge_2 = /^rotate\([+-]\=/.test(targetValue);
                    let judge_3 = /^rotate\(\=\)$/.test(targetValue);
                    return (judge_1 && (judge_2 || judge_3));
                }())) {
                    return true;
                } else {
                    return false;
                }
            }
            //----------------------------
            debugger;
            let res;
            //----------------------------
            // 使用者設定相關
            let reg_res = /([^()]+)\(([^()]+)\)/i.exec(targetValue);
            let t_key = reg_res[1];
            let t_value = reg_res[2];
            //----------------------------
            // 取得原始狀況
            let backup = Trans.CssData.getStyleTransform(dom);

            let matrixData = $(dom).getTransformData(true);
            let init_value;
            debugger;
            // 取得正確的初始值
            if (matrixData["style"] == null || matrixData["style"][t_key] == null) {
                init_value = 0;
            } else {
                init_value = matrixData["style"][t_key];
                let setting = "rotate(" + init_value + ")";
                $.style(dom, "transform", setting);

                matrixData = $(dom).getTransformData(true);
                init_value = matrixData["css"][t_key];
            }

            let init_sysUnit = "rad";
            //----------------------------
            if (/^\=$/.test(t_value)) {
                // 這個 transform.key 將保持原狀

                res = t_key + "(" + init_value + init_sysUnit + ")";
            } else {
                let targetData = CssData.getCssSettingKeyValueUnit(t_value);
                let targetUnit = targetData.unit.toLowerCase();
                let _targetValue = targetData.value;
                // 使用者操作符
                let operator = (targetData.operator === '+') ? 1 : -1;

                if (targetUnit == init_sysUnit) {
                    // 單位相同
                    res = matrixData[t_key] + (operator * _targetValue);
                    res = t_key + "(" + res + init_sysUnit + ")";
                } else {

                    let settingValue = Math.abs(_targetValue);

                    // 要注意 settingValue 是否是超過一圈的值
                    // 若是，需要校正成一圈的值
                    // 不然會換算錯誤

                    let ConversionFn = CssData.rotateConversion[targetUnit];
                    if (ConversionFn == null) {
                        throw new TypeError("transform.rotate unit typeerror");
                    }

                    settingValue = ConversionFn(settingValue);
                    let cssSetting = t_key + "(" + settingValue + targetUnit + ")";
                    //----------------------------

                    // $(dom).css("visibility", "hidden");
                    $(dom).css('transform', cssSetting);
                    //----------------------------
                    let target_matrix = $(dom).getTransformData(true)["css"];
                    let target_sysValue = target_matrix[t_key];
                    //----------------------------
                    let init_trans;
                    if (target_sysValue == init_value) {
                        init_trans = settingValue;
                    } else {
                        // 將初始轉為另一個單位值
                        init_trans = (init_value * settingValue) / target_sysValue;
                    }

                    res = t_key + "(" + (init_trans + (operator * _targetValue)) + targetUnit + ")";
                }
            }
            //----------------------------
            // 回正
            $(dom).css('transform', backup);
            $(dom).css("visibility", "");

            return res;
        });
        //----------------------------------------------------------------------

    })(CssData.hook_2);
})($ || jQuery || {});
