# Entrika Deployment Checklist

## Pre-Deployment Checklist

### Environment Variables
- [ ] `EXPO_PUBLIC_SUPABASE_URL` production value set
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` production value set
- [ ] All development variables removed/stripped
- [ ] No hardcoded secrets in code

### Supabase Setup
- [ ] Realtime replication enabled (posts, post_reactions, comments)
- [ ] Storage buckets configured (avatars, images)
- [ ] RLS policies enabled and tested
- [ ] Database indexes created
- [ ] Triggers installed
- [ ] Premium tables created
- [ ] Notification tables created
- [ ] Analytics table created (optional)

### Push Notifications
- [ ] Expo project ID configured
- [ ] Push notification credentials set (iOS & Android)
- [ ] Notification channels configured (Android)
- [ ] APNs key uploaded (iOS)
- [ ] FCM configured (Android)

### Build Configuration
- [ ] `eas.json` configured
- [ ] `app.json` version updated
- [ ] Bundle identifier set (iOS & Android)
- [ ] App name configured
- [ ] Icons and splash screens set
- [ ] Hermes engine enabled (Android)

### Performance
- [ ] Memoization applied (PostCard, ProfileCard)
- [ ] Image lazy loading enabled
- [ ] Bundle size analyzed
- [ ] No console.logs in production (except dev mode)
- [ ] Large lists use FlatList (when implemented)

### Analytics & Monitoring
- [ ] Analytics service integrated
- [ ] Error tracking configured (optional)
- [ ] Performance monitoring enabled (optional)
- [ ] User engagement tracking tested

### Testing
- [ ] All major flows tested manually
  - [ ] Registration & Login
  - [ ] Feed (create post, like, comment)
  - [ ] Match (swipe, match, message)
  - [ ] Profile (view, edit)
  - [ ] Notifications
  - [ ] Premium features
- [ ] Error handling tested (offline, network errors)
- [ ] Analytics events firing correctly
- [ ] Push notifications working

### Security
- [ ] Authentication flow secure
- [ ] API keys not exposed
- [ ] RLS policies prevent unauthorized access
- [ ] Input validation on all forms
- [ ] XSS prevention (no dangerouslySetInnerHTML)
- [ ] SQL injection prevention (Supabase ORM)

---

## Production Build Commands

### iOS
```bash
# Build for App Store
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios --profile production
```

### Android
```bash
# Build for Play Store
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android --profile production
```

---

## Post-Deployment Checklist

### Immediate (Day 1)
- [ ] Verify app is downloadable
- [ ] Test critical flows (signup, login, core features)
- [ ] Check analytics dashboard
- [ ] Monitor error rates
- [ ] Respond to initial user reviews

### Week 1
- [ ] Monitor crash rates
- [ ] Check performance metrics
- [ ] Review analytics data
- [ ] Address critical bugs
- [ ] A/B test if applicable

### Ongoing
- [ ] Weekly performance review
- [ ] Monthly security audit
- [ ] Feature usage analysis
- [ ] User feedback collection
- [ ] Regular updates and bug fixes

---

## Environment Variables Reference

### Production
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Development
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
```

---

## Rollback Plan

If critical issues are found:

1. **Immediate Actions**
   - Disable problematic features via database/config
   - Revert to previous version if necessary
   - Communicate with users

2. **Rollback Steps**
   ```bash
   # Revert to previous build
   eas build --platform ios --profile production --non-interactive

   # Or use emergency update
   eas update --branch production --message "Critical fix"
   ```

3. **Verification**
   - Test rollback build internally
   - Monitor error rates post-rollback
   - Communicate status to users

---

## Monitoring & Alerts

### Key Metrics to Monitor
- Crash rate (< 1% target)
- App load time (< 3 seconds target)
- API error rate (< 0.1% target)
- Daily active users
- Retention rate (Day 1, Day 7, Day 30)
- Conversion rate (premium upgrades)

### Alert Thresholds
- Crash rate > 2% → Critical alert
- Error rate > 1% → Warning alert
- API response time > 2s → Performance alert
- Server error rate (5xx) > 5% → Critical alert

---

## Troubleshooting Guide

### Build Failures
1. Check EAS logs
2. Verify environment variables
3. Check for TypeScript errors
4. Verify dependencies are compatible
5. Check bundle size limits

### Runtime Issues
1. Check Expo logs (Expo Log Viewer)
2. Review error tracking dashboard
3. Test on physical device (not simulator)
4. Check network connectivity
5. Verify Supabase connection

### Performance Issues
1. Use React DevTools Profiler
2. Check analytics for slow screens
3. Review bundle size
4. Optimize images and assets
5. Implement lazy loading where needed

---

## Contact & Support

- **Repository**: https://github.com/nadimokumuss/entrika-v1
- **Vercel URL**: https://entrika.vercel.app
- **Support Email**: support@entrika.com (placeholder)
- **Documentation**: CLAUDE.md

---

## Version History

### v1.0.0 (Current)
- Initial release
- Core features complete
- Premium features implemented
- Analytics and error handling in place

### Future Versions
- v1.1.0: Performance improvements, FlatList optimization
- v1.2.0: New features based on user feedback
- v2.0.0: Major update with new UI/UX
