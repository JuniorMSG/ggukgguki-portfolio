package com.ggukgguki.api.controller

import com.ggukgguki.api.dto.HoldingCreateRequest
import com.ggukgguki.api.dto.HoldingResult
import com.ggukgguki.api.service.HoldingService
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@Tag(name = "Holding", description = "보유 종목")
@RestController
@RequestMapping("/api/holdings")
class HoldingController(
    private val holdingService: HoldingService
) {
    @GetMapping
    fun getAll(): List<HoldingResult> = holdingService.getAll()

    @GetMapping(params = ["accountId"])
    fun getByAccount(@RequestParam accountId: Long): List<HoldingResult> = holdingService.getByAccount(accountId)

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody request: HoldingCreateRequest): HoldingResult = holdingService.create(request)
}
