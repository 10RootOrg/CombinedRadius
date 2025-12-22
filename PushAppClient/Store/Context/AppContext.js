import React, { createContext, useContext, useState } from "react";
export const AppContext = createContext();

export function useAppContext() {
  return useContext(AppContext);
}

export default function AppContextProvider({ children }) {
  const [modelData, setModelData] = useState();
  const [modelDataTray, setModelDataTray] = useState([]);

  const [phoneRef, setPhoneRef] = useState("Please Wait For The Phone Id");
  const [scanned, setScanned] = useState(false);
  const [NotificationTrayCounter, setNotificationTrayCounter] = useState(0);

  const [valueIP, setValueIP] = useState([]);
  const [qrData, setQRdata] = useState();
  const [requestLog, setRequestLog] = useState([]);
  const [totpNumber, setTotpNumber] = useState("");
  const [country, setCountry] = useState([]);

  return (
    <AppContext.Provider
      value={{
        modelData,
        setModelData,
        country,
        setCountry,
        modelDataTray,
        setModelDataTray,
        phoneRef,
        setPhoneRef,
        scanned,
        setScanned,
        NotificationTrayCounter,
        setNotificationTrayCounter,
        valueIP,
        setValueIP,
        qrData,
        setQRdata,
        requestLog,
        setRequestLog,
        totpNumber,
        setTotpNumber,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

