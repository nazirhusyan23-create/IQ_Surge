# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# Capacitor / Cordova bridge classes must not be obfuscated: the WebView
# calls into these via reflection.
-keep class com.getcapacitor.** { *; }
-keep class com.iqsurge.app.** { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    public *;
}

# Cordova plugins (used by some Capacitor community plugins under the hood)
-keep class org.apache.cordova.** { *; }
-keepclassmembers class org.apache.cordova.** { *; }

# Keep WebView JS interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# AndroidX / support libraries
-keep class androidx.** { *; }
-keep interface androidx.** { *; }
-dontwarn androidx.**

# General Android hygiene
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Application
