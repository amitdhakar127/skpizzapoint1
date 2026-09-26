package com.skpizzapoint.admin;

import android.app.Application;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.database.FirebaseDatabase;

public class SKPizzaAdminApp extends Application {
    @Override
    public void onCreate() {
        super.onCreate();

        // Initialize Firebase with fallback if not already initialized
        if (FirebaseApp.getApps(this).isEmpty()) {
            FirebaseOptions options = new FirebaseOptions.Builder()
                    .setProjectId("sk-pizza-point")
                    .setApplicationId("1:336176195310:android:34a9b6c123ef890a")
                    .setApiKey("AIzaSyCCYR2QyIICr9wbS-P5X1m9860TSmmnHco")
                    .setDatabaseUrl("https://sk-pizza-point-default-rtdb.asia-southeast1.firebasedatabase.app")
                    .setStorageBucket("sk-pizza-point.firebasestorage.app")
                    .setGcmSenderId("336176195310")
                    .build();
            FirebaseApp.initializeApp(this, options);
        }

        try {
            // Enable offline disk persistence for robust network tolerance
            FirebaseDatabase.getInstance().setPersistenceEnabled(true);
        } catch (Exception ignored) {
            // Might throw if already initialized
        }

        // Pre-warm Order Alert notification channel
        OrderAlertManager.getInstance(this);
    }
}
