// define this method in $rootScope
// $rootScope.changeLanguage = function (langCode) {
//     if ($rootScope.language !== langCode) {
//         $rootScope.language = langCode;
//     }
//     $translate.use(langCode);
//     $rootScope.$broadcast('changeLanguage', langCode);
// };

class BaseAngularController {
  constructor(...args) {
    this.config = this.config || {
        exports: []
      };
    if (args.length) {
      this.applyToScope(args, BaseAngularController.$inject);
    }
    this.evts = [];

  }

  initCtrl() {
    this.attachEvents();
    this.defineScope();
  }

  applyToScope(args, $inject) {
    args.forEach((ag, i)=> {
      this[$inject[i]] = ag;
    });
  }

  attachEvents() {
    if (this.$scope) {
      this.$scope.$on('$destroy', this.destroy.bind(this));
    }
  }

  safeApply(fn, scope) {
    scope = scope || this.$scope;
    if ((scope.$$phase || scope.$root.$$phase)) {
      fn && fn();
    } else {
      scope.$apply(fn);
    }
  }

  defineScope() {
    for (let mtd of this.config.exports) {
      if (typeof(this[mtd]) === 'function') {
        this.$scope[mtd] = this[mtd].bind(this);
      } else {
        this.$scope[mtd] = this[mtd];
      }
    }
  }

  destroy() {
    this.evts.forEach(function (e) {
      if (typeof(e) === 'function') {
        e();
      }
    });
  }
}
BaseAngularController.$inject = ['$scope', '$translate'];
export default BaseAngularController;
