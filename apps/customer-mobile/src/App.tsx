import React, { useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { ThemeProvider } from '@tohfa/mobile-ui';
import { theme, colors } from './theme';
import { SplashScreen } from './screens/auth/SplashScreen';
import { OnboardingScreen } from './screens/auth/OnboardingScreen';
import { RegisterScreen } from './screens/auth/RegisterScreen';
import { OtpScreen } from './screens/auth/OtpScreen';
import { LoginScreen } from './screens/auth/LoginScreen';
import { ForgotPasswordScreen } from './screens/auth/ForgotPasswordScreen';
import { ResetPasswordScreen } from './screens/auth/ResetPasswordScreen';
import { HomeScreen } from './screens/home/HomeScreen';

type ScreenName =
  | 'Splash'
  | 'Onboarding'
  | 'Register'
  | 'Otp'
  | 'Login'
  | 'ForgotPassword'
  | 'ResetPassword'
  | 'Home';

interface NavigationParams {
  mobile?: string | undefined;
  challengeId?: string | undefined;
  resendAvailableAt?: string | undefined;
  attemptsRemaining?: number | undefined;
  _mockCode?: string | undefined;
}

export default function App(): React.JSX.Element {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Splash');
  const [navParams, setNavParams] = useState<NavigationParams>({});

  const navigate = (screen: ScreenName, params?: NavigationParams) => {
    if (params) setNavParams(params);
    setCurrentScreen(screen);
  };

  return (
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
      </SafeAreaView>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
