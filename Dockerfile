FROM ruby:3.2-alpine

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

COPY Gemfile* ./

RUN bundle install

COPY package.json ./

COPY . .

EXPOSE 3000

CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0"]
