Prerequisites
===========

* A Linux distribution with the following applications installed
	* VLC 2.1+
	* NodeJS v4+
	* NPM v2+
	* MongoDB
* Apache, with DocumentRoot set to `path to drops/public`
	* You might need to configure Apache to actually show the front end properly

How to Run
===========

1. `npm install`
2. `npm start`
3. Go to `localhost` or the IP address/domain name for your computer!

Our Environment
===========

IEEE runs this on a Raspberry Pi 2 running Raspbian, with some components updated to version Jessie. We run it in the background by using `screen`, the NPM `forever` or `forever-service` modules.
