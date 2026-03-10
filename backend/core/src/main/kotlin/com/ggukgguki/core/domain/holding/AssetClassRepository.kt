package com.ggukgguki.core.domain.holding

import org.springframework.data.jpa.repository.JpaRepository

interface AssetClassRepository : JpaRepository<AssetClass, Long> {
    fun findAllByOrderByDisplayOrderAsc(): List<AssetClass>
    fun findByParentIsNullOrderByDisplayOrderAsc(): List<AssetClass>
    fun findByParentIdOrderByDisplayOrderAsc(parentId: Long): List<AssetClass>
}
