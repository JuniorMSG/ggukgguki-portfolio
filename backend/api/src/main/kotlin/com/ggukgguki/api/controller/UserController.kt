package com.ggukgguki.api.controller

import com.ggukgguki.api.dto.UserCreateRequest
import com.ggukgguki.api.dto.UserResult
import com.ggukgguki.api.service.UserService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@Tag(name = "User", description = "유저 관리")
@RestController
@RequestMapping("/api/users")
class UserController(
    private val userService: UserService
) {
    @Operation(summary = "유저 단건 조회", description = "ID로 유저 정보를 조회합니다")
    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long): UserResult = userService.getById(id)

    @Operation(summary = "유저 생성", description = "이메일과 닉네임으로 새 유저를 생성합니다")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody request: UserCreateRequest): UserResult = userService.create(request)
}
