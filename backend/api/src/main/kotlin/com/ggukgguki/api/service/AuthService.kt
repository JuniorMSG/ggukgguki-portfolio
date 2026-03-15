package com.ggukgguki.api.service

import com.ggukgguki.api.dto.LoginRequest
import com.ggukgguki.api.dto.SignupRequest
import com.ggukgguki.api.dto.TokenResponse
import com.ggukgguki.api.security.JwtProvider
import com.ggukgguki.core.domain.user.User
import com.ggukgguki.core.domain.user.UserRepository
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.json.gson.GsonFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class AuthService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtProvider: JwtProvider,
    @Value("\${google.client-id}") private val googleClientId: String
) {
    private val googleVerifier: GoogleIdTokenVerifier by lazy {
        GoogleIdTokenVerifier.Builder(NetHttpTransport(), GsonFactory.getDefaultInstance())
            .setAudience(listOf(googleClientId))
            .build()
    }

    @Transactional
    fun signup(request: SignupRequest): TokenResponse {
        if (userRepository.findByEmail(request.email) != null) {
            throw IllegalArgumentException("이미 사용 중인 이메일이에요: ${request.email}")
        }

        val user = User(
            email = request.email,
            nickname = request.nickname,
            password = passwordEncoder.encode(request.password)
        )
        val saved = userRepository.save(user)
        return generateTokenResponse(saved)
    }

    fun login(request: LoginRequest): TokenResponse {
        val user = userRepository.findByEmail(request.email)
            ?: throw IllegalArgumentException("이메일 또는 비밀번호가 맞지 않아요")

        if (!passwordEncoder.matches(request.password, user.password)) {
            throw IllegalArgumentException("이메일 또는 비밀번호가 맞지 않아요")
        }

        return generateTokenResponse(user)
    }

    @Transactional
    fun googleLogin(credential: String): TokenResponse {
        val idToken = googleVerifier.verify(credential)
            ?: throw IllegalArgumentException("유효하지 않은 구글 토큰이에요")

        val payload = idToken.payload
        val email = payload.email
        val name = payload["name"] as? String ?: email.substringBefore("@")

        val existingUser = userRepository.findByEmail(email)
        if (existingUser != null) {
            return generateTokenResponse(existingUser)
        }

        // 신규 유저 생성
        val newUser = User(
            email = email,
            nickname = name,
            password = ""
        )
        val saved = userRepository.save(newUser)
        return generateTokenResponse(saved, isNewUser = true)
    }

    @Transactional
    fun setNickname(userId: Long, nickname: String): TokenResponse {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("유저를 찾을 수 없어요") }
        user.nickname = nickname
        val saved = userRepository.save(user)
        return generateTokenResponse(saved)
    }

    fun refresh(refreshToken: String): TokenResponse {
        if (!jwtProvider.validateToken(refreshToken)) {
            throw IllegalArgumentException("유효하지 않은 리프레시 토큰이에요")
        }

        val userId = jwtProvider.getUserId(refreshToken)
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("유저를 찾을 수 없어요") }

        return generateTokenResponse(user)
    }

    private fun generateTokenResponse(user: User, isNewUser: Boolean = false): TokenResponse {
        return TokenResponse(
            accessToken = jwtProvider.generateAccessToken(user.id, user.email, user.nickname, user.role),
            refreshToken = jwtProvider.generateRefreshToken(user.id, user.email, user.nickname, user.role),
            userId = user.id,
            nickname = user.nickname,
            isNewUser = isNewUser
        )
    }
}
