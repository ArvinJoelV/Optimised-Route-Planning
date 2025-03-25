import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Linking,
  ScrollView,
} from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";
import Icon from "react-native-vector-icons/Ionicons";

type Props = {
  onClose: () => void;
  approxDistance: any;
  segmentLinks: any;
  petrol_bunks: any;
  restaurants: any;
  onZoomToLocation: (lat: number, lng: number, key: string) => void;
};

const CustomBottomSheetView = ({
  onClose,
  approxDistance,
  segmentLinks,
  petrol_bunks,
  restaurants,
  onZoomToLocation,
}: Props) => {
  const snapPoints = useMemo(() => ["15%", "40%", "65%", "75%"], []);
  const sheetRef = useRef<BottomSheet>(null);
  const [index, setIndex] = useState(0);
  const [currentSnapIndex, setCurrentSnapIndex] = useState(0);

  const [routes] = useState([
    { key: "petrol", title: "Petrol" },
    { key: "restaurants", title: "Restaurants" },
    { key: "route", title: "Route" },
  ]);

  const renderRouteTab = () => (
    <View style={{ flex: 1 }}>
      <FlatList
        data={segmentLinks}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>
              {item.from} ➝ {item.to}
            </Text>
            <Text
              style={styles.mapLink}
              onPress={() => Linking.openURL(item.google_maps_url)}
            >
              View on Map
            </Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );

  const renderPOITab = (data: any, type: string, key: string) => (
    <View style={{ flex: 1 }}>
      <FlatList
        data={data}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>{item.brand || "Unknown"}</Text>
            <TouchableOpacity
              onPress={() => {
                sheetRef.current?.snapToIndex(0);
                onZoomToLocation(item.lat, item.lng, key);
              }}
            >
              <Text style={styles.mapLink}>Zoom to Location</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );

  const renderScene = SceneMap({
    route: renderRouteTab,
    directions: () => (
      <View style={styles.scene}>
        <Text>Directions Tab</Text>
      </View>
    ),
    petrol: () => renderPOITab(petrol_bunks, "Petrol Bunks", "petrol_bunks"),
    restaurants: () => renderPOITab(restaurants, "Restaurants", "restaurants"),
  });

  const handleTabChange = (newIndex: number) => {
    if (currentSnapIndex !== 0) {
      const originalSnapIndex = currentSnapIndex;
      sheetRef.current?.snapToIndex(0);

      setTimeout(() => {
        setIndex(newIndex);
        sheetRef.current?.snapToIndex(originalSnapIndex);
      }, 500);
    } else {
      setIndex(newIndex);
    }
  };

  return (
    <BottomSheet
      ref={sheetRef}
      snapPoints={snapPoints}
      index={0}
      onChange={setCurrentSnapIndex}
      enableContentPanningGesture={false} // Disable dragging on content
      enableHandlePanningGesture={true} // Allow dragging only on handle
      style={styles.bottomSheet}
      handleComponent={() => (
        <View>
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>
          <View style={styles.header}>
            <Text style={styles.title}>Drive</Text>
            <View style={styles.centeredText}>
              <Text style={styles.DistanceTitle}>
                {parseFloat(approxDistance).toFixed(2)} KM
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                sheetRef.current?.close();
                onClose();
              }}
              style={styles.closeButton}
            >
              <Icon name="close-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    >
      <BottomSheetView style={[styles.contentContainer, { flex: 1 }]}>
        {/* <View style={styles.header}>
          <Text style={styles.title}>Drive</Text>
          <View style={styles.centeredText}>
            <Text style={styles.DistanceTitle}>
              {parseFloat(approxDistance).toFixed(2)} KM
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              sheetRef.current?.close();
              onClose();
            }}
            style={styles.closeButton}
          >
            <Icon name="close-outline" size={20} color="#666" />
          </TouchableOpacity>
        </View> */}

        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={handleTabChange}
          renderTabBar={(props) => (
            <TabBar
              {...props}
              style={styles.tabBar}
              indicatorStyle={styles.indicator}
              activeColor="#4285F4"
              inactiveColor="#888"
              renderLabel={({ route, focused }) => (
                <Text
                  style={[
                    styles.label,
                    { color: focused ? "#007AFF" : "#888" },
                  ]}
                >
                  {route.title}
                </Text>
              )}
            />
          )}
        />
      </BottomSheetView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  noDataText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#888",
    textAlign: "center",
    marginTop: 20,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  flatlist: { overflow: "scroll" },
  title: { fontSize: 25, fontWeight: "400", color: "#555" },
  DistanceTitle: { fontSize: 25, fontWeight: "500", color: "#222" },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  contentContainer: { flex: 1, paddingHorizontal: 15 },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 10,
    paddingLeft: 15,
    paddingRight: 15,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 20,
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    backgroundColor: "#fff",
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  indicator: { backgroundColor: "#007AFF", height: 3 },
  label: { fontSize: 16, fontWeight: "500", color: "#888" },
  scene: { flex: 1, flexDirection: "column", padding: 10 },
  linkContainer: {
    marginTop: 5,
    marginBottom: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    overflow: "scroll",
  },
  linkText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    alignSelf: "center",
    maxWidth: "70%",
  },
  mapLink: {
    fontSize: 14,
    color: "#007AFF",
    marginTop: 5,
    alignSelf: "center",
  },
  centeredText: {
    flex: 1,
    color: "black",
    alignItems: "center",
    textAlign: "center",
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#fff",
  },

  handle: {
    width: 50,
    height: 5,
    borderRadius: 10,
    backgroundColor: "#ccc",
  },
});

export default CustomBottomSheetView;
