package com.ggukgguki.api.controller

import com.ggukgguki.api.dto.AccountCreateRequest
import com.ggukgguki.api.dto.AccountResult
import com.ggukgguki.api.service.AccountService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/accounts")
class AccountController(
    private val accountService: AccountService
) {
    @GetMapping
    fun getAll(): List<AccountResult> = accountService.getAll()

    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long): AccountResult = accountService.getById(id)

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody request: AccountCreateRequest): AccountResult = accountService.create(request)
}
