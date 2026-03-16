package com.ggukgguki.api.dto

import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "로그인 요청")
data class LoginRequest(
    @Schema(description = "이메일", example = "user@example.com")
    val email: String,
    @Schema(description = "비밀번호")
    val password: String
)

@Schema(description = "회원가입 요청")
data class SignupRequest(
    @Schema(description = "이메일", example = "user@example.com")
    val email: String,
    @Schema(description = "비밀번호")
    val password: String,
    @Schema(description = "닉네임", example = "MSG")
    val nickname: String
)

@Schema(description = "토큰 응답")
data class TokenResponse(
    val accessToken: String,
    val refreshToken: String,
    val userId: Long,
    val nickname: String,
    val role: String = "USER",
    @Schema(description = "신규 유저 여부 (구글 로그인 시)")
    val isNewUser: Boolean = false
)

@Schema(description = "닉네임 설정 요청")
data class NicknameRequest(
    val nickname: String
)

@Schema(description = "구글 로그인 요청")
data class GoogleLoginRequest(
    @Schema(description = "구글 ID 토큰 (credential)")
    val credential: String
)

@Schema(description = "토큰 갱신 요청")
data class RefreshRequest(
    val refreshToken: String
)
