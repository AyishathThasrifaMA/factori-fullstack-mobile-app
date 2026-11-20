plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Written by the backend for each retailer. The template itself has no store URL or package id.
val retailerApplicationId = providers.gradleProperty("retailerApplicationId").orNull?.trim().orEmpty()
val validApplicationId = if (retailerApplicationId.matches(Regex("^[a-z][a-z0-9_]*(\\.[a-z][a-z0-9_]*)+$"))) {
    retailerApplicationId
} else {
    "com.factori.shell"
}

android {
    namespace = "com.factori.shell"
    compileSdk = 34

    defaultConfig {
        applicationId = validApplicationId
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    signingConfigs {
        create("release") {
            val keyPath = System.getenv("ANDROID_KEYSTORE_PATH")
            if (!keyPath.isNullOrBlank() && file(keyPath).exists()) {
                storeFile = file(keyPath)
                storePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD") ?: "factori"
                keyAlias = System.getenv("ANDROID_KEY_ALIAS") ?: "factori"
                keyPassword = System.getenv("ANDROID_KEY_PASSWORD") ?: "factori"
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            val relSigning = signingConfigs.findByName("release")
            if (relSigning?.storeFile != null && relSigning.storeFile.exists()) {
                signingConfig = relSigning
            }
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("com.google.android.material:material:1.12.0")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.browser:browser:1.8.0")
}
