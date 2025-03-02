import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  TextInput,
  Image,
  Alert,
  TouchableOpacity,
  Text,
  FlatList,
  Pressable,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import MapView, { UrlTile, Marker, Polyline } from "react-native-maps";
import axios from "axios";
import Dialog from "react-native-dialog";
import Icon from "react-native-vector-icons/Ionicons";
import { getOptimizedRoute } from "@/utils/api";
import CustomBottomSheetView from "@/components/BottomScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";

export default function SearchBarWithLogo() {
  const [searchQuery, setSearchQuery] = useState("");
  const mapRef = useRef<MapView>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [showFeatureButtons, setShowFeatureButtons] = useState(false);
  const [showButtons, setShowButtons] = useState(true);
  const [region, setRegion] = useState({
    latitude: 20.5937,
    longitude: 78.9629,
    latitudeDelta: 15,
    longitudeDelta: 15,
  });
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [poiMarkers, setPoiMarkers] = useState<
    { lat: number; lng: number; name: string }[]
  >([]);
  const [markerCoords, setMarkerCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  type Stop = {
    name: string;
    latitude: number;
    longitude: number;
  };

  const [stops, setStops] = useState<Stop[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [newStopLocation, setNewStopLocation] = useState("");
  const [routeDialogVisible, setRouteDialogVisible] = useState(false);
  const router = useRouter();
  const [truck_id, setTruckId] = useState("");
  const [optimizedRoute, setOptimizedRoute] = useState<{
    routeOrder: { name: string; lat: number; lng: number }[];
    routeGeometry: { type: string; coordinates: [number, number][] };
    stops: string[];
    segment_links: { from: string; to: string; google_maps_url: string }[];
    approx_distance: number;
    restaurants: { lat: number; lng: number; brand: string }[];
    petrol_bunks: { lat: number; lng: number; brand: string }[];
  } | null>(null);

  useEffect(() => {
    const getTruckId = async () => {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) {
        router.replace("/");
      }
    };
    getTruckId();
  }, []);

  const handleSearch = async () => {
    if (searchQuery.trim() === "") return;

    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}`,
        {
          headers: {
            "User-Agent": "ReactNativeApp",
          },
        }
      );

      const data = response.data;

      if (data.length > 0) {
        const { lat, lon } = data[0];
        setRegion({
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });

        setMarkerCoords({
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
        });
      } else {
        Alert.alert(
          "Location not found",
          "Please try a different search query."
        );
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handleAddStop = () => {
    setDialogVisible(true);
  };

  const handleDialogSubmit = async () => {
    if (newStopLocation.trim() === "") return;
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${newStopLocation}`,
        {
          headers: {
            "User-Agent": "ReactNativeApp",
          },
        }
      );

      const data = response.data;

      if (data.length > 0) {
        const { lat, lon } = data[0];

        const newStop = {
          name: newStopLocation,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
        };

        setStops((prev) => [...prev, newStop]);

        mapRef.current?.animateToRegion({
          latitude: newStop.latitude,
          longitude: newStop.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      } else {
        Alert.alert("Location not found", "Try a different location.");
      }
    } catch (error) {
      console.error("Stop addition error:", error);
    }
    setDialogVisible(false);
    setNewStopLocation("");
  };

  const handleCalculateRoute = () => {
    if (stops.length < 2) {
      Alert.alert("Error", "You need at least 2 stops to calculate a route.");
    } else {
      setRouteDialogVisible(true);
    }
  };

  const handleDeleteStop = (index: number) => {
    setStops((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateRoute = async () => {
    if (stops.length < 2) {
      Alert.alert("Error", "At least two stops are required.");
      return;
    }

    try {
      setOptimizedRoute(null);
      const stopsData = stops.map((stop) => ({
        name: stop.name,
        lat: stop.latitude,
        lng: stop.longitude,
      }));

      const routeData = await getOptimizedRoute(stopsData);

      setOptimizedRoute({
        routeOrder: routeData.route_order,
        routeGeometry: routeData.route_geometry,
        stops: routeData.stops,
        segment_links: routeData.segment_links,
        approx_distance: routeData.approx_distance,
        petrol_bunks: routeData.petrol_bunks,
        restaurants: routeData.restaurants,
      });

      setRouteDialogVisible(false);
      setShowButtons(false);
      setIsBottomSheetOpen(true);
      setShowFeatureButtons(true);
      setSelectedFeature(null);
      setStops([]);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch optimized route.");
    }
  };

  const handleShow = (feature: string) => {
    if (selectedFeature === feature) {
      setSelectedFeature(null);
      setPoiMarkers([]);
    } else {
      setPoiMarkers([]);
      setSelectedFeature(feature);
      setPoiMarkers(
        feature === "petrol_bunks"
          ? optimizedRoute?.petrol_bunks.map((bunk) => ({
              ...bunk,
              type: "petrol",
            })) || []
          : optimizedRoute?.restaurants.map((restaurant) => ({
              ...restaurant,
              type: "restaurant",
            })) || []
      );
    }
  };

  const onZoomToLocation = (lat: number, lng: number, key: string) => {
    if (mapRef.current) {
      handleShow(key);
      mapRef.current.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  return (
    <SafeAreaProvider style={styles.container}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.searchContainer}>
          <Image
            source={require("C:/Users/Ashok Adithya/OneDrive - SSN-Institute/Big Basket/BigBasket/my-app/assets/images/bigbasket-logo.png")}
            style={styles.logo}
          />
          <TextInput
            placeholder="Search here"
            style={styles.input}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholderTextColor="#888"
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setMarkerCoords(null);
              }}
              style={styles.clearButton}
            >
              <Icon name="close" size={20} color="black" />
            </TouchableOpacity>
          )}
        </View>

        {showFeatureButtons && (
          <View style={styles.featureContainer}>
            <Pressable
              style={[
                styles.featureButton,
                selectedFeature === "petrol_bunks" &&
                  styles.selectedFeatureButton,
              ]}
              onPress={() => handleShow("petrol_bunks")}
            >
              <Icon name="car-sport" size={20} color="#555" />
              <Text style={styles.featureText}>Petrol Bunk</Text>
            </Pressable>
            <Pressable
              style={[
                styles.featureButton,
                selectedFeature === "restaurants" &&
                  styles.selectedFeatureButton,
              ]}
              onPress={() => handleShow("restaurants")}
            >
              <Icon name="restaurant" size={20} color="#555" />
              <Text style={styles.featureText}>Restaurant</Text>
            </Pressable>
          </View>
        )}

        <MapView
          style={styles.map}
          initialRegion={region}
          region={region}
          ref={mapRef}
        >
          <UrlTile
            urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
          />
          {markerCoords && <Marker coordinate={markerCoords} />}
          {stops.map((stop, index) => (
            <Marker key={index} coordinate={stop} pinColor={"blue"} />
          ))}
          {optimizedRoute?.stops?.map((stop, index) => (
            <Marker
              key={index}
              coordinate={{
                latitude: stop.lat,
                longitude: stop.lng,
              }}
              pinColor={"blue"}
            />
          ))}
          {showFeatureButtons &&
            poiMarkers.map((poi, index) => (
              <Marker
                key={index}
                coordinate={{ latitude: poi.lat, longitude: poi.lng }}
                title={poi.name}
                pinColor={poi.type === "petrol" ? "red" : "green"}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <Text style={{ fontSize: 14 }}>
                  {poi.type === "petrol" ? "⛽" : "🏨"}
                </Text>
              </Marker>
            ))}

          {optimizedRoute?.routeGeometry?.coordinates && (
            <Polyline
              coordinates={optimizedRoute.routeGeometry.coordinates.map(
                ([lng, lat]) => ({ latitude: lat, longitude: lng })
              )}
              strokeColor="blue"
              strokeWidth={3}
            />
          )}
        </MapView>

        {showButtons && (
          <TouchableOpacity style={styles.addButton} onPress={handleAddStop}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        )}

        <Dialog.Container visible={dialogVisible}>
          <Dialog.Title style={styles.dialogTitle}>Add Stop</Dialog.Title>
          <Dialog.Input
            style={styles.dialogInput}
            value={newStopLocation}
            onChangeText={setNewStopLocation}
          />
          <Dialog.Button
            label="Cancel"
            onPress={() => setDialogVisible(false)}
          />
          <Dialog.Button label="Add" onPress={handleDialogSubmit} />
        </Dialog.Container>

        <TouchableOpacity
          style={styles.routeButton}
          onPress={handleCalculateRoute}
        >
          <Text style={styles.routeButtonText}>Calculate Route</Text>
        </TouchableOpacity>

        {isBottomSheetOpen && (
          <CustomBottomSheetView
            onClose={() => {
              setIsBottomSheetOpen(false);
              setShowButtons(true);
              setOptimizedRoute(null);
              setShowFeatureButtons(false);
              setRegion({
                latitude: 20.5937,
                longitude: 78.9629,
                latitudeDelta: 15,
                longitudeDelta: 15,
              });
            }}
            approxDistance={optimizedRoute?.approx_distance}
            segmentLinks={optimizedRoute?.segment_links}
            petrol_bunks={optimizedRoute?.petrol_bunks}
            restaurants={optimizedRoute?.restaurants}
            onZoomToLocation={onZoomToLocation}
          />
        )}
        <Dialog.Container visible={routeDialogVisible}>
          <Dialog.Title style={styles.dialogTitle}>Selected Stops</Dialog.Title>

          {stops.map((stop, index) => (
            <View key={index} style={styles.stopItem}>
              <Text style={styles.stopText}>
                Stop {index + 1}: {stop.name}
              </Text>
              <TouchableOpacity onPress={() => handleDeleteStop(index)}>
                <Text style={{ color: "red" }}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}

          <Dialog.Button
            style={styles.dialogCreateRouteButton}
            label="Cancel"
            onPress={() => setRouteDialogVisible(false)}
          />
          <Dialog.Button
            style={styles.dialogCreateRouteButton}
            label="Calculate Route"
            onPress={calculateRoute}
          />
        </Dialog.Container>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  searchContainer: {
    position: "absolute",
    top: 50,
    left: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: "#fff",
    borderRadius: 9999,
    flexDirection: "row",
    height: 50,
    paddingLeft: 10,
    paddingRight: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  featureContainer: {
    position: "absolute",
    top: 115,
    zIndex: 1,
    display: "flex",
    flexDirection: "row",
    alignContent: "center",
    justifyContent: "space-evenly",
    width: "100%",
  },
  featureButton: {
    backgroundColor: "#fff",
    display: "flex",
    flexDirection: "row",
    paddingTop: 7,
    paddingBottom: 7,
    paddingRight: 15,
    paddingLeft: 15,
    borderRadius: 9999,
    gap: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    alignItems: "center",
  },
  selectedFeatureButton: {
    borderColor: "#4285F4",
    borderWidth: 3,
  },
  featureText: {
    alignSelf: "center",
    fontSize: 14,
    fontWeight: "500",
  },
  logo: {
    width: 24,
    height: 24,
    marginRight: 15,
    marginLeft: 5,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 18,
    fontWeight: "400",
    color: "#333333",
  },
  addButton: {
    position: "absolute",
    right: 20,
    bottom: 80,
    backgroundColor: "#4285F4",
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 30,
  },
  dialogTitle: {
    color: "black",
    fontSize: 23,
  },
  dialogInput: {
    color: "#333333",
    paddingTop: 5,
    fontSize: 18,
  },
  clearButton: {
    position: "absolute",
    right: 15,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  bottomSheetContainer: {
    flex: 1,
    padding: 15,
    backgroundColor: "white",
  },
  stopCountText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  stopItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stopText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  createRouteButton: {
    backgroundColor: "#007BFF",
    padding: 15,
    alignItems: "center",
    borderRadius: 10,
    marginTop: 15,
  },
  createRouteText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  routeButton: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#222831",
    padding: 15,
    alignItems: "center",
    elevation: 5,
  },
  routeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  dialogCreateRouteButton: {
    paddingTop: 20,
  },
});
