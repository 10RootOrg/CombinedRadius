import React, { useEffect, useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import Svg, { Path, LinearGradient, Stop, Defs } from "react-native-svg";
import Constants from "expo-constants";
import { useCountdown } from "react-native-countdown-circle-timer";

export default function CountDownCircle({
  duration,
  currentTime,
  setTimeDisableBtn,
}) {
  const {
    path,
    pathLength,
    stroke,
    strokeDashoffset,
    remainingTime,
    elapsedTime,
    strokeWidth,
    size,
  } = useCountdown({
    isPlaying: true,
    duration: duration,
    colors: "url(#your-unique-id)",
    size: 120,
    initialRemainingTime: currentTime,
    strokeWidth: 5,
    onComplete: () => handleEnd(),
  });

  const handleEnd = () => {
    setTimeDisableBtn(remainingTime);
  };
  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size, position: "relative" }}>
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id="your-unique-id" x1="1" y1="0" x2="0" y2="0">
              <Stop offset="30%" stopColor="#1EBE54" />
              <Stop offset="95%" stopColor="#2797FF" />
            </LinearGradient>
          </Defs>
          <Path
            d={path}
            fill="none"
            stroke="#d9d9d9"
            strokeWidth={strokeWidth}
          />
          {elapsedTime !== duration && (
            <Path
              d={path}
              fill="none"
              stroke={stroke}
              strokeLinecap="butt"
              strokeWidth={strokeWidth}
              strokeDasharray={pathLength}
              strokeDashoffset={strokeDashoffset}
            />
          )}
        </Svg>
        <View style={styles.time}>
          <Text
            style={[styles.spinNum, remainingTime == 0 ? styles.redText : {}]}
          >
            {remainingTime}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Constants.statusBarHeight,
    padding: 8,
  },
  time: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
  },
  redText: {
    color: "#BD3535",
  },
  spinNum: {
    fontSize: 20,
    fontWeight: "700",
  },
});
