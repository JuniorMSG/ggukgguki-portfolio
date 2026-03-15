package com.ggukgguki.core.domain.cash

import org.springframework.data.jpa.repository.JpaRepository

interface CashAssetRepository : JpaRepository<CashAsset, Long> {
    fun findByUserIdAndIsActiveTrue(userId: Long): List<CashAsset>
}
