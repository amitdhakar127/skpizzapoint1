package com.skpizzapoint.admin.adapters;

import android.content.Context;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.net.Uri;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.button.MaterialButton;
import com.skpizzapoint.admin.R;
import com.skpizzapoint.admin.models.OrderModel;
import java.util.ArrayList;
import java.util.List;

public class OrdersAdapter extends RecyclerView.Adapter<OrdersAdapter.OrderViewHolder> {

    public interface OrderActionListener {
        void onManageOrder(OrderModel order);
    }

    private final Context context;
    private final List<OrderModel> fullList = new ArrayList<>();
    private final List<OrderModel> displayedList = new ArrayList<>();
    private final OrderActionListener listener;
    private String currentFilter = "All Orders";

    public OrdersAdapter(Context context, OrderActionListener listener) {
        this.context = context;
        this.listener = listener;
    }

    public void setOrders(List<OrderModel> orders) {
        fullList.clear();
        if (orders != null) {
            fullList.addAll(orders);
        }
        applyFilter(currentFilter);
    }

    public void applyFilter(String filter) {
        this.currentFilter = filter;
        displayedList.clear();
        for (OrderModel o : fullList) {
            if ("All Orders".equalsIgnoreCase(filter)) {
                displayedList.add(o);
            } else if ("Pending".equalsIgnoreCase(filter) && "Pending".equalsIgnoreCase(o.getStatus())) {
                displayedList.add(o);
            } else if ("Preparing".equalsIgnoreCase(filter) && "Preparing".equalsIgnoreCase(o.getStatus())) {
                displayedList.add(o);
            } else if ("Out for Delivery".equalsIgnoreCase(filter) && "Out for Delivery".equalsIgnoreCase(o.getStatus())) {
                displayedList.add(o);
            } else if ("Delivered".equalsIgnoreCase(filter) && "Delivered".equalsIgnoreCase(o.getStatus())) {
                displayedList.add(o);
            }
        }
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public OrderViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_order, parent, false);
        return new OrderViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull OrderViewHolder holder, int position) {
        OrderModel order = displayedList.get(position);

        holder.tvOrderId.setText("Order #" + (order.getId().length() > 14 ? order.getId().substring(0, 14) + "..." : order.getId()));
        holder.tvOrderTime.setText("Placed: " + (order.getCreatedAt().isEmpty() ? "Recently" : order.getCreatedAt()));
        holder.tvCustomerName.setText(order.getCustomerName());
        holder.tvCustomerPhone.setText(order.getCustomerPhone().isEmpty() ? "No phone" : order.getCustomerPhone());
        holder.tvDeliveryAddress.setText(order.getDeliveryAddress());
        holder.tvItemsSummary.setText(order.getSummaryText());
        holder.tvTotalAmount.setText("₹" + Math.round(order.getFinalTotal()));

        // Status badge styling
        String status = order.getStatus();
        holder.tvOrderStatusBadge.setText(status);
        int badgeColor = ContextCompat.getColor(context, R.color.status_pending);
        if ("Preparing".equalsIgnoreCase(status)) {
            badgeColor = ContextCompat.getColor(context, R.color.status_preparing);
        } else if ("Out for Delivery".equalsIgnoreCase(status)) {
            badgeColor = ContextCompat.getColor(context, R.color.status_out);
        } else if ("Delivered".equalsIgnoreCase(status)) {
            badgeColor = ContextCompat.getColor(context, R.color.status_delivered);
        } else if ("Cancelled".equalsIgnoreCase(status)) {
            badgeColor = ContextCompat.getColor(context, R.color.status_cancelled);
        }
        holder.tvOrderStatusBadge.setBackgroundTintList(ColorStateList.valueOf(badgeColor));

        // Payment status
        String payment = order.getPaymentStatus();
        holder.tvPaymentStatus.setText("💳 " + order.getPaymentMode() + " • " + payment);

        // Action: Call
        holder.btnQuickCall.setOnClickListener(v -> {
            String phone = order.getCustomerPhone();
            if (!phone.isEmpty()) {
                Intent intent = new Intent(Intent.ACTION_DIAL, Uri.parse("tel:" + phone));
                context.startActivity(intent);
            } else {
                Toast.makeText(context, "No phone number available", Toast.LENGTH_SHORT).show();
            }
        });

        // Action: WhatsApp
        holder.btnQuickWhatsApp.setOnClickListener(v -> {
            String phone = order.getCustomerPhone().replaceAll("[^0-9]", "");
            if (phone.length() == 10) {
                phone = "91" + phone;
            }
            if (!phone.isEmpty()) {
                try {
                    String msg = "Hello " + order.getCustomerName() + "! Your SK Pizza Point order #" + order.getId() + " is " + order.getStatus() + ".";
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/" + phone + "?text=" + Uri.encode(msg)));
                    context.startActivity(intent);
                } catch (Exception e) {
                    Toast.makeText(context, "WhatsApp not installed", Toast.LENGTH_SHORT).show();
                }
            }
        });

        // Action: Manage
        holder.btnViewDetails.setOnClickListener(v -> {
            if (listener != null) {
                listener.onManageOrder(order);
            }
        });

        holder.itemView.setOnClickListener(v -> {
            if (listener != null) {
                listener.onManageOrder(order);
            }
        });
    }

    @Override
    public int getItemCount() {
        return displayedList.size();
    }

    static class OrderViewHolder extends RecyclerView.ViewHolder {
        TextView tvOrderId, tvOrderStatusBadge, tvOrderTime, tvCustomerName, tvCustomerPhone, tvDeliveryAddress, tvItemsSummary, tvTotalAmount, tvPaymentStatus;
        MaterialButton btnQuickCall, btnQuickWhatsApp, btnViewDetails;

        public OrderViewHolder(@NonNull View itemView) {
            super(itemView);
            tvOrderId = itemView.findViewById(R.id.tvOrderId);
            tvOrderStatusBadge = itemView.findViewById(R.id.tvOrderStatusBadge);
            tvOrderTime = itemView.findViewById(R.id.tvOrderTime);
            tvCustomerName = itemView.findViewById(R.id.tvCustomerName);
            tvCustomerPhone = itemView.findViewById(R.id.tvCustomerPhone);
            tvDeliveryAddress = itemView.findViewById(R.id.tvDeliveryAddress);
            tvItemsSummary = itemView.findViewById(R.id.tvItemsSummary);
            tvTotalAmount = itemView.findViewById(R.id.tvTotalAmount);
            tvPaymentStatus = itemView.findViewById(R.id.tvPaymentStatus);
            btnQuickCall = itemView.findViewById(R.id.btnQuickCall);
            btnQuickWhatsApp = itemView.findViewById(R.id.btnQuickWhatsApp);
            btnViewDetails = itemView.findViewById(R.id.btnViewDetails);
        }
    }
}
