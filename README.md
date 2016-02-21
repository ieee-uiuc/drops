# Prerequisites

* A Linux distribution with the following applications installed
	* VLC 2.1+
	* NodeJS v4+
	* NPM v2+
	* MongoDB
* Apache, with DocumentRoot set to `path to drops/public`
	* You might need to configure Apache to actually show the front end properly

# How to Run

1. Run `npm install`
2. Fill out the `config.js` file with your deployment parameters
3. Run `gulp` if you have Gulp installed globally, or `npm run deploy`
4. Run `npm start`
5. Go to `localhost` or the IP address/domain name for your computer!

# Our Environment

IEEE runs this on a Raspberry Pi 2 running Raspbian, with some components updated to version Jessie. Further, the `forever` module is used to run `app.js` as a service. 

# Notes

Since this process creates a child VLC process, and for some reason VLC cannot be run with `sudo`, the WebSocket port number must be >1024. To make this easier to set up, it might be better to set up a WebSocket proxy from Port 80/443 to the chosen port in NginX/Apache.
