package com.factori.shell

import android.content.Context
import android.util.Log
import android.webkit.JavascriptInterface
import org.json.JSONObject

/**
 * JavaScript Interface Bridge registered in the WebView as `window.FactoriBridge`.
 * 
 * Allows the retailer's web storefront (e.g., zolara.in) to communicate securely
 * with the native Android shell:
 * 1. Customer Identification: Captures logged-in customer phone & ID and binds it
 *    to this device's push notification token.
 * 2. Analytics Telemetry: Forwards in-app checkout events.
 */
class FactoriBridge(private val context: Context) {

    private val preferences = context.getSharedPreferences("factori_retailer_prefs", Context.MODE_PRIVATE)

    /**
     * Called by the web storefront after successful OTP or customer login.
     * 
     * Example web invocation:
     *   if (window.FactoriBridge) {
     *       window.FactoriBridge.identifyCustomer(JSON.stringify({
     *           customerId: "cust_987123",
     *           phone: "+919876543210",
     *           customerName: "Priya Sharma"
     *       }));
     *   }
     */
    @JavascriptInterface
    fun identifyCustomer(jsonPayload: String) {
        try {
            val json = JSONObject(jsonPayload)
            val customerId = json.optString("customerId")
            val phone = json.optString("phone")
            val name = json.optString("customerName")

            Log.d("FactoriBridge", "Customer identified: $customerId, phone: $phone, name: $name")

            // Persist customer identifier in encrypted/private app preferences
            preferences.edit()
                .putString("logged_in_customer_id", customerId)
                .putString("logged_in_phone", phone)
                .putLong("logged_in_timestamp", System.currentTimeMillis())
                .apply()

            // In production, sync with Factori Telemetry API:
            // POST /api/v1/telemetry/device-bind { customerId, phone, fcmToken }
        } catch (e: Exception) {
            Log.e("FactoriBridge", "Error parsing identifyCustomer payload: ${e.message}")
        }
    }

    /**
     * Queries currently identified customer details
     */
    @JavascriptInterface
    fun getCustomerSession(): String {
        val customerId = preferences.getString("logged_in_customer_id", "") ?: ""
        val phone = preferences.getString("logged_in_phone", "") ?: ""
        val result = JSONObject()
        result.put("isLoggedIn", customerId.isNotEmpty())
        result.put("customerId", customerId)
        result.put("phone", phone)
        return result.toString()
    }
}

