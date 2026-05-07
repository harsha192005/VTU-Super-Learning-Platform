import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { serveStatic } from 'hono/cloudflare-workers'

import authRoutes from './routes/auth'
import branchRoutes from './routes/branches'
import subjectRoutes from './routes/subjects'
import resourceRoutes from './routes/resources'
import quizRoutes from './routes/quiz'
import aiRoutes from './routes/ai'
import userRoutes from './routes/users'
import gamificationRoutes from './routes/gamification'
import placementRoutes from './routes/placement'
import studyPlannerRoutes from './routes/study-planner'
import notificationRoutes from './routes/notifications'
import analyticsRoutes from './routes/analytics'
import announcementRoutes from './routes/announcements'
import dailyChallengeRoutes from './routes/daily-challenge'
import examRoutes from './routes/exams'

type Bindings = {
  DB: D1Database
  JWT_SECRET?: string
  OPENAI_API_KEY?: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', logger())
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// API Routes
app.route('/api/auth', authRoutes)
app.route('/api/branches', branchRoutes)
app.route('/api/subjects', subjectRoutes)
app.route('/api/resources', resourceRoutes)
app.route('/api/quiz', quizRoutes)
app.route('/api/ai', aiRoutes)
app.route('/api/users', userRoutes)
app.route('/api/gamification', gamificationRoutes)
app.route('/api/placement', placementRoutes)
app.route('/api/planner', studyPlannerRoutes)
app.route('/api/notifications', notificationRoutes)
app.route('/api/analytics', analyticsRoutes)
app.route('/api/announcements', announcementRoutes)
app.route('/api/challenge', dailyChallengeRoutes)
app.route('/api/exams', examRoutes)

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', platform: 'VTU Super Learning Platform', version: '1.0.0' }))

// Serve static files
app.use('/static/*', serveStatic({ root: './' }))
app.use('/manifest.json', serveStatic({ root: './' }))
app.use('/sw.js', serveStatic({ root: './' }))
app.use('/icons/*', serveStatic({ root: './' }))

// SPA fallback - serve index.html for all non-API routes
app.get('*', serveStatic({ root: './', path: 'index.html' }))

export default app
