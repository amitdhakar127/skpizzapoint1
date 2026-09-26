package com.skpizzapoint.admin;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.chip.ChipGroup;
import com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton;
import com.google.android.material.switchmaterial.SwitchMaterial;
import com.google.android.material.textfield.TextInputEditText;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;
import com.skpizzapoint.admin.adapters.OrdersAdapter;
import com.skpizzapoint.admin.adapters.ProductsAdapter;
import com.skpizzapoint.admin.models.OrderItemModel;
import com.skpizzapoint.admin.models.OrderModel;
import com.skpizzapoint.admin.models.ProductModel;
import com.skpizzapoint.admin.models.SettingsModel;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class AdminMainActivity extends AppCompatActivity {

    private FirebaseAuth mAuth;
    private DatabaseReference mDatabase;
    private OrderAlertManager alertManager;

    // UI elements
    private LinearLayout alarmBanner;
    private TextView tvAlarmText;
    private MaterialButton btnStopAlarm, btnMuteToggle;
    private FrameLayout fragmentContainer;
    private BottomNavigationView bottomNav;

    // Tabs views
    private View ordersView;
    private View productsView;
    private View settingsView;

    // Orders tab components
    private OrdersAdapter ordersAdapter;
    private final List<OrderModel> ordersList = new ArrayList<>();
    private final Set<String> knownOrderIds = new HashSet<>();
    private boolean isInitialOrdersLoad = true;
    private boolean isSoundMuted = false;

    // Products tab components
    private ProductsAdapter productsAdapter;
    private final List<ProductModel> productsList = new ArrayList<>();
    private TextView tvProductCount;

    // Settings tab components
    private SettingsModel currentSettings = new SettingsModel();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_admin_main);

        mAuth = FirebaseAuth.getInstance();
        FirebaseUser user = mAuth.getCurrentUser();
        if (user == null || !FirebaseConstants.isUserAuthorizedAdmin(user.getUid(), user.getEmail())) {
            // Not authorized, redirect to login
            startActivity(new Intent(this, LoginActivity.class));
            finish();
            return;
        }

        mDatabase = FirebaseDatabase.getInstance().getReference();
        alertManager = OrderAlertManager.getInstance(this);

        initViews();
        setupTabs();
        startOrdersRealtimeListener();
        startProductsRealtimeListener();
        startSettingsRealtimeListener();
    }

    private void initViews() {
        alarmBanner = findViewById(R.id.alarmBanner);
        tvAlarmText = findViewById(R.id.tvAlarmText);
        btnStopAlarm = findViewById(R.id.btnStopAlarm);
        btnMuteToggle = findViewById(R.id.btnMuteToggle);
        fragmentContainer = findViewById(R.id.fragmentContainer);
        bottomNav = findViewById(R.id.bottomNav);

        btnStopAlarm.setOnClickListener(v -> stopAlarmAction());

        btnMuteToggle.setOnClickListener(v -> {
            isSoundMuted = !isSoundMuted;
            if (isSoundMuted) {
                alertManager.stopAlarm();
                btnMuteToggle.setText("🔇 MUTED");
                alarmBanner.setVisibility(View.GONE);
                Toast.makeText(this, "Audio alert muted", Toast.LENGTH_SHORT).show();
            } else {
                btnMuteToggle.setText("🔔 SOUND");
                Toast.makeText(this, "Audio alert enabled", Toast.LENGTH_SHORT).show();
            }
        });

        findViewById(R.id.btnLogout).setOnClickListener(v -> {
            new AlertDialog.Builder(this)
                    .setTitle("Logout")
                    .setMessage("Are you sure you want to sign out from the Admin Console?")
                    .setPositiveButton("Logout", (dialog, which) -> {
                        alertManager.stopAlarm();
                        mAuth.signOut();
                        startActivity(new Intent(AdminMainActivity.this, LoginActivity.class));
                        finish();
                    })
                    .setNegativeButton("Cancel", null)
                    .show();
        });
    }

    private void stopAlarmAction() {
        alertManager.stopAlarm();
        alarmBanner.setVisibility(View.GONE);
        Toast.makeText(this, "Alarm stopped", Toast.LENGTH_SHORT).show();
    }

    private void setupTabs() {
        LayoutInflater inflater = LayoutInflater.from(this);
        ordersView = inflater.inflate(R.layout.fragment_orders, fragmentContainer, false);
        productsView = inflater.inflate(R.layout.fragment_products, fragmentContainer, false);
        settingsView = inflater.inflate(R.layout.fragment_settings, fragmentContainer, false);

        setupOrdersTab();
        setupProductsTab();
        setupSettingsTab();

        // Default to orders view
        showTab(ordersView);

        bottomNav.setOnItemSelectedListener(item -> {
            int itemId = item.getItemId();
            if (itemId == R.id.nav_orders) {
                showTab(ordersView);
                return true;
            } else if (itemId == R.id.nav_products) {
                showTab(productsView);
                return true;
            } else if (itemId == R.id.nav_settings) {
                showTab(settingsView);
                return true;
            }
            return false;
        });
    }

    private void showTab(View view) {
        fragmentContainer.removeAllViews();
        fragmentContainer.addView(view);
    }

    // =========================================================================
    // ORDERS TAB SETUP & REALTIME LISTENER
    // =========================================================================
    private void setupOrdersTab() {
        RecyclerView rvOrders = ordersView.findViewById(R.id.rvOrders);
        SwipeRefreshLayout swipeRefresh = ordersView.findViewById(R.id.swipeRefresh);
        ChipGroup chipGroup = ordersView.findViewById(R.id.chipGroupStatus);
        TextView tvEmptyState = ordersView.findViewById(R.id.tvEmptyState);

        ordersAdapter = new OrdersAdapter(this, order -> {
            Intent intent = new Intent(AdminMainActivity.this, OrderDetailActivity.class);
            intent.putExtra("order", order);
            startActivity(intent);
        });

        rvOrders.setLayoutManager(new LinearLayoutManager(this));
        rvOrders.setAdapter(ordersAdapter);

        swipeRefresh.setOnRefreshListener(() -> {
            swipeRefresh.setRefreshing(false);
            Toast.makeText(AdminMainActivity.this, "Synced with live database", Toast.LENGTH_SHORT).show();
        });

        chipGroup.setOnCheckedStateChangeListener((group, checkedIds) -> {
            if (checkedIds.contains(R.id.chipPending)) {
                ordersAdapter.applyFilter("Pending");
            } else if (checkedIds.contains(R.id.chipPreparing)) {
                ordersAdapter.applyFilter("Preparing");
            } else if (checkedIds.contains(R.id.chipOut)) {
                ordersAdapter.applyFilter("Out for Delivery");
            } else if (checkedIds.contains(R.id.chipDelivered)) {
                ordersAdapter.applyFilter("Delivered");
            } else {
                ordersAdapter.applyFilter("All Orders");
            }
            tvEmptyState.setVisibility(ordersAdapter.getItemCount() == 0 ? View.VISIBLE : View.GONE);
        });
    }

    private void startOrdersRealtimeListener() {
        mDatabase.child(FirebaseConstants.PATH_ORDERS).addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                ordersList.clear();
                boolean hasNewPendingOrder = false;
                OrderModel latestPendingOrder = null;

                for (DataSnapshot orderSnap : snapshot.getChildren()) {
                    try {
                        OrderModel order = new OrderModel();
                        order.setId(orderSnap.getKey());

                        if (orderSnap.child("customerName").exists()) {
                            order.setCustomerName(orderSnap.child("customerName").getValue(String.class));
                        }
                        if (orderSnap.child("customerPhone").exists()) {
                            order.setCustomerPhone(String.valueOf(orderSnap.child("customerPhone").getValue()));
                        }
                        if (orderSnap.child("deliveryAddress").exists()) {
                            order.setDeliveryAddress(orderSnap.child("deliveryAddress").getValue(String.class));
                        }
                        if (orderSnap.child("orderType").exists()) {
                            order.setOrderType(orderSnap.child("orderType").getValue(String.class));
                        }
                        if (orderSnap.child("status").exists()) {
                            order.setStatus(orderSnap.child("status").getValue(String.class));
                        }
                        if (orderSnap.child("paymentMode").exists()) {
                            order.setPaymentMode(orderSnap.child("paymentMode").getValue(String.class));
                        }
                        if (orderSnap.child("paymentStatus").exists()) {
                            order.setPaymentStatus(orderSnap.child("paymentStatus").getValue(String.class));
                        }
                        if (orderSnap.child("createdAt").exists()) {
                            order.setCreatedAt(orderSnap.child("createdAt").getValue(String.class));
                        }
                        if (orderSnap.child("finalTotal").exists()) {
                            Object val = orderSnap.child("finalTotal").getValue();
                            if (val instanceof Number) {
                                order.setFinalTotal(((Number) val).doubleValue());
                            }
                        }
                        if (orderSnap.child("subtotal").exists()) {
                            Object val = orderSnap.child("subtotal").getValue();
                            if (val instanceof Number) {
                                order.setSubtotal(((Number) val).doubleValue());
                            }
                        }
                        if (orderSnap.child("deliveryFee").exists()) {
                            Object val = orderSnap.child("deliveryFee").getValue();
                            if (val instanceof Number) {
                                order.setDeliveryFee(((Number) val).doubleValue());
                            }
                        }

                        // Parse GPS location coordinates if present
                        if (orderSnap.child("customerLocation").exists()) {
                            DataSnapshot locSnap = orderSnap.child("customerLocation");
                            if (locSnap.child("latitude").exists()) {
                                order.setLatitude(((Number) locSnap.child("latitude").getValue()).doubleValue());
                            }
                            if (locSnap.child("longitude").exists()) {
                                order.setLongitude(((Number) locSnap.child("longitude").getValue()).doubleValue());
                            }
                        }

                        // Parse Items
                        if (orderSnap.child("items").exists()) {
                            List<OrderItemModel> items = new ArrayList<>();
                            for (DataSnapshot itemSnap : orderSnap.child("items").getChildren()) {
                                OrderItemModel item = new OrderItemModel();
                                if (itemSnap.child("productName").exists()) {
                                    item.setProductName(itemSnap.child("productName").getValue(String.class));
                                }
                                if (itemSnap.child("size").exists()) {
                                    item.setSize(itemSnap.child("size").getValue(String.class));
                                }
                                if (itemSnap.child("quantity").exists()) {
                                    item.setQuantity(((Number) itemSnap.child("quantity").getValue()).intValue());
                                }
                                if (itemSnap.child("totalPrice").exists()) {
                                    item.setTotalPrice(((Number) itemSnap.child("totalPrice").getValue()).doubleValue());
                                }
                                items.add(item);
                            }
                            order.setItems(items);
                        }

                        ordersList.add(order);

                        // Check if this is a newly arrived order that wasn't in known ids
                        if (!isInitialOrdersLoad && !knownOrderIds.contains(order.getId()) && "Pending".equalsIgnoreCase(order.getStatus())) {
                            hasNewPendingOrder = true;
                            latestPendingOrder = order;
                        }
                        knownOrderIds.add(order.getId());
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }

                // Sort orders newest first
                Collections.reverse(ordersList);
                ordersAdapter.setOrders(ordersList);

                // Ring repeating loud alarm for newly arrived orders
                if (hasNewPendingOrder && latestPendingOrder != null && !isSoundMuted) {
                    alarmBanner.setVisibility(View.VISIBLE);
                    tvAlarmText.setText("🚨 NEW ORDER: " + latestPendingOrder.getCustomerName() + " (₹" + Math.round(latestPendingOrder.getFinalTotal()) + ")");
                    alertManager.startContinuousOrderAlarm(latestPendingOrder.getId(), latestPendingOrder.getCustomerName(), latestPendingOrder.getFinalTotal());
                }

                isInitialOrdersLoad = false;
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                Toast.makeText(AdminMainActivity.this, "Database error: " + error.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    // =========================================================================
    // PRODUCTS TAB SETUP & REALTIME LISTENER
    // =========================================================================
    private void setupProductsTab() {
        RecyclerView rvProducts = productsView.findViewById(R.id.rvProducts);
        SwipeRefreshLayout swipeRefreshProducts = productsView.findViewById(R.id.swipeRefreshProducts);
        ExtendedFloatingActionButton fabAddProduct = productsView.findViewById(R.id.fabAddProduct);
        tvProductCount = productsView.findViewById(R.id.tvProductCount);

        productsAdapter = new ProductsAdapter(this, new ProductsAdapter.ProductActionListener() {
            @Override
            public void onToggleAvailability(ProductModel product, boolean isAvailable) {
                mDatabase.child(FirebaseConstants.PATH_PRODUCTS).child(product.getId()).child("available").setValue(isAvailable)
                        .addOnSuccessListener(aVoid -> Toast.makeText(AdminMainActivity.this, product.getName() + " is now " + (isAvailable ? "In Stock" : "Out of Stock"), Toast.LENGTH_SHORT).show())
                        .addOnFailureListener(e -> Toast.makeText(AdminMainActivity.this, "Failed to update stock: " + e.getMessage(), Toast.LENGTH_SHORT).show());
            }

            @Override
            public void onEditProduct(ProductModel product) {
                Intent intent = new Intent(AdminMainActivity.this, AddEditProductActivity.class);
                intent.putExtra("product", product);
                startActivity(intent);
            }

            @Override
            public void onDeleteProduct(ProductModel product) {
                new AlertDialog.Builder(AdminMainActivity.this)
                        .setTitle("Delete Product")
                        .setMessage("Are you sure you want to delete '" + product.getName() + "'?")
                        .setPositiveButton("Delete", (dialog, which) -> {
                            mDatabase.child(FirebaseConstants.PATH_PRODUCTS).child(product.getId()).removeValue()
                                    .addOnSuccessListener(aVoid -> Toast.makeText(AdminMainActivity.this, "Product removed", Toast.LENGTH_SHORT).show())
                                    .addOnFailureListener(e -> Toast.makeText(AdminMainActivity.this, "Failed to delete: " + e.getMessage(), Toast.LENGTH_SHORT).show());
                        })
                        .setNegativeButton("Cancel", null)
                        .show();
            }
        });

        rvProducts.setLayoutManager(new LinearLayoutManager(this));
        rvProducts.setAdapter(productsAdapter);

        swipeRefreshProducts.setOnRefreshListener(() -> {
            swipeRefreshProducts.setRefreshing(false);
            Toast.makeText(AdminMainActivity.this, "Catalog updated", Toast.LENGTH_SHORT).show();
        });

        fabAddProduct.setOnClickListener(v -> {
            Intent intent = new Intent(AdminMainActivity.this, AddEditProductActivity.class);
            startActivity(intent);
        });
    }

    private void startProductsRealtimeListener() {
        mDatabase.child(FirebaseConstants.PATH_PRODUCTS).addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                productsList.clear();
                for (DataSnapshot prodSnap : snapshot.getChildren()) {
                    try {
                        ProductModel prod = prodSnap.getValue(ProductModel.class);
                        if (prod != null) {
                            if (prod.getId().isEmpty()) {
                                prod.setId(prodSnap.getKey());
                            }
                            productsList.add(prod);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
                productsAdapter.setProducts(productsList);
                if (tvProductCount != null) {
                    tvProductCount.setText(productsList.size() + " Products");
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                // Ignore or log
            }
        });
    }

    // =========================================================================
    // STORE SETTINGS TAB SETUP & REALTIME LISTENER
    // =========================================================================
    private void setupSettingsTab() {
        TextView tvStoreStatusTitle = settingsView.findViewById(R.id.tvStoreStatusTitle);
        SwitchMaterial switchStoreOpen = settingsView.findViewById(R.id.switchStoreOpen);
        TextInputEditText etUpiId = settingsView.findViewById(R.id.etUpiId);
        TextInputEditText etPhone = settingsView.findViewById(R.id.etPhone);
        TextInputEditText etDeliveryFee = settingsView.findViewById(R.id.etDeliveryFee);
        TextInputEditText etFreeDeliveryThreshold = settingsView.findViewById(R.id.etFreeDeliveryThreshold);
        MaterialButton btnSaveSettings = settingsView.findViewById(R.id.btnSaveSettings);

        switchStoreOpen.setOnCheckedChangeListener((buttonView, isChecked) -> {
            tvStoreStatusTitle.setText(isChecked ? "Kitchen Status: OPEN" : "Kitchen Status: CLOSED");
            tvStoreStatusTitle.setTextColor(getResources().getColor(isChecked ? R.color.green_verified : R.color.accent));
            mDatabase.child(FirebaseConstants.PATH_SETTINGS).child("isStoreOpen").setValue(isChecked);
        });

        btnSaveSettings.setOnClickListener(v -> {
            String upi = etUpiId.getText() != null ? etUpiId.getText().toString().trim() : "";
            String phone = etPhone.getText() != null ? etPhone.getText().toString().trim() : "";
            double fee = 40.0;
            double threshold = 499.0;
            try {
                if (etDeliveryFee.getText() != null) {
                    fee = Double.parseDouble(etDeliveryFee.getText().toString().trim());
                }
                if (etFreeDeliveryThreshold.getText() != null) {
                    threshold = Double.parseDouble(etFreeDeliveryThreshold.getText().toString().trim());
                }
            } catch (Exception ignored) {}

            currentSettings.setUpiId(upi);
            currentSettings.setPhone(phone);
            currentSettings.setDeliveryFee(fee);
            currentSettings.setFreeDeliveryThreshold(threshold);
            currentSettings.setStoreOpen(switchStoreOpen.isChecked());

            mDatabase.child(FirebaseConstants.PATH_SETTINGS).setValue(currentSettings.toMap())
                    .addOnSuccessListener(aVoid -> Toast.makeText(AdminMainActivity.this, "Store Settings saved successfully!", Toast.LENGTH_SHORT).show())
                    .addOnFailureListener(e -> Toast.makeText(AdminMainActivity.this, "Save failed: " + e.getMessage(), Toast.LENGTH_SHORT).show());
        });
    }

    private void startSettingsRealtimeListener() {
        mDatabase.child(FirebaseConstants.PATH_SETTINGS).addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                if (snapshot.exists()) {
                    try {
                        Boolean isOpen = snapshot.child("isStoreOpen").getValue(Boolean.class);
                        String upi = snapshot.child("upiId").getValue(String.class);
                        String phone = snapshot.child("phone").getValue(String.class);
                        Number fee = snapshot.child("deliveryFee").getValue(Number.class);
                        Number threshold = snapshot.child("freeDeliveryThreshold").getValue(Number.class);

                        if (isOpen != null) currentSettings.setStoreOpen(isOpen);
                        if (upi != null) currentSettings.setUpiId(upi);
                        if (phone != null) currentSettings.setPhone(phone);
                        if (fee != null) currentSettings.setDeliveryFee(fee.doubleValue());
                        if (threshold != null) currentSettings.setFreeDeliveryThreshold(threshold.doubleValue());

                        updateSettingsUI();
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {}
        });
    }

    private void updateSettingsUI() {
        if (settingsView == null) return;
        TextView tvStoreStatusTitle = settingsView.findViewById(R.id.tvStoreStatusTitle);
        SwitchMaterial switchStoreOpen = settingsView.findViewById(R.id.switchStoreOpen);
        TextInputEditText etUpiId = settingsView.findViewById(R.id.etUpiId);
        TextInputEditText etPhone = settingsView.findViewById(R.id.etPhone);
        TextInputEditText etDeliveryFee = settingsView.findViewById(R.id.etDeliveryFee);
        TextInputEditText etFreeDeliveryThreshold = settingsView.findViewById(R.id.etFreeDeliveryThreshold);

        if (switchStoreOpen != null) switchStoreOpen.setChecked(currentSettings.isStoreOpen());
        if (tvStoreStatusTitle != null) {
            tvStoreStatusTitle.setText(currentSettings.isStoreOpen() ? "Kitchen Status: OPEN" : "Kitchen Status: CLOSED");
            tvStoreStatusTitle.setTextColor(getResources().getColor(currentSettings.isStoreOpen() ? R.color.green_verified : R.color.accent));
        }
        if (etUpiId != null && etUpiId.getText().toString().isEmpty()) etUpiId.setText(currentSettings.getUpiId());
        if (etPhone != null && etPhone.getText().toString().isEmpty()) etPhone.setText(currentSettings.getPhone());
        if (etDeliveryFee != null && etDeliveryFee.getText().toString().isEmpty()) etDeliveryFee.setText(String.valueOf(Math.round(currentSettings.getDeliveryFee())));
        if (etFreeDeliveryThreshold != null && etFreeDeliveryThreshold.getText().toString().isEmpty()) etFreeDeliveryThreshold.setText(String.valueOf(Math.round(currentSettings.getFreeDeliveryThreshold())));
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        alertManager.stopAlarm();
    }
}
