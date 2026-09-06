package com.zcode.app.ui

import android.content.Intent
import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
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

@Composable
fun GeneratorScreen() {
    val context = LocalContext.current
    var inputText by remember { mutableStateOf("Hello Zihan") }
    val encoder = remember { ZCodeEncoder() }

    val detectedType = remember(inputText) {
        if (ZCodeFormat.isUrl(inputText)) ZCodeDataType.URL else ZCodeDataType.TEXT
    }

    val isTooLong = remember(inputText, detectedType) {
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
        text.toByteArray(Charsets.UTF_8).size > ZCodeFormat.MAX_PAYLOAD
    }

    val renderedBitmap: Bitmap? = remember(inputText, isTooLong) {
        if (inputText.isBlank() || isTooLong) null
        else {
            try {
                val encoded = encoder.encode(inputText)
                encoder.renderBitmap(
                    encoded,
                    size = 512,
                    fgColor = android.graphics.Color.rgb(0, 240, 255),
                    bgColor = android.graphics.Color.rgb(10, 14, 23)
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
        Text(
            text = "Z-Code Generator",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = ZText
        )

        // Live circular preview container
        Box(
            modifier = Modifier
                .size(280.dp)
                .clip(CircleShape)
                .background(ZDarkBg)
                .border(2.dp, ZCyan.copy(alpha = 0.5f), CircleShape),
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
                    text = if (isTooLong) "Payload Exceeds Limit" else "Enter Text",
                    color = if (isTooLong) MaterialTheme.colorScheme.error else ZTextMuted,
                    fontSize = 12.sp,
                    fontFamily = FontFamily.Monospace
                )
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
                    placeholder = { Text("Enter text or URL...") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = ZText,
                        unfocusedTextColor = ZText,
                        focusedBorderColor = ZCyan,
                        unfocusedBorderColor = ZBorder
                    ),
                    isError = isTooLong
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = if (isTooLong) "Max 31 bytes payload" else "Reed-Solomon RS(49, 39)",
                        fontSize = 11.sp,
                        color = if (isTooLong) MaterialTheme.colorScheme.error else ZTextMuted
                    )
                    Text(
                        text = "${inputText.length} chars",
                        fontSize = 11.sp,
                        color = ZTextMuted
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
                        onClick = { inputText = "Hello Zihan" },
                        label = { Text("Hello Zihan", fontSize = 11.sp) }
                    )
                    AssistChip(
                        onClick = { inputText = "https://example.com" },
                        label = { Text("https://example.com", fontSize = 11.sp) }
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
