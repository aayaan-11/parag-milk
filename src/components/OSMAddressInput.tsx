import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X } from 'lucide-react';

export interface OSMAddress {
  fullAddress: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface OSMAddressInputProps {
  id?: string;
  placeholder?: string;
  initialValue?: string;
  onSelectAddress: (address: OSMAddress) => void;
  className?: string;
}

export const OSMAddressInput: React.FC<OSMAddressInputProps> = ({
  id = 'osm-address',
  placeholder = 'Search for address (e.g. Hazratganj, Lucknow)...',
  initialValue = '',
  onSelectAddress,
  className = ''
}) => {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAddress = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
          searchQuery
        )}&limit=5`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ParagMilk-Distribution-Agent'
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data || []);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setIsLoading(true);
    timerRef.current = setTimeout(() => {
      searchAddress(value);
    }, 600);
  };

  const handleSelectSuggestion = (item: any) => {
    const displayName = item.display_name || '';
    const details = item.address || {};
    
    const city = details.city || details.town || details.village || details.suburb || details.county || details.city_district || '';
    const state = details.state || details.region || '';
    const postcode = details.postcode || '';
    const country = details.country || '';
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);

    setQuery(displayName);
    setIsOpen(false);
    setSuggestions([]);

    onSelectAddress({
      fullAddress: displayName,
      city,
      state,
      postcode,
      country,
      latitude: lat,
      longitude: lon
    });
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-400 dark:text-neutral-500" />
        <input
          type="text"
          id={id}
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full bg-neutral-50 dark:bg-neutral-950 text-xs pl-10 pr-10 py-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-hidden focus:border-blue-500 transition-all font-medium"
        />
        {isLoading ? (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-300 dark:text-neutral-600" />
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl divide-y divide-neutral-100 dark:divide-neutral-800/50">
          {suggestions.map((item, index) => (
            <button
              key={item.place_id || index}
              type="button"
              onClick={() => handleSelectSuggestion(item)}
              className="w-full text-left px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-xs text-neutral-700 dark:text-neutral-300 flex gap-2.5 transition-all items-start cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-semibold line-clamp-2 leading-relaxed">{item.display_name}</span>
                {item.address && (
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                    {[item.address.city || item.address.town, item.address.state, item.address.postcode, item.address.country].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
