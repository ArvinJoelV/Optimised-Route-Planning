import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import axios from "axios";

const SignIn = () => {
  const router = useRouter();
  const [truckId, setTruckId] = useState("");
  const [truckNumber, setTruckNumber] = useState("");

  const server = "http://192.168.1.7:8080";

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
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Truck Sign In</Text>
      <TextInput
        placeholder="Truck ID"
        value={truckId}
        onChangeText={setTruckId}
        style={{ width: 250, padding: 10, borderWidth: 1, marginBottom: 10 }}
      />
      <TextInput
        placeholder="Truck Number"
        value={truckNumber}
        onChangeText={setTruckNumber}
        secureTextEntry
        style={{ width: 250, padding: 10, borderWidth: 1, marginBottom: 20 }}
      />
      <TouchableOpacity
        onPress={handleLogin}
        style={{ backgroundColor: "#007AFF", padding: 10 }}
      >
        <Text style={{ color: "#fff" }}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignIn;
