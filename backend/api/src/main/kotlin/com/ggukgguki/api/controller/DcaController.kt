package com.ggukgguki.api.controller

import com.ggukgguki.api.dto.DcaCreateRequest
import com.ggukgguki.api.dto.DcaResult
import com.ggukgguki.api.service.DcaService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@Tag(name = "DCA", description = "적립식 투자 기록")
@RestController
@RequestMapping("/api/dca")
class DcaController(
    private val dcaService: DcaService
) {
    @Operation(summary = "연도별 DCA 기록 조회", description = "특정 연도의 전체 적립식 투자 기록을 조회합니다")
    @GetMapping(params = ["year"])
    fun getByYear(@RequestParam year: Int): List<DcaResult> = dcaService.getByYear(year)

    @Operation(summary = "계좌별 DCA 기록 조회", description = "특정 계좌의 적립식 투자 기록을 조회합니다")
    @GetMapping(params = ["accountId"])
    fun getByAccount(@RequestParam accountId: Long): List<DcaResult> = dcaService.getByAccount(accountId)

    @Operation(summary = "DCA 기록 생성", description = "주간 적립식 투자 기록을 추가합니다")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody request: DcaCreateRequest): DcaResult = dcaService.create(request)
}
