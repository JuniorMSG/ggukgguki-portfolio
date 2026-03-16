package com.ggukgguki.core.domain.board

import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

interface NoticeRepository : JpaRepository<Notice, Long> {
    fun findAllByOrderByIsPinnedDescCreatedAtDesc(pageable: Pageable): Page<Notice>
}

interface BoardRequestRepository : JpaRepository<BoardRequest, Long> {
    fun findAllByOrderByCreatedAtDesc(pageable: Pageable): Page<BoardRequest>

    @Query("SELECT r FROM BoardRequest r WHERE " +
            "(:category IS NULL OR r.category = :category) AND " +
            "(:status IS NULL OR r.status = :status) AND " +
            "(:keyword IS NULL OR r.title LIKE %:keyword% OR r.content LIKE %:keyword%) " +
            "ORDER BY r.createdAt DESC")
    fun search(
        category: String?,
        status: String?,
        keyword: String?,
        pageable: Pageable
    ): Page<BoardRequest>
}

interface BoardCommentRepository : JpaRepository<BoardComment, Long> {
    fun findByRequestIdOrderByCreatedAtAsc(requestId: Long): List<BoardComment>
}

interface BoardVoteRepository : JpaRepository<BoardVote, Long> {
    fun findByRequestIdAndUserId(requestId: Long, userId: Long): BoardVote?
    fun countByRequestIdAndVoteType(requestId: Long, voteType: String): Int
}
