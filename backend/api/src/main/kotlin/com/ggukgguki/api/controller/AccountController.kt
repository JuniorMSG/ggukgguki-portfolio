package com.ggukgguki.api.controller

import com.ggukgguki.api.dto.AccountCreateRequest
import com.ggukgguki.api.dto.AccountResult
import com.ggukgguki.api.service.AccountService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@Tag(name = "Account", description = "계좌 관리")
@RestController
@RequestMapping("/api/accounts")
class AccountController(
    private val accountService: AccountService
) {
    @Operation(summary = "유저별 계좌 목록", description = "특정 유저의 활성 계좌 목록을 조회합니다")
    @GetMapping(params = ["userId"])
    fun getByUserId(@RequestParam userId: Long): List<AccountResult> = accountService.getByUserId(userId)

    @Operation(summary = "계좌 단건 조회", description = "ID로 계좌 정보를 조회합니다")
    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long): AccountResult = accountService.getById(id)

    @Operation(summary = "계좌 생성", description = "새 투자 계좌를 생성합니다 (연금저축, IRP, ISA 등)")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody request: AccountCreateRequest): AccountResult = accountService.create(request)
}
