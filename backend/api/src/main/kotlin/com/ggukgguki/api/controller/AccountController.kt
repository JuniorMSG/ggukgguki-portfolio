package com.ggukgguki.api.controller

import com.ggukgguki.api.dto.AccountCreateRequest
import com.ggukgguki.api.dto.AccountResult
import com.ggukgguki.api.dto.AnnualLimitRequest
import com.ggukgguki.api.dto.AnnualLimitResult
import com.ggukgguki.api.service.AccountService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@Tag(name = "Account", description = "계좌 관리")
@RestController
@RequestMapping("/api/accounts")
class AccountController(
    private val accountService: AccountService
) {
    @Operation(summary = "내 계좌 목록", description = "로그인한 유저의 활성 계좌 목록을 조회합니다")
    @GetMapping
    fun getMyAccounts(@AuthenticationPrincipal userId: Long): List<AccountResult> =
        accountService.getByUserId(userId)

    @Operation(summary = "계좌 단건 조회", description = "ID로 계좌 정보를 조회합니다")
    @GetMapping("/{id}")
    fun getById(@PathVariable id: Long, @AuthenticationPrincipal userId: Long): AccountResult =
        accountService.getById(id, userId)

    @Operation(summary = "계좌 생성", description = "새 투자 계좌를 생성합니다 (연금저축, IRP, ISA 등)")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody request: AccountCreateRequest, @AuthenticationPrincipal userId: Long): AccountResult =
        accountService.create(request, userId)

    @Operation(summary = "계좌 연도별 한도 조회")
    @GetMapping("/{id}/limits")
    fun getLimits(@PathVariable id: Long, @AuthenticationPrincipal userId: Long): List<AnnualLimitResult> =
        accountService.getLimits(id, userId)

    @Operation(summary = "계좌 연도별 한도 설정/수정")
    @PutMapping("/{id}/limits")
    fun setLimit(
        @PathVariable id: Long,
        @RequestBody request: AnnualLimitRequest,
        @AuthenticationPrincipal userId: Long
    ): AnnualLimitResult = accountService.setLimit(id, request, userId)
}
