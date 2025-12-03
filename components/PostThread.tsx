import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { PostComment } from '@/types/furniture';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Keyboard, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type CommentLabel = 'question' | 'comment' | 'suggestion';

interface PostThreadProps {
  postId: string;
  onCommentsUpdate?: (comments: PostComment[]) => void;
}

export function PostThread({ postId, onCommentsUpdate }: PostThreadProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isReplying, setIsReplying] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [commentLabel, setCommentLabel] = useState<CommentLabel>('comment');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [collapsedComments, setCollapsedComments] = useState<Set<string>>(new Set());
  const scrollViewRef = useRef<ScrollView>(null);
  const replyInputRef = useRef<TextInput>(null);
  const [replyingToComment, setReplyingToComment] = useState<PostComment | null>(null);

  useEffect(() => {
    if (postId) {
      fetchComments();
      // Auto-scroll to bottom when thread loads
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [postId]);

  useEffect(() => {
    if (!isReplying) return;

    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [isReplying]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      // Use join to fetch profiles in a single query to reduce egress
      const { data: allComments, error: allError } = await supabase
        .from('post_comments')
        .select(`
          id, 
          post_id, 
          user_id, 
          parent_comment_id, 
          content, 
          label, 
          created_at,
          profiles:user_id (
            id,
            username,
            display_name
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (allError) {
        if (allError.code === '42P01') {
          console.warn('post_comments table does not exist yet');
          setComments([]);
          return;
        }
        throw allError;
      }

      if (!allComments || allComments.length === 0) {
        setComments([]);
        return;
      }

      // Create profiles map from joined data
      const profilesMap = new Map();
      allComments.forEach((comment: any) => {
        if (comment.profiles && comment.user_id) {
          profilesMap.set(comment.user_id, comment.profiles);
        }
      });

      // Build nested structure
      const commentsMap = new Map<string, PostComment>();
      const rootComments: PostComment[] = [];

      (allComments || []).forEach((comment: any) => {
        // Extract profile from joined data or fallback to map lookup
        const profile = comment.profiles || profilesMap.get(comment.user_id);
        const commentObj: PostComment = {
          id: comment.id,
          post_id: comment.post_id,
          user_id: comment.user_id,
          parent_comment_id: comment.parent_comment_id || undefined,
          content: comment.content,
          label: comment.label || 'comment',
          created_at: comment.created_at,
          username: profile?.username,
          display_name: profile?.display_name,
          replies: [],
        };
        commentsMap.set(comment.id, commentObj);
      });

      commentsMap.forEach((comment) => {
        if (comment.parent_comment_id) {
          const parent = commentsMap.get(comment.parent_comment_id);
          if (parent) {
            if (!parent.replies) parent.replies = [];
            parent.replies.push(comment);
          }
        } else {
          rootComments.push(comment);
        }
      });

      setComments(rootComments);
      if (onCommentsUpdate) {
        onCommentsUpdate(rootComments);
      }
    } catch (error: any) {
      console.error('Error fetching comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!user?.id || !replyText.trim()) return;

    setSubmittingReply(true);
    try {
      const parentId = isReplying && replyingToComment ? replyingToComment.id : null;
      
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          parent_comment_id: parentId || null,
          content: replyText.trim(),
          label: parentId ? null : commentLabel, // Only top-level comments have labels
        })
        .select('id, post_id, user_id, parent_comment_id, content, label, created_at')
        .single();

      if (error) throw error;

      await fetchComments();
      setReplyText('');
      setIsReplying(null);
      setReplyingToComment(null);
      setCommentLabel('comment');
    } catch (error: any) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user?.id) return;

    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('post_comments')
                .delete()
                .eq('id', commentId)
                .eq('user_id', user.id);

              if (error) throw error;

              await fetchComments();
            } catch (error: any) {
              console.error('Error deleting comment:', error);
              Alert.alert('Error', 'Failed to delete comment. You can only delete your own comments.');
            }
          },
        },
      ]
    );
  };


  const toggleCommentCollapse = (commentId: string) => {
    setCollapsedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getLabelColor = (label: CommentLabel) => {
    switch (label) {
      case 'question': return '#8B4513';
      case 'comment': return '#AF52DE';
      case 'suggestion': return '#34C759';
      default: return '#999';
    }
  };

  const getLabelName = (label: CommentLabel) => {
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const renderComment = (comment: PostComment, depth: number = 0) => {
    const isCollapsed = collapsedComments.has(comment.id);
    const hasReplies = comment.replies && comment.replies.length > 0;
    const maxDepth = 3;

    return (
      <View key={comment.id} style={[styles.commentContainer, depth > 0 && styles.replyContainer]}>
        <View style={styles.commentHeader}>
          <View style={styles.commentAuthor}>
            {depth === 0 && comment.label && (
              <View style={[styles.labelBadge, { backgroundColor: getLabelColor(comment.label) }]}>
                <Text style={styles.labelText}>{getLabelName(comment.label)}</Text>
              </View>
            )}
            <Text style={styles.commentAuthorName}>
              {comment.display_name || comment.username || 'Anonymous'}
            </Text>
            <Text style={styles.commentTime}>{formatTimeAgo(comment.created_at)}</Text>
          </View>
          <View style={styles.commentHeaderActions}>
            {hasReplies && (
              <TouchableOpacity
                style={styles.collapseButton}
                onPress={() => toggleCommentCollapse(comment.id)}
              >
                <Ionicons
                  name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                  size={16}
                  color="#999"
                />
                <Text style={styles.collapseText}>
                  {isCollapsed ? 'Show' : 'Hide'} {comment.replies?.length} {comment.replies?.length === 1 ? 'reply' : 'replies'}
                </Text>
              </TouchableOpacity>
            )}
            {user?.id === comment.user_id && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteComment(comment.id)}
              >
                <Ionicons name="trash-outline" size={16} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={styles.commentContent}>{comment.content}</Text>

        {user && depth < maxDepth && (
          <TouchableOpacity
            style={styles.replyButton}
            onPress={() => {
              setIsReplying(comment.id);
              setReplyingToComment(comment);
              setTimeout(() => {
                replyInputRef.current?.focus();
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
          >
            <Ionicons name="arrow-undo-outline" size={14} color="#999" />
            <Text style={styles.replyButtonText}>Reply</Text>
          </TouchableOpacity>
        )}

        {hasReplies && !isCollapsed && (
          <View style={[styles.repliesContainer, { marginLeft: depth < maxDepth ? 20 : 0 }]}>
            {comment.replies?.map((reply) => renderComment(reply, depth + 1))}
          </View>
        )}
      </View>
    );
  };

  const commentCount = comments.reduce((count, comment) => {
    const countReplies = (c: PostComment): number => {
      return 1 + (c.replies?.reduce((sum, r) => sum + countReplies(r), 0) || 0);
    };
    return count + countReplies(comment);
  }, 0);

  const labels: CommentLabel[] = ['question', 'comment', 'suggestion'];

  return (
    <View style={styles.commentsContainer}>
      <View style={styles.threadHeader}>
        <Ionicons name="chatbubble-outline" size={16} color="#999" />
        <Text style={styles.commentsHeaderText}>
          {commentCount > 0 ? `${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}` : 'Thread'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#999" />
        </View>
      ) : (
        <>
          <ScrollView
            ref={scrollViewRef}
            style={styles.commentsList}
            contentContainerStyle={[styles.commentsListContent, { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 20 : 20 }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {comments.length === 0 ? (
              <Text style={styles.noCommentsText}>No comments yet. Be the first to comment!</Text>
            ) : (
              comments.map((comment) => renderComment(comment))
            )}
          </ScrollView>

          {user && (
            <View style={[styles.addCommentContainer, { marginBottom: keyboardHeight > 0 ? keyboardHeight : 0 }]}>
              {isReplying && replyingToComment && (
                <View style={styles.replyingToIndicator}>
                  <Text style={styles.replyingToText}>
                    Replying to {replyingToComment.display_name || replyingToComment.username || 'Anonymous'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setIsReplying(null);
                      setReplyingToComment(null);
                      setReplyText('');
                    }}
                  >
                    <Ionicons name="close-circle" size={18} color="#999" />
                  </TouchableOpacity>
                </View>
              )}
              {!isReplying && (
                <View style={styles.labelSelector}>
                  {labels.map((label) => (
                    <TouchableOpacity
                      key={label}
                      style={[
                        styles.labelOption,
                        commentLabel === label && styles.labelOptionActive,
                        { borderColor: getLabelColor(label) }
                      ]}
                      onPress={() => setCommentLabel(label)}
                    >
                      <Text style={[
                        styles.labelOptionText,
                        commentLabel === label && { color: getLabelColor(label) }
                      ]}>
                        {getLabelName(label)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <View style={styles.inputWrapper}>
                <TextInput
                  ref={replyInputRef}
                  style={styles.addCommentInput}
                  placeholder={
                    isReplying && replyingToComment 
                      ? "Write a reply..." 
                      : `Add a ${commentLabel}...`
                  }
                  placeholderTextColor="#999"
                  value={replyText}
                  onChangeText={setReplyText}
                  multiline
                  maxLength={1000}
                  textAlignVertical="top"
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                  }}
                />
                <TouchableOpacity
                  style={[styles.addCommentButton, !replyText.trim() && styles.addCommentButtonDisabled]}
                  onPress={handleAddComment}
                  disabled={!replyText.trim() || submittingReply}
                >
                  {submittingReply ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Ionicons name="arrow-forward" size={18} color="#FFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  commentsContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 12,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingBottom: 8,
  },
  commentsHeaderText: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  commentsList: {
    maxHeight: 300,
  },
  commentsListContent: {
    paddingBottom: 20,
  },
  noCommentsText: {
    color: '#666',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  commentContainer: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  replyContainer: {
    marginLeft: 20,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255,255,255,0.1)',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  labelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  labelText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  commentAuthorName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  commentTime: {
    color: '#666',
    fontSize: 11,
  },
  commentHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 4,
  },
  collapseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  collapseText: {
    color: '#999',
    fontSize: 11,
  },
  commentContent: {
    color: '#CCC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  replyButtonText: {
    color: '#999',
    fontSize: 12,
  },
  repliesContainer: {
    marginTop: 8,
  },
  addCommentContainer: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  replyingToIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
  },
  replyingToText: {
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
  },
  labelSelector: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  labelOption: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  labelOptionActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  labelOptionText: {
    color: '#999',
    fontSize: 11,
    fontWeight: '500',
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  addCommentInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    paddingRight: 50,
    color: '#FFF',
    fontSize: 14,
    minHeight: 50,
    maxHeight: 100,
  },
  addCommentButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCommentButtonDisabled: {
    opacity: 0.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});

