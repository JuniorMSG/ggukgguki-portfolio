package com.ggukgguki.api.controller

import com.ggukgguki.api.dto.NicknameRequest
import com.ggukgguki.api.dto.TokenResponse
import com.ggukgguki.api.dto.UserResult
import com.ggukgguki.api.service.AuthService
import com.ggukgguki.api.service.UserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@Tag(name = "User", description = "유저 관리")
@RestController
@RequestMapping("/api/users")
class UserController(
    private val userService: UserService,
    private val authService: AuthService
) {
    @Operation(summary = "내 정보 조회")
    @GetMapping("/me")
    fun getMe(@AuthenticationPrincipal userId: Long): UserResult =
        userService.getById(userId)

    @Operation(summary = "닉네임 설정", description = "내 닉네임을 변경합니다")
    @PutMapping("/me/nickname")
    fun setNickname(
        @RequestBody request: NicknameRequest,
        @AuthenticationPrincipal userId: Long
    ): TokenResponse = authService.setNickname(userId, request.nickname)
}
