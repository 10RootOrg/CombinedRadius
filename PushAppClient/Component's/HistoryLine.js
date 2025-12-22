import { Text, View, StyleSheet } from "react-native";
import { useAppContext } from "../Store/Context/AppContext";

export default function HistoryLine({ i, data, size }) {
  const { requestLog } = useAppContext();
  const timeLocal = new Date(data.time);

  return (
    <>
      {i == 0 ? (
        <View style={[styles.historyContainer]}>
          <Text
            selectable={true}
            style={[
              {
                flex: 0.3,
                fontSize: 16,
                paddingLeft: 5,
                textAlign: "center",
                color: "#090808",
                fontWeight: "800",
              },
            ]}
          >
            Origin
          </Text>
          <Text
            selectable={true}
            style={[
              styles.middleBorder,
              {
                flex: 0.275,
                fontSize: 16,
                paddingLeft: 5,
                textAlign: "center",
                color: "#090808",
                fontWeight: "800",
              },
            ]}
          >
            Status
          </Text>
          <Text
            selectable={true}
            style={[
              {
                flex: 0.5,
                fontSize: 16,
                paddingLeft: 5,
                textAlign: "center",
                color: "#090808",
                fontWeight: "800",
              },
            ]}
          >
            TIme
          </Text>
        </View>
      ) : null}
      <View
        style={
          i == requestLog.length - 1
            ? [styles.historyContainer, { borderBottomWidth: 0 }]
            : [styles.historyContainer]
        }
      >
        <Text
          selectable={true}
          style={[styles.historyText, { flex: 0.3 }, size]}
        >
          {data.origin}
        </Text>
        <Text
          selectable={true}
          style={[
            styles.historyText,
            styles.middleBorder,
            { flex: 0.275 },
            size,
          ]}
        >
          {data.status}
        </Text>
        <Text
          selectable={true}
          style={[styles.historyText, { flex: 0.5 }, size]}
        >
          {timeLocal.toLocaleTimeString("en-GB")} -
          {timeLocal.toLocaleDateString("en-GB")}
        </Text>
      </View>
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
