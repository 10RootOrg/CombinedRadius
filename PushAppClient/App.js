import { StatusBar } from "expo-status-bar";
import { I18nManager, StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";
import AppContextProvider from "./Store/Context/AppContext";

import * as Notifications from "expo-notifications";

import MainNavigation from "./Component's/MainNavigation";
import { NavigationContainer } from "@react-navigation/native";
import { log } from "./Component's/HelperFunc/logger";
import { useEffect, useState } from "react";

let receivedNotificationSub;
let NotificationInKill;
let CounterRemoval;
receivedNotificationSub = Notifications.addNotificationResponseReceivedListener(
  (response) => {
    NotificationInKill = response.notification;
  }
);

try {
  I18nManager.allowRTL(false);
} catch (err) {
  console.log(err);
}

export default function App() {
  // const [NotificationInKillState, setNotificationInKillState] = useState();

  useEffect(() => {
    if (NotificationInKill) {
      log.info("From inside app in Kill State", NotificationInKill);
      try {
        Notifications.scheduleNotificationAsync({
          content: NotificationInKill?.request?.content,
          trigger: { seconds: 1 },
        }).then((res) => {
          NotificationInKill = false;
          log.devNotice("this is res notification in kill ", res);
          receivedNotificationSub?.remove();
        });
      } catch (error) {
        log.error(error, "this error is annoying");
      }
    }
  }, [NotificationInKill]);
  // receivedNotificationSub?.remove();

  return (
    <>
      <StatusBar style="dark" />
      <AppContextProvider>
        <NavigationContainer>
          <View style={styles.container}>
            <MainNavigation receivedNotificationSub={receivedNotificationSub} />
          </View>
        </NavigationContainer>
      </AppContextProvider>

      <Toast />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
