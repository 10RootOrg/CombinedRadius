import { Image, StyleSheet, Text, View } from "react-native";

export default function Header() {
  const headerLogo = require("../assets/Group237552.png");
  return (
    <View style={styles.container}>
      <Image style={styles.imageStyle} source={headerLogo}></Image>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
   
  },
  imageStyle: {
    height: 30,
    width: 67,
  },
});
