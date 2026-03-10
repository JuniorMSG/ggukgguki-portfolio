package com.ggukgguki.api.dto

import com.ggukgguki.core.domain.user.User
import io.swagger.v3.oas.annotations.media.Schema

@Schema(description = "유저 생성 요청")
data class UserCreateRequest(
    @Schema(description = "이메일", example = "user@example.com")
    val email: String,
    @Schema(description = "닉네임", example = "MSG")
    val nickname: String
)

@Schema(description = "유저 정보")
data class UserResult(
    val id: Long,
    val email: String,
    val nickname: String,
    @Schema(description = "활성 상태")
    val isActive: Boolean
) {
    companion object {
        fun from(user: User) = UserResult(
            id = user.id,
            email = user.email,
            nickname = user.nickname,
            isActive = user.isActive
        )
    }
}
