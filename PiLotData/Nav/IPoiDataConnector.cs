using System;
using System.Collections.Generic;

using PiLot.Model.Nav;

namespace PiLot.Data.Nav {

    public interface IPoiDataConnector {

        List<Object[]> FindPois(Double pMinLat, Double pMinLon, Double pMaxLat, Double pMaxLon, Int32[] pCategories, Int32[] pFeatures);

        List<Poi> ReadPois();

        Object[] ReadPoi(Int64 pPoiId);

        Object[] ReadExternalPoi(String pSource, String pSourceId);

        Int64 SavePoi(Poi pPoi);

        void DeletePoi(Int64 pPoiID);

        List<PoiCategory> ReadPoiCategories();

        Int32 SavePoiCategory(PoiCategory pPoiCategory);

        Boolean DeletePoiCategory(Int32 pCategoryID);

        List<PoiFeature> ReadPoiFeatures();

        Int32 SavePoiFeature(PoiFeature pPoiFeature);

        Boolean DeletePoiFeature(Int32 pFeatureID);


    }
}
