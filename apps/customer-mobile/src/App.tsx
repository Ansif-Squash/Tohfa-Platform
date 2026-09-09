import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { ThemeProvider } from '@tohfa/mobile-ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { theme, colors } from './theme';
import { SplashScreen } from './screens/auth/SplashScreen';
import { OnboardingScreen } from './screens/auth/OnboardingScreen';
import { RegisterScreen } from './screens/auth/RegisterScreen';
import { OtpScreen } from './screens/auth/OtpScreen';
import { LoginScreen } from './screens/auth/LoginScreen';
import { ForgotPasswordScreen } from './screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from './screens/auth/ResetPasswordScreen';
import { HomeScreen } from './screens/home/HomeScreen';
import { CategoriesScreen } from './screens/CategoriesScreen';
import { ProductGridScreen } from './screens/ProductGridScreen';
import { ProductDetailScreen } from './screens/ProductDetailScreen';
import { SearchScreen } from './screens/SearchScreen';
import { CartScreen } from './screens/CartScreen';
import { CheckoutScreen } from './screens/CheckoutScreen';
import { TopupScreen } from './screens/TopupScreen';
import { OrderTrackingScreen } from './screens/OrderTrackingScreen';
import { OrderHistoryScreen } from './screens/OrderHistoryScreen';

const queryClient = new QueryClient();

type ScreenName =
  | 'Splash'
  | 'Onboarding'
  | 'Register'
  | 'Otp'
  | 'Login'
  | 'ForgotPassword'
  | 'ResetPassword'
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
  mobile?: string | undefined;
  challengeId?: string | undefined;
  resendAvailableAt?: string | undefined;
  attemptsRemaining?: number | undefined;
  _mockCode?: string | undefined;
  categoryId?: string | undefined;
  productId?: string | undefined;
  shortfall?: string | undefined;
  orderId?: string | undefined;
}

export default function App(): React.JSX.Element {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Splash');
  const [navParams, setNavParams] = useState<NavigationParams>({});

  const navigate = (screen: ScreenName, params?: NavigationParams) => {
    if (params) setNavParams(params);
    setCurrentScreen(screen);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.surface }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

        {currentScreen === 'Splash' && (
          <SplashScreen
            onNavigate={(screen) => navigate(screen)}
          />
        )}

        {currentScreen === 'Onboarding' && (
          <OnboardingScreen
            onNavigate={(screen) => navigate(screen)}
          />
        )}

        {currentScreen === 'Register' && (
          <RegisterScreen
            onNavigate={(screen, params) => navigate(screen, params)}
          />
        )}

        {currentScreen === 'Otp' && (
          <OtpScreen
            mobile={navParams.mobile || ''}
            challengeId={navParams.challengeId}
            resendAvailableAt={navParams.resendAvailableAt}
            attemptsRemaining={navParams.attemptsRemaining}
            onNavigate={(screen) => navigate(screen)}
          />
        )}

        {currentScreen === 'Login' && (
          <LoginScreen
            onNavigate={(screen) => navigate(screen)}
          />
        )}

        {currentScreen === 'ForgotPassword' && (
          <ForgotPasswordScreen
            onNavigate={(screen, params) => navigate(screen, params)}
          />
        )}

        {currentScreen === 'ResetPassword' && (
          <ResetPasswordScreen
            challengeId={navParams.challengeId || ''}
            mobile={navParams.mobile}
            onNavigate={(screen) => navigate(screen)}
          />
        )}

        {currentScreen === 'Home' && (
          <HomeScreen
            onNavigate={(screen) => navigate(screen)}
          />
        )}

        {currentScreen === 'Categories' && (
          <CategoriesScreen />
        )}

        {currentScreen === 'ProductGrid' && navParams.categoryId && (
          <ProductGridScreen categoryId={navParams.categoryId} />
        )}
        {currentScreen === 'ProductGrid' && !navParams.categoryId && (
          <ProductGridScreen />
        )}

        {currentScreen === 'ProductDetail' && (
          <ProductDetailScreen productId={navParams.productId || ''} />
        )}

        {currentScreen === 'Search' && (
          <SearchScreen />
        )}

        {currentScreen === 'Cart' && (
          <CartScreen onNavigate={(screen, params) => navigate(screen as ScreenName, params)} />
        )}

        {currentScreen === 'Checkout' && (
          <CheckoutScreen onNavigate={(screen, params) => navigate(screen as ScreenName, params)} />
        )}

        {currentScreen === 'Topup' && (
          <TopupScreen shortfall={navParams.shortfall} onNavigate={(screen, params) => navigate(screen as ScreenName, params)} />
        )}

        {currentScreen === 'OrderTracking' && (
          <OrderTrackingScreen orderId={navParams.orderId} onNavigate={(screen, params) => navigate(screen as ScreenName, params)} />
        )}

        {currentScreen === 'OrderHistory' && (
          <OrderHistoryScreen onNavigate={(screen, params) => navigate(screen as ScreenName, params)} />
        )}
      </SafeAreaView>
    </ThemeProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
