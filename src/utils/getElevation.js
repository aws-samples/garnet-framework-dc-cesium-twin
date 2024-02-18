import { Cartesian3, Cartographic, sampleTerrainMostDetailed,CesiumTerrainProvider } from "cesium";

const terrainProv = await CesiumTerrainProvider.fromIonAssetId(1)

export const getItemTerrainHeight = async (item) => {
  try {
    const pointOfInterest = [
      Cartographic.fromCartesian(
        Cartesian3.fromDegrees(
          Number(item.location.value.coordinates[0]),
          Number(item.location.value.coordinates[1])
        )
      ),
    ];
    let sample = await sampleTerrainMostDetailed(terrainProv, pointOfInterest);
    var obj = {};
    if (sample[0].height === undefined) {
      //If not height found fallback to 10
      obj = { [item.id]: 100 };
    } else {
      obj = { [item.id]: Math.floor(sample[0].height) };
    }
    return obj;
  } catch (error) {
    console.log(error);
    //If not height found fallback to 10
    obj = { [item.id]: 100 };
    return obj;
  }
};
