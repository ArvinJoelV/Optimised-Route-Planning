import { Tabs } from "expo-router";
import { Image } from "react-native";
import React from "react-native";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="(manage)"
        options={{
          title: "Manage Trucks",
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("C:/Users/Ashok Adithya/OneDrive - SSN-Institute/Big Basket/BigBasket/my-app/assets/images/administrator.png")}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? "blue" : "gray",
              }}
            />
          ),
          tabBarStyle: { height: 60 },
          tabBarLabelStyle: { fontSize: 14, fontWeight: "400" },
        }}
      />
      <Tabs.Screen
        name="addtrucks"
        options={{
          title: "Add Truck",
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("C:/Users/Ashok Adithya/OneDrive - SSN-Institute/Big Basket/BigBasket/my-app/assets/images/profile1.png")}
              style={{
                width: 24,
                height: 24,
                tintColor: focused ? "blue" : "gray",
              }}
            />
          ),
          tabBarLabelStyle: { fontSize: 14, fontWeight: "400" },
          tabBarStyle: { height: 60 },
        }}
      />
    </Tabs>
  );
}
