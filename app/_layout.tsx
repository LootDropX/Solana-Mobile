import '../src/polyfills';
import React from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 10_000,
    },
  },
});

/**
 * Root layout — wraps the entire app with global providers.
 */
export default function RootLayout(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <StatusBar style="light" backgroundColor="#0A0A0F" />
          <Stack screenOptions={{ headerShown: false, contentStyle: styles.bg }} />
        </ErrorBoundary>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bg: { backgroundColor: '#0A0A0F' },
});
