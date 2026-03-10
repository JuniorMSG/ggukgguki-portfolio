package com.ggukgguki.core.domain.allocation

import org.springframework.data.jpa.repository.JpaRepository

interface UserAssetAllocationRepository : JpaRepository<UserAssetAllocation, Long> {
    fun findByUserIdOrderByAssetClassDisplayOrderAsc(userId: Long): List<UserAssetAllocation>
}
