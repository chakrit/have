
BIN             = ./node_modules/.bin
TEST_OPTS       = --timeout 100 --slow 50 --reporter spec --globals __coverage__ --bail
WATCH_OPTS      = -q -e 'js' -w . -n exit -x

MAIN_FILE      := have.js
MAIN_FILE_COV  := have-cov.js
TEST_FILE      := test.js

default: test

clean:
	-rm $(MAIL_FILE_COV)
	-rm -Rf coverage
	-rm -Rf html-report

node_modules:
	npm install

default: test

test: node_modules
	@$(BIN)/mocha $(TEST_OPTS) $(TEST_FILE)
tdd: node_modules
	@$(BIN)/supervisor $(WATCH_OPTS) $(MAKE) test

html-report: $(MAIN_FILE_COV)
	@COVER=1 $(BIN)/mocha $(TEST_OPTS) --reporter mocha-istanbul $(TEST_FILE)
	@echo open html-report/index.html to view coverage report.

$(MAIN_FILE_COV): $(MAIN_FILE)
	$(BIN)/istanbul instrument --variable global.__coverage__ --output $(MAIN_FILE_COV) --no-compact $(MAIN_FILE)

.PHONY: test tdd clean

