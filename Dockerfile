# ===== Build Stage: gem/npm install + Vite assets build =====
FROM ruby:3.2-alpine AS builder

WORKDIR /app

RUN apk add --no-cache \
    build-base \
    postgresql-dev \
    nodejs \
    npm \
    git \
    yaml-dev \
    tzdata

# Install Ruby gems (development/test を除外)
COPY Gemfile Gemfile.lock ./
RUN bundle config set --local without 'development test' && \
    bundle install --jobs 4 --retry 3

# Install Node packages
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build Vite frontend assets for production
ENV RAILS_ENV=production \
    NODE_ENV=production
RUN SECRET_KEY_BASE=placeholder bundle exec vite build

# ===== Production Stage =====
FROM ruby:3.2-alpine

WORKDIR /app

# Runtime dependencies only
RUN apk add --no-cache \
    postgresql-dev \
    nodejs \
    tzdata \
    curl

# Copy installed gems from builder
COPY --from=builder /usr/local/bundle /usr/local/bundle

# Copy built application (including compiled public/vite/ assets)
COPY --from=builder /app /app

# Create necessary directories
RUN mkdir -p tmp/pids tmp/cache log

RUN chmod +x /app/docker-entrypoint-prod.sh

ENV RAILS_ENV=production \
    NODE_ENV=production \
    RAILS_LOG_TO_STDOUT=true \
    RAILS_SERVE_STATIC_FILES=true

EXPOSE 3000

CMD ["/app/docker-entrypoint-prod.sh"]
