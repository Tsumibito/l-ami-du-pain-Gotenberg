#!/bin/bash

# Test script for PDF API
# Usage: ./test-api.sh

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="${PDF_API_URL:-http://localhost:3001}"
API_TOKEN="${API_TOKEN:-your_secure_api_token_here_change_this}"

echo -e "${YELLOW}PDF API Test Script${NC}"
echo "API URL: $API_URL"
echo ""

# Test 1: Health check
echo -e "${YELLOW}Test 1: Health Check${NC}"
curl -s "$API_URL/health" | jq '.'
echo ""

# Test 2: Unauthorized request (no token)
echo -e "${YELLOW}Test 2: Unauthorized Request (should fail)${NC}"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X POST "$API_URL/api/pdf/avis" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'
echo ""

# Test 3: Generate Avis PDF
echo -e "${YELLOW}Test 3: Generate Avis PDF${NC}"
curl -X POST "$API_URL/api/pdf/avis" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d @examples/avis-example.json \
  --output test-avis.pdf

if [ -f test-avis.pdf ]; then
  SIZE=$(stat -f%z test-avis.pdf 2>/dev/null || stat -c%s test-avis.pdf 2>/dev/null)
  echo -e "${GREEN}✓ PDF generated: test-avis.pdf (${SIZE} bytes)${NC}"
  
  # Open PDF on macOS
  if [[ "$OSTYPE" == "darwin"* ]]; then
    open test-avis.pdf
  fi
else
  echo -e "${RED}✗ Failed to generate PDF${NC}"
fi
echo ""

# Test 4: Generate Summary PDF
echo -e "${YELLOW}Test 4: Generate Summary PDF${NC}"
curl -X POST "$API_URL/api/pdf/summary" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_TOKEN" \
  -d @examples/summary-example.json \
  --output test-summary.pdf

if [ -f test-summary.pdf ]; then
  SIZE=$(stat -f%z test-summary.pdf 2>/dev/null || stat -c%s test-summary.pdf 2>/dev/null)
  echo -e "${GREEN}✓ PDF generated: test-summary.pdf (${SIZE} bytes)${NC}"
  
  # Open PDF on macOS
  if [[ "$OSTYPE" == "darwin"* ]]; then
    open test-summary.pdf
  fi
else
  echo -e "${RED}✗ Failed to generate PDF${NC}"
fi
echo ""

echo -e "${GREEN}Tests completed!${NC}"
