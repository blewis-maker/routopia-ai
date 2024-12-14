import { useState, useCallback, useRef, useEffect } from 'react';
import { LatLngLiteral } from '../types/maps';

interface MapStateHook {
  destination: any | null;
  waypoints: any[];
  directions: any | null;
  setDestination: (place: any) => void;
  addWaypoint: (place: any) => void;
  removeWaypoint: (index: number) => void;
  setDirections: (directions: any) => void;
  clearRoute: () => void;
}

export const useMapState = (): MapStateHook => {
  const [destination, setDestination] = useState<any | null>(null);
  const [waypoints, setWaypoints] = useState<any[]>([]);
  const [directions, setDirections] = useState<any | null>(null);
  const previousDestination = useRef<any>(null);
  const previousWaypoints = useRef<any[]>([]);

  const addWaypoint = useCallback((place: any) => {
    if (!place?.geometry?.location) return;
    
    setWaypoints(prev => {
      // Check if waypoint already exists
      const exists = prev.some(wp => 
        wp.geometry?.location?.lat() === place.geometry.location.lat() &&
        wp.geometry?.location?.lng() === place.geometry.location.lng()
      );
      
      if (exists) return prev;
      return [...prev, place];
    });
  }, []);

  const removeWaypoint = useCallback((index: number) => {
    setWaypoints(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearRoute = useCallback(() => {
    previousDestination.current = null;
    previousWaypoints.current = [];
    setDestination(null);
    setWaypoints([]);
    setDirections(null);
  }, []);

  // Update refs when state changes
  useEffect(() => {
    previousDestination.current = destination;
  }, [destination]);

  useEffect(() => {
    previousWaypoints.current = waypoints;
  }, [waypoints]);

  return {
    destination,
    waypoints,
    directions,
    setDestination: useCallback((place: any) => {
      if (!place?.geometry?.location) return;
      setDestination(place);
    }, []),
    addWaypoint,
    removeWaypoint,
    setDirections,
    clearRoute
  };
}; 