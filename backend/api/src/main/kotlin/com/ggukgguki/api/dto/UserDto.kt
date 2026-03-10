package com.ggukgguki.api.dto

import com.ggukgguki.core.domain.user.User

data class UserCreateRequest(
    val email: String,
    val nickname: String
)

data class UserResult(
    val id: Long,
    val email: String,
    val nickname: String,
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
