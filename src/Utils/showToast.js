import { Alert } from 'react-native';

// Simple toast utility using Alert for now
// You can replace this with a proper toast library like react-native-toast-message
export const showToast = (message, type = 'info') => {
  const title = type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Info';
  Alert.alert(title, message);
};

export const showGlobalSnackBar = (message, options = {}) => {
  const { backgroundColor } = options;
  const type = backgroundColor === 'red' ? 'error' : backgroundColor === 'green' ? 'success' : 'info';
  showToast(message, type);
};
