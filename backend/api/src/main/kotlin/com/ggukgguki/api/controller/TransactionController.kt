package com.ggukgguki.api.controller

import com.ggukgguki.api.dto.TransactionCreateRequest
import com.ggukgguki.api.dto.TransactionResult
import com.ggukgguki.api.service.TransactionService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/transactions")
class TransactionController(
    private val transactionService: TransactionService
) {
    @GetMapping(params = ["holdingId"])
    fun getByHolding(@RequestParam holdingId: Long): List<TransactionResult> =
        transactionService.getByHolding(holdingId)

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody request: TransactionCreateRequest): TransactionResult =
        transactionService.create(request)
}
