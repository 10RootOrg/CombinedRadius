import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Button,
} from "react-native";
import CountDownCircle from "../Component's/HelperFunc/CountDownCircle";
import { useAppContext } from "../Store/Context/AppContext";
import Toast from "react-native-toast-message";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import { Table, Rows } from "react-native-table-component";
import OTPTextView from "react-native-otp-textinput";
import * as FileSystem from "expo-file-system";
import { Alert } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { log } from "../Component's/HelperFunc/logger";

export default function NotificationScreen({ route }) {
  const {
    modelData,
    setModelData,
    requestLog,
    setRequestLog,
    totpNumber,
    setTotpNumber,
    NotificationTrayCounter,
    setNotificationTrayCounter,
    modelDataTray,
    setModelDataTray,
    country,
    setCountry,
  } = useAppContext();
  const [currentTime, setCurrentTime] = useState(
    modelData?.time + modelData?.ttl * 1000 - Date.now()
  );
  const [ArrowIndex, setArrowIndex] = useState(1);

  let otpInput = useRef(null);

  useEffect(() => {
    console.log(modelDataTray[ArrowIndex - 1]);
    if (modelDataTray[ArrowIndex - 1]) {
      setModelData(modelDataTray[ArrowIndex - 1]);
    }
  }, [ArrowIndex]);

  useEffect(() => {
    if (modelDataTray[0]) {
      if (ArrowIndex === 1) {
        setModelData(modelDataTray[0]);
      } else {
        if (ArrowIndex > 1) {
          if (modelDataTray.length <= ArrowIndex - 1) {
            setArrowIndex((prev) => prev - 1);
          }
        }
      }
    }
  }, [, modelDataTray]);

  useEffect(() => {
    return () => {
      setNotificationTrayCounter(0);
      setModelDataTray([]);
      setCountry([]);
      setArrowIndex(1);
    };
  }, []);
  const clearText = () => {
    otpInput.clear();
  };
  const [loadBTN, setLoadBTN] = useState(false);
  const [timeDisableBtn, setTimeDisableBtn] = useState(16);
  const [key, setKey] = useState("123");
  const timeLocal = new Date(modelData?.time);
  const navigation = useNavigation();

  async function AddNotificationHistory(res, row) {
    const infoMain = await JSON.parse(res);
    const info = infoMain.filter((r) => {
      return r.id != row.id;
    });
    info.push(row);
    info.sort((a, b) => {
      return Number(b?.time) - Number(a?.time);
    });
    while (info.length >= 11) {
      info.pop();
    }

    await setRequestLog(info);
    await FileSystem.writeAsStringAsync(
      FileSystem.documentDirectory + "RequestLog.json",
      JSON.stringify(info)
    );
    setCountry(
      country.filter((item, ind) => {
        return ind != ArrowIndex - 1;
      })
    );
  }

  useEffect(() => {
    modelData?.TOTP ? clearText() : "";
    setKey(Math.random().toString());
    setTimeDisableBtn(11);
    setCurrentTime(modelData?.time + modelData?.ttl * 1000 - Date.now());
  }, [modelData]);

  const denyReq = async () => {
    setLoadBTN(true);

    const controller = new AbortController();
    const errNoConnect = setTimeout(() => {
      log.warn("cant access server  ");

      controller.abort();
      setTotpNumber("");
      if (NotificationTrayCounter <= 1) {
        setNotificationTrayCounter((prev) => prev - 1);
        setModelDataTray(
          modelDataTray.filter((item, ind) => {
            return ind != ArrowIndex - 1;
          })
        );
        navigation.navigate("MainScreen");
      } else {
        setNotificationTrayCounter((prev) => prev - 1);

        setModelData(modelDataTray[1]);
        setModelDataTray(
          modelDataTray.filter((item, ind) => {
            return ind != ArrowIndex - 1;
          })
        );
      }
      setLoadBTN(false);
    }, 6000);
    try {
      await axios.get(modelData?.nourl, {
        signal: controller.signal,
      });

      await clearTimeout(errNoConnect);
      setTotpNumber("");
      log.info("denied request  ");

      setLoadBTN(false);
      setTimeDisableBtn(0);
      FileSystem.readAsStringAsync(
        FileSystem.documentDirectory + "RequestLog.json"
      ).then(async (res3) => {
        AddNotificationHistory(res3, {
          origin: country[0],
          status: "Deny",
          time: Date.now(),
          id: modelData?.uuid,
        });
      });

      if (NotificationTrayCounter <= 1) {
        setNotificationTrayCounter((prev) => prev - 1);
        navigation.navigate("ResultScreen", { result: "Bad" });
        setModelDataTray(
          modelDataTray.filter((item, ind) => {
            return ind != ArrowIndex - 1;
          })
        );
      } else {
        setNotificationTrayCounter((prev) => prev - 1);

        Toast.show({
          type: "success",
          text1: "Successfully Denied ",
          visibilityTime: 3000,
        });
        setModelData(modelDataTray[1]);
        setModelDataTray(
          modelDataTray.filter((item, ind) => {
            return ind != ArrowIndex - 1;
          })
        );
      }
    } catch (err) {
      log.error("error happened during deny request  ", err);
      console.log(NotificationTrayCounter, "NotificationTrayCounterhjh");
      if (NotificationTrayCounter === 1) {
        navigation.navigate("MainScreen");
        setModelDataTray(
          modelDataTray.filter((item, ind) => {
            return ind != ArrowIndex - 1;
          })
        );
      }
      setNotificationTrayCounter((prev) => prev - 1);

      FileSystem.readAsStringAsync(
        FileSystem.documentDirectory + "RequestLog.json"
      ).then(async (res3) => {
        AddNotificationHistory(res3, {
          origin: country[0],
          status: "Dropped",
          time: Date.now(),
          id: modelData?.uuid,
        });
      });
      if (err == "CanceledError: canceled") {
        Toast.show({
          type: "error",
          text1: "Request Not Sent",
          visibilityTime: 3000,
        });
        log.error("Request Not Sent  ", err);
      } else if (err == "AxiosError: Network Error") {
        log.error("Network Error  ", err);

        Toast.show({
          type: "error",
          text1: "Network Error",
          visibilityTime: 3000,
        });
      } else {
        log.error("Request Not Authorized  ", err);

        Toast.show({
          type: "error",
          text1: "Request Not Authorized ",
          visibilityTime: 3000,
        });
      }
      await clearTimeout(errNoConnect);

      setTimeDisableBtn(0);
      setTotpNumber("");
      setLoadBTN(false);
    }
  };

  const accaptReq = async () => {
    setLoadBTN(true);
    const controller = new AbortController();
    const errNoConnect = setTimeout(() => {
      log.warn("cant access server  ");

      controller.abort();
      setTotpNumber("");

      if (NotificationTrayCounter <= 1) {
        setNotificationTrayCounter((prev) => prev - 1);
        setModelDataTray(
          modelDataTray.filter((item, ind) => {
            return ind != ArrowIndex - 1;
          })
        );
        navigation.navigate("MainScreen");
      } else {
        setNotificationTrayCounter((prev) => prev - 1);

        setModelData(modelDataTray[1]);
        setModelDataTray(
          modelDataTray.filter((item, ind) => {
            return ind != ArrowIndex - 1;
          })
        );
      }
      setLoadBTN(false);
    }, 6000);
    try {
      const acceptUrl =
        modelData?.phase2url + (totpNumber ? totpNumber : "00000");

      await axios.get(acceptUrl, {
        signal: controller.signal,
        headers: {
          "Bypass-Tunnel-Reminder": "123456789",
        },
      });

      await clearTimeout(errNoConnect);
      setTotpNumber("");
      log.info("accepted request  ");

      FileSystem.readAsStringAsync(
        FileSystem.documentDirectory + "RequestLog.json"
      ).then(async (res3) => {
        AddNotificationHistory(res3, {
          origin: country[0],
          status: "Approved",
          time: Date.now(),
          id: modelData?.uuid,
        });
      });
      setLoadBTN(false);
      setTimeDisableBtn(0);
      if (NotificationTrayCounter <= 1) {
        setNotificationTrayCounter((prev) => prev - 1);
        navigation.navigate("ResultScreen", { result: "Good" });
        setModelDataTray(
          modelDataTray.filter((item, ind) => {
            return ind != ArrowIndex - 1;
          })
        );
      } else {
        setNotificationTrayCounter((prev) => prev - 1);

        Toast.show({
          type: "success",
          text1: "Successfully Approved ",
          visibilityTime: 3000,
        });
        setModelData(modelDataTray[1]);
        setModelDataTray(
          modelDataTray.filter((item, ind) => {
            return ind != ArrowIndex - 1;
          })
        );
      }
    } catch (err) {
      log.error("error happened during accept request  ", err);
      console.log("NotificationTrayCounterjhhgugijg", NotificationTrayCounter);
      if (NotificationTrayCounter <= 1) {
        navigation.navigate("MainScreen");
        setModelDataTray(
          modelDataTray.filter((item, ind) => {
            return ind != ArrowIndex - 1;
          })
        );
      }
      setNotificationTrayCounter((prev) => prev - 1);

      setTotpNumber("");
      FileSystem.readAsStringAsync(
        FileSystem.documentDirectory + "RequestLog.json"
      ).then(async (res3) => {
        AddNotificationHistory(res3, {
          origin: country[0],
          status: "Dropped",
          time: Date.now(),
          id: modelData?.uuid,
        });
      });
      if (err == "CanceledError: canceled") {
        log.error("Request Not Sent  ", err);

        Toast.show({
          type: "error",
          text1: "Request Not Sent",
          visibilityTime: 3000,
        });
      } else if (err == "AxiosError: Network Error") {
        log.error("Network Error  ", err);

        Toast.show({
          type: "error",
          text1: "Network Error",
          visibilityTime: 3000,
        });
      } else if (err.response?.data === "Wrong TOTP") {
        log.error("Wrong TOTP ", err);

        Toast.show({
          type: "error",
          text1: "Wrong TOTP",
          visibilityTime: 3000,
        });
      } else {
        log.error("Request Not Authorized  ", err);

        Toast.show({
          type: "error",
          text1: "Request Not Authorized ",
          visibilityTime: 3000,
        });
      }

      await clearTimeout(errNoConnect);
      setTimeDisableBtn(0);

      navigation.navigate("MainScreen");
      setLoadBTN(false);
    }
  };

  const CONTENT = {
    tableTitle: [
      "Time",
      "External IP",
      "Internal IP",
      "Hostname",
      "FQDN",
      "User",
      "Description",
      "Duration",
    ],
    tableData: [
      [
        "Time",
        `${timeLocal.toLocaleTimeString(
          "en-GB"
        )} -${timeLocal.toLocaleDateString("en-GB")}`,
      ],
      ["External IP", modelData?.externalIP],
      ["Internal IP", modelData?.internalIP],
      ["Hostname", modelData?.host],
      ["FQDN", modelData?.fqdn],
      ["User", modelData?.user],
      [
        "Description",
        modelData?.description.length < 28 ? (
          modelData?.description
        ) : (
          <Pressable
            style={styles.BtnCopy}
            android_ripple={{ color: "#EBDDDD" }}
            onPress={() => {
              Alert.alert("Description", modelData?.description, [
                { text: "See Less" },
              ]);
            }}
          >
            <Text
              style={{
                backgroundColor: "#2797FF",
                borderRadius: 10,
                color: "#ffffff",
                padding: 2,
                paddingHorizontal: 5,
              }}
            >
              see more
            </Text>
          </Pressable>
        ),
      ],
      ["Duration", `${modelData?.ttl} Seconds`],
    ],
  };
  const disableAccept = () => {
    try {
      if (timeDisableBtn == 0) {
        return true;
      }

      if (loadBTN) {
        return true;
      }

      if (
        modelData?.TOTP
          ? totpNumber.length < Number(modelData?.TOTLength)
          : false
      ) {
        return true;
      }
      return false;
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <KeyboardAwareScrollView style={{ backgroundColor: "#ffffff" }}>
      <View style={styles.container}>
        <View
          style={{
            width: "75%",
            paddingBottom: 5,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons
              onPress={() => {
                if (ArrowIndex > 1) {
                  setArrowIndex((prev) => prev - 1);
                  console.log("back");
                }
              }}
              name="chevron-back-outline"
              size={28}
              style={[styles.ReqTitle, { padding: 0 }]}
            />
            <Text style={[styles.ReqTitle, { fontSize: 20 }]}>
              Pending Requests: {ArrowIndex}/
              {NotificationTrayCounter <= 0 ? 1 : NotificationTrayCounter}
            </Text>
            <Ionicons
              onPress={() => {
                if (ArrowIndex < NotificationTrayCounter) {
                  setArrowIndex((prev) => prev + 1);
                  console.log("Forward");
                }
              }}
              name="chevron-forward-outline"
              size={28}
              style={[styles.ReqTitle, { padding: 0 }]}
            />
          </View>

          <Text style={styles.title}>
            {/* {ArrowIndex}/{NotificationTrayCounter}
            {"\n"} */}
            Conditional Access{"\n"} {modelData?.uuid}
          </Text>
          {/* <Text style={styles.subtitle}>
            Request ID:{"\n"} {modelData?.uuid}
          </Text> */}

          <View>
            <CountDownCircle
              duration={modelData?.ttl}
              currentTime={currentTime / 1000}
              setTimeDisableBtn={setTimeDisableBtn}
              key={key}
            />
          </View>

          <Table>
            <Rows
              flexArr={[2, 3]}
              data={CONTENT.tableData}
              textStyle={styles.text}
              style={styles.row}
            />
          </Table>
        </View>
        {modelData?.TOTP ? (
          <View style={styles.totpContainer}>
            <Text>TOTP:</Text>

            <OTPTextView
              ref={(e) => (otpInput = e)}
              defaultValue={totpNumber}
              handleTextChange={(e) => {
                setTotpNumber(e);
              }}
              //
              inputCount={Number(modelData?.TOTLength)}
              containerStyle={styles.textInputContainer}
              textInputStyle={[styles.roundedTextInput]}
              autoFocus={false}
              tintColor="#67136F"
            />
          </View>
        ) : (
          <View style={styles.totpContainer}></View>
        )}
        <View style={styles.btnContainer}>
          <Pressable
            disabled={disableAccept()}
            style={() => {
              try {
                if (timeDisableBtn == 0) {
                  return [styles.approveContainer, styles.disabledBTN];
                }
                if (loadBTN) {
                  return [styles.approveContainer, styles.disabledBTN];
                }

                if (
                  modelData?.TOTP
                    ? totpNumber.length >= Number(modelData?.TOTLength)
                    : true
                ) {
                  return styles.approveContainer;
                }

                return [styles.approveContainer, styles.disabledBTN];
              } catch (err) {
                console.log(err);
              }
            }}
            onPress={accaptReq}
            android_ripple={{ color: "#1AB5ED" }}
          >
            <Ionicons
              name="checkmark-done-sharp"
              size={24}
              style={
                timeDisableBtn == 0 || loadBTN
                  ? styles.BtnTextDisabled
                  : !modelData?.TOTP
                  ? styles.BtnText
                  : totpNumber.length == Number(modelData?.TOTLength)
                  ? styles.BtnText
                  : styles.BtnTextDisabled
              }
            />
            <Text
              style={
                timeDisableBtn == 0 || loadBTN
                  ? styles.BtnTextDisabled
                  : !modelData?.TOTP
                  ? styles.BtnText
                  : totpNumber.length == Number(modelData?.TOTLength)
                  ? styles.BtnText
                  : styles.BtnTextDisabled
              }
            >
              Approve{" "}
            </Text>
          </Pressable>
          <Pressable
            disabled={timeDisableBtn == 0 || loadBTN}
            style={
              timeDisableBtn == 0 || loadBTN
                ? [styles.denyContainer, styles.disabledBTN]
                : styles.denyContainer
            }
            onPress={denyReq}
            android_ripple={{ color: "#1AB5ED" }}
          >
            <Ionicons
              name="close-sharp"
              size={24}
              style={
                timeDisableBtn == 0 || loadBTN
                  ? styles.BtnTextDisabled
                  : styles.BtnText
              }
            />
            <Text
              style={
                timeDisableBtn == 0 || loadBTN
                  ? styles.BtnTextDisabled
                  : styles.BtnText
              }
            >
              Deny
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginBottom: 15,
    backgroundColor: "#ffffff",
  },
  imageStyle: {
    height: 30,
    width: 67,
  },
  title: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  ReqTitle: {
    // fontSize: 20,
    fontWeight: "500",
    textAlign: "center",
    padding: 10,
    color: "#7E7B7B",
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
  },
  bodyText: {
    fontSize: 15,
    textAlign: "left",
  },
  BtnText: {
    fontSize: 14,
    color: "#FFFFFFCC",
    marginRight: 8,
  },
  BtnTextDisabled: {
    fontSize: 14,
    color: "#7B7979CC",
    marginRight: 8,
  },
  DetailText: {
    fontSize: 15,
    textAlign: "left",
    color: "#263238",
    opacity: 0.9,
  },
  btnContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  totpContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 5,
    width: "75%",
  },
  approveContainer: {
    flexDirection: "row",
    backgroundColor: "#1EBE54",
    marginVertical: 10,
    borderRadius: 5,
    padding: 5,
    alignItems: "center",
    justifyContent: "center",
    width: 125,
  },
  denyContainer: {
    flexDirection: "row",
    backgroundColor: "#E23738",
    marginHorizontal: 10,
    marginVertical: 10,
    borderRadius: 5,
    padding: 5,
    alignItems: "center",
    justifyContent: "center",
    width: 125,
  },
  disabledBTN: {
    borderWidth: 2,
    borderColor: "#B0B0B0",
    borderStyle: "dotted",
    backgroundColor: "transparent",
  },

  titleTable: { backgroundColor: "#2ecc71" },
  row: { marginBottom: 3 },
  text: { fontSize: 16 },
  wrapper: { flexDirection: "row" },
  textInputContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  roundedTextInput: {
    fontSize: 16,
    padding: 0,
    width: 16,
    height: 21,
    marginTop: 19,
    paddingBottom: 5,
  },
  BtnCopy: {
    flexDirection: "row",
    borderRadius: 5,
  },
});
