package com.ggukgguki.core.domain.holding

import org.springframework.data.jpa.repository.JpaRepository

interface HoldingRepository : JpaRepository<Holding, Long> {
    fun findByAccountId(accountId: Long): List<Holding>
    fun findByAssetClassId(assetClassId: Long): List<Holding>
}
