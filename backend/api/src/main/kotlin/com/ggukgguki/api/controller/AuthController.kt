package com.ggukgguki.api.controller

import com.ggukgguki.api.dto.GoogleLoginRequest
import com.ggukgguki.api.dto.LoginRequest
import com.ggukgguki.api.dto.RefreshRequest
import com.ggukgguki.api.dto.SignupRequest
import com.ggukgguki.api.dto.TokenResponse
import com.ggukgguki.api.service.AuthService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@Tag(name = "Auth", description = "인증")
@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authService: AuthService
) {
    @Operation(summary = "회원가입")
    @PostMapping("/signup")
    @ResponseStatus(HttpStatus.CREATED)
    fun signup(@RequestBody request: SignupRequest): TokenResponse =
        authService.signup(request)

    @Operation(summary = "로그인")
    @PostMapping("/login")
    fun login(@RequestBody request: LoginRequest): TokenResponse =
        authService.login(request)

    @Operation(summary = "구글 로그인", description = "구글 ID 토큰으로 로그인 (미가입 시 자동 회원가입)")
    @PostMapping("/google")
    fun googleLogin(@RequestBody request: GoogleLoginRequest): TokenResponse =
        authService.googleLogin(request.credential)

    @Operation(summary = "토큰 갱신")
    @PostMapping("/refresh")
    fun refresh(@RequestBody request: RefreshRequest): TokenResponse =
        authService.refresh(request.refreshToken)
}
