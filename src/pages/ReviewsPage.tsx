import React, { useState } from 'react';
import { Star, MessageSquare, CheckCircle2, User, Send, Sparkles, MapPin, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ReviewsPage: React.FC = () => {
  const { reviews, addReview, settings } = useApp();
  const [customerName, setCustomerName] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [botTrap, setBotTrap] = useState('');

  const approvedReviews = reviews.filter((r) => r.isApproved);
  const averageRating =
    approvedReviews.length > 0
      ? (approvedReviews.reduce((acc, r) => acc + r.rating, 0) / approvedReviews.length).toFixed(1)
      : '5.0';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (botTrap.trim()) return; // Honeypot protection
    if (!comment.trim()) return;
    addReview(customerName || 'Valued Guest', rating, comment);
    setComment('');
    setCustomerName('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
            <Star className="w-3.5 h-3.5 fill-amber-600 text-amber-600" />
            <span>Real Customer Reviews</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#1E1915]">
            Loved by Pizza & Burger Enthusiasts
          </h1>
          <p className="text-sm sm:text-base text-[#6B5B4F]">
            Read verified experiences from our valued guests or share your dining feedback.
          </p>

          {/* Average Rating Score Card */}
          {approvedReviews.length > 0 && (
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white border border-amber-200 shadow-md mt-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <span className="font-black text-xl text-[#1E1915]">{averageRating} / 5</span>
              <span className="text-xs text-[#6B5B4F]">({approvedReviews.length} reviews)</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Customer Reviews List */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-xl font-black text-[#1E1915] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-600" />
              <span>Customer Experiences ({approvedReviews.length})</span>
            </h2>

            {approvedReviews.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white border border-amber-200 text-center space-y-2">
                <p className="text-sm text-[#6B5B4F]">
                  No reviews submitted yet. Be the first to share your thoughts about SK Pizza Point!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {approvedReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-6 rounded-3xl bg-white border border-amber-200/70 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-900 font-bold flex items-center justify-center text-sm">
                          {rev.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-[#1E1915]">{rev.customerName}</h4>
                          <span className="text-[11px] text-[#8A7B70]">
                            {new Date(rev.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= rev.rating ? 'fill-amber-500 text-amber-500' : 'text-neutral-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-[#45382E] leading-relaxed">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Submit a Review Form */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-lg space-y-5">
            <h3 className="font-black text-lg text-[#1E1915] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <span>Leave Your Rating</span>
            </h3>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-black text-base text-emerald-950">Thank You!</h4>
                <p className="text-xs text-emerald-800">
                  Your feedback has been saved and published. We appreciate you choosing SK Pizza Point!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Star Rating selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#1E1915]">
                    Your Star Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 text-amber-500 focus:outline-none transition-transform hover:scale-125"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= (hoverRating || rating) ? 'fill-amber-500' : 'text-neutral-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-sm font-bold text-amber-900 ml-2">
                      {hoverRating || rating} out of 5
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#1E1915]">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul S."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-amber-200 bg-neutral-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {/* Comment */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-[#1E1915]">
                    Your Review <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="How was the crust, cheese, and delivery timing?"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-amber-200 bg-neutral-50/50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                  />
                </div>

                {/* Anti-Spam Bot Trap Honeypot Field */}
                <div style={{ display: 'none', position: 'absolute', left: '-9999px', opacity: 0 }} aria-hidden="true">
                  <label htmlFor="review_bot_trap">Do not fill this</label>
                  <input
                    id="review_bot_trap"
                    type="text"
                    name="bot_field_trap"
                    tabIndex={-1}
                    autoComplete="off"
                    value={botTrap}
                    onChange={(e) => setBotTrap(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Review</span>
                </button>
              </form>
            )}

            {/* Google Reviews Direct External Link */}
            <div className="pt-4 border-t border-amber-100 space-y-2">
              <span className="text-xs text-[#6B5B4F] font-semibold block">
                Have a Google account?
              </span>
              <a
                href={settings.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-[#1E1915] font-extrabold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>Rate Us Directly on Google Maps</span>
                <ExternalLink className="w-3 h-3 text-[#8A7B70]" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
