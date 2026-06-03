import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import crypto from 'crypto';
import { User } from '../models/User';

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'mock_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_secret',
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        if (!profile.emails || profile.emails.length === 0) {
          return done(new Error('No email found from Google'), false);
        }

        const email = profile.emails[0].value;
        let user = await User.findOne({ email });

        if (!user) {
          // Creer usuario automáticamente usando login social si no existe
          user = await User.create({
            name: profile.displayName || email.split('@')[0],
            email,
            password: `oauth_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`, // Password required by schema but useless for OAuth
            role: 'user',
          });
        }

        return done(null, user as any);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID || 'mock_id',
      clientSecret: process.env.FACEBOOK_APP_SECRET || 'mock_secret',
      callbackURL: '/api/auth/facebook/callback',
      profileFields: ['id', 'displayName', 'emails'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        if (!profile.emails || profile.emails.length === 0) {
          return done(new Error('No email found from Facebook'), false);
        }

        const email = profile.emails[0].value;
        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            name: profile.displayName || email.split('@')[0],
            email,
            password: `oauth_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`,
            role: 'user',
          });
        }

        return done(null, user as any);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

export default passport;
