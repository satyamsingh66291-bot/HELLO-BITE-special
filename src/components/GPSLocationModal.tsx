import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  MapPin,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Store,
  Crosshair,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
}

const InteractiveMapStage: React.FC<InteractiveMapStageProps> = ({
  selectedCoords,
  kitchenHub,
  searchQuery,
  onSearchQueryChange,
  onSelectPosition,
  onDetectGps,
  detectingGps,
}) => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const status = useApiLoadingStatus();
  const [suggestions, setSuggestions] = useState<PlaceSuggestionItem[]>([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const sessionTokenRef = useRef<unknown>(null);

  // Recenter map smoothly when coordinates change
  useEffect(() => {
    if (map) {
      map.panTo({ lat: selectedCoords.latitude, lng: selectedCoords.longitude });
    }
  }, [map, selectedCoords.latitude, selectedCoords.longitude]);

  // Places Autocomplete (New API: AutocompleteSuggestion + AutocompleteSessionToken)
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
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-bold">
            Interactive Map Preview Temporarily Unavailable
          </strong>
          <span className="text-[11px] text-amber-800">
            GPS detection and live per-km distance pricing remain active below.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {/* Places Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#FF6B00] absolute left-3.5 top-3 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="Search street, market, or landmark on Google Maps..."
          id="gps-places-search-input"
          className="w-full bg-stone-50 border border-orange-200 rounded-2xl pl-10 pr-9 py-2.5 text-xs font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#FF6B00] focus:bg-white transition-all"
        />
        {searchingPlaces && (
          <RefreshCw className="w-3.5 h-3.5 text-[#FF6B00] animate-spin absolute right-3 top-3" />
        )}

        {suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-2xl border border-orange-200 shadow-xl z-30 divide-y divide-stone-100 overflow-hidden">
            {suggestions.map((item) => (
              <button
                key={item.placeId}
                type="button"
                onClick={() => handleChooseSuggestion(item)}
                className="w-full px-3.5 py-2.5 text-left hover:bg-orange-50 flex items-start gap-2.5 transition-colors cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-[#FF6B00] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-stone-900 truncate">
                    {item.mainText}
                  </div>
                  {item.secondaryText && (
                    <div className="text-[10px] text-stone-500 truncate">
                      {item.secondaryText}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Google Map Canvas */}
      <div className="relative h-56 sm:h-64 w-full rounded-2xl overflow-hidden border border-orange-200 shadow-sm bg-stone-100">
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
          {/* Kitchen Hub Marker */}
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
            title="Delivery Pin (Drag to adjust)"
            onDragEnd={(ev) => {
              const ll = ev.latLng;
              if (ll) {
                onSelectPosition({ latitude: ll.lat(), longitude: ll.lng() });
              }
            }}
          >
            <Pin background="#FF6B00" borderColor="#FFFFFF" glyphColor="#FFFFFF" scale={1.15} />
          </AdvancedMarker>
        </GoogleMap>

        {/* Floating Quick Recenter GPS Button */}
        <button
          type="button"
          onClick={onDetectGps}
          disabled={detectingGps}
          title="Use my live GPS position"
          className="absolute bottom-3 left-3 bg-white hover:bg-orange-50 text-[#3D1C0A] text-[11px] font-extrabold px-2.5 py-1.5 rounded-xl shadow-md border border-orange-200 flex items-center gap-1.5 cursor-pointer"
        >
          <Crosshair className={`w-3.5 h-3.5 text-[#FF6B00] ${detectingGps ? 'animate-spin' : ''}`} />
          <span>My GPS</span>
        </button>

        <div className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-xs text-[10px] font-bold text-[#3D1C0A] px-2.5 py-1 rounded-lg border border-orange-100 shadow-xs pointer-events-none">
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
  const { apiKey } = useGoogleMapsApiKey();
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ y: '100%', opacity: 0.9 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.9 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border-t sm:border border-stone-200 max-h-[94vh] flex flex-col pb-[env(safe-area-inset-bottom,0px)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Handle */}
            <div className="sm:hidden flex justify-center pt-2.5 pb-1 bg-stone-50">
              <div className="w-10 h-1 rounded-full bg-stone-300" />
            </div>

            {/* Header */}
            <div className="px-5 py-3.5 sm:p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-orange-100 text-orange-600 rounded-2xl">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-stone-900">
                    Pin Delivery Location
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Google Maps GPS &amp; live per-km kitchen distance fee
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-xl transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              {/* Primary Action: Detect Current GPS */}
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={loading}
                id="btn-detect-gps-location"
                className="w-full bg-linear-to-r from-[#FF6B00] to-[#F59E0B] hover:brightness-105 active:scale-[0.98] text-white font-bold text-sm py-3 px-4 rounded-2xl shadow-md shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Detecting current GPS location...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4 fill-white" />
                    <span>Detect Current Location (GPS)</span>
                  </>
                )}
              </button>

              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-2xl border border-red-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Interactive Google Map when API key is configured */}
              {apiKey ? (
                <APIProvider apiKey={apiKey} language="en" region="IN">
                  <InteractiveMapStage
                    selectedCoords={selectedCoords}
                    kitchenHub={kitchenHub}
                    searchQuery={searchQuery}
                    onSearchQueryChange={setSearchQuery}
                    onSelectPosition={handleSelectPosition}
                    onDetectGps={handleDetectGPS}
                    detectingGps={loading}
                  />
                </APIProvider>
              ) : (
                <div className="bg-orange-50/60 border border-orange-200 rounded-2xl p-3.5 text-xs text-stone-700">
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Street / Area Address
                  </label>
                  <input
                    type="text"
                    value={manualAddress}
                    onChange={(e) => setManualAddress(e.target.value)}
                    placeholder="Enter street address or tap Detect Current Location"
                    className="w-full bg-white border border-orange-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#FF6B00]"
                  />
                </div>
              )}

              {/* Active Coordinates & Dynamic Per-KM Fee Breakdown */}
              <div className="bg-orange-50/70 rounded-2xl p-4 border border-orange-200 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {currentPricing.isServiceable
                        ? 'Serviceable Kitchen Route'
                        : 'Outside Delivery Radius'}
                    </span>
                    <h4 className="font-bold text-stone-900 text-xs sm:text-sm mt-0.5 break-words">
                      {resolvingAddress
                        ? 'Resolving street address...'
                        : manualAddress || currentLocality.fullLabel}
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Kitchen: <strong>{currentPricing.nearestHubName}</strong>
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-lg tabular-nums">
                      {currentPricing.distanceKm} km {roadDistanceKm !== null ? 'road' : ''}
                    </span>
                    <p className="text-[10px] text-stone-500 mt-1">
                      ETA: {currentPricing.estimatedMinutes}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-orange-200/80 flex items-center justify-between gap-2 text-xs">
                  <span className="text-stone-600">Delivery Charge:</span>
                  <span className="font-extrabold text-stone-900 text-sm tabular-nums text-right">
                    ₹{currentPricing.calculatedFee}{' '}
                    <span className="text-[10px] font-normal text-stone-500 block sm:inline">
                      ({currentPricing.displayBreakdown})
                    </span>
                  </span>
                </div>
              </div>

              {/* Flat / Landmark Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Flat / House No. / Floor
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. House 42, 2nd Floor"
                    value={flatNumber}
                    onChange={(e) => setFlatNumber(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                    Nearby Landmark
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Near Bus Stand"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Confirm Button */}
              <button
                type="button"
                onClick={handleConfirmLocation}
                id="btn-confirm-gps-location"
                className="w-full bg-stone-900 hover:bg-[#FF6B00] text-white font-bold text-sm py-3.5 rounded-2xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm &amp; Set Delivery Location</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
