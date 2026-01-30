'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLazyQuery } from '@apollo/client/react';
import { auth } from '@/lib/auth';
import Header from '@/components/Header';
import PostCard from '@/components/PostCard';
import { MY_FEED } from '@/graphql/feed.api';
import toast from 'react-hot-toast';

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);

  const [myFeed, { loading }] = useLazyQuery(MY_FEED, { fetchPolicy: 'no-cache' });

  const loadFeed = async () => {
    try {
      const { data } = await myFeed();
      setPosts(data?.myFeed || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load feed');
    }
  };

  useEffect(() => {
    if (!auth.isAuthenticated()) {
      router.push('/auth/login');
    } else {
      loadFeed();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="flex justify-end mb-4">
          <button
            onClick={loadFeed}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm border border-white/20"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Feed
          </button>
        </div>
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
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full mb-4">
              <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Your feed is empty</h3>
            <p className="text-gray-400 mb-6">Posts from other users will appear here</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Your First Post
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-2 pb-6 space-y-6">
          {posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              onUpdate={loadFeed}
            />
          ))}
        </div>
      )}
    </div>
  );
}
