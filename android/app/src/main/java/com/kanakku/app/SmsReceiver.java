package com.kanakku.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

public class SmsReceiver extends BroadcastReceiver {
    private static final String TAG = "KanakkuSmsReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || intent.getAction() == null) return;

        if ("android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                try {
                    Object[] pdus = (Object[]) bundle.get("pdus");
                    String format = bundle.getString("format");
                    if (pdus == null || pdus.length == 0) return;

                    StringBuilder fullBody = new StringBuilder();
                    String sender = "";
                    long timestamp = System.currentTimeMillis();

                    for (Object pdu : pdus) {
                        SmsMessage message;
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                            message = SmsMessage.createFromPdu((byte[]) pdu, format);
                        } else {
                            message = SmsMessage.createFromPdu((byte[]) pdu);
                        }
                        if (message != null) {
                            sender = message.getDisplayOriginatingAddress();
                            fullBody.append(message.getMessageBody());
                            timestamp = message.getTimestampMillis();
                        }
                    }

                    String body = fullBody.toString();
                    Log.d(TAG, "SMS Received from: " + sender + ", Body: " + body);

                    // Forward to SmsReaderPlugin
                    SmsReaderPlugin.onNewSmsReceived(sender, body, timestamp);

                } catch (Exception e) {
                    Log.e(TAG, "Error parsing incoming SMS: " + e.getMessage(), e);
                }
            }
        }
    }
}
