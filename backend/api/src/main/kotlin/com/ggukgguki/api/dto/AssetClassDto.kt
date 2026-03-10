package com.ggukgguki.api.dto

import com.ggukgguki.core.domain.holding.AssetClass
import java.math.BigDecimal

data class AssetClassCreateRequest(
    val name: String,
    val targetRatio: BigDecimal? = null,
    val displayOrder: Int = 0
)

data class AssetClassResult(
    val id: Long,
    val name: String,
    val targetRatio: BigDecimal?,
    val displayOrder: Int
) {
    companion object {
        fun from(assetClass: AssetClass) = AssetClassResult(
            id = assetClass.id,
            name = assetClass.name,
            targetRatio = assetClass.targetRatio,
            displayOrder = assetClass.displayOrder
        )
    }
}
