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
        "use strict";
        this.config = this.config || {
            exports: []
        };
        if(args.length){
            this.applyToScope(args,BaseAngularController.$inject);
        }
        this.evts = [];
        this.attachEvents();
        this.$scope && this.defineScope();
    }
    applyToScope(args,$inject){
        args.forEach((ag, i)=> {
            this[$inject[i]] = ag;
        });
    }
    attachEvents() {
        "use strict";
        if(this.$scope){
            this.$scope.$on('$destroy', this.destroy.bind(this));
        }
        if(this.$translate){
            this.evts.push(this.$scope.$on('changeLanguage', () => {
                this.$scope.$apply();
            }));    
        }
        
    }
    safeApply(scope, fn) {
        scope = scope || this.$scope;
        if((scope.$$phase || scope.$root.$$phase)){
            fn && fn();
        }else{
            scope.$apply(fn);
        }
    }
    defineScope() {
        "use strict";
        for (let mtd of this.config.exports) {
            this.$scope[mtd] = this[mtd].bind(this);
        }
    }

    destroy() {
        "use strict";
        this.evts.forEach(function (e) {
            e();
        });
    }
}
BaseAngularController.$inject = ['$scope', '$translate'];
export default BaseAngularController;