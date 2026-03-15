package com.ggukgguki.api.controller

import com.ggukgguki.api.security.OwnershipChecker
import com.ggukgguki.core.domain.cash.CashAsset
import com.ggukgguki.core.domain.cash.CashAssetRepository
import com.ggukgguki.core.domain.user.UserRepository
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

data class CashAssetResult(
    val id: Long, val name: String, val category: String,
    val balance: Long, val interestRate: BigDecimal,
    val maturityDate: String?, val memo: String?
) {
    companion object {
        fun from(e: CashAsset) = CashAssetResult(
            e.id, e.name, e.category, e.balance, e.interestRate,
            e.maturityDate?.toString(), e.memo
        )
    }
}

data class CashAssetRequest(
    val name: String, val category: String,
    val balance: Long, val interestRate: BigDecimal = BigDecimal.ZERO,
    val maturityDate: String? = null, val memo: String? = null
)

data class CashAssetUpdateRequest(
    val balance: Long? = null, val interestRate: BigDecimal? = null,
    val name: String? = null, val memo: String? = null
)

@Tag(name = "CashAsset", description = "현금성 자산")
@RestController
@RequestMapping("/api/cash-assets")
class CashAssetController(
    private val cashAssetRepository: CashAssetRepository,
    private val userRepository: UserRepository,
    private val ownershipChecker: OwnershipChecker
) {
    @Operation(summary = "현금성 자산 목록")
    @GetMapping
    fun getAll(@AuthenticationPrincipal userId: Long): List<CashAssetResult> =
        cashAssetRepository.findByUserIdAndIsActiveTrue(userId).map { CashAssetResult.from(it) }

    @Operation(summary = "현금성 자산 추가")
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    fun create(@RequestBody req: CashAssetRequest, @AuthenticationPrincipal userId: Long): CashAssetResult {
        val user = userRepository.findById(userId).orElseThrow { IllegalArgumentException("유저 없음") }
        val entity = CashAsset(
            user = user, name = req.name, category = req.category,
            balance = req.balance, interestRate = req.interestRate,
            maturityDate = req.maturityDate?.let { LocalDate.parse(it) }, memo = req.memo
        )
        return CashAssetResult.from(cashAssetRepository.save(entity))
    }

    @Operation(summary = "현금성 자산 수정")
    @PutMapping("/{id}")
    fun update(
        @PathVariable id: Long,
        @RequestBody req: CashAssetUpdateRequest,
        @AuthenticationPrincipal userId: Long
    ): CashAssetResult {
        ownershipChecker.checkCashAssetOwner(id, userId)
        val entity = cashAssetRepository.findById(id).orElseThrow { IllegalArgumentException("자산 없음: $id") }
        req.balance?.let { entity.balance = it }
        req.interestRate?.let { entity.interestRate = it }
        req.name?.let { entity.name = it }
        req.memo?.let { entity.memo = it }
        entity.updatedAt = LocalDateTime.now()
        return CashAssetResult.from(cashAssetRepository.save(entity))
    }

    @Operation(summary = "현금성 자산 삭제")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: Long, @AuthenticationPrincipal userId: Long) {
        ownershipChecker.checkCashAssetOwner(id, userId)
        val entity = cashAssetRepository.findById(id).orElseThrow { IllegalArgumentException("자산 없음: $id") }
        entity.isActive = false
        entity.updatedAt = LocalDateTime.now()
        cashAssetRepository.save(entity)
    }
}
