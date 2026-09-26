package com.skpizzapoint.admin.models;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class OrderModel implements Serializable {
    private String id;
    private String customerName;
    private String customerPhone;
    private String deliveryAddress;
    private String orderType;
    private double subtotal;
    private double deliveryFee;
    private double finalTotal;
    private String paymentMode;
    private String paymentStatus;
    private String status;
    private String createdAt;
    private Double latitude;
    private Double longitude;
    private List<OrderItemModel> items = new ArrayList<>();

    public OrderModel() {
        // Default constructor
    }

    public String getId() { return id != null ? id : ""; }
    public void setId(String id) { this.id = id; }

    public String getCustomerName() { return customerName != null ? customerName : "Valued Customer"; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhone() { return customerPhone != null ? customerPhone : ""; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getDeliveryAddress() { return deliveryAddress != null ? deliveryAddress : "Direct Counter / Pickup"; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }

    public String getOrderType() { return orderType != null ? orderType : "delivery"; }
    public void setOrderType(String orderType) { this.orderType = orderType; }

    public double getSubtotal() { return subtotal; }
    public void setSubtotal(double subtotal) { this.subtotal = subtotal; }

    public double getDeliveryFee() { return deliveryFee; }
    public void setDeliveryFee(double deliveryFee) { this.deliveryFee = deliveryFee; }

    public double getFinalTotal() { return finalTotal; }
    public void setFinalTotal(double finalTotal) { this.finalTotal = finalTotal; }

    public String getPaymentMode() { return paymentMode != null ? paymentMode : "Online UPI"; }
    public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }

    public String getPaymentStatus() { return paymentStatus != null ? paymentStatus : "Pending"; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getStatus() { return status != null ? status : "Pending"; }
    public void setStatus(String status) { this.status = status; }

    public String getCreatedAt() { return createdAt != null ? createdAt : ""; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public List<OrderItemModel> getItems() { return items != null ? items : new ArrayList<OrderItemModel>(); }
    public void setItems(List<OrderItemModel> items) { this.items = items; }

    public String getSummaryText() {
        if (items == null || items.isEmpty()) {
            return "1 Food Order";
        }
        StringBuilder sb = new StringBuilder();
        sb.append(items.size()).append(" Items (");
        for (int i = 0; i < items.size(); i++) {
            sb.append(items.get(i).getProductName());
            if (i < items.size() - 1 && i < 2) {
                sb.append(", ");
            } else if (i == 2 && items.size() > 3) {
                sb.append("...");
                break;
            }
        }
        sb.append(")");
        return sb.toString();
    }
}
