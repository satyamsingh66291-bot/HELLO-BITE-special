import React, { useState, useEffect } from 'react';
import {
  X,
  Car,
  Bike,
  MapPin,
  Navigation,
  CheckCircle2,
  ArrowRight,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppUser, RideBooking } from '../types';
import { storeService } from '../services/storeService';

interface RideBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  pickupLabel: string;
  onRequireAuth: () => void;
}

const VEHICLE_OPTIONS: Array<{
  type: RideBooking['vehicleType'];
  baseFare: number;
  perKm: number;
  eta: string;
  desc: string;
}> = [
  {
    type: 'Bike Taxi',
    baseFare: 15,
    perKm: 7,
    eta: '3 min',
    desc: 'Fastest solo commute in town',
  },
  {
    type: 'Auto',
    baseFare: 25,
    perKm: 11,
    eta: '5 min',
    desc: 'Up to 3 passengers · Spacious',
  },
  {
    type: 'Mini Cab',
    baseFare: 60,
    perKm: 16,
    eta: '7 min',
    desc: 'AC Hatchback · Comfort ride',
  },
];

const DROP_PRESETS = [
  { label: 'Gopalganj Railway Station', km: 2.8 },
  { label: 'Thawe Junction & Mandir', km: 6.4 },
  { label: 'Siwan Bus Stand & Hospital', km: 5.2 },
  { label: 'Banjari More, Gopalganj', km: 2.1 },
];

export const RideBookingModal: React.FC<RideBookingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  pickupLabel,
  onRequireAuth,
}) => {
  const [pickup, setPickup] = useState(pickupLabel);
  const [drop, setDrop] = useState('');
  const [distanceKm, setDistanceKm] = useState(3.2);
  const [selectedVehicle, setSelectedVehicle] =
    useState<RideBooking['vehicleType']>('Bike Taxi');
  const [rides, setRides] = useState<RideBooking[]>(() => storeService.getRides());
  const [bookedRide, setBookedRide] = useState<RideBooking | null>(null);

  useEffect(() => {
    setPickup(pickupLabel);
  }, [pickupLabel]);

  useEffect(() => {
    const unsub = storeService.subscribeRides((r) => setRides(r));
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const activeVehicleConfig =
    VEHICLE_OPTIONS.find((v) => v.type === selectedVehicle) || VEHICLE_OPTIONS[0];
  const estimatedFare = Math.round(
    activeVehicleConfig.baseFare + distanceKm * activeVehicleConfig.perKm
  );

  const handleBookRide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onClose();
      onRequireAuth();
      return;
    }
    if (!drop.trim()) return;

    const ride = storeService.saveRideBooking({
      userId: currentUser.id,
      customerName: currentUser.name,
      customerPhone: currentUser.phoneNumber,
      vehicleType: selectedVehicle,
      pickup: pickup.trim() || pickupLabel,
      drop: drop.trim(),
      distanceKm,
      fare: estimatedFare,
    });
    setBookedRide(ride);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-stone-950/65 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-linear-to-b from-[#FFF8F0] to-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-orange-200"
          >
            {/* Header */}
            <div className="bg-linear-to-r from-[#FF6B00] to-[#F59E0B] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-base leading-tight">
                    Hello Bite Rides
                  </h3>
                  <p className="text-[11px] text-orange-100 font-medium">
                    Instant Bike, Auto &amp; Cab in Gopalganj &amp; Siwan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {bookedRide ? (
                <div className="bg-white rounded-3xl p-5 border border-emerald-200 text-center space-y-3 shadow-sm">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      {bookedRide.rideNumber} · {bookedRide.status}
                    </span>
                    <h4 className="font-display font-black text-lg text-[#3D1C0A] mt-2">
                      Looking for Nearby {bookedRide.vehicleType}
                    </h4>
                    <p className="text-xs text-stone-500 mt-1">
                      Pickup: <strong>{bookedRide.pickup}</strong> → Drop:{' '}
                      <strong>{bookedRide.drop}</strong>
                    </p>
                  </div>
                  <div className="bg-[#FFF8F0] rounded-2xl p-3 flex items-center justify-between text-xs border border-orange-100">
                    <span className="font-bold text-stone-600">
                      Estimated Cash / UPI Fare ({bookedRide.distanceKm} km)
                    </span>
                    <span className="font-black text-lg text-[#FF6B00]">
                      ₹{bookedRide.fare}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBookedRide(null)}
                    className="w-full bg-[#FF6B00] text-white font-black text-xs py-3 rounded-xl cursor-pointer"
                  >
                    Book Another Ride
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBookRide} className="space-y-3.5">
                  <div className="bg-white rounded-2xl p-3.5 border border-orange-100 space-y-2.5 shadow-xs">
                    <div>
                      <label className="text-[10px] font-black uppercase text-emerald-700 flex items-center gap-1 mb-1">
                        <Navigation className="w-3 h-3" /> Pickup Point
                      </label>
                      <input
                        type="text"
                        value={pickup}
                        onChange={(e) => setPickup(e.target.value)}
                        required
                        className="w-full bg-[#FFF8F0] border border-orange-200 rounded-xl px-3 py-2 text-xs font-bold text-[#3D1C0A] focus:outline-none focus:border-[#FF6B00]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-[#FF6B00] flex items-center gap-1 mb-1">
                        <MapPin className="w-3 h-3" /> Drop Destination *
                      </label>
                      <input
                        type="text"
                        value={drop}
                        onChange={(e) => setDrop(e.target.value)}
                        placeholder="Enter destination in Gopalganj or Siwan..."
                        required
                        className="w-full bg-[#FFF8F0] border border-orange-200 rounded-xl px-3 py-2 text-xs font-bold text-[#3D1C0A] focus:outline-none focus:border-[#FF6B00]"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {DROP_PRESETS.map((p) => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => {
                            setDrop(p.label);
                            setDistanceKm(p.km);
                          }}
                          className="text-[10px] font-bold bg-orange-50 hover:bg-orange-100 text-[#3D1C0A] px-2 py-1 rounded-lg border border-orange-200 cursor-pointer"
                        >
                          {p.label} ({p.km} km)
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vehicle Selector */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-black uppercase text-[#3D1C0A]">
                      Select Ride Type
                    </div>
                    {VEHICLE_OPTIONS.map((v) => {
                      const fare = Math.round(v.baseFare + distanceKm * v.perKm);
                      const active = selectedVehicle === v.type;
                      return (
                        <button
                          key={v.type}
                          type="button"
                          onClick={() => setSelectedVehicle(v.type)}
                          className={`w-full text-left p-3 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                            active
                              ? 'bg-orange-50 border-[#FF6B00]'
                              : 'bg-white border-orange-100 hover:border-orange-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                active
                                  ? 'bg-[#FF6B00] text-white'
                                  : 'bg-orange-100 text-[#FF6B00]'
                              }`}
                            >
                              {v.type === 'Bike Taxi' ? (
                                <Bike className="w-5 h-5" />
                              ) : (
                                <Car className="w-5 h-5" />
                              )}
                            </div>
                            <div>
                              <div className="font-extrabold text-xs text-[#3D1C0A]">
                                {v.type}{' '}
                                <span className="text-[10px] font-bold text-emerald-700 ml-1">
                                  · {v.eta} away
                                </span>
                              </div>
                              <div className="text-[11px] text-stone-500">
                                {v.desc}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-black text-sm text-[#3D1C0A]">
                              ₹{fare}
                            </div>
                            <div className="text-[10px] text-stone-400">
                              ~{distanceKm} km
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-linear-to-r from-[#FF6B00] to-[#F59E0B] text-white font-black text-sm py-3.5 rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>
                      {currentUser
                        ? `Book ${selectedVehicle} · ₹${estimatedFare}`
                        : `Sign In to Book ${selectedVehicle}`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Recent Rides */}
              {rides.length > 0 && (
                <div className="pt-2 border-t border-orange-100 space-y-2">
                  <div className="text-[10px] font-black uppercase text-stone-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Recent Ride Requests
                  </div>
                  {rides.slice(0, 2).map((r) => (
                    <div
                      key={r.id}
                      className="bg-white rounded-xl p-2.5 border border-orange-100 flex items-center justify-between text-xs"
                    >
                      <div className="truncate max-w-[70%]">
                        <span className="font-extrabold text-[#3D1C0A]">
                          {r.vehicleType}
                        </span>{' '}
                        <span className="text-stone-500">→ {r.drop}</span>
                      </div>
                      <span className="font-black text-[#FF6B00]">₹{r.fare}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Hello Bite Drivers · Cash &amp; UPI Accepted</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
