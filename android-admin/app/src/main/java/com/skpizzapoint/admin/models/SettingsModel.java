package com.skpizzapoint.admin.models;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

public class SettingsModel implements Serializable {
    private boolean isStoreOpen = true;
    private String upiId = "skpizzapoint@okaxis";
    private String phone = "+91 9876543210";
    private double deliveryFee = 40.0;
    private double freeDeliveryThreshold = 499.0;
    private double minOrderValue = 150.0;

    public SettingsModel() {}

    public boolean isStoreOpen() { return isStoreOpen; }
    public void setStoreOpen(boolean storeOpen) { isStoreOpen = storeOpen; }

    public String getUpiId() { return upiId != null ? upiId : ""; }
    public void setUpiId(String upiId) { this.upiId = upiId; }

    public String getPhone() { return phone != null ? phone : ""; }
    public void setPhone(String phone) { this.phone = phone; }

    public double getDeliveryFee() { return deliveryFee; }
    public void setDeliveryFee(double deliveryFee) { this.deliveryFee = deliveryFee; }

    public double getFreeDeliveryThreshold() { return freeDeliveryThreshold; }
    public void setFreeDeliveryThreshold(double freeDeliveryThreshold) { this.freeDeliveryThreshold = freeDeliveryThreshold; }

    public double getMinOrderValue() { return minOrderValue; }
    public void setMinOrderValue(double minOrderValue) { this.minOrderValue = minOrderValue; }

    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("isStoreOpen", isStoreOpen());
        map.put("upiId", getUpiId());
        map.put("phone", getPhone());
        map.put("deliveryFee", getDeliveryFee());
        map.put("freeDeliveryThreshold", getFreeDeliveryThreshold());
        map.put("minOrderValue", getMinOrderValue());
        return map;
    }
}
