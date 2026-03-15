package com.ggukgguki.api.security

import io.jsonwebtoken.Claims
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import org.springframework.stereotype.Component
import java.util.*
import javax.crypto.SecretKey

@Component
class JwtProvider(
    private val jwtProperties: JwtProperties
) {
    private val key: SecretKey by lazy {
        Keys.hmacShaKeyFor(Base64.getDecoder().decode(jwtProperties.secret))
    }

    fun generateAccessToken(userId: Long, email: String, nickname: String, role: String): String =
        generateToken(userId, email, nickname, role, jwtProperties.accessExpiration)

    fun generateRefreshToken(userId: Long, email: String, nickname: String, role: String): String =
        generateToken(userId, email, nickname, role, jwtProperties.refreshExpiration)

    private fun generateToken(userId: Long, email: String, nickname: String, role: String, expiration: Long): String {
        val now = Date()
        return Jwts.builder()
            .subject(userId.toString())
            .claim("email", email)
            .claim("nickname", nickname)
            .claim("role", role)
            .issuedAt(now)
            .expiration(Date(now.time + expiration))
            .signWith(key)
            .compact()
    }

    fun validateToken(token: String): Boolean {
        return try {
            parseClaims(token)
            true
        } catch (e: Exception) {
            false
        }
    }

    fun getUserId(token: String): Long =
        parseClaims(token).subject.toLong()

    fun getRole(token: String): String =
        parseClaims(token)["role"] as? String ?: "USER"

    private fun parseClaims(token: String): Claims =
        Jwts.parser()
            .verifyWith(key)
            .build()
            .parseSignedClaims(token)
            .payload
}
