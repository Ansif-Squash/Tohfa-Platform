import React from 'react';
import {
  RecentListingsScreen,
  type RecentListingsScreenProps,
  type ListingItem,
} from './RecentListingsScreen';

export type { RecentListingsScreenProps, ListingItem };

export function MyListingsScreen(props: RecentListingsScreenProps): React.JSX.Element {
  return <RecentListingsScreen {...props} />;
}
