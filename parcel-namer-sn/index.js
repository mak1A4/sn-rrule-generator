const { Namer } = require("@parcel/plugin");

module.exports = (new Namer({
    name({ bundle, bundleGraph, logger, options }) {

        var entryAssets = bundle.getEntryAssets();
        var filePath;
        entryAssets.forEach(element => {
            //console.log(element.id + " == " + bundle.id);
            console.log(element.id);
            if (element.id == bundle.id) {
                filePath = element.filePath;
            }
        });
        console.log(filePath);
        /*var getAssetById = (id) => {
            return entryAssets.find((a) => a.id == id);
        };

        console.log(getAssetById(bundle.id).filePath);*/
        let name = "./sn-rrule-generator/" + bundle.id;
        if (!bundle.isEntry) {
            name += "." + bundle.hashReference;
        }
        return name + "." + bundle.type;
    }
}));