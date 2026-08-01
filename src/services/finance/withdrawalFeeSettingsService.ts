import { supabase } from '../../lib/supabase';
import {
  defaultWithdrawalFeeSettings,
  parseWithdrawalFeeSettingsRow,
  type WithdrawalFeeSettings,
} from './withdrawalFees';

export async function fetchWithdrawalFeeSettings(): Promise<{
  data: WithdrawalFeeSettings;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from('finance_withdrawal_fee_settings')
    .select('bank_rate, bank_min_fee, card_rate, card_min_fee')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    return { data: defaultWithdrawalFeeSettings(), error: error.message };
  }

  return { data: parseWithdrawalFeeSettingsRow(data), error: null };
}
