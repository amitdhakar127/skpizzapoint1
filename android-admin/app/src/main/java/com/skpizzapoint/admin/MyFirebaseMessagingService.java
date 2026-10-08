package com.skpizzapoint.admin;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String TAG = "SKPizzaFCM";
    private static final String CHANNEL_ID = "sk_pizza_order_alerts_v3";
    private static android.media.MediaPlayer activeMediaPlayer = null;

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        Log.d(TAG, "From: " + remoteMessage.getFrom());

        String title = "🚨 NEW ORDER RECEIVED! — SK Pizza Point";
        String body = "A new customer order has been placed. Tap to view kitchen details.";

        if (remoteMessage.getData().size() > 0) {
            if (remoteMessage.getData().containsKey("title")) {
                title = remoteMessage.getData().get("title");
            }
            if (remoteMessage.getData().containsKey("body")) {
                body = remoteMessage.getData().get("body");
            }
        } else if (remoteMessage.getNotification() != null) {
            if (remoteMessage.getNotification().getTitle() != null) {
                title = remoteMessage.getNotification().getTitle();
            }
            if (remoteMessage.getNotification().getBody() != null) {
                body = remoteMessage.getNotification().getBody();
            }
        }

        // 1. Wake up screen immediately even when mobile screen is OFF or locked
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                PowerManager.WakeLock wakeLock = pm.newWakeLock(
                        PowerManager.FULL_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE,
                        "SKPizzaPoint:NewOrderAlertWake");
                wakeLock.acquire(30000); // 30 seconds
            }
        } catch (Exception e) {
            Log.w(TAG, "WakeLock error", e);
        }

        showNotification(title, body);
    }

    private void showNotification(String title, String body) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, (int) System.currentTimeMillis(), intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

        Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (defaultSoundUri == null) {
            defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
        }
        if (defaultSoundUri == null) {
            defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        }

        // 2. Play loud alarm using AudioAttributes.USAGE_ALARM (rings even in silent/vibrate mode)
        try {
            if (activeMediaPlayer != null) {
                try {
                    activeMediaPlayer.stop();
                    activeMediaPlayer.release();
                } catch (Exception ignored) {}
                activeMediaPlayer = null;
            }

            activeMediaPlayer = new android.media.MediaPlayer();
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .build();
            activeMediaPlayer.setAudioAttributes(audioAttributes);
            activeMediaPlayer.setDataSource(getApplicationContext(), defaultSoundUri);
            activeMediaPlayer.setLooping(false);
            activeMediaPlayer.prepare();
            activeMediaPlayer.start();
        } catch (Exception e) {
            Log.w(TAG, "MediaPlayer play failed, falling back to Ringtone", e);
            try {
                android.media.Ringtone ringtone = RingtoneManager.getRingtone(getApplicationContext(), defaultSoundUri);
                if (ringtone != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        ringtone.setAudioAttributes(new AudioAttributes.Builder()
                                .setUsage(AudioAttributes.USAGE_ALARM)
                                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                                .build());
                    }
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                        ringtone.setVolume(1.0f);
                    }
                    ringtone.play();
                }
            } catch (Exception ignored) {}
        }

        // 3. Strong vibration pattern
        long[] vibrationPattern = new long[]{0, 1000, 500, 1000, 500, 1000, 500, 1000};
        try {
            android.os.Vibrator vibrator = (android.os.Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(android.os.VibrationEffect.createWaveform(vibrationPattern, -1));
                } else {
                    vibrator.vibrate(vibrationPattern, -1);
                }
            }
        } catch (Exception ignored) {}

        NotificationCompat.Builder notificationBuilder =
                new NotificationCompat.Builder(this, CHANNEL_ID)
                        .setSmallIcon(R.mipmap.ic_launcher)
                        .setContentTitle(title)
                        .setContentText(body)
                        .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                        .setAutoCancel(true)
                        .setSound(defaultSoundUri)
                        .setVibrate(vibrationPattern)
                        .setPriority(NotificationCompat.PRIORITY_MAX)
                        .setCategory(NotificationCompat.CATEGORY_ALARM)
                        .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                        .setContentIntent(pendingIntent)
                        .setFullScreenIntent(pendingIntent, true); // Crucial for lock screen heads-up popup!

        NotificationManager notificationManager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && notificationManager != null) {
            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .build();

            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "SK Pizza Point Urgent Order Alarms",
                    NotificationManager.IMPORTANCE_HIGH);
            channel.setDescription("Critical heads-up sound and vibration alerts for incoming customer orders");
            channel.enableVibration(true);
            channel.setVibrationPattern(vibrationPattern);
            channel.setSound(defaultSoundUri, audioAttributes);
            channel.setBypassDnd(true);
            channel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
            notificationManager.createNotificationChannel(channel);
        }

        if (notificationManager != null) {
            notificationManager.notify((int) (System.currentTimeMillis() % 100000), notificationBuilder.build());
        }
    }

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        Log.d(TAG, "Refreshed FCM Token: " + token);
        MainActivity.registerAdminFcmToken(token);
    }
}
