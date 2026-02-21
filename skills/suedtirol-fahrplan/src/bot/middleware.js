/**
 * Südtirol Fahrplan - Bot Middleware
 * Session and logging middleware for Telegram bot
 */

/**
 * Logger middleware - logs all incoming messages
 */
async function loggerMiddleware(ctx, next) {
  const start = Date.now();
  
  // Log user and message info
  const user = ctx.from;
  const message = ctx.message || ctx.callbackQuery;
  
  if (message) {
    const text = ctx.message?.text || ctx.callbackQuery?.data || '[no text]';
    console.log(
      `[${new Date().toISOString()}] ` +
      `User: ${user?.id} (${user?.username || 'no-username'}) | ` +
      `Message: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`
    );
  }
  
  try {
    await next();
    
    // Log response time
    const ms = Date.now() - start;
    if (ms > 1000) {
      console.log(`⚠️ Slow response: ${ms}ms`);
    }
  } catch (error) {
    console.error('Middleware error:', error);
    throw error;
  }
}

/**
 * Error handling middleware
 */
async function errorMiddleware(ctx, next) {
  try {
    await next();
  } catch (error) {
    console.error('Error in update handler:', error);
    
    // Try to notify user
    try {
      await ctx.reply('❌ Ein Fehler ist aufgetreten. Bitte versuche es später erneut.');
    } catch (replyError) {
      console.error('Failed to send error message:', replyError);
    }
  }
}

/**
 * Session middleware (simple in-memory)
 * Note: Telegraf has built-in session, this is for reference
 */
function createSessionMiddleware() {
  const sessions = new Map();
  
  return async (ctx, next) => {
    const userId = ctx.from?.id;
    
    if (userId) {
      // Get or create session
      if (!sessions.has(userId)) {
        sessions.set(userId, {});
      }
      ctx.session = sessions.get(userId);
    }
    
    await next();
    
    // Cleanup empty sessions
    if (userId && ctx.session && Object.keys(ctx.session).length === 0) {
      sessions.delete(userId);
    }
  };
}

/**
 * Rate limiting middleware
 * Simple rate limiter to prevent abuse
 */
function createRateLimitMiddleware(limit = 30, windowMs = 60000) {
  const requests = new Map();
  
  return async (ctx, next) => {
    const userId = ctx.from?.id;
    
    if (!userId) {
      await next();
      return;
    }
    
    const now = Date.now();
    const userRequests = requests.get(userId) || [];
    
    // Clean old requests
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= limit) {
      await ctx.reply('⏳ Bitte warte einen Moment vor der nächsten Anfrage.');
      return;
    }
    
    validRequests.push(now);
    requests.set(userId, validRequests);
    
    await next();
  };
}

/**
 * Admin check middleware
 */
function createAdminMiddleware(adminUserIds) {
  return async (ctx, next) => {
    const userId = ctx.from?.id;
    
    if (!adminUserIds.includes(userId)) {
      await ctx.reply('⛔ Dieser Befehl ist nur für Administratoren.');
      return;
    }
    
    await next();
  };
}

// ==================== EXPORTS ====================

module.exports = {
  loggerMiddleware,
  errorMiddleware,
  createSessionMiddleware,
  createRateLimitMiddleware,
  createAdminMiddleware
};
