'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLazyQuery } from '@apollo/client/react';
import { auth } from '@/lib/auth';
import Header from '@/components/Header';
import PostCard from '@/components/PostCard';
import { MY_INTERACTION_HISTORY } from '@/graphql/history.api';
import toast from 'react-hot-toast';

export default function HistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('liked');
  const [likedPosts, setLikedPosts] = useState([]);
  const [commentedPosts, setCommentedPosts] = useState([]);

  const [fetchHistory, { loading }] = useLazyQuery(MY_INTERACTION_HISTORY, { fetchPolicy: 'no-cache' });

  const loadHistory = async () => {
    try {
      const { data } = await fetchHistory();
      setLikedPosts(data?.myInteractionHistory?.likedPosts || []);
      setCommentedPosts(data?.myInteractionHistory?.commentedPosts || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load history');
    }
  };

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/auth/login');
    } else {
      loadHistory();
    }
  }, []);

  const posts = activeTab === 'liked' ? likedPosts : commentedPosts;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-black">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-white mb-6">Interaction History</h1>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('liked')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'liked'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Liked Posts ({likedPosts.length})
          </button>
          <button
            onClick={() => setActiveTab('commented')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'commented'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            }`}
          >
            Commented Posts ({commentedPosts.length})
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-10 w-10 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-indigo-100 to-purple-100 rounded-full mb-4">
                <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No {activeTab === 'liked' ? 'liked' : 'commented'} posts yet
              </h3>
              <p className="text-gray-400 mb-6">
                Start {activeTab === 'liked' ? 'liking' : 'commenting on'} posts to see them here
              </p>
              <button
                onClick={() => router.push('/feed')}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all"
              >
                Go to Feed
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onUpdate={loadHistory} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
