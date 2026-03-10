package com.ggukgguki.api.controller

import com.ggukgguki.api.dto.AssetClassCreateRequest
import com.ggukgguki.api.dto.AssetClassResult
import com.ggukgguki.api.service.AssetClassService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/asset-classes")
class AssetClassController(
    private val assetClassService: AssetClassService
) {
    @GetMapping
    fun getAll(): List<AssetClassResult> = assetClassService.getAll()

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody request: AssetClassCreateRequest): AssetClassResult =
        assetClassService.create(request)
}
