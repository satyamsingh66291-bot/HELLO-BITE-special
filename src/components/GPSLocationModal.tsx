import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  MapPin,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Store,
  Crosshair,
  X,
} from 'lucide-react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  useMapsLibrary,
  useApiLoadingStatus,
  APILoadingStatus,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  GeoCoordinates,
  GOPALGANJ_COORDS,
  KitchenHubConfig,
  calculateDynamicDeliveryPricing,
  getLocalityFromCoords,
  MAX_DELIVERY_RADIUS_KM,
} from '../utils/geoUtils';
import {
  useGoogleMapsApiKey,
  reverseGeocodeCoords,
  computeRouteDistance,
  isQuotaError,
  dispatchGmpQuotaExceeded,
} from '../utils/mapsClient';
import { DynamicDeliveryFee } from '../types';

interface GPSLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCoords: GeoCoordinates | null;
  currentAddressLabel: string;
  baseDeliveryFee?: number;
  perKmRate?: number;
  kitchenHub?: KitchenHubConfig;
  autoDetectOnOpen?: boolean;
  onLocationDetected?: (coords: GeoCoordinates, addressLabel: string) => void;
  onLocationConfirmed: (data: {
    coords: GeoCoordinates;
    addressLabel: string;
    flatNumber?: string;
    landmark?: string;
    deliveryFee: DynamicDeliveryFee;
  }) => void;
}

interface PlacePredictionLike {
  placeId: string;
  text: { text: string };
  mainText?: { text: string };
  secondaryText?: { text: string };
  toPlace: () => {
    fetchFields: (opts: { fields: string[] }) => Promise<unknown>;
    location?: { lat: () => number; lng: () => number } | null;
    formattedAddress?: string | null;
  };
}

interface PlaceSuggestionItem {
  placeId: string;
  mainText: string;
  secondaryText: string;
  placePrediction: PlacePredictionLike;
}

interface InteractiveMapStageProps {
  selectedCoords: GeoCoordinates;
  kitchenHub: KitchenHubConfig;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onSelectPosition: (coords: GeoCoordinates, label?: string) => void;
  onDetectGps: () => void;
  detectingGps: boolean;
  manualAddress: string;
  onManualAddressChange: (addr: string) => void;
}

const InteractiveMapStage: React.FC<InteractiveMapStageProps> = ({
  selectedCoords,
  kitchenHub,
  searchQuery,
  onSearchQueryChange,
  onSelectPosition,
  onDetectGps,
  detectingGps,
  manualAddress,
  onManualAddressChange,
}) => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const status = useApiLoadingStatus();
  const [suggestions, setSuggestions] = useState<PlaceSuggestionItem[]>([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const sessionTokenRef = useRef<unknown>(null);

  // Recenter map cleanly whenever pinned coordinates update
  useEffect(() => {
    if (map) {
      map.panTo({ lat: selectedCoords.latitude, lng: selectedCoords.longitude });
    }
  }, [map, selectedCoords.latitude, selectedCoords.longitude]);

  // Places Autocomplete (New Places API: AutocompleteSuggestion + AutocompleteSessionToken)
  useEffect(() => {
    if (!placesLib || !searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setSearchingPlaces(true);
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
        }
        const { AutocompleteSuggestion } = placesLib;
        const response = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: searchQuery.trim(),
          sessionToken: sessionTokenRef.current as never,
          includedRegionCodes: ['in'],
          locationBias: {
            center: { lat: kitchenHub.lat, lng: kitchenHub.lng },
            radius: 40000,
          },
        });

        const rawSuggestions = (response.suggestions || []) as Array<{
          placePrediction?: PlacePredictionLike | null;
        }>;
        const mapped: PlaceSuggestionItem[] = rawSuggestions
          .filter((s): s is { placePrediction: PlacePredictionLike } => Boolean(s.placePrediction))
          .slice(0, 5)
          .map((s) => {
            const pred = s.placePrediction;
            return {
              placeId: pred.placeId,
              mainText: pred.mainText?.text || pred.text.text,
              secondaryText: pred.secondaryText?.text || '',
              placePrediction: pred,
            };
          });
        setSuggestions(mapped);
      } catch (err) {
        if (isQuotaError(err)) {
          dispatchGmpQuotaExceeded();
        }
        setSuggestions([]);
      } finally {
        setSearchingPlaces(false);
      }
    }, 280);

    return () => window.clearTimeout(timer);
  }, [placesLib, searchQuery, kitchenHub.lat, kitchenHub.lng]);

  const handleChooseSuggestion = async (item: PlaceSuggestionItem) => {
    try {
      const place = item.placePrediction.toPlace();
      await place.fetchFields({
        fields: ['location', 'formattedAddress', 'displayName'],
      });
      sessionTokenRef.current = null;
      const loc = place.location;
      if (loc) {
        const lat = loc.lat();
        const lng = loc.lng();
        const label =
          place.formattedAddress ||
          [item.mainText, item.secondaryText].filter(Boolean).join(', ');
        setSuggestions([]);
        onSearchQueryChange('');
        onSelectPosition({ latitude: lat, longitude: lng }, label);
      }
    } catch (err) {
      if (isQuotaError(err)) {
        dispatchGmpQuotaExceeded();
      }
    }
  };

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="space-y-3">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">
                Google Map Tiles Unavailable
              </strong>
              <span className="text-[11px] text-amber-800">
                Live GPS detection and road-distance pricing remain active below.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onDetectGps}
            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-950 font-bold text-xs shrink-0 cursor-pointer"
          >
            Use GPS
          </button>
        </div>

        <div className="bg-white border border-[#F5E6D3] rounded-2xl p-3.5">
          <label className="block text-[11px] font-bold text-[#7C4A22] uppercase mb-1.5">
            Delivery Street / Locality Address
          </label>
          <input
            type="text"
            value={manualAddress}
            onChange={(e) => onManualAddressChange(e.target.value)}
            placeholder="Enter full street, mohalla, or area"
            className="w-full min-h-[44px] bg-[#FFF8F0] border border-orange-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#3D1C0A] focus:outline-none focus:border-[#FF6B00]"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Places Autocomplete Search Bar */}
      <div className="relative z-20">
        <Search className="w-4 h-4 text-[#FF6B00] absolute left-3.5 top-3.5 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="Search street, market, or landmark on Google Maps..."
          id="gps-places-search-input"
          className="w-full min-h-[46px] bg-white border border-orange-200 rounded-2xl pl-10 pr-10 py-2.5 text-xs sm:text-sm font-semibold text-[#3D1C0A] placeholder:text-[#7C4A22]/60 shadow-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6B00] transition-all"
        />
        {searchingPlaces ? (
          <RefreshCw className="w-4 h-4 text-[#FF6B00] animate-spin absolute right-3.5 top-3.5" />
        ) : (
          searchQuery && (
            <button
              type="button"
              onClick={() => {
                onSearchQueryChange('');
                setSuggestions([]);
              }}
              aria-label="Clear search"
              className="absolute right-2.5 top-2.5 p-1 text-stone-400 hover:text-[#3D1C0A] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )
        )}

        {suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-orange-200 shadow-xl z-30 divide-y divide-[#F5E6D3] overflow-hidden">
            {suggestions.map((item) => (
              <button
                key={item.placeId}
                type="button"
                onClick={() => handleChooseSuggestion(item)}
                className="w-full min-h-[48px] px-4 py-2.5 text-left hover:bg-[#FFF8F0] flex items-start gap-2.5 transition-colors cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-[#FF6B00] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-[#3D1C0A] truncate">
                    {item.mainText}
                  </div>
                  {item.secondaryText && (
                    <div className="text-[11px] text-[#7C4A22] truncate">
                      {item.secondaryText}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Explicit-Height Full-Screen Google Map Canvas */}
      <div className="relative h-[42vh] min-h-[300px] sm:h-[46vh] w-full rounded-3xl overflow-hidden border border-orange-200 shadow-sm bg-[#F9EFE6]">
        {status === APILoadingStatus.LOADING || status === APILoadingStatus.NOT_LOADED ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#FFF8F0] text-[#7C4A22] gap-2 z-10">
            <RefreshCw className="w-6 h-6 text-[#FF6B00] animate-spin" />
            <span className="text-xs font-bold">Loading Google Maps...</span>
          </div>
        ) : null}

        <GoogleMap
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          defaultCenter={{ lat: selectedCoords.latitude, lng: selectedCoords.longitude }}
          defaultZoom={14}
          gestureHandling="greedy"
          disableDefaultUI={true}
          zoomControl={true}
          onClick={(ev) => {
            const ll = ev.detail.latLng;
            if (ll) {
              onSelectPosition({ latitude: ll.lat, longitude: ll.lng });
            }
          }}
        >
          {/* Kitchen Hub Origin Pin */}
          <AdvancedMarker
            position={{ lat: kitchenHub.lat, lng: kitchenHub.lng }}
            title={kitchenHub.name || 'Hello Bite Kitchen Hub'}
          >
            <Pin background="#3D1C0A" borderColor="#FFFFFF" glyphColor="#FF6B00">
              <Store className="w-3.5 h-3.5" />
            </Pin>
          </AdvancedMarker>

          {/* Draggable Customer Delivery Pin */}
          <AdvancedMarker
            position={{ lat: selectedCoords.latitude, lng: selectedCoords.longitude }}
            draggable={true}
            title="Delivery Pin (Drag or tap map to adjust)"
            onDragEnd={(ev) => {
              const ll = ev.latLng;
              if (ll) {
                onSelectPosition({ latitude: ll.lat(), longitude: ll.lng() });
              }
            }}
          >
            <Pin background="#FF6B00" borderColor="#FFFFFF" glyphColor="#FFFFFF" scale={1.2} />
          </AdvancedMarker>
        </GoogleMap>

        {/* Floating Quick Recenter GPS Button */}
        <button
          type="button"
          onClick={onDetectGps}
          disabled={detectingGps}
          id="map-floating-gps-btn"
          title="Detect my current GPS location"
          className="min-h-[44px] absolute bottom-3 left-3 bg-white hover:bg-orange-50 text-[#3D1C0A] text-xs font-extrabold px-3.5 py-2 rounded-2xl shadow-lg border border-orange-200 flex items-center gap-1.5 cursor-pointer"
        >
          <Crosshair className={`w-4 h-4 text-[#FF6B00] ${detectingGps ? 'animate-spin' : ''}`} />
          <span>{detectingGps ? 'Locating...' : 'My GPS'}</span>
        </button>

        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-[11px] font-bold text-[#3D1C0A] px-3 py-1 rounded-xl border border-orange-100 shadow-xs pointer-events-none">
          Tap map or drag orange pin
        </div>
      </div>
    </div>
  );
};

export const GPSLocationModal: React.FC<GPSLocationModalProps> = ({
  isOpen,
  onClose,
  currentCoords,
  currentAddressLabel,
  baseDeliveryFee = 20,
  perKmRate = 8,
  kitchenHub = GOPALGANJ_COORDS,
  autoDetectOnOpen = false,
  onLocationDetected,
  onLocationConfirmed,
}) => {
  const { apiKey, loading: apiKeyLoading } = useGoogleMapsApiKey();
  const [loading, setLoading] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<GeoCoordinates>(
    currentCoords || { latitude: kitchenHub.lat, longitude: kitchenHub.lng }
  );
  const [roadDistanceKm, setRoadDistanceKm] = useState<number | null>(null);
  const [flatNumber, setFlatNumber] = useState('');
  const [landmark, setLandmark] = useState('');
  const [manualAddress, setManualAddress] = useState(currentAddressLabel);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const resolveCoordsMetadata = useCallback(
    async (coords: GeoCoordinates, explicitLabel?: string) => {
      setResolvingAddress(true);
      const fallbackLoc = getLocalityFromCoords(coords);
      if (explicitLabel) {
        setManualAddress(explicitLabel);
      } else {
        setManualAddress(fallbackLoc.fullLabel);
      }

      const [formattedAddr, routeInfo] = await Promise.all([
        explicitLabel ? Promise.resolve(explicitLabel) : reverseGeocodeCoords(coords.latitude, coords.longitude),
        computeRouteDistance(
          { lat: kitchenHub.lat, lng: kitchenHub.lng },
          { lat: coords.latitude, lng: coords.longitude }
        ),
      ]);

      if (formattedAddr) {
        setManualAddress(formattedAddr);
      }
      if (routeInfo && routeInfo.distanceKm >= 0) {
        setRoadDistanceKm(routeInfo.distanceKm);
      } else {
        setRoadDistanceKm(null);
      }
      setResolvingAddress(false);
    },
    [kitchenHub.lat, kitchenHub.lng]
  );

  const handleSelectPosition = useCallback(
    (coords: GeoCoordinates, label?: string) => {
      setSelectedCoords(coords);
      setError(null);
      void resolveCoordsMetadata(coords, label);
    },
    [resolveCoordsMetadata]
  );

  const handleDetectGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser/device.');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: GeoCoordinates = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setSelectedCoords(coords);
        setLoading(false);
        void resolveCoordsMetadata(coords).then(() => {
          const loc = getLocalityFromCoords(coords);
          onLocationDetected?.(coords, loc.fullLabel);
        });
      },
      (err) => {
        setLoading(false);
        if (err.code === 1) {
          setError(
            'GPS permission was denied. Allow location access in your browser or search/tap the map.'
          );
        } else if (err.code === 2) {
          setError('Position unavailable. Please ensure device GPS is enabled.');
        } else {
          setError('GPS timed out. Tap anywhere on the map or enter your street address below.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [onLocationDetected, resolveCoordsMetadata]);

  useEffect(() => {
    if (isOpen) {
      const initCoords = currentCoords || {
        latitude: kitchenHub.lat,
        longitude: kitchenHub.lng,
      };
      setSelectedCoords(initCoords);
      setManualAddress(currentAddressLabel);
      setRoadDistanceKm(null);
      setSearchQuery('');
      setError(null);
      if (autoDetectOnOpen) {
        handleDetectGPS();
      } else {
        void computeRouteDistance(
          { lat: kitchenHub.lat, lng: kitchenHub.lng },
          { lat: initCoords.latitude, lng: initCoords.longitude }
        ).then((route) => {
          if (route) setRoadDistanceKm(route.distanceKm);
        });
      }
    }
  }, [isOpen, autoDetectOnOpen]);

  if (!isOpen) return null;

  const currentPricing = calculateDynamicDeliveryPricing(
    selectedCoords,
    baseDeliveryFee,
    perKmRate,
    kitchenHub,
    roadDistanceKm
  );
  const currentLocality = getLocalityFromCoords(selectedCoords);

  const handleConfirmLocation = () => {
    if (!currentPricing.isServiceable) {
      setError(
        `Your location is ~${currentPricing.distanceKm} km from ${currentPricing.nearestHubName}. Hello Bite delivers within ${MAX_DELIVERY_RADIUS_KM} km.`
      );
      return;
    }

    const deliveryFeeObj: DynamicDeliveryFee = {
      baseFee: currentPricing.baseFee,
      perKmRate: currentPricing.perKmRate,
      distanceKm: currentPricing.distanceKm,
      calculatedFee: currentPricing.calculatedFee,
      nearestHubName: currentPricing.nearestHubName,
      nearestDistrict: currentPricing.nearestDistrict,
      isServiceable: currentPricing.isServiceable,
      estimatedMinutes: currentPricing.estimatedMinutes,
    };

    const finalAddress = [
      flatNumber.trim() ? `Flat/House: ${flatNumber.trim()}` : '',
      landmark.trim() ? `Landmark: ${landmark.trim()}` : '',
      manualAddress.trim() || currentLocality.fullLabel,
    ]
      .filter(Boolean)
      .join(', ');

    onLocationConfirmed({
      coords: selectedCoords,
      addressLabel: finalAddress,
      flatNumber: flatNumber.trim(),
      landmark: landmark.trim(),
      deliveryFee: deliveryFeeObj,
    });

    onClose();
  };

  return (
    <div
      id="delivery-location-fullscreen-view"
      className="fixed inset-0 z-50 w-full h-full bg-[#FFF8F0] flex flex-col animate-in fade-in duration-150"
    >
      {/* Sticky Full-Screen Top Header */}
      <header className="h-14 shrink-0 bg-white/95 backdrop-blur-md border-b border-[#F5E6D3] px-3 sm:px-6 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onClose}
          id="gps-location-back-btn"
          className="min-h-[44px] min-w-[44px] -ml-1 px-2 rounded-xl hover:bg-orange-50 text-[#3D1C0A] flex items-center gap-1.5 font-bold text-sm cursor-pointer transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5 text-[#FF6B00]" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <h2 className="font-display font-black text-base sm:text-lg text-[#3D1C0A] tracking-tight truncate">
          Pin Delivery Location
        </h2>

        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={loading}
          id="btn-detect-gps-location"
          className="min-h-[40px] px-3 py-1.5 rounded-xl bg-linear-to-r from-[#FF6B00] to-[#F59E0B] hover:brightness-105 text-white font-extrabold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
        >
          {loading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5 fill-white" />
          )}
          <span>{loading ? 'Locating' : 'Detect GPS'}</span>
        </button>
      </header>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3.5 rounded-2xl border border-red-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Interactive Google Map Stage or Loading State */}
          {apiKeyLoading ? (
            <div className="h-[42vh] min-h-[300px] sm:h-[46vh] w-full rounded-3xl border border-[#F5E6D3] bg-white flex flex-col items-center justify-center gap-2.5 text-[#7C4A22]">
              <RefreshCw className="w-6 h-6 text-[#FF6B00] animate-spin" />
              <span className="text-xs font-bold">Connecting to Google Maps...</span>
            </div>
          ) : apiKey ? (
            <APIProvider apiKey={apiKey} language="en" region="IN">
              <InteractiveMapStage
                selectedCoords={selectedCoords}
                kitchenHub={kitchenHub}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                onSelectPosition={handleSelectPosition}
                onDetectGps={handleDetectGPS}
                detectingGps={loading}
                manualAddress={manualAddress}
                onManualAddressChange={setManualAddress}
              />
            </APIProvider>
          ) : (
            <div className="bg-white border border-[#F5E6D3] rounded-3xl p-4 text-xs text-[#3D1C0A] space-y-2">
              <label className="block text-[11px] font-bold text-[#7C4A22] uppercase">
                Street / Area Address
              </label>
              <input
                type="text"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                placeholder="Enter street address or tap Detect GPS"
                className="w-full min-h-[44px] bg-[#FFF8F0] border border-orange-200 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#3D1C0A] focus:outline-none focus:border-[#FF6B00]"
              />
            </div>
          )}

          {/* Active Coordinates & Live Per-KM Fee Breakdown */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#F5E6D3] shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {currentPricing.isServiceable
                    ? 'Serviceable Kitchen Route'
                    : 'Outside Delivery Radius'}
                </span>
                <h4 className="font-display font-black text-[#3D1C0A] text-sm sm:text-base mt-1 break-words">
                  {resolvingAddress
                    ? 'Resolving street address...'
                    : manualAddress || currentLocality.fullLabel}
                </h4>
                <p className="text-xs text-[#7C4A22] mt-0.5">
                  Kitchen Hub: <strong className="text-[#3D1C0A]">{currentPricing.nearestHubName}</strong>
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-extrabold text-[#FF6B00] bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-xl tabular-nums inline-block">
                  {currentPricing.distanceKm} km {roadDistanceKm !== null ? 'road' : ''}
                </span>
                <p className="text-[11px] text-[#7C4A22] font-semibold mt-1">
                  ETA: {currentPricing.estimatedMinutes}
                </p>
              </div>
            </div>

            <div className="pt-2.5 border-t border-[#F5E6D3] flex items-center justify-between gap-2 text-xs sm:text-sm">
              <span className="text-[#7C4A22] font-semibold">Per-KM Delivery Charge:</span>
              <span className="font-black text-[#3D1C0A] text-base tabular-nums text-right">
                ₹{currentPricing.calculatedFee}{' '}
                <span className="text-[11px] font-medium text-[#7C4A22] block sm:inline">
                  ({currentPricing.displayBreakdown})
                </span>
              </span>
            </div>
          </div>

          {/* Flat / Landmark Details */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#F5E6D3] shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-extrabold text-[#7C4A22] uppercase mb-1.5">
                Flat / House No. / Floor
              </label>
              <input
                type="text"
                placeholder="e.g. House 42, 2nd Floor"
                value={flatNumber}
                onChange={(e) => setFlatNumber(e.target.value)}
                className="w-full min-h-[44px] bg-[#FFF8F0] border border-[#F5E6D3] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#3D1C0A] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6B00] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-[#7C4A22] uppercase mb-1.5">
                Nearby Landmark
              </label>
              <input
                type="text"
                placeholder="e.g. Near Bus Stand"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="w-full min-h-[44px] bg-[#FFF8F0] border border-[#F5E6D3] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#3D1C0A] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6B00] focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Full-Width Confirm Footer */}
      <div className="shrink-0 bg-white border-t border-[#F5E6D3] px-4 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
        <div className="max-w-3xl mx-auto">
          <button
            type="button"
            onClick={handleConfirmLocation}
            id="btn-confirm-gps-location"
            className="w-full min-h-[48px] bg-linear-to-r from-[#FF6B00] to-[#F59E0B] hover:brightness-105 text-white font-black text-sm sm:text-base py-3.5 px-5 rounded-2xl shadow-lg shadow-orange-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Confirm &amp; Set Delivery Location · ₹{currentPricing.calculatedFee}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
