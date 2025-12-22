import {
  Alert,
  BackHandler,
  FlatList,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { BarCodeScanner } from "expo-barcode-scanner";
import { useAppContext } from "../Store/Context/AppContext";
import { StyleSheet } from "react-native";
import * as FileSystem from "expo-file-system";
import Toast from "react-native-toast-message";
import { useEffect, useState } from "react";
import { AntDesign } from "@expo/vector-icons";
import { TextInput } from "react-native";
import * as Sharing from "expo-sharing";
import * as Picker from "expo-document-picker";
import GeoCell from "../Component's/GeoCell";
import { log } from "../Component's/HelperFunc/logger";
import { useNavigation } from "@react-navigation/native";

export default function OptionsScreen() {
  const {
    scanned,
    setScanned,
    items,
    setItems,
    valueIP,
    setValueIP,
    setQRdata,
    setNotificationTrayCounter,
    setModelDataTray,
    setCountry,
  } = useAppContext();

  const navigation = useNavigation();

  useEffect(() => {
    setNotificationTrayCounter(0);
    setModelDataTray([]);
    setCountry([]);

    const handleSystemBack = (e) => {
      navigation.navigate("MainScreen");
      return true;
    };

    BackHandler.addEventListener("hardwareBackPress", handleSystemBack);
    return () =>
      BackHandler.removeEventListener("hardwareBackPress", handleSystemBack);
  }, []);
  const [open, setOpen] = useState(false);
  const [open1, setOpen1] = useState(false);
  const [lon, setLon] = useState();
  const [lat, setLat] = useState();
  const [radius, setRadius] = useState();
  const handleBarCodeScanned = ({ type, data }) => {
    try {
      log.info("start qr scan  ");

      setScanned(false);
      const info = JSON.parse(data);
      info.date = Date.now();
      FileSystem.writeAsStringAsync(
        FileSystem.documentDirectory + "QRConfig.json",
        JSON.stringify(info)
      );
      Toast.show({
        type: "success",
        text1: "QR Scan Is Successful  ",
        visibilityTime: 3000,
      });
      const timeLocal = new Date(info.date);

      setQRdata({
        date: `${timeLocal.toLocaleTimeString(
          "en-GB"
        )} -${timeLocal.toLocaleDateString("en-GB")}`,
        company: info.massage,
      });
      log.info("end qr scan  ");
    } catch (err) {
      log.error("QR Scan Failed  ", err);

      Toast.show({
        type: "error",
        text1: "QR Scan Failed  ",
        visibilityTime: 3000,
      });
    }
  };

  const pressScanQr = () => {
    setScanned(true);
  };
  const handleAppSetting = () => {
    Linking.openSettings();
  };

  const addGeo = () => {
    if (!lat || !lon || !radius) {
      Alert.alert("All Fields Most Be Filled ");
      log.warn("All Fields Most Be Filled  ");

      return;
    }
    const val = [
      ...valueIP,
      {
        id:
          Math.floor(Math.random() * 9000) +
          Math.random().toString(36).slice(2, 4),
        Longitude: lon,
        Latitude: lat,
        Radius: radius,
      },
    ];
    setTimeout(() => {
      log.info("added geo location  ");

      FileSystem.writeAsStringAsync(
        FileSystem.documentDirectory + "geoConfig.json",
        JSON.stringify(val)
      );
      setValueIP(val);
      setLat();
      setLon();
      setRadius();
      setOpen1(false);
    }, 1000);
  };

  const PickFile = async () => {
    log.info("pick a file started ");
    try {
      const document = await Picker.getDocumentAsync({
        copyToCacheDirectory: false,
      });
      console.log(document.assets[0].uri, typeof document.assets[0].uri);
      const data = await FileSystem.readAsStringAsync(document.assets[0].uri);
      const info = JSON.parse(data);
      setValueIP(info);
      FileSystem.writeAsStringAsync(
        FileSystem.documentDirectory + "geoConfig.json",
        JSON.stringify(data)
      );
      log.info("pick a file ended  ");

      setOpen1(false);
    } catch (error) {
      console.log(error);
      log.info("pick a file ended with error " + error);
      Toast.show({
        type: "error",
        text1: "Failed to import Geo list",
        visibilityTime: 2000,
      });
    }
  };

  return (
    <View style={styles.mainContainer}>
      <Modal
        animationType="slide"
        visible={scanned}
        transparent={true}
        onRequestClose={async () => {
          setScanned(false);
        }}
        onDismiss={async () => {
          setScanned(false);
        }}
      >
        <BarCodeScanner
          onBarCodeScanned={scanned ? handleBarCodeScanned : undefined}
          style={StyleSheet.absoluteFillObject}
        />
      </Modal>
      <Pressable
        onPress={pressScanQr}
        android_ripple={{ color: "#2DC4C4CC" }}
        style={styles.BtnCopy}
      >
        <Text style={styles.TextBtn}> Scan Qr Code</Text>
      </Pressable>
      <Pressable
        onPress={handleAppSetting}
        android_ripple={{ color: "#2DC4C4CC" }}
        style={{ position: "absolute", right: 7, top: 7, padding: 5 }}
      >
        <AntDesign name="setting" size={24} color="black" />
      </Pressable>
      <Pressable
        onPress={() => {
          setOpen(true);
        }}
        android_ripple={{ color: "#2DC4C4CC" }}
        style={styles.BtnCopy}
      >
        <Text style={styles.TextBtn}> Geo Locations</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          Sharing.shareAsync(FileSystem.documentDirectory + "logs.log");
          log.info("shared Log file  ");
        }}
        android_ripple={{ color: "#2DC4C4CC" }}
        style={styles.BtnCopy}
      >
        <Text style={styles.TextBtn}> Export Log File</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          FileSystem.deleteAsync(FileSystem.documentDirectory + "logs.log");
          log.info("deleted Log File  ");

          Toast.show({
            type: "success",
            text1: "Deleted Log File  ",
            visibilityTime: 3000,
          });
        }}
        android_ripple={{ color: "#2DC4C4CC" }}
        style={styles.BtnCopy}
      >
        <Text style={styles.TextBtn}> Delete Log File</Text>
      </Pressable>
      <Modal
        animationType="slide"
        // transparent={true}
        visible={open}
        onRequestClose={() => {
          setOpen(!open);
        }}
      >
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
          }}
        >
          <View
            style={{
              borderRadius: 10,
              backgroundColor: "#d9dfe5",
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Pressable
              onPress={() => {
                setOpen1(true);
              }}
              android_ripple={{ color: "#2DC4C4CC" }}
              style={styles.BTNAdd}
            >
              <Text style={styles.TextBtn}> Add Geo Location</Text>
            </Pressable>
            <View
              style={{
                borderRadius: 10,
                backgroundColor: "#d9dfe5",
                width: "90%",
                maxHeight: "60%",
                marginTop: 18,
              }}
            >
              <ScrollView
                style={{
                  flexGrow: 0,
                }}
                contentContainerStyle={{
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {valueIP.map((data, i) => {
                  return (
                    <GeoCell
                      key={data.id}
                      i={i}
                      info={data}
                      size={{ fontSize: 14 }}
                    />
                  );
                })}
              </ScrollView>
            </View>
            <View style={styles.btnContainer}>
              <Pressable
                onPress={PickFile}
                android_ripple={{ color: "#2DC4C4CC" }}
                style={styles.BTNImport}
              >
                <Text style={styles.TextBtn}> Import </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  Sharing.shareAsync(
                    FileSystem.documentDirectory + "geoConfig.json"
                  );
                  log.info("Shared geo file  ");
                }}
                android_ripple={{ color: "#2DC4C4CC" }}
                style={styles.BTNImport}
              >
                <Text style={styles.TextBtn}> Export </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        // transparent={true}
        visible={open1}
        onRequestClose={() => {
          setOpen1(!open1);
        }}
      >
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              borderRadius: 10,
              backgroundColor: "#d9dfe5",
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TextInput
              placeholder="Longitude "
              keyboardType="numeric"
              value={lon}
              onChangeText={setLon}
              style={[styles.InputMeter, { marginTop: 18 }]}
            />
            <TextInput
              placeholder="Latitude  "
              keyboardType="numeric"
              value={lat}
              onChangeText={setLat}
              style={styles.InputMeter}
            />
            <TextInput
              placeholder="Radius in meters  "
              keyboardType="numeric"
              value={radius}
              onChangeText={setRadius}
              style={styles.InputMeter}
            />
            <Pressable
              onPress={addGeo}
              android_ripple={{ color: "#2DC4C4CC" }}
              style={styles.BtnCopy}
            >
              <Text style={styles.TextBtn}> Add </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    width: "100%",
    backgroundColor: "#ffffff",
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "95%",
  },
  btnContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    width: "100%",
    marginBottom: 18,
  },
  BTNImport: {
    flexDirection: "row",
    backgroundColor: "#2797FF",
    marginTop: 18,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    flex: 0.4,
  },
  BTNAdd: {
    width: "90%",
    backgroundColor: "#2797FF",
    marginTop: 18,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  BtnCopy: {
    flexDirection: "row",
    width: "95%",
    backgroundColor: "#2797FF",
    marginTop: 18,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  TextBtn: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  InputMeter: {
    color: "#030303",
    fontSize: 16,
    marginVertical: 2,
    padding: 5,
    width: "50%",
  },
  textTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 5,
  },
});
