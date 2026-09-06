package com.zcode.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = ZCyan,
    background = ZDarkBg,
    surface = ZPanelBg,
    onPrimary = ZDarkBg,
    onBackground = ZText,
    onSurface = ZText
)

@Composable
fun ZCodeTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content
    )
}
