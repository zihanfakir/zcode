package com.zcode.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.zcode.app.ui.theme.*

@Composable
fun SettingsScreen() {
    var safeBrowsing by remember { mutableStateOf(true) }
    var highPrecision by remember { mutableStateOf(true) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ZDarkBg)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Settings",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = ZText
        )

        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = ZPanelBg),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Untrusted Link Sandbox", color = ZText, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("Always confirm before opening scanned URLs in browser", color = ZTextMuted, fontSize = 11.sp)
                    }
                    Switch(
                        checked = safeBrowsing,
                        onCheckedChange = { safeBrowsing = it },
                        colors = SwitchDefaults.colors(checkedThumbColor = ZDarkBg, checkedTrackColor = ZCyan)
                    )
                }

                HorizontalDivider(color = ZBorder)

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Multi-Pass Rotation Lock", color = ZText, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        Text("Enable sub-degree angular fine-search for extreme angles", color = ZTextMuted, fontSize = 11.sp)
                    }
                    Switch(
                        checked = highPrecision,
                        onCheckedChange = { highPrecision = it },
                        colors = SwitchDefaults.colors(checkedThumbColor = ZDarkBg, checkedTrackColor = ZCyan)
                    )
                }
            }
        }

        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = ZPanelBg),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("ABOUT Z-CODE", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = ZTextMuted)
                Text("Version 1.0.0 (RFC-ZCODE-01)", color = ZText, fontSize = 13.sp)
                Text("Engine: Reed-Solomon RS(49, 39) over GF(256)", color = ZCyan, fontSize = 11.sp)
                Text("Concentric Polar Layout with 7 Data Tracks", color = ZTextMuted, fontSize = 11.sp)
            }
        }
    }
}
