import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { getFont } from './fontFallback';;
import AsyncStorage from '@react-native-async-storage/async-storage';

// Global error handler
export const setupGlobalErrorHandler = () => {
  // Handle unhandled promise rejections
  const originalHandler = global.Promise.prototype.catch;
  global.Promise.prototype.catch = function(onRejected) {
    return originalHandler.call(this, (error) => {
      console.error('Unhandled Promise Rejection:', error);
      if (onRejected) {
        return onRejected(error);
      }
      throw error;
    });
  };

  // Handle JavaScript errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    originalConsoleError(...args);
    // Log to AsyncStorage for debugging
    AsyncStorage.setItem('lastError', JSON.stringify({
      error: args.join(' '),
      timestamp: new Date().toISOString()
    })).catch(() => {});
  };
};

// Error Boundary Component
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary Caught:', error, errorInfo);
    // Log to AsyncStorage
    AsyncStorage.setItem('lastCrash', JSON.stringify({
      error: error.toString(),
      errorInfo: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    })).catch(() => {});
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorMessage}>
            The app encountered an unexpected error. Please restart the application.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 20,
    ...getFont('bold'),
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    ...getFont('bold'),
  },
});
