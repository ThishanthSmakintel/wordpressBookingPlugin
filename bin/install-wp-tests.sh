#!/usr/bin/env bash

if [ $# -lt 3 ]; then
	echo "usage: $0 <db-name> <db-user> <db-pass> [db-host] [wp-version]"
	exit 1
fi

DB_NAME=$1
DB_USER=$2
DB_PASS=$3
DB_HOST=${4-localhost}
WP_VERSION=${5-latest}

TMPDIR=${TMPDIR-/tmp}
WP_TESTS_DIR=${WP_TESTS_DIR-$TMPDIR/wordpress-tests-lib}
WP_CORE_DIR=${WP_CORE_DIR-$TMPDIR/wordpress/}

download() {
    if [ `which curl` ]; then
        curl -s "$1" > "$2";
    elif [ `which wget` ]; then
        wget -nv -O "$2" "$1"
    fi
}

install_wp() {
	if [ -d $WP_CORE_DIR ]; then
		return;
	fi
	mkdir -p $WP_CORE_DIR
	download https://wordpress.org/latest.tar.gz  $TMPDIR/wordpress.tar.gz
	tar --strip-components=1 -zxmf $TMPDIR/wordpress.tar.gz -C $WP_CORE_DIR
}

install_test_suite() {
	if [ ! -d $WP_TESTS_DIR ]; then
		mkdir -p $WP_TESTS_DIR
		svn co --quiet https://develop.svn.wordpress.org/trunk/tests/phpunit/includes/ $WP_TESTS_DIR/includes
		svn co --quiet https://develop.svn.wordpress.org/trunk/tests/phpunit/data/ $WP_TESTS_DIR/data
	fi

	if [ ! -f wp-tests-config.php ]; then
		download https://develop.svn.wordpress.org/trunk/wp-tests-config-sample.php "$WP_TESTS_DIR"/wp-tests-config.php
		sed -i "s/youremptytestdbnamehere/$DB_NAME/" "$WP_TESTS_DIR"/wp-tests-config.php
		sed -i "s/yourusernamehere/$DB_USER/" "$WP_TESTS_DIR"/wp-tests-config.php
		sed -i "s/yourpasswordhere/$DB_PASS/" "$WP_TESTS_DIR"/wp-tests-config.php
		sed -i "s|localhost|${DB_HOST}|" "$WP_TESTS_DIR"/wp-tests-config.php
	fi
}

install_db() {
	mysqladmin create $DB_NAME --user="$DB_USER" --password="$DB_PASS" 2>/dev/null || true
}

install_wp
install_test_suite
install_db