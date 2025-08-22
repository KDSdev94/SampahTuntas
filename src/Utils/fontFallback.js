import { Platform } from 'react-native';

export const getFontFamily = (weight = 'regular') => {
  if (Platform.OS === 'android') {
    // Use system fonts for Android to ensure visibility
    switch (weight) {
      case 'bold':
      case '700':
        return 'sans-serif-medium';
      case 'semi-bold':
      case '600':
        return 'sans-serif-medium';
      case 'medium':
      case '500':
        return 'sans-serif';
      case 'light':
      case '300':
        return 'sans-serif-light';
      case 'regular':
      case '400':
      default:
        return 'sans-serif';
    }
  } else {
    // iOS fallback
    switch (weight) {
      case 'bold':
      case '700':
        return 'System';
      case 'semi-bold':
      case '600':
        return 'System';
      case 'medium':
      case '500':
        return 'System';
      case 'light':
      case '300':
        return 'System';
      case 'regular':
      case '400':
      default:
        return 'System';
    }
  }
};

export const getFontWeight = (weight = 'regular') => {
  if (Platform.OS === 'android') {
    // For Android, use normal weight since we handle it via fontFamily
    return 'normal';
  } else {
    // iOS can handle fontWeight properly
    switch (weight) {
      case 'bold':
        return '700';
      case 'semi-bold':
        return '600';
      case 'medium':
        return '500';
      case 'light':
        return '300';
      case 'regular':
      default:
        return '400';
    }
  }
};

// Helper function to get both fontFamily and fontWeight
export const getFont = (weight = 'regular') => ({
  fontFamily: getFontFamily(weight),
  fontWeight: getFontWeight(weight),
});
