import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.notificationListener = null;
    this.responseListener = null;
  }

  // Request notification permissions
  async requestPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push notification permissions');
        return false;
      }

      // Get push token for remote notifications (optional)
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#00d9ff',
        });
      }

      return true;
    } catch (error) {
      console.log('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Schedule a notification
  async scheduleNotification(title, body, data = {}, trigger = null) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          vibrate: [0, 250, 250, 250],
        },
        trigger: trigger || null, // null = show immediately
      });
      return id;
    } catch (error) {
      console.log('Error scheduling notification:', error);
      return null;
    }
  }

  // Schedule class reminder notification
  async scheduleClassReminder(classInfo, minutesBefore = 15) {
    try {
      const [hours, minutes] = classInfo.startTime.split(':').map(Number);
      const now = new Date();
      const classTime = new Date();
      classTime.setHours(hours, minutes, 0, 0);

      // Calculate notification time (X minutes before class)
      const notificationTime = new Date(classTime.getTime() - minutesBefore * 60000);

      // Only schedule if notification time is in the future
      if (notificationTime > now) {
        const trigger = {
          date: notificationTime,
        };

        const id = await this.scheduleNotification(
          `📚 Class Starting Soon`,
          `${classInfo.subject} in ${minutesBefore} minutes\n🏢 Room: ${classInfo.room}`,
          {
            type: 'class_reminder',
            classInfo,
          },
          trigger
        );

        console.log(`Scheduled notification for ${classInfo.subject} at ${notificationTime.toLocaleTimeString()}`);
        return id;
      }
    } catch (error) {
      console.log('Error scheduling class reminder:', error);
    }
    return null;
  }

  // Schedule all classes for the day
  async scheduleAllClassesForDay(schedule) {
    try {
      // Cancel all existing scheduled notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      const notificationIds = [];

      for (const classInfo of schedule) {
        // Schedule 15-minute reminder
        const id15 = await this.scheduleClassReminder(classInfo, 15);
        if (id15) notificationIds.push(id15);

        // Schedule 5-minute reminder
        const id5 = await this.scheduleClassReminder(classInfo, 5);
        if (id5) notificationIds.push(id5);
      }

      // Save notification IDs
      await AsyncStorage.setItem('scheduledNotifications', JSON.stringify(notificationIds));

      console.log(`Scheduled ${notificationIds.length} notifications for ${schedule.length} classes`);
      return notificationIds;
    } catch (error) {
      console.log('Error scheduling all classes:', error);
      return [];
    }
  }

  // Show immediate notification
  async showImmediateNotification(title, body, data = {}) {
    return await this.scheduleNotification(title, body, data, null);
  }

  // Cancel all notifications
  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem('scheduledNotifications');
      console.log('All notifications cancelled');
    } catch (error) {
      console.log('Error cancelling notifications:', error);
    }
  }

  // Get badge count
  async getBadgeCount() {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      return 0;
    }
  }

  // Set badge count
  async setBadgeCount(count) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.log('Error setting badge count:', error);
    }
  }

  // Clear badge
  async clearBadge() {
    await this.setBadgeCount(0);
  }

  // Setup notification listeners
  setupListeners(onNotificationReceived, onNotificationTapped) {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      if (onNotificationTapped) {
        onNotificationTapped(response);
      }
    });
  }

  // Remove listeners
  removeListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  // Check if class is starting soon (within 15 minutes)
  isClassStartingSoon(startTime) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const classTime = new Date();
    classTime.setHours(hours, minutes, 0, 0);

    const now = new Date();
    const diffMinutes = (classTime - now) / 60000;

    return diffMinutes > 0 && diffMinutes <= 15;
  }

  // Get upcoming classes count
  getUpcomingClassesCount(schedule) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    return schedule.filter((classInfo) => {
      const [hours, minutes] = classInfo.startTime.split(':').map(Number);
      const classTime = hours * 60 + minutes;
      return classTime > currentTime;
    }).length;
  }
}

export default new NotificationService();
