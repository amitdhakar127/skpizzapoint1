package com.skpizzapoint.admin;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;

import androidx.webkit.WebViewAssetLoader;

import java.io.IOException;
import java.io.InputStream;

public class MainActivity extends Activity {

    private WebView webView;
    private WebViewAssetLoader assetLoader;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        assetLoader = new WebViewAssetLoader.Builder()
                .setDomain("sk-pizza-point.web.app")
                .addPathHandler(
                        "/assets/",
                        new WebViewAssetLoader.AssetsPathHandler(this)
                )
                .build();

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        webView.setWebViewClient(new LocalWebsiteClient());

        webView.loadUrl("https://sk-pizza-point.web.app/admin");
    }

    private class LocalWebsiteClient extends WebViewClient {

        @Override
        public WebResourceResponse shouldInterceptRequest(
                WebView view,
                WebResourceRequest request
        ) {
            String path = request.getUrl().getPath();

            if (path != null && path.startsWith("/assets/")) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            if (path != null &&
                    (path.equals("/admin") ||
                     path.equals("/admin/") ||
                     path.equals("/admin/login") ||
                     path.equals("/admin/login/"))) {

                try {
                    InputStream inputStream =
                            getAssets().open("index.html");

                    return new WebResourceResponse(
                            "text/html",
                            "UTF-8",
                            inputStream
                    );
                } catch (IOException e) {
                    return null;
                }
            }

            return super.shouldInterceptRequest(view, request);
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
