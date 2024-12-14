export interface Location {
  lat: number;
  lng: number;
}

export const calculateDistance = (point1: Location, point2: Location): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(point2.lat - point1.lat);
  const dLon = toRad(point2.lng - point1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const toRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

export const getBounds = (locations: Location[]): google.maps.LatLngBounds | null => {
  if (!locations.length) return null;
  
  const bounds = new google.maps.LatLngBounds();
  locations.forEach(location => {
    bounds.extend(new google.maps.LatLng(location.lat, location.lng));
  });
  
  return bounds;
};

export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
}; 