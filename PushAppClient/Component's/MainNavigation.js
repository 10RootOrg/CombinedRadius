import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MainScreen from "../Screen/MainScreen";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { useEffect } from "react";
import { useAppContext } from "../Store/Context/AppContext";
import { BarCodeScanner } from "expo-barcode-scanner";
import { useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Header from "./Header";
import NotificationScreen from "../Screen/NotificationScreen";
import { SimpleLineIcons } from "@expo/vector-icons";
import ResultScreen from "../Screen/ResultScreen";
import OptionsScreen from "../Screen/OptionsScreen";
import * as FileSystem from "expo-file-system";
import VerifySignature from "./HelperFunc/Verify";
import Toast from "react-native-toast-message";
import axios from "axios";
import RadiusCalc from "./HelperFunc/RadiusCalc";
import { log } from "./HelperFunc/logger";
Notifications.setNotificationHandler({
  handleNotification: async (n) => {
    log.devNotice("this is first ", n);
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
  handleError: async (err) => {
    log.error(err);
  },
});

const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND-NOTIFICATION-TASK";

TaskManager.defineTask(
  BACKGROUND_NOTIFICATION_TASK,
  ({ data, error, executionInfo }) => {
    console.log("Received a notification in the background!");
    log.devNotice("well well well it works you got a notification", data);

    // Do something with the notification data
  }
);
Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);

TaskManager.getRegisteredTasksAsync().then((tasks) =>
  log.devNotice("Tasks are here ", tasks)
);

const Stack = createNativeStackNavigator();
// DON'T cHANGE UseEffect Without Reading The Documentation on expo
export default function MainNavigation({ receivedNotificationSub }) {
  const {
    setModelData,
    setPhoneRef,
    setValueIP,
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
  const navigation = useNavigation();

  const StateUpdateFunction = (data, land) => {
    // setModelData(modelDataTray[0] ? modelDataTray[0] : data);
    setModelDataTray((prev) => [...prev, data]);

    setTotpNumber("");
    Toast.show({
      type: "success",
      text1: "finish Qr Check ",
      visibilityTime: 4500,
    });
    setCountry((prev) => [...prev, land]);
    if (NotificationTrayCounter === 0) {
      setNotificationTrayCounter((prev) => prev + 1);

      navigation.navigate("NotificationScreen");
    } else {
      setNotificationTrayCounter((prev) => prev + 1);

      Toast.show({
        type: "success",
        text1: "Notification added to Tray ",
        visibilityTime: 4500,
      });
    }
  };

  async function getPermissionPushNotification() {
    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        alert("Failed to get push token for push notification!");
        return;
      }
      try {
        const PushToken = (
          await Notifications.getExpoPushTokenAsync({
            projectId: "c0398e2b-2b10-4fed-a83a-f53f339edc8b",
          })
        ).data
          .replace(/[\[\]'|]/g, "")
          .replace("ExponentPushToken", "");
        console.log(PushToken);
        log.devNotice("Token Received");
        setPhoneRef(PushToken);
      } catch (error) {
        log.devNotice(
          error,
          " Error Happened During Retrieval of token please contact support "
        );
        setPhoneRef("Error contact support");
      }
    } else {
      alert("Must use physical device for Push Notifications");
    }
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
        sound: Platform.OS === "android" ? null : "default",
      });
    }
  }

  useEffect(() => {
    getPermissionPushNotification();
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.getPermissionsAsync();
      if (status !== "granted") {
        const { status } = await BarCodeScanner.requestPermissionsAsync();
        if (status !== "granted") {
          alert(
            "no camera permissions some functions of the app will not work"
          );
        }
      }
    };
    FileSystem.getInfoAsync(
      FileSystem.documentDirectory + "QRConfig.json"
    ).then((tmp) => {
      if (tmp.exists === false) {
        alert(
          "You Have No Qr Code Scanned Please Go TO OPTIONS(top-right vertical dotes) and scan the qr code provided by the company"
        );
      }
    });
    FileSystem.getInfoAsync(
      FileSystem.documentDirectory + "geoConfig.json"
    ).then((tmp) => {
      if (tmp.exists === false) {
        FileSystem.writeAsStringAsync(
          FileSystem.documentDirectory + "geoConfig.json",
          JSON.stringify([])
        );
      }
    });
    receivedNotificationSub?.remove();
    FileSystem.readAsStringAsync(
      FileSystem.documentDirectory + "geoConfig.json"
    ).then(async (res5) => {
      // don't delete the second parse
      const info = await JSON.parse(res5);
      if (typeof info == "string") {
        const info5 = await JSON.parse(info);
        setValueIP(info5);
      } else {
        setValueIP(info);
      }
    });

    FileSystem.getInfoAsync(
      FileSystem.documentDirectory + "RequestLog.json"
    ).then((tmp) => {
      if (tmp.exists === false) {
        FileSystem.writeAsStringAsync(
          FileSystem.documentDirectory + "RequestLog.json",
          JSON.stringify([])
        );
      } else {
      }
    });
    FileSystem.readAsStringAsync(
      FileSystem.documentDirectory + "RequestLog.json"
    ).then((res5) => {
      const info5 = JSON.parse(res5);

      setRequestLog(info5);
    });

    getBarCodeScannerPermissions();

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
    }

    const runResponse = (data, notification, land) => {
      Toast.show({
        type: "success",
        text1: "Start Qr Check ",
        visibilityTime: 4500,
      });
      log.info("Start qr Check ");
      FileSystem.readAsStringAsync(
        FileSystem.documentDirectory + "QRConfig.json"
      )
        .then(async (response2) => {
          const info = JSON.parse(response2);
          Toast.show({
            type: "success",
            text1: "Start Qr Check 2 ",
            visibilityTime: 4500,
          });
          log.info("Retrieved qr data file ");

          const flip = VerifySignature(data.signature, info.massage, info.key);
          if (flip._j == true) {
            log.info("QR check passed");

            StateUpdateFunction(data, land);
            setTimeout(() => {
              Notifications.dismissNotificationAsync(
                notification.request.identifier
              );
            }, 120);
          } else {
            Toast.show({
              type: "error",
              text1: "not verified ",
              visibilityTime: 4500,
            });
            log.info("QR check Failed");

            FileSystem.readAsStringAsync(
              FileSystem.documentDirectory + "RequestLog.json"
            ).then(async (res3) => {
              AddNotificationHistory(res3, {
                origin: land,
                status: "Dropped",
                time: Date.now(),
                id: data.uuid,
              });
            });
            setTimeout(() => {
              Notifications.dismissNotificationAsync(
                notification.request.identifier
              );
            }, 120);
            Toast.show({
              type: "error",
              text1: "unTrusted source ",
              visibilityTime: 3000,
            });
            axios.get(data.noVerify);
            navigation.navigate("MainScreen");
          }
        })
        .catch((err) => {
          console.log(err);
          log.info("error happened during runResponse Function  ", err);

          setTimeout(() => {
            Notifications.dismissNotificationAsync(
              notification.request.identifier
            );
          }, 120);
          FileSystem.readAsStringAsync(
            FileSystem.documentDirectory + "RequestLog.json"
          ).then(async (res3) => {
            AddNotificationHistory(res3, {
              origin: land,
              status: "No QR",
              time: Date.now(),
              id: data.uuid,
            });
            navigation.navigate("OptionsScreen");
            Toast.show({
              type: "error",
              text1: "No QR ",
              visibilityTime: 3000,
            });
          });
        });
    };

    const receivedNotification = Notifications.addNotificationReceivedListener(
      (notification) => {
        try {
          log.info("Got Noti addNotificationReceivedListener");
          let ipLocation = { data: "" };
          try {
            Toast.show({
              type: "success",
              text1: "external ip check ",
              visibilityTime: 4500,
            });
            FileSystem.readAsStringAsync(
              FileSystem.documentDirectory + "RequestLog.json"
            ).then(async (res3) => {
              AddNotificationHistory(res3, {
                origin: "Unknown",
                status: "Unresponded",
                time: Date.now(),
                id:
                  notification?.request?.content?.data?.uuid ||
                  Date.now() + Math.random().toString(36).slice(2, 6),
              });
            });
            if (notification.request.content.data.externalIP) {
              try {
                log.info("start Location check");

                Toast.show({
                  type: "success",
                  text1: "Start ip config Check ",
                  visibilityTime: 4500,
                });

                FileSystem.readAsStringAsync(
                  FileSystem.documentDirectory + "geoConfig.json"
                ).then(async (res) => {
                  let info = JSON.parse(res);
                  if (typeof info == "string") {
                    const info5 = await JSON.parse(info);
                    info = info5;
                  }
                  Toast.show({
                    type: "success",
                    text1: "Start ip config Check 2",
                    visibilityTime: 4500,
                  });
                  log.info("successfully retrieved location file data ");

                  if (info.length >= 1) {
                    Toast.show({
                      type: "success",
                      text1: "Start ip config Check 3",
                      visibilityTime: 4500,
                    });
                    log.info("location file has data ");
                    let RadBol;
                    for (let i = 0; i < info.length; i++) {
                      const e = info[i];

                      const bol = RadiusCalc(
                        Number(e.Latitude),
                        Number(e.Longitude),
                        Number(
                          notification.request.content.data.location.latitude
                        ),
                        Number(
                          notification.request.content.data.location.longitude
                        ),
                        Number(e.Radius)
                      );

                      if (bol._j) {
                        RadBol = true;
                        break;
                      }
                      RadBol = false;
                    }
                    if (RadBol) {
                      log.info("passed location cheek ");
                      const controller = new AbortController();
                      const errNoConnect = setTimeout(() => {
                        controller.abort();
                        log.warn("ip location finder not working   ");

                        // runResponse(
                        //   notification.request.content.data,
                        //   notification,
                        //   "No Service"
                        // );
                        Toast.show({
                          type: "error",
                          text1: "Ip Location Not Working ",
                          visibilityTime: 4500,
                        });
                      }, 4500);
                      try {
                        ipLocation = await axios.get(
                          `https://geolocation-db.com/json/${notification.request.content.data.externalIP}`,
                          {
                            signal: controller.signal,
                          }
                        );
                      } catch (err) {
                        log.error("ip location finder throws an error  ", err);
                      }
                      await clearTimeout(errNoConnect);

                      await runResponse(
                        notification.request.content.data,
                        notification,
                        ipLocation.data.country_name || "No service"
                      );
                    } else {
                      setTimeout(() => {
                        Notifications.dismissNotificationAsync(
                          notification.request.identifier
                        );
                      }, 120);

                      log.info("failed location check ");

                      try {
                        const controller = new AbortController();
                        const errNoConnect = setTimeout(() => {
                          log.warn(
                            "cant send the denial of location to the server   "
                          );

                          controller.abort();
                          Toast.show({
                            type: "error",
                            text1:
                              "cant send the denial of location to the server ",
                            visibilityTime: 4500,
                          });
                        }, 4500);

                        await axios.get(
                          notification.request.content.data.noLocationUrl,
                          {
                            signal: controller.signal,
                          }
                        );
                        await clearTimeout(errNoConnect);
                      } catch (err) {
                        log.error("bad server answer ", err);
                      }
                      FileSystem.readAsStringAsync(
                        FileSystem.documentDirectory + "RequestLog.json"
                      ).then(async (res3) => {
                        const controller = new AbortController();
                        const errNoConnect = setTimeout(() => {
                          log.warn("ip location finder not working   ");

                          controller.abort();
                          Toast.show({
                            type: "error",
                            text1: "Ip Location Not Working ",
                            visibilityTime: 4500,
                          });
                          AddNotificationHistory(res3, {
                            origin: "No service",
                            status: "Outside Range",
                            time: Date.now(),
                            id: notification.request.content.data.uuid,
                          });
                          Toast.show({
                            type: "success",
                            text1:
                              "We protected You From A massage Outside of range ",
                            visibilityTime: 4500,
                          });
                        }, 4500);
                        try {
                          ipLocation = await axios.get(
                            `https://geolocation-db.com/json/${notification.request.content.data.externalIP}`,
                            {
                              signal: controller.signal,
                            }
                          );
                        } catch (err) {
                          log.error(
                            "ip location finder throws an error  ",
                            err
                          );
                        }
                        await clearTimeout(errNoConnect);

                        AddNotificationHistory(res3, {
                          origin: ipLocation.data.country_name || "No service",
                          status: "Outside Range",
                          time: Date.now(),
                          id: notification.request.content.data.uuid,
                        });
                        Toast.show({
                          type: "success",
                          text1:
                            "We protected You From A massage Outside of range ",
                          visibilityTime: 4500,
                        });
                      });
                    }
                  } else {
                    log.info("no data in location file ");

                    const controller = new AbortController();
                    const errNoConnect = setTimeout(() => {
                      log.warn("ip location finder not working   ");

                      controller.abort();

                      // runResponse(
                      //   notification.request.content.data,
                      //   notification,
                      //   "No service"
                      // );
                      Toast.show({
                        type: "error",
                        text1: "Ip Location Not Working ",
                        visibilityTime: 4500,
                      });
                    }, 4500);
                    try {
                      ipLocation = await axios.get(
                        `https://geolocation-db.com/json/${notification.request.content.data.externalIP}`,
                        {
                          signal: controller.signal,
                        }
                      );
                    } catch (err) {
                      log.error("ip location finder throws an error  ", err);
                    }
                    await clearTimeout(errNoConnect);

                    await runResponse(
                      notification.request.content.data,
                      notification,
                      ipLocation.data.country_name || "No service"
                    );
                  }
                });
              } catch (err) {
                Toast.show({
                  type: "error",
                  text1: "Request Not Valid error in process ",
                  visibilityTime: 3000,
                });
                log.error("Request Not Valid error in process  ");
                FileSystem.readAsStringAsync(
                  FileSystem.documentDirectory + "RequestLog.json"
                ).then(async (res3) => {
                  AddNotificationHistory(res3, {
                    origin: "No service",
                    status: "inValid Notification Process",
                    time: Date.now(),
                    id: Date.now() + Math.random().toString(36).slice(2, 6),
                  });
                });
                setTimeout(() => {
                  Notifications.dismissNotificationAsync(
                    notification.request.identifier
                  );
                }, 120);
              }
            } else {
              Toast.show({
                type: "error",
                text1: "Request Not Valid as there is no External ip ",
                visibilityTime: 3000,
              });
              log.error("Request Not Valid missing vital data");
              FileSystem.readAsStringAsync(
                FileSystem.documentDirectory + "RequestLog.json"
              ).then(async (res3) => {
                AddNotificationHistory(res3, {
                  origin: "No service",
                  status: "inValid Notification",
                  time: Date.now(),
                  id: Date.now() + Math.random().toString(36).slice(2, 6),
                });
              });

              setTimeout(() => {
                Notifications.dismissNotificationAsync(
                  notification.request.identifier
                );
              }, 120);
            }
          } catch (err) {
            Toast.show({
              type: "error",
              text1: "Request Not Valid ",
              visibilityTime: 3000,
            });
            FileSystem.readAsStringAsync(
              FileSystem.documentDirectory + "RequestLog.json"
            ).then(async (res3) => {
              AddNotificationHistory(res3, {
                origin: "No service",
                status: "inValid Notification",
                time: Date.now(),
                id: Date.now() + Math.random().toString(36).slice(2, 6),
              });
            });
            log.error("Request Not Valid", err);

            setTimeout(() => {
              Notifications.dismissNotificationAsync(
                notification.request.identifier
              );
            }, 120);
          }
        } catch (error) {
          log.error(
            "this is error from addNotificationReceivedListener",
            error
          );
        }
      }
    );

    const responseNotification =
      Notifications.addNotificationResponseReceivedListener((response) => {
        try {
          log.info("Got Noti addNotificationResponseReceivedListener");

          FileSystem.readAsStringAsync(
            FileSystem.documentDirectory + "RequestLog.json"
          ).then(async (res3) => {
            AddNotificationHistory(res3, {
              origin: "Unknown",
              status: "Unresponded",
              time: Date.now(),
              id:
                response?.notification?.request?.content?.data?.uuid ||
                Date.now() + Math.random().toString(36).slice(2, 6),
            });
          });
          let data;
          // const not =  Notifications.getPresentedNotificationsAsync();
          let notificationObj;
          // if (not[0]) {
          //   // sort by sent date descending order
          //   not.sort((n1, n2) =>
          //     n1.request.trigger.remoteMessage.sentTime <
          //     n2.request.trigger.remoteMessage.sentTime
          //       ? 1
          //       : n1.request.trigger.remoteMessage.sentTime >
          //         n2.request.trigger.remoteMessage.sentTime
          //       ? -1
          //       : 0
          //   );

          //   if (
          //     not[0]?.request.trigger.remoteMessage.sentTime >
          //     response.notification.request.trigger.remoteMessage.sentTime
          //   ) {
          //     notificationObj = not[0];
          //     data = not[0].request.content;
          //   } else {
          //     notificationObj = response.notification;
          //     data = response.notification.request.content;
          //   }
          // } else {
          //   notificationObj = response.notification;
          //   data = response.notification.request.content;
          // }
          notificationObj = response.notification;
          data = response.notification.request.content;
          // // console.log(
          // //   not[0]?.request.trigger.remoteMessage.sentTime,
          // //   "all not"
          // // );
          // // console.log(notificationObj.request.trigger.remoteMessage.sentTime);

          const ipValidate = () => {
            let ipLocation = { data: "" };
            try {
              Toast.show({
                type: "success",
                text1: "Start ip config Check ",
                visibilityTime: 4500,
              });
              FileSystem.readAsStringAsync(
                FileSystem.documentDirectory + "RequestLog.json"
              ).then(async (res3) => {
                AddNotificationHistory(res3, {
                  origin: "Unknown",
                  status: "Unresponded",
                  time: Date.now(),
                  id:
                    data?.data?.uuid ||
                    Date.now() + Math.random().toString(36).slice(2, 6),
                });
              });
              if (data.data.externalIP) {
                try {
                  log.info("start Location check");

                  FileSystem.readAsStringAsync(
                    FileSystem.documentDirectory + "geoConfig.json"
                  ).then(async (res) => {
                    let info = JSON.parse(res);
                    if (typeof info == "string") {
                      const info5 = await JSON.parse(info);
                      info = info5;
                    }
                    Toast.show({
                      type: "success",
                      text1: "Start ip config Check 2",
                      visibilityTime: 4500,
                    });
                    log.info("successfully retrieved location file data ");

                    if (info.length >= 1) {
                      Toast.show({
                        type: "success",
                        text1: "Start ip config Check 3",
                        visibilityTime: 4500,
                      });
                      log.info("location file has data ");

                      let RadBol;
                      for (let i = 0; i < info.length; i++) {
                        const e = info[i];

                        const bol = RadiusCalc(
                          Number(e.Latitude),
                          Number(e.Longitude),
                          Number(data.data.location.latitude),
                          Number(data.data.location.longitude),
                          Number(e.Radius)
                        );

                        if (bol._j) {
                          RadBol = true;
                          break;
                        }
                        RadBol = false;
                      }
                      if (RadBol) {
                        log.info("passed location cheek ");

                        const controller = new AbortController();
                        const errNoConnect = setTimeout(() => {
                          log.warn("ip location finder not working   ");
                          controller.abort();

                          // runResponse(data.data, notificationObj, "No Service");
                          Toast.show({
                            type: "error",
                            text1: "Ip Location Not Working ",
                            visibilityTime: 4500,
                          });
                        }, 4500);
                        try {
                          ipLocation = await axios.get(
                            `https://geolocation-db.com/json/${data.data.externalIP}`,
                            {
                              signal: controller.signal,
                            }
                          );
                        } catch (err) {
                          log.error(
                            "ip location finder throws an error  ",
                            err
                          );
                        }
                        await clearTimeout(errNoConnect);

                        await runResponse(
                          data.data,
                          notificationObj,
                          ipLocation.data.country_name || "No service"
                        );
                      } else {
                        log.info("failed location check ");
                        try {
                          const controller = new AbortController();
                          const errNoConnect = setTimeout(() => {
                            log.warn(
                              "cant send the denial of location to the server   "
                            );

                            controller.abort();
                            Toast.show({
                              type: "error",
                              text1:
                                "cant send the denial of location to the server ",
                              visibilityTime: 4500,
                            });
                          }, 4500);

                          await axios.get(data.data.noLocationUrl, {
                            signal: controller.signal,
                          });
                          await clearTimeout(errNoConnect);
                        } catch (err) {
                          log.error("bad server answer ", err);
                        }
                        FileSystem.readAsStringAsync(
                          FileSystem.documentDirectory + "RequestLog.json"
                        ).then(async (res3) => {
                          const controller = new AbortController();
                          const errNoConnect = setTimeout(() => {
                            controller.abort();
                            log.warn("ip location finder not working   ");

                            Toast.show({
                              type: "error",
                              text1: "Ip Location Not Working ",
                              visibilityTime: 4500,
                            });
                            AddNotificationHistory(res3, {
                              origin: "No service",
                              status: "Outside Range",
                              time: Date.now(),
                              id: data.data.uuid,
                            });
                            Toast.show({
                              type: "success",
                              text1:
                                "We protected You From A massage Outside of range ",
                              visibilityTime: 4500,
                            });
                          }, 4500);
                          try {
                            ipLocation = await axios.get(
                              `https://geolocation-db.com/json/${data.data.externalIP}`,
                              {
                                signal: controller.signal,
                              }
                            );
                          } catch (err) {
                            log.error(
                              "ip location finder throws an error  ",
                              err
                            );
                          }
                          await clearTimeout(errNoConnect);
                          await AddNotificationHistory(res3, {
                            origin:
                              ipLocation.data.country_name || "No service",
                            status: "Outside Range",
                            time: Date.now(),
                            id: data.data.uuid,
                          });

                          Toast.show({
                            type: "success",
                            text1:
                              "We protected You From A massage Outside of range ",
                            visibilityTime: 4500,
                          });
                        });
                      }
                    } else {
                      const controller = new AbortController();
                      const errNoConnect = setTimeout(() => {
                        log.warn("ip location finder not working   ");

                        controller.abort();

                        // runResponse(data.data, notificationObj, "No service");
                        Toast.show({
                          type: "error",
                          text1: "Ip Location Not Working ",
                          visibilityTime: 4500,
                        });
                      }, 4500);
                      try {
                        ipLocation = await axios.get(
                          `https://geolocation-db.com/json/${data.data.externalIP}`,
                          {
                            signal: controller.signal,
                          }
                        );
                      } catch (err) {
                        log.error("ip location finder throws an error  ", err);
                      }
                      await clearTimeout(errNoConnect);

                      await runResponse(
                        data.data,
                        notificationObj,
                        ipLocation.data.country_name || "No service"
                      );
                    }
                  });
                } catch (err) {
                  Toast.show({
                    type: "error",
                    text1: "Request Not Valid error in process ",
                    visibilityTime: 3000,
                  });
                  FileSystem.readAsStringAsync(
                    FileSystem.documentDirectory + "RequestLog.json"
                  ).then(async (res3) => {
                    AddNotificationHistory(res3, {
                      origin: "No service",
                      status: "inValid Notification Process",
                      time: Date.now(),
                      id: Date.now() + Math.random().toString(36).slice(2, 6),
                    });
                  });
                }
              } else {
                Toast.show({
                  type: "error",
                  text1: "Request Not Valid as there is no External ip ",
                  visibilityTime: 3000,
                });
                FileSystem.readAsStringAsync(
                  FileSystem.documentDirectory + "RequestLog.json"
                ).then(async (res3) => {
                  AddNotificationHistory(res3, {
                    origin: "No service",
                    status: "inValid Notification",
                    time: Date.now(),
                    id: Date.now() + Math.random().toString(36).slice(2, 6),
                  });
                });

                log.error("Request Not Valid missing vital data");
              }
            } catch (err) {
              Toast.show({
                type: "error",
                text1: "Request Not Valid ",
                visibilityTime: 3000,
              });
              FileSystem.readAsStringAsync(
                FileSystem.documentDirectory + "RequestLog.json"
              ).then(async (res3) => {
                AddNotificationHistory(res3, {
                  origin: "No service",
                  status: "inValid Notification",
                  time: Date.now(),
                  id: Date.now() + Math.random().toString(36).slice(2, 6),
                });
              });
              log.error("Request Not Valid", err);
            }
          };
          if (data.data == "We Safe") {
            Toast.show({
              type: "success",
              text1:
                "We protected You From A notification From aunAllowed Location ",
              text2: "see settings For List Of Allowed Locations",
              visibilityTime: 8000,
            });
          } else {
            setTimeout(() => {
              ipValidate();
            }, 700);
          }
        } catch (error) {
          log.error(
            "this is error in addNotificationResponseReceivedListener",
            error
          );
        }
      });

    const NotificationDrop = Notifications.addNotificationsDroppedListener(
      async (note) => {
        log.devNotice("Notification Drooped ", note);
      }
    );

    return () => {
      NotificationDrop?.remove();
      responseNotification?.remove();
      receivedNotification?.remove();
    };
  }, []);

  const handleOptions = () => {
    navigation.navigate("OptionsScreen");
  };
  const handleBack = () => {
    navigation.navigate("MainScreen");
  };
  const logo = require("../assets/10Rootlogorezise.png");

  return (
    <>
      <View style={styles.container}>
        <Stack.Navigator
          initialRouteName="MainScreen"
          screenOptions={{
            headerTitle: () => <Header />,
            headerRight: () => (
              <Pressable
                onPress={handleOptions}
                android_ripple={{ color: "#929090" }}
              >
                <SimpleLineIcons
                  name="options-vertical"
                  size={24}
                  color="#ACACAC"
                />
              </Pressable>
            ),
            headerLeft: () => (
              <Pressable
                style={{
                  width: 25,
                  height: 30,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={handleBack}
                android_ripple={{ color: "#929090" }}
              >
                <SimpleLineIcons name="arrow-left" size={16} color="#ACACAC" />
              </Pressable>
            ),
            headerTitleAlign: "center",
            headerBackVisible: false,
          }}
        >
          <Stack.Screen
            name="MainScreen"
            component={MainScreen}
            options={{
              headerLeft: () => {},
            }}
          />
          <Stack.Screen
            name="NotificationScreen"
            component={NotificationScreen}
          />
          <Stack.Screen name="ResultScreen" component={ResultScreen} />
          <Stack.Screen
            name="OptionsScreen"
            component={OptionsScreen}
            options={{
              headerRight: () => {},
            }}
          />
        </Stack.Navigator>
        <View style={styles.footer}>
          <Image source={logo} />
          <Text>10Root PushApp: 0.9.9</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    width: "100%",
  },
  footer: {
    flexDirection: "row",
    height: 25,
    justifyContent: "flex-start",
    width: "100%",
  },
  optionsIcon: {
    color: "#979797",
  },
});
