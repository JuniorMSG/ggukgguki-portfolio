package com.ggukgguki.api.controller

import com.ggukgguki.api.dto.DcaCreateRequest
import com.ggukgguki.api.dto.DcaResult
import com.ggukgguki.api.service.DcaService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/dca")
class DcaController(
    private val dcaService: DcaService
) {
    @GetMapping(params = ["year"])
    fun getByYear(@RequestParam year: Int): List<DcaResult> = dcaService.getByYear(year)

    @GetMapping(params = ["accountId"])
    fun getByAccount(@RequestParam accountId: Long): List<DcaResult> = dcaService.getByAccount(accountId)

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody request: DcaCreateRequest): DcaResult = dcaService.create(request)
}
