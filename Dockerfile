# ===== 共通ベース =====
FROM ruby:3.2-alpine AS base

WORKDIR /app

RUN apk add --no-cache \
    build-base \
    postgresql-dev \
    nodejs \
    npm \
    yarn \
    git \
    yaml-dev \
    tzdata

COPY Gemfile Gemfile.lock ./

# ===== ローカル開発用 =====
FROM base AS development

RUN bundle install

COPY package.json package-lock.json ./
COPY . .

ENV RAILS_ENV=development \
    NODE_ENV=development \
    VITE_RUBY_SKIP_COMPATIBILITY_CHECK=true

EXPOSE 3000 5173

CMD ["/app/docker-entrypoint.sh"]

# ===== 本番ビルドステージ =====
FROM base AS builder

RUN bundle config set --local without 'development test' && \
    bundle install --jobs 4 --retry 3

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV RAILS_ENV=production \
    NODE_ENV=production \
    VITE_RUBY_SKIP_COMPATIBILITY_CHECK=true

RUN SECRET_KEY_BASE=placeholder bundle exec vite build

# ===== 本番用 =====
FROM ruby:3.2-alpine AS production

WORKDIR /app

RUN apk add --no-cache \
    postgresql-dev \
    nodejs \
    tzdata \
    curl

COPY --from=builder /usr/local/bundle /usr/local/bundle
COPY --from=builder /app /app

RUN mkdir -p tmp/pids tmp/cache log
RUN chmod +x /app/docker-entrypoint-prod.sh

ENV RAILS_ENV=production \
    NODE_ENV=production \
    RAILS_LOG_TO_STDOUT=true \
    RAILS_SERVE_STATIC_FILES=true \
    VITE_RUBY_SKIP_COMPATIBILITY_CHECK=true

EXPOSE 3000

CMD ["/app/docker-entrypoint-prod.sh"]
