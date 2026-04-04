#!/bin/bash
# Quick test environment setup verification

echo "Checking Rails test environment setup..."

# Check if spec directory exists
if [ -d "spec" ]; then
    echo "✓ spec/ directory exists"
else
    echo "✗ spec/ directory not found"
    exit 1
fi

# Check if test files exist
if [ -f "spec/requests/api_v1_dashboard_stats_issue_2_spec.rb" ]; then
    echo "✓ API test file exists"
else
    echo "✗ API test file not found"
    exit 1
fi

# Check if factories exist
if [ -f "spec/factories/members.rb" ]; then
    echo "✓ Member factory exists"
else
    echo "✗ Member factory not found"
    exit 1
fi

if [ -f "spec/factories/works.rb" ]; then
    echo "✓ Work factory exists"
else
    echo "✗ Work factory not found"
    exit 1
fi

if [ -f "spec/factories/histories.rb" ]; then
    echo "✓ History factory exists"
else
    echo "✗ History factory not found"
    exit 1
fi

# Check if rails_helper exists
if [ -f "spec/rails_helper.rb" ]; then
    echo "✓ rails_helper.rb exists"
else
    echo "✗ rails_helper.rb not found"
    exit 1
fi

# Check if .rspec config exists
if [ -f ".rspec" ]; then
    echo "✓ .rspec config exists"
else
    echo "✗ .rspec config not found"
    exit 1
fi

echo ""
echo "All test environment files are in place!"
echo ""
echo "Next steps:"
echo "1. Run: docker-compose up -d"
echo "2. Run: docker-compose exec web bundle install"
echo "3. Run: docker-compose exec web rails db:create RAILS_ENV=test"
echo "4. Run: docker-compose exec web rails db:migrate RAILS_ENV=test"
echo "5. Run: docker-compose exec web bundle exec rspec spec/requests/api_v1_dashboard_stats_issue_2_spec.rb"
