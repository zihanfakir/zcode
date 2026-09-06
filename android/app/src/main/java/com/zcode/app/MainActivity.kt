package com.zcode.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.QrCode
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import com.zcode.app.ui.GeneratorScreen
import com.zcode.app.ui.HistoryScreen
import com.zcode.app.ui.ScannerScreen
import com.zcode.app.ui.SettingsScreen
import com.zcode.app.ui.theme.ZBorder
import com.zcode.app.ui.theme.ZCodeTheme
import com.zcode.app.ui.theme.ZCyan
import com.zcode.app.ui.theme.ZDarkBg
import com.zcode.app.ui.theme.ZPanelBg
import com.zcode.app.ui.theme.ZTextMuted

enum class AppTab(val label: String, val icon: ImageVector) {
    GENERATOR("Generator", Icons.Default.QrCode),
    SCANNER("Scanner", Icons.Default.QrCodeScanner),
    HISTORY("History", Icons.Default.History),
    SETTINGS("Settings", Icons.Default.Settings)
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ZCodeTheme {
                var currentTab by remember { mutableStateOf(AppTab.GENERATOR) }

                Scaffold(
                    bottomBar = {
                        NavigationBar(
                            containerColor = ZPanelBg
                        ) {
                            AppTab.entries.forEach { tab ->
                                NavigationBarItem(
                                    selected = currentTab == tab,
                                    onClick = { currentTab = tab },
                                    icon = { Icon(tab.icon, contentDescription = tab.label) },
                                    label = { Text(tab.label) },
                                    colors = NavigationBarItemDefaults.colors(
                                        selectedIconColor = ZDarkBg,
                                        selectedTextColor = ZCyan,
                                        indicatorColor = ZCyan,
                                        unselectedIconColor = ZTextMuted,
                                        unselectedTextColor = ZTextMuted
                                    )
                                )
                            }
                        }
                    }
                ) { innerPadding ->
                    Surface(
                        modifier = Modifier.padding(innerPadding),
                        color = ZDarkBg
                    ) {
                        when (currentTab) {
                            AppTab.GENERATOR -> GeneratorScreen()
                            AppTab.SCANNER -> ScannerScreen()
                            AppTab.HISTORY -> HistoryScreen()
                            AppTab.SETTINGS -> SettingsScreen()
                        }
                    }
                }
            }
        }
    }
}
