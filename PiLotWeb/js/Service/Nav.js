var PiLot = PiLot || {};
PiLot.Service = PiLot.Service || {};

PiLot.Service.Nav = (function () {

    var poiServiceInstance = null;

    /** Helper class to access all poi related services. Does some caching too. */
    var PoiService = function(){
        this.categories = null;
        this.initialize();
    };

    PoiService.prototype = {
        
        initialize: function(){},

        getCategoriesAsync: async function(){
            if(this.categories === null){
                this.categories = new Map();
                const json = await PiLot.Utils.Common.getFromServerAsync('/PoiCategories');
                if (Array.isArray(json)) {
                    for (let i = 0; i < json.length; i++) {
                        const poiCategory = new PoiCategory(json[i].id, json[i].name);
                        this.categories.set(poiCategory.getId(), poiCategory);
                    }
                    for (let i = 0; i < json.length; i++) {
                        if(json[i].parentId){
                            this.categories.get(json[i].id).setParent(this.categories.get(json[i].parentId));
                        }
                    }
                } else {
                    PiLot.log('Did not get an array from Poi endpoint.', 0);
                }
            }
            return this.categories;
        },

    };

    /** Singleton accessor returning the current instance of the PoiService object */
    PoiService.getInstance = function(){
        if(poiServiceInstance === null){
            poiServiceInstance = new PoiService();
        }
        return poiServiceInstance;
    };

    /// Returning the class and static method definitions
    return {}

})();