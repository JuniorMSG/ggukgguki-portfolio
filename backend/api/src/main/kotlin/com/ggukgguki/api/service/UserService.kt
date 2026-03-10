package com.ggukgguki.api.service

import com.ggukgguki.api.dto.UserCreateRequest
import com.ggukgguki.api.dto.UserResult
import com.ggukgguki.core.domain.user.User
import com.ggukgguki.core.domain.user.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class UserService(
    private val userRepository: UserRepository
) {
    fun getById(id: Long): UserResult =
        userRepository.findById(id)
            .map { UserResult.from(it) }
            .orElseThrow { IllegalArgumentException("유저를 찾을 수 없어요: $id") }

    fun getByEmail(email: String): UserResult? =
        userRepository.findByEmail(email)?.let { UserResult.from(it) }

    @Transactional
    fun create(request: UserCreateRequest): UserResult {
        val user = User(
            email = request.email,
            nickname = request.nickname
        )
        return UserResult.from(userRepository.save(user))
    }
}
