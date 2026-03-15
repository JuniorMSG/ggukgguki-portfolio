package com.ggukgguki.api.controller

import com.ggukgguki.api.dto.HoldingCreateRequest
import com.ggukgguki.api.dto.HoldingUpdateRequest
import com.ggukgguki.api.dto.HoldingResult
import com.ggukgguki.api.service.HoldingService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@Tag(name = "Holding", description = "보유 종목")
@RestController
@RequestMapping("/api/holdings")
class HoldingController(
    private val holdingService: HoldingService
) {
    @Operation(summary = "계좌별 보유 종목 조회", description = "특정 계좌에 속한 보유 종목을 조회합니다")
    @GetMapping
    fun getByAccount(
        @RequestParam accountId: Long,
        @AuthenticationPrincipal userId: Long
    ): List<HoldingResult> = holdingService.getByAccount(accountId, userId)

    @Operation(summary = "보유 종목 등록", description = "계좌에 새 종목을 추가합니다 (티커, 자산군 지정)")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(
        @RequestBody request: HoldingCreateRequest,
        @AuthenticationPrincipal userId: Long
    ): HoldingResult = holdingService.create(request, userId)

    @Operation(summary = "보유 종목 수정", description = "수량, 매수가 등을 수정합니다")
    @PutMapping("/{id}")
    fun update(
        @PathVariable id: Long,
        @RequestBody request: HoldingUpdateRequest,
        @AuthenticationPrincipal userId: Long
    ): HoldingResult = holdingService.update(id, request, userId)
}
