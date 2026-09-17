import React, { useState } from 'react';
import { Tag, Plus, Trash2, Edit3, Check, X, Percent, IndianRupee, Sparkles, CheckCircle2 } from 'lucide-react';
import { Coupon } from '../types';

interface CouponManagerProps {
  coupons: Coupon[];
  onUpdateCoupons: (coupons: Coupon[]) => void;
}

export const CouponManager: React.FC<CouponManagerProps> = ({
  coupons = [],
  onUpdateCoupons
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'flat' | 'percentage' | 'free_delivery'>('flat');
  const [discountValue, setDiscountValue] = useState<number>(50);
  const [minOrderValue, setMinOrderValue] = useState<number>(199);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(undefined);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const resetForm = () => {
    setCode('');
    setDescription('');
    setDiscountType('flat');
    setDiscountValue(50);
    setMinOrderValue(199);
    setMaxDiscount(undefined);
    setIsActive(true);
    setError('');
    setIsAdding(false);
    setEditingCouponId(null);
  };

  const handleStartEdit = (c: Coupon) => {
    setEditingCouponId(c.id);
    setCode(c.code);
    setDescription(c.description);
    setDiscountType(c.discountType);
    setDiscountValue(c.discountValue);
    setMinOrderValue(c.minOrderValue);
    setMaxDiscount(c.maxDiscount);
    setIsActive(c.isActive);
    setIsAdding(true);
    setError('');
  };

  const handleToggleActive = (id: string) => {
    const updated = coupons.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c);
    onUpdateCoupons(updated);
    showSuccessToast();
  };

  const handleDelete = (id: string, couponCode: string) => {
    if (confirm(`Are you sure you want to delete coupon "${couponCode}"?`)) {
      const updated = coupons.filter(c => c.id !== id);
      onUpdateCoupons(updated);
      showSuccessToast();
    }
  };

  const showSuccessToast = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSaveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setError('Coupon code is required');
      return;
    }

    if (discountType !== 'free_delivery' && (!discountValue || discountValue <= 0)) {
      setError('Discount value must be greater than 0');
      return;
    }

    // Check duplicate code if adding
    if (!editingCouponId && coupons.some(c => c.code.toUpperCase() === cleanCode)) {
      setError(`Coupon code "${cleanCode}" already exists. Use a unique code.`);
      return;
    }

    let updatedCoupons: Coupon[];
    if (editingCouponId) {
      updatedCoupons = coupons.map(c => {
        if (c.id === editingCouponId) {
          return {
            ...c,
            code: cleanCode,
            description: description.trim() || `${cleanCode} offer`,
            discountType,
            discountValue: discountType === 'free_delivery' ? 0 : Number(discountValue),
            minOrderValue: Number(minOrderValue) || 0,
            maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
            isActive
          };
        }
        return c;
      });
    } else {
      const newCoupon: Coupon = {
        id: 'cpn_' + Date.now(),
        code: cleanCode,
        description: description.trim() || `${cleanCode} offer`,
        discountType,
        discountValue: discountType === 'free_delivery' ? 0 : Number(discountValue),
        minOrderValue: Number(minOrderValue) || 0,
        maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
        isActive
      };
      updatedCoupons = [...coupons, newCoupon];
    }

    onUpdateCoupons(updatedCoupons);
    showSuccessToast();
    resetForm();
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-orange-600" />
            <h2 className="font-display font-extrabold text-lg sm:text-xl text-stone-900">
              Admin Coupons &amp; Offers Manager
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Create and decide coupon codes, discounts, minimum order limits, and active status in real-time.
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => {
              resetForm();
              setIsAdding(true);
            }}
            id="admin-btn-create-coupon"
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Coupon</span>
          </button>
        )}
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Coupon rules saved and active for customers immediately!</span>
        </div>
      )}

      {/* Add / Edit Form Panel */}
      {isAdding && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-orange-400/80 shadow-md animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
            <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span>{editingCouponId ? 'Edit Coupon Offer' : 'Create New Customer Coupon'}</span>
            </h3>
            <button
              onClick={resetForm}
              className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveCoupon} className="space-y-4">
            {error && (
              <div className="p-2.5 bg-red-50 text-red-700 rounded-xl text-xs font-semibold border border-red-200">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Coupon Code */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Coupon Code (e.g. WELCOME50, DIWALI20)
                </label>
                <input
                  type="text"
                  placeholder="CODE50"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full text-xs sm:text-sm font-mono font-bold tracking-wider px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 uppercase"
                  required
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Discount Type
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                >
                  <option value="flat">Flat ₹ (e.g. ₹50 Off)</option>
                  <option value="percentage">Percentage % (e.g. 20% Off)</option>
                  <option value="free_delivery">Free Delivery (100% off delivery fee)</option>
                </select>
              </div>

              {/* Discount Value */}
              {discountType !== 'free_delivery' && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {discountType === 'flat' ? 'Discount Amount (₹)' : 'Discount Percentage (%)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                </div>
              )}

              {/* Min Order Value */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Minimum Order Value (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(Number(e.target.value))}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Max Discount for Percentage */}
              {discountType === 'percentage' && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Maximum Discount Cap (₹) (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 100"
                    value={maxDiscount ?? ''}
                    onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              )}

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Customer Description / Offer Text
                </label>
                <input
                  type="text"
                  placeholder="Flat ₹50 off on your special order above ₹199"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-orange-600 rounded-sm focus:ring-orange-500"
                />
                <span className="text-xs font-bold text-stone-800">
                  Enable coupon immediately for all customers
                </span>
              </label>
            </div>

            {/* Form Actions */}
            <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-100">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="admin-btn-save-coupon"
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm px-5 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{editingCouponId ? 'Update Coupon' : 'Save Coupon'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((c) => (
          <div
            key={c.id}
            className={`bg-white rounded-3xl p-5 border shadow-2xs transition-all relative flex flex-col justify-between ${
              c.isActive ? 'border-orange-200 ring-1 ring-orange-100' : 'border-stone-200 opacity-60 bg-stone-50/70'
            }`}
          >
            <div>
              {/* Top Row: Code & Active Status */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono font-extrabold text-sm sm:text-base tracking-wider bg-orange-50 text-orange-800 px-3 py-1 rounded-xl border border-orange-200 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-orange-600" />
                  {c.code}
                </span>

                <button
                  onClick={() => handleToggleActive(c.id)}
                  className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border transition-colors cursor-pointer ${
                    c.isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-stone-200 text-stone-600 border-stone-300'
                  }`}
                  title="Click to toggle active status"
                >
                  {c.isActive ? '● Active in Cart' : '○ Paused'}
                </button>
              </div>

              {/* Offer Details */}
              <div className="mt-3 space-y-1">
                <div className="text-stone-900 font-bold text-sm">
                  {c.discountType === 'flat' && `Flat ₹${c.discountValue} OFF`}
                  {c.discountType === 'percentage' && `${c.discountValue}% OFF${c.maxDiscount ? ` (Up to ₹${c.maxDiscount})` : ''}`}
                  {c.discountType === 'free_delivery' && 'FREE DELIVERY'}
                </div>
                <p className="text-xs text-stone-500">
                  {c.description}
                </p>
                <div className="text-[11px] text-stone-400 font-medium pt-1">
                  Min order: <strong className="text-stone-700">₹{c.minOrderValue}</strong>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between gap-2">
              <button
                onClick={() => handleToggleActive(c.id)}
                className="text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                {c.isActive ? 'Pause Coupon' : 'Activate Coupon'}
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleStartEdit(c)}
                  className="p-1.5 text-stone-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                  title="Edit coupon details"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(c.id, c.code)}
                  className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete coupon"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {coupons.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200">
          <Tag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="font-bold text-stone-800 text-base">No coupons created yet</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Click &quot;Create New Coupon&quot; to offer discounts like WELCOME50, free delivery, or festive promotional offers to your customers.
          </p>
        </div>
      )}
    </div>
  );
};
