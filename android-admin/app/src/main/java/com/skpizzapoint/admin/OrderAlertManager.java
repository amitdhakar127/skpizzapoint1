package com.skpizzapoint.admin;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.ToneGenerator;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import androidx.core.app.NotificationCompat;

public class OrderAlertManager {
    private static final String CHANNEL_ID = "sk_pizza_order_alerts";
    private static final int NOTIFICATION_ID = 9001;

    private static OrderAlertManager instance;
    private final Context context;
    private boolean isAlarmPlaying = false;
    private ToneGenerator toneGenerator;
    private Vibrator vibrator;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private Runnable toneRunnable;

    private OrderAlertManager(Context context) {
        this.context = context.getApplicationContext();
        createNotificationChannel();
        initVibrator();
    }

    public static synchronized OrderAlertManager getInstance(Context context) {
        if (instance == null) {
            instance = new OrderAlertManager(context);
        }
        return instance;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = context.getString(R.string.channel_name);
            String description = context.getString(R.string.channel_desc);
            int importance = NotificationManager.IMPORTANCE_HIGH;
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
            channel.setDescription(description);
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 600, 200, 600, 200});

            NotificationManager notificationManager = context.getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    private void initVibrator() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            VibratorManager vibratorManager = (VibratorManager) context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
            if (vibratorManager != null) {
                vibrator = vibratorManager.getDefaultVibrator();
            }
        } else {
            vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
        }
    }

    public synchronized void startContinuousOrderAlarm(String orderId, String customerName, double amount) {
        if (isAlarmPlaying) return;
        isAlarmPlaying = true;

        // Initialize loud high-volume alert tone generator
        try {
            toneGenerator = new ToneGenerator(AudioManager.STREAM_ALARM, 100);
        } catch (Exception e) {
            try {
                toneGenerator = new ToneGenerator(AudioManager.STREAM_NOTIFICATION, 100);
            } catch (Exception ignored) {}
        }

        // Loop the alternating emergency siren tones until stopped
        toneRunnable = new Runnable() {
            private boolean toggle = false;
            @Override
            public void run() {
                if (!isAlarmPlaying) return;
                try {
                    if (toneGenerator != null) {
                        toneGenerator.startTone(toggle ? ToneGenerator.TONE_CDMA_EMERGENCY_RINGBACK : ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 400);
                    }
                } catch (Exception ignored) {}
                toggle = !toggle;
                handler.postDelayed(this, 500);
            }
        };
        handler.post(toneRunnable);

        // Continuous high vibration pattern
        if (vibrator != null && vibrator.hasVibrator()) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(new long[]{0, 500, 250, 500, 250}, 0));
                } else {
                    vibrator.vibrate(new long[]{0, 500, 250, 500, 250}, 0);
                }
            } catch (Exception ignored) {}
        }

        // Display High-priority Heads-up Notification
        showHighPriorityNotification(orderId, customerName, amount);
    }

    public synchronized void stopAlarm() {
        isAlarmPlaying = false;
        if (toneRunnable != null) {
            handler.removeCallbacks(toneRunnable);
            toneRunnable = null;
        }
        if (toneGenerator != null) {
            try {
                toneGenerator.stopTone();
                toneGenerator.release();
            } catch (Exception ignored) {}
            toneGenerator = null;
        }
        if (vibrator != null) {
            try {
                vibrator.cancel();
            } catch (Exception ignored) {}
        }

        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.cancel(NOTIFICATION_ID);
        }
    }

    public boolean isAlarmPlaying() {
        return isAlarmPlaying;
    }

    private void showHighPriorityNotification(String orderId, String customerName, double amount) {
        Intent intent = new Intent(context, AdminMainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 0, intent,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE : PendingIntent.FLAG_UPDATE_CURRENT
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_launcher_foreground)
                .setContentTitle("🚨 NEW ORDER: " + orderId)
                .setContentText(customerName + " • ₹" + Math.round(amount) + " (Tap to view & stop alarm)")
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setAutoCancel(false)
                .setOngoing(true)
                .setContentIntent(pendingIntent);

        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.notify(NOTIFICATION_ID, builder.build());
        }
    }
}
