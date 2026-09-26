package com.skpizzapoint.admin.models;

import java.io.Serializable;

public class OrderItemModel implements Serializable {
    private String productId;
    private String productName;
    private String size;
    private int quantity = 1;
    private double unitPrice;
    private double totalPrice;

    public OrderItemModel() {}

    public String getProductId() { return productId != null ? productId : ""; }
    public void setProductId(String productId) { this.productId = productId; }

    public String getProductName() { return productName != null ? productName : "Pizza Item"; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getSize() { return size != null ? size : "Regular"; }
    public void setSize(String size) { this.size = size; }

    public int getQuantity() { return quantity > 0 ? quantity : 1; }
    public void setQuantity(int quantity) { this.quantity = quantity; }

    public double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(double unitPrice) { this.unitPrice = unitPrice; }

    public double getTotalPrice() { return totalPrice > 0 ? totalPrice : (unitPrice * quantity); }
    public void setTotalPrice(double totalPrice) { this.totalPrice = totalPrice; }
}
