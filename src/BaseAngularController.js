class BaseAngularController {
    constructor($scope, $translate) {
        "use strict";
        this.config = this.config || {
            exports: []
        };
        this.$scope = $scope;
        this.$translate = $translate;
        this.evts = [];
        this.attachEvents();
        this.defineScope();
    }

    attachEvents() {
        "use strict";
        this.$scope.$on('$destroy', this.destroy.bind(this));
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