import { useRef, useCallback, useEffect } from 'react';
import { LatLngLiteral } from '../types/maps';

interface MapRefs {
  mapRef: React.RefObject<google.maps.Map | null>;
  directionsServiceRef: React.RefObject<google.maps.DirectionsService | null>;
  onLoad: (map: google.maps.Map) => void;
  onUnmount: () => void;
  panTo: (position: LatLngLiteral) => void;
}

export const useMapRefs = (): MapRefs => {
  const mapRef = useRef<google.maps.Map | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const isInitialized = useRef(false);

  const onLoad = useCallback((map: google.maps.Map) => {
    if (!isInitialized.current) {
      mapRef.current = map;
      if (window.google) {
        directionsServiceRef.current = new window.google.maps.DirectionsService();
      }
      isInitialized.current = true;
    }
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
    directionsServiceRef.current = null;
    isInitialized.current = false;
  }, []);

  const panTo = useCallback((position: LatLngLiteral) => {
    if (mapRef.current && position) {
      mapRef.current.panTo(position);
    }
  }, []);

  useEffect(() => {
    return () => {
      onUnmount();
    };
  }, [onUnmount]);

  return {
    mapRef,
    directionsServiceRef,
    onLoad,
    onUnmount,
    panTo
  };
}; 