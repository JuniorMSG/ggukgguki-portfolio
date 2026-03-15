package com.ggukgguki.api.controller

import com.ggukgguki.api.dto.TransactionCreateRequest
import com.ggukgguki.api.dto.TransactionResult
import com.ggukgguki.api.service.TransactionService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@Tag(name = "Transaction", description = "매수/매도 기록")
@RestController
@RequestMapping("/api/transactions")
class TransactionController(
    private val transactionService: TransactionService
) {
    @Operation(summary = "종목별 거래 내역 조회", description = "특정 보유 종목의 매수/매도 기록을 조회합니다")
    @GetMapping(params = ["holdingId"])
    fun getByHolding(
        @RequestParam holdingId: Long,
        @AuthenticationPrincipal userId: Long
    ): List<TransactionResult> = transactionService.getByHolding(holdingId, userId)

    @Operation(summary = "거래 기록 생성", description = "매수 또는 매도 기록을 추가합니다 (총액은 수량×단가로 자동 계산)")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @RequestBody request: TransactionCreateRequest,
        @AuthenticationPrincipal userId: Long
    ): TransactionResult = transactionService.create(request, userId)
}
