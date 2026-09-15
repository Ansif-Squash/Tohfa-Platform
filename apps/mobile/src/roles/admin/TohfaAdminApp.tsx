/**
 * Admin flavor placeholder root component.
 *
 * Purpose ONLY: prove the 3-flavor native + Metro entry-file mechanism works
 * end to end (see android/app/build.gradle's per-flavor ENTRY_FILE wiring)
 * before real admin screens are built (consolidation plan §6). The admin
 * flavor does not pin a role at login and will eventually mount a
 * role-selection screen here instead of a single trivial screen — not yet
 * wired in this step. Colours/spacing/type come from @tohfa/mobile-ui's
 * useTheme() (never a literal hex or spacing number, per root CLAUDE.md
 * §2.7); the copy comes from this role's own tiny i18n catalog, never an
 * inline string.
 */
import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Icon, useTheme } from '@tohfa/mobile-ui';
import { t } from './i18n';

export function TohfaAdminApp(): React.JSX.Element {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.colors.surface }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primaryPressed} />
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.primaryPressed,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.xl,
          },
        ]}
      >
        <Icon name="admin_panel_settings" size={32} color={theme.colors.white} />
        <Text
          style={[
            styles.heading,
            {
              color: theme.colors.white,
              fontSize: theme.typography.title,
              fontWeight: theme.weights.bold,
              marginTop: theme.spacing.sm,
            },
          ]}
        >
          {t('scaffold.heading')}
        </Text>
      </View>
      <View style={[styles.body, { padding: theme.spacing.lg }]}>
        <Text
          style={[
            styles.bodyText,
            { color: theme.colors.onSurface, fontSize: theme.typography.body },
          ]}
        >
          {t('scaffold.body')}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { alignItems: 'center', justifyContent: 'center' },
  heading: { textAlign: 'center' },
  body: { flex: 1 },
  bodyText: { textAlign: 'center' },
});
