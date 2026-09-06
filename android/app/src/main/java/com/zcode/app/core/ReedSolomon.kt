package com.zcode.app.core

/**
 * Systematic Reed-Solomon Codec for Android.
 * Mirror implementation of Z-Code core specification.
 */
class ReedSolomon(
    val numEccBytes: Int,
    private val gf: GaloisField = GaloisField.DEFAULT
) {
    private val generatorPoly: IntArray = buildGenerator(numEccBytes)

    private fun buildGenerator(eccLen: Int): IntArray {
        var g = intArrayOf(1)
        for (i in 0 until eccLen) {
            val term = intArrayOf(1, gf.exp(i))
            g = gf.polyMul(g, term)
        }
        return g
    }

    fun encode(data: ByteArray): ByteArray {
        val dataInt = IntArray(data.size + numEccBytes)
        for (i in data.indices) {
            dataInt[i] = data[i].toInt() and 0xFF
        }

        val (_, remainder) = gf.polyDiv(dataInt, generatorPoly)

        val codeword = ByteArray(data.size + numEccBytes)
        System.arraycopy(data, 0, codeword, 0, data.size)
        for (i in remainder.indices) {
            codeword[data.size + i] = remainder[i].toByte()
        }
        return codeword
    }

    fun decode(receivedCodeword: ByteArray): ByteArray {
        val n = receivedCodeword.size
        val k = n - numEccBytes
        if (k <= 0) throw IllegalArgumentException("Codeword too short")

        val rInt = IntArray(n) { receivedCodeword[it].toInt() and 0xFF }

        // 1. Syndromes
        val syndromes = IntArray(numEccBytes)
        var hasError = false
        for (i in 0 until numEccBytes) {
            val s = gf.polyEval(rInt, gf.exp(i))
            syndromes[i] = s
            if (s != 0) hasError = true
        }

        if (!hasError) {
            return receivedCodeword.copyOfRange(0, k)
        }

        // 2. Berlekamp-Massey
        var lambda = intArrayOf(1)
        var b = intArrayOf(1)
        var l = 0

        for (i in 0 until numEccBytes) {
            var delta = syndromes[i]
            for (j in 1..l) {
                if (j < lambda.size) {
                    delta = delta xor gf.mul(lambda[lambda.size - 1 - j], syndromes[i - j])
                }
            }

            val bShifted = IntArray(b.size + 1)
            System.arraycopy(b, 0, bShifted, 0, b.size)

            if (delta != 0) {
                val scaledB = gf.polyScale(bShifted, delta)
                val newLambda = gf.polyAdd(lambda, scaledB)

                if (2 * l <= i) {
                    b = gf.polyScale(lambda, gf.inv(delta))
                    l = i + 1 - l
                } else {
                    b = bShifted
                }
                lambda = newLambda
            } else {
                b = bShifted
            }
        }

        val numErrors = l
        if (numErrors > numEccBytes / 2) {
            throw IllegalStateException("Too many errors to correct")
        }

        // 3. Chien search
        val errorPositions = mutableListOf<Int>()
        for (pos in 0 until n) {
            val power = (n - 1 - pos) % 255
            val invAlpha = gf.exp((255 - power) % 255)

            var value = 0
            var xPower = 1
            for (deg in lambda.indices) {
                val coef = lambda[lambda.size - 1 - deg]
                value = value xor gf.mul(coef, xPower)
                xPower = gf.mul(xPower, invAlpha)
            }

            if (value == 0) {
                errorPositions.add(pos)
            }
        }

        if (errorPositions.size != numErrors) {
            throw IllegalStateException("Could not find all error roots")
        }

        // 4. Forney Algorithm
        val sLen = syndromes.size
        val omega = IntArray(sLen)
        for (i in 0 until sLen) {
            var sum = 0
            for (j in 0..i) {
                if (j < lambda.size) {
                    val lCoef = lambda[lambda.size - 1 - j]
                    val sCoef = syndromes[i - j]
                    sum = sum xor gf.mul(lCoef, sCoef)
                }
            }
            omega[i] = sum
        }

        val corrected = rInt.clone()
        for (pos in errorPositions) {
            val power = (n - 1 - pos) % 255
            val xiInv = gf.exp((255 - power) % 255)
            val xi = gf.exp(power)

            var omegaVal = 0
            var xPower = 1
            for (w in omega) {
                omegaVal = omegaVal xor gf.mul(w, xPower)
                xPower = gf.mul(xPower, xiInv)
            }

            var lambdaPrimeVal = 0
            var dPower = 1
            var deg = 1
            while (deg < lambda.size) {
                val coef = lambda[lambda.size - 1 - deg]
                lambdaPrimeVal = lambdaPrimeVal xor gf.mul(coef, dPower)
                dPower = gf.mul(dPower, gf.mul(xiInv, xiInv))
                deg += 2
            }

            if (lambdaPrimeVal == 0) throw IllegalStateException("Derivative zero in Forney")

            val errorMagnitude = gf.mul(xi, gf.div(omegaVal, lambdaPrimeVal))
            corrected[pos] = corrected[pos] xor errorMagnitude
        }

        // 5. Verification
        for (i in 0 until numEccBytes) {
            if (gf.polyEval(corrected, gf.exp(i)) != 0) {
                throw IllegalStateException("Post-correction syndrome verification failed")
            }
        }

        val result = ByteArray(k)
        for (i in 0 until k) {
            result[i] = corrected[i].toByte()
        }
        return result
    }
}
