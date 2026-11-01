export const legalInfo = {
  name: process.env.LEGAL_INFO_NAME?.trim(),
  address: process.env.LEGAL_INFO_ADDRESS?.trim(),
  contactEmail: process.env.LEGAL_INFO_CONTACT_EMAIL?.trim(),
  registerDetails: process.env.LEGAL_INFO_REGISTER_DETAILS?.trim(),
  vatId: process.env.LEGAL_INFO_VAT_ID?.trim(),
  supabaseRegion: process.env.LEGAL_INFO_SUPABASE_REGION?.trim(),
};
