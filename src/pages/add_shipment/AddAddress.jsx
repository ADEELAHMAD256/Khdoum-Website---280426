import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { getCountryDefaults, getGovernorateCenter } from "../../constants/governorates";

const containerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "18px",
};

export default function MapPicker({ location, setLocation, governorate, countryKey }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const mapRef = useRef(null);
  const hasUserInteractedRef = useRef(false);
  const lastProgrammaticMoveRef = useRef(0);
  const lastGeolocationRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const defaults = getCountryDefaults(countryKey);
  const defaultCenter = defaults?.center;
  const minZoom = defaults?.minZoom ?? 12;
  const governorateCenter = useMemo(
    () => getGovernorateCenter(countryKey, governorate),
    [countryKey, governorate],
  );

  useEffect(() => {
    if (!navigator.geolocation) return;
    let isActive = true;

    const handleSuccess = (position) => {
      if (!isActive) return;
      const lat = position?.coords?.latitude;
      const lng = position?.coords?.longitude;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const next = { lat, lng };
      const prev = lastGeolocationRef.current;
      if (prev && prev.lat === next.lat && prev.lng === next.lng) return;
      lastGeolocationRef.current = next;
      setCurrentLocation(next);
    };

    const watchId = navigator.geolocation.watchPosition(
      handleSuccess,
      () => {
        // Keep last known location on error.
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );

    return () => {
      isActive = false;
      if (typeof watchId === "number") {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // 👇 Pan to governorate when it changes
  useEffect(() => {
    if (governorateCenter && mapRef.current) {
      lastProgrammaticMoveRef.current = Date.now();
      mapRef.current.panTo(governorateCenter);
      const currentZoom = mapRef.current.getZoom?.();
      if (
        typeof minZoom === "number" &&
        (typeof currentZoom !== "number" || currentZoom < minZoom)
      ) {
        mapRef.current.setZoom(minZoom);
      }
    }
  }, [governorateCenter, minZoom]);

  useEffect(() => {
    if (!currentLocation || !mapRef.current) return;
    if (hasUserInteractedRef.current) return;
    if (location) return;
    if (governorateCenter) return;

    lastProgrammaticMoveRef.current = Date.now();
    mapRef.current.panTo(currentLocation);
    const currentZoom = mapRef.current.getZoom?.();
    if (
      typeof currentZoom !== "number" ||
      currentZoom < 15
    ) {
      mapRef.current.setZoom(15);
    }
  }, [currentLocation, governorateCenter, location]);

  const onMapClick = useCallback(
    (e) => {
      const coords = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };
      hasUserInteractedRef.current = true;
      setLocation(coords);
    },
    [setLocation],
  );

  const onLoad = useCallback(
    (map) => {
      mapRef.current = map;
      if (governorateCenter) {
        lastProgrammaticMoveRef.current = Date.now();
        map.panTo(governorateCenter);
        const currentZoom = map.getZoom?.();
        if (
          typeof minZoom === "number" &&
          (typeof currentZoom !== "number" || currentZoom < minZoom)
        ) {
          map.setZoom(minZoom);
        }
      } else if (currentLocation && !location) {
        lastProgrammaticMoveRef.current = Date.now();
        map.panTo(currentLocation);
      }
    },
    [currentLocation, governorateCenter, location, minZoom],
  );

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={location || governorateCenter || defaultCenter}
      zoom={minZoom}
      onClick={onMapClick}
      onLoad={onLoad}
      onDragStart={() => {
        hasUserInteractedRef.current = true;
      }}
      onZoomChanged={() => {
        const now = Date.now();
        if (now - lastProgrammaticMoveRef.current < 400) return;
        hasUserInteractedRef.current = true;
      }}
    >
      {location &&
        typeof location.lat === "number" &&
        typeof location.lng === "number" && <Marker position={location} />}
    </GoogleMap>
  );
}
