package com.ggukgguki.api.service

import com.ggukgguki.api.dto.AssetClassCreateRequest
import com.ggukgguki.api.dto.AssetClassResult
import com.ggukgguki.core.domain.holding.AssetClass
import com.ggukgguki.core.domain.holding.AssetClassRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
@Transactional(readOnly = true)
class AssetClassService(
    private val assetClassRepository: AssetClassRepository
) {
    fun getAll(): List<AssetClassResult> =
        assetClassRepository.findAllByOrderByDisplayOrderAsc().map { AssetClassResult.from(it) }

    @Transactional
    fun create(request: AssetClassCreateRequest): AssetClassResult {
        val assetClass = AssetClass(
            name = request.name,
            targetRatio = request.targetRatio,
            displayOrder = request.displayOrder
        )
        return AssetClassResult.from(assetClassRepository.save(assetClass))
    }
}
