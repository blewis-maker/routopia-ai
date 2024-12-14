import { useCallback, useRef, useState, useEffect } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import { LatLngLiteral } from '@/types/maps';

interface SearchBarProps {
  onRouteSelected: (
    origin: google.maps.places.PlaceResult,
    destination: google.maps.places.PlaceResult,
    waypoints: google.maps.places.PlaceResult[]
  ) => void;
  onOriginSelected?: (place: google.maps.places.PlaceResult) => void;
  onDestinationSelected?: (place: google.maps.places.PlaceResult) => void;
  initialOrigin?: string;
  initialDestination?: string;
  currentLocation?: LatLngLiteral;
  currentLocationAddress?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onRouteSelected,
  onOriginSelected,
  onDestinationSelected,
  initialOrigin = '',
  initialDestination = '',
  currentLocation,
  currentLocationAddress = ''
}) => {
  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDestination);
  const [waypoints, setWaypoints] = useState<google.maps.places.PlaceResult[]>([]);
  const [waypointInput, setWaypointInput] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState<google.maps.places.PlaceResult | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<google.maps.places.PlaceResult | null>(null);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);
  const originAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destinationAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const waypointAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle initial coordinates if provided
    if (initialOrigin && initialOrigin.includes(',')) {
      const [lat, lng] = initialOrigin.split(',').map(coord => parseFloat(coord.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        const originPlace = {
          geometry: {
            location: new google.maps.LatLng(lat, lng)
          },
          formatted_address: initialOrigin,
          name: 'Selected Location',
          place_id: `custom_${lat}_${lng}`
        } as google.maps.places.PlaceResult;
        
        setSelectedOrigin(originPlace);
        console.debug('Initial origin set:', originPlace);
      }
    }

    // Handle initial destination if provided
    if (initialDestination) {
      const destinationPlace = {
        formatted_address: initialDestination,
        name: initialDestination,
        place_id: `custom_destination_${Date.now()}`
      } as google.maps.places.PlaceResult;
      
      setSelectedDestination(destinationPlace);
      console.debug('Initial destination set:', destinationPlace);
    }
  }, [initialOrigin, initialDestination]);

  useEffect(() => {
    // Set current location as origin if available and no initial origin provided
    if (currentLocation && currentLocationAddress && !initialOrigin) {
      setOrigin('Current Location');
      setIsUsingCurrentLocation(true);
      setSelectedOrigin({
        geometry: {
          location: new google.maps.LatLng(currentLocation.lat, currentLocation.lng)
        },
        formatted_address: currentLocationAddress,
        name: 'Current Location',
        place_id: 'current_location'
      } as google.maps.places.PlaceResult);
    }
  }, [currentLocation, currentLocationAddress, initialOrigin]);

  const handleOriginSelect = () => {
    const place = originAutocompleteRef.current?.getPlace();
    if (place?.geometry?.location) {
      setOrigin(place.formatted_address || '');
      setSelectedOrigin(place);
      setIsUsingCurrentLocation(false);
      onOriginSelected?.(place);
      setError(null);
    }
  };

  const handleUseCurrentLocation = () => {
    if (currentLocation && currentLocationAddress) {
      setOrigin('Current Location');
      setIsUsingCurrentLocation(true);
      const currentPlace = {
        geometry: {
          location: new google.maps.LatLng(currentLocation.lat, currentLocation.lng)
        },
        formatted_address: currentLocationAddress,
        name: 'Current Location',
        place_id: 'current_location'
      } as google.maps.places.PlaceResult;
      setSelectedOrigin(currentPlace);
      onOriginSelected?.(currentPlace);
      setError(null);
    }
  };

  const handleDestinationSelect = () => {
    const place = destinationAutocompleteRef.current?.getPlace();
    if (place?.geometry?.location) {
      setDestination(place.formatted_address || '');
      setSelectedDestination(place);
      onDestinationSelected?.(place);
      setError(null);
    }
  };

  const handleWaypointSelect = () => {
    const place = waypointAutocompleteRef.current?.getPlace();
    if (place?.geometry?.location) {
      setWaypoints(prev => [...prev, place]);
      setWaypointInput('');
      setError(null);
    }
  };

  const removeWaypoint = (index: number) => {
    setWaypoints(prev => prev.filter((_, i) => i !== index));
  };

  const handleSearch = useCallback(() => {
    console.debug('Search triggered with:', {
      origin: selectedOrigin,
      destination: selectedDestination,
      isUsingCurrentLocation,
      waypoints
    });

    // If using coordinates, create a place result
    if (origin && origin.includes(',') && !selectedOrigin) {
      const [lat, lng] = origin.split(',').map(coord => parseFloat(coord.trim()));
      if (!isNaN(lat) && !isNaN(lng)) {
        const originPlace = {
          geometry: {
            location: new google.maps.LatLng(lat, lng)
          },
          formatted_address: origin,
          name: 'Selected Location',
          place_id: `custom_${lat}_${lng}`
        } as google.maps.places.PlaceResult;
        
        setSelectedOrigin(originPlace);
      }
    }

    // Handle destination if it's a raw address
    if (destination && !selectedDestination) {
      const destinationPlace = {
        formatted_address: destination,
        name: destination,
        place_id: `custom_destination_${Date.now()}`
      } as google.maps.places.PlaceResult;
      
      setSelectedDestination(destinationPlace);
    }

    if (!selectedOrigin || !selectedDestination) {
      console.warn('Missing origin or destination:', { selectedOrigin, selectedDestination });
      setError('Please select valid origin and destination locations from the dropdown');
      return;
    }

    if ((!isUsingCurrentLocation && !selectedOrigin.geometry?.location) || 
        !selectedDestination.geometry?.location) {
      console.warn('Invalid location data:', { 
        originGeometry: selectedOrigin.geometry?.location,
        destinationGeometry: selectedDestination.geometry?.location
      });
      setError('Invalid location data. Please try selecting locations again.');
      return;
    }

    console.debug('Proceeding with route calculation:', {
      origin: selectedOrigin,
      destination: selectedDestination,
      waypoints
    });

    setError(null);
    onRouteSelected(selectedOrigin, selectedDestination, waypoints);
  }, [selectedOrigin, selectedDestination, waypoints, onRouteSelected, isUsingCurrentLocation, origin, destination]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!selectedOrigin || !selectedDestination) {
        setError('Please select locations from the dropdown suggestions');
        return;
      }
      handleSearch();
    }
  };

  return (
    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10 w-[450px] max-w-[95%]">
      <div className="bg-white rounded-xl shadow-xl p-5">
        {/* Origin Input */}
        <div className="space-y-4">
          <div className="relative">
            <label htmlFor="origin-input" className="sr-only">Starting point</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
              </div>
              <Autocomplete
                onLoad={(autocomplete) => {
                  originAutocompleteRef.current = autocomplete;
                }}
                onPlaceChanged={handleOriginSelect}
                options={{
                  componentRestrictions: { country: 'us' },
                  types: ['geocode', 'establishment']
                }}
              >
                <input
                  id="origin-input"
                  name="origin"
                  type="text"
                  placeholder="Enter starting point"
                  className="w-full pl-8 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-500 shadow-sm"
                  value={origin}
                  onChange={(e) => {
                    setOrigin(e.target.value);
                    if (selectedOrigin) {
                      setSelectedOrigin(null);
                      setIsUsingCurrentLocation(false);
                    }
                  }}
                  onKeyPress={handleKeyPress}
                  aria-label="Starting point"
                  role="combobox"
                  aria-controls="origin-suggestions"
                  aria-expanded="false"
                />
              </Autocomplete>
              {currentLocation && (
                <button
                  onClick={handleUseCurrentLocation}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-600 p-1 rounded-full hover:bg-blue-50 transition-colors"
                  title="Use current location"
                  aria-label="Use current location"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0013 3.06V1h-2v2.06A8.994 8.994 0 003.06 11H1v2h2.06A8.994 8.994 0 0011 20.94V23h2v-2.06A8.994 8.994 0 0020.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Waypoints */}
          {waypoints.length > 0 && (
            <div className="space-y-2">
              {waypoints.map((waypoint, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    </div>
                    <label htmlFor={`waypoint-${index}`} className="sr-only">Waypoint {index + 1}</label>
                    <input
                      id={`waypoint-${index}`}
                      name={`waypoint-${index}`}
                      type="text"
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
                      value={waypoint.formatted_address || ''}
                      disabled
                      aria-label={`Waypoint ${index + 1}`}
                    />
                  </div>
                  <button
                    onClick={() => removeWaypoint(index)}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 transition-colors"
                    title={`Remove waypoint ${index + 1}`}
                    aria-label={`Remove waypoint ${index + 1}`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Waypoint Input */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <div className="h-2 w-2 rounded-full bg-gray-400"></div>
            </div>
            <label htmlFor="waypoint-input" className="sr-only">Add a stop</label>
            <Autocomplete
              onLoad={(autocomplete) => {
                waypointAutocompleteRef.current = autocomplete;
              }}
              onPlaceChanged={handleWaypointSelect}
              options={{
                componentRestrictions: { country: 'us' },
                types: ['geocode', 'establishment']
              }}
            >
              <input
                id="waypoint-input"
                name="waypoint"
                type="text"
                placeholder="Add a stop (optional)"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-500 shadow-sm"
                value={waypointInput}
                onChange={(e) => setWaypointInput(e.target.value)}
                aria-label="Add a stop"
                role="combobox"
                aria-controls="waypoint-suggestions"
                aria-expanded="false"
              />
            </Autocomplete>
          </div>

          {/* Destination Input */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <div className="h-2 w-2 rounded-full bg-red-500"></div>
            </div>
            <label htmlFor="destination-input" className="sr-only">Destination</label>
            <Autocomplete
              onLoad={(autocomplete) => {
                destinationAutocompleteRef.current = autocomplete;
              }}
              onPlaceChanged={handleDestinationSelect}
              options={{
                componentRestrictions: { country: 'us' },
                types: ['geocode', 'establishment']
              }}
            >
              <input
                id="destination-input"
                name="destination"
                type="text"
                placeholder="Enter destination"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-500 shadow-sm"
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  if (selectedDestination) setSelectedDestination(null);
                }}
                onKeyPress={handleKeyPress}
                aria-label="Destination"
                role="combobox"
                aria-controls="destination-suggestions"
                aria-expanded="false"
              />
            </Autocomplete>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Get Directions Button */}
        <button
          onClick={handleSearch}
          className="mt-4 w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 shadow-sm"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span>Get Directions</span>
        </button>
      </div>
    </div>
  );
};

export default SearchBar; 