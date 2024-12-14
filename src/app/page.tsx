'use client';

import MapContainer from '@/components/MapContainer';
import { MapErrorBoundary } from '@/components/map/ErrorBoundary';

export default function Home() {
  return (
    <main className="min-h-screen">
      <MapErrorBoundary>
        <MapContainer />
      </MapErrorBoundary>
    </main>
  );
}
