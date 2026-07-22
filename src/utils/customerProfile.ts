const CUSTOMER_PROFILE_KEY = 'foodreel-customer-profile';
const LEGACY_EXPERIENCE_PROFILE_KEY = 'foodreel-experience-customer-profile';
export const customerProfileChangedEvent = 'foodreel:customer-profile';

export type CustomerProfile = {
  contact: string;
  displayName: string;
  termsAccepted: boolean;
};

const EMPTY_PROFILE: CustomerProfile = {
  contact: '',
  displayName: '',
  termsAccepted: false
};

export function readCustomerProfile(): CustomerProfile {
  try {
    const stored = JSON.parse(
      window.localStorage.getItem(CUSTOMER_PROFILE_KEY) ??
        window.localStorage.getItem(LEGACY_EXPERIENCE_PROFILE_KEY) ??
        '{}'
    ) as Partial<CustomerProfile>;

    return {
      contact: stored.contact ?? '',
      displayName: stored.displayName ?? '',
      termsAccepted: stored.termsAccepted ?? false
    };
  } catch {
    return EMPTY_PROFILE;
  }
}

export function writeCustomerProfile(profile: CustomerProfile) {
  window.localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent(customerProfileChangedEvent, { detail: profile }));
}

export function customerHasName(profile = readCustomerProfile()) {
  return profile.displayName.trim().length > 0;
}
