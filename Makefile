TESTS = test/*.test.js
TIMEOUT = 5000
MOCHA_OPTS =
REPORTER = tap
NPM_REGISTRY = "--registry=http://registry.cnpmjs.org"
NPM_INSTALL_PRODUCTION = PYTHON=`which python2.6` NODE_ENV=production npm install $(NPM_REGISTRY)
NPM_INSTALL_TEST = PYTHON=`which python2.6` NODE_ENV=test npm install $(NPM_REGISTRY)

install:
	@$(NPM_INSTALL_PRODUCTION)

install-test:
	@$(NPM_INSTALL_TEST)

test: install-test
	@NODE_ENV=test ./node_modules/mocha/bin/mocha \
		--reporter $(REPORTER) --timeout $(TIMEOUT) $(MOCHA_OPTS) $(TESTS)

test-cov:
	@$(MAKE) test REPORTER=dot MOCHA_OPTS='--require blanket'
	@$(MAKE) test REPORTER=html-cov > coverage.html MOCHA_OPTS='--require blanket'

clean:
	@rm -f coverage.html
	@rm -rf node_modules

autod: install-test
	@./node_modules/.bin/autod -w -e demo,assets,view
	@$(MAKE) install-test

.PHONY: install install-test test test-cov clean toast
