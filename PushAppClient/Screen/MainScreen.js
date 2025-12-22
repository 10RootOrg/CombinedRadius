import { Text, View, Pressable, StyleSheet, Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import Toast from "react-native-toast-message";
import { MaterialIcons } from "@expo/vector-icons";
import { useAppContext } from "../Store/Context/AppContext";
import * as FileSystem from "expo-file-system";
import { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import HistoryLine from "../Component's/HistoryLine";
import { Modal } from "react-native";
import { log } from "../Component's/HelperFunc/logger";

export default function MainScreen() {
  const {
    phoneRef,
    qrData,
    setQRdata,
    requestLog,
    setRequestLog,
    setNotificationTrayCounter,
    setModelDataTray,
    setCountry,
  } = useAppContext();

  useEffect(() => {
    setNotificationTrayCounter(0);
    setModelDataTray([]);
    setCountry([]);
  }, []);

  const [showHistory, setShowHistory] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(phoneRef);
    Toast.show({
      type: "success",
      text1: "Successful copy",
      visibilityTime: 1000,
    });
    log.info("copied");
  };
  useEffect(() => {
    FileSystem.readAsStringAsync(
      FileSystem.documentDirectory + "QRConfig.json"
    ).then((res) => {
      const info = JSON.parse(res);
      const timeLocal = new Date(info.date);

      setQRdata({
        date: `${timeLocal.toLocaleTimeString(
          "en-GB"
        )} -${timeLocal.toLocaleDateString("en-GB")}`,
        company: info.massage,
      });
    });
  }, []);
  const navigation = useNavigation();

  const handleOptions = () => {
    navigation.navigate("OptionsScreen");
  };
  return (
    <View style={styles.mainContainer}>
      <View style={styles.container}>
        <Text style={styles.textTitle}>Phone ID: </Text>
        <Text selectable={true} style={styles.emailInput}>
          {phoneRef}
        </Text>
        <Pressable
          style={styles.BtnCopy}
          android_ripple={{ color: "#EBDDDD" }}
          onPress={copyToClipboard}
        >
          <MaterialIcons name="content-copy" size={24} color="white" />
          <Text style={styles.TextBtn}>Copy ID </Text>
        </Pressable>
      </View>
      <View style={styles.container}>
        <Text style={styles.textTitle}>Key: </Text>
        {qrData ? (
          <Text selectable={true} style={styles.qrCodeInput}>
            Company name: {qrData.company} {"\n"}
            ScanTime:{qrData.date}
          </Text>
        ) : (
          <Text
            onPress={handleOptions}
            selectable={true}
            style={[
              styles.emailInput,
              { backgroundColor: "#E23738", color: "#FFFFFF" },
            ]}
          >
            Scan QR Code
          </Text>
        )}
      </View>
      <Pressable
        style={styles.BtnCopy}
        android_ripple={{ color: "#EBDDDD" }}
        onPress={() => {
          setShowHistory(!showHistory);
        }}
      >
        <Text style={styles.TextBtn}>
          {showHistory ? "Hide" : "Show"} Last{" "}
          {requestLog.length >= 4 ? 3 : requestLog.length} Notifications{" "}
        </Text>
      </Pressable>
      {showHistory && (
        <View
          style={{
            borderRadius: 10,
            backgroundColor: "#d9dfe5",
            marginTop: 4,
            width: "100%",
          }}
        >
          {requestLog.map((data, i) => {
            if (i == 3) {
              return (
                <Pressable
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  android_ripple={{ color: "#EBDDDD" }}
                  onPress={() => {
                    setModalVisible(true);
                  }}
                  key={Math.random(9000)}
                >
                  <Text
                    style={{
                      borderRadius: 10,
                      color: "#1F48EC",
                      padding: 2,
                      paddingHorizontal: 5,
                    }}
                  >
                    see more
                  </Text>
                </Pressable>
              );
            }
            if (i <= 2) {
              return (
                <HistoryLine
                  key={Math.random(9000)}
                  i={i}
                  data={data}
                  size={{ fontSize: 14 }}
                />
              );
            }
          })}
        </View>
      )}
      <Modal
        animationType="slide"
        // transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View style={{ borderRadius: 10, backgroundColor: "#d9dfe5" }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "800",
                textAlign: "center",
                marginVertical: 25,
              }}
              key={Math.random(9000)}
            >
              Notification History
            </Text>
            {requestLog.map((data, i) => {
              return <HistoryLine key={Math.random(9000)} i={i} data={data} />;
            })}
            <Pressable
              style={{
                alignItems: "center",
                justifyContent: "center",
              }}
              android_ripple={{ color: "#EBDDDD" }}
              onPress={() => {
                setModalVisible(false);
              }}
              key={Math.random(9000)}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  textAlign: "center",
                  marginVertical: 5,
                  color: "#61196D",
                }}
              >
                See Less
              </Text>
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
    justifyContent: "flex-start",
    padding: 15,
    width: "100%",
    backgroundColor: "#ffffff",
  },
  historyContainer: {
    flexDirection: "row",
    width: "95%",
    borderRadius: 10,
  },
  middleBorder: {
    borderRightWidth: 1,
    borderRightColor: "#2C2525",
    borderLeftWidth: 1,
    borderLeftColor: "#2C2525",
  },
  historyText: {
    fontSize: 15,
    paddingLeft: 15,
    textAlign: "left",
    color: "#A1A1A1",
    borderBottomWidth: 1,
    borderBottomColor: "#2C2525",
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  emailInput: {
    fontSize: 16,
    paddingVertical: 10,
    textAlign: "center",
    width: "100%",
    backgroundColor: "#d9dfe5",
    borderRadius: 10,
    color: "#A1A1A1",
  },
  qrCodeInput: {
    fontSize: 16,
    paddingLeft: 15,
    paddingVertical: 10,
    textAlign: "left",
    width: "100%",
    backgroundColor: "#d9dfe5",
    borderRadius: 10,
    color: "#A1A1A1",
  },
  // BtnCopy: {
  //   flexDirection: "row",
  //   width: "45%",
  //   backgroundColor: "#2797FF",
  //   marginTop: 18,
  //   padding: 10,
  //   borderRadius: 5,
  // },
  BtnCopy: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: "#2797FF",
    marginTop: 5,
    marginBottom: 5,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  TextBtn: {
    color: "#FFFFFF",
    fontSize: 16,
    marginLeft: 15,
  },
  textTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginVertical: 5,
  },
});
