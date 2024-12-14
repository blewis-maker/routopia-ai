import { useEffect, useRef, useState } from 'react';
import { Autocomplete } from '@react-google-maps/api';

interface SearchBoxProps {
  onPlaceSelected: (place: google.maps.places.PlaceResult, type: 'destination' | 'waypoint') => void;
}

interface Waypoint {
  location: google.maps.places.PlaceResult;
  stopover: boolean;
}

export const SearchBox = ({ onPlaceSelected }: SearchBoxProps) => {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const handlePlaceSelect = () => {
    const place = autocompleteRef.current?.getPlace();
    if (place && place.geometry) {
      onPlaceSelected(place, 'destination');
      setSearchInput('');
    }
  };

  const handleAddWaypoint = () => {
    const place = autocompleteRef.current?.getPlace();
    if (place && place.geometry) {
      const newWaypoint: Waypoint = {
        location: place,
        stopover: true
      };
      setWaypoints([...waypoints, newWaypoint]);
      onPlaceSelected(place, 'waypoint');
      setSearchInput('');
    }
  };

  const handleRemoveWaypoint = (index: number) => {
    const updatedWaypoints = waypoints.filter((_, i) => i !== index);
    setWaypoints(updatedWaypoints);
  };

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-96 max-w-[90%]">
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Autocomplete
            onLoad={(autocomplete) => {
              autocompleteRef.current = autocomplete;
            }}
            onPlaceChanged={handlePlaceSelect}
            options={{
              componentRestrictions: { country: 'us' },
              types: ['geocode', 'establishment']
            }}
          >
            <input
              type="text"
              placeholder="Search for a location"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </Autocomplete>
          <button
            onClick={handleAddWaypoint}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            title="Add as waypoint"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {waypoints.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Waypoints:</h3>
            <ul className="space-y-2">
              {waypoints.map((waypoint, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded"
                >
                  <span className="text-sm text-gray-600 truncate">
                    {waypoint.location.formatted_address}
                  </span>
                  <button
                    onClick={() => handleRemoveWaypoint(index)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}; 