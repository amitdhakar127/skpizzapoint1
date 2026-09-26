package com.skpizzapoint.admin;

import android.content.Intent;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;

public class LoginActivity extends AppCompatActivity {

    private TextInputEditText etEmail, etPassword;
    private MaterialButton btnLogin;
    private ProgressBar progressBar;
    private TextView tvError;
    private FirebaseAuth mAuth;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        mAuth = FirebaseAuth.getInstance();

        etEmail = findViewById(R.id.etEmail);
        etPassword = findViewById(R.id.etPassword);
        btnLogin = findViewById(R.id.btnLogin);
        progressBar = findViewById(R.id.progressBar);
        tvError = findViewById(R.id.tvError);

        // Check if already authenticated as valid admin
        FirebaseUser currentUser = mAuth.getCurrentUser();
        if (currentUser != null) {
            if (FirebaseConstants.isUserAuthorizedAdmin(currentUser.getUid(), currentUser.getEmail())) {
                proceedToAdminMain();
                return;
            } else {
                mAuth.signOut();
            }
        }

        btnLogin.setOnClickListener(v -> performAdminLogin());
    }

    private void performAdminLogin() {
        String email = etEmail.getText() != null ? etEmail.getText().toString().trim() : "";
        String password = etPassword.getText() != null ? etPassword.getText().toString().trim() : "";

        tvError.setVisibility(View.GONE);

        if (TextUtils.isEmpty(email)) {
            etEmail.setError("Please enter your admin email");
            etEmail.requestFocus();
            return;
        }

        if (TextUtils.isEmpty(password)) {
            etPassword.setError("Please enter your password");
            etPassword.requestFocus();
            return;
        }

        setLoading(true);

        mAuth.signInWithEmailAndPassword(email, password)
                .addOnCompleteListener(this, task -> {
                    setLoading(false);
                    if (task.isSuccessful()) {
                        FirebaseUser user = mAuth.getCurrentUser();
                        if (user != null && FirebaseConstants.isUserAuthorizedAdmin(user.getUid(), user.getEmail())) {
                            Toast.makeText(LoginActivity.this, "Welcome, Authorized Admin!", Toast.LENGTH_SHORT).show();
                            proceedToAdminMain();
                        } else {
                            // Non-admin account attempted to log into Admin APK! Reject access immediately
                            mAuth.signOut();
                            tvError.setText("Access Denied: Your account UID (" + (user != null ? user.getUid() : "unknown") + ") is not authorized as SK Pizza Point Administrator.");
                            tvError.setVisibility(View.VISIBLE);
                        }
                    } else {
                        String errorMsg = task.getException() != null ? task.getException().getMessage() : "Authentication failed.";
                        tvError.setText(errorMsg);
                        tvError.setVisibility(View.VISIBLE);
                    }
                });
    }

    private void setLoading(boolean isLoading) {
        progressBar.setVisibility(isLoading ? View.VISIBLE : View.GONE);
        btnLogin.setEnabled(!isLoading);
        etEmail.setEnabled(!isLoading);
        etPassword.setEnabled(!isLoading);
    }

    private void proceedToAdminMain() {
        Intent intent = new Intent(this, AdminMainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
        startActivity(intent);
        finish();
    }
}
