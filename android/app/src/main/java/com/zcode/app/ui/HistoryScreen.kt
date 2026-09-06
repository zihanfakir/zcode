package com.zcode.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.zcode.app.ui.theme.*

@Composable
fun HistoryScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ZDarkBg)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Scan History",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = ZText
        )

        // Sample history entries
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
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("PLAIN TEXT", color = ZCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Text("Just now", color = ZTextMuted, fontSize = 10.sp)
                }
                Text("Hello Zihan", color = ZText, fontSize = 14.sp, fontFamily = FontFamily.Monospace)
            }
        }

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
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("URL LINK", color = ZCyan, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    Text("5 mins ago", color = ZTextMuted, fontSize = 10.sp)
                }
                Text("https://example.com", color = ZText, fontSize = 14.sp, fontFamily = FontFamily.Monospace)
            }
        }
    }
}
