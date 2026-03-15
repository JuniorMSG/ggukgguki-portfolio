package com.ggukgguki.api.service

import com.ggukgguki.api.dto.AllocationResult
import com.ggukgguki.api.dto.AllocationSetRequest
import com.ggukgguki.api.dto.AssetClassResult
import com.ggukgguki.core.domain.allocation.UserAssetAllocation
import com.ggukgguki.core.domain.allocation.UserAssetAllocationRepository
import com.ggukgguki.core.domain.holding.AssetClassRepository
import com.ggukgguki.core.domain.user.UserRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class AssetClassService(
    private val assetClassRepository: AssetClassRepository,
    private val allocationRepository: UserAssetAllocationRepository,
    private val userRepository: UserRepository
) {
    fun getAllAssetClasses(): List<AssetClassResult> =
        assetClassRepository.findAllByOrderByDisplayOrderAsc().map { AssetClassResult.from(it) }

    fun getCategories(): List<AssetClassResult> =
        assetClassRepository.findByParentIsNullOrderByDisplayOrderAsc().map { AssetClassResult.from(it) }

    fun getSubCategories(parentId: Long): List<AssetClassResult> =
        assetClassRepository.findByParentIdOrderByDisplayOrderAsc(parentId).map { AssetClassResult.from(it) }

    fun getAllocationsByUser(userId: Long): List<AllocationResult> =
        allocationRepository.findByUserIdOrderByAssetClassDisplayOrderAsc(userId).map { AllocationResult.from(it) }

    @Transactional
    fun setAllocations(request: AllocationSetRequest, userId: Long): List<AllocationResult> {
        val user = userRepository.findById(userId)
            .orElseThrow { IllegalArgumentException("유저를 찾을 수 없어요: $userId") }

        val existing = allocationRepository.findByUserIdOrderByAssetClassDisplayOrderAsc(userId)
        allocationRepository.deleteAll(existing)

        val newAllocations = request.allocations.map { item ->
            val assetClass = assetClassRepository.findById(item.assetClassId)
                .orElseThrow { IllegalArgumentException("자산군을 찾을 수 없어요: ${item.assetClassId}") }
            UserAssetAllocation(
                user = user,
                assetClass = assetClass,
                targetRatio = item.targetRatio
            )
        }

        return allocationRepository.saveAll(newAllocations).map { AllocationResult.from(it) }
    }
}
