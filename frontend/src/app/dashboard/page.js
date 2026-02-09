'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { auth } from '@/lib/auth';
import Header from '@/components/Header';
import CreatePostPopup from '@/components/CreatePostPopup';
import { CREATE_POST, MY_POSTS } from '@/graphql/post.api';
import { GET_USER } from '@/graphql/user.api';
import { GET_POST_LIKES, GET_POST_COMMENTS } from '@/graphql/interaction.api';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [showLikes, setShowLikes] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [likes, setLikes] = useState([]);
  const [comments, setComments] = useState([]);
  const [expandedTags, setExpandedTags] = useState({});

  const [createPost] = useMutation(CREATE_POST, { fetchPolicy: 'no-cache' });
  const [myPosts, { loading: loadingPosts }] = useLazyQuery(MY_POSTS, { fetchPolicy: 'no-cache' });
  const [getUser] = useLazyQuery(GET_USER, { fetchPolicy: 'no-cache' });
  const [fetchLikes] = useLazyQuery(GET_POST_LIKES, { fetchPolicy: 'no-cache' });
  const [fetchComments] = useLazyQuery(GET_POST_COMMENTS, { fetchPolicy: 'no-cache' });

  const loadPosts = async () => {
    try {
      const { data } = await myPosts();
      const loadedPosts = data?.myPosts || [];
      setPosts(loadedPosts);
      
      // Calculate total likes and comments
      const totalLikes = loadedPosts.reduce((sum, post) => sum + (post.likeCount || 0), 0);
      const totalComments = loadedPosts.reduce((sum, post) => sum + (post.commentCount || 0), 0);
      
      return { totalLikes, totalComments };
    } catch (error) {
      toast.error(error.message || 'Failed to load posts');
      return { totalLikes: 0, totalComments: 0 };
    }
  };

  const loadUser = async () => {
    try {
      const { data } = await getUser();
      setCurrentUser(data?.getUser);
    } catch (error) {
      toast.error(error.message || 'Failed to load user');
    }
  };

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/auth/login');
    } else {
      loadPosts().then(({ totalLikes, totalComments }) => {
        setTotalLikes(totalLikes);
        setTotalComments(totalComments);
      });
      loadUser();
    }
  }, []);

  const handleCreatePost = async ({ content, categoryTags }) => {
    try {
      await createPost({ variables: { content, categoryTags } });
      toast.success('Post created successfully!');
      setIsPopupOpen(false);
      const { totalLikes, totalComments } = await loadPosts();
      setTotalLikes(totalLikes);
      setTotalComments(totalComments);
    } catch (error) {
      toast.error(error.message || 'Failed to create post');
    }
  };

  const handleShowLikes = async (post) => {
    try {
      const { data } = await fetchLikes({ variables: { postId: post.id } });
      setLikes(data?.postLikes || []);
      setShowLikes(true);
    } catch (error) {
      toast.error(error.message || 'Failed to load likes');
    }
  };

  const handleShowComments = async (post) => {
    try {
      const { data } = await fetchComments({ variables: { postId: post.id } });
      setComments(data?.postComments || []);
      setShowComments(true);
    } catch (error) {
      toast.error(error.message || 'Failed to load comments');
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <Header />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* User Profile Card */}
          {currentUser && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">{currentUser.email?.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{currentUser.email}</h2>
                  <p className="text-gray-600">Welcome back!</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Posts</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{posts.length}</p>
                </div>
                <div className="h-14 w-14 bg-linear-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Likes</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{totalLikes}</p>
                </div>
                <div className="h-14 w-14 bg-linear-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Comments</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{totalComments}</p>
                </div>
                <div className="h-14 w-14 bg-linear-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Create Post Button */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <button
              onClick={() => setIsPopupOpen(true)}
              className="w-full inline-flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Post
            </button>
          </div>

          {/* My Posts */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">My Posts</h2>
            {loadingPosts ? (
              <div className="text-center py-8">
                <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 text-lg">No posts yet</p>
                <p className="text-gray-400 text-sm mt-2">Create your first post!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => {
                  const MAX_TAGS = 3;
                  const categories = post.categoryTags || [];
                  const isExpanded = expandedTags[post.id];
                  const displayTags = isExpanded ? categories : categories.slice(0, MAX_TAGS);
                  const remainingCount = categories.length - MAX_TAGS;
                  
                  return (
                  <div key={post.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                    <p className="text-gray-900 whitespace-pre-wrap mb-3">{post.content}</p>
                    
                    {/* Category Tags */}
                    {categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {displayTags.map((tag, idx) => (
                          <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                            {tag}
                          </span>
                        ))}
                        {categories.length > MAX_TAGS && (
                          <button
                            onClick={() => setExpandedTags(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                            className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full hover:bg-gray-200 cursor-pointer transition-colors"
                          >
                            {isExpanded ? 'Show less' : `+${remainingCount} more`}
                          </button>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleShowLikes(post)}
                          className="flex items-center gap-1 hover:text-red-600 cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {post.likeCount || 0}
                        </button>
                        <button
                          onClick={() => handleShowComments(post)}
                          className="flex items-center gap-1 hover:text-green-600 cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {post.commentCount || 0}
                        </button>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {post.viewCount || 0}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(parseInt(post.createdAt)).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {isPopupOpen && (
        <CreatePostPopup
          isOpen={isPopupOpen}
          onClose={() => setIsPopupOpen(false)}
          onSubmit={handleCreatePost}
        />
      )}

      {/* Likes Modal */}
      {showLikes && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 w-full max-w-md border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Likes</h3>
              <button onClick={() => setShowLikes(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {likes.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No likes yet</p>
              ) : (
                likes.map((like) => (
                  <div key={like.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                    <div className="h-10 w-10 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">
                        {like.user?.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{like.user?.email}</p>
                      <p className="text-xs text-gray-500">{new Date(parseInt(like.createdAt)).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {showComments && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 w-full max-w-2xl border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Comments</h3>
              <button onClick={() => setShowComments(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">
                          {comment.user?.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{comment.user?.email}</p>
                        <p className="text-gray-700 mt-1">{comment.content}</p>
                        <p className="text-xs text-gray-500 mt-2">{new Date(parseInt(comment.createdAt)).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
