package com.ggukgguki.api.controller

import com.ggukgguki.api.dto.AllocationResult
import com.ggukgguki.api.dto.AllocationSetRequest
import com.ggukgguki.api.dto.AssetClassResult
import com.ggukgguki.api.service.AssetClassService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.*

@Tag(name = "AssetClass", description = "자산군 마스터 + 유저별 비중")
@RestController
@RequestMapping("/api/asset-classes")
class AssetClassController(
    private val assetClassService: AssetClassService
) {
    @Operation(summary = "전체 자산군 조회", description = "대분류/소분류 포함 전체 자산군 마스터를 조회합니다")
    @GetMapping
    fun getAll(): List<AssetClassResult> = assetClassService.getAllAssetClasses()

    @Operation(summary = "대분류만 조회", description = "최상위 자산군 카테고리만 조회합니다 (주식, 채권, 원자재, 현금)")
    @GetMapping("/categories")
    fun getCategories(): List<AssetClassResult> = assetClassService.getCategories()

    @Operation(summary = "소분류 조회", description = "특정 대분류의 하위 자산군을 조회합니다")
    @GetMapping("/categories/{parentId}/children")
    fun getSubCategories(@PathVariable parentId: Long): List<AssetClassResult> =
        assetClassService.getSubCategories(parentId)

    @Operation(summary = "유저별 자산 비중 조회", description = "유저가 설정한 목표 자산 배분 비중을 조회합니다")
    @GetMapping("/allocations")
    fun getAllocations(@RequestParam userId: Long): List<AllocationResult> =
        assetClassService.getAllocationsByUser(userId)

    @Operation(summary = "유저별 자산 비중 설정", description = "기존 비중을 전체 교체합니다 (PUT)")
    @PutMapping("/allocations")
    fun setAllocations(@RequestBody request: AllocationSetRequest): List<AllocationResult> =
        assetClassService.setAllocations(request)
}
