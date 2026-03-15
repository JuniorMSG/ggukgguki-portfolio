package com.ggukgguki.api.dto

import com.ggukgguki.core.domain.allocation.UserAssetAllocation
import com.ggukgguki.core.domain.holding.AssetClass
import io.swagger.v3.oas.annotations.media.Schema
import java.math.BigDecimal

@Schema(description = "자산군 정보")
data class AssetClassResult(
    val id: Long,
    @Schema(description = "자산군명", example = "성장주")
    val name: String,
    @Schema(description = "상위 자산군 ID (null이면 대분류)")
    val parentId: Long?,
    val displayOrder: Int
) {
    companion object {
        fun from(assetClass: AssetClass) = AssetClassResult(
            id = assetClass.id,
            name = assetClass.name,
            parentId = assetClass.parent?.id,
            displayOrder = assetClass.displayOrder
        )
    }
}

@Schema(description = "유저 자산 비중 설정 요청")
data class AllocationSetRequest(
    val allocations: List<AllocationItem>
)

@Schema(description = "개별 자산 비중 항목")
data class AllocationItem(
    @Schema(description = "자산군 ID")
    val assetClassId: Long,
    @Schema(description = "목표 비중 (%)", example = "50.00")
    val targetRatio: BigDecimal
)

@Schema(description = "유저 자산 비중 정보")
data class AllocationResult(
    val id: Long,
    val userId: Long,
    val assetClassId: Long,
    @Schema(description = "자산군명")
    val assetClassName: String,
    @Schema(description = "상위 자산군명")
    val parentName: String?,
    @Schema(description = "목표 비중 (%)")
    val targetRatio: BigDecimal
) {
    companion object {
        fun from(alloc: UserAssetAllocation) = AllocationResult(
            id = alloc.id,
            userId = alloc.user.id,
            assetClassId = alloc.assetClass.id,
            assetClassName = alloc.assetClass.name,
            parentName = alloc.assetClass.parent?.name,
            targetRatio = alloc.targetRatio
        )
    }
}
