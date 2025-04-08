import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  BackHandler,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

type Truck = {
  truck_id: string;
  truck_number: string;
};

export default function ManageTrucks() {
  const router = useRouter();
  const [trucks, setTrucks] = useState(null);

  const fetchTrucks = async () => {
    try {
      const response = await axios.get(`${server}/admin/get-all-trucks`);
      if (response.data?.success) {
        setTrucks(response.data.trucks);
      } else {
        Alert.alert("Error", "Failed to fetch trucks. Please try again.");
      }
    } catch (err) {
      Alert.alert("Error", "Failed to fetch trucks. Please try again.");
      console.error("Error fetching trucks:", err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTrucks();

      const onBackPress = () => {
        Alert.alert("Exit App", "Are you sure you want to exit?", [
          { text: "Cancel", style: "cancel" },
          { text: "Exit", onPress: () => BackHandler.exitApp() },
        ]);
        return true; // Prevent default back action
      };

      BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [])
  );

  const server = "http://10.199.75.151:8080";

  useEffect(() => {
    const getTruckId = async () => {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) {
        router.replace("/");
      }
    };
    const fetchTrucks = async () => {
      try {
        const response = await axios.get(`${server}/admin/get-all-trucks`);
        if (response.data?.success) {
          setTrucks(response.data.trucks);
        } else {
          Alert.alert("Error", "Failed to fetch trucks. Please try again.");
        }
      } catch (err) {
        Alert.alert("Error", "Failed to fetch trucks. Please try again.");
        console.error("Error fetching trucks:", err);
      }
    };
    getTruckId();
    fetchTrucks();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚛 Manage Trucks</Text>
      <FlatList
        data={trucks}
        keyExtractor={(item) => item.truck_id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.truckCard}
            onPress={() => router.push(`./${item.truck_id}`)}
          >
            <View style={styles.truckInfo}>
              <Text style={styles.truckId}>Truck ID: {item.truck_id}</Text>
              <Text style={styles.truckNumber}>{item.truck_number}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 50,
    backgroundColor: "#f4f4f4",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  truckCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 5,
    elevation: 4,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 6,
    borderLeftColor: "#007BFF",
  },
  truckInfo: {
    flex: 1,
  },
  truckId: {
    fontSize: 18,
    fontWeight: "600",
    color: "#007BFF",
  },
  truckNumber: {
    fontSize: 16,
    fontWeight: "500",
    color: "#555",
    marginTop: 4,
  },
});
