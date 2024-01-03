import { Viewer, Cesium3DTileset, Entity, CameraFlyTo, Globe } from "resium";
import {
  IonResource,
  Cartesian3,
  Color,
  HeightReference,
  Cartographic,
  CesiumTerrainProvider,
  sampleTerrainMostDetailed,
} from "cesium";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

const myHeaders = new Headers();
myHeaders.append(
  "Link",
  '<https://raw.githubusercontent.com/smart-data-models/data-models/master/context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"'
);
myHeaders.append("Content-Type", "application/json");
const requestOptions = {
  method: "GET",
  headers: myHeaders,
  redirect: "follow",
};

function App() {
  const ref = useRef(null);
  const [terrainProv, setTerrainProv] = useState();
  const [bikeTerrainHeight, setBikeTerrainHeight] = useState([]);
  const [parkingTerrainHeight, setParkingTerrainHeight] = useState([]);
  const [stations, setStations] = useState([]);
  const [parkings, setParkings] = useState([]);
  const [bikes, setBikes] = useState(true);
  const [parkingSlots, setParkingSlots] = useState(false);

  const toggleBikes = () => setBikes((value) => !value);
  const toggleParkingSlots = () => setParkingSlots((value) => !value);

  useEffect(() => {
    if (!terrainProv || !bikes) {
      return;
    }
    fetch(
      `${
        import.meta.env.VITE_GARNET_BASE_URL
      }?type=BikeHireDockingStation&limit=1000&idPattern=urn:ngsi-ld:BikeHireDockingStation:SmartBikeStation-.*`,
      requestOptions
    )
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        const filteredData = data.filter(mydata => Object.prototype.hasOwnProperty.call(mydata, "location")) 
        setStations(filteredData);
        filteredData.map((station) => {
          getBikeTerrainHeight(station);
        });
      });
  }, [terrainProv, bikes]);

  useEffect(() => {
    if (!terrainProv || !parkingSlots) {
      return;
    }
    fetch(
      `${
        import.meta.env.VITE_GARNET_BASE_URL
      }?type=OffStreetParking&limit=1000`,
      requestOptions
    )
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        setParkings(data);
        data.map((station) => {
          getParkingTerrainHeight(station);
        });
      });
  }, [terrainProv, parkingSlots]);

  useEffect(() => {
    CesiumTerrainProvider.fromIonAssetId(1).then((terrain) => {
      setTerrainProv(terrain);
    });
  }, []);

  const getBikeTerrainHeight = async (station) => {
    try {
      const pointOfInterest = [
        Cartographic.fromCartesian(
          Cartesian3.fromDegrees(
            station.location?.value.coordinates[0],
            station.location?.value.coordinates[1]
          )
        ),
      ];
      const samples = await sampleTerrainMostDetailed(
        terrainProv,
        pointOfInterest
      );
      setBikeTerrainHeight((existingData) => [
        ...existingData,
        Math.floor(samples[0].height),
      ]);
    } catch (error) {
      console.log(error);
      setBikeTerrainHeight((existingData) => [...existingData, 0]);
    }
  };

  const getParkingTerrainHeight = async (parking) => {
    try {
      const pointOfInterest = [
        Cartographic.fromCartesian(
          Cartesian3.fromDegrees(
            parking.location.value.coordinates[0],
            parking.location.value.coordinates[1]
          )
        ),
      ];
      const samples = await sampleTerrainMostDetailed(
        terrainProv,
        pointOfInterest
      );
      setParkingTerrainHeight((existingData) => [
        ...existingData,
        Math.floor(samples[0].height),
      ]);
    } catch (error) {
      console.log(error);
      setParkingTerrainHeight((existingData) => [...existingData, 0]);
    }
  };

  return (
    <div className="min-h-full flex flex-col">
      <div className="border-slate-500 border-solid border p-5 mt-5 flex flex-col bg-slate-300">
        <div className="flex flex-col justify-center items-center">
        <h1 className="justify-center items-center m-auto text-5xl pt-5">
          Garnet & Smart Cities
        </h1>
        <a href="https://garnet-framework.dev/" target="_blank" rel="noreferrer" className="text-blue-700">
          More infos about Garnet? Click me!
        </a>
       </div>
        <div className="flex justify-between">
          <Button variant="destructive" onClick={toggleBikes}>
            {bikes ? "Hide Bikes Stations" : "Show Bikes Stations"}
          </Button>
          <Button onClick={toggleParkingSlots}>
            {" "}
            {parkingSlots ? "Hide Parking Slots" : "Show Parking Slots"}{" "}
          </Button>
        </div>
      </div>

      <Viewer
        timeline={false}
        ref={ref}
        requestRenderMode={true}
        baseLayerPicker={false}
        baseLayer={false}
        sceneModePicker={false}
        geocoder={false}
        animation={false}
        className="pb-48 pt-10"
        style={{ height: "100vh" }}
        useBrowserRecommendedResolution={true}
      >
        <Globe
          show={false}
          enableLighting={true}
          depthTestAgainstTerrain={true}
        >
          <Cesium3DTileset
            url={IonResource.fromAssetId(2275207)}
            onReady={(tileset) => {
              ref.current?.cesiumElement?.zoomTo(tileset);
            }}
          >
            {stations.length > 0 && (
              <CameraFlyTo
                once={true}
                duration={5}
                destination={Cartesian3.fromDegrees(
                  stations[0].location?.value.coordinates[0],
                  stations[0].location?.value.coordinates[1],
                  3000
                )}
              />
            )}

            {bikes &&
              stations?.map((station, i) => {
                return (
                  station.location && (
                    <Entity
                      selected={false}
                      description={
                        "<h2>Available Bikes: " +
                        station.availableBikeNumber.value +
                        "</h2><br/>Available Free Slots: " +
                        station.freeSlotNumber.value +
                        "<br/>Last Update: " +
                        station.observationDateTime.value
                      }
                      key={i}
                      position={Cartesian3.fromDegrees(
                        station.location?.value.coordinates[0],
                        station.location?.value.coordinates[1],
                        bikeTerrainHeight[i]
                          ? bikeTerrainHeight[i] +
                              Number(import.meta.env.VITE_HEIGHT_OFFSET)
                          : 0
                      )}
                      point={{
                        pixelSize: 20,
                        heightReference: HeightReference.CLAMP_TO_GROUND,
                        color:
                          station.availableBikeNumber.value < 2
                            ? station.availableBikeNumber.value == 0
                              ? Color.RED
                              : Color.YELLOW
                            : Color.GREEN,
                      }}
                      name={station.stationName.value}
                    ></Entity>
                  )
                );
              })}
            {parkingSlots &&
              parkings?.map((parking, i) => {
                return (
                  <Entity
                    selected={false}
                    description={
                      "<h2>Available Spots: " +
                      parking.availableSpotNumber.value +
                      "</h2><br/>Max Spots : " +
                      parking.totalSpotNumber.value +
                      "<br/>Last Update: " +
                      parking.observationDateTime.value
                    }
                    key={i}
                    position={Cartesian3.fromDegrees(
                      parking.location.value.coordinates[0],
                      parking.location.value.coordinates[1],
                      parkingTerrainHeight[i]
                        ? parkingTerrainHeight[i] +
                            Number(import.meta.env.VITE_HEIGHT_OFFSET)
                        : 100
                    )}
                    point={{
                      pixelSize: 20,
                      heightReference: HeightReference.CLAMP_TO_GROUND,
                      color:
                        parking.availableSpotNumber.value < 2
                          ? parking.availableSpotNumber.value == 0
                            ? Color.RED
                            : Color.YELLOW
                          : Color.GREEN,
                    }}
                    name={parking.name.value}
                  ></Entity>
                );
              })}
          </Cesium3DTileset>
        </Globe>
      </Viewer>
    </div>
  );
}

export default App;
