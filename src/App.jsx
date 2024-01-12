import { Viewer, Cesium3DTileset, Entity, CameraFlyTo, Globe } from "resium";
import { IonResource, Cartesian3, Color, HeightReference } from "cesium";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getItemTerrainHeight } from "@/utils/getElevation";

const myHeaders = new Headers();
//Setting context header for the context broker
myHeaders.append(
  "Link",
  '<https://raw.githubusercontent.com/awslabs/garnet-framework/main/context.jsonld>; rel="http://www.w3.org/ns/json-ld#context"; type="application/ld+json"'
);
myHeaders.append("Content-Type", "application/json");
const requestOptions = {
  method: "GET",
  headers: myHeaders,
  redirect: "follow",
};

function App() {
  //State and Hooks Section
  const ref = useRef(null);

  //Dict containing terrain elevation in order to render on 3DTiles
  const [bikeTerrainHeight, setBikeTerrainHeight] = useState({});
  const [parkingTerrainHeight, setParkingTerrainHeight] = useState({});
  // Default Terrain used to calculate the elevation
  const [terrainProv, setTerrainProv] = useState();

  //Array containing BikeStations and Parkings
  const [stations, setStations] = useState([]);
  const [parkings, setParkings] = useState([]);

  //Default display is Bike only
  const [bikes, setBikes] = useState(true);
  const [parkingSlots, setParkingSlots] = useState(false);

  //Default no Context broker customization
  const [selfService, setSelfService] = useState(false);
  const [customContextBroker, setCustomContextBroker] = useState(false);

  const [contextBroker, setContextBroker] = useState();

  //Toogle button section
  const toggleBikes = () => setBikes((value) => !value);
  const toggleParkingSlots = () => setParkingSlots((value) => !value);
  const toggleSelfService = () => {
    setSelfService((value) => !value),
      setContextBroker(),
      setCustomContextBroker(false);
  };
  const toggleCustomContextBroker = () =>
    setCustomContextBroker((value) => !value);

  //use effect section
  //This one to get Bikes Stations and associated elevation
  useEffect(() => {
    // No sense to execute this if Bikes modes is not toggled.
    if (!bikes) {
      return;
    }
    //Getting types BikeStation from the context Broker
    fetch(
      customContextBroker && selfService
        ? `${contextBroker}?type=BikeHireDockingStation&limit=1000`
        : `${
            import.meta.env.VITE_GARNET_BASE_URL
          }?type=BikeHireDockingStation&limit=1000`,
      requestOptions
    )
      .then((res) => {
        return res.json();
      })
      .then((data) => {
        //Filtering only item with location. Indeed we would be unable to display an item on the UI without coordinates
        const filteredData = data.filter((mydata) =>
          Object.prototype.hasOwnProperty.call(mydata, "location")
        );

        //Getting elevation for each station with the help of the CesiumTerrainProvider. This one is a promise so we need to use Promise.all()
        let getBikeTerrain = filteredData.map((station) => {
          return getItemTerrainHeight(station).then((result) => {
            return (getBikeTerrain = result);
          });
        });

        Promise.all(getBikeTerrain).then((result) => {
          //converting Array to Dict as it is more handy for query
          const arrayToDict = Object.fromEntries(
            result.map((x) => [Object.keys(x)[0], Object.values(x)[0]])
          );

          // Setting the 2 states, stations and elevation
          setBikeTerrainHeight(arrayToDict);
          setStations(filteredData);
        });
      });

    //Execute at the start then each time an update occurs on  SelfService/CustomBroker
  }, [customContextBroker, selfService]);

  //This one to get Parking Slots and  associated elevation
  useEffect(() => {
    // No sense to execute this if no terrain or if Parking modes is not toggled.
    if (!parkingSlots) {
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
        //Filtering only item with location. Indeed we would be unable to display an item on the UI without coordinates
        const filteredData = data.filter((mydata) =>
          Object.prototype.hasOwnProperty.call(mydata, "location")
        );
        //Getting elevation for each station with the help of the CesiumTerrainProvider. This one is a promise so we need to use Promise.all()
        let getParkingTerrain = filteredData.map((parking) => {
          return getItemTerrainHeight(parking).then((result) => {
            return (getParkingTerrain = result);
          });
        });

        Promise.all(getParkingTerrain).then((result) => {
          const arrayToDict = Object.fromEntries(
            result.map((x) => [Object.keys(x)[0], Object.values(x)[0]])
          );
          // Setting the 2 states, parkings and elevation
          setParkingTerrainHeight(arrayToDict);
          setParkings(filteredData);
        });
      });
    //Execute at the start then each time an update occurs on  SelfService/CustomBroker
  }, [parkingSlots, customContextBroker, selfService]);

  // UI Start Section
  return (
    <div className="min-h-full flex flex-col">
      <div className="border-slate-500 border-solid border p-5 mt-5 flex flex-col bg-slate-300 justify-center">
        <div className="flex flex-col justify-center items-center">
          <h1 className="justify-center items-center m-auto  text-3xl sm:text-5xl pt-5">
            Garnet & Smart Cities
          </h1>
          <a
            href="https://garnet-framework.dev/"
            target="_blank"
            rel="noreferrer"
            className="text-blue-700"
          >
            More infos about Garnet? Click me!
          </a>
        </div>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 justify-between mt-5">
          <Button variant="destructive" onClick={toggleBikes}>
            {bikes ? "Hide Bikes Stations" : "Show Bikes Stations"}
          </Button>
          <Button onClick={toggleSelfService}>
            {" "}
            {!selfService
              ? "Enter your own value"
              : "Revert to orginal and Hide"}
          </Button>
          <Button onClick={toggleParkingSlots}>
            {" "}
            {parkingSlots ? "Hide Parking Slots" : "Show Parking Slots"}{" "}
          </Button>
        </div>
        {selfService && (
          <div className="flex w-full max-w-2xl items-center space-x-5 m-auto mt-5 justify-evenly">
            <div className="flex flex-col w-full max-w-xl">
              <div className="flex flex-col justify-center items-center max-w-full">
                <Label htmlFor="cb">Context Broker URL</Label>
                <Input
                  className="m-2"
                  id="cb"
                  type="url"
                  placeholder={import.meta.env.VITE_GARNET_BASE_URL}
                  onChange={(e) => setContextBroker(e.target.value)}
                />

                <Button
                  className="max-w-xs"
                  type="submit"
                  onClick={toggleCustomContextBroker}
                >
                  {customContextBroker ? "Switch back to original" : "Submit"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Viewer
        //Those setting are setting found on some blog when using google 3D Tile
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
          //Those setting are setting found on some blog when using google 3D Tile
          show={false}
          enableLighting={true}
          depthTestAgainstTerrain={true}
        >
          <Cesium3DTileset
            //Getting Google 3D Tiles assets from Cesium ION
            url={IonResource.fromAssetId(2275207)}
            onReady={(tileset) => {
              ref.current?.cesiumElement?.zoomTo(tileset);
            }}
          >
            {stations.length > 0 && (
              //Cam to Fly to an new destination. Default Cam Altitude to an arbitrary value of 3000 meters
              <CameraFlyTo
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
                        bikeTerrainHeight[station.id] + Number(import.meta.env.VITE_HEIGHT_OFFSET)
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
                      parkingTerrainHeight[parking.id] + Number(import.meta.env.VITE_HEIGHT_OFFSET)
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
