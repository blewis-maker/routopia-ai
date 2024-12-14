# Routopia AI

A modern route planning application built with Next.js and Google Maps API.

## Features

- Real-time location tracking
- Route planning with waypoints
- Location sharing functionality
- Address reverse geocoding
- Location accuracy indicator
- Modern, responsive UI

## Tech Stack

- Next.js 13+
- TypeScript
- Google Maps API
- Tailwind CSS

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/blewis-maker/routopia-ai.git
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory and add your Google Maps API key:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
  components/
    map/
      ErrorBoundary.tsx
      LocationDetails.tsx
      SearchBox.tsx
      ShareLocation.tsx
    MapContainer.tsx
  hooks/
    useLocation.ts
    useMapRefs.ts
    useMapState.ts
  types/
    maps.ts
  utils/
    mapHelpers.ts
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
