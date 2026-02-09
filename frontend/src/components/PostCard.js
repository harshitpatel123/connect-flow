"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useLazyQuery } from "@apollo/client/react";
import { LIKE_POST, UNLIKE_POST, COMMENT_POST, VIEW_POST, GET_POST_LIKES, GET_POST_COMMENTS } from "@/graphql/interaction.api";
import toast from "react-hot-toast";

export default function PostCard({ post, onUpdate }) {
  const [showComments, setShowComments] = useState(false);
  const [showLikes, setShowLikes] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [hasViewed, setHasViewed] = useState(false);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [expandedTags, setExpandedTags] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const cardRef = useRef(null);

  const [likePost] = useMutation(LIKE_POST);
  const [unlikePost] = useMutation(UNLIKE_POST);
  const [commentPost] = useMutation(COMMENT_POST);
  const [viewPost] = useMutation(VIEW_POST);
  const [fetchLikes] = useLazyQuery(GET_POST_LIKES, { fetchPolicy: 'no-cache' });
  const [fetchComments] = useLazyQuery(GET_POST_COMMENTS, { fetchPolicy: 'no-cache' });

  // Intersection Observer for view tracking
  useEffect(() => {
    if (!cardRef.current || hasViewed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
            setHasViewed(true);
            viewPost({ variables: { postId: post.id } }).catch(() => {});
          }
        });
      },
      { threshold: 0.7 }
    );

    observer.observe(cardRef.current);

    return () => observer.disconnect();
  }, [post.id, hasViewed, viewPost]);

  const handleLike = async () => {
    try {
      if (isLiked) {
        await unlikePost({ variables: { postId: post.id } });
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        await likePost({ variables: { postId: post.id } });
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      toast.error(error.message || "Failed to update like");
    }
  };

  const handleShowLikes = async () => {
    if (likeCount === 0) return;
    try {
      const { data } = await fetchLikes({ variables: { postId: post.id } });
      setLikes(data?.postLikes || []);
      setShowLikes(true);
    } catch (error) {
      toast.error(error.message || "Failed to load likes");
    }
  };

  const handleShowComments = async () => {
    try {
      const { data } = await fetchComments({ variables: { postId: post.id } });
      setComments(data?.postComments || []);
      setShowComments(true);
    } catch (error) {
      toast.error(error.message || "Failed to load comments");
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await commentPost({
        variables: { postId: post.id, content: commentText },
      });
      toast.success("Comment added!");
      setCommentText("");
      setCommentCount(prev => prev + 1);
      const { data } = await fetchComments({ variables: { postId: post.id } });
      setComments(data?.postComments || []);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.message || "Failed to add comment");
    }
  };

  return (
    <div ref={cardRef} className="bg-white rounded-3xl shadow-2xl overflow-hidden">
      <div className="p-6">
        {/* User Info */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="h-12 w-12 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {post.user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">{post.user?.email}</p>
            <p className="text-sm text-gray-500">
              {new Date(parseInt(post.createdAt)).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Post Content */}
        <div className="bg-linear-to-br from-gray-50 to-gray-100 rounded-2xl p-8 min-h-[400px] flex items-center justify-center mb-4">
          <p className="text-gray-900 text-xl leading-relaxed whitespace-pre-wrap text-center">
            {post.content}
          </p>
        </div>

        {/* Category Tags */}
        {post.categoryTags && post.categoryTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {(expandedTags ? post.categoryTags : post.categoryTags.slice(0, 3)).map((tag, idx) => (
              <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                {tag}
              </span>
            ))}
            {post.categoryTags.length > 3 && (
              <button
                onClick={() => setExpandedTags(!expandedTags)}
                className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full hover:bg-gray-200 cursor-pointer transition-colors"
              >
                {expandedTags ? 'Show less' : `+${post.categoryTags.length - 3} more`}
              </button>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4 px-2">
          <button
            onClick={handleShowLikes}
            className={`hover:underline ${likeCount > 0 ? 'cursor-pointer' : 'cursor-default'}`}
          >
            {likeCount} {likeCount === 1 ? "like" : "likes"}
          </button>
          <div className="flex gap-4">
            <button
              onClick={handleShowComments}
              className={`hover:underline ${commentCount > 0 ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {commentCount} {commentCount === 1 ? "comment" : "comments"}
            </button>
            <span>{post.viewCount} {post.viewCount === 1 ? "view" : "views"}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 border-t border-gray-200 pt-4">
          <button
            onClick={handleLike}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
              isLiked
                ? "bg-red-50 text-red-600 hover:bg-red-100"
                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            <svg
              className="w-6 h-6"
              fill={isLiked ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            {isLiked ? "Liked" : "Like"}
          </button>

          <button
            onClick={async () => {
              if (!showComments) {
                await handleShowComments();
              } else {
                setShowComments(false);
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Comment
          </button>
        </div>

        {/* Likes Modal */}
        {showLikes && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900">Likes</h3>
              <button onClick={() => setShowLikes(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {likes.map((like) => (
                <div key={like.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  <div className="h-8 w-8 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {like.user?.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{like.user?.email}</p>
                    <p className="text-xs text-gray-500">{new Date(parseInt(like.createdAt)).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comment Section */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-gray-900">Comments</h3>
              <button onClick={() => setShowComments(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Comment Input */}
            <form onSubmit={handleComment} className="flex gap-2 mb-4">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Post
              </button>
            </form>
            
            {/* Comments List */}
            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>
              ) : (
                <>
                  {(showAllComments ? comments : comments.slice(0, 3)).map((comment) => (
                    <div key={comment.id} className="flex items-start gap-3">
                      <div className="h-8 w-8 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">
                          {comment.user?.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium text-gray-900">{comment.user?.email}</span>
                          {' '}
                          <span className="text-gray-700">{comment.content}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(parseInt(comment.createdAt)).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {comments.length > 3 && (
                    <button
                      onClick={() => setShowAllComments(!showAllComments)}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      {showAllComments ? 'Show less' : `View all ${comments.length} comments`}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
