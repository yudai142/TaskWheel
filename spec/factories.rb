# Load all factories
Dir[Rails.root.join('spec/factories/**/*.rb')].each { |f| require f }
