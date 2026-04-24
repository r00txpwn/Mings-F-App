import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';
import { loadGoogleMapsScript } from './googleMapsLoader';

/**
 * Baku delivery bounds. Rectangle covering the metro area (approx).
 * SW = south-west corner, NE = north-east corner.
 *
 * Used as a HARD `locationRestriction` on the Places API (New) autocomplete
 * request so suggestions outside Baku are not shown at all — matches the
 * server-side delivery-zone enforcement in `online-order-create`.
 */
const BAKU_BOUNDS: google.maps.LatLngBoundsLiteral = {
  south: 40.32,
  west: 49.78,
  north: 40.5,
  east: 49.98,
};

const SEARCH_DEBOUNCE_MS = 220;

export interface AddressAutocompleteComponent {
  longText: string;
  shortText: string;
  types: string[];
}

export interface AddressAutocompleteResult {
  address: string;
  lat: number;
  lng: number;
  placeId: string | null;
  components: AddressAutocompleteComponent[];
}

export interface AddressAutocompleteProps {
  apiKey: string;
  /** Initial text shown in the input. The parent owns the "current selected address" separately. */
  initialQuery?: string;
  onSelect: (result: AddressAutocompleteResult) => void;
  placeholder?: string;
  disabled?: boolean;
  noResultsLabel?: string;
  searchFailedLabel?: string;
  selectFailedLabel?: string;
  mapsLoadFailedLabel?: string;
  /** Optional CSS class to merge onto the input wrapper (for layout tweaks). */
  className?: string;
}

interface Suggestion {
  key: string;
  mainText: string;
  secondaryText: string;
  prediction: google.maps.places.PlacePrediction;
}

/**
 * Premium address autocomplete for Baku deliveries, built on Places API (New).
 *
 * Why this exists:
 *  - Session tokens (one billable session per selection, not per keystroke).
 *  - Hard-restricts results to Baku via `locationRestriction` + `includedRegionCodes`.
 *  - Captures `formattedAddress`, `location`, and `addressComponents` in a
 *    single `Place.fetchFields()` round-trip, which is included in the session price.
 *  - Emits clean lat/lng so `deliveryZones.findZoneForPoint()` and the future
 *    `sales.delivery_fee` math have precise input.
 */
export function AddressAutocomplete({
  apiKey,
  initialQuery = '',
  onSelect,
  placeholder,
  disabled = false,
  noResultsLabel,
  searchFailedLabel,
  selectFailedLabel,
  mapsLoadFailedLabel,
  className,
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [sdkReady, setSdkReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const tokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const fetchSeqRef = useRef(0);
  const debounceRef = useRef<number | null>(null);
  const suppressNextFetchRef = useRef(false);

  // Precompute the bounds literal object — stable reference, avoids re-alloc.
  const locationRestriction = useMemo<google.maps.LatLngBoundsLiteral>(() => BAKU_BOUNDS, []);

  // 1) Load the Maps SDK once.
  useEffect(() => {
    if (!apiKey?.trim()) {
      setSdkReady(false);
      return;
    }
    let cancelled = false;
    loadGoogleMapsScript(apiKey.trim())
      .then(() => {
        if (!cancelled) {
          setSdkReady(true);
          setLoadError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : (mapsLoadFailedLabel ?? 'Map search unavailable right now.')
          );
          setSdkReady(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey, mapsLoadFailedLabel]);

  const ensureToken = useCallback(() => {
    if (!tokenRef.current && sdkReady) {
      tokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }
    return tokenRef.current;
  }, [sdkReady]);

  const refreshToken = useCallback(() => {
    tokenRef.current = sdkReady ? new google.maps.places.AutocompleteSessionToken() : null;
  }, [sdkReady]);

  // 2) Debounced fetch on query change.
  useEffect(() => {
    if (!sdkReady) return;
    if (suppressNextFetchRef.current) {
      suppressNextFetchRef.current = false;
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    if (debounceRef.current != null) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      void runFetch(trimmed);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current != null) window.clearTimeout(debounceRef.current);
    };
    // runFetch is stable enough — referenced lazily via ref of sdkReady/sessionToken
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sdkReady]);

  const runFetch = async (input: string) => {
    const token = ensureToken();
    if (!token) return;

    const seq = ++fetchSeqRef.current;
    setLoading(true);
    setSearchError(null);

    try {
      const request: google.maps.places.AutocompleteRequest = {
        input,
        includedRegionCodes: ['AZ'],
        locationRestriction,
        language: navigator.language?.slice(0, 2) ?? 'en',
        sessionToken: token,
      };
      const { suggestions: fetched } =
        await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

      if (seq !== fetchSeqRef.current) return; // a newer request superseded us

      const mapped: Suggestion[] = fetched
        .map((s, idx): Suggestion | null => {
          const pp = s.placePrediction;
          if (!pp) return null;
          return {
            key: pp.placeId ?? `${idx}-${pp.text.text}`,
            mainText: pp.mainText?.text ?? pp.text.text,
            secondaryText: pp.secondaryText?.text ?? '',
            prediction: pp,
          };
        })
        .filter((s): s is Suggestion => s !== null);

      setSuggestions(mapped);
      setOpen(true);
      setActiveIdx(mapped.length > 0 ? 0 : -1);
    } catch (err) {
      if (seq !== fetchSeqRef.current) return;
      console.error('[AddressAutocomplete] fetchAutocompleteSuggestions failed:', err);
      setSuggestions([]);
      setOpen(false);
      setSearchError(searchFailedLabel ?? 'Could not search addresses. Please try again.');
    } finally {
      if (seq === fetchSeqRef.current) setLoading(false);
    }
  };

  // 3) Selection handler.
  const handlePick = useCallback(
    async (suggestion: Suggestion) => {
      try {
        setOpen(false);
        setLoading(true);
        const place = suggestion.prediction.toPlace();
        await place.fetchFields({
          fields: ['formattedAddress', 'location', 'addressComponents'],
        });

        const loc = place.location;
        if (!loc) {
          setLoading(false);
          return;
        }
        const lat = loc.lat();
        const lng = loc.lng();
        const address =
          place.formattedAddress ?? `${suggestion.mainText} ${suggestion.secondaryText}`.trim();

        const components: AddressAutocompleteComponent[] = (place.addressComponents ?? []).map(
          (c) => ({
            longText: c.longText ?? '',
            shortText: c.shortText ?? '',
            types: c.types,
          }),
        );

        // Update visible input text, suppress the next fetch so we don't bounce.
        suppressNextFetchRef.current = true;
        setQuery(address);
        setSuggestions([]);

        // Session is now concluded — mint a fresh token for the next search.
        refreshToken();

        onSelect({ address, lat, lng, placeId: place.id ?? null, components });
      } catch (err) {
        console.error('[AddressAutocomplete] Place.fetchFields failed:', err);
        setSearchError(selectFailedLabel ?? 'Could not resolve this address. Try another result.');
      } finally {
        setLoading(false);
      }
    },
    [onSelect, refreshToken, selectFailedLabel],
  );

  // 4) Keyboard nav.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const picked = suggestions[activeIdx];
      if (picked) void handlePick(picked);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // 5) Click-outside to close.
  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (inputRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [open]);

  // Sync external "initialQuery" changes (e.g. parent updates after reverse-geocode).
  useEffect(() => {
    suppressNextFetchRef.current = true;
    setQuery(initialQuery);
  }, [initialQuery]);

  const canSearch = sdkReady && !disabled;

  return (
    <div className={`relative ${className ?? ''}`}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
          aria-hidden
        />
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            // Clearing the input also ends the current session.
            if (e.target.value.trim().length === 0) refreshToken();
          }}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={!canSearch}
          className="w-full rounded-lg border border-white/10 bg-slate-900 py-2 pl-9 pr-9 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cockpit-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls="address-autocomplete-listbox"
          role="combobox"
        />
        {loading ? (
          <Loader2
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-500"
            aria-hidden
          />
        ) : null}
      </div>

      {open && suggestions.length > 0 ? (
        <ul
          ref={listRef}
          id="address-autocomplete-listbox"
          role="listbox"
          className="animate-scaleIn absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-64 origin-top overflow-y-auto rounded-lg border border-white/10 bg-slate-900 text-sm text-slate-200 shadow-xl"
        >
          {suggestions.map((s, idx) => (
            <li
              key={s.key}
              role="option"
              aria-selected={idx === activeIdx}
              onMouseEnter={() => setActiveIdx(idx)}
              onMouseDown={(e) => {
                e.preventDefault();
                void handlePick(s);
              }}
              className={`flex cursor-pointer items-start gap-2 px-3 py-2 ${
                idx === activeIdx ? 'bg-white/5' : 'hover:bg-white/5'
              }`}
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cockpit-500" aria-hidden />
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-100">{s.mainText}</p>
                {s.secondaryText ? (
                  <p className="truncate text-xs text-slate-500">{s.secondaryText}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : open && !loading && query.trim().length >= 2 && !searchError ? (
        <div
          className="animate-scaleIn absolute left-0 right-0 top-[calc(100%+4px)] z-20 origin-top rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs text-slate-500 shadow-xl"
          role="status"
        >
          {noResultsLabel ?? '…'}
        </div>
      ) : null}

      {loadError ? <p className="mt-1 text-xs text-rose-400">{loadError}</p> : null}
      {searchError ? (
        <p className="mt-1 text-xs text-amber-300" role="alert">
          {searchError}
        </p>
      ) : null}
    </div>
  );
}
