import React, { useState, useEffect } from 'react';
import { X, Save, Image, Tag, Clock, IndianRupee } from 'lucide-react';
import { Dish, DishCategory } from '../types';

interface DishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dish: Dish) => void;
  dishToEdit?: Dish | null;
}

const CATEGORIES: DishCategory[] = [
  'Fast Food',
  'North Indian',
  'Snacks',
  'Beverages',
  'Sweets',
  'Tiffin Special'
];

export const DishModal: React.FC<DishModalProps> = ({
  isOpen,
  onClose,
  onSave,
  dishToEdit
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number>(149);
  const [originalPrice, setOriginalPrice] = useState<number | undefined>(199);
  const [category, setCategory] = useState<DishCategory>('Fast Food');
  const [image, setImage] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [preparationTime, setPreparationTime] = useState('15-20 mins');
  const [badge, setBadge] = useState('');

  useEffect(() => {
    if (dishToEdit) {
      setName(dishToEdit.name);
      setDescription(dishToEdit.description);
      setPrice(dishToEdit.price);
      setOriginalPrice(dishToEdit.originalPrice);
      setCategory(dishToEdit.category);
      setImage(dishToEdit.image);
      setIsVeg(dishToEdit.isVeg);
      setIsAvailable(dishToEdit.isAvailable);
      setPreparationTime(dishToEdit.preparationTime);
      setBadge(dishToEdit.badge || '');
    } else {
      setName('');
      setDescription('');
      setPrice(149);
      setOriginalPrice(199);
      setCategory('Fast Food');
      setImage('https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80');
      setIsVeg(true);
      setIsAvailable(true);
      setPreparationTime('15-20 mins');
      setBadge('');
    }
  }, [dishToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price <= 0) return;

    const dishPayload: Dish = {
      id: dishToEdit ? dishToEdit.id : 'dish_' + Date.now(),
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      category,
      image: image.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      isVeg,
      isAvailable,
      preparationTime: preparationTime.trim() || '15 mins',
      badge: badge.trim() || undefined,
      rating: dishToEdit ? dishToEdit.rating : 4.8,
      ratingCount: dishToEdit ? dishToEdit.ratingCount : 1,
    };

    onSave(dishPayload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 my-4">
        {/* Header */}
        <div className="bg-stone-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <h2 className="font-display font-extrabold text-lg text-white">
            {dishToEdit ? 'Edit Menu Item' : 'Add New Delicious Dish'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-3.5 max-h-[80vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Dish / Item Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Paneer Butter Masala"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-stone-300 focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Category & Veg Toggle */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DishCategory)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300 bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Dietary Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsVeg(true)}
                  className={`flex-1 text-xs py-2 rounded-xl font-bold border transition-colors ${
                    isVeg ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'border-stone-200 text-stone-500'
                  }`}
                >
                  🟢 Veg
                </button>
                <button
                  type="button"
                  onClick={() => setIsVeg(false)}
                  className={`flex-1 text-xs py-2 rounded-xl font-bold border transition-colors ${
                    !isVeg ? 'bg-red-50 border-red-500 text-red-800' : 'border-stone-200 text-stone-500'
                  }`}
                >
                  🔴 Non-Veg
                </button>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Selling Price (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-stone-400 text-xs">₹</span>
                <input
                  type="number"
                  required
                  min={1}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full text-xs pl-7 pr-3 py-2 rounded-xl border border-stone-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Original Price (₹) (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-stone-400 text-xs">₹</span>
                <input
                  type="number"
                  value={originalPrice || ''}
                  onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full text-xs pl-7 pr-3 py-2 rounded-xl border border-stone-300"
                />
              </div>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Food Image URL
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-300"
            />
          </div>

          {/* Prep Time & Badge */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Prep Time
              </label>
              <input
                type="text"
                placeholder="15-20 mins"
                value={preparationTime}
                onChange={(e) => setPreparationTime(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Highlight Badge
              </label>
              <input
                type="text"
                placeholder="Bestseller / Chef Choice"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-stone-300"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Short Description & Ingredients
            </label>
            <textarea
              rows={2}
              placeholder="Describe flavors, spices, and sides included..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-stone-300"
            />
          </div>

          {/* Availability Switch */}
          <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
            <div>
              <span className="text-xs font-bold text-stone-800">In-Stock Availability</span>
              <p className="text-[11px] text-stone-500">Enable or disable ordering for today</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAvailable(!isAvailable)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                isAvailable ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
              }`}
            >
              {isAvailable ? 'In Stock' : 'Out of Stock'}
            </button>
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-5 py-2 text-xs rounded-xl flex items-center gap-1.5 shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Save Dish</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
