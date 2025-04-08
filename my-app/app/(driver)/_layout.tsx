import { Tabs } from "expo-router";
import { Image } from "react-native";
import React from "react";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <Image
              source={require("C:/Users/Ashok Adithya/OneDrive - SSN-Institute/Big Basket/BigBasket/my-app/assets/images/navigation.png")}
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
        name="myprofile"
        options={{
          title: "My profile",
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
