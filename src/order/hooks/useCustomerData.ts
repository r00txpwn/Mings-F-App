import { useState, useEffect, useCallback } from 'react';
import { normalizePhoneE164 } from '../../lib/phoneE164';
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
    try {
      const [p, a] = await Promise.all([
        supabase.from('customer_profiles').select('*').eq('id', userId).maybeSingle(),
        supabase
          .from('customer_addresses')
          .select('*')
          .eq('user_id', userId)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false }),
      ]);
      if (p.error) throw new Error(p.error.message);
      if (a.error) throw new Error(a.error.message);

      let profileRow = p.data ? (p.data as CustomerProfileRow) : null;
      if (!profileRow) {
        const { data: authData } = await supabase.auth.getUser();
        const authUser = authData.user;
        const rawPhone = authUser?.phone ?? null;
        const phone = rawPhone ? normalizePhoneE164(rawPhone) : null;
        const meta = (authUser?.user_metadata ?? {}) as {
          full_name?: string;
          name?: string;
        };
        const fullName = meta.full_name ?? meta.name ?? null;
        if (phone || fullName) {
          const now = new Date().toISOString();
          const upsert = await supabase.from('customer_profiles').upsert(
            {
              id: userId,
              phone,
              full_name: fullName,
              created_at: now,
              updated_at: now,
            },
            { onConflict: 'id' }
          );
          if (upsert.error) throw new Error(upsert.error.message);
          const p2 = await supabase.from('customer_profiles').select('*').eq('id', userId).maybeSingle();
          if (p2.error) throw new Error(p2.error.message);
          profileRow = p2.data ? (p2.data as CustomerProfileRow) : null;
        }
      }

      if (profileRow) {
        const p = profileRow as CustomerProfileRow;
        setProfile({
          ...p,
          phone: p.phone ? normalizePhoneE164(String(p.phone)) : null,
        });
      } else {
        setProfile(null);
      }
      setAddresses((a.data as CustomerAddressRow[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load().catch(() => {
      // Keep initial background load quiet; action handlers show errors.
    });
  }, [load]);

  const saveProfile = async (
    patch: Partial<
      Pick<
        CustomerProfileRow,
        | 'full_name'
        | 'first_name'
        | 'last_name'
        | 'phone'
        | 'phone_verified_at'
        | 'terms_accepted_at'
        | 'terms_version'
        | 'privacy_version'
        | 'refund_version'
      >
    >
  ) => {
    if (!userId) return;
    const now = new Date().toISOString();
    const nextPhone =
      patch.phone !== undefined
        ? (() => {
            const t = String(patch.phone).trim();
            return t === '' ? null : normalizePhoneE164(t);
          })()
        : profile?.phone
          ? normalizePhoneE164(profile.phone)
          : null;
    const res = await supabase.from('customer_profiles').upsert(
      {
        id: userId,
        full_name: patch.full_name ?? profile?.full_name ?? null,
        first_name: patch.first_name ?? profile?.first_name ?? null,
        last_name: patch.last_name ?? profile?.last_name ?? null,
        phone: nextPhone,
        phone_verified_at: patch.phone_verified_at ?? profile?.phone_verified_at ?? null,
        terms_accepted_at: patch.terms_accepted_at ?? profile?.terms_accepted_at ?? null,
        terms_version: patch.terms_version ?? profile?.terms_version ?? null,
        privacy_version: patch.privacy_version ?? profile?.privacy_version ?? null,
        refund_version: patch.refund_version ?? profile?.refund_version ?? null,
        updated_at: now,
        created_at: profile?.created_at ?? now,
      },
      { onConflict: 'id' }
    );
    if (res.error) throw new Error(res.error.message);
    await load();
  };

  const saveAddress = async (input: {
    label: string;
    line1: string;
    address_type?: CustomerAddressRow['address_type'];
    building_name?: string | null;
    entrance?: string | null;
    apartment?: string | null;
    floor?: string | null;
    door_name_or_number?: string | null;
    company_name?: string | null;
    leave_at?: CustomerAddressRow['leave_at'];
    access_method?: CustomerAddressRow['access_method'];
    intercom_name_or_number?: string | null;
    door_code?: string | null;
    access_other_instructions?: string | null;
    courier_instructions?: string | null;
    lat?: number | null;
    lng?: number | null;
    entry_point_lat?: number | null;
    entry_point_lng?: number | null;
    is_default?: boolean;
    id?: string;
  }) => {
    if (!userId) return;
    if (input.is_default) {
      const reset = await supabase.from('customer_addresses').update({ is_default: false }).eq('user_id', userId);
      if (reset.error) throw new Error(reset.error.message);
    }
    // Normalize empty strings → null so DB stays clean.
    const buildingName = input.building_name?.trim() ? input.building_name.trim() : null;
    const entrance = input.entrance?.trim() ? input.entrance.trim() : null;
    const apartment = input.apartment?.trim() ? input.apartment.trim() : null;
    const floor = input.floor?.trim() ? input.floor.trim() : null;
    const doorNameOrNumber = input.door_name_or_number?.trim() ? input.door_name_or_number.trim() : null;
    const companyName = input.company_name?.trim() ? input.company_name.trim() : null;
    const intercomNameOrNumber = input.intercom_name_or_number?.trim()
      ? input.intercom_name_or_number.trim()
      : null;
    const doorCode = input.door_code?.trim() ? input.door_code.trim() : null;
    const accessOtherInstructions = input.access_other_instructions?.trim()
      ? input.access_other_instructions.trim()
      : null;
    const courierInstructions = input.courier_instructions?.trim() ? input.courier_instructions.trim() : null;
    if (input.id) {
      const updatePayload: {
        label: string;
        line1: string;
        address_type: CustomerAddressRow['address_type'];
        building_name: string | null;
        entrance: string | null;
        apartment: string | null;
        floor: string | null;
        door_name_or_number: string | null;
        company_name: string | null;
        leave_at: CustomerAddressRow['leave_at'];
        access_method: CustomerAddressRow['access_method'];
        intercom_name_or_number: string | null;
        door_code: string | null;
        access_other_instructions: string | null;
        courier_instructions: string | null;
        lat: number | null;
        lng: number | null;
        entry_point_lat: number | null;
        entry_point_lng: number | null;
        updated_at: string;
        is_default?: boolean;
      } = {
        label: input.label,
        line1: input.line1,
        address_type: input.address_type ?? null,
        building_name: buildingName,
        entrance,
        apartment,
        floor,
        door_name_or_number: doorNameOrNumber,
        company_name: companyName,
        leave_at: input.leave_at ?? null,
        access_method: input.access_method ?? null,
        intercom_name_or_number: intercomNameOrNumber,
        door_code: doorCode,
        access_other_instructions: accessOtherInstructions,
        courier_instructions: courierInstructions,
        lat: input.lat ?? null,
        lng: input.lng ?? null,
        entry_point_lat: input.entry_point_lat ?? null,
        entry_point_lng: input.entry_point_lng ?? null,
        updated_at: new Date().toISOString(),
      };
      if (input.is_default !== undefined) {
        updatePayload.is_default = input.is_default;
      }
      const update = await supabase
        .from('customer_addresses')
        .update(updatePayload)
        .eq('id', input.id)
        .eq('user_id', userId);
      if (update.error) throw new Error(update.error.message);
    } else {
      const insert = await supabase.from('customer_addresses').insert({
        user_id: userId,
        label: input.label,
        line1: input.line1,
        address_type: input.address_type ?? null,
        building_name: buildingName,
        entrance,
        apartment,
        floor,
        door_name_or_number: doorNameOrNumber,
        company_name: companyName,
        leave_at: input.leave_at ?? null,
        access_method: input.access_method ?? null,
        intercom_name_or_number: intercomNameOrNumber,
        door_code: doorCode,
        access_other_instructions: accessOtherInstructions,
        courier_instructions: courierInstructions,
        lat: input.lat ?? null,
        lng: input.lng ?? null,
        entry_point_lat: input.entry_point_lat ?? null,
        entry_point_lng: input.entry_point_lng ?? null,
        is_default: input.is_default ?? false,
      });
      if (insert.error) throw new Error(insert.error.message);
    }
    await load();
  };

  const deleteAddress = async (id: string) => {
    if (!userId) return;
    const existing = addresses.find((addr) => addr.id === id);
    if (!existing) return;

    const remove = await supabase.from('customer_addresses').delete().eq('id', id).eq('user_id', userId);
    if (remove.error) throw new Error(remove.error.message);

    if (existing.is_default) {
      const nextDefault = addresses.find((addr) => addr.id !== id);
      if (nextDefault) {
        const promote = await supabase
          .from('customer_addresses')
          .update({ is_default: true })
          .eq('id', nextDefault.id)
          .eq('user_id', userId);
        if (promote.error) throw new Error(promote.error.message);
      }
    }

    await load();
  };

  return { profile, addresses, loading, load, saveProfile, saveAddress, deleteAddress };
}
