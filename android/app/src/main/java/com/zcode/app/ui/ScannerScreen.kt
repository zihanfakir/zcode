package com.zcode.app.ui

import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.widget.Toast
import androidx.compose.ui.text.style.TextAlign
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Camera
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.OpenInBrowser
import androidx.compose.material.icons.filled.Photo
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.zcode.app.core.ZCodeDataType
import com.zcode.app.core.ZCodeDecodedResult
import com.zcode.app.core.ZCodeDecoder
import com.zcode.app.ui.theme.*
import java.util.concurrent.Executors

@Composable
fun ScannerScreen() {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val clipboardManager = LocalClipboardManager.current

    var decodedResult by remember { mutableStateOf<ZCodeDecodedResult?>(null) }
    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(
                context,
                android.Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED
        )
    }
    var showSafeLinkDialog by remember { mutableStateOf(false) }

    val decoder = remember { ZCodeDecoder() }
    val cameraExecutor = remember { Executors.newSingleThreadExecutor() }

    DisposableEffect(Unit) {
        onDispose {
            cameraExecutor.shutdown()
        }
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        hasCameraPermission = granted
    }

    LaunchedEffect(Unit) {
        if (!hasCameraPermission) {
            permissionLauncher.launch(android.Manifest.permission.CAMERA)
        }
    }

    // Image Picker fallback
    val galleryLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            try {
                val inputStream = context.contentResolver.openInputStream(it)
                val bitmap = android.graphics.BitmapFactory.decodeStream(inputStream)
                if (bitmap != null) {
                    val res = decoder.decodeBitmap(bitmap)
                    decodedResult = res
                    if (res.payload.type == ZCodeDataType.URL) {
                        showSafeLinkDialog = true
                    }
                }
            } catch (e: Exception) {
                Toast.makeText(context, "Could not decode Z-Code: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ZDarkBg)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Z-Code Scanner",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = ZText
        )

        // Viewfinder
        Box(
            modifier = Modifier
                .size(280.dp)
                .clip(CircleShape)
                .background(ZDarkBg)
                .border(2.dp, ZCyan, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            if (hasCameraPermission) {
                AndroidView(
                    factory = { ctx ->
                        val previewView = PreviewView(ctx)
                        val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                        cameraProviderFuture.addListener({
                            val cameraProvider = cameraProviderFuture.get()
                            val preview = Preview.Builder().build().also {
                                it.surfaceProvider = previewView.surfaceProvider
                            }

                            val imageAnalysis = ImageAnalysis.Builder()
                                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                                .setTargetResolution(android.util.Size(1080, 1920))
                                .build()

                            imageAnalysis.setAnalyzer(cameraExecutor) { imageProxy ->
                                imageProxy.use { proxy ->
                                    if (decodedResult != null && (decodedResult!!.payload.isLocked || showSafeLinkDialog)) {
                                        return@use
                                    }

                                    try {
                                        val plane = proxy.planes[0]
                                        val buffer = plane.buffer.duplicate()
                                        buffer.rewind()
                                        val width = proxy.width
                                        val height = proxy.height
                                        val rowStride = plane.rowStride

                                        val minDim = minOf(width, height)
                                        val startX = (width - minDim) / 2
                                        val startY = (height - minDim) / 2
                                        val squareGray = ByteArray(minDim * minDim)

                                        for (row in 0 until minDim) {
                                            buffer.position((startY + row) * rowStride + startX)
                                            buffer.get(squareGray, row * minDim, minDim)
                                        }

                                        val res = decoder.decodeGrayscale(squareGray, minDim, minDim)
                                        if (res != null) {
                                            android.os.Handler(android.os.Looper.getMainLooper()).post {
                                                decodedResult = res
                                                if (res.payload.type == ZCodeDataType.URL && !res.payload.isLocked) {
                                                    showSafeLinkDialog = true
                                                }
                                            }
                                        }
                                    } catch (_: Exception) {
                                        // Scan in progress or invalid frame
                                    }
                                }
                            }

                            val cameraSelector = if (cameraProvider.hasCamera(CameraSelector.DEFAULT_BACK_CAMERA)) {
                                CameraSelector.DEFAULT_BACK_CAMERA
                            } else if (cameraProvider.hasCamera(CameraSelector.DEFAULT_FRONT_CAMERA)) {
                                CameraSelector.DEFAULT_FRONT_CAMERA
                            } else {
                                CameraSelector.DEFAULT_BACK_CAMERA
                            }

                            try {
                                cameraProvider.unbindAll()
                                cameraProvider.bindToLifecycle(
                                    lifecycleOwner,
                                    cameraSelector,
                                    preview,
                                    imageAnalysis
                                )
                            } catch (e: Exception) {
                                e.printStackTrace()
                            }
                        }, ContextCompat.getMainExecutor(ctx))
                        previewView
                    },
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center,
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "Camera Permission Required",
                        color = ZTextMuted,
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Button(
                        onClick = { permissionLauncher.launch(android.Manifest.permission.CAMERA) },
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = ZCyan, contentColor = ZDarkBg)
                    ) {
                        Text("Grant Permission", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Reticle center dot
            Box(
                modifier = Modifier
                    .size(10.dp)
                    .clip(CircleShape)
                    .background(ZCyan)
            )
        }

        // Gallery picker button
        OutlinedButton(
            onClick = { galleryLauncher.launch("image/*") },
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.outlinedButtonColors(contentColor = ZCyan),
            modifier = Modifier.fillMaxWidth()
        ) {
            Icon(Icons.Default.Photo, contentDescription = null, modifier = Modifier.size(16.dp))
            Spacer(modifier = Modifier.width(8.dp))
            Text("Pick Image from Gallery")
        }

        // Result Card
        if (decodedResult != null) {
            val result = decodedResult!!
            var unlockPassword by remember(result) { mutableStateOf("") }

            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = ZPanelBg),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = when {
                                result.payload.isLocked -> "🔒 PROTECTED Z-CODE"
                                result.payload.type == ZCodeDataType.URL -> "URL LINK"
                                else -> "PLAIN TEXT"
                            },
                            color = when {
                                result.payload.isLocked -> ZAmber
                                else -> ZCyan
                            },
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "RS(85, 71) Verified",
                            color = ZEmerald,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }

                    if (result.payload.isLocked) {
                        // Locked Code view
                        Column(
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(ZAmber.copy(alpha = 0.08f), RoundedCornerShape(12.dp))
                                .padding(12.dp)
                        ) {
                            Text(
                                text = "🔒 This Z-Code is password protected.",
                                color = ZText,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Encrypted with AES-256-GCM. Enter password to view contents:",
                                color = ZTextMuted,
                                fontSize = 11.sp
                            )
                            OutlinedTextField(
                                value = unlockPassword,
                                onValueChange = { unlockPassword = it },
                                modifier = Modifier.fillMaxWidth(),
                                placeholder = { Text("Enter password...") },
                                singleLine = true,
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedTextColor = ZText,
                                    unfocusedTextColor = ZText,
                                    focusedBorderColor = ZAmber,
                                    unfocusedBorderColor = ZBorder
                                )
                            )
                            Button(
                                onClick = {
                                    if (unlockPassword.isNotBlank()) {
                                        try {
                                            val unlocked = ZCodeDecoder.unlock(result.payload, unlockPassword)
                                            decodedResult = result.copy(payload = unlocked)
                                            if (unlocked.type == ZCodeDataType.URL) {
                                                showSafeLinkDialog = true
                                            }
                                        } catch (e: Exception) {
                                            Toast.makeText(context, "Incorrect password. Decryption failed.", Toast.LENGTH_SHORT).show()
                                        }
                                    }
                                },
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = ZAmber, contentColor = ZDarkBg),
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Text("Unlock Z-Code", fontWeight = FontWeight.Bold)
                            }
                        }
                    } else {
                        // Unlocked content view
                        Text(
                            text = result.payload.content,
                            color = ZText,
                            fontSize = 14.sp,
                            fontFamily = FontFamily.Monospace
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = {
                                    clipboardManager.setText(AnnotatedString(result.payload.content))
                                    Toast.makeText(context, "Copied to clipboard", Toast.LENGTH_SHORT).show()
                                },
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = ZBorder, contentColor = ZText),
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Copy", fontSize = 12.sp)
                            }

                            if (result.payload.type == ZCodeDataType.URL) {
                                Button(
                                    onClick = { showSafeLinkDialog = true },
                                    shape = RoundedCornerShape(8.dp),
                                    colors = ButtonDefaults.buttonColors(containerColor = ZCyan, contentColor = ZDarkBg),
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(Icons.Default.OpenInBrowser, contentDescription = null, modifier = Modifier.size(14.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Open Link", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Safe Link Confirmation Dialog
    if (showSafeLinkDialog && decodedResult?.payload?.type == ZCodeDataType.URL) {
        val url = decodedResult!!.payload.content
        AlertDialog(
            onDismissRequest = { showSafeLinkDialog = false },
            title = { Text("Open Untrusted Link?") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Z-Code never automatically opens links. Do you trust this destination?", fontSize = 13.sp)
                    Text(url, color = ZCyan, fontFamily = FontFamily.Monospace, fontSize = 12.sp)
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        showSafeLinkDialog = false
                        val safeUrl = if (url.startsWith("http")) url else "https://$url"
                        try {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(safeUrl))
                            context.startActivity(intent)
                        } catch (_: Exception) {}
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = ZCyan, contentColor = ZDarkBg)
                ) {
                    Text("Open Browser")
                }
            },
            dismissButton = {
                TextButton(onClick = { showSafeLinkDialog = false }) {
                    Text("Cancel", color = ZTextMuted)
                }
            },
            containerColor = ZPanelBg,
            titleContentColor = ZText,
            textContentColor = ZTextMuted
        )
    }
}
