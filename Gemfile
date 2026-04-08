# frozen_string_literal: true

source 'https://rubygems.org'
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby '~> 3.2.0'

gem 'aws-sdk-s3', require: false
gem 'bcrypt', '~> 3.1.7'
gem 'image_processing', '~> 1.2'
gem 'importmap-rails'
gem 'jbuilder'
gem 'pg', '~> 1.1'
gem 'puma', '~> 6.0'
gem 'rack-cors'
gem 'rails', '~> 7.1.0'
gem 'redis', '~> 5.0'
gem 'stimulus-rails'
gem 'turbo-rails'

# 認証
gem 'devise'
gem 'omniauth-google-oauth2'
gem 'omniauth-rails_csrf_protection'

# API
gem 'active_model_serializers'

# Datetime
gem 'tzinfo-data'

# Dev & Test
group :development, :test do
  gem 'database_cleaner-active_record'
  gem 'debug', platforms: %i[mri mingw x64_mingw]
  gem 'factory_bot_rails'
  gem 'faker'
  gem 'rspec-rails'
  gem 'rubocop', require: false
  gem 'rubocop-factory_bot', require: false
  gem 'rubocop-rails', require: false
  gem 'rubocop-rspec', require: false
end

group :development do
  gem 'rack-mini-profiler'
  gem 'web-console'
end

gem 'vite_rails', '~> 3.10'
