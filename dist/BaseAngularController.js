(function (factory) {
    if (typeof define === "function" && define.amd) {
        define(["exports", "module"], factory);
    } else if (typeof exports !== "undefined" && typeof module !== "undefined") {
        factory(exports, module);
    }
})(function (exports, module) {
    "use strict";

    var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

    // define this method in $rootScope
    // $rootScope.changeLanguage = function (langCode) {
    //     if ($rootScope.language !== langCode) {
    //         $rootScope.language = langCode;
    //     }
    //     $translate.use(langCode);
    //     $rootScope.$broadcast('changeLanguage', langCode);
    // };

    var BaseAngularController = (function () {
        function BaseAngularController() {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            "use strict";
            this.config = this.config || {
                exports: []
            };
            if (args.length) {
                this.applyToScope(args, BaseAngularController.$inject);
            }
            this.evts = [];
            this.attachEvents();
            this.$scope && this.defineScope();
        }

        _prototypeProperties(BaseAngularController, null, {
            applyToScope: {
                value: function applyToScope(args, $inject) {
                    var _this = this;
                    args.forEach(function (ag, i) {
                        _this[$inject[i]] = ag;
                    });
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            attachEvents: {
                value: function attachEvents() {
                    var _this = this;
                    "use strict";
                    if (this.$scope) {
                        this.$scope.$on("$destroy", this.destroy.bind(this));
                    }
                    if (this.$translate) {
                        this.evts.push(this.$scope.$on("changeLanguage", function () {
                            _this.$scope.$apply();
                        }));
                    }
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            safeApply: {
                value: function safeApply(scope, fn) {
                    scope = scope || this.$scope;
                    if (scope.$$phase || scope.$root.$$phase) {
                        fn && fn();
                    } else {
                        scope.$apply(fn);
                    }
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            defineScope: {
                value: function defineScope() {
                    "use strict";
                    for (var _iterator = this.config.exports[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
                        var mtd = _step.value;
                        this.$scope[mtd] = this[mtd].bind(this);
                    }
                },
                writable: true,
                enumerable: true,
                configurable: true
            },
            destroy: {
                value: function destroy() {
                    "use strict";
                    this.evts.forEach(function (e) {
                        e();
                    });
                },
                writable: true,
                enumerable: true,
                configurable: true
            }
        });

        return BaseAngularController;
    })();

    BaseAngularController.$inject = ["$scope", "$translate"];
    module.exports = BaseAngularController;
});