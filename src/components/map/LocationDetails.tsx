import { useEffect, useState } from 'react';
import { LatLngLiteral } from '../../types/maps';

interface LocationDetailsProps {
  position: LatLngLiteral;
  accuracy?: number;
}

const LocationDetails: React.FC<LocationDetailsProps> = ({ position, accuracy }) => {
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window.google) {
      const geocoder = new window.google.maps.Geocoder();
      
      geocoder.geocode(
        { location: position },
        (results: any, status: any) => {
          if (status === 'OK' && results?.[0]) {
            setAddress(results[0].formatted_address);
          } else {
            setAddress('Address not found');
          }
          setLoading(false);
        }
      );
    }
  }, [position]);

  const getAccuracyColor = (accuracy?: number) => {
    if (!accuracy) return 'bg-gray-500';
    if (accuracy <= 20) return 'bg-green-500';
    if (accuracy <= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatAccuracy = (accuracy?: number) => {
    if (!accuracy) return 'Unknown';
    return `±${Math.round(accuracy)}m`;
  };

  return (
    <div className="absolute left-4 bottom-20 bg-white rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-center space-x-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${getAccuracyColor(accuracy)}`} />
        <span className="text-sm text-gray-600">
          Accuracy: {formatAccuracy(accuracy)}
        </span>
      </div>
      <div className="text-sm">
        {loading ? (
          <div className="animate-pulse bg-gray-200 h-4 w-48 rounded" />
        ) : (
          <p className="text-gray-700">{address}</p>
        )}
      </div>
    </div>
  );
};

export default LocationDetails; 