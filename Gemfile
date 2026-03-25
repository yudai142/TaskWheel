source "https://rubygems.org"
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby "~> 3.2.0"

gem "rails", "~> 7.1.0"
gem "pg", "~> 1.1"
gem "puma", "~> 6.0"
gem "importmap-rails"
gem "turbo-rails"
gem "stimulus-rails"
gem "jbuilder"
gem "redis", "~> 5.0"
gem "bcrypt", "~> 3.1.7"
gem "image_processing", "~> 1.2"
gem "aws-sdk-s3", require: false
gem "rack-cors"


# API
gem "active_model_serializers"

# Datetime
gem "tzinfo-data"

# Dev & Test
group :development, :test do
  gem "debug", platforms: %i[mri mingw x64_mingw]
  gem "rspec-rails"
  gem "factory_bot_rails"
end

group :development do
  gem "web-console"
  gem "rack-mini-profiler"
end
