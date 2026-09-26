package com.skpizzapoint.admin;

import android.os.Bundle;
import android.text.TextUtils;
import android.widget.ArrayAdapter;
import android.widget.CheckBox;
import android.widget.Spinner;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.switchmaterial.SwitchMaterial;
import com.google.android.material.textfield.TextInputEditText;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.skpizzapoint.admin.models.ProductModel;

public class AddEditProductActivity extends AppCompatActivity {

    private TextInputEditText etProductName, etProductPrice, etProductDescription, etProductImage;
    private Spinner spinnerCategory;
    private CheckBox cbIsVeg;
    private SwitchMaterial switchProductAvailable;
    private MaterialButton btnSaveProduct;

    private DatabaseReference mDatabase;
    private ProductModel productToEdit;
    private final String[] categories = {
            "Veg Pizza",
            "Non-Veg Pizza",
            "Pizza Mania",
            "Burgers",
            "Sides & Appetizers",
            "Beverages",
            "Desserts"
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_add_edit_product);

        mDatabase = FirebaseDatabase.getInstance().getReference().child(FirebaseConstants.PATH_PRODUCTS);
        productToEdit = (ProductModel) getIntent().getSerializableExtra("product");

        Toolbar toolbar = findViewById(R.id.toolbarProduct);
        toolbar.setTitle(productToEdit != null ? "Edit Product" : "Add New Product");
        toolbar.setNavigationOnClickListener(v -> finish());

        initViews();
        if (productToEdit != null) {
            populateExistingData();
        }
    }

    private void initViews() {
        etProductName = findViewById(R.id.etProductName);
        etProductPrice = findViewById(R.id.etProductPrice);
        etProductDescription = findViewById(R.id.etProductDescription);
        etProductImage = findViewById(R.id.etProductImage);
        spinnerCategory = findViewById(R.id.spinnerCategory);
        cbIsVeg = findViewById(R.id.cbIsVeg);
        switchProductAvailable = findViewById(R.id.switchProductAvailable);
        btnSaveProduct = findViewById(R.id.btnSaveProduct);

        ArrayAdapter<String> adapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, categories);
        spinnerCategory.setAdapter(adapter);

        btnSaveProduct.setOnClickListener(v -> saveProductToFirebase());
    }

    private void populateExistingData() {
        etProductName.setText(productToEdit.getName());
        etProductPrice.setText(String.valueOf(Math.round(productToEdit.getPrice())));
        etProductDescription.setText(productToEdit.getDescription());
        etProductImage.setText(productToEdit.getImage());
        cbIsVeg.setChecked(productToEdit.isVeg());
        switchProductAvailable.setChecked(productToEdit.isAvailable());

        for (int i = 0; i < categories.length; i++) {
            if (categories[i].equalsIgnoreCase(productToEdit.getCategory())) {
                spinnerCategory.setSelection(i);
                break;
            }
        }
        btnSaveProduct.setText("Update Product");
    }

    private void saveProductToFirebase() {
        String name = etProductName.getText() != null ? etProductName.getText().toString().trim() : "";
        String priceStr = etProductPrice.getText() != null ? etProductPrice.getText().toString().trim() : "";
        String desc = etProductDescription.getText() != null ? etProductDescription.getText().toString().trim() : "";
        String img = etProductImage.getText() != null ? etProductImage.getText().toString().trim() : "";
        String category = spinnerCategory.getSelectedItem().toString();
        boolean isVeg = cbIsVeg.isChecked();
        boolean isAvailable = switchProductAvailable.isChecked();

        if (TextUtils.isEmpty(name)) {
            etProductName.setError("Product name is required");
            etProductName.requestFocus();
            return;
        }

        if (TextUtils.isEmpty(priceStr)) {
            etProductPrice.setError("Price is required");
            etProductPrice.requestFocus();
            return;
        }

        double price;
        try {
            price = Double.parseDouble(priceStr);
        } catch (NumberFormatException e) {
            etProductPrice.setError("Invalid price format");
            etProductPrice.requestFocus();
            return;
        }

        if (img.isEmpty()) {
            img = "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80";
        }

        btnSaveProduct.setEnabled(false);

        String productId = productToEdit != null ? productToEdit.getId() : mDatabase.push().getKey();
        if (productId == null) {
            productId = "prod_" + System.currentTimeMillis();
        }

        ProductModel product = new ProductModel(productId, name, category, price, desc, img, isVeg, isAvailable);

        mDatabase.child(productId).setValue(product.toMap())
                .addOnSuccessListener(aVoid -> {
                    Toast.makeText(AddEditProductActivity.this, "Product saved successfully!", Toast.LENGTH_SHORT).show();
                    finish();
                })
                .addOnFailureListener(e -> {
                    btnSaveProduct.setEnabled(true);
                    Toast.makeText(AddEditProductActivity.this, "Failed to save: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                });
    }
}
