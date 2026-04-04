#!/bin/bash
# Rails テスト実行スクリプト

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}================================${NC}"
echo -e "${YELLOW}Rails RSpec Test Suite${NC}"
echo -e "${YELLOW}================================${NC}"

# データベース準備
echo -e "${YELLOW}[1/3] Preparing test database...${NC}"
bundle exec rails db:create RAILS_ENV=test 2>/dev/null || true
bundle exec rails db:migrate RAILS_ENV=test

echo -e "${GREEN}✓ Database ready${NC}\n"

# すべてのテスト実行
echo -e "${YELLOW}[2/3] Running RSpec tests...${NC}"
if bundle exec rspec spec/requests/api_v1_dashboard_stats_issue_2_spec.rb; then
    echo -e "\n${GREEN}✓ All tests passed!${NC}\n"
else
    echo -e "\n${RED}✗ Some tests failed${NC}\n"
    exit 1
fi

# テスト統計
echo -e "${YELLOW}[3/3] Test Summary${NC}"
echo -e "${GREEN}✓ API Integration tests completed${NC}"
echo -e "${GREEN}✓ Issue #2: Dashboard Statistics tabが正常に動作することを確認${NC}"

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}Test suite completed successfully!${NC}"
echo -e "${GREEN}================================${NC}"
