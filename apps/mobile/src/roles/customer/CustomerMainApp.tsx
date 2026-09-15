import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { ThemeProvider, buildThemeForRole } from '@tohfa/mobile-ui';
import { RoleCode } from '@tohfa/shared-types';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../shell/api/queryClient';
import { CategoriesScreen } from './screens/CategoriesScreen';
import { ProductGridScreen } from './screens/ProductGridScreen';
import { ProductDetailScreen } from './screens/ProductDetailScreen';
import { SearchScreen } from './screens/SearchScreen';
import { CartScreen } from './screens/CartScreen';
import { CheckoutScreen } from './screens/CheckoutScreen';
import { TopupScreen } from './screens/TopupScreen';
import { OrderTrackingScreen } from './screens/OrderTrackingScreen';
import { OrderHistoryScreen } from './screens/OrderHistoryScreen';
import { HomeScreen } from './screens/HomeScreen';

/**
 * Customer's real post-login screens, mounted by the farmer app's shared
 * router (src/roles/farmer/App.tsx) once /auth/me resolves the signed-in
 * account as a customer. The single app's Splash/Welcome/Login/OTP screens
 * (farmer's, now shared by everyone) already handled sign-in before this
 * mounts -- this component owns ONLY what happens after that, which is why
 * customer's own former Splash/Onboarding/Register/Otp/Login/ForgotPassword/
 * ResetPassword screens (previously kept under src/roles/customer/screens/auth/
 * "for reference") were unreachable dead code and have been deleted, along
 * with the unreachable src/roles/customer/App.tsx that used to mount them
 * and the unused src/roles/customer/screens/home/HomeScreen.tsx duplicate.
 */

type ScreenName =
  | 'Home'
  | 'Categories'
  | 'ProductGrid'
  | 'ProductDetail'
  | 'Search'
  | 'Cart'
  | 'Checkout'
  | 'Topup'
  | 'OrderTracking'
  | 'OrderHistory';

interface NavigationParams {
  categoryId?: string | undefined;
  productId?: string | undefined;
  shortfall?: string | undefined;
  orderId?: string | undefined;
}

const theme = buildThemeForRole(RoleCode.CUSTOMER);

export function CustomerMainApp({ onSignOut }: { onSignOut: () => void }): React.JSX.Element {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Home');
  const [navParams, setNavParams] = useState<NavigationParams>({});

  const navigate = (screen: string, params?: NavigationParams) => {
    if (screen === 'SignOut') {
      onSignOut();
      return;
    }
    if (params) setNavParams(params);
    setCurrentScreen(screen as ScreenName);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.surface }]}>
          <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

          {currentScreen === 'Home' && <HomeScreen />}
          {currentScreen === 'Categories' && <CategoriesScreen />}

          {currentScreen === 'ProductGrid' && navParams.categoryId && (
            <ProductGridScreen categoryId={navParams.categoryId} />
          )}
          {currentScreen === 'ProductGrid' && !navParams.categoryId && <ProductGridScreen />}

          {currentScreen === 'ProductDetail' && (
            <ProductDetailScreen productId={navParams.productId || ''} />
          )}

          {currentScreen === 'Search' && <SearchScreen />}

          {currentScreen === 'Cart' && (
            <CartScreen onNavigate={(s, p) => navigate(s, p)} />
          )}

          {currentScreen === 'Checkout' && (
            <CheckoutScreen onNavigate={(s, p) => navigate(s, p)} />
          )}

          {currentScreen === 'Topup' && (
            <TopupScreen shortfall={navParams.shortfall} onNavigate={(s, p) => navigate(s, p)} />
          )}

          {currentScreen === 'OrderTracking' && (
            <OrderTrackingScreen orderId={navParams.orderId} onNavigate={(s, p) => navigate(s, p)} />
          )}

          {currentScreen === 'OrderHistory' && (
            <OrderHistoryScreen onNavigate={(s, p) => navigate(s, p)} />
          )}
        </SafeAreaView>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
