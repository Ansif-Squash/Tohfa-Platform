/**
 * The true app root, shared by all three binaries.
 *
 * NON-NEGOTIABLE: this file must NEVER statically import anything from
 * src/roles/**. src/shell ships in every binary, so a single static role import
 * would drag all three roles' code into all three bundles — Metro has no
 * per-bundle exclusion config, so the import graph *is* the isolation
 * mechanism. That would also break BR-16 farm-anonymity (root CLAUDE.md §2.5)
 * by putting farmer code inside the customer app.
 * src/tests/cross_role_import_guard.test.ts enforces this by scanning the
 * `from '...'` / `require('...')` specifiers of every file under src/shell.
 *
 * The role app therefore arrives as a PROP, injected by index.<flavor>.js —
 * the only files that legitimately reach into both halves of the tree.
 *
 * Note on provider nesting: the farmer and customer App.tsx each render their
 * own ThemeProvider and QueryClientProvider inside. That nesting is harmless.
 * The inner ThemeProvider wins for its subtree and supplies an equivalent
 * role theme (both call buildThemeForRole with the same role this shell pins),
 * and QueryClientProvider is only rendered on the role side.
 *
 * These screens are deliberately BARE: they exist to prove the auth plumbing,
 * not to be product UI. The richer flows a role already owns (register, forgot
 * password, locale switching, onboarding) stay in that role's own screens.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import {
  Button,
  ErrorState,
  Input,
  ThemeProvider,
  buildThemeForRole,
  defaultMobileTheme,
  useTheme,
} from '@tohfa/mobile-ui';
import { OtpPurpose, type RoleAssignment, type RoleCode } from '@tohfa/shared-types';
import { ApiError, NetworkError } from '../api/client';
import { FLAVOR_CONFIG, type Flavor } from '../config/flavor';
import { t, type ShellStringKey } from '../i18n';
import { sendOtp } from './api';
import {
  NoAccountForOtpError,
  type SessionState,
  filterAdminSelectableRoles,
  getSessionState,
  initializeSession,
  selectRole,
  signInWithOtp,
  signInWithPassword,
  signOut,
  subscribeToSession,
} from './session';

export interface RootShellProps {
  readonly flavor: Flavor;
  readonly RoleApp: React.ComponentType;
}

/**
 * Every failure reaching the UI collapses to one of two catalogue keys. The
 * caught value is never rendered: an `ApiError`'s problem detail and a raw
 * `Error.message` are both untranslated English written for developers.
 */
function errorKeyFor(error: unknown): ShellStringKey {
  if (error instanceof NoAccountForOtpError) {
    return 'shell.error.noAccount';
  }
  // ApiError and NetworkError are the two the shared client throws; anything
  // else is an unexpected bug and gets the same generic treatment.
  if (error instanceof ApiError || error instanceof NetworkError) {
    return 'shell.error.requestFailed';
  }
  return 'shell.error.requestFailed';
}

function Splash(): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={[styles.centered, { padding: theme.spacing.xl }]}>
      <ActivityIndicator color={theme.colors.primary} size="large" />
      <Text
        style={{
          marginTop: theme.spacing.md,
          fontSize: theme.typography.body,
          color: theme.colors.onSurface,
        }}
      >
        {t('shell.splash.loading')}
      </Text>
    </View>
  );
}

/** Bare password + OTP sign-in. Two modes, one screen, no navigation. */
function Login({ pinnedRoleCode }: { pinnedRoleCode: RoleCode | undefined }): React.JSX.Element {
  const theme = useTheme();
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<ShellStringKey | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>): Promise<void> {
    setBusy(true);
    setErrorKey(null);
    try {
      await action();
    } catch (error) {
      setErrorKey(errorKeyFor(error));
    } finally {
      setBusy(false);
    }
  }

  const onPasswordSignIn = (): void => {
    void run(() => signInWithPassword({ mobile, password, roleCode: pinnedRoleCode }));
  };

  const onSendCode = (): void => {
    void run(async () => {
      const response = await sendOtp({ mobile, purpose: OtpPurpose.LOGIN });
      setChallengeId(response.challengeId);
    });
  };

  const onVerify = (): void => {
    const pendingChallengeId = challengeId;
    if (pendingChallengeId === null) {
      return;
    }
    void run(() => signInWithOtp({ challengeId: pendingChallengeId, code }));
  };

  const toggleMode = (): void => {
    setMode(mode === 'password' ? 'otp' : 'password');
    setErrorKey(null);
    setChallengeId(null);
    setCode('');
  };

  return (
    <View style={[styles.form, { padding: theme.spacing.xl }]}>
      <Text
        style={{
          fontSize: theme.typography.headline,
          fontWeight: theme.weights.bold,
          color: theme.colors.onSurface,
          marginBottom: theme.spacing.lg,
        }}
      >
        {mode === 'password' ? t('shell.login.title') : t('shell.otp.title')}
      </Text>

      <Input
        autoCapitalize="none"
        keyboardType="phone-pad"
        label={t('shell.login.mobileLabel')}
        onChangeText={setMobile}
        value={mobile}
      />

      {mode === 'password' ? (
        <>
          <Input
            autoCapitalize="none"
            label={t('shell.login.passwordLabel')}
            onChangeText={setPassword}
            secureTextEntry
            value={password}
          />
          <Button
            loading={busy}
            onPress={onPasswordSignIn}
            title={t('shell.login.submit')}
          />
        </>
      ) : (
        <>
          {challengeId === null ? (
            <Button loading={busy} onPress={onSendCode} title={t('shell.otp.sendCode')} />
          ) : (
            <>
              <Input
                autoCapitalize="none"
                keyboardType="number-pad"
                label={t('shell.otp.codeLabel')}
                onChangeText={setCode}
                value={code}
              />
              <Button loading={busy} onPress={onVerify} title={t('shell.otp.verify')} />
            </>
          )}
        </>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={toggleMode}
        style={{ marginTop: theme.spacing.lg, minHeight: theme.minTouchTarget }}
      >
        <Text style={{ fontSize: theme.typography.body, color: theme.colors.primary }}>
          {mode === 'password' ? t('shell.login.useOtp') : t('shell.login.usePassword')}
        </Text>
      </Pressable>

      {errorKey === null ? null : (
        <Text
          style={{
            marginTop: theme.spacing.md,
            fontSize: theme.typography.bodySmall,
            color: theme.colors.danger,
          }}
        >
          {t(errorKey)}
        </Text>
      )}
    </View>
  );
}

/**
 * Bare role picker. Only reachable in the admin flavor: farmer and customer
 * pin a roleCode, which makes the server's role-selection branch unreachable
 * (see ../config/flavor.ts).
 */
function RoleSelect({
  availableRoles,
}: {
  availableRoles: readonly RoleAssignment[];
}): React.JSX.Element {
  const theme = useTheme();
  const [errorKey, setErrorKey] = useState<ShellStringKey | null>(null);
  const selectable = filterAdminSelectableRoles(availableRoles);

  // An account with roles but no admin-console role among them. Not a crash —
  // a dead end that has to offer a way back out.
  if (selectable.length === 0) {
    return (
      <View style={styles.centered}>
        <ErrorState message={t('shell.error.noAdminRole')} />
        <Button
          onPress={() => {
            void signOut();
          }}
          title={t('shell.action.signOut')}
          variant="outline"
        />
      </View>
    );
  }

  return (
    <View style={[styles.form, { padding: theme.spacing.xl }]}>
      <Text
        style={{
          fontSize: theme.typography.headline,
          fontWeight: theme.weights.bold,
          color: theme.colors.onSurface,
        }}
      >
        {t('shell.roleSelect.title')}
      </Text>
      <Text
        style={{
          marginTop: theme.spacing.sm,
          marginBottom: theme.spacing.lg,
          fontSize: theme.typography.bodySmall,
          color: theme.colors.onSurface,
        }}
      >
        {t('shell.roleSelect.instruction')}
      </Text>

      {selectable.map((assignment) => (
        <Pressable
          accessibilityRole="button"
          key={assignment.code}
          onPress={() => {
            setErrorKey(null);
            void selectRole(assignment.code).catch((error: unknown) => {
              setErrorKey(errorKeyFor(error));
            });
          }}
          style={{
            minHeight: theme.minTouchTarget,
            justifyContent: 'center',
            paddingHorizontal: theme.spacing.md,
            marginBottom: theme.spacing.sm,
            borderRadius: theme.radius.button,
            backgroundColor: theme.colors.surface,
          }}
        >
          {/* The role code itself, not a translated label: these are domain
              identifiers, and per-role display names are product UI that would
              need its own catalogue entries. */}
          <Text style={{ fontSize: theme.typography.body, color: theme.colors.onSurface }}>
            {assignment.code}
          </Text>
        </Pressable>
      ))}

      {errorKey === null ? null : (
        <Text
          style={{
            marginTop: theme.spacing.md,
            fontSize: theme.typography.bodySmall,
            color: theme.colors.danger,
          }}
        >
          {t(errorKey)}
        </Text>
      )}
    </View>
  );
}

export function RootShell({ flavor, RoleApp }: RootShellProps): React.JSX.Element {
  const [session, setSession] = useState<SessionState>(getSessionState);

  // Pinning lives in flavor.ts so it stays one testable source of truth and the
  // entry files stay trivial.
  const pinnedRoleCode = FLAVOR_CONFIG[flavor].pinnedRoleCode;

  useEffect(() => {
    // Subscribe before initializing, so the initializing -> anonymous
    // transition cannot be missed.
    const unsubscribe = subscribeToSession(() => {
      setSession(getSessionState());
    });
    initializeSession();
    setSession(getSessionState());
    return unsubscribe;
  }, []);

  const activeRole = session.status === 'authenticated' ? session.activeRoleCode : pinnedRoleCode;
  const theme = useMemo(
    () => (activeRole === undefined ? defaultMobileTheme : buildThemeForRole(activeRole)),
    [activeRole],
  );

  return (
    <ThemeProvider theme={theme}>
      <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.surface }]}>
        {session.status === 'initializing' ? (
          <Splash />
        ) : session.status === 'anonymous' ? (
          <Login pinnedRoleCode={pinnedRoleCode} />
        ) : session.status === 'roleSelectionRequired' ? (
          <RoleSelect availableRoles={session.availableRoles} />
        ) : (
          <RoleApp />
        )}
      </SafeAreaView>
    </ThemeProvider>
  );
}

/* Structural only — every colour, space and size comes from the theme above. */
const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  form: { flex: 1, width: '100%', justifyContent: 'center' },
});
