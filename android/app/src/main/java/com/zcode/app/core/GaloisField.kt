package com.zcode.app.core

/**
 * Galois Field GF(2^8) Arithmetic for Z-Code.
 * Irreducible polynomial: x^8 + x^4 + x^3 + x^2 + 1 (0x11D / 285)
 * Generator: alpha = 2 (0x02)
 */
class GaloisField {
    companion object {
        const val FIELD_SIZE = 256
        const val PRIMITIVE_POLY = 0x11D

        val DEFAULT = GaloisField()
    }

    val expTable = IntArray(512)
    val logTable = IntArray(256)

    init {
        var x = 1
        for (i in 0 until 255) {
            expTable[i] = x
            logTable[x] = i
            x = x shl 1
            if ((x and 0x100) != 0) {
                x = x xor PRIMITIVE_POLY
            }
        }
        for (i in 255 until 512) {
            expTable[i] = expTable[i - 255]
        }
        logTable[0] = 0
    }

    fun add(a: Int, b: Int): Int = (a xor b) and 0xFF
    fun sub(a: Int, b: Int): Int = (a xor b) and 0xFF

    fun mul(a: Int, b: Int): Int {
        if (a == 0 || b == 0) return 0
        return expTable[logTable[a] + logTable[b]]
    }

    fun div(a: Int, b: Int): Int {
        if (b == 0) throw ArithmeticException("GF division by zero")
        if (a == 0) return 0
        val diff = logTable[a] - logTable[b] + 255
        return expTable[diff % 255]
    }

    fun inv(a: Int): Int {
        if (a == 0) throw ArithmeticException("GF inversion of zero")
        return expTable[255 - logTable[a]]
    }

    fun exp(power: Int): Int = expTable[((power % 255) + 255) % 255]

    fun log(a: Int): Int {
        if (a == 0) throw ArithmeticException("GF logarithm of zero")
        return logTable[a]
    }

    fun polyEval(poly: IntArray, x: Int): Int {
        var y = 0
        for (c in poly) {
            y = mul(y, x) xor c
        }
        return y
    }

    fun polyAdd(p: IntArray, q: IntArray): IntArray {
        val len = maxOf(p.size, q.size)
        val result = IntArray(len)
        for (i in 0 until len) {
            val pIdx = i + p.size - len
            val qIdx = i + q.size - len
            val pVal = if (pIdx >= 0) p[pIdx] else 0
            val qVal = if (qIdx >= 0) q[qIdx] else 0
            result[i] = pVal xor qVal
        }
        return result
    }

    fun polyMul(p: IntArray, q: IntArray): IntArray {
        val result = IntArray(p.size + q.size - 1)
        for (i in p.indices) {
            for (j in q.indices) {
                result[i + j] = result[i + j] xor mul(p[i], q[j])
            }
        }
        return result
    }

    fun polyScale(poly: IntArray, scalar: Int): IntArray {
        val result = IntArray(poly.size)
        for (i in poly.indices) {
            result[i] = mul(poly[i], scalar)
        }
        return result
    }

    fun polyDiv(dividend: IntArray, divisor: IntArray): Pair<IntArray, IntArray> {
        val out = dividend.clone()
        val divisorLeadInv = inv(divisor[0])

        for (i in 0..(out.size - divisor.size)) {
            val coef = mul(out[i], divisorLeadInv)
            if (coef != 0) {
                for (j in divisor.indices) {
                    out[i + j] = out[i + j] xor mul(divisor[j], coef)
                }
            }
        }

        val remLen = divisor.size - 1
        val quotient = out.copyOfRange(0, out.size - remLen)
        val remainder = out.copyOfRange(out.size - remLen, out.size)
        return Pair(quotient, remainder)
    }
}
