package com.skpizzapoint.admin;

import android.text.TextUtils;

public class FirebaseConstants {
    // Official SK Pizza Point Authorized Admin UID
    public static final String AUTHORIZED_ADMIN_UID = "vxIlz4pYZgM646mXmp2BQuXtYz32";

    // Authorized Admin Email list
    public static final String[] AUTHORIZED_ADMIN_EMAILS = {
        "zyvoraofficial3@gmail.com",
        "skpizzapoint@gmail.com"
    };

    // Firebase Realtime Database Paths
    public static final String PATH_ORDERS = "orders";
    public static final String PATH_PRODUCTS = "products";
    public static final String PATH_SETTINGS = "settings";

    public static boolean isUserAuthorizedAdmin(String uid, String email) {
        if (!TextUtils.isEmpty(uid) && uid.trim().equals(AUTHORIZED_ADMIN_UID.trim())) {
            return true;
        }
        if (!TextUtils.isEmpty(email)) {
            String cleanEmail = email.trim().toLowerCase();
            for (String adminEmail : AUTHORIZED_ADMIN_EMAILS) {
                if (cleanEmail.equals(adminEmail.toLowerCase())) {
                    return true;
                }
            }
            if (cleanEmail.startsWith("admin@skpizza")) {
                return true;
            }
        }
        return false;
    }
}
