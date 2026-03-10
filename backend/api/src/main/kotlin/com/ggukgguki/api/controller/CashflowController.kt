package com.ggukgguki.api.controller

import com.ggukgguki.api.dto.CashflowCategoryResult
import com.ggukgguki.api.dto.CashflowCreateRequest
import com.ggukgguki.api.dto.CashflowRecordResult
import com.ggukgguki.api.service.CashflowService
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
    @GetMapping("/categories")
    fun getCategories(): List<CashflowCategoryResult> = cashflowService.getCategories()

    @GetMapping("/records")
    fun getRecords(
        @RequestParam userId: Long,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) startDate: LocalDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) endDate: LocalDate
    ): List<CashflowRecordResult> = cashflowService.getRecords(userId, startDate, endDate)

    @PostMapping("/records")
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody request: CashflowCreateRequest): CashflowRecordResult =
        cashflowService.create(request)
}
