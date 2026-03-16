package com.ggukgguki.core.domain.board

import com.ggukgguki.core.domain.user.User
import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "board_request")
class BoardRequest(
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false, length = 200)
    var title: String,

    @Column(nullable = false, columnDefinition = "TEXT")
    var content: String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    var author: User,

    @Column(nullable = false, length = 20)
    var category: String = "OTHER",

    @Column(nullable = false, length = 20)
    var status: String = "SUBMITTED",

    @Column(name = "like_count", nullable = false)
    var likeCount: Int = 0,

    @Column(name = "dislike_count", nullable = false)
    var dislikeCount: Int = 0,

    @Column(name = "view_count", nullable = false)
    var viewCount: Int = 0,

    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "updated_at", nullable = false)
    var updatedAt: LocalDateTime = LocalDateTime.now()
)
