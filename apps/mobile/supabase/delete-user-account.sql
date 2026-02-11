-- delete_user_account RPC function
-- This function deletes all user data from all tables

CREATE OR REPLACE FUNCTION delete_user_account(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Delete from notifications (where user_id is either sender or receiver)
    DELETE FROM notifications
    WHERE sender_id = user_id OR receiver_id = user_id;

    -- Delete from bookmarks
    DELETE FROM bookmarks
    WHERE user_id = user_id;

    -- Delete from messages (where user is sender)
    DELETE FROM messages
    WHERE sender_id = user_id;

    -- Delete from matches (where user is either user1 or user2)
    DELETE FROM matches
    WHERE user1_id = user_id OR user2_id = user_id;

    -- Delete from swipes (where user is swiper)
    DELETE FROM swipes
    WHERE swiper_id = user_id;

    -- Delete from dating_profile
    DELETE FROM dating_profiles
    WHERE user_id = user_id;

    -- Delete from user_reviews (where user is target or reviewer)
    DELETE FROM user_reviews
    WHERE target_user_id = user_id OR reviewer_id = user_id;

    -- Delete from shadow_profiles created by this user
    DELETE FROM shadow_profiles
    WHERE created_by = user_id;

    -- Delete from shadow_reviews created by this user
    DELETE FROM shadow_reviews
    WHERE created_by = user_id;

    -- Delete from post_reactions
    DELETE FROM post_reactions
    WHERE user_id = user_id;

    -- Delete from comments
    DELETE FROM comments
    WHERE author_id = user_id;

    -- Delete from posts
    DELETE FROM posts
    WHERE author_id = user_id;

    -- Delete from blocked_users (where user is blocker or blocked)
    DELETE FROM blocked_users
    WHERE blocker_id = user_id OR blocked_id = user_id;

    -- Delete from reports created by this user
    DELETE FROM reports
    WHERE reporter_id = user_id;

    -- Delete from reports about this user
    DELETE FROM reports
    WHERE target_id = user_id::TEXT;

    -- Delete avatar from storage (optional - keeping the file)
    -- The storage cleanup would be done separately or via a trigger

    -- Delete from profiles
    DELETE FROM profiles
    WHERE id = user_id;

    -- Delete from auth (this will be done by the client via supabase.auth.admin.deleteUser)
    -- The RPC function only handles database data

    result := jsonb_build_object(
        'success', true,
        'message', 'User data deleted successfully'
    );

    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account(UUID) TO authenticated;

-- Note: To fully delete a user account, you need to:
-- 1. Call this RPC function to delete all database data
-- 2. Use supabase.auth.admin.deleteUser() to delete the auth user
--    (This requires service role key, should be done via a Supabase Edge Function)
