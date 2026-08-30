package com.kanakku.app;

import android.Manifest;
import android.content.ContentResolver;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.lang.ref.WeakReference;
import java.util.Locale;

@CapacitorPlugin(
    name = "SmsReader",
    permissions = {
        @Permission(
            alias = "sms",
            strings = {
                Manifest.permission.READ_SMS,
                Manifest.permission.RECEIVE_SMS
            }
        )
    }
)
public class SmsReaderPlugin extends Plugin {
    private static final String TAG = "SmsReaderPlugin";
    private static WeakReference<SmsReaderPlugin> instanceRef;

    @Override
    public void load() {
        super.load();
        instanceRef = new WeakReference<>(this);
    }

    public static void onNewSmsReceived(String sender, String body, long timestamp) {
        if (instanceRef != null && instanceRef.get() != null) {
            SmsReaderPlugin plugin = instanceRef.get();
            try {
                JSObject data = new JSObject();
                data.put("id", "incoming_" + timestamp);
                data.put("sender", sender != null ? sender : "");
                data.put("body", body != null ? body : "");
                data.put("timestamp", timestamp);
                data.put("date", new java.util.Date(timestamp).toString());

                plugin.notifyListeners("onSmsReceived", data, true);
                Log.d(TAG, "Notified frontend listener of incoming SMS from: " + sender);
            } catch (Exception e) {
                Log.e(TAG, "Failed to notify listeners: " + e.getMessage(), e);
            }
        }
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", true);
        ret.put("platform", "android");
        call.resolve(ret);
    }

    @PluginMethod
    public void checkSmsPermissions(PluginCall call) {
        boolean hasRead = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;
        boolean hasReceive = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;

        JSObject ret = new JSObject();
        ret.put("granted", hasRead && hasReceive);
        ret.put("readSms", hasRead);
        ret.put("receiveSms", hasReceive);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestSmsPermissions(PluginCall call) {
        if (getPermissionState("sms") == com.getcapacitor.PermissionState.GRANTED) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        } else {
            requestPermissionForAlias("sms", call, "smsPermissionCallback");
        }
    }

    @PermissionCallback
    private void smsPermissionCallback(PluginCall call) {
        boolean hasRead = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;
        boolean hasReceive = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED;

        JSObject ret = new JSObject();
        ret.put("granted", hasRead && hasReceive);
        ret.put("readSms", hasRead);
        ret.put("receiveSms", hasReceive);
        call.resolve(ret);
    }

    @PluginMethod
    public void getRecentSms(PluginCall call) {
        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) {
            call.reject("READ_SMS permission not granted");
            return;
        }

        int limit = call.getInt("limit", 40);
        boolean filterBankOnly = call.getBoolean("filterBankOnly", true);

        JSArray messages = new JSArray();
        ContentResolver cr = getContext().getContentResolver();
        Uri inboxUri = Uri.parse("content://sms/inbox");

        String[] projection = new String[]{"_id", "address", "body", "date"};
        String sortOrder = "date DESC LIMIT " + Math.max(limit, 10);

        Cursor cursor = null;
        try {
            cursor = cr.query(inboxUri, projection, null, null, sortOrder);
            if (cursor != null && cursor.moveToFirst()) {
                int idIdx = cursor.getColumnIndex("_id");
                int addressIdx = cursor.getColumnIndex("address");
                int bodyIdx = cursor.getColumnIndex("body");
                int dateIdx = cursor.getColumnIndex("date");

                do {
                    String id = cursor.getString(idIdx);
                    String address = cursor.getString(addressIdx);
                    String body = cursor.getString(bodyIdx);
                    long date = cursor.getLong(dateIdx);

                    if (body != null) {
                        if (filterBankOnly && !isLikelyBankSms(address, body)) {
                            continue;
                        }

                        JSObject sms = new JSObject();
                        sms.put("id", id);
                        sms.put("sender", address != null ? address : "");
                        sms.put("body", body);
                        sms.put("timestamp", date);
                        sms.put("date", new java.util.Date(date).toString());
                        messages.put(sms);
                    }
                } while (cursor.moveToNext());
            }

            JSObject result = new JSObject();
            result.put("messages", messages);
            result.put("count", messages.length());
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error querying SMS inbox: " + e.getMessage(), e);
            call.reject("Failed to read SMS: " + e.getMessage());
        } finally {
            if (cursor != null) {
                cursor.close();
            }
        }
    }

    private boolean isLikelyBankSms(String sender, String body) {
        if (body == null) return false;
        String lowerBody = body.toLowerCase(Locale.ROOT);

        // Discard typical OTP only messages if no financial amount
        boolean hasAmount = lowerBody.contains("rs") || lowerBody.contains("inr") || lowerBody.contains("₹") || lowerBody.contains("usd") || lowerBody.matches(".*\\d+(\\.\\d{2})?.*");
        boolean hasFinancialKeyword = lowerBody.contains("debited") ||
                                      lowerBody.contains("credited") ||
                                      lowerBody.contains("spent") ||
                                      lowerBody.contains("paid") ||
                                      lowerBody.contains("txn") ||
                                      lowerBody.contains("transaction") ||
                                      lowerBody.contains("transferred") ||
                                      lowerBody.contains("withdrawn") ||
                                      lowerBody.contains("a/c") ||
                                      lowerBody.contains("acct") ||
                                      lowerBody.contains("account") ||
                                      lowerBody.contains("avl bal") ||
                                      lowerBody.contains("available balance") ||
                                      lowerBody.contains("upi") ||
                                      lowerBody.contains("vpa");

        return hasAmount && hasFinancialKeyword;
    }
}
