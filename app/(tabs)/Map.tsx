import { StyleSheet, View } from "react-native";
import MapView, { Region } from "react-native-maps";

export default function TabTwoScreen() {
  // const region: Region = {
  //   latitude,
  //   longitude,
  //   latitudeDelta: 7,
  //   longitudeDelta: 7,
  // };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={styles.map}
       // initialRegion={}
        rotateEnabled={false}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
      ></MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
