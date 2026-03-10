package com.ggukgguki.api.dto

import com.ggukgguki.core.domain.allocation.UserAssetAllocation
import com.ggukgguki.core.domain.holding.AssetClass
import java.math.BigDecimal

data class AssetClassResult(
    val id: Long,
    val name: String,
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

data class AllocationSetRequest(
    val userId: Long,
    val allocations: List<AllocationItem>
)

data class AllocationItem(
    val assetClassId: Long,
    val targetRatio: BigDecimal
)

data class AllocationResult(
    val id: Long,
    val userId: Long,
    val assetClassId: Long,
    val assetClassName: String,
    val parentName: String?,
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
