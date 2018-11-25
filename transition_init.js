!(function ($) {
    ////////////////////////////////////////////////////////////////////////////
    //
    // 可支援的 css property
    // http://oli.jp/2010/css-animatable-properties/
    // https://www.quackit.com/css/css3/animations/animatable_properties/
    // https://www.tutorialrepublic.com/css-reference/css-animatable-properties.php
    //
    // 參考
    // http://ricostacruz.com/jquery.transit/#top
    // http://nielse63.github.io/jquery.transition/
    // https://github.com/louisremi/jquery.transition.js/
    //
    ////////////////////////////////////////////////////////////////////////////
    !(function () {
        // check
        if (typeof window.Promise !== 'function') {
            throw new Error('need Promise function.....https://github.com/yahoo/ypromise');
        }

        if (typeof $._area88 === 'undefined') {
            $._area88 = {};
        }

        if (typeof $._area88.transition === 'undefined') {
            $._area88.transition = {
                version: "1",
                editor: 'area88',
                config: {},
                async: undefined,
                setInterval: undefined,
                CssData: "處理css",
                Action: "處理整個動畫流程串接",
                Timer: "計時器"
            };
        }
    })();
    ////////////////////////////////////////////////////////////////////////////
    // 使用者可設定 config
    $._area88.transition.config = {};

    !(function (_self) {
        // $._area88.transition.config

        // 計時器的時限要比設定的 duration 長多久
        _self.timerEndInterval = 100;
        
        // 每次動畫後閉鎖等待的時間
        _self.lockDuration = 100;

        // 預設動畫時間
        _self.defaultDuration = (function () {
            let jq = jQuery || $;
            let fx = jq.fx;
            
            if (fx && fx.speeds && typeof (fx.speeds._default) === 'number') {
                return fx.speeds._default;
            } else {
                return 400;
            }
        })();
        //----------------------------------------------------------------------
        // transform 用
        _self.multiTransformKey = [
            // translate
            function (key, value, pass) {
                pass = pass || false;

                if (!pass) {
                    if (/^translate$/i.test(key)) {
                        return true;
                    } else {
                        return false;
                    }
                }
                return ['translateX', 'translateY'];
            },
            // scale
            function (key, value, pass) {
                pass = pass || false;

                if (!pass) {
                    if (/^scale$/i.test(key)) {
                        return true;
                    } else {
                        return false;
                    }
                }
                return ['scaleX', 'scaleY'];
            }
        ];
        //----------------------------------------------------------------------
        // 當遇到 cssSetting.value 是 [] 要如何處理
        // 通常是面對1個 value 確有多個設定的狀況
        _self.cssSettingValueArray = [
            function (key, value, pass) {
                if (!pass) {
                    if (/transform/.test(key)) {
                        return true;
                    } else {
                        return false;
                    }
                }
                return value.join(" ");
            }
        ];
        //----------------------------------------------------------------------
        // 緩動
        _self.cssEase = {
            '_default': 'ease',
            ease: 'ease',
            linear: 'linear',
            'ease-in': 'ease-in',
            'ease-out': 'ease-out',
            'ease-in-out': 'ease-in-out',
            in: 'ease-in',
            out: 'ease-out',
            'in-out': 'ease-in-out',
            // Penner equations
            easeInCubic: 'cubic-bezier(.550,.055,.675,.190)',
            easeOutCubic: 'cubic-bezier(.215,.61,.355,1)',
            easeInOutCubic: 'cubic-bezier(.645,.045,.355,1)',
            easeInCirc: 'cubic-bezier(.6,.04,.98,.335)',
            easeOutCirc: 'cubic-bezier(.075,.82,.165,1)',
            easeInOutCirc: 'cubic-bezier(.785,.135,.15,.86)',
            easeInExpo: 'cubic-bezier(.95,.05,.795,.035)',
            easeOutExpo: 'cubic-bezier(.19,1,.22,1)',
            easeInOutExpo: 'cubic-bezier(1,0,0,1)',
            easeInQuad: 'cubic-bezier(.55,.085,.68,.53)',
            easeOutQuad: 'cubic-bezier(.25,.46,.45,.94)',
            easeInOutQuad: 'cubic-bezier(.455,.03,.515,.955)',
            easeInQuart: 'cubic-bezier(.895,.03,.685,.22)',
            easeOutQuart: 'cubic-bezier(.165,.84,.44,1)',
            easeInOutQuart: 'cubic-bezier(.77,0,.175,1)',
            easeInQuint: 'cubic-bezier(.755,.05,.855,.06)',
            easeOutQuint: 'cubic-bezier(.23,1,.32,1)',
            easeInOutQuint: 'cubic-bezier(.86,0,.07,1)',
            easeInSine: 'cubic-bezier(.47,0,.745,.715)',
            easeOutSine: 'cubic-bezier(.39,.575,.565,1)',
            easeInOutSine: 'cubic-bezier(.445,.05,.55,.95)',
            easeInBack: 'cubic-bezier(.6,-.28,.735,.045)',
            easeOutBack: 'cubic-bezier(.175, .885,.32,1.275)',
            easeInOutBack: 'cubic-bezier(.68,-.55,.265,1.55)'
        };
        //----------------------------
        // cssSetting 不能用到的(key/value)
        _self.notAllowCssSettingList = [
            // (transition, transition-)相關都不可以
            function (key, value, pass) {
                if (/transition/i.test(key)) {
                    console.log("can't process transition");
                    return true;
                }
                return false;
            },
            // 不可設定 skew[xy]
            function (key, value, pass) {
                if (/skew[xy]?/i.test(value)) {
                    console.log("no support transform(skew|skewX|skewY)");
                    return true;
                }
                return false;
            }
        ];
        //----------------------------
        // 不被支援的 styleProperty
        _self.notAllowStyleList = [
            // skew[xy]
            function (key, value, pass) {
                if (/skew[xy]?/i.test(value)) {
                    console.log("no support skew/skewX/skewY");
                    return true;
                }
                return false;
            }
        ];
        //----------------------------
        // 若 cssKey 若有多個屬性陣列該如何處理
        _self.mergeMultiProperty = [
            // transform
            function (key, value, pass) {
                pass = pass || false;
                if (!pass) {
                    if (/^transform/i.test(key)) {
                        return true;
                    } else {
                        return false;
                    }
                }                
                return value.join(' ');
            }
        ];
        //----------------------------

    })($._area88.transition.config);

})($ || jQuery || {});
