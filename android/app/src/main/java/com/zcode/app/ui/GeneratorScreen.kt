package com.zcode.app.ui

import android.content.Intent
import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.zcode.app.core.ZCodeDataType
import com.zcode.app.core.ZCodeEncoder
import com.zcode.app.core.ZCodeFormat
import com.zcode.app.ui.theme.*

data class AndroidPalette(
    val name: String,
    val fg: Int,
    val bg: Int,
    val composeFg: androidx.compose.ui.graphics.Color,
    val composeBg: androidx.compose.ui.graphics.Color
)

val ANDROID_PALETTES = listOf(
    AndroidPalette("B&W", android.graphics.Color.BLACK, android.graphics.Color.WHITE, androidx.compose.ui.graphics.Color(0xFF000000), androidx.compose.ui.graphics.Color(0xFFFFFFFF)),
    AndroidPalette("Invert", android.graphics.Color.WHITE, android.graphics.Color.BLACK, androidx.compose.ui.graphics.Color(0xFFFFFFFF), androidx.compose.ui.graphics.Color(0xFF000000)),
    AndroidPalette("Cyan", android.graphics.Color.rgb(0, 240, 255), android.graphics.Color.rgb(10, 14, 23), androidx.compose.ui.graphics.Color(0xFF00F0FF), androidx.compose.ui.graphics.Color(0xFF0A0E17)),
    AndroidPalette("Amber", android.graphics.Color.rgb(245, 158, 11), android.graphics.Color.rgb(20, 14, 4), androidx.compose.ui.graphics.Color(0xFFF59E0B), androidx.compose.ui.graphics.Color(0xFF140E04)),
    AndroidPalette("Matrix", android.graphics.Color.rgb(0, 255, 102), android.graphics.Color.rgb(5, 26, 10), androidx.compose.ui.graphics.Color(0xFF00FF66), androidx.compose.ui.graphics.Color(0xFF051A0A)),
)

@Composable
fun GeneratorScreen() {
    val context = LocalContext.current
    var inputText by remember { mutableStateOf("Hello Zihan") }
    var isProtected by remember { mutableStateOf(false) }
    var password by remember { mutableStateOf("") }
    var fgColor by remember { mutableStateOf(android.graphics.Color.BLACK) }
    var bgColor by remember { mutableStateOf(android.graphics.Color.WHITE) }
    val encoder = remember { ZCodeEncoder() }

    val detectedType = remember(inputText) {
        if (ZCodeFormat.isUrl(inputText)) ZCodeDataType.URL else ZCodeDataType.TEXT
    }

    val maxBytes = if (isProtected) ZCodeFormat.MAX_ENCRYPTED_PAYLOAD else ZCodeFormat.MAX_PAYLOAD

    val currentBytes = remember(inputText, detectedType) {
        var text = inputText.trim()
        if (detectedType == ZCodeDataType.URL) {
            for (i in 1 until ZCodeFormat.URL_PREFIXES.size) {
                val p = ZCodeFormat.URL_PREFIXES[i]
                if (text.startsWith(p, ignoreCase = true)) {
                    text = text.substring(p.length)
                    break
                }
            }
        }
        text.toByteArray(Charsets.UTF_8).size
    }

    val isExceedsLimit = currentBytes > maxBytes

    val renderedBitmap: Bitmap? = remember(inputText, isProtected, password, isExceedsLimit, fgColor, bgColor) {
        if (inputText.isBlank() || isExceedsLimit || (isProtected && password.isBlank())) null
        else {
            try {
                val encoded = encoder.encode(inputText, if (isProtected) password else null)
                encoder.renderBitmap(
                    encoded,
                    size = 512,
                    fgColor = fgColor,
                    bgColor = bgColor
                )
            } catch (e: Exception) {
                null
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ZDarkBg)
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Z-Code Generator",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = ZText
            )
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = if (isProtected) ZAmber.copy(alpha = 0.2f) else ZCyan.copy(alpha = 0.15f)
                ) {
                    Text(
                        text = if (isProtected) "🔒 PROTECTED" else "🔓 PUBLIC",
                        color = if (isProtected) ZAmber else ZCyan,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    )
                }
            }
        }

        // Live circular preview container
        Box(
            modifier = Modifier
                .size(280.dp)
                .clip(CircleShape)
                .background(androidx.compose.ui.graphics.Color(bgColor))
                .border(2.dp, if (isProtected) ZAmber.copy(alpha = 0.6f) else ZBorder, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            if (renderedBitmap != null) {
                Image(
                    bitmap = renderedBitmap.asImageBitmap(),
                    contentDescription = "Z-Code",
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                Text(
                    text = when {
                        isProtected && password.isBlank() -> "Enter Password"
                        isExceedsLimit -> "Exceeds 150 KB Limit"
                        else -> "Enter Text"
                    },
                    color = if (isExceedsLimit) MaterialTheme.colorScheme.error else ZTextMuted,
                    fontSize = 12.sp,
                    fontFamily = FontFamily.Monospace
                )
            }
        }

        // Color Customization Row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Z-CODE COLOR PALETTE",
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = ZTextMuted
            )
            TextButton(
                onClick = {
                    val temp = fgColor
                    fgColor = bgColor
                    bgColor = temp
                },
                contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
            ) {
                Text("⇄ Invert Colors", fontSize = 11.sp, color = ZCyan, fontWeight = FontWeight.SemiBold)
            }
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            ANDROID_PALETTES.forEach { palette ->
                val isSelected = fgColor == palette.fg && bgColor == palette.bg
                Surface(
                    shape = RoundedCornerShape(16.dp),
                    color = if (isSelected) ZPanelBg else ZDarkBg,
                    border = androidx.compose.foundation.BorderStroke(
                        1.5.dp,
                        if (isSelected) ZCyan else ZBorder
                    ),
                    modifier = Modifier.clickable {
                        fgColor = palette.fg
                        bgColor = palette.bg
                    }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(12.dp)
                                .clip(CircleShape)
                                .background(palette.composeFg)
                                .border(1.dp, androidx.compose.ui.graphics.Color.Gray, CircleShape)
                        )
                        Text(
                            text = palette.name,
                            fontSize = 11.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            color = if (isSelected) ZText else ZTextMuted
                        )
                    }
                }
            }
        }

        // Input card
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = ZPanelBg),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "PAYLOAD INPUT",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = ZTextMuted
                    )
                    Surface(
                        shape = RoundedCornerShape(8.dp),
                        color = if (detectedType == ZCodeDataType.URL) ZCyan.copy(alpha = 0.15f) else ZDarkBg
                    ) {
                        Text(
                            text = if (detectedType == ZCodeDataType.URL) "URL LINK" else "PLAIN TEXT",
                            color = if (detectedType == ZCodeDataType.URL) ZCyan else ZTextMuted,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                        )
                    }
                }

                OutlinedTextField(
                    value = inputText,
                    onValueChange = { inputText = it },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Enter text, document, or URL (≤ 150 KB)...") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = ZText,
                        unfocusedTextColor = ZText,
                        focusedBorderColor = if (isProtected) ZAmber else ZCyan,
                        unfocusedBorderColor = ZBorder
                    ),
                    isError = isExceedsLimit
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = if (isExceedsLimit) "Exceeds direct limit ($currentBytes / $maxBytes B)" else "RS(85, 71) • $currentBytes / $maxBytes bytes",
                        fontSize = 11.sp,
                        color = if (isExceedsLimit) MaterialTheme.colorScheme.error else ZTextMuted
                    )
                    Text(
                        text = "${inputText.length} chars",
                        fontSize = 11.sp,
                        color = ZTextMuted
                    )
                }

                // Password Protection Toggle
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Password Protection",
                            fontSize = 13.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (isProtected) ZAmber else ZText
                        )
                        Text(
                            text = if (isProtected) "AES-256-GCM + PBKDF2" else "Public readable Z-Code",
                            fontSize = 10.sp,
                            color = ZTextMuted
                        )
                    }
                    Switch(
                        checked = isProtected,
                        onCheckedChange = { isProtected = it },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = ZAmber,
                            checkedTrackColor = ZAmber.copy(alpha = 0.3f)
                        )
                    )
                }

                if (isProtected) {
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Enter secret encryption password...") },
                        label = { Text("Encryption Password") },
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = ZText,
                            unfocusedTextColor = ZText,
                            focusedBorderColor = ZAmber,
                            unfocusedBorderColor = ZBorder
                        )
                    )
                }

                // Quick test presets
                Text(
                    text = "QUICK TEST SAMPLES",
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    color = ZTextMuted
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    AssistChip(
                        onClick = {
                            inputText = "Hello Zihan"
                            isProtected = false
                        },
                        label = { Text("Hello Zihan", fontSize = 11.sp) }
                    )
                    AssistChip(
                        onClick = {
                            inputText = "https://example.com"
                            isProtected = false
                        },
                        label = { Text("https://example.com", fontSize = 11.sp) }
                    )
                    AssistChip(
                        onClick = {
                            inputText = "Secret 42"
                            isProtected = true
                            password = "zihan123"
                        },
                        label = { Text("🔒 Secret 42", fontSize = 11.sp) }
                    )
                }
            }
        }

        // Action Buttons
        Button(
            onClick = {
                val sendIntent = Intent().apply {
                    action = Intent.ACTION_SEND
                    putExtra(Intent.EXTRA_TEXT, inputText)
                    type = "text/plain"
                }
                context.startActivity(Intent.createChooser(sendIntent, "Share Z-Code Payload"))
            },
            enabled = renderedBitmap != null,
            colors = ButtonDefaults.buttonColors(containerColor = ZCyan, contentColor = ZDarkBg),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth().height(48.dp)
        ) {
            Icon(Icons.Default.Share, contentDescription = null, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text("Share Z-Code Payload", fontWeight = FontWeight.Bold)
        }
    }
}
