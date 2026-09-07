// Learning Screen Component - Auto-refreshed
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import axios from 'axios';
import { openDB } from '../../lib/database';

const { width } = Dimensions.get('window');

// Local fallback database of lessons to guarantee offline functionality on first run
const LOCAL_FALLBACK_LESSONS: Record<string, any[]> = {
  "under_5th": [
    {
      "id": "u5_saving_piggy",
      "category": "Savings",
      "title": "Saving in a Piggy Bank",
      "content": "Saving means keeping a small part of your money safe for the future. A piggy bank (Gullak) is a great tool for this! Every time you get coins or notes, put a tiny bit inside. Over time, these small coins grow into a big pile of money that can help you when you need it most.",
      "icon": "🐷",
      "quiz": {
        "question": "What is a Gullak (Piggy Bank) used for?",
        "options": [
          "Spending all your money immediately",
          "Keeping small savings safe for the future",
          "Throwing money away"
        ],
        "correct_answer_index": 1
      }
    },
    {
      "id": "u5_otp_safety",
      "category": "Security",
      "title": "Never Share Your OTP or PIN",
      "content": "A PIN or OTP (One-Time Password) is like a secret key to your money. Just like you would never give your house keys to a stranger, you must never tell anyone your PIN or OTP, even if they claim to call from your bank. Keep it secret to keep your money safe!",
      "icon": "🔑",
      "quiz": {
        "question": "Is it safe to share your bank OTP or PIN with someone on the phone?",
        "options": [
          "Yes, if they say they are from the bank",
          "No, never share it with anyone",
          "Yes, if they promise to give you a prize"
        ],
        "correct_answer_index": 1
      }
    }
  ],
  "5th_pass": [
    {
      "id": "p5_account_types",
      "category": "Banking",
      "title": "Understanding a Savings Account",
      "content": "A Savings Account is a bank account where you deposit your extra money. The bank not only keeps it safe but also pays you a small reward called 'Interest' just for keeping your money there. It is the best place to start your financial journey.",
      "icon": "🏦",
      "quiz": {
        "question": "What does a bank give you as a reward for keeping money in a savings account?",
        "options": [
          "Nothing",
          "Interest (extra money)",
          "A free lock and key"
        ],
        "correct_answer_index": 1
      }
    },
    {
      "id": "p5_loan_sharks",
      "category": "Borrowing",
      "title": "Beware of Local Loan Sharks",
      "content": "Local money lenders (loan sharks) often charge extremely high interest rates, making it very hard to pay back. If you need money, always try to go to a formal bank first. Bank loans have strict rules, but they are much cheaper and safer than local lenders.",
      "icon": "🪤",
      "quiz": {
        "question": "Why are local money lenders (loan sharks) dangerous?",
        "options": [
          "They don't charge any interest",
          "They charge extremely high interest rates that trap you in debt",
          "They are official bank workers"
        ],
        "correct_answer_index": 1
      }
    }
  ],
  "10th_pass": [
    {
      "id": "p10_budgeting",
      "category": "Budgeting",
      "title": "The 50/30/20 Budget Rule",
      "content": "Budgeting helps you control where your money goes. A simple rule is the 50/30/20 rule: Spend 50% of your income on 'Needs' (rent, food, bills), 30% on 'Wants' (movies, dining out, hobbies), and save 20% immediately for your future goals and emergencies.",
      "icon": "📊",
      "quiz": {
        "question": "Under the 50/30/20 rule, what percentage of your income should you try to save?",
        "options": [
          "50%",
          "30%",
          "20%"
        ],
        "correct_answer_index": 2
      }
    },
    {
      "id": "p10_compounding",
      "category": "Savings",
      "title": "The Magic of Compound Interest",
      "content": "Simple interest pays you interest only on your original money. Compound interest pays you interest on your original money PLUS the interest you have already earned. Over time, compounding acts like a snowball, making your savings grow faster and faster.",
      "icon": "⏳",
      "quiz": {
        "question": "What is compound interest?",
        "options": [
          "Interest earned only on the initial amount",
          "Interest earned on both the initial amount and accumulated interest",
          "A penalty fee charged by banks"
        ],
        "correct_answer_index": 1
      }
    }
  ],
  "12th_pass_above": [
    {
      "id": "p12_mutual_funds",
      "category": "Investment",
      "title": "Introduction to Mutual Funds & SIPs",
      "content": "Mutual funds collect money from many investors and invest it in a mix of stocks and bonds managed by experts. A Systematic Investment Plan (SIP) lets you invest a small, fixed amount (like ₹500) monthly. While mutual funds carry market risk, they generally offer much higher returns than savings accounts over the long term.",
      "icon": "🚀",
      "quiz": {
        "question": "What is a Systematic Investment Plan (SIP)?",
        "options": [
          "A plan to borrow money monthly",
          "Investing a fixed small amount regularly in mutual funds",
          "A government crop insurance scheme"
        ],
        "correct_answer_index": 1
      }
    },
    {
      "id": "p12_credit_score",
      "category": "Debt",
      "title": "Understanding Credit Scores (CIBIL)",
      "content": "A Credit Score (like CIBIL) is a number between 300 and 900 that shows how reliable you are at repaying loans. If you pay your credit cards and loan EMIs on time, your score goes up. A high score (above 750) helps you get loans easily and at much lower interest rates.",
      "icon": "📑",
      "quiz": {
        "question": "What does a high CIBIL score (e.g., 780) indicate to a lender?",
        "options": [
          "The borrower is high risk and likely to default",
          "The borrower is highly reliable and qualifies for lower interest rates",
          "The borrower has no bank accounts"
        ],
        "correct_answer_index": 1
      }
    }
  ]
};

// Fallback news database per education slab
const LOCAL_FALLBACK_NEWS: Record<string, any[]> = {
  "under_5th": [
    {
      "id": "news_u5_1",
      "category": "Current Affairs",
      "title": "New Easy-to-Identify Bank Notes",
      "content": "The government has released clear, colorful bank notes. Always check the shiny security line and the picture of Mahatma Gandhi to confirm your money is real.",
      "icon": "💵",
      "quiz": {
        "question": "What should you check to verify if a currency note is real?",
        "options": ["The shiny security thread", "The color of your wallet", "Nothing"],
        "correct_answer_index": 0
      }
    },
    {
      "id": "news_u5_2",
      "category": "Security Alert",
      "title": "Alert: Beware of Phone Fraud",
      "content": "Police have warned against phone callers pretending to be bank officers. Never share your secret 4-digit PIN or OTP on phone calls.",
      "icon": "🚨",
      "quiz": {
        "question": "Should you share your bank PIN with someone calling on the phone?",
        "options": ["Yes", "Never share it", "Only if they sound polite"],
        "correct_answer_index": 1
      }
    }
  ],
  "5th_pass": [
    {
      "id": "news_5p_1",
      "category": "Banking Update",
      "title": "Jan Dhan Account Insurance Benefit",
      "content": "Jan Dhan account holders get free accident insurance cover up to ₹2 Lakhs with their RuPay debit card. Keep your account active to stay covered.",
      "icon": "🏦",
      "quiz": {
        "question": "What free benefit comes with an active RuPay Jan Dhan card?",
        "options": ["Free movie tickets", "Accident insurance cover", "Free smartphones"],
        "correct_answer_index": 1
      }
    },
    {
      "id": "news_5p_2",
      "category": "Digital Payments",
      "title": "Faster Payments with UPI Lite",
      "content": "You can now use UPI Lite for small daily purchases under ₹500. It processes payments instantly without needing your PIN every time.",
      "icon": "⚡",
      "quiz": {
        "question": "What is the benefit of UPI Lite for small payments?",
        "options": ["Fast payments without typing PIN every time", "It charges high fees", "It takes 5 days"],
        "correct_answer_index": 0
      }
    }
  ],
  "10th_pass": [
    {
      "id": "news_10p_1",
      "category": "Economic News",
      "title": "RBI Keeps Bank Loan Interest Rates Stable",
      "content": "The Reserve Bank of India kept the repo rate unchanged at its latest meeting. This means home, auto, and personal loan interest rates will remain steady for consumers.",
      "icon": "📈",
      "quiz": {
        "question": "What does a steady RBI repo rate mean for borrowers?",
        "options": ["Loan interest rates remain stable", "Loans become illegal", "Bank accounts are closed"],
        "correct_answer_index": 0
      }
    },
    {
      "id": "news_10p_2",
      "category": "Consumer Rights",
      "title": "3-Day Rule for Cyber Fraud Refunds",
      "content": "Under RBI guidelines, if you report an unauthorized bank transfer within 3 days, the bank is legally obligated to investigate and refund your stolen money.",
      "icon": "🛡️",
      "quiz": {
        "question": "Within how many days should you report unauthorized bank transactions to qualify for a full refund?",
        "options": ["3 days", "30 days", "1 year"],
        "correct_answer_index": 0
      }
    }
  ],
  "12th_pass_above": [
    {
      "id": "news_12p_1",
      "category": "Market Watch",
      "title": "Micro-SIPs Launched from ₹250 Monthly",
      "content": "SEBI has approved Micro-SIPs allowing retail investors to start mutual fund investments with just ₹250/month, making market investments accessible to everyone.",
      "icon": "🚀",
      "quiz": {
        "question": "What is the minimum monthly amount for new Micro-SIP mutual fund plans?",
        "options": ["₹250", "₹10,000", "₹1,00,000"],
        "correct_answer_index": 0
      }
    },
    {
      "id": "news_12p_2",
      "category": "Tax & Finance",
      "title": "Higher Standard Deduction in New Tax Regime",
      "content": "The standard deduction under the new income tax regime provides extra tax relief for salaried workers earning up to ₹7.5 Lakhs annually.",
      "icon": "🧾",
      "quiz": {
        "question": "Who benefits from the standard deduction in income tax?",
        "options": ["Salaried individuals and taxpayers", "Foreign companies", "Nobody"],
        "correct_answer_index": 0
      }
    }
  ]
};

interface Quiz {
  question: string;
  options: string[];
  correct_answer_index: number;
}

interface ModuleItem {
  id: string;
  category: string;
  title: string;
  content: string;
  icon: string;
  quiz: Quiz;
}



const getCacheItem = async (key: string): Promise<string | null> => {
  try {
    const db = await openDB();
    const rows = await db.getAllAsync<{ value: string }>(
      'SELECT value FROM app_cache WHERE key = ? LIMIT 1',
      [key]
    );
    if (rows && rows.length > 0) {
      return rows[0].value;
    }
    return null;
  } catch (e) {
    return null;
  }
};

const setCacheItem = async (key: string, value: string): Promise<void> => {
  try {
    const db = await openDB();
    await db.runAsync(
      'INSERT OR REPLACE INTO app_cache (key, value) VALUES (?, ?)',
      [key, value]
    );
  } catch (e) {
    console.log('[SQLite Cache Set Error]:', e);
  }
};

export default function LearningScreen() {
  const [activeTab, setActiveTab] = useState<'lessons' | 'news'>('lessons');
  const [educationLevel, setEducationLevel] = useState<string>('10th_pass');
  const [langCode, setLangCode] = useState<string>('en');
  const [lessons, setLessons] = useState<ModuleItem[]>([]);
  const [news, setNews] = useState<ModuleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Track speaking audio state
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  
  // Track user quiz attempts: { [moduleId]: selectedIndex }
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [completedModuleIds, setCompletedModuleIds] = useState<string[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadProfileAndContent();
      return () => {
        Speech.stop();
      };
    }, [])
  );

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const loadProfileAndContent = async () => {
    setLoading(true);
    try {
      // 1. Fetch local profile info from SQLite DB
      let activeUserId: string | null = null;
      try {
        activeUserId = await SecureStore.getItemAsync('active_user_id');
      } catch (e) {}

      let localLevel = '10th_pass';
      let localLang = 'en';
      
      if (activeUserId) {
        try {
          const db = await openDB();
          const profiles = await db.getAllAsync<{ education_level: string; language_code: string }>(
            'SELECT education_level, language_code FROM parametric_profiles WHERE user_id = ? LIMIT 1',
            [activeUserId]
          );
          if (profiles && profiles.length > 0) {
            localLevel = profiles[0].education_level || '10th_pass';
            localLang = profiles[0].language_code || 'en';
          }
        } catch (dbErr) {
          console.log('[SQLite Profile Load Error]:', dbErr);
        }
      }

      setEducationLevel(localLevel);
      setLangCode(localLang);

      // GUARANTEE 1: Set default static lessons & news immediately into state
      const initialFallbackLessons = LOCAL_FALLBACK_LESSONS[localLevel] || LOCAL_FALLBACK_LESSONS['10th_pass'];
      const initialFallbackNews = LOCAL_FALLBACK_NEWS[localLevel] || LOCAL_FALLBACK_NEWS['10th_pass'];
      
      setLessons(initialFallbackLessons);
      setNews(initialFallbackNews);

      // 2. Load cached completed module IDs using SQLite cache
      const storedCompleted = await getCacheItem('completed_learnings');
      if (storedCompleted) {
        try {
          setCompletedModuleIds(JSON.parse(storedCompleted));
        } catch (e) {}
      }

      // 3. Load offline cache from SQLite app_cache table
      const cacheKey = `learning_cache_${localLevel}_${localLang}`;
      const cachedData = await getCacheItem(cacheKey);
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          if (parsed.lessons && parsed.lessons.length > 0) {
            setLessons(parsed.lessons);
          }
          if (parsed.news && parsed.news.length > 0) {
            setNews(parsed.news);
          }
        } catch (e) {}
      }

      // 4. Try network fetch from server to get daily dynamic news & fresh modules
      if (activeUserId && process.env.EXPO_PUBLIC_API_URL) {
        try {
          const response = await axios.get(
            `${process.env.EXPO_PUBLIC_API_URL}/api/learning/modules?user_id=${activeUserId}`,
            {
              headers: {
                'ngrok-skip-browser-warning': 'true',
              },
              timeout: 10000,
            }
          );
          if (response.status === 200 && response.data) {
            const fetched = response.data;
            if (fetched.lessons && fetched.lessons.length > 0) {
              setLessons(fetched.lessons);
            }
            if (fetched.news && fetched.news.length > 0) {
              setNews(fetched.news);
            }
            // Save to SQLite app_cache (No 2048 byte limit!)
            await setCacheItem(cacheKey, JSON.stringify(fetched));
          }
        } catch (err) {
          console.log('☁️ Server fetch offline/unreachable. Using local fallback content.');
        }
      }

    } catch (e) {
      console.log('Error loading learning screen context:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (id: string) => {
    if (speakingId) {
      Speech.stop();
      setSpeakingId(null);
    }
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSpeech = async (id: string, text: string) => {
    if (speakingId === id) {
      Speech.stop();
      setSpeakingId(null);
    } else {
      Speech.stop();
      setSpeakingId(id);
      
      let ttsLang = 'en-US';
      if (langCode === 'hi') ttsLang = 'hi-IN';
      else if (langCode === 'te') ttsLang = 'te-IN';
      else if (langCode === 'ta') ttsLang = 'ta-IN';
      else if (langCode === 'kn') ttsLang = 'kn-IN';
      
      Speech.speak(text, {
        language: ttsLang,
        onDone: () => setSpeakingId(null),
        onError: () => setSpeakingId(null),
      });
    }
  };

  const handleQuizAnswer = async (moduleId: string, selectedIndex: number, correctIndex: number) => {
    setQuizAnswers(prev => ({ ...prev, [moduleId]: selectedIndex }));

    if (selectedIndex === correctIndex) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      if (!completedModuleIds.includes(moduleId)) {
        const updated = [...completedModuleIds, moduleId];
        setCompletedModuleIds(updated);
        await setCacheItem('completed_learnings', JSON.stringify(updated));
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const getSlabLabel = (slab: string) => {
    switch (slab) {
      case 'under_5th': return 'Below 5th Level';
      case '5th_pass': return '5th Pass Level';
      case '10th_pass': return '10th Pass Level';
      case '12th_pass_above': return '12th Pass & Above Level';
      default: return 'Custom Level';
    }
  };

  const currentList = activeTab === 'lessons' ? lessons : news;

  return (
    <View style={styles.container}>
      {/* Header section */}
      <View style={styles.header}>
        <Text style={styles.title}>Learning Hub</Text>
        <Text style={styles.subtitle}>Financial knowledge designed for your goals.</Text>
        <View style={styles.slabBadge}>
          <Text style={styles.slabText}>📊 Level: {getSlabLabel(educationLevel)}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'lessons' && styles.activeTab]}
          onPress={() => {
            setActiveTab('lessons');
            setExpandedId(null);
            Speech.stop();
            setSpeakingId(null);
          }}
        >
          <Text style={[styles.tabText, activeTab === 'lessons' && styles.activeTabText]}>
            📚 Basics
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'news' && styles.activeTab]}
          onPress={() => {
            setActiveTab('news');
            setExpandedId(null);
            Speech.stop();
            setSpeakingId(null);
          }}
        >
          <Text style={[styles.tabText, activeTab === 'news' && styles.activeTabText]}>
            📰 Daily News
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#8B0A2A" />
          <Text style={styles.loaderText}>Loading lessons adapted for you...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {currentList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>No content available</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'news' 
                  ? 'Connect to backend server to generate customized daily financial news.' 
                  : 'No static modules found for this education slab.'}
              </Text>
            </View>
          ) : (
            currentList.map((item) => {
              const isExpanded = expandedId === item.id;
              const isCompleted = completedModuleIds.includes(item.id);
              const selectedAnswer = quizAnswers[item.id];
              const hasAnswered = selectedAnswer !== undefined;

              return (
                <View key={item.id} style={[styles.card, isCompleted && styles.completedCard]}>
                  {/* Card Header (Clickable) */}
                  <Pressable style={styles.cardHeader} onPress={() => toggleSection(item.id)}>
                    <View style={styles.cardHeaderLeft}>
                      <Text style={styles.itemIcon}>{item.icon}</Text>
                      <View style={styles.titleContainer}>
                        <Text style={styles.categoryBadge}>{item.category.toUpperCase()}</Text>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                      </View>
                    </View>
                    <View style={styles.cardHeaderRight}>
                      {isCompleted && <Text style={styles.checkIcon}>✅</Text>}
                      <Text style={styles.arrowIcon}>{isExpanded ? '▲' : '▼'}</Text>
                    </View>
                  </Pressable>

                  {/* Expanded Content Accordion */}
                  {isExpanded && (
                    <View style={styles.cardBody}>
                      <View style={styles.divider} />
                      
                      {/* TTS Audio Controls */}
                      <Pressable 
                        style={[styles.ttsButton, speakingId === item.id && styles.ttsActiveButton]}
                        onPress={() => handleSpeech(item.id, item.content)}
                      >
                        <Text style={styles.ttsText}>
                          {speakingId === item.id ? '⏹️ Stop Voice' : '🔊 Listen to Lesson'}
                        </Text>
                      </Pressable>

                      {/* Main Paragraph */}
                      <Text style={styles.itemContent}>{item.content}</Text>

                      {/* Interactive Mini Quiz */}
                      {item.quiz && (
                        <View style={styles.quizBox}>
                          <Text style={styles.quizHeader}>🧠 Quick Practice</Text>
                          <Text style={styles.quizQuestion}>{item.quiz.question}</Text>
                          
                          {item.quiz.options.map((option, idx) => {
                            const isCorrectIdx = idx === item.quiz.correct_answer_index;
                            const isSelected = selectedAnswer === idx;

                            let optionStyle: any = styles.optionBtn;
                            let optionTextStyle: any = styles.optionBtnText;

                            if (hasAnswered) {
                              if (isCorrectIdx) {
                                optionStyle = [styles.optionBtn, styles.optionCorrect];
                                optionTextStyle = [styles.optionBtnText, styles.optionCorrectText];
                              } else if (isSelected) {
                                optionStyle = [styles.optionBtn, styles.optionIncorrect];
                                optionTextStyle = [styles.optionBtnText, styles.optionIncorrectText];
                              } else {
                                optionStyle = [styles.optionBtn, styles.optionDisabled];
                              }
                            } else {
                              optionStyle = styles.optionBtn;
                            }

                            return (
                              <Pressable
                                key={idx}
                                disabled={hasAnswered}
                                style={({ pressed }) => [
                                  optionStyle,
                                  pressed && !hasAnswered && styles.optionPressed
                                ]}
                                onPress={() => handleQuizAnswer(item.id, idx, item.quiz.correct_answer_index)}
                              >
                                <Text style={optionTextStyle}>{option}</Text>
                              </Pressable>
                            );
                          })}

                          {hasAnswered && (
                            <Text style={[
                              styles.feedbackText,
                              selectedAnswer === item.quiz.correct_answer_index ? styles.feedbackSuccess : styles.feedbackError
                            ]}>
                              {selectedAnswer === item.quiz.correct_answer_index 
                                ? '🎉 Correct! Well done.' 
                                : '❌ Incorrect. Try reading the section again!'}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F3EA',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#F6F3EA',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#8B0A2A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  slabBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  slabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#EAE6DB',
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 21,
  },
  activeTab: {
    backgroundColor: '#8B0A2A',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#EAE6DB',
    overflow: 'hidden',
  },
  completedCard: {
    borderColor: '#D1FAE5',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  categoryBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8B0A2A',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  arrowIcon: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 16,
  },
  ttsButton: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  ttsActiveButton: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
  },
  ttsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B0A2A',
  },
  itemContent: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4B5563',
    marginBottom: 20,
  },
  quizBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quizHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#8B0A2A',
    marginBottom: 8,
  },
  quizQuestion: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  optionBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  optionPressed: {
    backgroundColor: '#F3F4F6',
  },
  optionBtnText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  optionCorrect: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  optionCorrectText: {
    color: '#065F46',
  },
  optionIncorrect: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  optionIncorrectText: {
    color: '#991B1B',
  },
  optionDisabled: {
    opacity: 0.6,
  },
  feedbackText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  feedbackSuccess: {
    color: '#059669',
  },
  feedbackError: {
    color: '#DC2626',
  },
});
