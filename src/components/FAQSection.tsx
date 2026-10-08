import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'What are SK Pizza Point delivery timings and coverage areas in Gwalior?',
    answer:
      'We are open 7 days a week from 11:00 AM to 11:00 PM. We deliver piping hot pizzas, burgers, and sandwiches to Badagoan Road, Khureiri, and nearby residential localities across Gwalior with live map order tracking.',
  },
  {
    id: 'faq-2',
    question: 'Are all pizzas and food items 100% pure vegetarian?',
    answer:
      'Yes! Every item on our menu is prepared in a 100% pure vegetarian kitchen. We use 100% genuine dairy mozzarella cheese, fresh paneer, and crisp locally sourced vegetables.',
  },
  {
    id: 'faq-3',
    question: 'How can I place an order online or directly via WhatsApp?',
    answer:
      'You can easily add items from our website menu to your cart and hit Checkout. Once confirmed, you can chat with our kitchen live on WhatsApp (+91 9617142439) with prefilled details, or track your rider live in real-time.',
  },
  {
    id: 'faq-4',
    question: 'What payment options do you support? Can I pay with UPI or Cash on Delivery?',
    answer:
      'Yes, we accept Cash on Delivery (COD) as well as all major UPI payment methods (Google Pay, PhonePe, Paytm, BHIM) upon delivery or at counter pickup.',
  },
  {
    id: 'faq-5',
    question: 'How long does pizza preparation take before dispatch?',
    answer:
      'All our stone-oven pizzas are made fresh from scratch using fermented hand-stretched dough. Our average oven baking time is 15-25 minutes to guarantee blistered, crispy perfection.',
  },
];

export const FAQSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const toggleFAQ = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
          <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
          <span>Frequently Asked Questions</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-[#1E1915]">
          Got Questions? We’ve Got Answers
        </h2>
        <p className="text-xs sm:text-sm text-[#6B5B4F] max-w-xl mx-auto">
          Everything you need to know about our fresh ingredients, delivery speed, and payment options.
        </p>
      </div>

      <div className="space-y-3.5">
        {FAQ_DATA.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div
              key={faq.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'bg-white border-amber-300 shadow-md ring-1 ring-amber-300/40'
                  : 'bg-white/80 hover:bg-white border-amber-200/80 shadow-sm'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleFAQ(faq.id)}
                aria-expanded={isOpen}
                className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
              >
                <span className="font-extrabold text-sm sm:text-base text-[#1E1915] leading-snug">
                  {faq.question}
                </span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    isOpen ? 'bg-amber-500 text-slate-950 rotate-180' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-[#55473E] leading-relaxed border-t border-amber-100/70">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
