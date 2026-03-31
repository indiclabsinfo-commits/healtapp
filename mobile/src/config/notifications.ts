import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permissions not granted');
    return null;
  }

  // Get Expo push token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId || undefined,
    });
    const token = tokenData.data;

    // Android-specific notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6FFFE9',
      });

      await Notifications.setNotificationChannelAsync('assignments', {
        name: 'Assignments',
        importance: Notifications.AndroidImportance.HIGH,
        description: 'Notifications for new assignments and deadlines',
      });

      await Notifications.setNotificationChannelAsync('consultations', {
        name: 'Consultations',
        importance: Notifications.AndroidImportance.MAX,
        description: 'Reminders for upcoming consultation sessions',
      });
    }

    // Send token to backend (optional — for server-side push)
    try {
      await api.post('/auth/push-token', { token, platform: Platform.OS });
    } catch {
      // Server endpoint may not exist yet — silent fail
    }

    return token;
  } catch (error) {
    console.log('Error getting push token:', error);
    return null;
  }
}

// Listen for notifications
export function addNotificationListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

// Listen for notification taps (when user taps notification to open app)
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// Schedule a local notification (e.g., consultation reminder)
export async function scheduleLocalNotification(
  title: string,
  body: string,
  triggerSeconds: number,
  channelId: string = 'default'
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      ...(Platform.OS === 'android' ? { channelId } : {}),
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: triggerSeconds },
  });
}
