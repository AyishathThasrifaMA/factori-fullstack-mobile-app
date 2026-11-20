package com.factori.shell

import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Intent
import android.graphics.Bitmap
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.Uri
import android.net.http.SslError
import android.os.Bundle
import android.view.View
import android.webkit.SslErrorHandler
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.browser.customtabs.CustomTabsIntent

/**
 * Shows one retailer storefront. The name, icon, package id, and URL are supplied
 * by the backend for each build. This activity does not hardcode a store.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var errorPanel: View
    private lateinit var errorTitle: TextView
    private lateinit var errorMessage: TextView

    private val storefrontUrl: String by lazy { getString(R.string.storefront_url) }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.storefront)
        progressBar = findViewById(R.id.loading)
        errorPanel = findViewById(R.id.errorPanel)
        errorTitle = findViewById(R.id.errorTitle)
        errorMessage = findViewById(R.id.errorMessage)
        findViewById<Button>(R.id.retry).setOnClickListener { openStorefront() }

        configureWebView()

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                when {
                    errorPanel.visibility == View.VISIBLE && webView.canGoBack() -> {
                        errorPanel.visibility = View.GONE
                        webView.visibility = View.VISIBLE
                        webView.goBack()
                    }
                    webView.canGoBack() -> webView.goBack()
                    else -> finish()
                }
            }
        })

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState)
        } else {
            openStorefront()
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        webView.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        val target = intent.getStringExtra("target_url") ?: intent.dataString
        if (!target.isNullOrBlank() && isOnline()) {
            webView.loadUrl(target)
        }
    }

    override fun onPause() {
        super.onPause()
        android.webkit.CookieManager.getInstance().flush()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() {
        val settings = webView.settings
        // Storefront pages are the retailer's existing website, so script and DOM storage stay on.
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.javaScriptCanOpenWindowsAutomatically = true
        settings.setSupportMultipleWindows(true)
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        settings.loadsImagesAutomatically = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.mediaPlaybackRequiresUserGesture = true

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                progressBar.visibility = if (newProgress in 1..99) View.VISIBLE else View.GONE
                progressBar.progress = newProgress
            }

            override fun onCreateWindow(
                view: WebView?,
                isDialog: Boolean,
                isUserGesture: Boolean,
                resultMsg: android.os.Message?
            ): Boolean {
                val target = view?.hitTestResult?.extra ?: return false
                handleNavigation(Uri.parse(target))
                return false
            }
        }
        webView.webViewClient = StorefrontClient()
        android.webkit.CookieManager.getInstance().setAcceptCookie(true)
        android.webkit.CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)
        webView.addJavascriptInterface(FactoriBridge(this), "FactoriBridge")
    }

    private fun openStorefront() {
        if (!isOnline()) {
            showError(getString(R.string.error_offline_title), getString(R.string.error_offline_message))
            return
        }
        errorPanel.visibility = View.GONE
        webView.visibility = View.VISIBLE
        val targetUrl = intent?.getStringExtra("target_url") ?: intent?.dataString ?: storefrontUrl
        webView.loadUrl(targetUrl)
    }

    private fun isOnline(): Boolean {
        val manager = getSystemService(ConnectivityManager::class.java) ?: return false
        val network = manager.activeNetwork ?: return false
        val capabilities = manager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    private fun showError(title: String, message: String) {
        progressBar.visibility = View.GONE
        webView.visibility = View.GONE
        errorPanel.visibility = View.VISIBLE
        errorTitle.text = title
        errorMessage.text = message
    }

    /**
     * Ordinary store links stay in the WebView. Payment pages and payment app schemes
     * leave the WebView so UPI and card challenges can open the right app safely.
     * Unknown schemes such as file: and javascript: are blocked.
     */
    private fun handleNavigation(uri: Uri): Boolean {
        val scheme = uri.scheme?.lowercase() ?: return true
        if (scheme == "http" || scheme == "https") {
            val host = uri.host?.lowercase().orEmpty()
            if (isPaymentHost(host)) {
                openCustomTab(uri)
                return true
            }
            return false
        }
        if (scheme in EXTERNAL_SCHEMES) {
            openExternal(uri)
            return true
        }
        return true
    }

    private fun isPaymentHost(host: String): Boolean {
        return PAYMENT_HOSTS.any { paymentHost -> host == paymentHost || host.endsWith(".$paymentHost") }
    }

    private fun openCustomTab(uri: Uri) {
        try {
            CustomTabsIntent.Builder().setShowTitle(true).build().launchUrl(this, uri)
        } catch (_: ActivityNotFoundException) {
            openExternal(uri)
        }
    }

    private fun openExternal(uri: Uri) {
        val intent = if (uri.scheme.equals("intent", ignoreCase = true)) {
            try {
                Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME).apply {
                    addCategory(Intent.CATEGORY_BROWSABLE)
                    component = null
                    selector = null
                }
            } catch (_: Exception) {
                return
            }
        } else {
            Intent(Intent.ACTION_VIEW, uri).apply { addCategory(Intent.CATEGORY_BROWSABLE) }
        }

        try {
            startActivity(intent)
        } catch (_: ActivityNotFoundException) {
            val fallback = intent.getStringExtra("browser_fallback_url")
            if (!fallback.isNullOrBlank()) openCustomTab(Uri.parse(fallback))
        }
    }

    private inner class StorefrontClient : WebViewClient() {
        override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
            val uri = request?.url ?: return false
            if (!request.isForMainFrame) return false
            return handleNavigation(uri)
        }

        override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
            errorPanel.visibility = View.GONE
            webView.visibility = View.VISIBLE
        }

        override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
            if (request?.isForMainFrame != true) return
            val offline = !isOnline() || error?.errorCode == ERROR_HOST_LOOKUP ||
                error?.errorCode == ERROR_CONNECT ||
                error?.errorCode == ERROR_TIMEOUT ||
                error?.errorCode == ERROR_IO
            if (offline) {
                showError(getString(R.string.error_offline_title), getString(R.string.error_offline_message))
            } else {
                showError(getString(R.string.error_page_title), getString(R.string.error_page_message))
            }
        }

        override fun onReceivedSslError(view: WebView?, handler: SslErrorHandler?, error: SslError?) {
            handler?.cancel()
            showError(getString(R.string.error_page_title), getString(R.string.error_page_message))
        }
    }

    companion object {
        private val PAYMENT_HOSTS = setOf(
            "stripe.com",
            "paypal.com",
            "paypalobjects.com",
            "razorpay.com",
            "phonepe.com",
            "paytm.com",
            "pay.google.com",
            "payments.google.com",
            "payu.in",
            "cashfree.com",
            "instamojo.com",
            "billdesk.com",
            "ccavenue.com",
            "juspay.in",
            "amazonpay.com",
            "npci.org.in"
        )

        private val EXTERNAL_SCHEMES = setOf(
            "upi",
            "tez",
            "phonepe",
            "gpay",
            "paytmmp",
            "credpay",
            "bhim",
            "amazonpay",
            "intent",
            "tel",
            "mailto",
            "sms",
            "whatsapp"
        )
    }
}
