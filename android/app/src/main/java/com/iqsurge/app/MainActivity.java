package com.iqsurge.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

/**
 * MainActivity hosts the Capacitor bridge and loads the WebView-based game
 * (bundled from the www/ folder at build time). All game logic runs in
 * JavaScript; this activity only wires up the native shell, splash screen,
 * and status bar behavior via the registered Capacitor plugins.
 */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }
}
