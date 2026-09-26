package com.skpizzapoint.admin;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.LinearLayout;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import com.google.android.material.button.MaterialButton;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.skpizzapoint.admin.models.OrderItemModel;
import com.skpizzapoint.admin.models.OrderModel;
import java.util.HashMap;
import java.util.Map;

public class OrderDetailActivity extends AppCompatActivity {

    private OrderModel order;
    private DatabaseReference mDatabase;
    private Spinner spinnerOrderStatus;
    private final String[] statuses = {"Pending", "Preparing", "Out for Delivery", "Delivered", "Cancelled"};

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_order_detail);

        order = (OrderModel) getIntent().getSerializableExtra("order");
        if (order == null) {
            Toast.makeText(this, "Order data missing", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        mDatabase = FirebaseDatabase.getInstance().getReference().child(FirebaseConstants.PATH_ORDERS).child(order.getId());

        Toolbar toolbar = findViewById(R.id.toolbar);
        toolbar.setTitle("Manage Order #" + (order.getId().length() > 8 ? order.getId().substring(0, 8) + "..." : order.getId()));
        toolbar.setNavigationOnClickListener(v -> finish());

        bindOrderData();
    }

    private void bindOrderData() {
        TextView tvDetailOrderId = findViewById(R.id.tvDetailOrderId);
        TextView tvDetailOrderTime = findViewById(R.id.tvDetailOrderTime);
        spinnerOrderStatus = findViewById(R.id.spinnerOrderStatus);
        TextView tvDetailCustomerName = findViewById(R.id.tvDetailCustomerName);
        TextView tvDetailCustomerPhone = findViewById(R.id.tvDetailCustomerPhone);
        TextView tvDetailAddress = findViewById(R.id.tvDetailAddress);
        TextView tvDetailCoordinates = findViewById(R.id.tvDetailCoordinates);
        TextView tvDetailPaymentMethod = findViewById(R.id.tvDetailPaymentMethod);
        TextView tvDetailUtrNumber = findViewById(R.id.tvDetailUtrNumber);
        MaterialButton btnTogglePaymentVerify = findViewById(R.id.btnTogglePaymentVerify);
        LinearLayout layoutOrderItemsList = findViewById(R.id.layoutOrderItemsList);
        TextView tvDetailFinalTotal = findViewById(R.id.tvDetailFinalTotal);
        MaterialButton btnCallCustomer = findViewById(R.id.btnCallCustomer);
        MaterialButton btnWhatsAppCustomer = findViewById(R.id.btnWhatsAppCustomer);
        MaterialButton btnOpenGoogleMaps = findViewById(R.id.btnOpenGoogleMaps);
        MaterialButton btnSaveOrderStatus = findViewById(R.id.btnSaveOrderStatus);

        tvDetailOrderId.setText("Order #" + order.getId());
        tvDetailOrderTime.setText("Placed at: " + (order.getCreatedAt().isEmpty() ? "Recently" : order.getCreatedAt()));

        // Status Spinner
        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, statuses);
        spinnerOrderStatus.setAdapter(adapter);
        for (int i = 0; i < statuses.length; i++) {
            if (statuses[i].equalsIgnoreCase(order.getStatus())) {
                spinnerOrderStatus.setSelection(i);
                break;
            }
        }

        tvDetailCustomerName.setText(order.getCustomerName());
        tvDetailCustomerPhone.setText(order.getCustomerPhone().isEmpty() ? "No phone" : order.getCustomerPhone());
        tvDetailAddress.setText(order.getDeliveryAddress());

        if (order.getLatitude() != null && order.getLongitude() != null) {
            tvDetailCoordinates.setText(String.format("📍 GPS Coords: %.5f, %.5f (Live Pinned)", order.getLatitude(), order.getLongitude()));
        } else {
            tvDetailCoordinates.setText("📍 GPS Pin: Address based");
        }

        tvDetailPaymentMethod.setText("Payment Method: " + order.getPaymentMode());
        tvDetailFinalTotal.setText("₹" + Math.round(order.getFinalTotal()));

        boolean isVerified = "Verified".equalsIgnoreCase(order.getPaymentStatus()) || "Paid Online".equalsIgnoreCase(order.getPaymentStatus());
        updatePaymentButtonUI(btnTogglePaymentVerify, isVerified);

        btnTogglePaymentVerify.setOnClickListener(v -> {
            boolean currentVerified = "Verified".equalsIgnoreCase(order.getPaymentStatus()) || "Paid Online".equalsIgnoreCase(order.getPaymentStatus());
            String newStatus = currentVerified ? "Pending" : "Verified";
            order.setPaymentStatus(newStatus);
            updatePaymentButtonUI(btnTogglePaymentVerify, !currentVerified);
            mDatabase.child("paymentStatus").setValue(newStatus)
                    .addOnSuccessListener(aVoid -> Toast.makeText(OrderDetailActivity.this, "Payment status updated to: " + newStatus, Toast.LENGTH_SHORT).show());
        });

        // Items list dynamic rendering
        layoutOrderItemsList.removeAllViews();
        for (OrderItemModel item : order.getItems()) {
            View itemView = LayoutInflater.from(this).inflate(android.R.layout.simple_list_item_2, layoutOrderItemsList, false);
            TextView text1 = itemView.findViewById(android.R.id.text1);
            TextView text2 = itemView.findViewById(android.R.id.text2);

            text1.setText(item.getQuantity() + "x " + item.getProductName() + " (" + item.getSize() + ")");
            text1.setTextColor(getResources().getColor(R.color.white));
            text1.setTextSize(14f);

            text2.setText("Price: ₹" + Math.round(item.getTotalPrice()));
            text2.setTextColor(getResources().getColor(R.color.primary));
            text2.setTextSize(12f);

            layoutOrderItemsList.addView(itemView);
        }

        // Call button
        btnCallCustomer.setOnClickListener(v -> {
            if (!order.getCustomerPhone().isEmpty()) {
                Intent intent = new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + order.getCustomerPhone()));
                startActivity(intent);
            } else {
                Toast.makeText(this, "No phone number available", Toast.LENGTH_SHORT).show();
            }
        });

        // WhatsApp button
        btnWhatsAppCustomer.setOnClickListener(v -> {
            String phone = order.getCustomerPhone().replaceAll("[^0-9]", "");
            if (phone.length() == 10) phone = "91" + phone;
            if (!phone.isEmpty()) {
                try {
                    String msg = "Hello " + order.getCustomerName() + "! We are preparing your order #" + order.getId() + " at SK Pizza Point.";
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/" + phone + "?text=" + Uri.encode(msg)));
                    startActivity(intent);
                } catch (Exception e) {
                    Toast.makeText(this, "WhatsApp not installed", Toast.LENGTH_SHORT).show();
                }
            }
        });

        // Google Maps Navigation button
        btnOpenGoogleMaps.setOnClickListener(v -> {
            Uri gmmIntentUri;
            if (order.getLatitude() != null && order.getLongitude() != null) {
                gmmIntentUri = Uri.parse("google.navigation:q=" + order.getLatitude() + "," + order.getLongitude());
            } else {
                gmmIntentUri = Uri.parse("geo:0,0?q=" + Uri.encode(order.getDeliveryAddress()));
            }
            Intent mapIntent = new Intent(Intent.ACTION_VIEW, gmmIntentUri);
            mapIntent.setPackage("com.google.android.apps.maps");
            if (mapIntent.resolveActivity(getPackageManager()) != null) {
                startActivity(mapIntent);
            } else {
                // Fallback to generic browser / map viewer
                Intent fallback = new Intent(Intent.ACTION_VIEW, Uri.parse("https://www.google.com/maps/search/?api=1&query=" + Uri.encode(order.getDeliveryAddress())));
                startActivity(fallback);
            }
        });

        // Save status button
        btnSaveOrderStatus.setOnClickListener(v -> {
            String selectedStatus = spinnerOrderStatus.getSelectedItem().toString();
            order.setStatus(selectedStatus);

            Map<String, Object> updates = new HashMap<>();
            updates.put("status", selectedStatus);
            updates.put("paymentStatus", order.getPaymentStatus());

            mDatabase.updateChildren(updates)
                    .addOnSuccessListener(aVoid -> {
                        Toast.makeText(OrderDetailActivity.this, "Order updated successfully to " + selectedStatus, Toast.LENGTH_SHORT).show();
                        finish();
                    })
                    .addOnFailureListener(e -> Toast.makeText(OrderDetailActivity.this, "Failed to update: " + e.getMessage(), Toast.LENGTH_SHORT).show());
        });
    }

    private void updatePaymentButtonUI(MaterialButton btn, boolean isVerified) {
        if (isVerified) {
            btn.setText("Payment Verified ✓ (Tap to toggle)");
            btn.setBackgroundColor(getResources().getColor(R.color.green_verified));
        } else {
            btn.setText("Mark Payment as Verified");
            btn.setBackgroundColor(getResources().getColor(R.color.primary));
        }
    }
}
