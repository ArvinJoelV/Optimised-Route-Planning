import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  ImageBackground,
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

  const server = "http://10.199.75.151:8080";

  useEffect(() => {
    const checkLogin = async () => {
      const token = await SecureStore.getItemAsync("authToken");
      const userRole = await SecureStore.getItemAsync("userRole");
      if (token) {
        if (userRole === "admin") {
          router.replace("/(admin)");
        } else {
          router.replace("/(driver)/home");
        }
      }
    };
    checkLogin();
  }, []);

  const handleLogin = async () => {
    await SecureStore.deleteItemAsync("authToken");
    await SecureStore.deleteItemAsync("userRole");
    try {
      const response = await axios.post<{
        success: boolean;
        token?: string;
        role?: string;
      }>(`${server}/login`, {
        truck_id: truckId,
        truck_number: truckNumber,
      });

      if (response.data.success && response.data.token && response.data.role) {
        await SecureStore.setItemAsync("authToken", response.data.token);
        await SecureStore.setItemAsync("userRole", response.data.role);
        if (response.data.role === "admin") {
          router.replace("/(admin)/(manage)/manage");
        } else {
          router.replace("/(driver)/home");
        }
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
    <ImageBackground
      source={require("C:/Users/Ashok Adithya/OneDrive - SSN-Institute/Big Basket/BigBasket/my-app/assets/images/backg.jpg")}
      style={styles.container}
    >
      <Image
        source={require("C:/Users/Ashok Adithya/OneDrive - SSN-Institute/Big Basket/BigBasket/my-app/assets/images/bigbasket-logo.png")}
        style={styles.logo}
      />
      <Text style={styles.title}>Truck Sign In</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Truck ID"
          value={truckId}
          onChangeText={setTruckId}
          style={styles.input}
          placeholderTextColor="#777"
        />
      </View>

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
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: 500,
    marginBottom: 30,
    color: "#00FFFF",
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    backgroundColor: "#FFFFE0",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 280,
    backgroundColor: "#FFFFE0",
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
    backgroundColor: "#FFFFE0",
  },
  icon: {
    padding: 10,
  },
  button: {
    backgroundColor: "#00CCCC",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 30,
    shadowColor: "#007AFF",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 15,
    marginLeft: 5,
    marginBottom: 10,
    borderRadius: 10,
  },
  buttonText: {
    color: "#333333",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default SignIn;
