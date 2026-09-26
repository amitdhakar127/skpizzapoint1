package com.skpizzapoint.admin.models;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

public class ProductModel implements Serializable {
    private String id;
    private String name;
    private String category;
    private double price;
    private String description;
    private String image;
    private boolean isVeg = true;
    private boolean available = true;
    private boolean featured = false;

    public ProductModel() {
        // Required for Firebase
    }

    public ProductModel(String id, String name, String category, double price, String description, String image, boolean isVeg, boolean available) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.price = price;
        this.description = description;
        this.image = image;
        this.isVeg = isVeg;
        this.available = available;
    }

    public String getId() { return id != null ? id : ""; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name != null ? name : ""; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category != null ? category : "Veg Pizza"; }
    public void setCategory(String category) { this.category = category; }

    public double getPrice() { return price; }
    public void setPrice(double price) { this.price = price; }

    public String getDescription() { return description != null ? description : ""; }
    public void setDescription(String description) { this.description = description; }

    public String getImage() { return image != null ? image : ""; }
    public void setImage(String image) { this.image = image; }

    public boolean isVeg() { return isVeg; }
    public void setVeg(boolean veg) { isVeg = veg; }

    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    public boolean isFeatured() { return featured; }
    public void setFeatured(boolean featured) { this.featured = featured; }

    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("id", getId());
        map.put("name", getName());
        map.put("category", getCategory());
        map.put("price", getPrice());
        map.put("description", getDescription());
        map.put("image", getImage());
        map.put("isVeg", isVeg());
        map.put("available", isAvailable());
        map.put("featured", isFeatured());
        return map;
    }
}
