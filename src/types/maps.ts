export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export interface MarkerIcon {
  path: string;
  scale: number;
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeWeight: number;
}

export interface MapState {
  center: LatLngLiteral;
  userLocation: LatLngLiteral | null;
  error: string | null;
  isLoading: boolean;
  destination: any | null; // Will be google.maps.places.PlaceResult when API is loaded
  waypoints: any[]; // Will be google.maps.places.PlaceResult[] when API is loaded
  directions: any | null; // Will be google.maps.DirectionsResult when API is loaded
  accuracy: number | null;
  currentAddress: string;
} 