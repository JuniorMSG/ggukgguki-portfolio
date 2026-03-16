package com.ggukgguki.core.domain.board

import com.ggukgguki.core.domain.user.User
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(
    name = "board_vote",
    uniqueConstraints = [UniqueConstraint(columnNames = ["request_id", "user_id"])]
)
class BoardVote(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    var request: BoardRequest,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    var user: User,

    @Column(name = "vote_type", nullable = false, length = 10)
    var voteType: String, // LIKE or DISLIKE

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
