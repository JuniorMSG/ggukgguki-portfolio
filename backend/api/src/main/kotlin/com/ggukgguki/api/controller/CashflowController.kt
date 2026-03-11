package com.ggukgguki.api.controller

import com.ggukgguki.api.dto.CashflowCategoryResult
import com.ggukgguki.api.dto.CashflowCreateRequest
import com.ggukgguki.api.dto.CashflowRecordResult
import com.ggukgguki.api.service.CashflowService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import java.time.LocalDate

@Tag(name = "Cashflow", description = "수입/지출 관리")
@RestController
@RequestMapping("/api/cashflow")
class CashflowController(
    private val cashflowService: CashflowService
) {
    @Operation(summary = "카테고리 전체 조회", description = "수입/지출 카테고리 마스터를 조회합니다 (대분류/소분류 계층)")
    @GetMapping("/categories")
    fun getCategories(): List<CashflowCategoryResult> = cashflowService.getCategories()

    @Operation(summary = "기간별 기록 조회", description = "특정 유저의 수입/지출 기록을 기간으로 조회합니다")
    @GetMapping("/records")
    fun getRecords(
        @RequestParam userId: Long,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate
    ): List<CashflowRecordResult> = cashflowService.getRecords(userId, startDate, endDate)

    @Operation(summary = "수입/지출 기록 생성", description = "수입 또는 지출 기록을 추가합니다 (카테고리에 따라 자동 구분)")
    @PostMapping("/records")
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody request: CashflowCreateRequest): CashflowRecordResult =
        cashflowService.create(request)

    @Operation(summary = "수입/지출 기록 삭제", description = "수입/지출 기록을 삭제합니다")
    @DeleteMapping("/records/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: Long) = cashflowService.delete(id)
}
