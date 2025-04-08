import axios from "axios";
import { useRouter } from "expo-router";
import { deleteItemAsync, getItemAsync } from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  Linking,
  Pressable,
} from "react-native";

type EachRoute = {
  start: string;
  end: string;
  google_maps_url: string;
};

type CombinedRoute = {
  combine: EachRoute[];
  total_distance: number;
  date: string;
};

const TruckProfile = () => {
  const [truckId, setTruckId] = useState<string | null>(null);
  const [truckNumber, setTruckNumber] = useState<string | null>(null);
  const [routeDetails, setRouteDetails] = useState<CombinedRoute[]>([]);
  const [noRouteDetails, setNoRouteDetails] = useState<string | null>(null);
  const router = useRouter();

  const server = "http://10.199.75.151:8080";

  useEffect(() => {
    const getDetails = async () => {
      try {
        const id = await getItemAsync("authToken");
        if (!id) {
          router.replace("/");
          return;
        }

        const response = await axios.get(`${server}/get-truck-details/${id}`);

        if (response.data?.success) {
          setTruckId(response.data.truck_id);
          setTruckNumber(response.data.truck_number);

          if (
            Array.isArray(response.data.routes) &&
            response.data.routes.length > 0
          ) {
            const formattedRoutes = response.data.routes.map(
              (route: CombinedRoute) => ({
                date: route.date,
                total_distance: route.total_distance,
                combine: route.combine || [],
              })
            );
            setRouteDetails(formattedRoutes);
          } else {
            setRouteDetails([]);
            setNoRouteDetails("No Route Details found");
          }
        } else {
          Alert.alert("No truck details found");
        }
      } catch (err) {
        Alert.alert("Can't retrieve profile data");
      }
    };

    getDetails();
  }, []);

  const handleLogout = async () => {
    await deleteItemAsync("authToken");
    router.replace("/");
  };

  const fetchRoutes = async () => {
    try {
      const id = await getItemAsync("authToken");
      if (!id) {
        router.replace("/");
        return;
      }

      const response = await axios.get(`${server}/get-truck-details/${id}`);

      if (response.data?.success) {
        setTruckId(response.data.truck_id);
        setTruckNumber(response.data.truck_number);

        if (
          Array.isArray(response.data.routes) &&
          response.data.routes.length > 0
        ) {
          const formattedRoutes = response.data.routes.map(
            (route: CombinedRoute) => ({
              date: route.date,
              total_distance: route.total_distance,
              combine: route.combine || [],
            })
          );
          setRouteDetails(formattedRoutes);
        } else {
          setRouteDetails([]);
          setNoRouteDetails("No Route Details found");
        }
      } else {
        Alert.alert("No truck details found");
      }
    } catch (err) {
      Alert.alert("Can't retrieve profile data");
    }
  };

  const getFormattedDate = (date: string | Date) => {
    const formattedDate = new Date(date).toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return formattedDate;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚛 Truck Profile</Text>
        <Pressable style={styles.featureButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.infoText}>Truck ID: {truckId}</Text>
        <Text style={styles.infoText}>Truck Number: {truckNumber}</Text>
      </View>

      <View style={styles.header}>
        <Text style={styles.subTitle}>📍 Recent Routes</Text>
        <Pressable onPress={fetchRoutes} style={styles.refreshButton}>
          <Text style={styles.refreshText}>🔄</Text>
        </Pressable>
      </View>

      {routeDetails.length > 0 ? (
        <FlatList
          data={routeDetails}
          keyExtractor={(item, index) => `route-${index}`}
          renderItem={({ item }) => (
            <View style={styles.routeCard}>
              <Text style={styles.routeDate}>
                📅 {getFormattedDate(item.date)}
              </Text>
              {Array.isArray(item.combine) && item.combine.length > 0 ? (
                item.combine.map((segment, index) => (
                  <View key={`segment-${index}`} style={styles.routeDetails}>
                    <Text style={styles.routeText}>
                      {segment.start} → {segment.end}
                    </Text>
                    <Text
                      style={styles.mapLink}
                      onPress={() => Linking.openURL(segment.google_maps_url)}
                    >
                      View on Map
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.routeText}>No segments available</Text>
              )}
              <Text style={styles.totalDistance}>
                🚛 Total Distance: {item.total_distance?.toFixed(2) || "N/A"} Km
              </Text>
            </View>
          )}
        />
      ) : (
        <Text style={styles.noRouteDetails}>{noRouteDetails}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#F2F2F7",
  },
  title: {
    marginTop: 40,
    fontSize: 23,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  mapLink: {
    fontSize: 14,
    color: "#007AFF",
    marginTop: 7,
  },
  featureText: {
    alignSelf: "center",
    fontSize: 14,
    fontWeight: "500",
  },

  refreshButton: {
    backgroundColor: "#eee",
    display: "flex",
    flexDirection: "row",
    paddingTop: 5,
    paddingBottom: 5,
    paddingRight: 10,
    paddingLeft: 10,
    borderRadius: 9999,
    gap: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    alignItems: "center",
    marginBottom: 14,
    marginRight: 40,
  },
  refreshText: {
    alignSelf: "center",
    fontSize: 20,
    fontWeight: "500",
  },
  card: {
    padding: 20,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 3,
  },
  noRouteDetails: {
    textAlign: "center",
    fontWeight: "500",
    fontSize: 14,
  },
  featureButton: {
    backgroundColor: "#B71C1C",
    display: "flex",
    flexDirection: "row",
    marginTop: 37,
    marginBottom: 15,
    paddingRight: 30,
    paddingLeft: 30,
    borderRadius: 9999,
    gap: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    alignItems: "center",
  },

  logoutText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  infoValue: {
    fontWeight: "bold",
    fontSize: 16,
  },
  subTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 14,
    marginTop: 5,
  },
  routeCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  routeDetails: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  routeText: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 7,
  },
  routeDate: {
    fontSize: 14,
    fontWeight: "500",
    color: "#222",
    marginBottom: 10,
    textAlign: "center",
  },
  totalDistance: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 15,
    color: "#333",
    textAlign: "center",
  },
});

export default TruckProfile;
