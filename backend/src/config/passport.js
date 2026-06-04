const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { Strategy: LocalStrategy } = require('passport-local');
const bcrypt = require('bcryptjs');
const prisma = require('./prisma');

// Local Strategy
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.password) {
        return done(null, false, { message: 'Invalid credentials' });
      }
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return done(null, false, { message: 'Invalid credentials' });
      }
      if (user.isBanned) {
        return done(null, false, { message: 'Account has been banned' });
      }
      if (user.isSuspended && user.suspendedUntil > new Date()) {
        return done(null, false, { message: `Account suspended until ${user.suspendedUntil.toISOString()}` });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await prisma.user.findUnique({ where: { googleId: profile.id } });

        if (!user) {
          user = await prisma.user.findUnique({ where: { email: profile.emails[0].value } });
          if (user) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId: profile.id, avatar: profile.photos?.[0]?.value },
            });
          } else {
            user = await prisma.user.create({
              data: {
                email: profile.emails[0].value,
                name: profile.displayName,
                googleId: profile.id,
                avatar: profile.photos?.[0]?.value,
                role: 'USER',
              },
            });
          }
        }

        if (user.isBanned) {
          return done(null, false, { message: 'Account has been banned' });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));
}

module.exports = passport;
