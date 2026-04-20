import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { CustomerAddressRow, CustomerProfileRow } from '../../types/online';

export function useCustomerData(userId: string | undefined) {
  const [profile, setProfile] = useState<CustomerProfileRow | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddressRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setAddresses([]);
      return;
    }
    setLoading(true);
    const [p, a] = await Promise.all([
      supabase.from('customer_profiles').select('*').eq('id', userId).maybeSingle(),
      supabase
        .from('customer_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false }),
    ]);

    let profileRow = p.data ? (p.data as CustomerProfileRow) : null;
    if (!profileRow) {
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData.user;
      // Phone OTP users expose `phone` at the top level; Google/email users
      // expose display name under `user_metadata.full_name` (or `name`).
      const phone = authUser?.phone ?? null;
      const meta = (authUser?.user_metadata ?? {}) as {
        full_name?: string;
        name?: string;
      };
      const fullName = meta.full_name ?? meta.name ?? null;
      // Only create the row once we have something useful to store, otherwise
      // a completely empty profile is pointless (email sign-ups still land
      // here and can fill in name+phone via the account panel later).
      if (phone || fullName) {
        const now = new Date().toISOString();
        await supabase.from('customer_profiles').upsert(
          {
            id: userId,
            phone,
            full_name: fullName,
            created_at: now,
            updated_at: now,
          },
          { onConflict: 'id' }
        );
        const { data: p2 } = await supabase.from('customer_profiles').select('*').eq('id', userId).maybeSingle();
        profileRow = p2 ? (p2 as CustomerProfileRow) : null;
      }
    }

    setProfile(profileRow);
    setAddresses((a.data as CustomerAddressRow[]) ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveProfile = async (patch: Partial<Pick<CustomerProfileRow, 'full_name' | 'phone'>>) => {
    if (!userId) return;
    const now = new Date().toISOString();
    await supabase.from('customer_profiles').upsert(
      {
        id: userId,
        full_name: patch.full_name ?? profile?.full_name ?? null,
        phone: patch.phone ?? profile?.phone ?? null,
        updated_at: now,
        created_at: profile?.created_at ?? now,
      },
      { onConflict: 'id' }
    );
    await load();
  };

  const saveAddress = async (input: {
    label: string;
    line1: string;
    apartment?: string | null;
    floor?: string | null;
    lat?: number | null;
    lng?: number | null;
    is_default?: boolean;
    id?: string;
  }) => {
    if (!userId) return;
    if (input.is_default) {
      await supabase.from('customer_addresses').update({ is_default: false }).eq('user_id', userId);
    }
    // Normalize empty strings → null so DB stays clean.
    const apartment = input.apartment?.trim() ? input.apartment.trim() : null;
    const floor = input.floor?.trim() ? input.floor.trim() : null;
    if (input.id) {
      await supabase
        .from('customer_addresses')
        .update({
          label: input.label,
          line1: input.line1,
          apartment,
          floor,
          lat: input.lat ?? null,
          lng: input.lng ?? null,
          is_default: input.is_default ?? false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .eq('user_id', userId);
    } else {
      await supabase.from('customer_addresses').insert({
        user_id: userId,
        label: input.label,
        line1: input.line1,
        apartment,
        floor,
        lat: input.lat ?? null,
        lng: input.lng ?? null,
        is_default: input.is_default ?? false,
      });
    }
    await load();
  };

  return { profile, addresses, loading, load, saveProfile, saveAddress };
}
