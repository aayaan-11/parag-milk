import React, { useState } from 'react';
import { BLOGS } from '../data';
import { 
  BookOpen, Calendar, User, Heart, MessageSquare, 
  X, Sparkles, Send, Tag, Share2, Eye, ChevronRight 
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Blog as BlogType } from '../types';

export const Blog: React.FC = () => {
  const { showToast } = useApp();

  // Blogging filters
  const [activeCategory, setActiveCategory] = useState<'all' | 'recipes' | 'wellness' | 'dairy-science'>('all');

  // Detailed selected blog
  const [selectedBlog, setSelectedBlog] = useState<BlogType | null>(null);

  // Likes state: track locally
  const [likedBlogs, setLikedBlogs] = useState<string[]>([]);

  // Interactive user comment states inside the active article detail
  const [blogComments, setBlogComments] = useState<Record<string, Array<{ author: string, text: string, date: string }>>>({
    'b1': [
      { author: 'Ramesh Mehta', text: 'This was extremely informative! I switched my family to organic A2 milk last month, and my kids are loving it.', date: '2026-07-15' }
    ]
  });
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');

  const filteredBlogs = BLOGS.filter((b) => {
    if (activeCategory === 'all') return true;
    return b.category === activeCategory;
  });

  const featuredBlog = BLOGS[0]; // Set first as featured
  const remainingBlogs = filteredBlogs.filter((b) => b.id !== featuredBlog.id);

  const toggleLikeBlog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid opening the details modal
    setLikedBlogs((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        showToast('Blog unliked', 'info');
        return prev.filter((bId) => bId !== id);
      } else {
        showToast('Blog added to favorites ❤️', 'success');
        return [...prev, id];
      }
    });
  };

  const handlePostComment = (e: React.FormEvent, blogId: string) => {
    e.preventDefault();
    if (commentName.trim() && commentText.trim()) {
      const added = {
        author: commentName.trim(),
        text: commentText.trim(),
        date: new Date().toISOString().split('T')[0]
      };
      setBlogComments((prev) => ({
        ...prev,
        [blogId]: [added, ...(prev[blogId] || [])]
      }));
      setCommentName('');
      setCommentText('');
      showToast('Comment published!', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300 py-8 px-4 md:px-8 max-w-7xl mx-auto pb-24 space-y-12">
      
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block mb-2">
          📰 DAIRY LIFESTYLE & SECRETS
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight leading-none">
          Parag Milk Journal
        </h1>
        <p className="text-neutral-500 text-xs sm:text-sm mt-3 leading-relaxed">
          Unlock dairy science reports, gut health wellness articles, and traditional milk pudding pudding recipes crafted by Indian gourmet chefs.
        </p>
      </div>

      {/* Categories Toggle Buttons */}
      <div className="flex gap-2 justify-center overflow-x-auto pb-2">
        {[
          { id: 'all', label: 'All Articles' },
          { id: 'recipes', label: 'Recipes' },
          { id: 'wellness', label: 'Wellness Reports' },
          { id: 'dairy-science', label: 'Dairy Science' }
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as any)}
            className={`px-4.5 py-2 rounded-xl text-xs font-black shrink-0 transition-colors cursor-pointer ${
              activeCategory === cat.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-neutral-600 hover:bg-neutral-100 border'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* FEATURED STORY HERO PANEL (Only shown when filter is 'all') */}
      {activeCategory === 'all' && (
        <section 
          onClick={() => setSelectedBlog(featuredBlog)}
          className="bg-white dark:bg-neutral-900 rounded-[32px] overflow-hidden border border-neutral-100 dark:border-neutral-800 shadow-xs cursor-pointer hover:border-blue-200 transition-all grid grid-cols-1 lg:grid-cols-2 gap-8 items-center p-6 lg:p-8"
        >
          <div className="aspect-video lg:aspect-square rounded-2xl overflow-hidden bg-neutral-50">
            <img src={featuredBlog.image} alt={featuredBlog.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>

          <div className="flex flex-col h-full justify-center space-y-4">
            <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 dark:bg-sky-950/40 px-3 py-1 rounded-full w-fit">
              Featured Wellness
            </span>
            <h2 className="text-xl md:text-3.5xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight leading-tight">
              {featuredBlog.title}
            </h2>
            <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed line-clamp-3">
              {featuredBlog.excerpt}
            </p>

            <div className="flex items-center gap-4 text-xs font-bold text-neutral-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {featuredBlog.date}
              </span>
              <span>•</span>
              <span className="capitalize">{featuredBlog.category.replace('-', ' ')}</span>
            </div>

            <button className="text-xs font-black text-blue-600 flex items-center gap-1 hover:underline self-start">
              <span>READ ARTICLE STORY</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* BLOG GRID FOR THE ARTICLES */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {(activeCategory === 'all' ? remainingBlogs : filteredBlogs).map((b) => {
          const isLiked = likedBlogs.includes(b.id);
          return (
            <div
              key={b.id}
              onClick={() => setSelectedBlog(b)}
              className="bg-white dark:bg-neutral-900 rounded-[28px] overflow-hidden border border-neutral-100 dark:border-neutral-800/60 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col group"
            >
              <div className="aspect-video relative overflow-hidden bg-neutral-150 shrink-0">
                <img 
                  src={b.image} 
                  alt={b.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={(e) => toggleLikeBlog(b.id, e)}
                  className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md transition-colors ${
                    isLiked ? 'bg-rose-50 text-rose-500' : 'bg-black/30 text-white hover:bg-black/50'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
                </button>
              </div>

              <div className="p-5 flex flex-col flex-grow justify-between gap-4">
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full tracking-wider w-fit">
                    {b.category.replace('-', ' ')}
                  </span>
                  <h3 className="text-xs sm:text-sm font-black text-neutral-800 dark:text-neutral-200 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                    {b.title}
                  </h3>
                  <p className="text-neutral-500 text-[11px] leading-relaxed line-clamp-2">
                    {b.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] text-neutral-400 font-bold border-t pt-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {b.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {b.readTime}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* FULL-SCREEN DETAIL OVERLAY INTERACTIVE MODAL */}
      {selectedBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setSelectedBlog(null)} className="absolute inset-0 bg-black/60 backdrop-blur-xs" />
          
          <div className="relative w-full max-w-3xl bg-white dark:bg-neutral-950 rounded-3xl overflow-hidden shadow-2xl z-10 max-h-[90vh] flex flex-col">
            
            {/* Header image frame */}
            <div className="relative aspect-[21/9] shrink-0 bg-neutral-150">
              <img src={selectedBlog.image} alt={selectedBlog.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <button 
                onClick={() => setSelectedBlog(null)} 
                className="absolute top-4 right-4 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable details view */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 dark:bg-sky-950/40 px-3 py-1 rounded-full w-fit">
                  {selectedBlog.category.replace('-', ' ')}
                </span>
                <span className="text-xs text-neutral-400 font-bold">{selectedBlog.date} • {selectedBlog.readTime} read</span>
              </div>

              <h2 className="text-xl md:text-3xl font-black text-neutral-950 dark:text-neutral-100 tracking-tight leading-none">
                {selectedBlog.title}
              </h2>

              <p className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-medium border-l-4 border-blue-600 pl-4 py-1">
                {selectedBlog.excerpt}
              </p>

              {/* Dummy body text content */}
              <div className="text-neutral-700 dark:text-neutral-300 text-xs sm:text-sm leading-relaxed space-y-4 font-semibold">
                <p>
                  Milk is more than a culinary staple; it is an organic bio-matrix filled with bioactive peptides, calcium complexes, and probiotic enzymes. In this deep dive, we look at the molecular differences of A1 vs A2 casein strands, and how sustainable grass-feeding schedules directly influence the nutritional profile.
                </p>
                <p>
                  Standard commercial dairy herds are often raised in dense feeding environments, eating starch-heavy corn silage. Parag cow families, however, are released daily to roam volcanic soil pastures. This pasture grazing leads to rich levels of Conjugated Linoleic Acid (CLA) and Omega-3 fatty acids, which play a central role in protecting heart health and supporting robust gut microbiomes.
                </p>
                <p>
                  Chef tip: When cooking traditional Indian desserts like Rabdi or Payasam, avoid aggressive boiling. Simmer the organic whole milk at 82°C. This gently denatures the whey proteins (beta-lactoglobulins) to create a beautiful, custard-like texture naturally without artificial thickening agents!
                </p>
              </div>

              {/* COMMENTS MODULE */}
              <div className="border-t pt-6 space-y-6">
                <h4 className="text-xs font-black uppercase text-neutral-400 tracking-widest flex items-center gap-1.5">
                  <MessageSquare className="w-4.5 h-4.5 text-blue-600" />
                  Article Comments ({(blogComments[selectedBlog.id] || []).length})
                </h4>

                {/* Listing of comments */}
                <div className="space-y-4 max-h-[180px] overflow-y-auto pr-1">
                  {(blogComments[selectedBlog.id] || []).length === 0 ? (
                    <span className="text-xs text-neutral-400 italic block">No comments published yet. Be the first to start the conversation!</span>
                  ) : (
                    (blogComments[selectedBlog.id] || []).map((comm, cIdx) => (
                      <div key={cIdx} className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-2xl border">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-extrabold text-neutral-800 dark:text-neutral-200">{comm.author}</span>
                          <span className="text-[10px] text-neutral-400 font-bold">{comm.date}</span>
                        </div>
                        <p className="text-neutral-600 dark:text-neutral-400 text-xs mt-2 italic font-semibold">
                          "{comm.text}"
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Submittal comment form */}
                <form onSubmit={(e) => handlePostComment(e, selectedBlog.id)} className="space-y-3 bg-neutral-50 dark:bg-neutral-950 p-4 rounded-2xl border">
                  <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block">Write a reply</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Your name..."
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      className="bg-white dark:bg-neutral-900 text-xs px-3.5 py-2 border rounded-xl focus:outline-hidden"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Comment text..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="bg-white dark:bg-neutral-900 text-xs px-3.5 py-2 border rounded-xl focus:outline-hidden"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] px-4 py-2 rounded-lg cursor-pointer"
                  >
                    POST COMMENT
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
