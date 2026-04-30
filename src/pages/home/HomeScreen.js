import { useCallback, useMemo, useState, useEffect, useRef } from "react";

let googleMapsPromise = null;

export function loadGoogleMaps(apiKey) {
  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      if (window.google?.maps) {
        resolve(window.google.maps);
        return;
      }
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.maps) resolve(window.google.maps);
        else reject("Maps failed");
      };
      script.onerror = () => reject("Maps script failed");
      document.head.appendChild(script);
    });
  }
  return googleMapsPromise;
}

function toFiniteNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function normalizeLatLng(location) {
  if (!location || typeof location !== "object") return null;
  const lat = toFiniteNumber(location.lat ?? location.latitude);
  const lng = toFiniteNumber(location.lng ?? location.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function getShipmentKey(shipment) {
  if (!shipment) return null;
  return shipment._id || shipment.id || shipment.trackingId || shipment.shipmentId || null;
}

function getPickupPos(shipment) {
  if (!shipment) return null;
  // Support both normalized and raw structures
  const loc = shipment.pickup?.latitude ? shipment.pickup : (shipment.pickUpDetails?.location || shipment.location);
  return normalizeLatLng(loc);
}

function getDropoffPos(shipment) {
  if (!shipment) return null;
  const loc = shipment.dropoff?.latitude ? shipment.dropoff : (shipment.dropOffDetails?.location || shipment.location);
  return normalizeLatLng(loc);
}

function getCourierPos(shipment) {
  if (!shipment) return null;
  const loc = shipment.courier?.latitude ? shipment.courier : (shipment.courier?.currentLocation?.location);
  return normalizeLatLng(loc);
}

function getAnyShipmentPos(shipment) {
  return getCourierPos(shipment) || getPickupPos(shipment) || getDropoffPos(shipment) || null;
}

function getBoundsZoomLevel(bounds, mapWidth, mapHeight, padding) {
  const WORLD_DIM = { height: 256, width: 256 };
  const ZOOM_MAX = 21;

  function latRad(lat) {
    const sin = Math.sin((lat * Math.PI) / 180);
    const radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
    return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
  }

  function zoom(mapPx, worldPx, fraction) {
    return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
  }

  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();

  const latFraction = (latRad(ne.lat()) - latRad(sw.lat())) / Math.PI;

  const lngDiff = ne.lng() - sw.lng();
  const lngFraction = (lngDiff < 0 ? lngDiff + 360 : lngDiff) / 360;

  // Account for padding
  const effectiveWidth = Math.max(1, mapWidth - (padding?.left || 0) - (padding?.right || 0));
  const effectiveHeight = Math.max(1, mapHeight - (padding?.top || 0) - (padding?.bottom || 0));

  const latZoom = zoom(effectiveHeight, WORLD_DIM.height, latFraction);
  const lngZoom = zoom(effectiveWidth, WORLD_DIM.width, lngFraction);

  return Math.min(latZoom, lngZoom, ZOOM_MAX);
}

export function useHomeScreenLogic({
  mapRef,
  courierIcon,
  pickupIcon,
  dropoffIcon,
  addressDetailsLocation,
  shipments,
  followUserLocation,
  onUserMapInteraction,
}) {
  const [explicitSelectedId, setExplicitSelectedId] = useState(null);
  const [mode, setMode] = useState("newShipment");
  const [isMapReady, setIsMapReady] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [draftPickupLocation, setDraftPickupLocation] = useState(null);
  const [draftDropoffLocation, setDraftDropoffLocation] = useState(null);
  const [isMapSettling, setIsMapSettling] = useState(false);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const lastGeolocationRef = useRef(null);
  const lastViewKeyRef = useRef("");
  const lastInteractionTimeRef = useRef(0);

  const items = useMemo(() => (Array.isArray(shipments) ? shipments : []), [shipments]);

  const selectedId = useMemo(() => {
    if (explicitSelectedId) {
      if (typeof explicitSelectedId === "string" && explicitSelectedId.startsWith("bulk-")) {
        return explicitSelectedId;
      }
      const exists = items.some((shipment) => getShipmentKey(shipment) === explicitSelectedId);
      if (exists) return explicitSelectedId;
    }
    return getShipmentKey(items[0]) || null;
  }, [explicitSelectedId, items]);

  const setSelectedId = setExplicitSelectedId;

  const selectedShipment = items.find((shipment) => getShipmentKey(shipment) === selectedId);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
  }, []);

  const createOrUpdateMap = useCallback((center, zoom, skipMove = false) => {
    if (!mapRef.current) return null;
    let map = mapInstanceRef.current;
    if (!map) {
      map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        disableDefaultUI: true,
      });
      mapInstanceRef.current = map;
      return map;
    }
    if (!skipMove) {
      map.setCenter(center);
      map.setZoom(zoom);
    }
    map.setOptions({ disableDefaultUI: true });
    return map;
  }, [mapRef]);

  const animateMapTo = useCallback(
    (location, { minZoom } = {}) => {
      const center = normalizeLatLng(location);
      if (!center) return;
      if (!isMapReady || !mapRef.current) return;

      const map =
        mapInstanceRef.current ||
        createOrUpdateMap(center, typeof minZoom === "number" ? minZoom : 13);
      if (!map) return;

      if (typeof minZoom === "number") {
        const currentZoom = map.getZoom?.();
        if (typeof currentZoom !== "number" || currentZoom < minZoom) {
          map.setZoom(minZoom);
        }
      }

      if (typeof map.panTo === "function") {
        map.panTo(center);
      } else {
        map.setCenter(center);
      }
    },
    [createOrUpdateMap, isMapReady, mapRef],
  );

  useEffect(() => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!key) return;

    loadGoogleMaps(key)
      .then(() => setIsMapReady(true))
      .catch(console.error);
  }, []);

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

  useEffect(() => {
    const isShipmentMode = mode === "shipment" || mode === "shipmentDetails";
    const isNewShipmentMode =
      mode === "newShipment" ||
      mode === "pickupDetails" ||
      mode === "dropoffDetails" ||
      mode === "paymentDetails";

    if (!isShipmentMode && !isNewShipmentMode) return;
    if (!isMapReady || !mapRef.current) return;

    // --- VIEW KEY LOGIC ---
    // Decouple camera resets from coordinate updates in draft mode.
    // The camera only resets when the MODE changes or a NEW shipment is selected.
    const viewKey = JSON.stringify({
      mode,
      selectedId: getShipmentKey(selectedShipment),
      // Remove hasPickup/hasDropoff from viewKey to prevent camera resets
      // when coordinates are updated during panning.
      currentLoc: (!selectedShipment && !draftPickupLocation && !draftDropoffLocation) ? currentLocation : null
    });

    const isFirstView = lastViewKeyRef.current !== viewKey;
    lastViewKeyRef.current = viewKey;

    if (isNewShipmentMode) {
      const lastCenter = mapInstanceRef.current?.getCenter?.();
      const lastCenterValue = lastCenter
        ? { lat: lastCenter.lat(), lng: lastCenter.lng() }
        : null;

      const modeSpecificCenter =
        mode === "pickupDetails"
          ? normalizeLatLng(draftPickupLocation)
          : mode === "dropoffDetails"
            ? normalizeLatLng(draftDropoffLocation)
            : null;

      const preferCurrent = Boolean(followUserLocation && currentLocation);
      const fallbackCenter =
        modeSpecificCenter ||
        (preferCurrent
          ? currentLocation
          : lastCenterValue ||
            getAnyShipmentPos(selectedShipment) ||
            currentLocation || { lat: 0, lng: 0 });
      const zoom = preferCurrent
        ? 15
        : mapInstanceRef.current?.getZoom?.() || 13;

      // SKIP MOVE if it's not a fresh view (e.g., just updating a marker coordinate)
      const map = createOrUpdateMap(fallbackCenter, zoom, !isFirstView);
      if (!map) return;
      clearMarkers();

      markersRef.current = [];
      return;
    }

    if (!selectedShipment) return;

    const courierPos = getCourierPos(selectedShipment);
    const pickupPos = getPickupPos(selectedShipment);
    const dropoffPos = getDropoffPos(selectedShipment);

    const points = [pickupPos, dropoffPos, courierPos].filter(Boolean);
    if (points.length === 0) {
      const lastCenter = mapInstanceRef.current?.getCenter?.();
      const lastCenterValue = lastCenter
        ? { lat: lastCenter.lat(), lng: lastCenter.lng() }
        : null;
      const fallbackCenter =
        (followUserLocation && currentLocation) ||
        lastCenterValue ||
        currentLocation ||
        { lat: 0, lng: 0 };
      const map = createOrUpdateMap(
        fallbackCenter,
        followUserLocation && currentLocation ? 15 : 3,
      );
      if (!map) return;
      clearMarkers();
      return;
    }

    const isMobile = window.innerWidth <= 767;
    const mapWidth = mapRef.current?.clientWidth || 0;
    const mapHeight = mapRef.current?.clientHeight || 0;
    const overlayWidth = mode === "shipmentDetails" ? 480 : 460;
    const leftPadding =
      isMobile && mode === "shipmentDetails"
        ? 20
        : mapWidth
          ? Math.min(overlayWidth, Math.round(mapWidth * 0.6))
          : overlayWidth;
    const padding =
      isMobile && mode === "shipmentDetails"
        ? { top: 30, right: 30, bottom: 30, left: 30 }
        : { top: 130, right: 80, bottom: 80, left: leftPadding };

    const tripPoints = [pickupPos, dropoffPos].filter(Boolean);
    const boundsPoints =
      mode === "shipmentDetails" && tripPoints.length > 0 ? tripPoints : points;

    const bounds = new window.google.maps.LatLngBounds();
    boundsPoints.forEach((point) => bounds.extend(point));

    if (isFirstView) {
      setIsMapSettling(true);
      let finalCenter = points.reduce(
        (acc, point) => ({ lat: acc.lat + point.lat, lng: acc.lng + point.lng }),
        { lat: 0, lng: 0 },
      );
      finalCenter.lat /= points.length;
      finalCenter.lng /= points.length;

      let finalZoom = isMobile && mode === "shipmentDetails" ? 16 : 13;

      if (mode === "shipmentDetails" && boundsPoints.length > 0) {
        finalCenter = bounds.getCenter();
        const calculatedZoom = getBoundsZoomLevel(
          bounds,
          mapWidth,
          mapHeight,
          padding,
        );
        const maxZoomLimit = isMobile ? 18 : 17;
        finalZoom = Math.min(calculatedZoom, maxZoomLimit);
      }

      const map = createOrUpdateMap(finalCenter, finalZoom);
      if (!map) {
        setIsMapSettling(false);
        return;
      }

      const applyBounds = () => {
        if (!mapInstanceRef.current || !mapRef.current) return;
        const map = mapInstanceRef.current;
        window.google.maps.event.trigger(map, "resize");

        const maxZoomLimit = isMobile && mode === "shipmentDetails" ? 18 : 17;

        if (isMobile && mode === "shipmentDetails") {
          window.google.maps.event.addListenerOnce(map, "idle", () => {
            setIsMapSettling(false);
          });
        } else {
          map.setOptions({ maxZoom: maxZoomLimit });
          map.fitBounds(bounds, padding);
          window.google.maps.event.addListenerOnce(map, "idle", () => {
            map.setOptions({ maxZoom: 21 });
            setIsMapSettling(false);
          });
        }
      };

      if (isMobile && mode === "shipmentDetails") {
        setTimeout(applyBounds, 100);
      } else {
        applyBounds();
      }
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    clearMarkers();
    const nextMarkers = [];

    if (courierPos) {
      nextMarkers.push(
        new window.google.maps.Marker({
          position: courierPos,
          map,
          icon: {
            url: courierIcon,
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 40),
          },
        }),
      );
    }

    if (pickupPos) {
      nextMarkers.push(
        new window.google.maps.Marker({
          position: pickupPos,
          map,
          icon: {
            url: pickupIcon,
            scaledSize: new window.google.maps.Size(30, 40),
            anchor: new window.google.maps.Point(15, 40),
          },
        }),
      );
    }

    if (dropoffPos) {
      nextMarkers.push(
        new window.google.maps.Marker({
          position: dropoffPos,
          map,
          icon: {
            url: dropoffIcon,
            scaledSize: new window.google.maps.Size(30, 40),
            anchor: new window.google.maps.Point(15, 40),
          },
        }),
      );
    }

    markersRef.current = nextMarkers;
  }, [
    clearMarkers,
    courierIcon,
    currentLocation,
    createOrUpdateMap,
    dropoffIcon,
    draftDropoffLocation,
    draftPickupLocation,
    followUserLocation,
    isMapReady,
    mapRef,
    mode,
    pickupIcon,
    selectedShipment,
  ]);

  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;
    const el = mapRef.current;
    const handleInteraction = () => {
      lastInteractionTimeRef.current = Date.now();
      onUserMapInteraction?.();
    };

    el.addEventListener("wheel", handleInteraction, { passive: true });
    el.addEventListener("mousedown", handleInteraction);
    el.addEventListener("touchstart", handleInteraction, { passive: true });

    return () => {
      el.removeEventListener("wheel", handleInteraction);
      el.removeEventListener("mousedown", handleInteraction);
      el.removeEventListener("touchstart", handleInteraction);
    };
  }, [isMapReady, mapRef, onUserMapInteraction]);

  useEffect(() => {
    if (!isMapReady || !mapRef.current) return;
    const map = mapInstanceRef.current;
    if (!map?.addListener) return;

    if (mode === "pickupDetails" || mode === "dropoffDetails") {
      const listener = map.addListener("idle", () => {
        const center = map.getCenter().toJSON();
        if (mode === "pickupDetails") {
          setDraftPickupLocation(center);
        } else {
          setDraftDropoffLocation(center);
        }
        lastInteractionTimeRef.current = Date.now();
        onUserMapInteraction?.();
      });
      return () => {
        if (listener?.remove) listener.remove();
      };
    }

    const listener = map.addListener("click", (event) => {
      const lat = event?.latLng?.lat?.();
      const lng = event?.latLng?.lng?.();
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const coords = { lat, lng };

      if (mode === "pickupDetails") {
        setDraftPickupLocation(coords);
      } else if (mode === "dropoffDetails") {
        setDraftDropoffLocation(coords);
      }

      lastInteractionTimeRef.current = Date.now();
      onUserMapInteraction?.();
    });

    return () => {
      if (listener?.remove) listener.remove();
    };
  }, [isMapReady, mapRef, mode, onUserMapInteraction]);

  const clearDraftLocations = useCallback(() => {
    setDraftPickupLocation(null);
    setDraftDropoffLocation(null);
  }, []);

  useEffect(() => {
    if (mode !== "addressBook") {
      // Don't reset lastViewKeyRef here as it's shared with shipment mode
      return;
    }
    if (!isMapReady || !mapRef.current) return;

    const viewKey = "addr-" + JSON.stringify({
      mode,
      follow: followUserLocation,
      current: followUserLocation ? currentLocation : null,
    });
    const isFirstView = lastViewKeyRef.current !== viewKey;
    lastViewKeyRef.current = viewKey;

    const lastCenter = mapInstanceRef.current?.getCenter?.();
    const fallbackCenter = lastCenter
      ? { lat: lastCenter.lat(), lng: lastCenter.lng() }
      : getAnyShipmentPos(selectedShipment) || { lat: 0, lng: 0 };

    const center =
      followUserLocation && currentLocation ? currentLocation : fallbackCenter;

    // Use skipMove=true if it is not a fresh mode entry or location follow update
    const map = createOrUpdateMap(
      center,
      followUserLocation && currentLocation ? 15 : 13,
      !isFirstView,
    );
    if (!map) return;
    clearMarkers();

    if (currentLocation) {
      const locationMarker = new window.google.maps.Marker({
        position: currentLocation,
        map,
        title: "Current Location",
      });
      markersRef.current = [locationMarker];
    }
  }, [
    clearMarkers,
    createOrUpdateMap,
    currentLocation,
    followUserLocation,
    isMapReady,
    mapRef,
    mode,
    selectedShipment,
  ]);

  useEffect(() => {
    if (!followUserLocation || !currentLocation) return;

    const hasAddressTarget =
      mode === "addressDetails" && Boolean(normalizeLatLng(addressDetailsLocation));
    if (hasAddressTarget) return;

    const hasShipmentTarget =
      (mode === "shipment" || mode === "shipmentDetails") &&
      !isMapSettling &&
      Boolean(
        getCourierPos(selectedShipment) ||
        getPickupPos(selectedShipment) ||
        getDropoffPos(selectedShipment),
      );
    if (hasShipmentTarget) return;

    const isDraftFlow =
      mode === "newShipment" ||
      mode === "pickupDetails" ||
      mode === "dropoffDetails" ||
      mode === "paymentDetails";
    if (isDraftFlow && (draftPickupLocation || draftDropoffLocation)) return;

    animateMapTo(currentLocation, { minZoom: 15 });
  }, [
    addressDetailsLocation,
    animateMapTo,
    currentLocation,
    draftDropoffLocation,
    draftPickupLocation,
    followUserLocation,
    mode,
    selectedShipment,
  ]);

  useEffect(() => {
    if (mode !== "addressDetails") return;
    if (!isMapReady || !mapRef.current) return;

    clearMarkers();

    if (!addressDetailsLocation) return;

    const map = createOrUpdateMap(addressDetailsLocation, 16);
    if (!map) return;

    const marker = new window.google.maps.Marker({
      position: addressDetailsLocation,
      map,
      title: "Address Location",
    });
    markersRef.current = [marker];

    map.panBy(140, 0);
  }, [
    addressDetailsLocation,
    clearMarkers,
    createOrUpdateMap,
    isMapReady,
    mapRef,
    mode,
  ]);

  return {
    selectedId,
    setSelectedId,
    selectedShipment,
    mode,
    setMode,
    isMapReady,
    animateMapTo,
    currentLocation,
    draftPickupLocation,
    setDraftPickupLocation,
    draftDropoffLocation,
    setDraftDropoffLocation,
    clearDraftLocations,
  };
}
