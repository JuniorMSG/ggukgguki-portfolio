package com.ggukgguki.api.controller

import com.ggukgguki.api.dto.UserCreateRequest
import com.ggukgguki.api.dto.UserResult
import com.ggukgguki.api.service.UserService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/users")
class UserController(
    private val userService: UserService
) {
    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long): UserResult = userService.getById(id)

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody request: UserCreateRequest): UserResult = userService.create(request)
}
