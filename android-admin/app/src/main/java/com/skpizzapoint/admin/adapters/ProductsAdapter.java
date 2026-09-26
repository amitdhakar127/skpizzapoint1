package com.skpizzapoint.admin.adapters;

import android.content.Context;
import android.content.res.ColorStateList;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;
import com.bumptech.glide.Glide;
import com.google.android.material.switchmaterial.SwitchMaterial;
import com.skpizzapoint.admin.R;
import com.skpizzapoint.admin.models.ProductModel;
import java.util.ArrayList;
import java.util.List;

public class ProductsAdapter extends RecyclerView.Adapter<ProductsAdapter.ProductViewHolder> {

    public interface ProductActionListener {
        void onToggleAvailability(ProductModel product, boolean isAvailable);
        void onEditProduct(ProductModel product);
        void onDeleteProduct(ProductModel product);
    }

    private final Context context;
    private final List<ProductModel> productList = new ArrayList<>();
    private final ProductActionListener listener;

    public ProductsAdapter(Context context, ProductActionListener listener) {
        this.context = context;
        this.listener = listener;
    }

    public void setProducts(List<ProductModel> products) {
        productList.clear();
        if (products != null) {
            productList.addAll(products);
        }
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ProductViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_product, parent, false);
        return new ProductViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ProductViewHolder holder, int position) {
        ProductModel product = productList.get(position);

        holder.tvProductName.setText(product.getName());
        holder.tvCategory.setText(product.getCategory());
        holder.tvProductPrice.setText("₹" + Math.round(product.getPrice()));

        if (product.isVeg()) {
            holder.tvVegBadge.setText("🟢 VEG");
            holder.tvVegBadge.setTextColor(ContextCompat.getColor(context, R.color.green_verified));
        } else {
            holder.tvVegBadge.setText("🔴 NON-VEG");
            holder.tvVegBadge.setTextColor(ContextCompat.getColor(context, R.color.accent));
        }

        // Image loading
        if (product.getImage() != null && !product.getImage().isEmpty()) {
            Glide.with(context)
                    .load(product.getImage())
                    .placeholder(R.drawable.ic_launcher_foreground)
                    .error(R.drawable.ic_launcher_foreground)
                    .centerCrop()
                    .into(holder.ivProductImage);
        } else {
            holder.ivProductImage.setImageResource(R.drawable.ic_launcher_foreground);
        }

        // Availability status
        boolean available = product.isAvailable();
        holder.switchAvailability.setOnCheckedChangeListener(null);
        holder.switchAvailability.setChecked(available);
        updateAvailabilityUI(holder, available);

        holder.switchAvailability.setOnCheckedChangeListener((buttonView, isChecked) -> {
            updateAvailabilityUI(holder, isChecked);
            if (listener != null) {
                listener.onToggleAvailability(product, isChecked);
            }
        });

        holder.btnEditProduct.setOnClickListener(v -> {
            if (listener != null) {
                listener.onEditProduct(product);
            }
        });

        holder.btnDeleteProduct.setOnClickListener(v -> {
            if (listener != null) {
                listener.onDeleteProduct(product);
            }
        });
    }

    private void updateAvailabilityUI(ProductViewHolder holder, boolean available) {
        if (available) {
            holder.tvAvailabilityStatus.setText("In Stock");
            holder.tvAvailabilityStatus.setTextColor(ContextCompat.getColor(context, R.color.green_verified));
        } else {
            holder.tvAvailabilityStatus.setText("Out of Stock");
            holder.tvAvailabilityStatus.setTextColor(ContextCompat.getColor(context, R.color.accent));
        }
    }

    @Override
    public int getItemCount() {
        return productList.size();
    }

    static class ProductViewHolder extends RecyclerView.ViewHolder {
        ImageView ivProductImage;
        TextView tvVegBadge, tvCategory, tvProductName, tvProductPrice, tvAvailabilityStatus;
        SwitchMaterial switchAvailability;
        ImageButton btnEditProduct, btnDeleteProduct;

        public ProductViewHolder(@NonNull View itemView) {
            super(itemView);
            ivProductImage = itemView.findViewById(R.id.ivProductImage);
            tvVegBadge = itemView.findViewById(R.id.tvVegBadge);
            tvCategory = itemView.findViewById(R.id.tvCategory);
            tvProductName = itemView.findViewById(R.id.tvProductName);
            tvProductPrice = itemView.findViewById(R.id.tvProductPrice);
            tvAvailabilityStatus = itemView.findViewById(R.id.tvAvailabilityStatus);
            switchAvailability = itemView.findViewById(R.id.switchAvailability);
            btnEditProduct = itemView.findViewById(R.id.btnEditProduct);
            btnDeleteProduct = itemView.findViewById(R.id.btnDeleteProduct);
        }
    }
}
