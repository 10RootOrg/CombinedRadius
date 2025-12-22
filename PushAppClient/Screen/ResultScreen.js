import { BackHandler, StyleSheet } from "react-native";
import { Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAppContext } from "../Store/Context/AppContext";
import { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";

export default function ResultScreen(par) {
  let result = par.route.params.result;
  const { setNotificationTrayCounter, setModelDataTray, setCountry } =
    useAppContext();
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

  return (
    <View style={styles.mainContainer}>
      {result == "Good" ? (
        <View style={styles.container}>
          <Feather name="check-circle" size={80} color="#1EBE54" />
          <Text style={styles.textTitle}>Access request approved</Text>
        </View>
      ) : (
        <View style={styles.container}>
          <Feather name="x-circle" size={80} color="#E23738" />
          <Text style={styles.textTitle}>Access request denied</Text>
        </View>
      )}
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

  textTitle: {
    fontSize: 32,
    fontWeight: "700",
    marginTop: 10,
    textAlign: "center",
  },
});
