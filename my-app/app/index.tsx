import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import axios from "axios";
import Ionicons from "react-native-vector-icons/Ionicons";

const SignIn = () => {
  const router = useRouter();
  const [truckId, setTruckId] = useState("");
  const [truckNumber, setTruckNumber] = useState("");
  const [secureText, setSecureText] = useState(true);

  const server = "http://10.21.236.151:8080";

  useEffect(() => {
    const checkLogin = async () => {
      const token = await SecureStore.getItemAsync("authToken");
      if (token) {
        router.replace("/(tabs)/home");
      }
    };
    checkLogin();
  }, []);

  const handleLogin = async () => {
    await SecureStore.deleteItemAsync("authToken");

    try {
      const response = await axios.post<{ success: boolean; token?: string }>(
        `${server}/login`,
        {
          truck_id: truckId,
          truck_number: truckNumber,
        }
      );

      if (response.data.success && response.data.token) {
        await SecureStore.setItemAsync("authToken", response.data.token);
        router.push("/(tabs)/home");
      }
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        Alert.alert("Login Failed", "Invalid Truck ID or Number");
      } else {
        Alert.alert("Error", "Something went wrong. Try again.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("C:/Users/Ashok Adithya/OneDrive - SSN-Institute/Big Basket/BigBasket/my-app/assets/images/bigbasket-logo.png")}
        style={styles.logo}
      />
      <Text style={styles.title}>Truck Sign In</Text>

      <TextInput
        placeholder="Truck ID"
        value={truckId}
        onChangeText={setTruckId}
        style={styles.input}
        placeholderTextColor="#777"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Truck Number"
          value={truckNumber}
          onChangeText={setTruckNumber}
          secureTextEntry={secureText}
          style={styles.passwordInput}
          placeholderTextColor="#777"
        />
        <TouchableOpacity
          onPress={() => setSecureText(!secureText)}
          style={styles.icon}
        >
          <Ionicons
            name={secureText ? "eye-off" : "eye"}
            size={24}
            color="#777"
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={handleLogin} style={styles.button}>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  title: {
    fontSize: 28,
    fontWeight: 500,
    marginBottom: 30,
    color: "#333",
  },
  input: {
    width: 280,
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 280,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  icon: {
    padding: 10,
  },
  button: {
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 30,
    shadowColor: "#007AFF",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 15,
    marginLeft: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default SignIn;
