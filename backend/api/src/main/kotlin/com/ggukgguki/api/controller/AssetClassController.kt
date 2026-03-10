package com.ggukgguki.api.controller

import com.ggukgguki.api.dto.AllocationResult
import com.ggukgguki.api.dto.AllocationSetRequest
import com.ggukgguki.api.dto.AssetClassResult
import com.ggukgguki.api.service.AssetClassService
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.*

@Tag(name = "AssetClass", description = "자산군 마스터 + 유저별 비중")
@RestController
@RequestMapping("/api/asset-classes")
class AssetClassController(
    private val assetClassService: AssetClassService
) {
    @GetMapping
    fun getAll(): List<AssetClassResult> = assetClassService.getAllAssetClasses()

    @GetMapping("/categories")
    fun getCategories(): List<AssetClassResult> = assetClassService.getCategories()

    @GetMapping("/categories/{parentId}/children")
    fun getSubCategories(@PathVariable parentId: Long): List<AssetClassResult> =
        assetClassService.getSubCategories(parentId)

    @GetMapping("/allocations")
    fun getAllocations(@RequestParam userId: Long): List<AllocationResult> =
        assetClassService.getAllocationsByUser(userId)

    @PutMapping("/allocations")
    fun setAllocations(@RequestBody request: AllocationSetRequest): List<AllocationResult> =
        assetClassService.setAllocations(request)
}
