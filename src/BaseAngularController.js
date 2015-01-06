class BaseAngularController{
    constructor($scope,$translate){
        "use strict";
        this.config = this.config || {
            exports:[]
        };
        this.$scope = $scope;
        this.$translate = $translate;
        this.evts = [];
        this.attachEvents();
        this.defineScope();
    }
    attachEvents(){
        "use strict";
        this.$scope.$on('$destroy',this.destroy.bind(this));
        this.evts.push(this.$scope.$on('changeLanguage',  () => {
            this.$scope.language = this.$translate.use();
        }));
    }
    defineScope(){
        "use strict";
        this.$scope.language = this.$translate.use();
        for(let mtd of this.config.exports){
            this.$scope[mtd] = this[mtd].bind(this);
        }
    }
    destroy(){
        "use strict";
        this.evts.forEach(function(e){
            e();
        });
    }
}
BaseAngularController.$inject = ['$scope','$translate'];
export default BaseAngularController;