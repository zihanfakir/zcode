package com.zcode.app.core

object CRC16 {
    private val TABLE = IntArray(256)

    init {
        for (i in 0 until 256) {
            var curr = (i shl 8) and 0xFFFF
            for (j in 0 until 8) {
                curr = if ((curr and 0x8000) != 0) {
                    ((curr shl 1) xor 0x1021) and 0xFFFF
                } else {
                    (curr shl 1) and 0xFFFF
                }
            }
            TABLE[i] = curr
        }
    }

    fun calculate(data: ByteArray): Int {
        var crc = 0xFFFF
        for (b in data) {
            val byteVal = b.toInt() and 0xFF
            val tableIndex = ((crc ushr 8) xor byteVal) and 0xFF
            crc = ((crc shl 8) xor TABLE[tableIndex]) and 0xFFFF
        }
        return crc
    }

    fun verify(dataWithCrc: ByteArray): Boolean {
        if (dataWithCrc.size < 2) return false
        val dataLen = dataWithCrc.size - 2
        val data = dataWithCrc.copyOfRange(0, dataLen)
        val expectedCrc = ((dataWithCrc[dataLen].toInt() and 0xFF) shl 8) or
                (dataWithCrc[dataLen + 1].toInt() and 0xFF)
        val actualCrc = calculate(data)
        return expectedCrc == actualCrc
    }
}
