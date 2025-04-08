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
  TextInput,
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
  const [truckId, setTruckId] = useState("");
  const [truckNumber, setTruckNumber] = useState("");
  const router = useRouter();

  const server = "http://10.199.75.151:8080";

  useEffect(() => {
    const getDetails = async () => {
      const id = await getItemAsync("authToken");
      if (!id) {
        router.replace("/");
        return;
      }
    };
    getDetails();
  }, []);

  const handleLogout = async () => {
    await deleteItemAsync("authToken");
    await deleteItemAsync("roleToken");
    router.replace("/");
  };

  const handleCreateTruck = async () => {
    if (!truckId || !truckNumber) {
      Alert.alert("Error", "Truck ID and Number are required.");
      return;
    }

    try {
      console.log(truckId, truckNumber);
      await axios.post(`${server}/admin/add-truck`, {
        truck_id: truckId,
        truck_number: truckNumber,
      });
      Alert.alert("Success", "Truck added successfully!");
      setTruckId("");
      setTruckNumber("");
    } catch (error) {
      Alert.alert("Error", "Failed to add truck.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚛 Add Trucks</Text>
        <Pressable style={styles.featureButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>
      </View>

      <View>
        <Text style={styles.title}>🚛 Create New Truck</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter Truck ID"
          value={truckId}
          onChangeText={setTruckId}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter Truck Number"
          value={truckNumber}
          onChangeText={setTruckNumber}
        />
      </View>
      <Pressable style={styles.addButton} onPress={handleCreateTruck}>
        <Text style={styles.addButtonText}>Add Truck</Text>
      </Pressable>
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
  input: {
    height: 50,
    borderColor: "#CCC",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: "#FFF",
    marginBottom: 15,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  logoutText: {
    color: "white",
    fontWeight: 500,
    fontSize: 16,
  },
});

export default TruckProfile;
