'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  MessageSquare, 
  Send, 
  ThumbsUp, 
  Heart, 
  Smile,
  Star,
  Lightbulb,
  Plus,
  Filter,
  TrendingUp,
  Award
} from 'lucide-react'
import { supabase, Suggestion, SuggestionReaction } from '@/lib/supabase'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function Suggestions() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [userReactions, setUserReactions] = useState<SuggestionReaction[]>([])
  const [newSuggestion, setNewSuggestion] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('general')
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [loadingSuggestions, setLoadingSuggestions] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const categories = [
    { value: 'general', label: 'General', icon: MessageSquare },
    { value: 'cds', label: 'CDS Activities', icon: Lightbulb },
    { value: 'welfare', label: 'Corps Member Welfare', icon: Heart },
    { value: 'infrastructure', label: 'Infrastructure', icon: Star },
    { value: 'events', label: 'Events & Programs', icon: Award }
  ]

  const reactionEmojis = [
    { emoji: '👍', label: 'Like' },
    { emoji: '❤️', label: 'Love' },
    { emoji: '😊', label: 'Happy' },
    { emoji: '💡', label: 'Great Idea' },
    { emoji: '🔥', label: 'Fire' },
    { emoji: '👏', label: 'Applause' }
  ]

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && profile) {
      fetchSuggestions()
      fetchUserReactions()
    }
  }, [user, profile])

  const fetchSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSuggestions(data || [])
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const fetchUserReactions = async () => {
    if (!profile) return
    
    try {
      const { data, error } = await supabase
        .from('suggestion_reactions')
        .select('*')
        .eq('user_id', profile.id)

      if (error) throw error
      setUserReactions(data || [])
    } catch (error) {
      console.error('Error fetching user reactions:', error)
    }
  }

  const submitSuggestion = async () => {
    if (!newSuggestion.trim() || !profile) return

    setSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('suggestions')
        .insert([{
          content: newSuggestion.trim(),
          category: selectedCategory,
          is_anonymous: isAnonymous
        }])
        .select()

      if (error) throw error

      setSuggestions([data[0], ...suggestions])
      setNewSuggestion('')
      setShowForm(false)
      toast.success('Suggestion submitted successfully!')
    } catch (error) {
      console.error('Error submitting suggestion:', error)
      toast.error('Failed to submit suggestion')
    } finally {
      setSubmitting(false)
    }
  }

  const addReaction = async (suggestionId: string, emoji: string) => {
    if (!profile) return

    try {
      // Check if user already reacted with this emoji
      const existingReaction = userReactions.find(
        r => r.suggestion_id === suggestionId && r.emoji === emoji
      )

      if (existingReaction) {
        // Remove reaction
        const { error } = await supabase
          .from('suggestion_reactions')
          .delete()
          .eq('id', existingReaction.id)

        if (error) throw error

        setUserReactions(userReactions.filter(r => r.id !== existingReaction.id))
        
        // Update suggestion reactions count
        setSuggestions(suggestions.map(s => 
          s.id === suggestionId 
            ? { ...s, reactions_count: s.reactions_count - 1 }
            : s
        ))
      } else {
        // Add reaction
        const { data, error } = await supabase
          .from('suggestion_reactions')
          .insert([{
            suggestion_id: suggestionId,
            user_id: profile.id,
            emoji: emoji
          }])
          .select()

        if (error) throw error

        setUserReactions([...userReactions, data[0]])
        
        // Update suggestion reactions count
        setSuggestions(suggestions.map(s => 
          s.id === suggestionId 
            ? { ...s, reactions_count: s.reactions_count + 1 }
            : s
        ))
      }
    } catch (error) {
      console.error('Error managing reaction:', error)
      toast.error('Failed to update reaction')
    }
  }

  const filteredSuggestions = suggestions.filter(suggestion => 
    categoryFilter === 'all' || suggestion.category === categoryFilter
  )

  const hasUserReacted = (suggestionId: string, emoji: string) => {
    return userReactions.some(r => r.suggestion_id === suggestionId && r.emoji === emoji)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  }

  if (loading || loadingSuggestions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Community Suggestions
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Share your ideas and feedback to help improve our NYSC community
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card>
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-gray-900">{suggestions.length}</h3>
              <p className="text-gray-600">Total Suggestions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-gray-900">
                {suggestions.reduce((sum, s) => sum + s.reactions_count, 0)}
              </h3>
              <p className="text-gray-600">Total Reactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-gray-900">
                {categories.length}
              </h3>
              <p className="text-gray-600">Categories</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8"
        >
          <div className="flex items-center space-x-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Suggestion
          </Button>
        </motion.div>

        {/* Suggestion Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Share Your Suggestion</CardTitle>
                  <CardDescription>
                    Help us improve by sharing your ideas and feedback
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            <div className="flex items-center">
                              <category.icon className="h-4 w-4 mr-2" />
                              {category.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Suggestion</label>
                    <Textarea
                      placeholder="Share your idea or feedback..."
                      value={newSuggestion}
                      onChange={(e) => setNewSuggestion(e.target.value)}
                      className="min-h-[120px]"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="anonymous"
                      checked={isAnonymous}
                      onCheckedChange={setIsAnonymous}
                    />
                    <label htmlFor="anonymous" className="text-sm">
                      Submit anonymously
                    </label>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={submitSuggestion}
                      disabled={!newSuggestion.trim() || submitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Submit
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggestions List */}
        {filteredSuggestions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Suggestions Found</h3>
              <p className="text-gray-600">
                {suggestions.length === 0 
                  ? "Be the first to share a suggestion!"
                  : "Try adjusting your filter to see more suggestions."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {filteredSuggestions.map((suggestion, index) => {
              const categoryInfo = categories.find(c => c.value === suggestion.category)
              
              return (
                <motion.div key={suggestion.id} variants={itemVariants}>
                  <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">
                            <div className="flex items-center">
                              {categoryInfo && <categoryInfo.icon className="h-3 w-3 mr-1" />}
                              {categoryInfo?.label}
                            </div>
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {format(new Date(suggestion.created_at), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {suggestion.content}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {reactionEmojis.map((reaction) => (
                            <Button
                              key={reaction.emoji}
                              variant="ghost"
                              size="sm"
                              className={`hover:bg-gray-100 ${
                                hasUserReacted(suggestion.id, reaction.emoji)
                                  ? 'bg-green-50 text-green-700'
                                  : ''
                              }`}
                              onClick={() => addReaction(suggestion.id, reaction.emoji)}
                            >
                              <span className="text-lg mr-1">{reaction.emoji}</span>
                              <span className="text-xs">
                                {userReactions.filter(r => 
                                  r.suggestion_id === suggestion.id && r.emoji === reaction.emoji
                                ).length}
                              </span>
                            </Button>
                          ))}
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-500">
                          <Heart className="h-4 w-4 mr-1" />
                          <span>{suggestion.reactions_count} reactions</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mt-16 text-center"
        >
          <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
            <CardContent className="p-8">
              <Lightbulb className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">
                Your Voice Matters
              </h2>
              <p className="text-green-100 mb-6 max-w-2xl mx-auto">
                Every suggestion helps us build a better community. Share your ideas, 
                react to others, and be part of positive change.
              </p>
              {!showForm && (
                <Button
                  size="lg"
                  className="bg-yellow-400 text-green-600 hover:bg-yellow-500"
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Share Your Idea
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}