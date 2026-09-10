import * as Notifications from 'expo-notifications';

import * as Device from 'expo-device';

import { Platform } from 'react-native';

import { api } from '../api/client';

/*
|--------------------------------------------------------------------------
| Configure foreground notifications
|--------------------------------------------------------------------------
*/

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,

    shouldPlaySound: true,

    shouldSetBadge: true,

    shouldShowBanner: true,

    shouldShowList: true,
  }),
});

/*
|--------------------------------------------------------------------------
| Register device
|--------------------------------------------------------------------------
*/

export async function registerForPushNotifications(token: string) {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device.');

    return null;
  }

  const permissions = await Notifications.getPermissionsAsync();

  let finalStatus = permissions.status;

  if (finalStatus !== Notifications.PermissionStatus.GRANTED) {
    const request = await Notifications.requestPermissionsAsync();

    finalStatus = request.status;
  }

  if (finalStatus !== Notifications.PermissionStatus.GRANTED) {
    console.log('Push notification permission denied.');

    return null;
  }

  const projectId = 'YOUR_EXPO_PROJECT_ID';

  const pushToken = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  await api.post(
    '',

    {
      expo_push_token: pushToken.data,

      platform: Platform.OS,

      device_name: Device.deviceName,
    },

    {
      params: {
        path: 'devices/register',
      },

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return pushToken.data;
}
