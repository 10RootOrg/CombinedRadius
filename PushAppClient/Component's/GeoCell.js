import { Text, View, StyleSheet, Pressable, Alert } from "react-native";
import { useAppContext } from "../Store/Context/AppContext";
import * as FileSystem from "expo-file-system";
import Toast from "react-native-toast-message";
import { log } from "./HelperFunc/logger";

export default function GeoCell({ i, info, size }) {
  const { valueIP, setValueIP } = useAppContext();
  const handleDelete = (id) => {
    try {
      const fil = valueIP.filter((data) => data.id != id);
      FileSystem.writeAsStringAsync(
        FileSystem.documentDirectory + "geoConfig.json",
        JSON.stringify(fil)
      );
      log.info("deleted geo data  ");

      setValueIP(fil);
    } catch (err) {
      log.error(err);
    }
  };

  return (
    <>
      {i == 0 ? (
        <View style={[styles.historyContainer]}>
          <Text
            selectable={true}
            style={[
              {
                flex: 0.33,
                fontSize: 16,
                paddingLeft: 5,
                textAlign: "center",
                color: "#090808",
                fontWeight: "800",
              },
            ]}
          >
            Latitude
          </Text>
          <Text
            selectable={true}
            style={[
              styles.middleBorder,
              {
                flex: 0.33,
                fontSize: 16,
                paddingLeft: 5,
                textAlign: "center",
                color: "#090808",
                fontWeight: "800",
              },
            ]}
          >
            Longitude
          </Text>
          <Text
            selectable={true}
            style={[
              {
                flex: 0.33,
                fontSize: 16,
                paddingLeft: 5,
                textAlign: "center",
                color: "#090808",
                fontWeight: "800",
              },
            ]}
          >
            Radius (m)
          </Text>
        </View>
      ) : null}
      <Pressable
        onPress={() =>
          Alert.alert(
            "Hello",
            `What Action Will You Like To Take?\nLatitude: ${info.Latitude} \nLongitude :${info.Longitude} \nRadius(m): ${info.Radius}`,
            [
              {
                text: "Nothing",
                style: "cancel",
                onPress: () => {
                  console.log("cancel Press");
                },
              },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                  console.log("Delete Press");
                  handleDelete(info.id);
                },
              },
            ]
          )
        }
      >
        <View
          style={
            i == valueIP.length - 1
              ? [styles.historyContainer, { borderBottomWidth: 0 }]
              : [styles.historyContainer]
          }
        >
          <Text
            selectable={true}
            style={[styles.historyText, { flex: 0.33 }, size]}
          >
            {info.Latitude}
          </Text>
          <Text
            selectable={true}
            style={[
              styles.historyText,
              styles.middleBorder,
              { flex: 0.33 },
              size,
            ]}
          >
            {info.Longitude}
          </Text>
          <Text
            selectable={true}
            style={[styles.historyText, { flex: 0.33 }, size]}
          >
            {info.Radius}
          </Text>
        </View>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  historyContainer: {
    flexDirection: "row",
    width: "100%",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#2C2525",
    marginBottom: 5,
  },
  middleBorder: {
    borderRightWidth: 1,
    borderRightColor: "#2C2525",
    borderLeftWidth: 1,
    borderLeftColor: "#2C2525",
  },
  historyText: {
    fontSize: 16,
    paddingLeft: 5,
    textAlign: "left",
    color: "#A1A1A1",
  },
});
