/**
 * Typed navigation definitions for the Farmer Mobile app.
 */

export type MainTabParamList = {
  Home: undefined;
  Listings: undefined;
  Farms: undefined;
  Wallet: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  Otp: { mobile: string };
  ForgotPassword: undefined;
  ApplicationStatus: { applicationId: string };
  MainTabs: undefined;
  ListingDetail: { id: string };
  CreateListing: undefined;
  CounterOffer: { listingId: string; offerId?: string };
  Certifications: undefined;
  AddCertification: undefined;
};

export const deepLinkingConfig = {
  prefixes: ['tohfa-farmer://', 'https://farmer.tohfa.in'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: 'home',
          Listings: 'listings',
          Farms: 'farms',
          Wallet: 'wallet',
          Profile: 'profile',
        },
      },
      ListingDetail: 'listings/:id',
      CreateListing: 'listings/new',
      CounterOffer: 'listings/:listingId/counter-offers/:offerId',
      ApplicationStatus: 'application/:applicationId',
      Certifications: 'certifications',
      AddCertification: 'certifications/new',
    },
  },
};

