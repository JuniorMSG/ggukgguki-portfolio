package com.ggukgguki.core.domain.cashflow

import org.springframework.data.jpa.repository.JpaRepository

interface CashflowCategoryRepository : JpaRepository<CashflowCategory, Long> {
    fun findAllByOrderByFlowTypeAscDisplayOrderAsc(): List<CashflowCategory>
    fun findByFlowTypeOrderByDisplayOrderAsc(flowType: FlowType): List<CashflowCategory>
    fun findByParentIdOrderByDisplayOrderAsc(parentId: Long): List<CashflowCategory>
}
