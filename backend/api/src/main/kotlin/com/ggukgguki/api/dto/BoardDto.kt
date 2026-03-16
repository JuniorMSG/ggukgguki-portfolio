package com.ggukgguki.api.dto

import com.ggukgguki.core.domain.board.BoardComment
import com.ggukgguki.core.domain.board.BoardRequest
import com.ggukgguki.core.domain.board.Notice

// ─── 공지사항 ───

data class NoticeCreateRequest(val title: String, val content: String, val isPinned: Boolean = false)
data class NoticeUpdateRequest(val title: String?, val content: String?, val isPinned: Boolean?)

data class NoticeResult(
    val id: Long, val title: String, val content: String,
    val authorId: Long, val authorNickname: String,
    val isPinned: Boolean, val viewCount: Int,
    val createdAt: String, val updatedAt: String
) {
    companion object {
        fun from(n: Notice) = NoticeResult(
            n.id, n.title, n.content, n.author.id, n.author.nickname,
            n.isPinned, n.viewCount,
            n.createdAt.toString(), n.updatedAt.toString()
        )
    }
}

// ─── 요청사항 ───

data class RequestCreateDto(val title: String, val content: String, val category: String = "OTHER")
data class RequestUpdateDto(val title: String?, val content: String?, val category: String?)
data class StatusUpdateDto(val status: String)
data class VoteDto(val voteType: String) // LIKE or DISLIKE

data class RequestResult(
    val id: Long, val title: String, val content: String,
    val authorId: Long, val authorNickname: String,
    val category: String, val status: String,
    val likeCount: Int, val dislikeCount: Int, val viewCount: Int,
    val createdAt: String, val updatedAt: String,
    val myVote: String? = null // 현재 유저의 투표 상태
) {
    companion object {
        fun from(r: BoardRequest, myVote: String? = null) = RequestResult(
            r.id, r.title, r.content, r.author.id, r.author.nickname,
            r.category, r.status, r.likeCount, r.dislikeCount, r.viewCount,
            r.createdAt.toString(), r.updatedAt.toString(), myVote
        )
    }
}

// ─── 댓글 ───

data class CommentCreateDto(val content: String)

data class CommentResult(
    val id: Long, val requestId: Long,
    val authorId: Long, val authorNickname: String,
    val content: String, val isAdminReply: Boolean,
    val createdAt: String
) {
    companion object {
        fun from(c: BoardComment) = CommentResult(
            c.id, c.request.id, c.author.id, c.author.nickname,
            c.content, c.isAdminReply, c.createdAt.toString()
        )
    }
}
