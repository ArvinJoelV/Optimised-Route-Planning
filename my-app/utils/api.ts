import axios from "axios";
import { getItemAsync } from "expo-secure-store";

const API_BASE_URL = "http://10.21.236.151:8080";

export const getOptimizedRoute = async (
  stops: { lat: number; lng: number }[]
) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/calculate-route/`, {
      truck_id: await getItemAsync("authToken"),
      algorithm: "shortest",
      points: stops,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching route:", error);
    throw error;
  }
};
