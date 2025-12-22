// Uses the haversine formula

export default async function RadiusCalc(lat, lon, lat1, lon1, r) {
  const dLat = ((lat - lat1) * Math.PI) / 180;
  const dLon = ((lon - lon1) * Math.PI) / 180;
  const a =
    0.5 -
    Math.cos(dLat) / 2 +
    (Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      (1 - Math.cos(dLon))) /
      2;
  const d = Math.round(6371000 * 2 * Math.asin(Math.sqrt(a)));
  const bol = r - d;
  return bol >= 0 ? true : false;
}
