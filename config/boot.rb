#!/usr/bin/env ruby
# This file loads spring and staggers bootup. See `bin/spring` for an example of how this improves boot time.

ENV["BUNDLE_GEMFILE"] ||= File.expand_path("../Gemfile", __dir__)

require "bundler/setup" # Set up gems listed in a Gemfile
require "bundler/cli"

load Gem.activate_bin_path("rails", "rails", GemVersion.new(">= 0.a"))
